import crypto from "node:crypto";
import { validateLocalRpcUrl } from "./local-validator-exporter.js";

const MAX_TRANSACTION_BYTES = 1_232;
const MAX_SIGNATURES = 32;

function decodeShortVec(bytes) {
  let value = 0, shift = 0, offset = 0;
  while (offset < bytes.length && offset < 3) { const byte = bytes[offset++]; value |= (byte & 0x7f) << shift; if ((byte & 0x80) === 0) return { value, offset }; shift += 7; }
  throw new Error("transaction signature vector is malformed");
}

export function validateUnsignedTransactionBase64(transactionBase64) {
  if (typeof transactionBase64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(transactionBase64)) throw new Error("transaction must be canonical base64");
  const bytes = Buffer.from(transactionBase64, "base64"), normalized = transactionBase64.replace(/=+$/, "");
  if (bytes.toString("base64").replace(/=+$/, "") !== normalized || bytes.length < 66 || bytes.length > MAX_TRANSACTION_BYTES) throw new Error("transaction encoding or size is invalid");
  const signatures = decodeShortVec(bytes); if (signatures.value < 1 || signatures.value > MAX_SIGNATURES || signatures.offset + (signatures.value * 64) >= bytes.length) throw new Error("transaction signature vector is invalid");
  const signatureBytes = bytes.subarray(signatures.offset, signatures.offset + signatures.value * 64); if (signatureBytes.some((byte) => byte !== 0)) throw new Error("signed transactions are forbidden at the simulation boundary");
  return { bytes, signatureCount: signatures.value, transactionHash: crypto.createHash("sha256").update(bytes).digest("hex") };
}

export async function simulateUnsignedTransaction(client, { transactionBase64, minContextSlot, expectedGenesisHash, genesisHash }) {
  if (!client || typeof client.call !== "function" || !Number.isSafeInteger(minContextSlot) || minContextSlot < 0 || typeof expectedGenesisHash !== "string" || genesisHash !== expectedGenesisHash) throw new Error("simulation provenance is invalid");
  validateLocalRpcUrl(client.endpoint);
  const validated = validateUnsignedTransactionBase64(transactionBase64), result = await client.call("simulateTransaction", [transactionBase64, { encoding: "base64", commitment: "finalized", sigVerify: false, replaceRecentBlockhash: true, innerInstructions: true, minContextSlot }]);
  const slot = result?.context?.slot, value = result?.value, logs = value?.logs;
  if (!Number.isSafeInteger(slot) || slot < minContextSlot || !value || !Array.isArray(logs) || logs.length > 1_000 || logs.some((line) => typeof line !== "string" || Buffer.byteLength(line) > 4_096) || Buffer.byteLength(logs.join("\n")) > 262_144 || !Number.isSafeInteger(value.unitsConsumed) || value.unitsConsumed < 0) throw new Error("simulation response is invalid");
  if (value.err !== null) { const error = new Error("transaction simulation failed"); error.simulationError = value.err; throw error; }
  const logsHash = crypto.createHash("sha256").update(logs.join("\n")).digest("hex"), returnDataHash = value.returnData == null ? null : crypto.createHash("sha256").update(JSON.stringify(value.returnData)).digest("hex");
  return { schemaVersion: 1, status: "simulated", submitted: false, signed: false, commitment: "finalized", genesisHash, minContextSlot, simulationSlot: slot, transactionHash: validated.transactionHash, signatureCount: validated.signatureCount, unitsConsumed: value.unitsConsumed, loadedAccountsDataSize: Number.isSafeInteger(value.loadedAccountsDataSize) ? value.loadedAccountsDataSize : null, logsCount: logs.length, logsHash, returnDataHash };
}

export const TRANSACTION_SIMULATION_LIMITS = Object.freeze({ maxTransactionBytes: MAX_TRANSACTION_BYTES, maxSignatures: MAX_SIGNATURES });
