#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { IndexStore } from "./store.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";

export const RAYDIUM_CLMM_PROGRAM = "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK";
const DISCRIMINATOR = crypto.createHash("sha256").update("account:PoolState").digest().subarray(0, 8);
function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function u128(buffer, offset) { return ((buffer.readBigUInt64LE(offset + 8) << 64n) | buffer.readBigUInt64LE(offset)).toString(); }
function accountBytes(account) { const encoded = account?.data; if (!Array.isArray(encoded) || encoded[1] !== "base64" || typeof encoded[0] !== "string") throw new Error("CLMM pool account must use base64 encoding"); return Buffer.from(encoded[0], "base64"); }

export function decodeClmmPoolAccount(address, account) {
  if (account?.owner !== RAYDIUM_CLMM_PROGRAM) throw new Error(`CLMM pool ${address} has unexpected owner`);
  const data = accountBytes(account); if (data.length !== 1_544 || !data.subarray(0, 8).equals(DISCRIMINATOR)) throw new Error(`CLMM pool ${address} has invalid PoolState data`);
  return { address, programId: RAYDIUM_CLMM_PROGRAM, ammConfig: base58(data.subarray(9, 41)), owner: base58(data.subarray(41, 73)), tokenMint0: base58(data.subarray(73, 105)), tokenMint1: base58(data.subarray(105, 137)), tokenVault0: base58(data.subarray(137, 169)), tokenVault1: base58(data.subarray(169, 201)), observationKey: base58(data.subarray(201, 233)), mintDecimals0: data[233], mintDecimals1: data[234], tickSpacing: data.readUInt16LE(235), liquidityRaw: u128(data, 237), sqrtPriceX64: u128(data, 253), tick: data.readInt32LE(269), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

export async function createClmmPoolSnapshot({ client, pools, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(pools) || !pools.length) throw new Error("at least one CLMM pool is required");
  const stateResponse = await client.call("getMultipleAccounts", [pools, { commitment: "finalized", encoding: "base64" }]); const stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateResponse.value?.length !== pools.length) throw new Error("invalid CLMM pool account response");
  const decoded = pools.map((address, index) => decodeClmmPoolAccount(address, stateResponse.value[index])); const vaults = decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]);
  const balanceResponse = await client.call("getMultipleAccounts", [vaults, { commitment: "finalized", encoding: "jsonParsed", minContextSlot: stateSlot }]); const balanceSlot = balanceResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < stateSlot || balanceResponse.value?.length !== vaults.length) throw new Error("invalid CLMM vault account response");
  for (let index = 0; index < decoded.length; index++) {
    const first = balanceResponse.value[index * 2]?.data?.parsed?.info, second = balanceResponse.value[index * 2 + 1]?.data?.parsed?.info;
    if (first?.mint !== decoded[index].tokenMint0 || second?.mint !== decoded[index].tokenMint1 || !/^\d+$/.test(first?.tokenAmount?.amount ?? "") || !/^\d+$/.test(second?.tokenAmount?.amount ?? "")) throw new Error(`CLMM pool ${decoded[index].address} vault identity mismatch`);
    decoded[index].vault0AmountRaw = String(first.tokenAmount.amount); decoded[index].vault1AmountRaw = String(second.tokenAmount.amount);
  }
  return { schemaVersion: 1, type: "raydium_clmm_pool_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, balanceSlot, observedAt, pools: decoded };
}

async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }
async function main() {
  const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const requested = process.argv.slice(2).filter(Boolean); const pools = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "raydium-clmm").map(([address]) => address); if (!pools.length) throw new Error("no Raydium CLMM pools supplied or discovered");
  const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected); const snapshot = await createClmmPoolSnapshot({ client, pools, genesisHash }); store.applyPoolSnapshot(snapshot); await store.save(); await atomicWrite(path.resolve(process.cwd(), process.env.CLMM_POOL_SNAPSHOT_FILE || "data/clmm-pool-snapshot.json"), snapshot); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, pools: snapshot.pools.length }));
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
