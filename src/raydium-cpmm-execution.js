import crypto from "node:crypto";
import { RAYDIUM_CPMM_PROGRAM, SPL_TOKEN_PROGRAM } from "./cpmm-pool-snapshot.js";
import { buildUnsignedLegacyTransaction, simulateUnsignedTransaction } from "./transaction-simulation.js";

const AUTHORITY = "GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL";
const SWAP_BASE_INPUT_DISCRIMINATOR = crypto.createHash("sha256").update("global:swap_base_input").digest().subarray(0, 8);
const U64_MAX = (1n << 64n) - 1n;

function integer(value, label) { let parsed; try { parsed = BigInt(value); } catch { throw new Error(`${label} is invalid`); } if (parsed < 0n || parsed > U64_MAX) throw new Error(`${label} is invalid`); return parsed; }
function u64(value) { const bytes = Buffer.alloc(8); bytes.writeBigUInt64LE(value); return bytes; }
function meta(address, signer, writable) { if (typeof address !== "string" || !address) throw new Error("Raydium CPMM execution account is missing"); return { address, signer, writable }; }

export function buildRaydiumCpmmSwapBaseInputInstruction({ quote, pool, payer, inputTokenAccount, outputTokenAccount, minimumOutputRaw }) {
  const zeroForOne = quote?.inputMint === pool?.tokenMint0 && quote?.outputMint === pool?.tokenMint1 ? true : quote?.inputMint === pool?.tokenMint1 && quote?.outputMint === pool?.tokenMint0 ? false : null;
  if (quote?.schemaVersion !== 1 || quote.protocol !== "raydium-cpmm" || quote.status !== "quoted" || quote.pool !== pool?.address || zeroForOne == null || ![quote.stateSlot, quote.configSlot, quote.balanceSlot].every((slot) => Number.isSafeInteger(slot) && slot >= 0) || quote.stateSlot > quote.configSlot || quote.configSlot > quote.balanceSlot || pool.ammConfigSlot !== quote.configSlot || pool.tokenProgram0 !== SPL_TOKEN_PROGRAM || pool.tokenProgram1 !== SPL_TOKEN_PROGRAM || pool.programId !== RAYDIUM_CPMM_PROGRAM || pool.status & 4 || !pool.ammConfig || !pool.observationKey) throw new Error("Raydium CPMM execution quote evidence is invalid");
  const amount = integer(quote.amountInRaw, "Raydium CPMM amount"), quotedOutput = integer(quote.amountOutRaw, "Raydium CPMM quoted output"), minimumOutput = integer(minimumOutputRaw, "Raydium CPMM minimum output");
  if (amount === 0n || quotedOutput === 0n || minimumOutput === 0n || minimumOutput > quotedOutput) throw new Error("Raydium CPMM execution bounds are invalid");
  const inputVault = zeroForOne ? pool.tokenVault0 : pool.tokenVault1, outputVault = zeroForOne ? pool.tokenVault1 : pool.tokenVault0, inputMint = zeroForOne ? pool.tokenMint0 : pool.tokenMint1, outputMint = zeroForOne ? pool.tokenMint1 : pool.tokenMint0;
  const accounts = [meta(payer, true, true), meta(AUTHORITY, false, false), meta(pool.ammConfig, false, false), meta(pool.address, false, true), meta(inputTokenAccount, false, true), meta(outputTokenAccount, false, true), meta(inputVault, false, true), meta(outputVault, false, true), meta(SPL_TOKEN_PROGRAM, false, false), meta(SPL_TOKEN_PROGRAM, false, false), meta(inputMint, false, false), meta(outputMint, false, false), meta(pool.observationKey, false, true)];
  const data = Buffer.concat([SWAP_BASE_INPUT_DISCRIMINATOR, u64(amount), u64(minimumOutput)]);
  return { programId: RAYDIUM_CPMM_PROGRAM, accounts, dataHex: data.toString("hex"), evidence: { pool: pool.address, stateSlot: quote.stateSlot, configSlot: quote.configSlot, balanceSlot: quote.balanceSlot, amountInRaw: amount.toString(), quotedOutputRaw: quotedOutput.toString(), minimumOutputRaw: minimumOutput.toString(), zeroForOne } };
}

