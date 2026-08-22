import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { derivePumpBondingCurve, derivePumpGlobal, PUMP_PROGRAM } from "./pump-swap-pool-snapshot.js";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";
import { IndexStore } from "./store.js";

const BONDING_CURVE_DISCRIMINATOR = Buffer.from([23, 183, 248, 55, 96, 216, 172, 96]);
const GLOBAL_DISCRIMINATOR = Buffer.from([167, 232, 232, 177, 200, 108, 114, 127]);
const BONDING_CURVE_SERIALIZED_LENGTH = 115;
const MAX_EXTENDED_ACCOUNT_LENGTH = 10_240;
const GLOBAL_ACCOUNT_LENGTH = 1045;
const MAX_BPS = 10_000n;

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function accountBytes(account, label) { if (!Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`${label} must use base64 encoding`); return Buffer.from(account.data[0], "base64"); }
function publicKeys(data, offset, count) { return Array.from({ length: count }, (_, index) => base58(data.subarray(offset + index * 32, offset + (index + 1) * 32))); }

export function decodePumpBondingCurveAccount(mint, address, account) {
  if (derivePumpBondingCurve(mint).address !== address) throw new Error(`Pump bonding curve ${address} is not canonical for mint ${mint}`);
  if (account?.owner !== PUMP_PROGRAM) throw new Error(`Pump bonding curve ${address} has unexpected owner`);
  const data = accountBytes(account, `Pump bonding curve ${address}`);
  if (data.length < BONDING_CURVE_SERIALIZED_LENGTH || data.length > MAX_EXTENDED_ACCOUNT_LENGTH || data.subarray(BONDING_CURVE_SERIALIZED_LENGTH).some((byte) => byte !== 0) || !data.subarray(0, 8).equals(BONDING_CURVE_DISCRIMINATOR) || data[48] > 1 || data[81] > 1 || data[82] > 1) throw new Error(`Pump bonding curve ${address} has invalid data`);
  return { address, programId: PUMP_PROGRAM, mint, virtualTokenReservesRaw: data.readBigUInt64LE(8).toString(), virtualQuoteReservesRaw: data.readBigUInt64LE(16).toString(), realTokenReservesRaw: data.readBigUInt64LE(24).toString(), realQuoteReservesRaw: data.readBigUInt64LE(32).toString(), tokenTotalSupplyRaw: data.readBigUInt64LE(40).toString(), complete: data[48] === 1, creator: base58(data.subarray(49, 81)), mayhemMode: data[81] === 1, cashbackCoin: data[82] === 1, quoteMint: base58(data.subarray(83, 115)), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

export function decodePumpGlobalAccount(address, account) {
  if (derivePumpGlobal().address !== address) throw new Error(`Pump Global ${address} is not canonical`);
  if (account?.owner !== PUMP_PROGRAM) throw new Error(`Pump Global ${address} has unexpected owner`);
  const data = accountBytes(account, `Pump Global ${address}`);
  if (data.length !== GLOBAL_ACCOUNT_LENGTH || !data.subarray(0, 8).equals(GLOBAL_DISCRIMINATOR) || data[8] > 1 || data[145] > 1 || data[450] > 1 || data[515] > 1 || data[740] > 1) throw new Error(`Pump Global ${address} has invalid data`);
  const feeBasisPoints = data.readBigUInt64LE(105), creatorFeeBasisPoints = data.readBigUInt64LE(154), buybackBasisPoints = data.readBigUInt64LE(997); if ([feeBasisPoints, creatorFeeBasisPoints, buybackBasisPoints].some((value) => value > MAX_BPS)) throw new Error(`Pump Global ${address} has invalid fee basis points`);
  return { address, initialized: data[8] === 1, authority: base58(data.subarray(9, 41)), feeRecipient: base58(data.subarray(41, 73)), initialVirtualTokenReservesRaw: data.readBigUInt64LE(73).toString(), initialVirtualQuoteReservesRawLegacy: data.readBigUInt64LE(81).toString(), initialRealTokenReservesRaw: data.readBigUInt64LE(89).toString(), tokenTotalSupplyRaw: data.readBigUInt64LE(97).toString(), feeBasisPoints: feeBasisPoints.toString(), withdrawAuthority: base58(data.subarray(113, 145)), enableMigrate: data[145] === 1, poolMigrationFeeRaw: data.readBigUInt64LE(146).toString(), creatorFeeBasisPoints: creatorFeeBasisPoints.toString(), feeRecipients: publicKeys(data, 162, 7), setCreatorAuthority: base58(data.subarray(386, 418)), adminSetCreatorAuthority: base58(data.subarray(418, 450)), createV2Enabled: data[450] === 1, whitelistPda: base58(data.subarray(451, 483)), reservedFeeRecipient: base58(data.subarray(483, 515)), mayhemModeEnabled: data[515] === 1, reservedFeeRecipients: publicKeys(data, 516, 7), isCashbackEnabled: data[740] === 1, buybackFeeRecipients: publicKeys(data, 741, 8), buybackBasisPoints: buybackBasisPoints.toString(), initialVirtualQuoteReservesRaw: data.readBigUInt64LE(1005).toString(), whitelistedQuoteMints: publicKeys(data, 1013, 1), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

export async function createPumpBondingCurveSnapshot({ client, mints, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(mints) || !mints.length || new Set(mints).size !== mints.length) throw new Error("Pump bonding-curve mints must be unique non-empty addresses");
  const addresses = mints.map((mint) => derivePumpBondingCurve(mint).address), stateResponse = await getMultipleAccountsBatched(client, addresses, { commitment: "finalized", encoding: "base64" }, { label: "Pump bonding curve" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateResponse.value?.length !== addresses.length) throw new Error("invalid Pump bonding-curve account response");
  const curves = mints.map((mint, index) => decodePumpBondingCurveAccount(mint, addresses[index], stateResponse.value[index])), globalAddress = derivePumpGlobal().address, configResponse = await getMultipleAccountsBatched(client, [globalAddress], { commitment: "finalized", encoding: "base64", minContextSlot: stateSlot }, { label: "Pump Global" }), configSlot = configResponse?.context?.slot;
  if (!Number.isSafeInteger(configSlot) || configSlot < stateSlot || configResponse.value?.length !== 1) throw new Error("invalid Pump Global response");
  return { schemaVersion: 1, type: "pump_bonding_curve_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, configSlot, observedAt, global: decodePumpGlobalAccount(globalAddress, configResponse.value[0]), curves };
}

async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }
async function main() { const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"), mints = requested.length ? requested : [...new Set(Object.values(store.state.pools).filter((row) => row.protocol === "pump-bonding-curve" && row.baseMint).map((row) => row.baseMint))]; if (!mints.length) throw new Error("no Pump bonding-curve mints supplied or discovered"); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected), snapshot = await createPumpBondingCurveSnapshot({ client, mints, genesisHash }); await atomicWrite(config.pumpBondingCurveSnapshotFile, snapshot); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, configSlot: snapshot.configSlot, curves: snapshot.curves.length, artifactOnly: true })); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
