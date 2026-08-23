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

export const OPENBOOK_V2_PROGRAM = "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb";
export const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const OPENBOOK_MARKET_DISCRIMINATOR = Buffer.from([219, 190, 213, 55, 0, 227, 198, 154]);
const MARKET_ACCOUNT_BYTES = 848, FEE_SCALE = 1_000_000n;

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function accountBytes(account, label) { if (!Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`${label} must use base64 encoding`); return Buffer.from(account.data[0], "base64"); }
function hash(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function u64(data, offset) { return data.readBigUInt64LE(offset).toString(); }
function u128(data, offset) { return ((data.readBigUInt64LE(offset + 8) << 64n) | data.readBigUInt64LE(offset)).toString(); }

export function decodeOpenBookMarketAccount(address, account) {
  if (account?.owner !== OPENBOOK_V2_PROGRAM) throw new Error(`OpenBook market ${address} has unexpected owner`);
  const data = accountBytes(account, `OpenBook market ${address}`);
  if (data.length !== MARKET_ACCOUNT_BYTES || !data.subarray(0, 8).equals(OPENBOOK_MARKET_DISCRIMINATOR)) throw new Error(`OpenBook market ${address} has invalid Market data`);
  const bump = data[8], baseDecimals = data[9], quoteDecimals = data[10], timeExpiry = data.readBigInt64LE(48), quoteLotSize = data.readBigInt64LE(448), baseLotSize = data.readBigInt64LE(456), registrationTime = data.readBigInt64LE(472), makerFee = data.readBigInt64LE(480), takerFee = data.readBigInt64LE(488);
  if (quoteLotSize <= 0n || baseLotSize <= 0n || makerFee < -FEE_SCALE || makerFee > FEE_SCALE || takerFee < 0n || takerFee > FEE_SCALE || makerFee < 0n && -makerFee > takerFee || timeExpiry < 0n || registrationTime < 0n) throw new Error(`OpenBook market ${address} has invalid economics`);
  const marketAuthority = base58(data.subarray(16, 48)), expectedAuthority = createProgramAddress(OPENBOOK_V2_PROGRAM, [Buffer.from("Market"), decodeBase58Address(address), Buffer.from([bump])]);
  if (marketAuthority !== expectedAuthority) throw new Error(`OpenBook market ${address} authority mismatch`);
  const tokenMint0 = base58(data.subarray(576, 608)), tokenMint1 = base58(data.subarray(608, 640)), tokenVault0 = base58(data.subarray(640, 672)), tokenVault1 = base58(data.subarray(680, 712)), bids = base58(data.subarray(200, 232)), asks = base58(data.subarray(232, 264)), eventHeap = base58(data.subarray(264, 296));
  if (tokenMint0 === tokenMint1 || tokenVault0 === tokenVault1 || new Set([address, bids, asks, eventHeap]).size !== 4) throw new Error(`OpenBook market ${address} has ambiguous identity`);
  const nameBytes = data.subarray(184, 200), zero = nameBytes.indexOf(0), name = nameBytes.subarray(0, zero < 0 ? nameBytes.length : zero).toString("utf8");
  if (!name || name.includes("\ufffd") || nameBytes.subarray(zero < 0 ? nameBytes.length : zero).some(Boolean)) throw new Error(`OpenBook market ${address} has invalid name`);
  return { address, programId: OPENBOOK_V2_PROGRAM, bump, marketAuthority, collectFeeAdmin: base58(data.subarray(56, 88)), name, bids, asks, eventHeap, orderbookCoverage: "unavailable_pending_bookside_decoder", tokenMint0, tokenMint1, tokenVault0, tokenVault1, mintDecimals0: baseDecimals, mintDecimals1: quoteDecimals, timeExpiryUnix: timeExpiry.toString(), quoteLotSizeRaw: quoteLotSize.toString(), baseLotSizeRaw: baseLotSize.toString(), sequenceNumberRaw: u64(data, 464), registrationTimeUnix: registrationTime.toString(), makerFeeMillionths: makerFee.toString(), takerFeeMillionths: takerFee.toString(), feesAccruedRaw: u128(data, 496), feesToReferrersRaw: u128(data, 512), referrerRebatesAccruedRaw: u64(data, 528), feesAvailableRaw: u64(data, 536), makerVolumeRaw: u128(data, 544), takerVolumeWithoutOpenOrdersRaw: u128(data, 560), baseDepositTotalRaw: u64(data, 672), quoteDepositTotalRaw: u64(data, 712), accountDataBytes: data.length, rawPayloadHash: hash(data) };
}

function parsedVault(account, expectedMint, label) { if (account?.owner !== SPL_TOKEN_PROGRAM) throw new Error(`${label} token program mismatch`); const info = account?.data?.parsed?.info; if (info?.mint !== expectedMint || !/^\d+$/.test(info?.tokenAmount?.amount ?? "") || !Number.isInteger(info?.tokenAmount?.decimals) || info.tokenAmount.decimals < 0 || info.tokenAmount.decimals > 255) throw new Error(`${label} identity mismatch`); return { amountRaw: info.tokenAmount.amount, decimals: info.tokenAmount.decimals, programId: account.owner }; }

export async function createOpenBookMarketSnapshot({ client, markets, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(markets) || !markets.length || new Set(markets).size !== markets.length) throw new Error("OpenBook markets must be a non-empty unique array");
  const stateResponse = await getMultipleAccountsBatched(client, markets, { commitment: "finalized", encoding: "base64" }, { label: "OpenBook market" }), stateSlot = stateResponse?.context?.slot;
  if (!Number.isSafeInteger(stateSlot) || stateSlot < 0 || stateResponse.value?.length !== markets.length) throw new Error("invalid OpenBook market response");
  const decoded = markets.map((address, index) => decodeOpenBookMarketAccount(address, stateResponse.value[index]));
  const vaultResponse = await getMultipleAccountsBatched(client, decoded.flatMap((row) => [row.tokenVault0, row.tokenVault1]), { commitment: "finalized", encoding: "jsonParsed", minContextSlot: stateSlot }, { label: "OpenBook vault" }), balanceSlot = vaultResponse?.context?.slot;
  if (!Number.isSafeInteger(balanceSlot) || balanceSlot < stateSlot || vaultResponse.value?.length !== decoded.length * 2) throw new Error("invalid OpenBook vault response");
  decoded.forEach((row, index) => { const base = parsedVault(vaultResponse.value[index * 2], row.tokenMint0, `OpenBook market ${row.address} base vault`), quote = parsedVault(vaultResponse.value[index * 2 + 1], row.tokenMint1, `OpenBook market ${row.address} quote vault`); if (base.decimals !== row.mintDecimals0 || quote.decimals !== row.mintDecimals1) throw new Error(`OpenBook market ${row.address} vault decimals mismatch`); Object.assign(row, { tokenProgram0: base.programId, tokenProgram1: quote.programId, vault0AmountRaw: base.amountRaw, vault1AmountRaw: quote.amountRaw }); });
  return { schemaVersion: 1, type: "openbook_market_snapshot", chain: "solana", genesisHash, commitment: "finalized", stateSlot, balanceSlot, observedAt, markets: decoded };
}

async function main() { const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"); assertSnapshotAcquisitionAllowed(store, { artifactOnly, requested }); const markets = requested.length ? requested : Object.entries(store.state.pools).filter(([, row]) => row.protocol === "openbook-v2").map(([address]) => address); if (!markets.length) throw new Error("no OpenBook markets supplied or discovered"); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected), snapshot = await createOpenBookMarketSnapshot({ client, markets, genesisHash }); if (!artifactOnly) { store.applyOpenBookMarketSnapshot(snapshot); await store.save(); } await durableAtomicWrite(config.openBookMarketSnapshotFile, `${JSON.stringify(snapshot)}\n`); console.log(JSON.stringify({ stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, markets: snapshot.markets.length, artifactOnly })); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
