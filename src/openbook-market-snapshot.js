#!/usr/bin/env node
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
import { createProgramAddress, decodeBase58Address } from "./solana-pda.js";
import { decodeClmmPoolAccount } from "./clmm-pool-snapshot.js";
import { evaluateOpenBookOraclePolicy, projectOpenBookPeggedOrder } from "./openbook-oracle-policy.js";
export { evaluateOpenBookOraclePolicy } from "./openbook-oracle-policy.js";

export const OPENBOOK_V2_PROGRAM = "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb";
export const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const OPENBOOK_MARKET_DISCRIMINATOR = Buffer.from([219, 190, 213, 55, 0, 227, 198, 154]);
export const OPENBOOK_BOOKSIDE_DISCRIMINATOR = crypto.createHash("sha256").update("account:BookSide").digest().subarray(0, 8);
export const OPENBOOK_STUB_ORACLE_DISCRIMINATOR = crypto.createHash("sha256").update("account:StubOracle").digest().subarray(0, 8);
const MARKET_ACCOUNT_BYTES = 848, FEE_SCALE = 1_000_000n, BOOKSIDE_ACCOUNT_BYTES = 90_952, BOOKSIDE_NODES_OFFSET = 840, BOOKSIDE_NODE_BYTES = 88, BOOKSIDE_NODE_CAPACITY = 1_024;
const RAYDIUM_CLMM_PROGRAM = "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", SWITCHBOARD_V1_DEVNET_PROGRAM = "7azgmy1pFXHikv36q1zZASvFq5vFa39TT9NweVugKKTU", SWITCHBOARD_V2_MAINNET_PROGRAM = "DtmE9D2CSB4L5D6A15mraeEjrGMm6auWVzgaD8hK2tZM", SWITCHBOARD_V2_DISCRIMINATOR = Buffer.from([217, 230, 65, 101, 201, 162, 27, 125]), PYTH_MAGIC = 0xa1b2c3d4;

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function accountBytes(account, label) { if (!Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`${label} must use base64 encoding`); return Buffer.from(account.data[0], "base64"); }
function hash(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function u64(data, offset) { return data.readBigUInt64LE(offset).toString(); }
function u128(data, offset) { return ((data.readBigUInt64LE(offset + 8) << 64n) | data.readBigUInt64LE(offset)).toString(); }
function u128Value(data, offset) { return (data.readBigUInt64LE(offset + 8) << 64n) | data.readBigUInt64LE(offset); }
function i128Value(data, offset) { return BigInt.asIntN(128, u128Value(data, offset)); }
function optionalPubkey(data, offset) { const value = data.subarray(offset, offset + 32); return value.every((byte) => byte === 0) ? null : base58(value); }

function projectPeggedOrders(orders, side, oraclePriceLots) {
  return orders.map((order) => projectOpenBookPeggedOrder(order, side, oraclePriceLots));
}

export function decodeOpenBookOracleAccount(address, account) {
  const data = accountBytes(account, `OpenBook oracle ${address}`); if (data.length < 8 || data.length > 65_536 || typeof account?.owner !== "string" || !account.owner) throw new Error(`OpenBook oracle ${address} has invalid account evidence`);
  const common = { address, ownerProgram: account.owner, identityPrefixHex: data.subarray(0, 8).toString("hex"), accountDataBytes: data.length, rawPayloadHash: hash(data), automationSafe: false };
  if (account.owner === RAYDIUM_CLMM_PROGRAM) {
    const pool = decodeClmmPoolAccount(address, account), squaredPriceX64Raw = ((BigInt(pool.sqrtPriceX64) ** 2n) >> 64n).toString(), decimalExponent = pool.mintDecimals0 - pool.mintDecimals1;
    if (BigInt(squaredPriceX64Raw) <= 0n || decimalExponent < -12 || decimalExponent > 12) throw new Error(`OpenBook Raydium CLMM oracle ${address} has invalid price`);
    return { ...common, provider: "raydium_clmm", coverage: "finalized_openbook_compatible_state", tokenMint0: pool.tokenMint0, tokenMint1: pool.tokenMint1, mintDecimals0: pool.mintDecimals0, mintDecimals1: pool.mintDecimals1, sqrtPriceX64Raw: pool.sqrtPriceX64, squaredPriceX64Raw, decimalExponent, lastUpdateSlotRaw: ((1n << 64n) - 1n).toString() };
  }
  if (data.subarray(0, 8).equals(OPENBOOK_STUB_ORACLE_DISCRIMINATOR)) {
    if (account.owner !== OPENBOOK_V2_PROGRAM || data.length !== 208) throw new Error(`OpenBook stub oracle ${address} has invalid layout`);
    const price = data.readDoubleLE(72), deviation = data.readDoubleLE(96), owner = base58(data.subarray(8, 40)), mint = base58(data.subarray(40, 72));
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(deviation) || deviation < 0 || data.subarray(104).some(Boolean)) throw new Error(`OpenBook stub oracle ${address} has invalid state`);
    return { ...common, provider: "openbook_stub", coverage: "finalized_unsafe_mutable_stub", authority: owner, mint, priceBitsRaw: u64(data, 72), deviationBitsRaw: u64(data, 96), lastUpdateUnix: data.readBigInt64LE(80).toString(), lastUpdateSlotRaw: u64(data, 88) };
  }
  if (data.readUInt32LE(0) === PYTH_MAGIC) {
    if (data.length < 3_312 || data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== 3) throw new Error(`OpenBook Pyth oracle ${address} has invalid PriceAccount layout`);
    const declaredAccountBytes = data.readUInt32LE(12), priceType = data[16], exponent = data.readInt32LE(20), publisherComponentCount = data.readUInt32LE(24), aggregateQuoterCount = data.readUInt32LE(28), aggregateStatus = data[224], corporateAction = data[225];
    if (![240 + publisherComponentCount * 96, data.length].includes(declaredAccountBytes) || priceType !== 1 || exponent < -12 || exponent > 12 || publisherComponentCount > 32 || aggregateQuoterCount > publisherComponentCount || aggregateStatus > 4 || corporateAction !== 0) throw new Error(`OpenBook Pyth oracle ${address} has invalid PriceAccount state`);
    const trading = aggregateStatus === 1, priceRaw = data.readBigInt64LE(trading ? 208 : 184), confidenceRaw = data.readBigUInt64LE(trading ? 216 : 192), publishTimeUnix = data.readBigInt64LE(trading ? 96 : 200), lastUpdateSlotRaw = data.readBigUInt64LE(trading ? 232 : 176);
    if (priceRaw < 0n) throw new Error(`OpenBook Pyth oracle ${address} has negative selected price`);
    return { ...common, provider: "pyth_legacy", coverage: "finalized_state_unpriced", version: 2, declaredAccountBytes, priceType: "price", exponent, publisherComponentCount, aggregateQuoterCount, aggregateStatus: ["unknown", "trading", "halted", "auction", "ignored"][aggregateStatus], selectedPriceSource: trading ? "aggregate" : "previous_trading", priceRaw: priceRaw.toString(), confidenceRaw: confidenceRaw.toString(), publishTimeUnix: publishTimeUnix.toString(), lastUpdateSlotRaw: lastUpdateSlotRaw.toString() };
  }
  if (data.subarray(0, 8).equals(SWITCHBOARD_V2_DISCRIMINATOR)) {
    if (data.length !== 3_851) throw new Error(`OpenBook Switchboard V2 oracle ${address} has invalid AggregatorAccountData layout`);
    const minimumOracleResults = data.readUInt32LE(236), successfulResults = data.readUInt32LE(341), resolutionMode = data[3_712], resultMantissaRaw = i128Value(data, 366), resultScale = data.readUInt32LE(382), standardDeviationMantissaRaw = i128Value(data, 386), standardDeviationScale = data.readUInt32LE(402), lastUpdateSlotRaw = data.readBigUInt64LE(350);
    if (resolutionMode > 1 || resolutionMode === 0 && successfulResults < minimumOracleResults || resultScale > 28 || standardDeviationScale > 28 || resultMantissaRaw < 0n || standardDeviationMantissaRaw < 0n) throw new Error(`OpenBook Switchboard V2 oracle ${address} has invalid aggregator state`);
    return { ...common, provider: "switchboard_v2", coverage: "finalized_openbook_compatible_state", resolutionMode: resolutionMode === 0 ? "round" : "sliding", minimumOracleResults, successfulResults, resultMantissaRaw: resultMantissaRaw.toString(), resultScale, standardDeviationMantissaRaw: standardDeviationMantissaRaw.toString(), standardDeviationScale, lastUpdateSlotRaw: lastUpdateSlotRaw.toString() };
  }
  let provider = null;
  if ([SWITCHBOARD_V1_DEVNET_PROGRAM, SWITCHBOARD_V2_MAINNET_PROGRAM].includes(account.owner)) provider = "switchboard_v1_unverified";
  if (!provider) throw new Error(`OpenBook oracle ${address} provider is unsupported`);
  return { ...common, provider, coverage: "finalized_raw_unverified" };
}

