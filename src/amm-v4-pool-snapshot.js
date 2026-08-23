import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { durableAtomicWrite } from "./durable-file.js";
import { IndexStore } from "./store.js";
import { assertSnapshotAcquisitionAllowed } from "./snapshot-cli-policy.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { createProgramAddress, decodeBase58Address } from "./solana-pda.js";

export const RAYDIUM_AMM_V4_PROGRAM = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
export const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function bytes(account, label) { if (!Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`${label} must use base64 encoding`); const data = Buffer.from(account.data[0], "base64"); if (data.toString("base64").replace(/=+$/, "") !== account.data[0].replace(/=+$/, "")) throw new Error(`${label} has invalid base64 data`); return data; }
function hash(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function u64(data, offset) { return data.readBigUInt64LE(offset).toString(); }
function fraction(data, numeratorOffset, denominatorOffset, label) { const numerator = data.readBigUInt64LE(numeratorOffset), denominator = data.readBigUInt64LE(denominatorOffset); if (denominator === 0n || numerator >= denominator) throw new Error(`AMM v4 ${label} is invalid`); return { numeratorRaw: numerator.toString(), denominatorRaw: denominator.toString() }; }
function exact(value, label, positive = false) { if (typeof value !== "string" || !/^\d+$/.test(value) || positive && value === "0") throw new Error(`${label} must be an exact ${positive ? "positive " : ""}integer string`); const parsed = BigInt(value); if (parsed > 18_446_744_073_709_551_615n) throw new Error(`${label} exceeds u64`); return parsed; }
function ceilDiv(numerator, denominator) { return (numerator + denominator - 1n) / denominator; }

export function decodeAmmV4PoolAccount(address, account) {
  if (account?.owner !== RAYDIUM_AMM_V4_PROGRAM) throw new Error(`AMM v4 pool ${address} has unexpected owner`);
  const data = bytes(account, `AMM v4 pool ${address}`);
  if (data.length !== 752) throw new Error(`AMM v4 pool ${address} has invalid AmmInfo length`);
  const status = data.readBigUInt64LE(0), nonce = data.readBigUInt64LE(8), state = data.readBigUInt64LE(48), resetFlag = data.readBigUInt64LE(56), coinDecimals = data.readBigUInt64LE(32), pcDecimals = data.readBigUInt64LE(40);
  if (status < 1n || status > 7n || nonce > 255n || state > 6n || resetFlag > 1n || coinDecimals > 255n || pcDecimals > 255n) throw new Error(`AMM v4 pool ${address} has invalid enum or decimal state`);
  const tokenMint0 = base58(data.subarray(400, 432)), tokenMint1 = base58(data.subarray(432, 464)), tokenVault0 = base58(data.subarray(336, 368)), tokenVault1 = base58(data.subarray(368, 400));
  if (tokenMint0 === tokenMint1 || tokenVault0 === tokenVault1) throw new Error(`AMM v4 pool ${address} has ambiguous mint or vault identity`);
  return { address, programId: RAYDIUM_AMM_V4_PROGRAM, status: Number(status), nonce: Number(nonce), state: Number(state), resetFlag: Number(resetFlag), mintDecimals0: Number(coinDecimals), mintDecimals1: Number(pcDecimals), tokenVault0, tokenVault1, tokenMint0, tokenMint1, lpMint: base58(data.subarray(464, 496)), openOrders: base58(data.subarray(496, 528)), market: base58(data.subarray(528, 560)), marketProgram: base58(data.subarray(560, 592)), targetOrders: base58(data.subarray(592, 624)), ammOwner: base58(data.subarray(688, 720)), lpAmountRaw: u64(data, 720), openTime: u64(data, 224), needTakePnl0Raw: u64(data, 192), needTakePnl1Raw: u64(data, 200), minimumSeparation: fraction(data, 128, 136, "minimum separation"), tradeFee: fraction(data, 144, 152, "trade fee"), pnl: fraction(data, 160, 168, "PnL fraction"), swapFee: fraction(data, 176, 184, "swap fee"), rawPayloadHash: hash(data) };
}

export function decodeOpenBookOpenOrdersAccount(address, account, expected) {
  if (account?.owner !== expected.marketProgram) throw new Error(`OpenBook open orders ${address} has unexpected owner`);
  const data = bytes(account, `OpenBook open orders ${address}`);
  if (data.length !== 3_228 || !data.subarray(0, 5).equals(Buffer.from("serum")) || !data.subarray(-7).equals(Buffer.from("padding"))) throw new Error(`OpenBook open orders ${address} has invalid layout`);
  const flags = data.readBigUInt64LE(5), market = base58(data.subarray(13, 45)), owner = base58(data.subarray(45, 77));
  if (flags !== 5n || market !== expected.market || owner !== expected.poolAuthority) throw new Error(`OpenBook open orders ${address} identity mismatch`);
  const baseTokenFreeRaw = u64(data, 77), baseTokenTotalRaw = u64(data, 85), quoteTokenFreeRaw = u64(data, 93), quoteTokenTotalRaw = u64(data, 101);
  if (BigInt(baseTokenFreeRaw) > BigInt(baseTokenTotalRaw) || BigInt(quoteTokenFreeRaw) > BigInt(quoteTokenTotalRaw)) throw new Error(`OpenBook open orders ${address} balance mismatch`);
  return { address, market, owner, accountFlagsRaw: flags.toString(), baseTokenFreeRaw, baseTokenTotalRaw, quoteTokenFreeRaw, quoteTokenTotalRaw, rawPayloadHash: hash(data) };
}

export function decodeOpenBookMarketAccount(address, account, expected) {
  if (account?.owner !== expected.marketProgram) throw new Error(`OpenBook market ${address} has unexpected owner`);
  const data = bytes(account, `OpenBook market ${address}`);
  if (data.length !== 388 || !data.subarray(0, 5).equals(Buffer.from("serum")) || !data.subarray(-7).equals(Buffer.from("padding"))) throw new Error(`OpenBook market ${address} has invalid layout`);
  const flags = data.readBigUInt64LE(5), ownAddress = base58(data.subarray(13, 45)), vaultSignerNonce = data.readBigUInt64LE(45), tokenMint0 = base58(data.subarray(53, 85)), tokenMint1 = base58(data.subarray(85, 117)), tokenVault0 = base58(data.subarray(117, 149)), tokenVault1 = base58(data.subarray(165, 197)), requestQueue = base58(data.subarray(221, 253)), eventQueue = base58(data.subarray(253, 285)), bids = base58(data.subarray(285, 317)), asks = base58(data.subarray(317, 349)), coinLotSizeRaw = u64(data, 349), pcLotSizeRaw = u64(data, 357), feeRateBasisPointsRaw = u64(data, 365);
  const nonce = Buffer.alloc(8); nonce.writeBigUInt64LE(vaultSignerNonce); let vaultSigner; try { vaultSigner = createProgramAddress(expected.marketProgram, [decodeBase58Address(address), nonce]); } catch { throw new Error(`OpenBook market ${address} has invalid vault signer nonce`); }
  if (flags !== 3n || ownAddress !== address || tokenMint0 !== expected.tokenMint0 || tokenMint1 !== expected.tokenMint1 || tokenVault0 === tokenVault1 || [requestQueue, eventQueue, bids, asks].some((value) => value === address) || coinLotSizeRaw === "0" || pcLotSizeRaw === "0" || BigInt(feeRateBasisPointsRaw) > 10_000n) throw new Error(`OpenBook market ${address} identity mismatch`);
  return { address, accountFlagsRaw: flags.toString(), vaultSignerNonceRaw: vaultSignerNonce.toString(), vaultSigner, tokenMint0, tokenMint1, tokenVault0, tokenVault1, requestQueue, eventQueue, bids, asks, coinLotSizeRaw, pcLotSizeRaw, feeRateBasisPointsRaw, rawPayloadHash: hash(data) };
}

export function quoteAmmV4SnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn, now = Date.now(), staleAfterMs = 60_000 }) {
  const amount = exact(amountIn, "AMM v4 amountIn", true), pool = snapshot?.pools?.find((row) => row.address === poolAddress);
  if (snapshot?.type !== "raydium_amm_v4_pool_snapshot" || snapshot.commitment !== "finalized" || !Number.isSafeInteger(snapshot.stateSlot) || !Number.isSafeInteger(snapshot.openOrdersSlot) || !Number.isSafeInteger(snapshot.marketSlot) || !Number.isSafeInteger(snapshot.balanceSlot) || snapshot.stateSlot > snapshot.openOrdersSlot || snapshot.openOrdersSlot > snapshot.marketSlot || snapshot.marketSlot > snapshot.balanceSlot || !pool || pool.openOrdersSlot !== snapshot.openOrdersSlot || pool.marketSlot !== snapshot.marketSlot) throw new Error("AMM v4 quote requires a finalized coherent snapshot");
  const observedAt = parseCanonicalUtcTimestamp(snapshot.observedAt), ageMs = observedAt == null ? null : now - observedAt;
  if (ageMs == null || ageMs < 0 || ageMs > staleAfterMs) throw new Error("AMM v4 snapshot is stale or future-dated");
  const orders = pool.openOrdersState;
  if (pool.programId !== RAYDIUM_AMM_V4_PROGRAM || orders?.address !== pool.openOrders || orders?.market !== pool.market || orders?.owner !== pool.poolAuthority || orders?.accountFlagsRaw !== "5") throw new Error("AMM v4 OpenOrders quote evidence is invalid");
  const vault0 = exact(pool.vault0AmountRaw, "AMM v4 vault0"), vault1 = exact(pool.vault1AmountRaw, "AMM v4 vault1"), orders0 = exact(orders.baseTokenTotalRaw, "AMM v4 OpenOrders base total"), orders1 = exact(orders.quoteTokenTotalRaw, "AMM v4 OpenOrders quote total"), pnl0 = exact(pool.needTakePnl0Raw, "AMM v4 pending base PnL"), pnl1 = exact(pool.needTakePnl1Raw, "AMM v4 pending quote PnL");
  if (pnl0 > vault0 + orders0 || pnl1 > vault1 + orders1 || exact(pool.reserve0Raw, "AMM v4 reserve0", true) !== vault0 + orders0 - pnl0 || exact(pool.reserve1Raw, "AMM v4 reserve1", true) !== vault1 + orders1 - pnl1) throw new Error("AMM v4 reserve quote evidence is inconsistent");
  if (![5, 6].includes(pool.status) || exact(pool.openTime, "AMM v4 open time") * 1_000n > BigInt(now)) throw new Error("AMM v4 swaps are disabled or not open");
  const zeroForOne = inputMint === pool.tokenMint0 ? true : inputMint === pool.tokenMint1 ? false : null;
  if (zeroForOne == null) throw new Error("AMM v4 input mint does not belong to pool");
  const reserve0 = BigInt(pool.reserve0Raw), reserve1 = BigInt(pool.reserve1Raw), feeNumerator = exact(pool.swapFee?.numeratorRaw, "AMM v4 swap fee numerator"), feeDenominator = exact(pool.swapFee?.denominatorRaw, "AMM v4 swap fee denominator", true);
  if (feeNumerator >= feeDenominator) throw new Error("AMM v4 swap fee is invalid");
  const fee = ceilDiv(amount * feeNumerator, feeDenominator);
  if (fee >= amount) throw new Error("AMM v4 input is consumed by fees");
  const netInput = amount - fee, inputReserve = zeroForOne ? reserve0 : reserve1, outputReserve = zeroForOne ? reserve1 : reserve0, output = netInput * outputReserve / (inputReserve + netInput);
  if (output <= 0n || output >= outputReserve) throw new Error("AMM v4 quote has insufficient output liquidity");
  return { schemaVersion: 1, protocol: "raydium-amm-v4", status: "quoted", executable: false, safeForAutomation: false, pool: pool.address, inputMint, outputMint: zeroForOne ? pool.tokenMint1 : pool.tokenMint0, amountInRaw: amount.toString(), amountOutRaw: output.toString(), swapFeeRaw: fee.toString(), inputReserveRaw: inputReserve.toString(), outputReserveRaw: outputReserve.toString(), stateSlot: snapshot.stateSlot, openOrdersSlot: snapshot.openOrdersSlot, marketSlot: snapshot.marketSlot, balanceSlot: snapshot.balanceSlot, observedAt: snapshot.observedAt, reserveEvidence: "vault_plus_open_orders_total_minus_pending_pnl", missing: ["unsigned_transaction_construction", "local_simulation", "external_signer_approval", "landed_transaction_confirmation"] };
}

