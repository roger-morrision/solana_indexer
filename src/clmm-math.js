const Q64 = 1n << 64n;
const FEE_DENOMINATOR = 1_000_000n;
const MAX_U64 = (1n << 64n) - 1n;
const MAX_U128 = (1n << 128n) - 1n;
const MIN_RAYDIUM_TICK = -443_636;
const MAX_RAYDIUM_TICK = 443_636;
const RAYDIUM_TICK_FACTORS = [
  0xfffcb933bd6fb800n, 0xfff97272373d4000n, 0xfff2e50f5f657000n,
  0xffe5caca7e10f000n, 0xffcb9843d60f7000n, 0xff973b41fa98e800n,
  0xff2ea16466c9b000n, 0xfe5dee046a9a3800n, 0xfcbe86c7900bb000n,
  0xf987a7253ac65800n, 0xf3392b0822bb6000n, 0xe7159475a2caf000n,
  0xd097f3bdfd2f2000n, 0xa9f746462d9f8000n, 0x70d869a156f31c00n,
  0x31be135f97ed3200n, 0x09aa508b5b85a500n, 0x005d6af8dedc582cn,
  0x00002216e584f5fan,
];

function integer(value, label, { positive = false, maximum = null } = {}) {
  let parsed;
  try { parsed = BigInt(value); } catch { throw new Error(`${label} must be an integer`); }
  if (parsed < 0n || (positive && parsed === 0n) || (maximum !== null && parsed > maximum)) throw new Error(`${label} is out of range`);
  return parsed;
}

export function ceilDiv(numerator, denominator) {
  if (numerator < 0n || denominator <= 0n) throw new Error("ceilDiv requires non-negative numerator and positive denominator");
  return numerator === 0n ? 0n : ((numerator - 1n) / denominator) + 1n;
}

export function raydiumSqrtPriceX64AtTick(tick) {
  if (!Number.isInteger(tick) || tick < MIN_RAYDIUM_TICK || tick > MAX_RAYDIUM_TICK) throw new Error("Raydium tick is out of range");
  const absolute = Math.abs(tick);
  let ratio = (absolute & 1) === 0 ? Q64 : RAYDIUM_TICK_FACTORS[0];
  for (let bit = 1; bit < RAYDIUM_TICK_FACTORS.length; bit++) if ((absolute & (1 << bit)) !== 0) ratio = (ratio * RAYDIUM_TICK_FACTORS[bit]) >> 64n;
  return tick > 0 ? ((1n << 128n) - 1n) / ratio : ratio;
}

function amount0Delta(lower, upper, liquidity, roundUp) {
  const numerator = (liquidity << 64n) * (upper - lower), denominator = upper * lower;
  return roundUp ? ceilDiv(numerator, denominator) : numerator / denominator;
}

function amount1Delta(lower, upper, liquidity, roundUp) {
  const numerator = liquidity * (upper - lower);
  return roundUp ? ceilDiv(numerator, Q64) : numerator / Q64;
}

export function computeStaticFeeExactInputStep({ sqrtPriceX64, targetSqrtPriceX64, liquidity, amountRemaining, feeRateMillionths, zeroForOne }) {
  const current = integer(sqrtPriceX64, "sqrtPriceX64", { positive: true });
  const target = integer(targetSqrtPriceX64, "targetSqrtPriceX64", { positive: true });
  const activeLiquidity = integer(liquidity, "liquidity", { positive: true });
  const remaining = integer(amountRemaining, "amountRemaining", { maximum: MAX_U64 });
  const fee = integer(feeRateMillionths, "feeRateMillionths");
  if (fee >= FEE_DENOMINATOR) throw new Error("feeRateMillionths is out of range");
  if (typeof zeroForOne !== "boolean") throw new Error("zeroForOne must be boolean");
  if ((zeroForOne && target >= current) || (!zeroForOne && target <= current)) throw new Error("target price is inconsistent with swap direction");

  const available = remaining * (FEE_DENOMINATOR - fee) / FEE_DENOMINATOR;
  const lower = zeroForOne ? target : current, upper = zeroForOne ? current : target;
  const targetInput = zeroForOne ? amount0Delta(lower, upper, activeLiquidity, true) : amount1Delta(lower, upper, activeLiquidity, true);
  const reachedTarget = available >= targetInput;
  let next;
  if (reachedTarget) next = target;
  else if (zeroForOne) next = ceilDiv((activeLiquidity << 64n) * current, (activeLiquidity << 64n) + (available * current));
  else next = current + (available << 64n) / activeLiquidity;

  const stepLower = zeroForOne ? next : current, stepUpper = zeroForOne ? current : next;
  const amountIn = zeroForOne ? amount0Delta(stepLower, stepUpper, activeLiquidity, true) : amount1Delta(stepLower, stepUpper, activeLiquidity, true);
  const amountOut = zeroForOne ? amount1Delta(stepLower, stepUpper, activeLiquidity, false) : amount0Delta(stepLower, stepUpper, activeLiquidity, false);
  const feeAmount = reachedTarget ? ceilDiv(amountIn * fee, FEE_DENOMINATOR - fee) : remaining - amountIn;
  if (amountIn + feeAmount > remaining) throw new Error("swap step rounding exceeds remaining input");
  return { nextSqrtPriceX64: next.toString(), amountIn: amountIn.toString(), amountOut: amountOut.toString(), feeAmount: feeAmount.toString(), reachedTarget };
}