export function decodeOpenBookMarketAccount(address, account) {
  if (account?.owner !== OPENBOOK_V2_PROGRAM) throw new Error(`OpenBook market ${address} has unexpected owner`);
  const data = accountBytes(account, `OpenBook market ${address}`);
  if (data.length !== MARKET_ACCOUNT_BYTES || !data.subarray(0, 8).equals(OPENBOOK_MARKET_DISCRIMINATOR)) throw new Error(`OpenBook market ${address} has invalid Market data`);
  const bump = data[8], baseDecimals = data[9], quoteDecimals = data[10], timeExpiry = data.readBigInt64LE(48), quoteLotSize = data.readBigInt64LE(448), baseLotSize = data.readBigInt64LE(456), registrationTime = data.readBigInt64LE(472), makerFee = data.readBigInt64LE(480), takerFee = data.readBigInt64LE(488);
  if (quoteLotSize <= 0n || baseLotSize <= 0n || makerFee < -FEE_SCALE || makerFee > FEE_SCALE || takerFee < 0n || takerFee > FEE_SCALE || makerFee < 0n && -makerFee > takerFee || timeExpiry < 0n || registrationTime < 0n) throw new Error(`OpenBook market ${address} has invalid economics`);
  const marketAuthority = base58(data.subarray(16, 48)), expectedAuthority = createProgramAddress(OPENBOOK_V2_PROGRAM, [Buffer.from("Market"), decodeBase58Address(address), Buffer.from([bump])]);
  if (marketAuthority !== expectedAuthority) throw new Error(`OpenBook market ${address} authority mismatch`);
  const tokenMint0 = base58(data.subarray(576, 608)), tokenMint1 = base58(data.subarray(608, 640)), tokenVault0 = base58(data.subarray(640, 672)), tokenVault1 = base58(data.subarray(680, 712)), bids = base58(data.subarray(200, 232)), asks = base58(data.subarray(232, 264)), eventHeap = base58(data.subarray(264, 296)), oracleA = optionalPubkey(data, 296), oracleB = optionalPubkey(data, 328), oracleConfidenceFilterBitsRaw = u64(data, 360), oracleMaxStalenessSlots = data.readBigInt64LE(368).toString();
  if (tokenMint0 === tokenMint1 || tokenVault0 === tokenVault1 || new Set([address, bids, asks, eventHeap]).size !== 4 || oracleB && !oracleA || oracleA && oracleA === oracleB) throw new Error(`OpenBook market ${address} has ambiguous identity`);
  const nameBytes = data.subarray(184, 200), zero = nameBytes.indexOf(0), name = nameBytes.subarray(0, zero < 0 ? nameBytes.length : zero).toString("utf8");
  if (!name || name.includes("\ufffd") || nameBytes.subarray(zero < 0 ? nameBytes.length : zero).some(Boolean)) throw new Error(`OpenBook market ${address} has invalid name`);
  return { address, programId: OPENBOOK_V2_PROGRAM, bump, marketAuthority, collectFeeAdmin: base58(data.subarray(56, 88)), name, bids, asks, eventHeap, oracleA, oracleB, oracleConfidenceFilterBitsRaw, oracleMaxStalenessSlots, oracleCoverage: oracleA ? "configured_unverified" : "not_configured", orderbookCoverage: "unavailable_pending_bookside_decoder", tokenMint0, tokenMint1, tokenVault0, tokenVault1, mintDecimals0: baseDecimals, mintDecimals1: quoteDecimals, timeExpiryUnix: timeExpiry.toString(), quoteLotSizeRaw: quoteLotSize.toString(), baseLotSizeRaw: baseLotSize.toString(), sequenceNumberRaw: u64(data, 464), registrationTimeUnix: registrationTime.toString(), makerFeeMillionths: makerFee.toString(), takerFeeMillionths: takerFee.toString(), feesAccruedRaw: u128(data, 496), feesToReferrersRaw: u128(data, 512), referrerRebatesAccruedRaw: u64(data, 528), feesAvailableRaw: u64(data, 536), makerVolumeRaw: u128(data, 544), takerVolumeWithoutOpenOrdersRaw: u128(data, 560), baseDepositTotalRaw: u64(data, 672), quoteDepositTotalRaw: u64(data, 712), accountDataBytes: data.length, rawPayloadHash: hash(data) };
}

