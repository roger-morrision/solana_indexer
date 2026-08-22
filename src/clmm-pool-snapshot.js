#!/usr/bin/env node
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { durableAtomicWrite } from "./durable-file.js";
import { IndexStore } from "./store.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";
import { acquirePoolMintEvidence, bindPoolMintEvidence } from "./pool-mint-evidence.js";

export const RAYDIUM_CLMM_PROGRAM = "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK";
const DISCRIMINATOR = crypto.createHash("sha256").update("account:PoolState").digest().subarray(0, 8);
const TICK_ARRAY_DISCRIMINATOR = crypto.createHash("sha256").update("account:TickArrayState").digest().subarray(0, 8);
const BITMAP_EXTENSION_DISCRIMINATOR = crypto.createHash("sha256").update("account:TickArrayBitmapExtension").digest().subarray(0, 8);
const AMM_CONFIG_DISCRIMINATOR = crypto.createHash("sha256").update("account:AmmConfig").digest().subarray(0, 8);
const TICK_ARRAY_LENGTH = 10_240;
const TICK_ARRAY_HEADER_LENGTH = 8 + 32 + 4;
const TICK_STATE_LENGTH = 168;
const TICK_ARRAY_COUNT_OFFSET = 8 + 32 + 4 + (168 * 60);
const POOL_TICK_ARRAY_BITMAP_OFFSET = 904;
function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function u128(buffer, offset) { return ((buffer.readBigUInt64LE(offset + 8) << 64n) | buffer.readBigUInt64LE(offset)).toString(); }
function i128(buffer, offset) { const unsigned = (buffer.readBigUInt64LE(offset + 8) << 64n) | buffer.readBigUInt64LE(offset); return (unsigned >= (1n << 127n) ? unsigned - (1n << 128n) : unsigned).toString(); }
function accountBytes(account) { const encoded = account?.data; if (!Array.isArray(encoded) || encoded[1] !== "base64" || typeof encoded[0] !== "string") throw new Error("CLMM pool account must use base64 encoding"); return Buffer.from(encoded[0], "base64"); }

