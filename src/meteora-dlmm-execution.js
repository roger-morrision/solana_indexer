import crypto from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { decodeMeteoraBinArrayAccount, METEORA_DLMM_PROGRAM } from "./meteora-dlmm-pool-snapshot.js";
import { quoteMeteoraDlmmSnapshotExactInput } from "./meteora-dlmm-math.js";
import { validateBoundPoolMintEvidence } from "./pool-mint-evidence.js";
import { buildUnsignedLegacyTransaction, simulateUnsignedTransaction, verifyFinalizedLandedTransaction, verifySignedTransactionBase64 } from "./transaction-simulation.js";
import { decodeBase58Address, findProgramAddress } from "./solana-pda.js";
import { resolveTransferHookAccountMetas } from "./transfer-hook-evidence.js";

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const SWAP_DISCRIMINATOR = Buffer.from([248, 198, 158, 145, 225, 117, 135, 200]);
const SWAP2_DISCRIMINATOR = Buffer.from([65, 75, 63, 76, 235, 91, 91, 136]);
const U64_MAX = (1n << 64n) - 1n;

function integer(value, label) { let parsed; try { parsed = BigInt(value); } catch { throw new Error(`${label} is invalid`); } if (parsed < 0n || parsed > U64_MAX) throw new Error(`${label} is invalid`); return parsed; }
function u64(value) { const bytes = Buffer.alloc(8); bytes.writeBigUInt64LE(value); return bytes; }
function meta(address, signer, writable) { if (typeof address !== "string" || !address) throw new Error("Meteora execution account is missing"); return { address, signer, writable }; }
function deriveEventAuthority() { return findProgramAddress(METEORA_DLMM_PROGRAM, [Buffer.from("__event_authority")]).address; }
function encodeRemainingAccountSlices(slices) { const count = Buffer.alloc(4); count.writeUInt32LE(slices.length); return Buffer.concat([count, ...slices.map(({ type, length }) => Buffer.from([type, length]))]); }

function finalizedHookAccountData(values, minimumSlot) {
  if (values == null) return { raw: null, summary: [], slot: null };
  if (typeof values !== "object" || Array.isArray(values)) throw new Error("Meteora transfer-hook source-account evidence is invalid");
  const raw = {}, summary = [];
  for (const [address, value] of Object.entries(values)) {
    try { decodeBase58Address(address); decodeBase58Address(value?.owner); } catch { throw new Error("Meteora transfer-hook source-account evidence is invalid"); }
    const bytes = typeof value?.rawHex === "string" && /^(?:[0-9a-f]{2})*$/.test(value.rawHex) ? Buffer.from(value.rawHex, "hex") : null;
    if (value?.schemaVersion !== 1 || value.address !== address || value.commitment !== "finalized" || !Number.isSafeInteger(value.slot) || value.slot < minimumSlot || typeof value.owner !== "string" || !value.owner || !bytes || bytes.length > 65_536 || value.dataLength !== bytes.length || crypto.createHash("sha256").update(bytes).digest("hex") !== value.rawPayloadHash) throw new Error("Meteora transfer-hook source-account evidence is invalid");
    raw[address] = value; summary.push({ address, owner: value.owner, slot: value.slot, dataLength: value.dataLength, rawPayloadHash: value.rawPayloadHash });
  }
  summary.sort((a, b) => a.address.localeCompare(b.address));
  return { raw, summary, slot: summary.length ? Math.max(...summary.map((value) => value.slot)) : null };
}

function transferHookAccounts(evidence, { source, mint, destination, authority, amountRaw, type }, accountData) {
  const hook = evidence?.transferHookEvidence;
  if (!evidence?.extensionTypes?.includes("transferHook")) return null;
  if (!hook?.programExecutable || typeof hook.programId !== "string" || !hook.programId) throw new Error("Meteora transfer-hook evidence is incomplete");
  if (hook.validation == null) return { slice: { type, length: 1 }, accounts: [meta(hook.programId, false, false)] };
  const resolved = resolveTransferHookAccountMetas({ metaList: hook.validation.extraAccountMetaList, hookProgramId: hook.programId, validationAccount: hook.validationAccount, source, mint, destination, authority, amountRaw, accountData });
  const accounts = [...resolved.accounts.map((account) => meta(account.address, account.signer, account.writable)), meta(hook.validationAccount, false, false), meta(hook.programId, false, false)];
  if (accounts.length > 255) throw new Error("Meteora transfer-hook account slice is too large");
  return { slice: { type, length: accounts.length }, accounts };
}