function leadingZeros128(value) { return value === 0n ? 128 : 128 - value.toString(2).length; }
function decodeBookTree(data, rootOffset, side, component, allocated, address, claimed) {
  const root = data.readUInt32LE(rootOffset), leafCount = data.readUInt32LE(rootOffset + 4); if (leafCount === 0) return { orders: [], leafCount: 0 }; if (root >= allocated || leafCount > 512) throw new Error(`OpenBook ${side} ${address} has invalid ${component} root`);
  const orders = [], visiting = new Set(), walk = (handle) => { if (handle >= allocated || visiting.has(handle) || claimed.has(handle)) throw new Error(`OpenBook ${side} ${address} has corrupt ${component} tree`); visiting.add(handle); claimed.add(handle); const offset = BOOKSIDE_NODES_OFFSET + handle * BOOKSIDE_NODE_BYTES, tag = data[offset], key = u128Value(data, offset + 8);
    if (tag === 2) { const quantity = data.readBigInt64LE(offset + 56), timestamp = data.readBigUInt64LE(offset + 64), timeInForce = data.readUInt16LE(offset + 2), pegLimit = data.readBigInt64LE(offset + 72), priceData = key >> 64n; if (quantity <= 0n || component === "fixed" && (priceData === 0n || priceData > ((1n << 63n) - 1n))) throw new Error(`OpenBook ${side} ${address} has invalid ${component} leaf`); orders.push({ nodeHandle: handle, ownerSlot: data[offset + 1], keyRaw: key.toString(), priceLots: component === "fixed" ? priceData.toString() : null, priceOffsetLots: component === "oracle_pegged" ? BigInt.asIntN(64, priceData - (1n << 63n)).toString() : null, quantityBaseLots: quantity.toString(), owner: base58(data.subarray(offset + 24, offset + 56)), timestamp: timestamp.toString(), timeInForceSeconds: timeInForce, expiresAtUnix: timeInForce ? (timestamp + BigInt(timeInForce)).toString() : "0", pegLimitLots: pegLimit.toString(), clientOrderIdRaw: u64(data, offset + 80), orderTree: component }); }
    else if (tag === 1) { const prefixLength = data.readUInt32LE(offset + 4), children = [data.readUInt32LE(offset + 24), data.readUInt32LE(offset + 28)]; if (prefixLength > 127 || children[0] === children[1] || children.some((child) => child >= allocated)) throw new Error(`OpenBook ${side} ${address} has invalid ${component} branch`); for (let bit = 0; bit < 2; bit++) { const childOffset = BOOKSIDE_NODES_OFFSET + children[bit] * BOOKSIDE_NODE_BYTES, childKey = u128Value(data, childOffset + 8), mask = 1n << BigInt(127 - prefixLength); if (![1, 2].includes(data[childOffset]) || leadingZeros128(key ^ childKey) < prefixLength || Number((childKey & mask) !== 0n) !== bit) throw new Error(`OpenBook ${side} ${address} has invalid ${component} prefix`); walk(children[bit]); } }
    else throw new Error(`OpenBook ${side} ${address} has invalid ${component} node tag`); visiting.delete(handle); };
  walk(root); if (orders.length !== leafCount) throw new Error(`OpenBook ${side} ${address} has inconsistent ${component} leaf count`); orders.sort((a, b) => { const left = BigInt(a.keyRaw), right = BigInt(b.keyRaw); return left === right ? 0 : side === "bids" ? (left > right ? -1 : 1) : (left < right ? -1 : 1); }); return { orders, leafCount };
}

