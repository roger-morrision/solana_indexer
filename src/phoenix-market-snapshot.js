#!/usr/bin/env node
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isInvokedFile } from "./invoked-file.js";
import { loadConfig } from "./config.js";
import { durableAtomicWrite } from "./durable-file.js";
import { IndexStore } from "./store.js";
import { assertSnapshotAcquisitionAllowed } from "./snapshot-cli-policy.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";

export const PHOENIX_PROGRAM = "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY";
export const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const PHOENIX_MARKET_HEADER_DISCRIMINANT = 8_167_313_896_524_341_111n;
const HEADER_BYTES = 576;

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function bytes(account, label) { if (!Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`${label} must use base64 encoding`); return Buffer.from(account.data[0], "base64"); }
function hash(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function u64(data, offset) { return data.readBigUInt64LE(offset).toString(); }

function decodeOrderTree(data, offset, capacity, side, address) {
  const treeSize = data.readBigUInt64LE(offset + 16), bumpIndex = data.readUInt32LE(offset + 24), initialFreeHead = data.readUInt32LE(offset + 28);
  if (bumpIndex === 0 && treeSize === 0n && initialFreeHead === 0) return [];
  if (bumpIndex < 1 || bumpIndex > capacity + 1 || treeSize > BigInt(capacity)) throw new Error(`Phoenix market ${address} has invalid ${side} allocator state`);
  const allocated = bumpIndex - 1, registers = [], rows = [];
  for (let index = 0; index < allocated; index++) { const node = offset + 32 + 64 * index; registers.push(data.readUInt32LE(node)); rows.push({ priceInTicks: u64(data, node + 16), orderSequenceNumberRaw: u64(data, node + 24), traderIndex: u64(data, node + 32), numBaseLots: u64(data, node + 40), lastValidSlot: u64(data, node + 48), lastValidUnixTimestampInSeconds: u64(data, node + 56) }); }
  const free = new Set(); let head = initialFreeHead;
  while (head < bumpIndex) { if (head < 1 || free.has(head)) throw new Error(`Phoenix market ${address} has corrupt ${side} free list`); free.add(head); head = registers[head - 1]; }
  if (head !== bumpIndex || BigInt(allocated - free.size) !== treeSize) throw new Error(`Phoenix market ${address} has inconsistent ${side} tree size`);
  const active = rows.filter((_, index) => !free.has(index + 1));
  if (active.some((row) => BigInt(row.priceInTicks) === 0n || BigInt(row.numBaseLots) === 0n || BigInt(row.traderIndex) >= BigInt(Number.MAX_SAFE_INTEGER))) throw new Error(`Phoenix market ${address} has invalid ${side} order`);
  active.sort((a, b) => { const price = BigInt(a.priceInTicks) - BigInt(b.priceInTicks); if (price) return side === "bids" ? (price > 0n ? -1 : 1) : (price > 0n ? 1 : -1); const sequence = BigInt(a.orderSequenceNumberRaw) - BigInt(b.orderSequenceNumberRaw); return sequence < 0n ? -1 : sequence > 0n ? 1 : 0; });
  return active;
}

export function decodePhoenixMarketAccount(address, account) {
  if (account?.owner !== PHOENIX_PROGRAM) throw new Error(`Phoenix market ${address} has unexpected owner`);
  const data = bytes(account, `Phoenix market ${address}`);
  if (data.length < HEADER_BYTES || data.readBigUInt64LE(0) !== PHOENIX_MARKET_HEADER_DISCRIMINANT) throw new Error(`Phoenix market ${address} has invalid MarketHeader data`);
  const status = data.readBigUInt64LE(8), bidsSize = data.readBigUInt64LE(16), asksSize = data.readBigUInt64LE(24), numSeats = data.readBigUInt64LE(32), baseDecimals = data.readUInt32LE(40), quoteDecimals = data.readUInt32LE(120), baseLotSize = data.readBigUInt64LE(112), quoteLotSize = data.readBigUInt64LE(192), tickSize = data.readBigUInt64LE(200), rawBaseUnitsPerBaseUnit = data.readUInt32LE(312);
  if (status > 5n || bidsSize === 0n || asksSize === 0n || numSeats === 0n || [bidsSize, asksSize, numSeats].some((value) => value > 1_000_000n) || baseDecimals > 255 || quoteDecimals > 255 || baseLotSize === 0n || quoteLotSize === 0n || tickSize === 0n || rawBaseUnitsPerBaseUnit === 0) throw new Error(`Phoenix market ${address} has invalid bounded header values`);
  const expectedBytes = 976n + 64n * (bidsSize + asksSize) + 144n * numSeats; if (expectedBytes > BigInt(Number.MAX_SAFE_INTEGER) || data.length !== Number(expectedBytes)) throw new Error(`Phoenix market ${address} has invalid dispatched market size`);
  const baseLotsPerBaseUnit = data.readBigUInt64LE(832), quoteLotsPerBaseUnitPerTick = data.readBigUInt64LE(840), orderSequenceNumber = data.readBigUInt64LE(848), takerFeeBasisPoints = data.readBigUInt64LE(856), collectedQuoteLotFees = data.readBigUInt64LE(864), unclaimedQuoteLotFees = data.readBigUInt64LE(872); if (baseLotsPerBaseUnit === 0n || quoteLotsPerBaseUnitPerTick === 0n || takerFeeBasisPoints > 10_000n) throw new Error(`Phoenix market ${address} has invalid market economics`);
  const tokenMint0 = base58(data.subarray(48, 80)), tokenVault0 = base58(data.subarray(80, 112)), tokenMint1 = base58(data.subarray(128, 160)), tokenVault1 = base58(data.subarray(160, 192));
  if (tokenMint0 === tokenMint1 || tokenVault0 === tokenVault1) throw new Error(`Phoenix market ${address} has ambiguous token identity`);
  const bidsOffset = 880, asksOffset = bidsOffset + 32 + 64 * Number(bidsSize), bids = decodeOrderTree(data, bidsOffset, Number(bidsSize), "bids", address), asks = decodeOrderTree(data, asksOffset, Number(asksSize), "asks", address);
  return { address, programId: PHOENIX_PROGRAM, status: Number(status), bidsSize: bidsSize.toString(), asksSize: asksSize.toString(), numSeats: numSeats.toString(), orderbookCoverage: "finalized_full_account_snapshot", bids, asks, tokenMint0, tokenMint1, tokenVault0, tokenVault1, tokenProgram0: SPL_TOKEN_PROGRAM, tokenProgram1: SPL_TOKEN_PROGRAM, mintDecimals0: baseDecimals, mintDecimals1: quoteDecimals, baseLotSizeRaw: baseLotSize.toString(), quoteLotSizeRaw: quoteLotSize.toString(), tickSizeInQuoteAtomsPerBaseUnitRaw: tickSize.toString(), baseLotsPerBaseUnit: baseLotsPerBaseUnit.toString(), quoteLotsPerBaseUnitPerTick: quoteLotsPerBaseUnitPerTick.toString(), orderSequenceNumber: orderSequenceNumber.toString(), takerFeeBasisPoints: takerFeeBasisPoints.toString(), collectedQuoteLotFees: collectedQuoteLotFees.toString(), unclaimedQuoteLotFees: unclaimedQuoteLotFees.toString(), authority: base58(data.subarray(208, 240)), feeRecipient: base58(data.subarray(240, 272)), marketSequenceNumber: u64(data, 272), successor: base58(data.subarray(280, 312)), rawBaseUnitsPerBaseUnit, accountDataBytes: data.length, rawPayloadHash: hash(data) };
}

export function quotePhoenixSnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn, now = Date.now(), staleAfterMs = 60_000, currentSlot = snapshot?.balanceSlot }) {
  if (snapshot?.type !== "phoenix_market_snapshot" || snapshot.commitment !== "finalized" || !Number.isSafeInteger(snapshot.balanceSlot)) throw new Error("Phoenix quote evidence is invalid");
  const observed = Date.parse(snapshot.observedAt); if (!Number.isFinite(observed) || now < observed || now - observed > staleAfterMs) throw new Error("Phoenix quote evidence is stale or future-dated");
  const market = snapshot.markets?.find((row) => row.address === poolAddress); if (!market || market.orderbookCoverage !== "finalized_full_account_snapshot") throw new Error("Phoenix orderbook evidence is incomplete");
  if (!/^\d+$/.test(String(amountIn)) || BigInt(amountIn) === 0n || !Number.isSafeInteger(currentSlot) || currentSlot < snapshot.balanceSlot) throw new Error("invalid Phoenix quote parameters");
  const buy = inputMint === market.tokenMint1; if (!buy && inputMint !== market.tokenMint0) throw new Error("input mint does not belong to Phoenix market");
  let remaining = BigInt(amountIn), consumed = 0n, output = 0n, fee = 0n; const nowSeconds = BigInt(Math.floor(now / 1_000)), levels = [];
  for (const order of buy ? market.asks : market.bids) { if (BigInt(order.lastValidSlot) !== 0n && BigInt(order.lastValidSlot) < BigInt(currentSlot) || BigInt(order.lastValidUnixTimestampInSeconds) !== 0n && BigInt(order.lastValidUnixTimestampInSeconds) < nowSeconds) continue; const quoteLotsPerBaseLot = BigInt(order.priceInTicks) * BigInt(market.quoteLotsPerBaseUnitPerTick) / BigInt(market.baseLotsPerBaseUnit); if (quoteLotsPerBaseLot === 0n) continue; const baseAtomsPerLot = BigInt(market.baseLotSizeRaw), quoteAtomsPerLot = quoteLotsPerBaseLot * BigInt(market.quoteLotSizeRaw), available = BigInt(order.numBaseLots), feeBps = BigInt(market.takerFeeBasisPoints); let lots = buy ? remaining * 10_000n / (quoteAtomsPerLot * (10_000n + feeBps)) : remaining / baseAtomsPerLot; if (lots > available) lots = available; if (!lots) continue; const grossQuote = lots * quoteAtomsPerLot, levelFee = (grossQuote * feeBps + 9_999n) / 10_000n, input = buy ? grossQuote + levelFee : lots * baseAtomsPerLot, levelOutput = buy ? lots * baseAtomsPerLot : grossQuote - levelFee; remaining -= input; consumed += input; output += levelOutput; fee += levelFee; levels.push({ priceInTicks: order.priceInTicks, baseLots: lots.toString(), inputRaw: input.toString(), outputRaw: levelOutput.toString(), feeRaw: levelFee.toString() }); }
  return { schemaVersion: 1, protocol: "phoenix-orderbook", status: remaining === 0n ? "quoted" : "partial", pool: poolAddress, inputMint, outputMint: buy ? market.tokenMint0 : market.tokenMint1, amountInRaw: String(amountIn), consumedInRaw: consumed.toString(), amountLeftRaw: remaining.toString(), amountOutRaw: output.toString(), takerFeeRaw: fee.toString(), stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, currentSlot, levels, executable: false, safeForAutomation: false, executionBoundary: "analysis_only_quote", missing: ["local_simulation", "external_signer_approval", "landed_transaction_confirmation"] };
}