function selectBinArrays(quote, pool) {
  if (!Array.isArray(quote.binArrayIndexes) || !quote.binArrayIndexes.length || !Array.isArray(pool.binArrays) || pool.binArrayCoverage !== "finalized_program_account_snapshot") throw new Error("Meteora execution bin-array evidence is invalid");
  const byIndex = new Map(pool.binArrays.map((row) => [row?.index, row]));
  const selected = quote.binArrayIndexes.map((index) => byIndex.get(index));
  if (selected.some((row) => typeof row?.address !== "string" || !row.address) || new Set(selected.map((row) => row.address)).size !== selected.length) throw new Error("Meteora execution requires every quoted finalized bin array");
  return selected;
}

export function verifyMeteoraDlmmQuoteFinalizedAccounts({ quote, pool, accounts }) {
  if (!Array.isArray(quote?.binTraversal) || !quote.binTraversal.length || !Array.isArray(accounts) || accounts.length !== new Set(quote.binTraversal.map((row) => row.binArrayAddress)).size) throw new Error("Meteora finalized bin-array verification evidence is incomplete");
  const byAddress = new Map(accounts.map((source) => [source?.address, source])); if (byAddress.size !== accounts.length) throw new Error("Meteora finalized bin-array verification evidence is duplicated");
  const arrays = [];
  for (const row of quote.binTraversal) {
    if (arrays.some((array) => array.address === row.binArrayAddress)) continue;
    const source = byAddress.get(row.binArrayAddress); if (source?.commitment !== "finalized" || !Number.isSafeInteger(source.slot) || source.slot < row.binArraySlot || source.owner !== METEORA_DLMM_PROGRAM || typeof source.rawHex !== "string" || !/^(?:[0-9a-f]{2}){10136}$/.test(source.rawHex)) throw new Error("Meteora finalized bin-array account evidence is invalid");
    const decoded = decodeMeteoraBinArrayAccount(source.address, { owner: source.owner, data: [Buffer.from(source.rawHex, "hex").toString("base64"), "base64"] }, pool?.address);
    if (decoded.index !== row.binArrayIndex || decoded.rawPayloadHash !== row.binArrayPayloadHash) throw new Error("Meteora finalized bin-array account identity does not match quote"); arrays.push(decoded);
  }
  const reproduced = quoteMeteoraDlmmSnapshotExactInput({ snapshot: { type: "meteora_dlmm_pool_snapshot", commitment: "finalized", stateSlot: quote.stateSlot, balanceSlot: quote.balanceSlot, observedAt: quote.observedAt, pools: [{ ...pool, binArrays: arrays }] }, poolAddress: pool?.address, inputMint: quote.inputMint, amountIn: quote.amountInRaw, now: quote.calculatedAtUnixMs, staleAfterMs: Number.MAX_SAFE_INTEGER });
  if (!isDeepStrictEqual(reproduced, quote)) throw new Error("Meteora quote does not match independently decoded finalized bin arrays"); return true;
}

