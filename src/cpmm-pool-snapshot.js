import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { IndexStore } from "./store.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";
import { acquirePoolMintEvidence, bindPoolMintEvidence, POOL_MINT_EVIDENCE_CONSTANTS, validateBoundPoolMintEvidence } from "./pool-mint-evidence.js";
import { calculateTransferFeeIncludedAmount } from "./token-2022-transfer-fee.js";

export const RAYDIUM_CPMM_PROGRAM = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";
export const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const POOL_DISCRIMINATOR = crypto.createHash("sha256").update("account:PoolState").digest().subarray(0, 8);
const CONFIG_DISCRIMINATOR = crypto.createHash("sha256").update("account:AmmConfig").digest().subarray(0, 8);
const FEE_DENOMINATOR = 1_000_000n;

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function bytes(account, label) { if (!Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`${label} must use base64 encoding`); return Buffer.from(account.data[0], "base64"); }
function hash(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function u64(data, offset) { return data.readBigUInt64LE(offset).toString(); }
function exact(value, label, positive = false) { if (typeof value !== "string" || !/^\d+$/.test(value) || (positive && value === "0")) throw new Error(`${label} must be an exact ${positive ? "positive " : ""}integer string`); const parsed = BigInt(value); if (parsed > 18_446_744_073_709_551_615n) throw new Error(`${label} exceeds u64`); return parsed; }
function checkedSubtract(value, deductions, label) { const total = deductions.reduce((sum, amount) => sum + amount, 0n); if (total > value) throw new Error(`${label} accrued fees exceed vault balance`); return value - total; }

export function decodeCpmmPoolAccount(address, account) {
  if (account?.owner !== RAYDIUM_CPMM_PROGRAM) throw new Error(`CPMM pool ${address} has unexpected owner`);
  const data = bytes(account, `CPMM pool ${address}`);
  if (data.length !== 637 || !data.subarray(0, 8).equals(POOL_DISCRIMINATOR)) throw new Error(`CPMM pool ${address} has invalid PoolState data`);
  const creatorFeeOn = data[389], enableCreatorFee = data[390];
  if (creatorFeeOn > 2 || enableCreatorFee > 1) throw new Error(`CPMM pool ${address} has invalid creator fee mode`);
  return {
    address, programId: RAYDIUM_CPMM_PROGRAM, ammConfig: base58(data.subarray(8, 40)), poolCreator: base58(data.subarray(40, 72)), tokenVault0: base58(data.subarray(72, 104)), tokenVault1: base58(data.subarray(104, 136)), lpMint: base58(data.subarray(136, 168)), tokenMint0: base58(data.subarray(168, 200)), tokenMint1: base58(data.subarray(200, 232)), tokenProgram0: base58(data.subarray(232, 264)), tokenProgram1: base58(data.subarray(264, 296)), observationKey: base58(data.subarray(296, 328)), authBump: data[328], status: data[329], lpMintDecimals: data[330], mintDecimals0: data[331], mintDecimals1: data[332], lpSupplyRaw: u64(data, 333), protocolFeesToken0Raw: u64(data, 341), protocolFeesToken1Raw: u64(data, 349), fundFeesToken0Raw: u64(data, 357), fundFeesToken1Raw: u64(data, 365), openTime: u64(data, 373), recentEpoch: u64(data, 381), creatorFeeOn, enableCreatorFee: enableCreatorFee === 1, creatorFeesToken0Raw: u64(data, 397), creatorFeesToken1Raw: u64(data, 405), rawPayloadHash: hash(data),
  };
}

export function decodeCpmmAmmConfigAccount(address, account) {
  if (account?.owner !== RAYDIUM_CPMM_PROGRAM) throw new Error(`CPMM AmmConfig ${address} has unexpected owner`);
  const data = bytes(account, `CPMM AmmConfig ${address}`);
  if (data.length !== 236 || !data.subarray(0, 8).equals(CONFIG_DISCRIMINATOR)) throw new Error(`CPMM AmmConfig ${address} has invalid data`);
  const rates = [data.readBigUInt64LE(12), data.readBigUInt64LE(20), data.readBigUInt64LE(28), data.readBigUInt64LE(108)];
  if (data[9] > 1 || rates.some((rate) => rate > FEE_DENOMINATOR) || rates[0] + rates[3] >= FEE_DENOMINATOR || rates[1] + rates[2] > FEE_DENOMINATOR) throw new Error(`CPMM AmmConfig ${address} has invalid fee configuration`);
  return { address, bump: data[8], disableCreatePool: data[9] === 1, index: data.readUInt16LE(10), tradeFeeRate: rates[0].toString(), protocolFeeRate: rates[1].toString(), fundFeeRate: rates[2].toString(), createPoolFeeRaw: u64(data, 36), protocolOwner: base58(data.subarray(44, 76)), fundOwner: base58(data.subarray(76, 108)), creatorFeeRate: rates[3].toString(), rawPayloadHash: hash(data) };
}

function parsedVault(account, expectedMint, expectedProgram, label) {
  if (account?.owner !== expectedProgram) throw new Error(`${label} token program mismatch`);
  const info = account?.data?.parsed?.info;
  if (info?.mint !== expectedMint || !/^\d+$/.test(info?.tokenAmount?.amount ?? "") || !Number.isInteger(info?.tokenAmount?.decimals)) throw new Error(`${label} identity mismatch`);
  return { amountRaw: info.tokenAmount.amount, decimals: info.tokenAmount.decimals };
}

export async function createCpmmPoolSnapshot({ client, pools, automaticMintEvidence = false, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(pools) || !pools.length || new Set(pools).size !== pools.length) throw new Error("CPMM pools must be a non-empty unique array");
  const stateResponse = await getMultipleAccountsBatched(client, pools, { commitment: "finalized", encoding: "base64" }, { label: "CPMM pool" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateResponse.value?.length !== pools.length) throw new Error("invalid CPMM pool account response");
  const decoded = pools.map((address, index) => decodeCpmmPoolAccount(address, stateResponse.value[index])), configs = [...new Set(decoded.map((row) => row.ammConfig))];
  const configResponse = await getMultipleAccountsBatched(client, configs, { commitment: "finalized", encoding: "base64", minContextSlot: stateSlot }, { label: "CPMM AmmConfig" }), configSlot = configResponse?.context?.slot;
  if (!Number.isSafeInteger(configSlot) || configSlot < stateSlot || configResponse.value?.length !== configs.length) throw new Error("invalid CPMM AmmConfig response");
  const byConfig = new Map(configs.map((address, index) => [address, decodeCpmmAmmConfigAccount(address, configResponse.value[index])]));
  const vaultResponse = await getMultipleAccountsBatched(client, decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]), { commitment: "finalized", encoding: "jsonParsed", minContextSlot: configSlot }, { label: "CPMM vault" }), balanceSlot = vaultResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < configSlot || vaultResponse.value?.length !== decoded.length * 2) throw new Error("invalid CPMM vault response");
  decoded.forEach((row, index) => { const vault0 = parsedVault(vaultResponse.value[index * 2], row.tokenMint0, row.tokenProgram0, `CPMM pool ${row.address} vault 0`), vault1 = parsedVault(vaultResponse.value[index * 2 + 1], row.tokenMint1, row.tokenProgram1, `CPMM pool ${row.address} vault 1`); if (vault0.decimals !== row.mintDecimals0 || vault1.decimals !== row.mintDecimals1) throw new Error(`CPMM pool ${row.address} vault decimals mismatch`); row.vault0AmountRaw = vault0.amountRaw; row.vault1AmountRaw = vault1.amountRaw; row.ammConfigState = byConfig.get(row.ammConfig); row.ammConfigSlot = configSlot; });
  if (automaticMintEvidence) { const evidence = await acquirePoolMintEvidence(client, decoded, balanceSlot); for (const row of decoded) bindPoolMintEvidence(row, evidence); }
  return { schemaVersion: 1, type: "raydium_cpmm_pool_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, configSlot, balanceSlot, observedAt, pools: decoded };
}

