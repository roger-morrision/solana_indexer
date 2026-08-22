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
export const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const POOL_DISCRIMINATOR = Buffer.from([241, 154, 109, 4, 17, 177, 109, 188]);
const POOL_ACCOUNT_LENGTH = 261;

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function base58Bytes(value) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", indexes = new Map([...alphabet].map((character, index) => [character, index])); if (typeof value !== "string" || !value) throw new Error("Solana address is invalid"); let number = 0n; for (const character of value) { const digit = indexes.get(character); if (digit == null) throw new Error("Solana address is invalid"); number = number * 58n + BigInt(digit); } const bytes = []; while (number) { bytes.unshift(Number(number & 255n)); number >>= 8n; } for (const character of value) { if (character !== "1") break; bytes.unshift(0); } const decoded = Buffer.from(bytes); if (decoded.length !== 32 || base58(decoded) !== value) throw new Error("Solana address is invalid"); return decoded; }
const ED25519_P = (1n << 255n) - 19n;
function mod(value) { const result = value % ED25519_P; return result < 0n ? result + ED25519_P : result; }
function modPow(base, exponent) { let result = 1n, factor = mod(base), power = exponent; while (power) { if (power & 1n) result = mod(result * factor); factor = mod(factor * factor); power >>= 1n; } return result; }
function onEd25519Curve(encoded) { let y = 0n; for (let index = 31; index >= 0; index--) y = (y << 8n) | BigInt(encoded[index]); const sign = y >> 255n; y &= (1n << 255n) - 1n; if (y >= ED25519_P) return false; const y2 = mod(y * y), d = mod(-121665n * modPow(121666n, ED25519_P - 2n)), x2 = mod((y2 - 1n) * modPow(d * y2 + 1n, ED25519_P - 2n)); return x2 === 0n ? sign === 0n : modPow(x2, (ED25519_P - 1n) / 2n) === 1n; }
function findProgramAddress(seeds, programId) { const program = base58Bytes(programId); for (let bump = 255; bump >= 0; bump--) { const digest = crypto.createHash("sha256").update(Buffer.concat([...seeds, Buffer.from([bump]), program, Buffer.from("ProgramDerivedAddress")])).digest(); if (!onEd25519Curve(digest)) return { address: base58(digest), bump }; } throw new Error("unable to derive Solana program address"); }
export function derivePumpPoolAuthority(baseMint) { return findProgramAddress([Buffer.from("pool-authority"), base58Bytes(baseMint)], PUMP_PROGRAM); }
function accountBytes(account, label) { if (!Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`${label} must use base64 encoding`); return Buffer.from(account.data[0], "base64"); }
function i128(data, offset) { const value = (data.readBigUInt64LE(offset + 8) << 64n) | data.readBigUInt64LE(offset); return (value >= (1n << 127n) ? value - (1n << 128n) : value).toString(); }
function exact(value, label, positive = false) { if (typeof value !== "string" || !/^\d+$/.test(value) || (positive && value === "0")) throw new Error(`${label} must be an exact ${positive ? "positive " : ""}integer string`); return BigInt(value); }
function fees(value, label) { const rates = ["lpFeeBps", "protocolFeeBps", "creatorFeeBps"].map((field) => exact(value?.[field], `${label} ${field}`)); if (rates.some((rate) => rate > 10_000n) || rates.reduce((sum, rate) => sum + rate, 0n) >= 10_000n) throw new Error(`${label} has invalid basis points`); return { lpFeeBps: rates[0].toString(), protocolFeeBps: rates[1].toString(), creatorFeeBps: rates[2].toString() }; }

export function pumpSwapPoolMarketCap({ baseMintSupplyRaw, baseReserveRaw, quoteReserveRaw }) { const supply = exact(baseMintSupplyRaw, "PumpSwap base mint supply", true), base = exact(baseReserveRaw, "PumpSwap base reserve", true), quote = exact(quoteReserveRaw, "PumpSwap quote reserve"); return (quote * supply / base).toString(); }