export function buildMeteoraDlmmSwapInstruction({ quote, pool, user, inputTokenAccount, outputTokenAccount, minimumOutputRaw, bitmapExtension = null, hostFeeAccount = null, transferHookAccountData = null }) {
  let quoteEconomicsVerification = "legacy_unattested";
  if (quote?.calculatedAtUnixMs != null) {
    const calculatedAtUnixMs = quote.calculatedAtUnixMs;
    if (!Number.isSafeInteger(calculatedAtUnixMs) || calculatedAtUnixMs < 0) throw new Error("Meteora execution quote calculation time is invalid");
    const reproduced = quoteMeteoraDlmmSnapshotExactInput({ snapshot: { type: "meteora_dlmm_pool_snapshot", commitment: "finalized", stateSlot: quote.stateSlot, balanceSlot: quote.balanceSlot, observedAt: quote.observedAt, pools: [pool] }, poolAddress: pool?.address, inputMint: quote.inputMint, amountIn: quote.amountInRaw, now: calculatedAtUnixMs, staleAfterMs: Number.MAX_SAFE_INTEGER });
    if (!isDeepStrictEqual(reproduced, quote)) throw new Error("Meteora execution quote does not match finalized bin economics");
    quoteEconomicsVerification = "reproduced_from_finalized_bin_arrays";
  }
  const direction = quote?.inputMint === pool?.tokenMint0 && quote?.outputMint === pool?.tokenMint1 ? true : quote?.inputMint === pool?.tokenMint1 && quote?.outputMint === pool?.tokenMint0 ? false : null;
  const tokenPrograms = new Set([TOKEN_PROGRAM, TOKEN_2022_PROGRAM]), hasToken2022 = pool?.tokenProgram0 === TOKEN_2022_PROGRAM || pool?.tokenProgram1 === TOKEN_2022_PROGRAM;
  if (quote?.schemaVersion !== 1 || quote.protocol !== "meteora-dlmm" || quote.status !== "quoted" || quote.amountLeftRaw !== "0" || direction == null || quote.swapForY !== direction || quote.pool !== pool?.address || pool.programId !== METEORA_DLMM_PROGRAM || !tokenPrograms.has(pool.tokenProgram0) || !tokenPrograms.has(pool.tokenProgram1) || ![quote.stateSlot, quote.binArraySlot, quote.balanceSlot, quote.mintEvidenceSlot, quote.epoch].every((slot) => Number.isSafeInteger(slot) && slot >= 0) || quote.binArraySlot < quote.stateSlot || quote.binArraySlot > quote.balanceSlot || quote.mintEvidenceSlot < quote.balanceSlot || pool.binArraySlot !== quote.binArraySlot || pool.mintEvidenceSlot !== quote.mintEvidenceSlot || pool.epoch !== quote.epoch || !validateBoundPoolMintEvidence(pool, quote.balanceSlot) || typeof pool.oracle !== "string" || !pool.oracle) throw new Error("Meteora execution quote evidence is invalid");
  for (const evidence of [pool.mint0Evidence, pool.mint1Evidence]) if (evidence.programId === TOKEN_2022_PROGRAM && evidence.extensionTypes.some((type) => type !== "transferFeeConfig" && type !== "transferHook")) throw new Error("Meteora execution does not support this Token-2022 extension");
  if (quote.binArrayIndexes.some((index) => !Number.isInteger(index) || index < -6_656 || index >= 6_656)) throw new Error("Meteora execution bin-array range is invalid"); const outsideIndexes = quote.binArrayIndexes.filter((index) => index < -512 || index >= 512), extension = pool.binArrayBitmapExtension, extensionAddress = outsideIndexes.length ? extension?.address : null;
  if (outsideIndexes.length && (!extensionAddress || extension.pool !== pool.address || outsideIndexes.some((index) => !extension.initializedBinArrayIndexes?.includes(index)) || !Number.isSafeInteger(pool.binArrayBitmapExtensionSlot) || pool.binArrayBitmapExtensionSlot < quote.binArraySlot || pool.binArrayBitmapExtensionSlot > quote.balanceSlot || bitmapExtension != null && bitmapExtension !== extensionAddress) || !outsideIndexes.length && bitmapExtension != null) throw new Error("Meteora execution bitmap-extension evidence is invalid");
  const amount = integer(quote.amountInRaw, "Meteora amount"), consumed = integer(quote.consumedInRaw, "Meteora consumed amount"), quotedOutput = integer(quote.amountOutRaw, "Meteora quoted output"), minimumOutput = integer(minimumOutputRaw, "Meteora minimum output");
  if (amount === 0n || amount !== consumed || quotedOutput === 0n || minimumOutput === 0n || minimumOutput > quotedOutput || !/^\d+$/.test(quote.inputTransferFeeRaw ?? "") || !/^\d+$/.test(quote.outputTransferFeeRaw ?? "") || !hasToken2022 && (quote.inputTransferFeeRaw !== "0" || quote.outputTransferFeeRaw !== "0")) throw new Error("Meteora execution bounds are invalid");
  const hasTransferHook = pool.mint0Evidence.extensionTypes.includes("transferHook") || pool.mint1Evidence.extensionTypes.includes("transferHook"), hookData = finalizedHookAccountData(transferHookAccountData, quote.mintEvidenceSlot);
  const arrays = selectBinArrays(quote, pool), eventAuthority = deriveEventAuthority(), grossOutput = integer(hasTransferHook ? quote.grossOutputRaw : quote.grossOutputRaw ?? quote.amountOutRaw, "Meteora gross output");
  const hookX = transferHookAccounts(pool.mint0Evidence, direction ? { source: inputTokenAccount, mint: pool.tokenMint0, destination: pool.tokenVault0, authority: user, amountRaw: amount, type: 0 } : { source: pool.tokenVault0, mint: pool.tokenMint0, destination: outputTokenAccount, authority: pool.address, amountRaw: grossOutput, type: 0 }, hookData.raw);
  const hookY = transferHookAccounts(pool.mint1Evidence, direction ? { source: pool.tokenVault1, mint: pool.tokenMint1, destination: outputTokenAccount, authority: pool.address, amountRaw: grossOutput, type: 1 } : { source: inputTokenAccount, mint: pool.tokenMint1, destination: pool.tokenVault1, authority: user, amountRaw: amount, type: 1 }, hookData.raw);
  const hookGroups = [hookX, hookY].filter(Boolean), remainingAccountSlices = hookGroups.map((group) => ({ accountsType: group.slice.type === 0 ? "transferHookX" : "transferHookY", length: group.slice.length })), hookAccounts = hookGroups.flatMap((group) => group.accounts);
  const fixed = [meta(pool.address, false, true), meta(extensionAddress ?? METEORA_DLMM_PROGRAM, false, extensionAddress != null), meta(pool.tokenVault0, false, true), meta(pool.tokenVault1, false, true), meta(inputTokenAccount, false, true), meta(outputTokenAccount, false, true), meta(pool.tokenMint0, false, false), meta(pool.tokenMint1, false, false), meta(pool.oracle, false, true), meta(hostFeeAccount ?? METEORA_DLMM_PROGRAM, false, hostFeeAccount != null), meta(user, true, false), meta(pool.tokenProgram0, false, false), meta(pool.tokenProgram1, false, false)], accounts = [...fixed, ...(hasToken2022 ? [meta(MEMO_PROGRAM, false, false)] : []), meta(eventAuthority, false, false), meta(METEORA_DLMM_PROGRAM, false, false), ...hookAccounts, ...arrays.map((row) => meta(row.address, false, true))];
  const data = Buffer.concat([hasToken2022 ? SWAP2_DISCRIMINATOR : SWAP_DISCRIMINATOR, u64(amount), u64(minimumOutput), ...(hasToken2022 ? [encodeRemainingAccountSlices(hookGroups.map((group) => group.slice))] : [])]);
  return { programId: METEORA_DLMM_PROGRAM, accounts, dataHex: data.toString("hex"), evidence: { pool: pool.address, instructionVersion: hasToken2022 ? "swap2" : "swap", quoteEconomicsVerification, stateSlot: quote.stateSlot, binArraySlot: quote.binArraySlot, bitmapExtensionSlot: outsideIndexes.length ? pool.binArrayBitmapExtensionSlot : null, balanceSlot: quote.balanceSlot, mintEvidenceSlot: quote.mintEvidenceSlot, transferHookAccountDataSlot: hookData.slot, transferHookAccountData: hookData.summary, epoch: quote.epoch, inputTransferFeeRaw: quote.inputTransferFeeRaw, outputTransferFeeRaw: quote.outputTransferFeeRaw, amountInRaw: amount.toString(), quotedOutputRaw: quotedOutput.toString(), minimumOutputRaw: minimumOutput.toString(), swapForY: direction, binArrays: arrays.map((row) => row.address), remainingAccountSlices, optionalBitmapExtension: extensionAddress, optionalHostFeeAccount: hostFeeAccount, eventAuthority } };
}