function parsedVault(account, expectedMint, label) { if (account?.owner !== SPL_TOKEN_PROGRAM) throw new Error(`${label} token program mismatch`); const info = account?.data?.parsed?.info; if (info?.mint !== expectedMint || !/^\d+$/.test(info?.tokenAmount?.amount ?? "") || !Number.isInteger(info?.tokenAmount?.decimals)) throw new Error(`${label} identity mismatch`); return { amountRaw: info.tokenAmount.amount, decimals: info.tokenAmount.decimals }; }

export async function createPhoenixMarketSnapshot({ client, markets, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(markets) || !markets.length || new Set(markets).size !== markets.length) throw new Error("Phoenix markets must be a non-empty unique array");
  const stateResponse = await getMultipleAccountsBatched(client, markets, { commitment: "finalized", encoding: "base64" }, { label: "Phoenix market" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateSlot < 0 || stateResponse.value?.length !== markets.length) throw new Error("invalid Phoenix market response");
  const decoded = markets.map((address, index) => decodePhoenixMarketAccount(address, stateResponse.value[index]));
  const vaultResponse = await getMultipleAccountsBatched(client, decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]), { commitment: "finalized", encoding: "jsonParsed", minContextSlot: stateSlot }, { label: "Phoenix vault" }), balanceSlot = vaultResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < stateSlot || vaultResponse.value?.length !== decoded.length * 2) throw new Error("invalid Phoenix vault response");
  decoded.forEach((row, index) => { const base = parsedVault(vaultResponse.value[index * 2], row.tokenMint0, `Phoenix market ${row.address} base vault`), quote = parsedVault(vaultResponse.value[index * 2 + 1], row.tokenMint1, `Phoenix market ${row.address} quote vault`); if (base.decimals !== row.mintDecimals0 || quote.decimals !== row.mintDecimals1) throw new Error(`Phoenix market ${row.address} vault decimals mismatch`); row.vault0AmountRaw = base.amountRaw; row.vault1AmountRaw = quote.amountRaw; });
  return { schemaVersion: 1, type: "phoenix_market_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, balanceSlot, observedAt, markets: decoded };
}

async function main() { const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"); assertSnapshotAcquisitionAllowed(store, { artifactOnly, requested }); const markets = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "phoenix-orderbook").map(([address]) => address); if (!markets.length) throw new Error("no Phoenix markets supplied or discovered"); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected), snapshot = await createPhoenixMarketSnapshot({ client, markets, genesisHash }); if (!artifactOnly) { store.applyPhoenixMarketSnapshot(snapshot); await store.save(); } await durableAtomicWrite(config.phoenixMarketSnapshotFile, `${JSON.stringify(snapshot)}\n`); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, markets: snapshot.markets.length, artifactOnly })); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (isInvokedFile(invokedFile, fileURLToPath(import.meta.url))) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