export function decodeOpenBookBookSideAccount(address, account, expectedSide) {
  if (account?.owner !== OPENBOOK_V2_PROGRAM) throw new Error(`OpenBook ${expectedSide} ${address} has unexpected owner`); const data = accountBytes(account, `OpenBook ${expectedSide} ${address}`); if (data.length !== BOOKSIDE_ACCOUNT_BYTES || !data.subarray(0, 8).equals(OPENBOOK_BOOKSIDE_DISCRIMINATOR)) throw new Error(`OpenBook ${expectedSide} ${address} has invalid BookSide data`);
  const sideCode = data[312], expectedCode = expectedSide === "bids" ? 0 : expectedSide === "asks" ? 1 : -1, bumpIndex = data.readUInt32LE(316), freeListLength = data.readUInt32LE(320), freeListHead = data.readUInt32LE(324); if (sideCode !== expectedCode || bumpIndex > BOOKSIDE_NODE_CAPACITY || freeListLength > bumpIndex) throw new Error(`OpenBook ${expectedSide} ${address} has invalid allocator state`);
  const free = new Set(); let handle = freeListHead; for (let index = 0; index < freeListLength; index++) { if (handle >= bumpIndex || free.has(handle)) throw new Error(`OpenBook ${expectedSide} ${address} has corrupt free list`); free.add(handle); const offset = BOOKSIDE_NODES_OFFSET + handle * BOOKSIDE_NODE_BYTES, tag = data[offset]; if (tag !== (index === freeListLength - 1 ? 4 : 3)) throw new Error(`OpenBook ${expectedSide} ${address} has invalid free node`); handle = data.readUInt32LE(offset + 4); }
  const claimed = new Set(), fixed = decodeBookTree(data, 8, expectedSide, "fixed", bumpIndex, address, claimed), pegged = decodeBookTree(data, 16, expectedSide, "oracle_pegged", bumpIndex, address, claimed); for (let index = 0; index < bumpIndex; index++) if (!free.has(index) && !claimed.has(index)) throw new Error(`OpenBook ${expectedSide} ${address} has unreachable allocated node`);
  return { address, side: expectedSide, fixedOrders: fixed.orders, oraclePeggedOrders: pegged.orders, fixedLeafCount: fixed.leafCount, oraclePeggedLeafCount: pegged.leafCount, bumpIndex, freeListLength, accountDataBytes: data.length, rawPayloadHash: hash(data) };
}

