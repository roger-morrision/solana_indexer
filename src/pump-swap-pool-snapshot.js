import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { IndexStore } from "./store.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";

export const PUMP_SWAP_PROGRAM = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
const POOL_DISCRIMINATOR = Buffer.from([241, 154, 109, 4, 17, 177, 109, 188]);
const POOL_ACCOUNT_LENGTH = 261;

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function accountBytes(account, label) { if (!Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`${label} must use base64 encoding`); return Buffer.from(account.data[0], "base64"); }
function i128(data, offset) { const value = (data.readBigUInt64LE(offset + 8) << 64n) | data.readBigUInt64LE(offset); return (value >= (1n << 127n) ? value - (1n << 128n) : value).toString(); }

export function decodePumpSwapPoolAccount(address, account) {
  if (account?.owner !== PUMP_SWAP_PROGRAM) throw new Error(`PumpSwap pool ${address} has unexpected owner`);
  const data = accountBytes(account, `PumpSwap pool ${address}`);
  if (data.length !== POOL_ACCOUNT_LENGTH || !data.subarray(0, 8).equals(POOL_DISCRIMINATOR)) throw new Error(`PumpSwap pool ${address} has invalid Pool account data`);
  if (data[243] > 1 || data[244] > 1) throw new Error(`PumpSwap pool ${address} has invalid mode flags`);
  return {
    address, programId: PUMP_SWAP_PROGRAM, poolBump: data[8], poolIndex: data.readUInt16LE(9), creator: base58(data.subarray(11, 43)), tokenMint0: base58(data.subarray(43, 75)), tokenMint1: base58(data.subarray(75, 107)), lpMint: base58(data.subarray(107, 139)), tokenVault0: base58(data.subarray(139, 171)), tokenVault1: base58(data.subarray(171, 203)), lpSupplyRaw: data.readBigUInt64LE(203).toString(), coinCreator: base58(data.subarray(211, 243)), mayhemMode: data[243] === 1, cashbackCoin: data[244] === 1, virtualQuoteReservesRaw: i128(data, 245), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex"),
  };
}

function parsedVault(account, expectedMint, label) {
  const info = account?.data?.parsed?.info, amount = info?.tokenAmount?.amount, decimals = info?.tokenAmount?.decimals;
  if (!account?.owner || info?.mint !== expectedMint || typeof info?.owner !== "string" || !/^\d+$/.test(amount ?? "") || !Number.isInteger(decimals) || decimals < 0 || decimals > 255) throw new Error(`${label} identity mismatch`);
  return { tokenProgram: account.owner, authority: info.owner, amountRaw: String(amount), decimals };
}

export async function createPumpSwapPoolSnapshot({ client, pools, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(pools) || !pools.length || new Set(pools).size !== pools.length || pools.some((pool) => typeof pool !== "string" || !pool)) throw new Error("PumpSwap pools must be unique non-empty addresses");
  const stateResponse = await getMultipleAccountsBatched(client, pools, { commitment: "finalized", encoding: "base64" }, { label: "PumpSwap pool" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateResponse.value?.length !== pools.length) throw new Error("invalid PumpSwap pool account response");
  const decoded = pools.map((address, index) => decodePumpSwapPoolAccount(address, stateResponse.value[index]));
  const vaultResponse = await getMultipleAccountsBatched(client, decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]), { commitment: "finalized", encoding: "jsonParsed", minContextSlot: stateSlot }, { label: "PumpSwap vault" }), balanceSlot = vaultResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < stateSlot || vaultResponse.value?.length !== decoded.length * 2) throw new Error("invalid PumpSwap vault response");
  decoded.forEach((row, index) => { const first = parsedVault(vaultResponse.value[index * 2], row.tokenMint0, `PumpSwap pool ${row.address} base vault`), second = parsedVault(vaultResponse.value[index * 2 + 1], row.tokenMint1, `PumpSwap pool ${row.address} quote vault`); row.tokenProgram0 = first.tokenProgram; row.tokenProgram1 = second.tokenProgram; row.vaultAuthority0 = first.authority; row.vaultAuthority1 = second.authority; row.vault0AmountRaw = first.amountRaw; row.vault1AmountRaw = second.amountRaw; row.mintDecimals0 = first.decimals; row.mintDecimals1 = second.decimals; });
  return { schemaVersion: 1, type: "pump_swap_pool_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, balanceSlot, observedAt, pools: decoded };
}

async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }
async function main() { const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"), pools = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "pump-swap").map(([address]) => address); if (!pools.length) throw new Error("no PumpSwap pools supplied or discovered"); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected), snapshot = await createPumpSwapPoolSnapshot({ client, pools, genesisHash }); if (!artifactOnly) { store.applyPumpSwapPoolSnapshot(snapshot); await store.save(); } await atomicWrite(config.pumpSwapPoolSnapshotFile, snapshot); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, pools: snapshot.pools.length, artifactOnly })); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
