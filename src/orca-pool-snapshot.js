#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { IndexStore } from "./store.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";

export const ORCA_WHIRLPOOL_PROGRAM = "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc";
const DISCRIMINATOR = crypto.createHash("sha256").update("account:Whirlpool").digest().subarray(0, 8);
const FIXED_TICK_ARRAY_DISCRIMINATOR = Buffer.from("4561bdbe6e0742bb", "hex"), DYNAMIC_TICK_ARRAY_DISCRIMINATOR = crypto.createHash("sha256").update("account:DynamicTickArray").digest().subarray(0, 8), TICK_ARRAY_SIZE = 88, TICK_LEN = 113, FIXED_TICK_ARRAY_LEN = 9_988, MAX_TICK_INDEX = 443_636, MIN_TICK_INDEX = -443_636;
function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function u128(buffer, offset) { return ((buffer.readBigUInt64LE(offset + 8) << 64n) | buffer.readBigUInt64LE(offset)).toString(); }
function i128(buffer, offset) { const value = (buffer.readBigUInt64LE(offset + 8) << 64n) | buffer.readBigUInt64LE(offset); return (value >= (1n << 127n) ? value - (1n << 128n) : value).toString(); }
function accountBytes(account) { const encoded = account?.data; if (!Array.isArray(encoded) || encoded[1] !== "base64" || typeof encoded[0] !== "string") throw new Error("Orca Whirlpool account must use base64 encoding"); return Buffer.from(encoded[0], "base64"); }