function parsedVault(account, expectedMint, label) { if (account?.owner !== SPL_TOKEN_PROGRAM) throw new Error(`${label} token program mismatch`); const info = account?.data?.parsed?.info; if (info?.mint !== expectedMint || !/^\d+$/.test(info?.tokenAmount?.amount ?? "") || !Number.isInteger(info?.tokenAmount?.decimals) || info.tokenAmount.decimals < 0 || info.tokenAmount.decimals > 255) throw new Error(`${label} identity mismatch`); return { amountRaw: info.tokenAmount.amount, decimals: info.tokenAmount.decimals, programId: account.owner }; }

export async function createOpenBookMarketSnapshot({ client, markets, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(markets) || !markets.length || new Set(markets).size !== markets.length) throw new Error("OpenBook markets must be a non-empty unique array");
  const stateResponse = await getMultipleAccountsBatched(client, markets, { commitment: "finalized", encoding: "base64" }, { label: "OpenBook market" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateSlot < 0 || stateResponse.value?.length !== markets.length) throw new Error("invalid OpenBook market response");
  const decoded = markets.map((address, index) => decodeOpenBookMarketAccount(address, stateResponse.value[index]));
  const bookResponse = await getMultipleAccountsBatched(client, decoded.flatMap((row) => [row.bids, row.asks]), { commitment: "finalized", encoding: "base64", minContextSlot: stateSlot }, { label: "OpenBook book side" }), bookSlot = bookResponse?.context?.slot;
  if (!Number.isSafeInteger(bookSlot) || bookSlot < stateSlot || bookResponse.value?.length !== decoded.length * 2) throw new Error("invalid OpenBook book-side response");
  decoded.forEach((row, index) => { const bids = decodeOpenBookBookSideAccount(row.bids, bookResponse.value[index * 2], "bids"), asks = decodeOpenBookBookSideAccount(row.asks, bookResponse.value[index * 2 + 1], "asks"); Object.assign(row, { orderbookCoverage: bids.oraclePeggedLeafCount || asks.oraclePeggedLeafCount ? "finalized_fixed_depth_oracle_pegged_unpriced" : "finalized_full_fixed_depth", bidOrders: bids.fixedOrders, askOrders: asks.fixedOrders, oraclePeggedBidOrders: bids.oraclePeggedOrders, oraclePeggedAskOrders: asks.oraclePeggedOrders, bidsAccountDataBytes: bids.accountDataBytes, asksAccountDataBytes: asks.accountDataBytes, bidsPayloadHash: bids.rawPayloadHash, asksPayloadHash: asks.rawPayloadHash, bidsAllocator: { bumpIndex: bids.bumpIndex, freeListLength: bids.freeListLength }, asksAllocator: { bumpIndex: asks.bumpIndex, freeListLength: asks.freeListLength } }); });
  const oracleAddresses = [...new Set(decoded.flatMap((row) => [row.oracleA, row.oracleB]).filter(Boolean))]; let oracleSlot = bookSlot;
  if (oracleAddresses.length) { const oracleResponse = await getMultipleAccountsBatched(client, oracleAddresses, { commitment: "finalized", encoding: "base64", minContextSlot: bookSlot }, { label: "OpenBook oracle" }); oracleSlot = oracleResponse?.context?.slot; if (!Number.isSafeInteger(oracleSlot) || oracleSlot < bookSlot || oracleResponse.value?.length !== oracleAddresses.length) throw new Error("invalid OpenBook oracle response"); const evidence = new Map(oracleAddresses.map((address, index) => [address, decodeOpenBookOracleAccount(address, oracleResponse.value[index])])); decoded.forEach((row) => { row.oracleEvidenceA = row.oracleA ? evidence.get(row.oracleA) : null; row.oracleEvidenceB = row.oracleB ? evidence.get(row.oracleB) : null; row.oraclePolicy = evaluateOpenBookOraclePolicy(row, oracleSlot); if (row.oraclePolicy.valid) { row.oraclePeggedBidOrders = projectPeggedOrders(row.oraclePeggedBidOrders, "bids", row.oraclePolicy.oraclePriceLots); row.oraclePeggedAskOrders = projectPeggedOrders(row.oraclePeggedAskOrders, "asks", row.oraclePolicy.oraclePriceLots); if (row.oraclePeggedBidOrders.length || row.oraclePeggedAskOrders.length) row.orderbookCoverage = "finalized_full_depth_with_validated_oracle_pegs"; } }); }
  else decoded.forEach((row) => { row.oracleEvidenceA = null; row.oracleEvidenceB = null; });
  const vaultResponse = await getMultipleAccountsBatched(client, decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]), { commitment: "finalized", encoding: "jsonParsed", minContextSlot: oracleSlot }, { label: "OpenBook vault" }), balanceSlot = vaultResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < oracleSlot || vaultResponse.value?.length !== decoded.length * 2) throw new Error("invalid OpenBook vault response");
  decoded.forEach((row, index) => { const base = parsedVault(vaultResponse.value[index * 2], row.tokenMint0, `OpenBook market ${row.address} base vault`), quote = parsedVault(vaultResponse.value[index * 2 + 1], row.tokenMint1, `OpenBook market ${row.address} quote vault`); if (base.decimals !== row.mintDecimals0 || quote.decimals !== row.mintDecimals1) throw new Error(`OpenBook market ${row.address} vault decimals mismatch`); Object.assign(row, { tokenProgram0: base.programId, tokenProgram1: quote.programId, vault0AmountRaw: base.amountRaw, vault1AmountRaw: quote.amountRaw }); });
  return { schemaVersion: 1, type: "openbook_market_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, bookSlot, oracleSlot, balanceSlot, observedAt, markets: decoded };
}

async function main() { const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"); assertSnapshotAcquisitionAllowed(store, { artifactOnly, requested }); const markets = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "openbook-v2").map(([address]) => address); if (!markets.length) throw new Error("no OpenBook markets supplied or discovered"); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected), snapshot = await createOpenBookMarketSnapshot({ client, markets, genesisHash }); if (!artifactOnly) { store.applyOpenBookMarketSnapshot(snapshot); await store.save(); } await durableAtomicWrite(config.openBookMarketSnapshotFile, `${JSON.stringify(snapshot)}\n`); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, bookSlot: snapshot.bookSlot, oracleSlot: snapshot.oracleSlot, balanceSlot: snapshot.balanceSlot, markets: snapshot.markets.length, artifactOnly })); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
