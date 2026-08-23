function f64Bits(raw) { const data = Buffer.alloc(8); data.writeBigUInt64LE(BigInt(raw)); return data.readDoubleLE(); }
function saturatingI64Add(left, right) { const value = left + right, minimum = -(1n << 63n), maximum = (1n << 63n) - 1n; return value < minimum ? minimum : value > maximum ? maximum : value; }

export function evaluateOpenBookOraclePolicy(market, oracleSlot) {
  const evidence = [market.oracleEvidenceA, market.oracleEvidenceB].filter(Boolean), unsupported = { valid: false, reason: "oracle_not_configured_or_supported", oraclePriceLots: null };
  if (!evidence.length || evidence.some((row) => !["pyth_legacy", "raydium_clmm", "switchboard_v2"].includes(row.provider)) || evidence.length !== (market.oracleB ? 2 : 1) || !Number.isSafeInteger(oracleSlot) || oracleSlot < 0) return unsupported;
  const confidenceFilter = f64Bits(market.oracleConfidenceFilterBitsRaw), maximumStaleness = BigInt(market.oracleMaxStalenessSlots);
  if (!Number.isFinite(confidenceFilter) || confidenceFilter < 0) return { ...unsupported, reason: "invalid_oracle_policy" };
  const values = evidence.map((row) => row.provider === "pyth_legacy" ? { price: Number(BigInt(row.priceRaw)) * (10 ** row.exponent), deviation: Number(BigInt(row.confidenceRaw)) * (10 ** row.exponent), slot: BigInt(row.lastUpdateSlotRaw) } : row.provider === "switchboard_v2" ? { price: Number(BigInt(row.resultMantissaRaw)) / (10 ** row.resultScale), deviation: Number(BigInt(row.standardDeviationMantissaRaw)) / (10 ** row.standardDeviationScale), slot: BigInt(row.lastUpdateSlotRaw) } : { price: (Number(BigInt(row.squaredPriceX64Raw)) / (2 ** 64)) * (10 ** row.decimalExponent), deviation: 0, slot: (1n << 64n) - 1n });
  if (values.some(({ price, deviation }) => !Number.isFinite(price) || price <= 0 || !Number.isFinite(deviation) || deviation < 0)) return { ...unsupported, reason: "invalid_oracle_value" };
  if (maximumStaleness >= 0n && values.some((row) => row.slot + maximumStaleness < BigInt(oracleSlot))) return { ...unsupported, reason: "stale_oracle" };
  const confidenceValid = values.length === 1 ? values[0].deviation <= confidenceFilter * values[0].price : ((values[0].deviation / values[0].price) ** 2) + ((values[1].deviation / values[1].price) ** 2) <= confidenceFilter ** 2;
  if (!confidenceValid) return { ...unsupported, reason: "low_confidence_oracle" };
  const price = (values.length === 1 ? values[0].price : values[0].price / values[1].price) * (10 ** (market.mintDecimals1 - market.mintDecimals0));
  const lots = Math.trunc(price * Number(BigInt(market.baseLotSizeRaw)) / Number(BigInt(market.quoteLotSizeRaw)));
  if (!Number.isSafeInteger(lots) || lots < 1) return { ...unsupported, reason: "invalid_oracle_price_lots" };
  return { valid: true, reason: null, oraclePriceLots: String(lots), providers: evidence.map((row) => row.provider), source: values.length === 1 ? "oracle_a" : "oracle_a_divided_by_b" };
}

export function projectOpenBookPeggedOrder(order, side, oraclePriceLots) {
  const price = saturatingI64Add(BigInt(oraclePriceLots), BigInt(order.priceOffsetLots)), limit = BigInt(order.pegLimitLots), maximum = (1n << 63n) - 1n, inRange = price >= 1n && price < maximum, violatesLimit = limit !== -1n && (side === "bids" ? price > limit : price < limit);
  return { ...order, priceLots: price.toString(), oraclePegState: !inRange ? "skipped" : violatesLimit ? "invalid" : "valid", executable: inRange && !violatesLimit };
}