export function prepareMeteoraDlmmSwapSimulation(args) {
  const instruction = buildMeteoraDlmmSwapInstruction(args), transaction = buildUnsignedLegacyTransaction({ feePayer: args.user, recentBlockhash: args.recentBlockhash, instructions: [instruction] });
  const inputPre = integer(args.inputPreAmountRaw, "Meteora input balance"), outputPre = integer(args.outputPreAmountRaw, "Meteora output balance"), amount = integer(args.quote.amountInRaw, "Meteora amount"), minimumOutput = integer(args.minimumOutputRaw, "Meteora minimum output"), quotedOutput = integer(args.quote.amountOutRaw, "Meteora quoted output");
  if (inputPre < amount || outputPre + quotedOutput > U64_MAX) throw new Error("Meteora simulation balance bounds are invalid");
  const prepared = { schemaVersion: 1, type: "meteora_dlmm_swap_simulation", protocol: "meteora-dlmm", commitment: "finalized", minContextSlot: Math.max(args.quote.mintEvidenceSlot, instruction.evidence.transferHookAccountDataSlot ?? 0), transaction, instructionEvidence: instruction.evidence, simulationPolicy: { allowedProgramIds: [METEORA_DLMM_PROGRAM], requiredProgramIds: [METEORA_DLMM_PROGRAM], instructionPolicies: transaction.instructionPolicies, accountExpectations: [{ address: args.inputTokenAccount, mint: args.quote.inputMint, preAmountRaw: inputPre.toString(), minDeltaRaw: (-amount).toString(), maxDeltaRaw: (-amount).toString() }, { address: args.outputTokenAccount, mint: args.quote.outputMint, preAmountRaw: outputPre.toString(), minDeltaRaw: minimumOutput.toString(), maxDeltaRaw: quotedOutput.toString() }] } };
  prepared.preparationHash = crypto.createHash("sha256").update(JSON.stringify(prepared)).digest("hex"); return prepared;
}