export function decodeClmmPoolAccount(address, account) {
  if (account?.owner !== RAYDIUM_CLMM_PROGRAM) throw new Error(`CLMM pool ${address} has unexpected owner`);
  const data = accountBytes(account); if (data.length !== 1_544 || !data.subarray(0, 8).equals(DISCRIMINATOR)) throw new Error(`CLMM pool ${address} has invalid PoolState data`);
  const tickSpacing = data.readUInt16LE(235); if (!tickSpacing) throw new Error(`CLMM pool ${address} has invalid tick spacing`);
  const initializedTickArrayStartIndexes = []; for (let word = 0; word < 16; word++) { const bits = data.readBigUInt64LE(POOL_TICK_ARRAY_BITMAP_OFFSET + (word * 8)); for (let bit = 0; bit < 64; bit++) if ((bits & (1n << BigInt(bit))) !== 0n) initializedTickArrayStartIndexes.push(((word * 64) + bit - 512) * 60 * tickSpacing); }
  const dynamicFeeRaw = data.subarray(1_096, 1_176);
  return { address, programId: RAYDIUM_CLMM_PROGRAM, ammConfig: base58(data.subarray(9, 41)), owner: base58(data.subarray(41, 73)), tokenMint0: base58(data.subarray(73, 105)), tokenMint1: base58(data.subarray(105, 137)), tokenVault0: base58(data.subarray(137, 169)), tokenVault1: base58(data.subarray(169, 201)), observationKey: base58(data.subarray(201, 233)), mintDecimals0: data[233], mintDecimals1: data[234], tickSpacing, liquidityRaw: u128(data, 237), sqrtPriceX64: u128(data, 253), tick: data.readInt32LE(269), status: data[389], feeOn: data[390], dynamicFeeEnabled: dynamicFeeRaw.some((byte) => byte !== 0), dynamicFeeRawHex: dynamicFeeRaw.toString("hex"), defaultTickArrayBitmap: { bitCount: 1024, minStartTickIndex: -512 * 60 * tickSpacing, maxStartTickIndexExclusive: 512 * 60 * tickSpacing, initializedTickArrayStartIndexes, rawHex: data.subarray(POOL_TICK_ARRAY_BITMAP_OFFSET, POOL_TICK_ARRAY_BITMAP_OFFSET + 128).toString("hex") }, rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

export function decodeClmmAmmConfigAccount(address, account) {
  if (account?.owner !== RAYDIUM_CLMM_PROGRAM) throw new Error(`CLMM AmmConfig ${address} has unexpected owner`);
  const data = accountBytes(account); if (data.length !== 117 || !data.subarray(0, 8).equals(AMM_CONFIG_DISCRIMINATOR)) throw new Error(`CLMM AmmConfig ${address} has invalid data`);
  const protocolFeeRate = data.readUInt32LE(43), tradeFeeRate = data.readUInt32LE(47), tickSpacing = data.readUInt16LE(51), fundFeeRate = data.readUInt32LE(53);
  if (!tickSpacing || tradeFeeRate >= 1_000_000 || protocolFeeRate > 1_000_000 || fundFeeRate > 1_000_000 || protocolFeeRate + fundFeeRate > 1_000_000) throw new Error(`CLMM AmmConfig ${address} has invalid fee configuration`);
  return { address, index: data.readUInt16LE(9), owner: base58(data.subarray(11, 43)), protocolFeeRate, tradeFeeRate, tickSpacing, fundFeeRate, fundOwner: base58(data.subarray(61, 93)), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

export function decodeClmmTickArrayAccount(address, account, tickSpacing = null) {
  if (account?.owner !== RAYDIUM_CLMM_PROGRAM) throw new Error(`CLMM tick array ${address} has unexpected owner`);
  const data = accountBytes(account);
  if (data.length !== TICK_ARRAY_LENGTH || !data.subarray(0, 8).equals(TICK_ARRAY_DISCRIMINATOR)) throw new Error(`CLMM tick array ${address} has invalid TickArrayState data`);
  const initializedTickCount = data[TICK_ARRAY_COUNT_OFFSET];
  if (initializedTickCount > 60) throw new Error(`CLMM tick array ${address} has invalid initialized tick count`);
  const startTickIndex = data.readInt32LE(40), initializedTicks = [];
  for (let index = 0; index < 60; index++) {
    const offset = TICK_ARRAY_HEADER_LENGTH + (index * TICK_STATE_LENGTH), liquidityGrossRaw = u128(data, offset + 20);
    if (liquidityGrossRaw === "0") continue;
    const tick = data.readInt32LE(offset);
    if (Number.isInteger(tickSpacing) && tickSpacing > 0 && tick !== startTickIndex + (index * tickSpacing)) throw new Error(`CLMM tick array ${address} has inconsistent initialized tick`);
    initializedTicks.push({ tick, liquidityNetRaw: i128(data, offset + 4), liquidityGrossRaw, feeGrowthOutside0X64: u128(data, offset + 36), feeGrowthOutside1X64: u128(data, offset + 52), rewardGrowthsOutsideX64: [u128(data, offset + 68), u128(data, offset + 84), u128(data, offset + 100)] });
  }
  if (initializedTicks.length !== initializedTickCount) throw new Error(`CLMM tick array ${address} initialized tick count mismatch`);
  return { address, pool: base58(data.subarray(8, 40)), startTickIndex, initializedTickCount, initializedTicks, recentEpoch: data.readBigUInt64LE(TICK_ARRAY_COUNT_OFFSET + 1).toString(), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

export function decodeClmmBitmapExtensionIndexes(bitmapSegments, tickSpacing, negative = false) {
  if (!Number.isInteger(tickSpacing) || tickSpacing <= 0) throw new Error("CLMM bitmap extension requires positive integer tick spacing");
  if (!Array.isArray(bitmapSegments) || bitmapSegments.length !== 14 || bitmapSegments.some((value) => !/^[0-9a-f]{128}$/.test(value))) throw new Error("CLMM bitmap extension has invalid segments");
  const tickArrayWidth = 60 * tickSpacing, indexes = [];
  for (let segment = 0; segment < bitmapSegments.length; segment++) {
    const bytes = Buffer.from(bitmapSegments[segment], "hex");
    for (let word = 0; word < 8; word++) {
      const bits = bytes.readBigUInt64LE(word * 8);
      for (let bit = 0; bit < 64; bit++) if ((bits & (1n << BigInt(bit))) !== 0n) {
        const bitmapBit = (word * 64) + bit;
        indexes.push(negative ? -(((segment + 2) * 512) - bitmapBit) * tickArrayWidth : ((segment + 1) * 512 + bitmapBit) * tickArrayWidth);
      }
    }
  }
  return indexes.sort((left, right) => left - right);
}

export function decodeClmmBitmapExtensionAccount(address, account, tickSpacing) {
  if (account?.owner !== RAYDIUM_CLMM_PROGRAM) throw new Error(`CLMM bitmap extension ${address} has unexpected owner`);
  const data = accountBytes(account); if (data.length !== 1_832 || !data.subarray(0, 8).equals(BITMAP_EXTENSION_DISCRIMINATOR)) throw new Error(`CLMM bitmap extension ${address} has invalid TickArrayBitmapExtension data`);
  const segments = (offset) => Array.from({ length: 14 }, (_, index) => data.subarray(offset + (index * 64), offset + ((index + 1) * 64)).toString("hex"));
  const positiveBitmapSegments = segments(40), negativeBitmapSegments = segments(40 + (14 * 64));
  return { address, pool: base58(data.subarray(8, 40)), segmentBits: 512, positiveBitmapSegments, negativeBitmapSegments, initializedTickArrayStartIndexes: [...decodeClmmBitmapExtensionIndexes(negativeBitmapSegments, tickSpacing, true), ...decodeClmmBitmapExtensionIndexes(positiveBitmapSegments, tickSpacing)], rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

export function parseClmmTickArrayMap(value, pools) {
  if (!value) return {};
  let parsed; try { parsed = JSON.parse(value); } catch { throw new Error("CLMM_TICK_ARRAYS_JSON must be valid JSON"); }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("CLMM_TICK_ARRAYS_JSON must map pool addresses to arrays");
  const allowed = new Set(pools), addresses = new Set();
  for (const [pool, entries] of Object.entries(parsed)) {
    if (!allowed.has(pool) || !Array.isArray(entries)) throw new Error("CLMM_TICK_ARRAYS_JSON contains an unknown pool or non-array value");
    for (const address of entries) { if (typeof address !== "string" || !address || addresses.has(address)) throw new Error("CLMM_TICK_ARRAYS_JSON addresses must be non-empty and unique"); addresses.add(address); }
  }
  return parsed;
}

export function parseClmmBitmapExtensionMap(value, pools) {
  if (!value) return {};
  let parsed; try { parsed = JSON.parse(value); } catch { throw new Error("CLMM_BITMAP_EXTENSIONS_JSON must be valid JSON"); }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("CLMM_BITMAP_EXTENSIONS_JSON must map pool addresses to extension addresses");
  const allowed = new Set(pools), addresses = new Set(); for (const [pool, address] of Object.entries(parsed)) { if (!allowed.has(pool) || typeof address !== "string" || !address || addresses.has(address)) throw new Error("CLMM_BITMAP_EXTENSIONS_JSON contains an unknown pool or invalid/duplicate address"); addresses.add(address); }
  return parsed;
}

export async function fetchClmmTickCoverage(client, pool, tickSpacing, minContextSlot) {
  if (typeof pool !== "string" || !pool || !Number.isInteger(tickSpacing) || tickSpacing <= 0 || !Number.isSafeInteger(minContextSlot)) throw new Error("invalid CLMM tick coverage request");
  const query = async (discriminator, dataSize) => client.call("getProgramAccounts", [RAYDIUM_CLMM_PROGRAM, { commitment: "finalized", encoding: "base64", withContext: true, minContextSlot, filters: [{ memcmp: { offset: 0, bytes: base58(discriminator) } }, { memcmp: { offset: 8, bytes: pool } }, { dataSize }] }]);
  const [tickResponse, extensionResponse] = await Promise.all([query(TICK_ARRAY_DISCRIMINATOR, TICK_ARRAY_LENGTH), query(BITMAP_EXTENSION_DISCRIMINATOR, 1_832)]);
  const slots = [tickResponse?.context?.slot, extensionResponse?.context?.slot];
  if (slots.some((slot) => !Number.isSafeInteger(slot) || slot < minContextSlot) || slots[0] !== slots[1] || !Array.isArray(tickResponse?.value) || !Array.isArray(extensionResponse?.value) || extensionResponse.value.length > 1 || tickResponse.value.length > 2_048) throw new Error(`invalid CLMM tick coverage response for ${pool}`);
  const extensionEntry = extensionResponse.value[0], bitmapExtension = extensionEntry ? decodeClmmBitmapExtensionAccount(extensionEntry.pubkey, extensionEntry.account, tickSpacing) : null;
  if (bitmapExtension && bitmapExtension.pool !== pool) throw new Error(`CLMM bitmap extension pool identity mismatch for ${pool}`);
  const addresses = new Set(), starts = new Set(), tickArrays = tickResponse.value.map((entry) => {
    const row = decodeClmmTickArrayAccount(entry?.pubkey, entry?.account, tickSpacing); if (row.pool !== pool || addresses.has(row.address) || starts.has(row.startTickIndex)) throw new Error(`invalid duplicate or foreign CLMM tick array for ${pool}`); addresses.add(row.address); starts.add(row.startTickIndex); return row;
  }).sort((left, right) => left.startTickIndex - right.startTickIndex);
  return { slot: slots[0], bitmapExtension, tickArrays };
}

export async function createClmmPoolSnapshot({ client, pools, tickArrays = {}, bitmapExtensions = {}, automaticTickCoverage = false, automaticFeeConfig = false, automaticMintEvidence = false, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(pools) || !pools.length) throw new Error("at least one CLMM pool is required");
  const stateResponse = await getMultipleAccountsBatched(client, pools, { commitment: "finalized", encoding: "base64" }, { label: "CLMM pool" }); const stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateResponse.value?.length !== pools.length) throw new Error("invalid CLMM pool account response");
  const decoded = pools.map((address, index) => decodeClmmPoolAccount(address, stateResponse.value[index]));
  if (automaticFeeConfig) { const configs = [...new Set(decoded.map((row) => row.ammConfig))], response = await getMultipleAccountsBatched(client, configs, { commitment: "finalized", encoding: "base64", minContextSlot: stateSlot }, { label: "CLMM AmmConfig" }); if (response.context.slot < stateSlot) throw new Error("invalid CLMM AmmConfig response"); const byAddress = new Map(configs.map((address, index) => [address, decodeClmmAmmConfigAccount(address, response.value[index])])); for (const row of decoded) { row.ammConfigState = byAddress.get(row.ammConfig); row.ammConfigSlot = response.context.slot; if (row.ammConfigState.tickSpacing !== row.tickSpacing) throw new Error(`CLMM pool ${row.address} tick spacing disagrees with AmmConfig`); } }
  if (automaticTickCoverage && (Object.keys(tickArrays).length || Object.keys(bitmapExtensions).length)) throw new Error("automatic CLMM tick coverage cannot be combined with explicit account maps");
  if (automaticTickCoverage) for (const row of decoded) {
    const coverage = await fetchClmmTickCoverage(client, row.address, row.tickSpacing, stateSlot); row.bitmapExtension = coverage.bitmapExtension; row.bitmapExtensionSlot = coverage.bitmapExtension ? coverage.slot : null; row.tickArraySlot = coverage.slot; row.tickArrayCoverage = "finalized_program_account_snapshot";
    const initializedIndexes = new Set([...row.defaultTickArrayBitmap.initializedTickArrayStartIndexes, ...(coverage.bitmapExtension?.initializedTickArrayStartIndexes ?? [])]);
    for (const tickArray of coverage.tickArrays) { if (!initializedIndexes.has(tickArray.startTickIndex)) throw new Error(`CLMM tick array ${tickArray.address} is absent from canonical bitmap evidence`); const inside = tickArray.startTickIndex >= row.defaultTickArrayBitmap.minStartTickIndex && tickArray.startTickIndex < row.defaultTickArrayBitmap.maxStartTickIndexExclusive; tickArray.bitmapSource = inside ? "pool_default" : "extension_bitmap"; }
    if (coverage.tickArrays.length !== initializedIndexes.size || coverage.tickArrays.some((array) => !initializedIndexes.has(array.startTickIndex))) throw new Error(`CLMM finalized tick coverage is incomplete for ${row.address}`); row.tickArrays = coverage.tickArrays;
  }
  const requestedExtensions = automaticTickCoverage ? [] : decoded.filter((row) => bitmapExtensions[row.address]).map((row) => ({ address: bitmapExtensions[row.address], pool: row.address }));
  if (requestedExtensions.length) { const extensionResponse = await getMultipleAccountsBatched(client, requestedExtensions.map((row) => row.address), { commitment: "finalized", encoding: "base64", minContextSlot: stateSlot }, { label: "CLMM bitmap extension" }); if (extensionResponse.context.slot < stateSlot) throw new Error("invalid CLMM bitmap extension account response"); requestedExtensions.forEach((requested, index) => { const pool = decoded.find((row) => row.address === requested.pool), extension = decodeClmmBitmapExtensionAccount(requested.address, extensionResponse.value[index], pool.tickSpacing); if (extension.pool !== requested.pool) throw new Error(`CLMM bitmap extension ${requested.address} pool identity mismatch`); pool.bitmapExtension = extension; pool.bitmapExtensionSlot = extensionResponse.context.slot; }); }
  for (const row of decoded) { row.bitmapExtension ??= null; row.bitmapExtensionSlot ??= null; }
  const requestedTickArrays = automaticTickCoverage ? [] : decoded.flatMap((row) => (tickArrays[row.address] ?? []).map((address) => ({ address, pool: row.address })));
  if (new Set(requestedTickArrays.map((row) => row.address)).size !== requestedTickArrays.length) throw new Error("CLMM tick array addresses must be unique");
  if (requestedTickArrays.length) {
    const tickResponse = await getMultipleAccountsBatched(client, requestedTickArrays.map((row) => row.address), { commitment: "finalized", encoding: "base64", minContextSlot: stateSlot }, { label: "CLMM tick array" });
    if (tickResponse.context.slot < stateSlot) throw new Error("invalid CLMM tick array account response");
    requestedTickArrays.forEach((requested, index) => { const pool = decoded.find((row) => row.address === requested.pool), tickArray = decodeClmmTickArrayAccount(requested.address, tickResponse.value[index], pool.tickSpacing); if (tickArray.pool !== requested.pool) throw new Error(`CLMM tick array ${requested.address} pool identity mismatch`); const bitmap = pool.defaultTickArrayBitmap, insideDefaultBitmap = tickArray.startTickIndex >= bitmap.minStartTickIndex && tickArray.startTickIndex < bitmap.maxStartTickIndexExclusive, initializedIndexes = insideDefaultBitmap ? bitmap.initializedTickArrayStartIndexes : pool.bitmapExtension?.initializedTickArrayStartIndexes; if (!initializedIndexes?.includes(tickArray.startTickIndex)) throw new Error(`CLMM tick array ${requested.address} is absent from ${insideDefaultBitmap ? "pool" : "extension"} bitmap`); tickArray.bitmapSource = insideDefaultBitmap ? "pool_default" : "extension_bitmap"; pool.tickArrays ??= []; pool.tickArrays.push(tickArray); pool.tickArraySlot = tickResponse.context.slot; });
  }
  for (const row of decoded) { row.tickArrays ??= []; row.tickArraySlot ??= null; row.tickArrayCoverage ??= row.tickArrays.length ? "explicit_account_list" : "none"; }
  const vaults = decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]), dependencySlot = decoded.reduce((slot, row) => Math.max(slot, row.ammConfigSlot ?? slot, row.bitmapExtensionSlot ?? slot, row.tickArraySlot ?? slot), stateSlot);
  const balanceResponse = await getMultipleAccountsBatched(client, vaults, { commitment: "finalized", encoding: "jsonParsed", minContextSlot: dependencySlot }, { label: "CLMM vault" }); const balanceSlot = balanceResponse?.context?.slot;
  if (balanceSlot < dependencySlot) throw new Error("invalid CLMM vault account response");
  for (let index = 0; index < decoded.length; index++) {
    const firstAccount = balanceResponse.value[index * 2], secondAccount = balanceResponse.value[index * 2 + 1], first = firstAccount?.data?.parsed?.info, second = secondAccount?.data?.parsed?.info;
    if (first?.mint !== decoded[index].tokenMint0 || second?.mint !== decoded[index].tokenMint1 || !/^\d+$/.test(first?.tokenAmount?.amount ?? "") || !/^\d+$/.test(second?.tokenAmount?.amount ?? "")) throw new Error(`CLMM pool ${decoded[index].address} vault identity mismatch`);
    decoded[index].tokenProgram0 = firstAccount.owner; decoded[index].tokenProgram1 = secondAccount.owner;
    decoded[index].vault0AmountRaw = String(first.tokenAmount.amount); decoded[index].vault1AmountRaw = String(second.tokenAmount.amount);
  }
  if (automaticMintEvidence) { const evidence = await acquirePoolMintEvidence(client, decoded, balanceSlot); for (const row of decoded) bindPoolMintEvidence(row, evidence); }
  return { schemaVersion: 1, type: "raydium_clmm_pool_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, balanceSlot, observedAt, pools: decoded };
}

async function atomicWrite(filename, value) { await durableAtomicWrite(filename, `${JSON.stringify(value)}\n`); }
async function main() {
  const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"); const pools = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "raydium-clmm").map(([address]) => address); if (!pools.length) throw new Error("no Raydium CLMM pools supplied or discovered");
  const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected); const snapshot = await createClmmPoolSnapshot({ client, pools, automaticTickCoverage: true, automaticFeeConfig: true, automaticMintEvidence: true, genesisHash }); if (!artifactOnly) { store.applyPoolSnapshot(snapshot); await store.save(); } await atomicWrite(config.clmmPoolSnapshotFile, snapshot); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, pools: snapshot.pools.length, bitmapExtensions: snapshot.pools.filter((row) => row.bitmapExtension).length, tickArrays: snapshot.pools.reduce((sum, row) => sum + row.tickArrays.length, 0), artifactOnly }));
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
