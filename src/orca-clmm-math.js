import { computeStaticFeeExactInputStep } from "./clmm-math.js";
import { ORCA_WHIRLPOOL_PROGRAM } from "./orca-pool-snapshot.js";
import { validateBoundPoolMintEvidence } from "./pool-mint-evidence.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";

const Q64 = 1n << 64n;
const Q96 = 1n << 96n;
const FEE_DENOMINATOR = 1_000_000n;
const MAX_U64 = (1n << 64n) - 1n;
const MAX_U128 = (1n << 128n) - 1n;
const MIN_ORCA_TICK = -443_636;
const MAX_ORCA_TICK = 443_636;
const LEGACY_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const POSITIVE_FACTORS = [79232123823359799118286999567n, 79236085330515764027303304731n, 79244008939048815603706035061n, 79259858533276714757314932305n, 79291567232598584799939703904n, 79355022692464371645785046466n, 79482085999252804386437311141n, 79736823300114093921829183326n, 80248749790819932309965073892n, 81282483887344747381513967011n, 83390072131320151908154831281n, 87770609709833776024991924138n, 97234110755111693312479820773n, 119332217159966728226237229890n, 179736315981702064433883588727n, 407748233172238350107850275304n, 2098478828474011932436660412517n, 55581415166113811149459800483533n, 38992368544603139932233054999993551n];
const NEGATIVE_FACTORS = [18445821805675392311n, 18444899583751176498n, 18443055278223354162n, 18439367220385604838n, 18431993317065449817n, 18417254355718160513n, 18387811781193591352n, 18329067761203520168n, 18212142134806087854n, 17980523815641551639n, 17526086738831147013n, 16651378430235024244n, 15030750278693429944n, 12247334978882834399n, 8131365268884726200n, 3584323654723342297n, 696457651847595233n, 26294789957452057n, 37481735321082n];

function integer(value, label, { positive = false, maximum = null } = {}) { let parsed; try { parsed = BigInt(value); } catch { throw new Error(`${label} must be an integer`); } if (parsed < 0n || (positive && parsed === 0n) || (maximum !== null && parsed > maximum)) throw new Error(`${label} is out of range`); return parsed; }

export function orcaSqrtPriceX64AtTick(tick) {
  if (!Number.isInteger(tick) || tick < MIN_ORCA_TICK || tick > MAX_ORCA_TICK) throw new Error("Orca tick is out of range");
  const absolute = Math.abs(tick), factors = tick >= 0 ? POSITIVE_FACTORS : NEGATIVE_FACTORS;
  let ratio = tick >= 0 ? Q96 : Q64;
  for (let bit = 0; bit < factors.length; bit++) if ((absolute & (1 << bit)) !== 0) ratio = tick >= 0 ? (ratio * factors[bit]) >> 96n : (ratio * factors[bit]) >> 64n;
  return tick >= 0 ? ratio >> 32n : ratio;
}

function normalizedTicks(initializedTicks, tickSpacing) {
  if (!Array.isArray(initializedTicks) || !Number.isInteger(tickSpacing) || tickSpacing <= 0) throw new Error("initialized tick coverage is invalid");
  const seen = new Set(), rows = initializedTicks.map((row) => { if (!Number.isInteger(row?.tick) || row.tick % tickSpacing !== 0 || !/^-?\d+$/.test(row?.liquidityNetRaw ?? "") || !/^\d+$/.test(row?.liquidityGrossRaw ?? "") || BigInt(row.liquidityGrossRaw) === 0n || seen.has(row.tick)) throw new Error("initialized tick is invalid"); seen.add(row.tick); return { tick: row.tick, liquidityNet: BigInt(row.liquidityNetRaw) }; });
  return rows.sort((left, right) => left.tick - right.tick);
}