export async function simulatePreparedMeteoraDlmmSwap(client, { preparation, expectedGenesisHash, genesisHash }) {
  const { preparationHash, ...unsignedPreparation } = preparation ?? {}, expectedHash = crypto.createHash("sha256").update(JSON.stringify(unsignedPreparation)).digest("hex");
  if (preparation?.schemaVersion !== 1 || preparation.type !== "meteora_dlmm_swap_simulation" || preparation.protocol !== "meteora-dlmm" || preparation.commitment !== "finalized" || preparation.transaction?.signed !== false || preparation.transaction.submitted !== false || !Number.isSafeInteger(preparation.minContextSlot) || preparation.minContextSlot < 0 || !preparation.simulationPolicy || preparationHash !== expectedHash) throw new Error("Meteora simulation preparation is invalid");
  const policy = preparation.simulationPolicy, receipt = await simulateUnsignedTransaction(client, { transactionBase64: preparation.transaction.transactionBase64, minContextSlot: preparation.minContextSlot, expectedGenesisHash, genesisHash, allowedProgramIds: policy.allowedProgramIds, requiredProgramIds: policy.requiredProgramIds, instructionPolicies: policy.instructionPolicies, accountExpectations: policy.accountExpectations });
  if (receipt.transactionHash !== preparation.transaction.transactionHash || receipt.messageHash !== preparation.transaction.messageHash || receipt.simulationSlot < preparation.minContextSlot || receipt.messageVersion !== "legacy" || receipt.programIds?.length !== 1 || receipt.programIds[0] !== METEORA_DLMM_PROGRAM) throw new Error("Meteora simulation receipt does not match preparation");
  const result = { ...receipt, type: "meteora_dlmm_swap_simulation_receipt", protocol: "meteora-dlmm", preparationHash, preparationMessageHash: preparation.transaction.messageHash, instructionEvidence: preparation.instructionEvidence }; result.receiptHash = crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex"); return result;
}