function parsedVault(account, expectedMint, label) {
  if (account?.owner !== SPL_TOKEN_PROGRAM) throw new Error(`${label} token program mismatch`);
  const info = account?.data?.parsed?.info;
  if (info?.mint !== expectedMint || typeof info.owner !== "string" || !info.owner || !/^\d+$/.test(info?.tokenAmount?.amount ?? "") || !Number.isInteger(info?.tokenAmount?.decimals) || info.tokenAmount.decimals < 0 || info.tokenAmount.decimals > 255) throw new Error(`${label} identity mismatch`);
  return { amountRaw: info.tokenAmount.amount, decimals: info.tokenAmount.decimals, authority: info.owner };
}

export async function createAmmV4PoolSnapshot({ client, pools, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(pools) || !pools.length || new Set(pools).size !== pools.length || pools.some((pool) => typeof pool !== "string" || !pool)) throw new Error("AMM v4 pools must be a non-empty unique address array");
  const stateResponse = await getMultipleAccountsBatched(client, pools, { commitment: "finalized", encoding: "base64" }, { label: "AMM v4 pool" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateSlot < 0 || stateResponse.value?.length !== pools.length) throw new Error("invalid AMM v4 pool account response");
  const decoded = pools.map((address, index) => decodeAmmV4PoolAccount(address, stateResponse.value[index]));
  const openOrdersResponse = await getMultipleAccountsBatched(client, decoded.map((row) => row.openOrders), { commitment: "finalized", encoding: "base64", minContextSlot: stateSlot }, { label: "AMM v4 OpenBook open orders" }), openOrdersSlot = openOrdersResponse?.context?.slot;
  if (!Number.isSafeInteger(openOrdersSlot) || openOrdersSlot < stateSlot || openOrdersResponse.value?.length !== decoded.length) throw new Error("invalid AMM v4 OpenBook open orders response");
  const markets = [...new Set(decoded.map((row) => row.market))], marketResponse = await getMultipleAccountsBatched(client, markets, { commitment: "finalized", encoding: "base64", minContextSlot: openOrdersSlot }, { label: "AMM v4 OpenBook market" }), marketSlot = marketResponse?.context?.slot;
  if (!Number.isSafeInteger(marketSlot) || marketSlot < openOrdersSlot || marketResponse.value?.length !== markets.length) throw new Error("invalid AMM v4 OpenBook market response");
  const marketAccounts = new Map(markets.map((address, index) => [address, marketResponse.value[index]])), vaultResponse = await getMultipleAccountsBatched(client, decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]), { commitment: "finalized", encoding: "jsonParsed", minContextSlot: marketSlot }, { label: "AMM v4 vault" }), balanceSlot = vaultResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < marketSlot || vaultResponse.value?.length !== decoded.length * 2) throw new Error("invalid AMM v4 vault response");
  decoded.forEach((row, index) => { const vault0 = parsedVault(vaultResponse.value[index * 2], row.tokenMint0, `AMM v4 pool ${row.address} vault 0`), vault1 = parsedVault(vaultResponse.value[index * 2 + 1], row.tokenMint1, `AMM v4 pool ${row.address} vault 1`); if (vault0.decimals !== row.mintDecimals0 || vault1.decimals !== row.mintDecimals1 || vault0.authority !== vault1.authority) throw new Error(`AMM v4 pool ${row.address} vault evidence mismatch`); row.vault0AmountRaw = vault0.amountRaw; row.vault1AmountRaw = vault1.amountRaw; row.poolAuthority = vault0.authority; const openOrders = decodeOpenBookOpenOrdersAccount(row.openOrders, openOrdersResponse.value[index], row), market = decodeOpenBookMarketAccount(row.market, marketAccounts.get(row.market), row), reserve0 = BigInt(row.vault0AmountRaw) + BigInt(openOrders.baseTokenTotalRaw), reserve1 = BigInt(row.vault1AmountRaw) + BigInt(openOrders.quoteTokenTotalRaw); if (BigInt(row.needTakePnl0Raw) > reserve0 || BigInt(row.needTakePnl1Raw) > reserve1) throw new Error(`AMM v4 pool ${row.address} pending PnL exceeds total reserves`); row.openOrdersState = openOrders; row.openOrdersSlot = openOrdersSlot; row.marketState = market; row.marketSlot = marketSlot; row.reserve0Raw = (reserve0 - BigInt(row.needTakePnl0Raw)).toString(); row.reserve1Raw = (reserve1 - BigInt(row.needTakePnl1Raw)).toString(); });
  return { schemaVersion: 1, type: "raydium_amm_v4_pool_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, openOrdersSlot, marketSlot, balanceSlot, observedAt, pools: decoded };
}

async function main() {
  const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load();
  const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only");
  assertSnapshotAcquisitionAllowed(store, { artifactOnly, requested });
  const pools = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "raydium-amm-v4").map(([address]) => address);
  if (!pools.length) throw new Error("no Raydium AMM v4 pools supplied or discovered");
  const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected);
  const snapshot = await createAmmV4PoolSnapshot({ client, pools, genesisHash });
  if (!artifactOnly) { store.applyAmmV4PoolSnapshot(snapshot); await store.save(); }
  await durableAtomicWrite(config.ammV4PoolSnapshotFile, `${JSON.stringify(snapshot)}\n`);
  console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, openOrdersSlot: snapshot.openOrdersSlot, marketSlot: snapshot.marketSlot, balanceSlot: snapshot.balanceSlot, pools: snapshot.pools.length, artifactOnly }));
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
