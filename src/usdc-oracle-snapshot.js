#!/usr/bin/env node
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isInvokedFile } from "./invoked-file.js";
import { loadConfig } from "./config.js";
import { durableAtomicWrite } from "./durable-file.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { compileUsdDepegReference, MAINNET_USDC_MINT } from "./usd-depeg-reference.js";

const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const FEED_ID = /^[0-9a-f]{64}$/;
const DISCRIMINATOR = crypto.createHash("sha256").update("account:PriceUpdateV2").digest().subarray(0, 8);
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
function exactPrice(price, exponent) { if (price <= 0n || !Number.isInteger(exponent) || exponent < -18 || exponent > 18) throw new Error("invalid Pyth USDC/USD price"); let numerator = price, denominator = 1n; if (exponent < 0) denominator = 10n ** BigInt(-exponent); else numerator *= 10n ** BigInt(exponent); const divisor = gcd(numerator, denominator); return { numeratorRaw: (numerator / divisor).toString(), denominatorRaw: (denominator / divisor).toString() }; }

export function decodePythPriceUpdateV2(account, expectedProgram, expectedFeedId) {
  if (!ADDRESS.test(expectedProgram ?? "") || !FEED_ID.test(expectedFeedId ?? "") || account?.owner !== expectedProgram || !Array.isArray(account.data) || account.data[1] !== "base64") throw new Error("invalid Pyth USDC/USD account identity");
  const data = Buffer.from(account.data[0], "base64"); if (data.length !== 134 || !data.subarray(0, 8).equals(DISCRIMINATOR)) throw new Error("invalid Pyth PriceUpdateV2 account layout");
  if (data[40] !== 1) throw new Error("Pyth price update is not fully verified");
  const offset = 41, feedId = data.subarray(offset, offset + 32).toString("hex"); if (feedId !== expectedFeedId) throw new Error("Pyth USDC/USD feed identity mismatch");
  const price = data.readBigInt64LE(offset + 32), confidence = data.readBigUInt64LE(offset + 40), exponent = data.readInt32LE(offset + 48), publishTime = data.readBigInt64LE(offset + 52), previousPublishTime = data.readBigInt64LE(offset + 60), emaPrice = data.readBigInt64LE(offset + 68), emaConfidence = data.readBigUInt64LE(offset + 76), postedSlot = data.readBigUInt64LE(offset + 84);
  if (publishTime < 0n || publishTime > BigInt(Number.MAX_SAFE_INTEGER) || previousPublishTime < 0n || previousPublishTime > publishTime || postedSlot > BigInt(Number.MAX_SAFE_INTEGER) || confidence * 10_000n > price * 100n || data[133] !== 0) throw new Error("invalid Pyth USDC/USD evidence");
  return { feedId, verificationLevel: "full", priceRaw: price.toString(), confidenceRaw: confidence.toString(), exponent, publishTime: Number(publishTime), previousPublishTime: Number(previousPublishTime), emaPriceRaw: emaPrice.toString(), emaConfidenceRaw: emaConfidence.toString(), postedSlot: Number(postedSlot), price: exactPrice(price, exponent), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

export async function createUsdDepegReference({ client, genesisHash, sourceProgram, sourceAccount, feedId, maximumAgeSeconds = 120, now = Date.now() }) {
  if (genesisHash !== MAINNET_GENESIS_HASH || !ADDRESS.test(sourceProgram ?? "") || !ADDRESS.test(sourceAccount ?? "") || !FEED_ID.test(feedId ?? "") || !Number.isInteger(maximumAgeSeconds) || maximumAgeSeconds < 10 || maximumAgeSeconds > 3_600 || !Number.isSafeInteger(now) || now < 0) throw new Error("invalid USDC/USD oracle snapshot configuration");
  const response = await client.call("getAccountInfo", [sourceAccount, { commitment: "finalized", encoding: "base64" }]); if (!Number.isSafeInteger(response?.context?.slot) || response.context.slot < 0 || !response.value) throw new Error("invalid finalized Pyth account response");
  const decoded = decodePythPriceUpdateV2(response.value, sourceProgram, feedId), observedSeconds = Math.floor(now / 1_000); if (decoded.postedSlot > response.context.slot || decoded.publishTime > observedSeconds + 5 || decoded.publishTime + maximumAgeSeconds < observedSeconds) throw new Error("stale or future Pyth USDC/USD evidence");
  return compileUsdDepegReference({ schemaVersion: 2, chain: "solana-mainnet", genesisHash, assetMint: MAINNET_USDC_MINT, quote: "USD", commitment: "finalized", sourceType: "independent_onchain_oracle", sourceProgram, sourceAccount, sourceSlot: response.context.slot, price: decoded.price, observedAt: new Date(now).toISOString(), expiresAt: new Date((decoded.publishTime + maximumAgeSeconds) * 1_000).toISOString(), oracleEvidence: { ...decoded, maximumAgeSeconds } });
}

async function atomicWrite(filename, value) { await durableAtomicWrite(filename, `${JSON.stringify(value)}\n`); }
async function main() { const config = loadConfig(), sourceProgram = process.env.USDC_ORACLE_SOURCE_PROGRAM, sourceAccount = process.env.USDC_ORACLE_SOURCE_ACCOUNT, feedId = process.env.USDC_ORACLE_FEED_ID?.replace(/^0x/, "").toLowerCase(); if (!ADDRESS.test(sourceProgram ?? "") || !ADDRESS.test(sourceAccount ?? "") || !FEED_ID.test(feedId ?? "")) throw new Error("USDC oracle source program, account, and feed ID are required"); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), genesisHash = await client.assertGenesis(process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH), reference = await createUsdDepegReference({ client, genesisHash, sourceProgram, sourceAccount, feedId, maximumAgeSeconds: config.usdcOracleMaximumAgeSeconds }); await atomicWrite(config.usdDepegReferenceFile, reference); console.log(JSON.stringify({ sourceSlot: reference.sourceSlot, postedSlot: reference.oracleEvidence.postedSlot, publishTime: reference.oracleEvidence.publishTime, expiresAt: reference.expiresAt })); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (isInvokedFile(invokedFile, fileURLToPath(import.meta.url))) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
