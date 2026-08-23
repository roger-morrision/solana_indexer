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

export const PHOENIX_PROGRAM = "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY";
export const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const PHOENIX_MARKET_HEADER_DISCRIMINANT = 8_167_313_896_524_341_111n;
const HEADER_BYTES = 576;

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function bytes(account, label) { if (!Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`${label} must use base64 encoding`); return Buffer.from(account.data[0], "base64"); }
function hash(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function u64(data, offset) { return data.readBigUInt64LE(offset).toString(); }

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
  return { address, programId: PHOENIX_PROGRAM, status: Number(status), bidsSize: bidsSize.toString(), asksSize: asksSize.toString(), numSeats: numSeats.toString(), tokenMint0, tokenMint1, tokenVault0, tokenVault1, tokenProgram0: SPL_TOKEN_PROGRAM, tokenProgram1: SPL_TOKEN_PROGRAM, mintDecimals0: baseDecimals, mintDecimals1: quoteDecimals, baseLotSizeRaw: baseLotSize.toString(), quoteLotSizeRaw: quoteLotSize.toString(), tickSizeInQuoteAtomsPerBaseUnitRaw: tickSize.toString(), baseLotsPerBaseUnit: baseLotsPerBaseUnit.toString(), quoteLotsPerBaseUnitPerTick: quoteLotsPerBaseUnitPerTick.toString(), orderSequenceNumber: orderSequenceNumber.toString(), takerFeeBasisPoints: takerFeeBasisPoints.toString(), collectedQuoteLotFees: collectedQuoteLotFees.toString(), unclaimedQuoteLotFees: unclaimedQuoteLotFees.toString(), authority: base58(data.subarray(208, 240)), feeRecipient: base58(data.subarray(240, 272)), marketSequenceNumber: u64(data, 272), successor: base58(data.subarray(280, 312)), rawBaseUnitsPerBaseUnit, accountDataBytes: data.length, rawPayloadHash: hash(data) };
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
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
