import { encodeBase58 } from "./solana-pda.js";

const U64_MAX = (1n << 64n) - 1n;
const BASIS_POINTS_DENOMINATOR = 10_000n;
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const MINT_EXTENSION_NAMES = new Map([[1, "transferFeeConfig"], [3, "mintCloseAuthority"], [4, "confidentialTransferMint"], [6, "defaultAccountState"], [9, "nonTransferable"], [10, "interestBearingConfig"], [12, "permanentDelegate"], [14, "transferHook"], [16, "confidentialTransferFeeConfig"], [18, "metadataPointer"], [19, "tokenMetadata"], [20, "groupPointer"], [21, "tokenGroup"], [22, "groupMemberPointer"], [23, "tokenGroupMember"], [24, "confidentialMintBurn"], [25, "scaledUiAmount"], [26, "pausable"], [28, "permissionedBurn"]]);

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

function rawBase64(account, label) { if (account?.owner !== TOKEN_2022_PROGRAM || !Array.isArray(account.data) || account.data.length !== 2 || account.data[1] !== "base64" || typeof account.data[0] !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(account.data[0])) throw new Error(`${label} encoding is invalid`); const bytes = Buffer.from(account.data[0], "base64"); if (bytes.length > 65_536 || bytes.toString("base64").replace(/=+$/, "") !== account.data[0].replace(/=+$/, "")) throw new Error(`${label} encoding is invalid`); return bytes; }
function coptionAddress(bytes, offset, label) { const tag = bytes.readUInt32LE(offset); if (tag === 0) return null; if (tag !== 1) throw new Error(`${label} is invalid`); return encodeBase58(bytes.subarray(offset + 4, offset + 36)); }
function rawFee(bytes, offset) { return { epoch: epoch(bytes.readBigUInt64LE(offset), "transfer fee epoch"), maximumFeeRaw: bytes.readBigUInt64LE(offset + 8).toString(), transferFeeBasisPoints: bytes.readUInt16LE(offset + 16) }; }

export function decodeRawToken2022MintEvidence(account, currentEpoch, slot) {
  if (!Number.isSafeInteger(currentEpoch) || currentEpoch < 0 || !Number.isSafeInteger(slot) || slot < 0) throw new Error("Token-2022 epoch evidence is invalid");
  const bytes = rawBase64(account, "raw Token-2022 mint"); if (bytes.length < 82 || bytes[45] !== 1) throw new Error("raw Token-2022 mint base is invalid");
  const mintInfo = { mintAuthority: coptionAddress(bytes, 0, "mint authority"), supply: bytes.readBigUInt64LE(36).toString(), decimals: bytes[44], freezeAuthority: coptionAddress(bytes, 46, "freeze authority") }, extensionTypes = [], seen = new Set(); let transferFeeConfig = null;
  if (bytes.length > 82) { if (bytes.length < 170 || bytes.subarray(82, 165).some((byte) => byte !== 0) || bytes[165] !== 1) throw new Error("raw Token-2022 mint extension envelope is invalid"); let offset = 166; while (offset < bytes.length) { if (offset + 4 > bytes.length) throw new Error("truncated raw Token-2022 mint extension"); const type = bytes.readUInt16LE(offset), length = bytes.readUInt16LE(offset + 2); offset += 4; if (type === 0 && length === 0) { if (bytes.subarray(offset).some((byte) => byte !== 0)) throw new Error("raw Token-2022 mint extension padding is invalid"); break; } const name = MINT_EXTENSION_NAMES.get(type); if (!name || seen.has(type) || offset + length > bytes.length) throw new Error("raw Token-2022 mint extension is invalid"); seen.add(type); extensionTypes.push(name); if (type === 1) { if (length !== 108) throw new Error("raw Token-2022 transfer fee config is invalid"); transferFeeConfig = normalizeTransferFeeConfig({ withheldAmountRaw: bytes.readBigUInt64LE(offset + 64), olderTransferFee: rawFee(bytes, offset + 72), newerTransferFee: rawFee(bytes, offset + 90) }); } offset += length; } }
  mintInfo.extensions = extensionTypes.map((extension) => extension === "transferFeeConfig" ? { extension, state: transferFeeConfig } : { extension });
  return { mintInfo, token2022Evidence: { schemaVersion: 1, programId: TOKEN_2022_PROGRAM, commitment: "finalized", slot, epoch: currentEpoch, transferFeeConfig, activeTransferFee: transferFeeConfig ? selectEpochTransferFee(transferFeeConfig, currentEpoch) : null } };
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
