const U64_MAX = (1n << 64n) - 1n;
const BASIS_POINTS_DENOMINATOR = 10_000n;
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

function u64(value, label) {
  let parsed;
  if (typeof value === "number" && (!Number.isSafeInteger(value) || value < 0)) throw new Error(`${label} is invalid`);
  try { parsed = BigInt(value); } catch { throw new Error(`${label} is invalid`); }
  if (parsed < 0n || parsed > U64_MAX) throw new Error(`${label} is invalid`);
  return parsed;
}

function epoch(value, label) {
  const parsed = u64(value, label);
  if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${label} exceeds safe scheduling range`);
  return Number(parsed);
}

function normalizeFee(value, label) {
  const feeEpoch = epoch(value?.epoch, `${label} epoch`), basisPoints = Number(value?.transferFeeBasisPoints), maximumFee = u64(value?.maximumFeeRaw ?? value?.maximumFee, `${label} maximum fee`);
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) throw new Error(`${label} basis points are invalid`);
  return { epoch: feeEpoch, transferFeeBasisPoints: basisPoints, maximumFeeRaw: maximumFee.toString() };
}

export function normalizeTransferFeeConfig(value) {
  if (!value || typeof value !== "object") throw new Error("Token-2022 transfer fee config is invalid");
  const olderTransferFee = normalizeFee(value.olderTransferFee, "older transfer fee"), newerTransferFee = normalizeFee(value.newerTransferFee, "newer transfer fee"), withheldAmount = u64(value.withheldAmountRaw ?? value.withheldAmount ?? 0, "mint withheld amount");
  if (olderTransferFee.epoch > newerTransferFee.epoch) throw new Error("Token-2022 transfer fee epochs are unordered");
  return { extension: "transferFeeConfig", withheldAmountRaw: withheldAmount.toString(), olderTransferFee, newerTransferFee };
}

export function selectEpochTransferFee(config, currentEpoch) {
  const normalized = normalizeTransferFeeConfig(config), selectedEpoch = epoch(currentEpoch, "current epoch");
  return selectedEpoch >= normalized.newerTransferFee.epoch ? normalized.newerTransferFee : normalized.olderTransferFee;
}

export function extractToken2022MintEvidence(mintAccount, currentEpoch, slot) {
  if (mintAccount?.owner !== TOKEN_2022_PROGRAM) return null;
  if (!Number.isSafeInteger(currentEpoch) || currentEpoch < 0 || !Number.isSafeInteger(slot) || slot < 0) throw new Error("Token-2022 epoch evidence is invalid");
  const extensions = mintAccount?.data?.parsed?.info?.extensions;
  if (!Array.isArray(extensions)) throw new Error("Token-2022 mint extensions are unavailable");
  const feeExtensions = extensions.filter((extension) => extension?.extension === "transferFeeConfig");
  if (feeExtensions.length > 1) throw new Error("Token-2022 transfer fee extension is ambiguous");
  const transferFeeConfig = feeExtensions.length ? normalizeTransferFeeConfig(feeExtensions[0].state) : null;
  return { schemaVersion: 1, programId: TOKEN_2022_PROGRAM, commitment: "finalized", slot, epoch: currentEpoch, transferFeeConfig, activeTransferFee: transferFeeConfig ? selectEpochTransferFee(transferFeeConfig, currentEpoch) : null };
}

export function calculateTransferFeeIncludedAmount(amountRaw, fee) {
  const amount = u64(amountRaw, "transfer amount"), maximum = u64(fee?.maximumFeeRaw ?? fee?.maximumFee, "maximum transfer fee"), basisPoints = Number(fee?.transferFeeBasisPoints);
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) throw new Error("transfer fee basis points are invalid");
  const calculated = (amount * BigInt(basisPoints) + BASIS_POINTS_DENOMINATOR - 1n) / BASIS_POINTS_DENOMINATOR, transferFee = calculated < maximum ? calculated : maximum;
  return { grossAmountRaw: amount.toString(), netAmountRaw: (amount - transferFee).toString(), transferFeeRaw: transferFee.toString() };
}

export function calculateTransferFeeForNetAmount(netAmountRaw, fee) {
  const net = u64(netAmountRaw, "net transfer amount"), maximum = u64(fee?.maximumFeeRaw ?? fee?.maximumFee, "maximum transfer fee"), basisPoints = Number(fee?.transferFeeBasisPoints);
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) throw new Error("transfer fee basis points are invalid");
  if (net === 0n) return { grossAmountRaw: "0", netAmountRaw: "0", transferFeeRaw: "0" };
  let gross;
  if (basisPoints === 0) gross = net;
  else if (basisPoints === 10_000) gross = net + maximum;
  else {
    const denominator = BASIS_POINTS_DENOMINATOR - BigInt(basisPoints), uncapped = (net * BASIS_POINTS_DENOMINATOR + denominator - 1n) / denominator;
    gross = uncapped - net >= maximum ? net + maximum : uncapped;
  }
  if (gross > U64_MAX) throw new Error("gross transfer amount overflows u64");
  const result = calculateTransferFeeIncludedAmount(gross, { transferFeeBasisPoints: basisPoints, maximumFeeRaw: maximum.toString() });
  if (result.netAmountRaw !== net.toString()) throw new Error("net transfer amount is not exactly representable");
  return result;
}

export const TOKEN_2022_TRANSFER_FEE_CONSTANTS = Object.freeze({ basisPointsDenominator: 10_000, u64Max: U64_MAX.toString() });