export function quoteOrcaStaticFeeExactInput({ sqrtPriceX64, currentTick, liquidity, amountIn, feeRateMillionths, aToB, limitTick, tickSpacing, initializedTicks }) {
  if (!Number.isInteger(currentTick) || currentTick < MIN_ORCA_TICK || currentTick > MAX_ORCA_TICK || !Number.isInteger(limitTick) || limitTick < MIN_ORCA_TICK || limitTick > MAX_ORCA_TICK) throw new Error("Orca tick is out of range");
  if (typeof aToB !== "boolean" || (aToB ? limitTick >= currentTick : limitTick <= currentTick)) throw new Error("limit tick is inconsistent with swap direction");
  const ticks = normalizedTicks(initializedTicks, tickSpacing), limitPrice = orcaSqrtPriceX64AtTick(limitTick);
  let price = integer(sqrtPriceX64, "sqrtPriceX64", { positive: true }), activeLiquidity = integer(liquidity, "liquidity", { positive: true, maximum: MAX_U128 }), remaining = integer(amountIn, "amountIn", { positive: true, maximum: MAX_U64 });
  const fee = integer(feeRateMillionths, "feeRateMillionths"); if (fee >= FEE_DENOMINATOR) throw new Error("feeRateMillionths is out of range");
  if ((aToB && price <= limitPrice) || (!aToB && price >= limitPrice)) throw new Error("limit price is inconsistent with current price");
  const candidates = ticks.filter((row) => aToB ? row.tick <= currentTick && row.tick > limitTick : row.tick > currentTick && row.tick < limitTick); if (aToB) candidates.reverse();
  let totalIn = 0n, totalOut = 0n, totalFee = 0n, candidateIndex = 0; const crossedTickIndexes = [];
  while (remaining > 0n && price !== limitPrice) {
    const nextTick = candidates[candidateIndex] ?? null, target = nextTick ? orcaSqrtPriceX64AtTick(nextTick.tick) : limitPrice;
    if (nextTick && target === price) { activeLiquidity = aToB ? activeLiquidity - nextTick.liquidityNet : activeLiquidity + nextTick.liquidityNet; if (activeLiquidity <= 0n || activeLiquidity > MAX_U128) throw new Error("initialized tick crossing produces invalid liquidity"); crossedTickIndexes.push(nextTick.tick); candidateIndex++; continue; }
    const step = computeStaticFeeExactInputStep({ sqrtPriceX64: price, targetSqrtPriceX64: target, liquidity: activeLiquidity, amountRemaining: remaining, feeRateMillionths: fee, zeroForOne: aToB });
    const consumed = BigInt(step.amountIn) + BigInt(step.feeAmount); if (consumed === 0n) throw new Error("Orca quote made no progress"); price = BigInt(step.nextSqrtPriceX64); remaining -= consumed; totalIn += BigInt(step.amountIn); totalOut += BigInt(step.amountOut); totalFee += BigInt(step.feeAmount);
    if (nextTick && step.reachedTarget) { activeLiquidity = aToB ? activeLiquidity - nextTick.liquidityNet : activeLiquidity + nextTick.liquidityNet; if (activeLiquidity <= 0n || activeLiquidity > MAX_U128) throw new Error("initialized tick crossing produces invalid liquidity"); crossedTickIndexes.push(nextTick.tick); candidateIndex++; } else break;
  }
  return { status: remaining === 0n ? "quoted" : "price_limit_reached", amountSpecifiedRaw: BigInt(amountIn).toString(), amountInRaw: totalIn.toString(), amountOutRaw: totalOut.toString(), feeAmountRaw: totalFee.toString(), amountUnconsumedRaw: remaining.toString(), endSqrtPriceX64: price.toString(), endLiquidityRaw: activeLiquidity.toString(), crossedTicks: crossedTickIndexes.length, crossedTickIndexes, fullyConsumed: remaining === 0n };
}

export function quoteOrcaSnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn, limitTick, now = Date.now(), maxAgeMs = 120_000 }) {
  const observedAt = parseCanonicalUtcTimestamp(snapshot?.observedAt);
  if (snapshot?.schemaVersion !== 1 || snapshot.type !== "orca_whirlpool_pool_snapshot" || snapshot.commitment !== "finalized" || !Number.isSafeInteger(snapshot.stateSlot) || !Number.isSafeInteger(snapshot.balanceSlot) || snapshot.balanceSlot < snapshot.stateSlot || observedAt == null || !Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs < 0) throw new Error("finalized Orca snapshot evidence is invalid");
  const ageMs = now - observedAt; if (ageMs < 0 || ageMs > maxAgeMs) throw new Error("finalized Orca snapshot evidence is stale");
  const pool = snapshot.pools?.find((row) => row.address === poolAddress); if (!pool || pool.programId !== ORCA_WHIRLPOOL_PROGRAM || pool.tickArrayCoverage !== "finalized_program_account_snapshot" || !Number.isSafeInteger(pool.tickArraySlot) || pool.tickArraySlot < snapshot.stateSlot || pool.tickArraySlot > snapshot.balanceSlot || !Array.isArray(pool.tickArrays)) throw new Error("Orca snapshot lacks complete quote evidence");
  if (pool.tokenProgram0 !== LEGACY_TOKEN_PROGRAM || pool.tokenProgram1 !== LEGACY_TOKEN_PROGRAM) throw new Error("Orca Token-2022 quoting is unsupported");
  if (!validateBoundPoolMintEvidence(pool, snapshot.balanceSlot)) throw new Error("Orca quote requires complete finalized mint evidence");
  if (inputMint !== pool.tokenMint0 && inputMint !== pool.tokenMint1) throw new Error("input mint is not part of the Orca pool");
  const aToB = inputMint === pool.tokenMint0, quote = quoteOrcaStaticFeeExactInput({ sqrtPriceX64: pool.sqrtPriceX64, currentTick: pool.tick, liquidity: pool.liquidityRaw, amountIn, feeRateMillionths: pool.feeRate, aToB, limitTick, tickSpacing: pool.tickSpacing, initializedTicks: pool.tickArrays.flatMap((array) => array.initializedTicks ?? []) });
  return { ...quote, protocol: "orca-whirlpool", pool: pool.address, inputMint, outputMint: aToB ? pool.tokenMint1 : pool.tokenMint0, aToB, limitTick, sqrtPriceLimitX64: orcaSqrtPriceX64AtTick(limitTick).toString(), commitment: "finalized", stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, tickArraySlot: pool.tickArraySlot, mintEvidenceSlot: pool.mintEvidenceSlot, epoch: pool.epoch, observedAt: snapshot.observedAt, ageMs, feeRateMillionths: String(pool.feeRate), feeMode: "from_input_static", automationSafe: false };
}

export const ORCA_CLMM_MATH_CONSTANTS = Object.freeze({ feeDenominator: FEE_DENOMINATOR.toString(), minTick: MIN_ORCA_TICK, maxTick: MAX_ORCA_TICK, legacyTokenProgram: LEGACY_TOKEN_PROGRAM });
