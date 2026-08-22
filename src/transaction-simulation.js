import crypto from "node:crypto";
import { validateLocalRpcUrl } from "./local-validator-exporter.js";

const MAX_TRANSACTION_BYTES = 1_232;
const MAX_SIGNATURES = 32;
const TOKEN_PROGRAMS = new Set(["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"]);

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }

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

function tokenExpectations(rows) {
  if (!Array.isArray(rows) || rows.length > 32) throw new Error("simulation token expectations are invalid"); const addresses = new Set();
  return rows.map((row) => { if (typeof row?.address !== "string" || !row.address || addresses.has(row.address) || typeof row.mint !== "string" || !row.mint || !/^\d+$/.test(row.preAmountRaw ?? "") || !/^-?\d+$/.test(row.minDeltaRaw ?? "") || !/^-?\d+$/.test(row.maxDeltaRaw ?? "") || BigInt(row.minDeltaRaw) > BigInt(row.maxDeltaRaw)) throw new Error("simulation token expectation is invalid"); addresses.add(row.address); return row; });
}

export function decodeSimulatedTokenAccount(account, expectedMint) {
  if (!TOKEN_PROGRAMS.has(account?.owner) || !Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error("simulated token account is invalid"); const bytes = Buffer.from(account.data[0], "base64"); if (bytes.length < 72 || base58(bytes.subarray(0, 32)) !== expectedMint) throw new Error("simulated token account mint mismatch"); return { programId: account.owner, mint: expectedMint, amountRaw: bytes.readBigUInt64LE(64).toString() };
}

export async function simulateUnsignedTransaction(client, { transactionBase64, minContextSlot, expectedGenesisHash, genesisHash, accountExpectations = [] }) {
  if (!client || typeof client.call !== "function" || !Number.isSafeInteger(minContextSlot) || minContextSlot < 0 || typeof expectedGenesisHash !== "string" || genesisHash !== expectedGenesisHash) throw new Error("simulation provenance is invalid");
  validateLocalRpcUrl(client.endpoint);
  const validated = validateUnsignedTransactionBase64(transactionBase64), expectations = tokenExpectations(accountExpectations), options = { encoding: "base64", commitment: "finalized", sigVerify: false, replaceRecentBlockhash: true, innerInstructions: true, minContextSlot }; if (expectations.length) options.accounts = { encoding: "base64", addresses: expectations.map((row) => row.address) }; const result = await client.call("simulateTransaction", [transactionBase64, options]);
  const slot = result?.context?.slot, value = result?.value, logs = value?.logs;
  if (!Number.isSafeInteger(slot) || slot < minContextSlot || !value || !Array.isArray(logs) || logs.length > 1_000 || logs.some((line) => typeof line !== "string" || Buffer.byteLength(line) > 4_096) || Buffer.byteLength(logs.join("\n")) > 262_144 || !Number.isSafeInteger(value.unitsConsumed) || value.unitsConsumed < 0) throw new Error("simulation response is invalid");
  if (value.err !== null) { const error = new Error("transaction simulation failed"); error.simulationError = value.err; throw error; }
  if (expectations.length && (!Array.isArray(value.accounts) || value.accounts.length !== expectations.length)) throw new Error("simulation token effects are unavailable"); const tokenEffects = expectations.map((expected, index) => { const decoded = decodeSimulatedTokenAccount(value.accounts[index], expected.mint), delta = BigInt(decoded.amountRaw) - BigInt(expected.preAmountRaw); if (delta < BigInt(expected.minDeltaRaw) || delta > BigInt(expected.maxDeltaRaw)) throw new Error("simulation token effect is outside the approved range"); return { address: expected.address, mint: expected.mint, programId: decoded.programId, preAmountRaw: expected.preAmountRaw, postAmountRaw: decoded.amountRaw, deltaRaw: delta.toString(), minDeltaRaw: expected.minDeltaRaw, maxDeltaRaw: expected.maxDeltaRaw }; });
  const logsHash = crypto.createHash("sha256").update(logs.join("\n")).digest("hex"), returnDataHash = value.returnData == null ? null : crypto.createHash("sha256").update(JSON.stringify(value.returnData)).digest("hex");
  return { schemaVersion: 1, status: "simulated", submitted: false, signed: false, commitment: "finalized", genesisHash, minContextSlot, simulationSlot: slot, transactionHash: validated.transactionHash, signatureCount: validated.signatureCount, unitsConsumed: value.unitsConsumed, loadedAccountsDataSize: Number.isSafeInteger(value.loadedAccountsDataSize) ? value.loadedAccountsDataSize : null, logsCount: logs.length, logsHash, returnDataHash, tokenEffects };
}

export const TRANSACTION_SIMULATION_LIMITS = Object.freeze({ maxTransactionBytes: MAX_TRANSACTION_BYTES, maxSignatures: MAX_SIGNATURES });
