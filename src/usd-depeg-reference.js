import fs from "node:fs/promises";

export const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const exact = (value) => typeof value === "string" && /^\d+$/.test(value) && BigInt(value) > 0n;
const address = (value) => typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);

export function compileUsdDepegReference(value) {
  if (value?.schemaVersion !== 1 || value.chain !== "solana-mainnet" || value.genesisHash !== MAINNET_GENESIS_HASH || value.assetMint !== MAINNET_USDC_MINT || value.quote !== "USD" || value.commitment !== "finalized" || value.sourceType !== "independent_onchain_oracle" || !address(value.sourceProgram) || !address(value.sourceAccount) || !Number.isSafeInteger(value.sourceSlot) || value.sourceSlot < 0 || !exact(value.price?.numeratorRaw) || !exact(value.price?.denominatorRaw) || !Number.isFinite(Date.parse(value.observedAt ?? "")) || !Number.isFinite(Date.parse(value.expiresAt ?? "")) || Date.parse(value.expiresAt) <= Date.parse(value.observedAt)) throw new Error("invalid independent USD depeg reference");
  return Object.freeze({ schemaVersion: 1, chain: value.chain, genesisHash: value.genesisHash, assetMint: value.assetMint, quote: value.quote, commitment: value.commitment, sourceType: value.sourceType, sourceProgram: value.sourceProgram, sourceAccount: value.sourceAccount, sourceSlot: value.sourceSlot, price: Object.freeze({ numeratorRaw: value.price.numeratorRaw, denominatorRaw: value.price.denominatorRaw }), observedAt: new Date(value.observedAt).toISOString(), expiresAt: new Date(value.expiresAt).toISOString() });
}

export function assessUsdDepegReference(reference, now = Date.now(), maxDeviationBasisPoints = 200) {
  if (!Number.isInteger(maxDeviationBasisPoints) || maxDeviationBasisPoints < 1 || maxDeviationBasisPoints > 5_000) throw new Error("invalid USDC deviation limit");
  if (!reference) return { healthy: false, reason: "independent_usdc_reference_unavailable", price: null, evidence: null };
  let compiled; try { compiled = compileUsdDepegReference(reference); } catch { return { healthy: false, reason: "independent_usdc_reference_invalid", price: null, evidence: null }; }
  const observed = Date.parse(compiled.observedAt), expires = Date.parse(compiled.expiresAt); if (observed > now) return { healthy: false, reason: "independent_usdc_reference_clock_skew", price: compiled.price, evidence: compiled }; if (expires < now) return { healthy: false, reason: "independent_usdc_reference_stale", price: compiled.price, evidence: compiled };
  const numerator = BigInt(compiled.price.numeratorRaw), denominator = BigInt(compiled.price.denominatorRaw), deviation = numerator > denominator ? numerator - denominator : denominator - numerator, withinPeg = deviation * 10_000n <= denominator * BigInt(maxDeviationBasisPoints);
  return { healthy: withinPeg, reason: withinPeg ? null : "usdc_depeg_limit_exceeded", price: compiled.price, deviation: { numeratorRaw: deviation.toString(), denominatorRaw: denominator.toString(), maxBasisPoints: maxDeviationBasisPoints }, evidence: compiled };
}

export async function loadUsdDepegReference(filename) { if (!filename) return null; let value; try { value = JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return null; throw new Error("invalid independent USD depeg reference file"); } return compileUsdDepegReference(value); }