export function createMeteoraDlmmSigningRequest({ preparation, simulationReceipt, allowedFeePayers, maxInputRaw, maxSlippageBps, currentSlot, ttlSlots = 32, maxSimulationAgeSlots = 32 }) {
  if (!Array.isArray(allowedFeePayers) || !allowedFeePayers.length || new Set(allowedFeePayers).size !== allowedFeePayers.length || !Number.isInteger(maxSlippageBps) || maxSlippageBps < 0 || maxSlippageBps > 10_000 || !Number.isSafeInteger(currentSlot) || currentSlot < 0 || currentSlot > Number.MAX_SAFE_INTEGER - 150 || !Number.isSafeInteger(ttlSlots) || ttlSlots < 1 || ttlSlots > 150 || !Number.isSafeInteger(maxSimulationAgeSlots) || maxSimulationAgeSlots < 0 || maxSimulationAgeSlots > 150) throw new Error("Meteora signer policy is invalid");
  const { preparationHash, ...unsignedPreparation } = preparation ?? {}, expectedPreparationHash = crypto.createHash("sha256").update(JSON.stringify(unsignedPreparation)).digest("hex"), payer = preparation?.transaction?.instructionPolicies?.[0]?.accounts?.find((account) => account.signer && account.writable), evidence = preparation?.instructionEvidence;
  const { receiptHash, ...unsignedReceipt } = simulationReceipt ?? {}, expectedReceiptHash = crypto.createHash("sha256").update(JSON.stringify(unsignedReceipt)).digest("hex");
  if (preparationHash !== expectedPreparationHash || receiptHash !== expectedReceiptHash || !payer?.signer || !payer.writable || !allowedFeePayers.includes(payer.address) || simulationReceipt?.type !== "meteora_dlmm_swap_simulation_receipt" || simulationReceipt.protocol !== "meteora-dlmm" || simulationReceipt.status !== "simulated" || simulationReceipt.submitted !== false || simulationReceipt.signed !== false || simulationReceipt.preparationHash !== preparationHash || simulationReceipt.messageHash !== preparation.transaction.messageHash || simulationReceipt.transactionHash !== preparation.transaction.transactionHash || !Number.isSafeInteger(simulationReceipt.simulationSlot) || currentSlot < simulationReceipt.simulationSlot || currentSlot - simulationReceipt.simulationSlot > maxSimulationAgeSlots) throw new Error("Meteora signing evidence is invalid");
  const amount = integer(evidence?.amountInRaw, "Meteora amount"), maximum = integer(maxInputRaw, "Meteora maximum input"), quoted = integer(evidence?.quotedOutputRaw, "Meteora quoted output"), minimum = integer(evidence?.minimumOutputRaw, "Meteora minimum output");
  if (amount === 0n || amount > maximum || quoted === 0n || minimum > quoted) throw new Error("Meteora signer limits are exceeded"); const slippageBps = Number(((quoted - minimum) * 10_000n + quoted - 1n) / quoted); if (slippageBps > maxSlippageBps) throw new Error("Meteora signer limits are exceeded");
  const request = { schemaVersion: 1, type: "meteora_dlmm_swap_signing_request", protocol: "meteora-dlmm", approvalRequired: true, signingPerformed: false, submissionPerformed: false, feePayer: payer.address, transactionBase64: preparation.transaction.transactionBase64, transactionHash: preparation.transaction.transactionHash, messageHash: preparation.transaction.messageHash, preparationHash, simulationReceiptHash: receiptHash, simulationSlot: simulationReceipt.simulationSlot, currentSlot, expiresSlot: currentSlot + ttlSlots, maxInputRaw: maximum.toString(), amountInRaw: amount.toString(), quotedOutputRaw: quoted.toString(), minimumOutputRaw: minimum.toString(), slippageBps, instructionEvidence: evidence }; request.signingRequestHash = crypto.createHash("sha256").update(JSON.stringify(request)).digest("hex"); return request;
}

