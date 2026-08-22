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
function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function u128(buffer, offset) { return ((buffer.readBigUInt64LE(offset + 8) << 64n) | buffer.readBigUInt64LE(offset)).toString(); }
function accountBytes(account) { const encoded = account?.data; if (!Array.isArray(encoded) || encoded[1] !== "base64" || typeof encoded[0] !== "string") throw new Error("Orca Whirlpool account must use base64 encoding"); return Buffer.from(encoded[0], "base64"); }

export function decodeOrcaWhirlpoolAccount(address, account) {
  if (account?.owner !== ORCA_WHIRLPOOL_PROGRAM) throw new Error(`Orca Whirlpool ${address} has unexpected owner`);
  const data = accountBytes(account); if (data.length !== 653 || !data.subarray(0, 8).equals(DISCRIMINATOR)) throw new Error(`Orca Whirlpool ${address} has invalid account data`);
  const tickSpacing = data.readUInt16LE(41), feeRate = data.readUInt16LE(45), protocolFeeRate = data.readUInt16LE(47); if (!tickSpacing) throw new Error(`Orca Whirlpool ${address} has invalid tick spacing`);
  return { address, programId: ORCA_WHIRLPOOL_PROGRAM, whirlpoolsConfig: base58(data.subarray(8, 40)), tickSpacing, feeRate, protocolFeeRate, liquidityRaw: u128(data, 49), sqrtPriceX64: u128(data, 65), tick: data.readInt32LE(81), protocolFeeOwed0Raw: data.readBigUInt64LE(85).toString(), protocolFeeOwed1Raw: data.readBigUInt64LE(93).toString(), tokenMint0: base58(data.subarray(101, 133)), tokenVault0: base58(data.subarray(133, 165)), feeGrowthGlobal0X64: u128(data, 165), tokenMint1: base58(data.subarray(181, 213)), tokenVault1: base58(data.subarray(213, 245)), feeGrowthGlobal1X64: u128(data, 245), rewardLastUpdatedTimestamp: data.readBigUInt64LE(261).toString(), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

export async function createOrcaPoolSnapshot({ client, pools, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(pools) || !pools.length || new Set(pools).size !== pools.length || pools.some((pool) => typeof pool !== "string" || !pool)) throw new Error("Orca pools must be unique non-empty addresses");
  const stateResponse = await getMultipleAccountsBatched(client, pools, { commitment: "finalized", encoding: "base64" }, { label: "Orca Whirlpool" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateResponse.value?.length !== pools.length) throw new Error("invalid Orca Whirlpool account response");
  const decoded = pools.map((address, index) => decodeOrcaWhirlpoolAccount(address, stateResponse.value[index])), vaults = decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]);
  const balanceResponse = await getMultipleAccountsBatched(client, vaults, { commitment: "finalized", encoding: "jsonParsed", minContextSlot: stateSlot }, { label: "Orca vault" }), balanceSlot = balanceResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < stateSlot || balanceResponse.value?.length !== vaults.length) throw new Error("invalid Orca vault account response");
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