export function prepareRaydiumCpmmSwapBaseInputSimulation({ quote, pool, payer, inputTokenAccount, outputTokenAccount, inputPreAmountRaw, outputPreAmountRaw, minimumOutputRaw, recentBlockhash }) {
  const instruction = buildRaydiumCpmmSwapBaseInputInstruction({ quote, pool, payer, inputTokenAccount, outputTokenAccount, minimumOutputRaw }), transaction = buildUnsignedLegacyTransaction({ feePayer: payer, recentBlockhash, instructions: [instruction] });
  const inputPre = integer(inputPreAmountRaw, "Raydium CPMM input balance"), outputPre = integer(outputPreAmountRaw, "Raydium CPMM output balance"), amount = integer(quote.amountInRaw, "Raydium CPMM amount"), minimumOutput = integer(minimumOutputRaw, "Raydium CPMM minimum output"), quotedOutput = integer(quote.amountOutRaw, "Raydium CPMM quoted output");
  if (inputPre < amount || outputPre + quotedOutput > U64_MAX) throw new Error("Raydium CPMM simulation balance bounds are invalid");
  const prepared = { schemaVersion: 1, type: "raydium_cpmm_swap_base_input_simulation", protocol: "raydium-cpmm", commitment: "finalized", minContextSlot: Math.max(quote.stateSlot, quote.configSlot, quote.balanceSlot), transaction, instructionEvidence: instruction.evidence, simulationPolicy: { allowedProgramIds: [RAYDIUM_CPMM_PROGRAM], requiredProgramIds: [RAYDIUM_CPMM_PROGRAM], instructionPolicies: transaction.instructionPolicies, accountExpectations: [{ address: inputTokenAccount, mint: quote.inputMint, preAmountRaw: inputPre.toString(), minDeltaRaw: (-amount).toString(), maxDeltaRaw: (-1n).toString() }, { address: outputTokenAccount, mint: quote.outputMint, preAmountRaw: outputPre.toString(), minDeltaRaw: minimumOutput.toString(), maxDeltaRaw: quotedOutput.toString() }] } };
  prepared.preparationHash = crypto.createHash("sha256").update(JSON.stringify(prepared)).digest("hex"); return prepared;
}

export async function simulatePreparedRaydiumCpmmSwapBaseInput(client, { preparation, expectedGenesisHash, genesisHash }) {
  const { preparationHash, ...unsignedPreparation } = preparation ?? {}, expectedHash = crypto.createHash("sha256").update(JSON.stringify(unsignedPreparation)).digest("hex");
  if (preparation?.schemaVersion !== 1 || preparation.type !== "raydium_cpmm_swap_base_input_simulation" || preparation.protocol !== "raydium-cpmm" || preparation.commitment !== "finalized" || preparation.transaction?.signed !== false || preparation.transaction.submitted !== false || !Number.isSafeInteger(preparation.minContextSlot) || preparation.minContextSlot < 0 || !preparation.simulationPolicy || preparationHash !== expectedHash) throw new Error("Raydium CPMM simulation preparation is invalid");
  const policy = preparation.simulationPolicy, receipt = await simulateUnsignedTransaction(client, { transactionBase64: preparation.transaction.transactionBase64, minContextSlot: preparation.minContextSlot, expectedGenesisHash, genesisHash, allowedProgramIds: policy.allowedProgramIds, requiredProgramIds: policy.requiredProgramIds, instructionPolicies: policy.instructionPolicies, accountExpectations: policy.accountExpectations });
  if (receipt.transactionHash !== preparation.transaction.transactionHash || receipt.messageHash !== preparation.transaction.messageHash || receipt.simulationSlot < preparation.minContextSlot || receipt.messageVersion !== "legacy" || receipt.programIds?.length !== 1 || receipt.programIds[0] !== RAYDIUM_CPMM_PROGRAM) throw new Error("Raydium CPMM simulation receipt does not match preparation");
  const result = { ...receipt, type: "raydium_cpmm_swap_base_input_simulation_receipt", protocol: "raydium-cpmm", preparationHash, preparationMessageHash: preparation.transaction.messageHash, instructionEvidence: preparation.instructionEvidence }; result.receiptHash = crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex"); return result;
}

export const RAYDIUM_CPMM_EXECUTION_CONSTANTS = Object.freeze({ authority: AUTHORITY, swapBaseInputDiscriminatorHex: SWAP_BASE_INPUT_DISCRIMINATOR.toString("hex") });