export function verifyMeteoraDlmmSignedRequest({ signingRequest, signedTransactionBase64, currentSlot }) {
  const { signingRequestHash, ...unsignedRequest } = signingRequest ?? {}, expectedRequestHash = crypto.createHash("sha256").update(JSON.stringify(unsignedRequest)).digest("hex");
  if (signingRequest?.schemaVersion !== 1 || signingRequest.type !== "meteora_dlmm_swap_signing_request" || signingRequest.protocol !== "meteora-dlmm" || signingRequest.approvalRequired !== true || signingRequest.signingPerformed !== false || signingRequest.submissionPerformed !== false || signingRequestHash !== expectedRequestHash || !Number.isSafeInteger(currentSlot) || currentSlot < signingRequest.currentSlot || currentSlot > signingRequest.expiresSlot) throw new Error("Meteora signing request is invalid or expired");
  const verified = verifySignedTransactionBase64({ signedTransactionBase64, unsignedTransactionBase64: signingRequest.transactionBase64, expectedMessageHash: signingRequest.messageHash }); if (verified.approvedTransactionHash !== signingRequest.transactionHash || verified.signerAddresses[0] !== signingRequest.feePayer) throw new Error("Meteora signed transaction does not match approval");
  const result = { ...verified, type: "meteora_dlmm_swap_signed_transaction", protocol: "meteora-dlmm", signingRequestHash, verifiedSlot: currentSlot, expiresSlot: signingRequest.expiresSlot, approvalRequired: false, submissionPerformed: false }; result.signedArtifactHash = crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex"); return result;
}

export async function verifyFinalizedMeteoraDlmmSwap(client, { signedArtifact, signingRequest, simulationReceipt, expectedGenesisHash, genesisHash }) {
  const { signedArtifactHash, ...unsignedArtifact } = signedArtifact ?? {}, expectedArtifactHash = crypto.createHash("sha256").update(JSON.stringify(unsignedArtifact)).digest("hex"), { signingRequestHash, ...unsignedRequest } = signingRequest ?? {}, expectedRequestHash = crypto.createHash("sha256").update(JSON.stringify(unsignedRequest)).digest("hex"), { receiptHash, ...unsignedReceipt } = simulationReceipt ?? {}, expectedReceiptHash = crypto.createHash("sha256").update(JSON.stringify(unsignedReceipt)).digest("hex");
  if (signedArtifact?.type !== "meteora_dlmm_swap_signed_transaction" || signedArtifact.protocol !== "meteora-dlmm" || signedArtifact.status !== "signature_verified" || signedArtifact.submitted !== false || signedArtifact.submissionPerformed !== false || signedArtifactHash !== expectedArtifactHash || signingRequestHash !== expectedRequestHash || receiptHash !== expectedReceiptHash || signedArtifact.signingRequestHash !== signingRequestHash || signingRequest.simulationReceiptHash !== receiptHash || signedArtifact.messageHash !== signingRequest.messageHash || signedArtifact.approvedTransactionHash !== signingRequest.transactionHash || signedArtifact.firstSignature == null) throw new Error("Meteora finalized confirmation chain is invalid");
  const landed = await verifyFinalizedLandedTransaction(client, { signature: signedArtifact.firstSignature, simulationReceipt, expectedGenesisHash, genesisHash }), result = { schemaVersion: 1, type: "meteora_dlmm_swap_finalized_confirmation", protocol: "meteora-dlmm", status: "finalized", signedByIndexer: false, submittedByIndexer: false, signature: landed.signature, messageHash: landed.messageHash, simulationSlot: landed.simulationSlot, finalizedSlot: landed.finalizedSlot, preparationHash: signingRequest.preparationHash, simulationReceiptHash: receiptHash, signingRequestHash, signedArtifactHash };
  result.confirmationHash = crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex"); return result;
}

export const METEORA_DLMM_EXECUTION_CONSTANTS = Object.freeze({ tokenProgram: TOKEN_PROGRAM, token2022Program: TOKEN_2022_PROGRAM, memoProgram: MEMO_PROGRAM, swapDiscriminatorHex: SWAP_DISCRIMINATOR.toString("hex"), swap2DiscriminatorHex: SWAP2_DISCRIMINATOR.toString("hex") });