function ceilFee(amount, rate) { return (amount * rate + FEE_DENOMINATOR - 1n) / FEE_DENOMINATOR; }

export function quoteCpmmSnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn, now = Date.now(), staleAfterMs = 60_000 }) {
  const amount = exact(amountIn, "CPMM amountIn", true), pool = snapshot?.pools?.find((row) => row.address === poolAddress);
  if (snapshot?.type !== "raydium_cpmm_pool_snapshot" || snapshot.commitment !== "finalized" || !Number.isSafeInteger(snapshot.stateSlot) || !Number.isSafeInteger(snapshot.configSlot) || !Number.isSafeInteger(snapshot.balanceSlot) || snapshot.stateSlot > snapshot.configSlot || snapshot.configSlot > snapshot.balanceSlot || !pool) throw new Error("CPMM quote requires a finalized coherent snapshot");
  const ageMs = now - Date.parse(snapshot.observedAt ?? ""); if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > staleAfterMs) throw new Error("CPMM snapshot is stale or future-dated");
  if ((pool.status & 4) !== 0 || BigInt(pool.openTime) * 1_000n > BigInt(now)) throw new Error("CPMM swaps are disabled or not open");
  const zeroForOne = inputMint === pool.tokenMint0 ? true : inputMint === pool.tokenMint1 ? false : null; if (zeroForOne == null) throw new Error("CPMM input mint does not belong to pool");
  const token2022 = POOL_MINT_EVIDENCE_CONSTANTS.token2022Program, hasToken2022 = pool.tokenProgram0 === token2022 || pool.tokenProgram1 === token2022;
  if (!validateBoundPoolMintEvidence(pool, snapshot.balanceSlot)) throw new Error("CPMM mint evidence is incomplete");
  const inputEvidence = zeroForOne ? pool.mint0Evidence : pool.mint1Evidence, outputEvidence = zeroForOne ? pool.mint1Evidence : pool.mint0Evidence;
  for (const evidence of [inputEvidence, outputEvidence]) if (evidence?.programId === token2022 && evidence.extensionTypes.some((type) => type !== "transferFeeConfig")) throw new Error("CPMM Token-2022 transfer extensions are unsupported");
  const inputTransfer = inputEvidence?.token2022Evidence?.activeTransferFee ? calculateTransferFeeIncludedAmount(amount, inputEvidence.token2022Evidence.activeTransferFee) : { grossAmountRaw: amount.toString(), netAmountRaw: amount.toString(), transferFeeRaw: "0" };
  if (BigInt(inputTransfer.netAmountRaw) === 0n) throw new Error("CPMM input transfer fee consumes the complete amount");
  const vault0 = exact(pool.vault0AmountRaw, "CPMM vault0"), vault1 = exact(pool.vault1AmountRaw, "CPMM vault1"), reserve0 = checkedSubtract(vault0, [BigInt(pool.protocolFeesToken0Raw), BigInt(pool.fundFeesToken0Raw), BigInt(pool.creatorFeesToken0Raw)], "CPMM token0"), reserve1 = checkedSubtract(vault1, [BigInt(pool.protocolFeesToken1Raw), BigInt(pool.fundFeesToken1Raw), BigInt(pool.creatorFeesToken1Raw)], "CPMM token1");
  if (reserve0 === 0n || reserve1 === 0n) throw new Error("CPMM pool has no spendable reserves");
  const netTransferredInput = BigInt(inputTransfer.netAmountRaw), config = pool.ammConfigState, tradeRate = exact(config?.tradeFeeRate, "CPMM trade fee"), creatorRate = pool.enableCreatorFee ? exact(config?.creatorFeeRate, "CPMM creator fee") : 0n, creatorOnInput = pool.creatorFeeOn === 0 || (pool.creatorFeeOn === 1 && zeroForOne) || (pool.creatorFeeOn === 2 && !zeroForOne), totalInputFee = ceilFee(netTransferredInput, tradeRate + (creatorOnInput ? creatorRate : 0n));
  if (totalInputFee >= netTransferredInput) throw new Error("CPMM input is consumed by fees");
  const netInput = netTransferredInput - totalInputFee, inputReserve = zeroForOne ? reserve0 : reserve1, outputReserve = zeroForOne ? reserve1 : reserve0, ammGrossOutput = netInput * outputReserve / (inputReserve + netInput), outputCreatorFee = creatorOnInput ? 0n : ceilFee(ammGrossOutput, creatorRate), transferGrossOutput = ammGrossOutput - outputCreatorFee;
  if (transferGrossOutput <= 0n || ammGrossOutput >= outputReserve) throw new Error("CPMM quote has insufficient output liquidity");
  const outputTransfer = outputEvidence?.token2022Evidence?.activeTransferFee ? calculateTransferFeeIncludedAmount(transferGrossOutput, outputEvidence.token2022Evidence.activeTransferFee) : { grossAmountRaw: transferGrossOutput.toString(), netAmountRaw: transferGrossOutput.toString(), transferFeeRaw: "0" }, output = BigInt(outputTransfer.netAmountRaw);
  if (output <= 0n) throw new Error("CPMM output transfer fee consumes the complete amount");
  return { schemaVersion: 1, protocol: "raydium-cpmm", status: "quoted", executable: false, safeForAutomation: false, pool: pool.address, inputMint, outputMint: zeroForOne ? pool.tokenMint1 : pool.tokenMint0, amountInRaw: amount.toString(), amountOutRaw: output.toString(), grossOutputRaw: outputTransfer.grossAmountRaw, inputTransferFeeRaw: inputTransfer.transferFeeRaw, outputTransferFeeRaw: outputTransfer.transferFeeRaw, transferFeeMode: hasToken2022 ? "finalized_epoch_mint_evidence" : "none", mintEvidenceSlot: pool.mintEvidenceSlot ?? null, epoch: pool.epoch ?? null, tradeAndInputCreatorFeeRaw: totalInputFee.toString(), outputCreatorFeeRaw: outputCreatorFee.toString(), inputReserveRaw: inputReserve.toString(), outputReserveRaw: outputReserve.toString(), stateSlot: snapshot.stateSlot, configSlot: snapshot.configSlot, balanceSlot: snapshot.balanceSlot, observedAt: snapshot.observedAt, missing: ["local_simulation", "external_signer_approval", "landed_transaction_confirmation"] };
}

async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }
async function main() { const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"), pools = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "raydium-cpmm").map(([address]) => address); if (!pools.length) throw new Error("no Raydium CPMM pools supplied or discovered"); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected), snapshot = await createCpmmPoolSnapshot({ client, pools, automaticMintEvidence: true, genesisHash }); if (!artifactOnly) { store.applyCpmmPoolSnapshot(snapshot); await store.save(); } await atomicWrite(config.cpmmPoolSnapshotFile, snapshot); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, configSlot: snapshot.configSlot, balanceSlot: snapshot.balanceSlot, pools: snapshot.pools.length, artifactOnly })); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