export function selectPumpSwapFees({ feeConfig, canonicalPumpPool, baseMintSupplyRaw, baseReserveRaw, quoteReserveRaw }) {
  if (typeof canonicalPumpPool !== "boolean" || !feeConfig) throw new Error("PumpSwap fee selection requires canonical identity and fee config");
  if (!canonicalPumpPool) return { source: "flat", marketCapLamportsRaw: null, ...fees(feeConfig.flatFees, "PumpSwap flat fees") };
  if (!Array.isArray(feeConfig.feeTiers) || !feeConfig.feeTiers.length || feeConfig.feeTiers.length > 256) throw new Error("PumpSwap canonical fee tiers are missing or excessive");
  const tiers = feeConfig.feeTiers.map((tier, index) => ({ threshold: exact(tier?.marketCapLamportsThresholdRaw, `PumpSwap fee tier ${index} threshold`), value: fees(tier?.fees, `PumpSwap fee tier ${index}`) })); for (let index = 1; index < tiers.length; index++) if (tiers[index].threshold <= tiers[index - 1].threshold) throw new Error("PumpSwap fee tiers must be strictly ascending");
  const marketCap = BigInt(pumpSwapPoolMarketCap({ baseMintSupplyRaw, baseReserveRaw, quoteReserveRaw })); let selected = tiers[0]; for (const tier of tiers) if (marketCap >= tier.threshold) selected = tier; else break; return { source: "market_cap_tier", marketCapLamportsRaw: marketCap.toString(), thresholdRaw: selected.threshold.toString(), ...selected.value };
}

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
function parsedMint(account, expectedProgram, label) { const info = account?.data?.parsed?.info, supply = info?.supply, decimals = info?.decimals; if (account?.owner !== expectedProgram || !/^\d+$/.test(supply ?? "") || !Number.isInteger(decimals) || decimals < 0 || decimals > 255) throw new Error(`${label} identity mismatch`); return { supplyRaw: String(supply), decimals }; }

export async function createPumpSwapPoolSnapshot({ client, pools, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(pools) || !pools.length || new Set(pools).size !== pools.length || pools.some((pool) => typeof pool !== "string" || !pool)) throw new Error("PumpSwap pools must be unique non-empty addresses");
  const stateResponse = await getMultipleAccountsBatched(client, pools, { commitment: "finalized", encoding: "base64" }, { label: "PumpSwap pool" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateResponse.value?.length !== pools.length) throw new Error("invalid PumpSwap pool account response");
  const decoded = pools.map((address, index) => decodePumpSwapPoolAccount(address, stateResponse.value[index]));
  const vaultResponse = await getMultipleAccountsBatched(client, decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1, row.tokenMint0]), { commitment: "finalized", encoding: "jsonParsed", minContextSlot: stateSlot }, { label: "PumpSwap vault and base mint" }), balanceSlot = vaultResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < stateSlot || vaultResponse.value?.length !== decoded.length * 3) throw new Error("invalid PumpSwap vault or mint response");
  decoded.forEach((row, index) => { const first = parsedVault(vaultResponse.value[index * 3], row.tokenMint0, `PumpSwap pool ${row.address} base vault`), second = parsedVault(vaultResponse.value[index * 3 + 1], row.tokenMint1, `PumpSwap pool ${row.address} quote vault`), mint = parsedMint(vaultResponse.value[index * 3 + 2], first.tokenProgram, `PumpSwap pool ${row.address} base mint`); if (mint.decimals !== first.decimals) throw new Error(`PumpSwap pool ${row.address} base mint decimals mismatch`); row.tokenProgram0 = first.tokenProgram; row.tokenProgram1 = second.tokenProgram; row.vaultAuthority0 = first.authority; row.vaultAuthority1 = second.authority; row.vault0AmountRaw = first.amountRaw; row.vault1AmountRaw = second.amountRaw; row.mintDecimals0 = first.decimals; row.mintDecimals1 = second.decimals; row.baseMintSupplyRaw = mint.supplyRaw; const authority = derivePumpPoolAuthority(row.tokenMint0); row.canonicalPoolAuthority = authority.address; row.canonicalPoolAuthorityBump = authority.bump; row.canonicalPumpPool = authority.address === row.creator; });
  return { schemaVersion: 1, type: "pump_swap_pool_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, balanceSlot, observedAt, pools: decoded };
}

async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }
async function main() { const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"), pools = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "pump-swap").map(([address]) => address); if (!pools.length) throw new Error("no PumpSwap pools supplied or discovered"); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected), snapshot = await createPumpSwapPoolSnapshot({ client, pools, genesisHash }); if (!artifactOnly) { store.applyPumpSwapPoolSnapshot(snapshot); await store.save(); } await atomicWrite(config.pumpSwapPoolSnapshotFile, snapshot); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, pools: snapshot.pools.length, artifactOnly })); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