function normalizedTicks(initializedTicks, tickSpacing) {
  if (!Array.isArray(initializedTicks) || !Number.isInteger(tickSpacing) || tickSpacing <= 0) throw new Error("initialized tick coverage is invalid");
  const seen = new Set(), rows = initializedTicks.map((row) => {
    if (!Number.isInteger(row?.tick) || row.tick % tickSpacing !== 0 || !/^-?\d+$/.test(row?.liquidityNetRaw ?? "") || !/^\d+$/.test(row?.liquidityGrossRaw ?? "") || BigInt(row.liquidityGrossRaw) === 0n || seen.has(row.tick)) throw new Error("initialized tick is invalid");
    seen.add(row.tick); return { tick: row.tick, liquidityNet: BigInt(row.liquidityNetRaw) };
  });
  return rows.sort((left, right) => left.tick - right.tick);
}

export function quoteRaydiumStaticFeeExactInput({ sqrtPriceX64, currentTick, liquidity, amountIn, feeRateMillionths, zeroForOne, limitTick, tickSpacing, initializedTicks, coverageMinTick, coverageMaxTickExclusive, transferFeeAmount = 0 }) {
  if (!Number.isInteger(currentTick) || !Number.isInteger(limitTick) || !Number.isInteger(coverageMinTick) || !Number.isInteger(coverageMaxTickExclusive) || coverageMinTick >= coverageMaxTickExclusive) throw new Error("tick coverage bounds are invalid");
  if (typeof zeroForOne !== "boolean" || (zeroForOne ? limitTick >= currentTick : limitTick <= currentTick)) throw new Error("limit tick is inconsistent with swap direction");
  if (currentTick < coverageMinTick || currentTick >= coverageMaxTickExclusive || limitTick < coverageMinTick || limitTick >= coverageMaxTickExclusive) throw new Error("quote range is not covered by the finalized tick snapshot");
  if (integer(transferFeeAmount, "transferFeeAmount") !== 0n) throw new Error("Token-2022 transfer-fee quoting is unsupported");
  const ticks = normalizedTicks(initializedTicks, tickSpacing), limitPrice = raydiumSqrtPriceX64AtTick(limitTick);
  let price = integer(sqrtPriceX64, "sqrtPriceX64", { positive: true }), activeLiquidity = integer(liquidity, "liquidity", { positive: true, maximum: MAX_U128 });
  let remaining = integer(amountIn, "amountIn", { maximum: MAX_U64 }), totalIn = 0n, totalOut = 0n, totalFee = 0n, crossedTicks = 0;
  if ((zeroForOne && price <= limitPrice) || (!zeroForOne && price >= limitPrice)) throw new Error("limit price is inconsistent with current price");
  const candidates = ticks.filter((row) => zeroForOne ? row.tick <= currentTick && row.tick > limitTick : row.tick > currentTick && row.tick < limitTick);
  if (zeroForOne) candidates.reverse();
  let candidateIndex = 0;
  while (remaining > 0n && price !== limitPrice) {
    const nextTick = candidates[candidateIndex] ?? null, target = nextTick ? raydiumSqrtPriceX64AtTick(nextTick.tick) : limitPrice;
    if (nextTick && target === price) {
      activeLiquidity = zeroForOne ? activeLiquidity - nextTick.liquidityNet : activeLiquidity + nextTick.liquidityNet;
      if (activeLiquidity <= 0n || activeLiquidity > MAX_U128) throw new Error("initialized tick crossing produces invalid liquidity");
      crossedTicks++; candidateIndex++; continue;
    }
    const step = computeStaticFeeExactInputStep({ sqrtPriceX64: price, targetSqrtPriceX64: target, liquidity: activeLiquidity, amountRemaining: remaining, feeRateMillionths, zeroForOne });
    const consumed = BigInt(step.amountIn) + BigInt(step.feeAmount);
    if (consumed === 0n) throw new Error("CLMM quote made no progress");
    price = BigInt(step.nextSqrtPriceX64); remaining -= consumed; totalIn += BigInt(step.amountIn); totalOut += BigInt(step.amountOut); totalFee += BigInt(step.feeAmount);
    if (nextTick && step.reachedTarget) {
      activeLiquidity = zeroForOne ? activeLiquidity - nextTick.liquidityNet : activeLiquidity + nextTick.liquidityNet;
      if (activeLiquidity <= 0n || activeLiquidity > MAX_U128) throw new Error("initialized tick crossing produces invalid liquidity");
      crossedTicks++; candidateIndex++;
    } else break;
  }
  return { status: remaining === 0n ? "quoted" : "price_limit_reached", amountSpecifiedRaw: BigInt(amountIn).toString(), amountInRaw: totalIn.toString(), amountOutRaw: totalOut.toString(), feeAmountRaw: totalFee.toString(), amountUnconsumedRaw: remaining.toString(), endSqrtPriceX64: price.toString(), endLiquidityRaw: activeLiquidity.toString(), crossedTicks, fullyConsumed: remaining === 0n };
}

export const CLMM_MATH_CONSTANTS = Object.freeze({ Q64: Q64.toString(), feeDenominator: FEE_DENOMINATOR.toString(), minRaydiumTick: MIN_RAYDIUM_TICK, maxRaydiumTick: MAX_RAYDIUM_TICK });