export function decodeOrcaWhirlpoolAccount(address, account) {
  if (account?.owner !== ORCA_WHIRLPOOL_PROGRAM) throw new Error(`Orca Whirlpool ${address} has unexpected owner`);
  const data = accountBytes(account); if (data.length !== 653 || !data.subarray(0, 8).equals(DISCRIMINATOR)) throw new Error(`Orca Whirlpool ${address} has invalid account data`);
  const tickSpacing = data.readUInt16LE(41), feeRate = data.readUInt16LE(45), protocolFeeRate = data.readUInt16LE(47); if (!tickSpacing) throw new Error(`Orca Whirlpool ${address} has invalid tick spacing`);
  return { address, programId: ORCA_WHIRLPOOL_PROGRAM, whirlpoolsConfig: base58(data.subarray(8, 40)), tickSpacing, feeRate, protocolFeeRate, liquidityRaw: u128(data, 49), sqrtPriceX64: u128(data, 65), tick: data.readInt32LE(81), protocolFeeOwed0Raw: data.readBigUInt64LE(85).toString(), protocolFeeOwed1Raw: data.readBigUInt64LE(93).toString(), tokenMint0: base58(data.subarray(101, 133)), tokenVault0: base58(data.subarray(133, 165)), feeGrowthGlobal0X64: u128(data, 165), tokenMint1: base58(data.subarray(181, 213)), tokenVault1: base58(data.subarray(213, 245)), feeGrowthGlobal1X64: u128(data, 245), rewardLastUpdatedTimestamp: data.readBigUInt64LE(261).toString(), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

function validStartTick(startTickIndex, tickSpacing) { const width = TICK_ARRAY_SIZE * tickSpacing; if (startTickIndex < MIN_TICK_INDEX || startTickIndex > MAX_TICK_INDEX) { if (startTickIndex > MIN_TICK_INDEX) return false; return startTickIndex === MIN_TICK_INDEX - (MIN_TICK_INDEX % width + width); } return startTickIndex % width === 0; }
function tickFields(data, offset, tick) { return { tick, liquidityNetRaw: i128(data, offset + 1), liquidityGrossRaw: u128(data, offset + 17), feeGrowthOutside0X64: u128(data, offset + 33), feeGrowthOutside1X64: u128(data, offset + 49), rewardGrowthsOutsideX64: [u128(data, offset + 65), u128(data, offset + 81), u128(data, offset + 97)] }; }
export function decodeOrcaTickArrayAccount(address, account, expectedPool, tickSpacing) {
  if (account?.owner !== ORCA_WHIRLPOOL_PROGRAM) throw new Error(`Orca tick array ${address} has unexpected owner`); const data = accountBytes(account); let type, startTickIndex, pool, initializedTicks = [];
  if (data.length === FIXED_TICK_ARRAY_LEN && data.subarray(0, 8).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)) { type = "fixed"; startTickIndex = data.readInt32LE(8); pool = base58(data.subarray(9_956, 9_988)); for (let index = 0; index < TICK_ARRAY_SIZE; index++) { const offset = 12 + index * TICK_LEN, flag = data[offset]; if (flag > 1) throw new Error(`Orca tick array ${address} has invalid initialized flag`); if (flag) initializedTicks.push(tickFields(data, offset, startTickIndex + index * tickSpacing)); } }
  else if (data.length >= 148 && data.length <= 10_004 && data.subarray(0, 8).equals(DYNAMIC_TICK_ARRAY_DISCRIMINATOR)) { type = "dynamic"; startTickIndex = data.readInt32LE(8); pool = base58(data.subarray(12, 44)); const bitmap = (data.readBigUInt64LE(52) << 64n) | data.readBigUInt64LE(44); if (bitmap >> 88n) throw new Error(`Orca dynamic tick array ${address} bitmap exceeds 88 ticks`); let offset = 60; for (let index = 0; index < TICK_ARRAY_SIZE; index++) { const tag = data[offset++], initialized = ((bitmap >> BigInt(index)) & 1n) === 1n; if (tag > 1 || Boolean(tag) !== initialized) throw new Error(`Orca dynamic tick array ${address} bitmap mismatch`); if (initialized) { if (offset + 112 > data.length) throw new Error(`Orca dynamic tick array ${address} is truncated`); initializedTicks.push(tickFields(data, offset - 1, startTickIndex + index * tickSpacing)); offset += 112; } } if (offset !== data.length) throw new Error(`Orca dynamic tick array ${address} has trailing data`); }
  else throw new Error(`Orca tick array ${address} has invalid account data`);
  if (pool !== expectedPool || !Number.isInteger(tickSpacing) || tickSpacing < 1 || !validStartTick(startTickIndex, tickSpacing)) throw new Error(`Orca tick array ${address} has invalid pool or start tick`); return { address, pool, type, startTickIndex, initializedTickCount: initializedTicks.length, initializedTicks, rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

async function fetchOrcaTickArrays(client, pool, tickSpacing, minContextSlot) { const queries = [{ offset: 9_956, discriminator: FIXED_TICK_ARRAY_DISCRIMINATOR, dataSize: FIXED_TICK_ARRAY_LEN }, { offset: 12, discriminator: DYNAMIC_TICK_ARRAY_DISCRIMINATOR }], rows = [], slots = []; for (const query of queries) { const filters = [{ memcmp: { offset: 0, bytes: base58(query.discriminator) } }, { memcmp: { offset: query.offset, bytes: pool } }]; if (query.dataSize) filters.push({ dataSize: query.dataSize }); const response = await client.call("getProgramAccounts", [ORCA_WHIRLPOOL_PROGRAM, { commitment: "finalized", encoding: "base64", withContext: true, minContextSlot, filters }]), slot = response?.context?.slot, values = response?.value; if (!Number.isSafeInteger(slot) || slot < minContextSlot || !Array.isArray(values)) throw new Error(`invalid Orca tick array response for ${pool}`); slots.push(slot); for (const value of values) rows.push(decodeOrcaTickArrayAccount(value?.pubkey, value?.account, pool, tickSpacing)); } if (new Set(slots).size !== 1) throw new Error(`Orca tick arrays for ${pool} did not share the exact finalized snapshot context`); if (rows.length > 2_048 || new Set(rows.map((row) => row.address)).size !== rows.length || new Set(rows.map((row) => row.startTickIndex)).size !== rows.length) throw new Error(`invalid or excessive Orca tick arrays for ${pool}`); return { slot: slots[0], rows: rows.sort((a, b) => a.startTickIndex - b.startTickIndex) }; }

export async function createOrcaPoolSnapshot({ client, pools, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(pools) || !pools.length || new Set(pools).size !== pools.length || pools.some((pool) => typeof pool !== "string" || !pool)) throw new Error("Orca pools must be unique non-empty addresses");
  const stateResponse = await getMultipleAccountsBatched(client, pools, { commitment: "finalized", encoding: "base64" }, { label: "Orca Whirlpool" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateResponse.value?.length !== pools.length) throw new Error("invalid Orca Whirlpool account response");
  const decoded = pools.map((address, index) => decodeOrcaWhirlpoolAccount(address, stateResponse.value[index])); let minimumBalanceSlot = stateSlot; for (const row of decoded) { const tickArrays = await fetchOrcaTickArrays(client, row.address, row.tickSpacing, stateSlot); row.tickArraySlot = tickArrays.slot; row.tickArrayCoverage = "finalized_program_account_snapshot"; row.tickArrays = tickArrays.rows; minimumBalanceSlot = Math.max(minimumBalanceSlot, tickArrays.slot); } const vaults = decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]);
  const balanceResponse = await getMultipleAccountsBatched(client, vaults, { commitment: "finalized", encoding: "jsonParsed", minContextSlot: minimumBalanceSlot }, { label: "Orca vault" }), balanceSlot = balanceResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < minimumBalanceSlot || balanceResponse.value?.length !== vaults.length) throw new Error("invalid Orca vault account response");
  for (let index = 0; index < decoded.length; index++) {
    const first = balanceResponse.value[index * 2]?.data?.parsed?.info, second = balanceResponse.value[index * 2 + 1]?.data?.parsed?.info;
    if (first?.mint !== decoded[index].tokenMint0 || second?.mint !== decoded[index].tokenMint1 || !/^\d+$/.test(first?.tokenAmount?.amount ?? "") || !/^\d+$/.test(second?.tokenAmount?.amount ?? "")) throw new Error(`Orca Whirlpool ${decoded[index].address} vault identity mismatch`);
    decoded[index].vault0AmountRaw = String(first.tokenAmount.amount); decoded[index].vault1AmountRaw = String(second.tokenAmount.amount);
  }
  return { schemaVersion: 1, type: "orca_whirlpool_pool_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, balanceSlot, observedAt, pools: decoded };
}

async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }
async function main() {
  const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"), pools = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "orca-whirlpool").map(([address]) => address); if (!pools.length) throw new Error("no Orca Whirlpools supplied or discovered");
  const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected), snapshot = await createOrcaPoolSnapshot({ client, pools, genesisHash }); if (!artifactOnly) { store.applyOrcaPoolSnapshot(snapshot); await store.save(); } await atomicWrite(config.orcaPoolSnapshotFile, snapshot); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, pools: snapshot.pools.length, artifactOnly }));
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
