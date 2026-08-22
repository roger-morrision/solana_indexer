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

function takeShortVec(bytes, cursor) { const decoded = decodeShortVec(bytes.subarray(cursor.offset)); cursor.offset += decoded.offset; return decoded.value; }
function take(bytes, cursor, length) { if (!Number.isSafeInteger(length) || length < 0 || cursor.offset + length > bytes.length) throw new Error("transaction message is truncated"); const value = bytes.subarray(cursor.offset, cursor.offset + length); cursor.offset += length; return value; }

export function validateUnsignedTransactionBase64(transactionBase64) {
  if (typeof transactionBase64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(transactionBase64)) throw new Error("transaction must be canonical base64");
  const bytes = Buffer.from(transactionBase64, "base64"), normalized = transactionBase64.replace(/=+$/, "");
  if (bytes.toString("base64").replace(/=+$/, "") !== normalized || bytes.length < 66 || bytes.length > MAX_TRANSACTION_BYTES) throw new Error("transaction encoding or size is invalid");
  const signatures = decodeShortVec(bytes); if (signatures.value < 1 || signatures.value > MAX_SIGNATURES || signatures.offset + (signatures.value * 64) >= bytes.length) throw new Error("transaction signature vector is invalid");
  const signatureBytes = bytes.subarray(signatures.offset, signatures.offset + signatures.value * 64); if (signatureBytes.some((byte) => byte !== 0)) throw new Error("signed transactions are forbidden at the simulation boundary");
  const messageOffset = signatures.offset + signatures.value * 64; return { bytes, signatureCount: signatures.value, messageOffset, transactionHash: crypto.createHash("sha256").update(bytes).digest("hex"), messageHash: crypto.createHash("sha256").update(bytes.subarray(messageOffset)).digest("hex") };
}

export function inspectUnsignedTransactionPrograms(transactionBase64, { allowedProgramIds, requiredProgramIds = [] }) {
  const validated = validateUnsignedTransactionBase64(transactionBase64); if (!Array.isArray(allowedProgramIds) || !allowedProgramIds.length || !Array.isArray(requiredProgramIds)) throw new Error("transaction program policy is invalid"); const allowed = new Set(allowedProgramIds), required = new Set(requiredProgramIds); if (allowed.size !== allowedProgramIds.length || requiredProgramIds.some((program) => !allowed.has(program))) throw new Error("transaction program policy is invalid");
  const bytes = validated.bytes, cursor = { offset: validated.messageOffset }; let version = "legacy", first = take(bytes, cursor, 1)[0]; if ((first & 0x80) !== 0) { if ((first & 0x7f) !== 0) throw new Error("unsupported transaction message version"); version = "v0"; first = take(bytes, cursor, 1)[0]; }
  const requiredSignatures = first, readonlySigned = take(bytes, cursor, 1)[0], readonlyUnsigned = take(bytes, cursor, 1)[0]; if (requiredSignatures !== validated.signatureCount || readonlySigned > requiredSignatures) throw new Error("transaction header signature policy is invalid");
  const accountCount = takeShortVec(bytes, cursor); if (accountCount < requiredSignatures || accountCount > 64 || readonlyUnsigned > accountCount - requiredSignatures) throw new Error("transaction account header is invalid"); const accounts = Array.from({ length: accountCount }, () => base58(take(bytes, cursor, 32))); take(bytes, cursor, 32);
  const instructionCount = takeShortVec(bytes, cursor); if (instructionCount < 1 || instructionCount > 64) throw new Error("transaction instruction count is invalid"); const programs = [];
  for (let index = 0; index < instructionCount; index++) { const programIndex = take(bytes, cursor, 1)[0], accountIndexes = takeShortVec(bytes, cursor); if (programIndex >= accounts.length || accountIndexes > accounts.length) throw new Error("transaction instruction index is invalid"); for (const accountIndex of take(bytes, cursor, accountIndexes)) if (accountIndex >= accounts.length) throw new Error("transaction instruction account index is invalid"); take(bytes, cursor, takeShortVec(bytes, cursor)); const program = accounts[programIndex]; if (!allowed.has(program)) throw new Error("transaction invokes a program outside the allowlist"); programs.push(program); required.delete(program); }
  if (version === "v0" && takeShortVec(bytes, cursor) !== 0) throw new Error("address-table transactions require independent lookup resolution"); if (cursor.offset !== bytes.length || required.size) throw new Error(required.size ? "transaction is missing a required program" : "transaction message has trailing data");
  return { messageVersion: version, messageHash: validated.messageHash, signatureCount: validated.signatureCount, accountCount, instructionCount, programIds: [...new Set(programs)] };
}

function tokenExpectations(rows) {
  if (!Array.isArray(rows) || rows.length > 32) throw new Error("simulation token expectations are invalid"); const addresses = new Set();
  return rows.map((row) => { if (typeof row?.address !== "string" || !row.address || addresses.has(row.address) || typeof row.mint !== "string" || !row.mint || !/^\d+$/.test(row.preAmountRaw ?? "") || !/^-?\d+$/.test(row.minDeltaRaw ?? "") || !/^-?\d+$/.test(row.maxDeltaRaw ?? "") || BigInt(row.minDeltaRaw) > BigInt(row.maxDeltaRaw)) throw new Error("simulation token expectation is invalid"); addresses.add(row.address); return row; });
}

export function decodeSimulatedTokenAccount(account, expectedMint) {
  if (!TOKEN_PROGRAMS.has(account?.owner) || !Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error("simulated token account is invalid"); const bytes = Buffer.from(account.data[0], "base64"); if (bytes.length < 72 || base58(bytes.subarray(0, 32)) !== expectedMint) throw new Error("simulated token account mint mismatch"); return { programId: account.owner, mint: expectedMint, amountRaw: bytes.readBigUInt64LE(64).toString() };
}

export async function simulateUnsignedTransaction(client, { transactionBase64, minContextSlot, expectedGenesisHash, genesisHash, accountExpectations = [], allowedProgramIds = null, requiredProgramIds = [] }) {
  if (!client || typeof client.call !== "function" || !Number.isSafeInteger(minContextSlot) || minContextSlot < 0 || typeof expectedGenesisHash !== "string" || genesisHash !== expectedGenesisHash) throw new Error("simulation provenance is invalid");
  validateLocalRpcUrl(client.endpoint);
  const validated = validateUnsignedTransactionBase64(transactionBase64), inspection = allowedProgramIds == null ? null : inspectUnsignedTransactionPrograms(transactionBase64, { allowedProgramIds, requiredProgramIds }), expectations = tokenExpectations(accountExpectations), options = { encoding: "base64", commitment: "finalized", sigVerify: false, replaceRecentBlockhash: true, innerInstructions: true, minContextSlot }; if (expectations.length) options.accounts = { encoding: "base64", addresses: expectations.map((row) => row.address) }; const result = await client.call("simulateTransaction", [transactionBase64, options]);
  const slot = result?.context?.slot, value = result?.value, logs = value?.logs;
  if (!Number.isSafeInteger(slot) || slot < minContextSlot || !value || !Array.isArray(logs) || logs.length > 1_000 || logs.some((line) => typeof line !== "string" || Buffer.byteLength(line) > 4_096) || Buffer.byteLength(logs.join("\n")) > 262_144 || !Number.isSafeInteger(value.unitsConsumed) || value.unitsConsumed < 0) throw new Error("simulation response is invalid");
  if (value.err !== null) { const error = new Error("transaction simulation failed"); error.simulationError = value.err; throw error; }
  if (expectations.length && (!Array.isArray(value.accounts) || value.accounts.length !== expectations.length)) throw new Error("simulation token effects are unavailable"); const tokenEffects = expectations.map((expected, index) => { const decoded = decodeSimulatedTokenAccount(value.accounts[index], expected.mint), delta = BigInt(decoded.amountRaw) - BigInt(expected.preAmountRaw); if (delta < BigInt(expected.minDeltaRaw) || delta > BigInt(expected.maxDeltaRaw)) throw new Error("simulation token effect is outside the approved range"); return { address: expected.address, mint: expected.mint, programId: decoded.programId, preAmountRaw: expected.preAmountRaw, postAmountRaw: decoded.amountRaw, deltaRaw: delta.toString(), minDeltaRaw: expected.minDeltaRaw, maxDeltaRaw: expected.maxDeltaRaw }; });
  const logsHash = crypto.createHash("sha256").update(logs.join("\n")).digest("hex"), returnDataHash = value.returnData == null ? null : crypto.createHash("sha256").update(JSON.stringify(value.returnData)).digest("hex");
  return { schemaVersion: 1, status: "simulated", submitted: false, signed: false, commitment: "finalized", genesisHash, minContextSlot, simulationSlot: slot, transactionHash: validated.transactionHash, messageHash: validated.messageHash, signatureCount: validated.signatureCount, messageVersion: inspection?.messageVersion ?? null, programIds: inspection?.programIds ?? null, unitsConsumed: value.unitsConsumed, loadedAccountsDataSize: Number.isSafeInteger(value.loadedAccountsDataSize) ? value.loadedAccountsDataSize : null, logsCount: logs.length, logsHash, returnDataHash, tokenEffects };
}

function signedTransactionMessageHash(transactionBase64) { if (typeof transactionBase64 !== "string") throw new Error("landed transaction encoding is invalid"); const bytes = Buffer.from(transactionBase64, "base64"), signatures = decodeShortVec(bytes), messageOffset = signatures.offset + signatures.value * 64; if (signatures.value < 1 || signatures.value > MAX_SIGNATURES || messageOffset >= bytes.length || bytes.subarray(signatures.offset, messageOffset).every((byte) => byte === 0)) throw new Error("landed transaction signatures are invalid"); return crypto.createHash("sha256").update(bytes.subarray(messageOffset)).digest("hex"); }

export async function verifyFinalizedLandedTransaction(client, { signature, simulationReceipt, expectedGenesisHash, genesisHash }) {
  if (!client || typeof client.call !== "function" || !/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(signature ?? "") || simulationReceipt?.status !== "simulated" || simulationReceipt.submitted !== false || simulationReceipt.signed !== false || !/^[0-9a-f]{64}$/.test(simulationReceipt.messageHash ?? "") || genesisHash !== expectedGenesisHash || simulationReceipt.genesisHash !== genesisHash) throw new Error("landed confirmation provenance is invalid"); validateLocalRpcUrl(client.endpoint);
  const statuses = await client.call("getSignatureStatuses", [[signature], { searchTransactionHistory: true }]), status = statuses?.value?.[0]; if (!status || status.err !== null || status.confirmationStatus !== "finalized" || !Number.isSafeInteger(status.slot) || status.slot < simulationReceipt.simulationSlot) throw new Error("transaction is not finalized successfully after simulation");
  const landed = await client.call("getTransaction", [signature, { commitment: "finalized", encoding: "base64", maxSupportedTransactionVersion: 0 }]); if (!landed || landed.slot !== status.slot || landed.meta?.err !== null || !Array.isArray(landed.transaction) || landed.transaction[1] !== "base64" || signedTransactionMessageHash(landed.transaction[0]) !== simulationReceipt.messageHash) throw new Error("finalized transaction does not match the simulated message");
  return { schemaVersion: 1, status: "finalized", submittedByIndexer: false, signature, genesisHash, simulationSlot: simulationReceipt.simulationSlot, finalizedSlot: status.slot, messageHash: simulationReceipt.messageHash, confirmations: status.confirmations ?? null };
}

export const TRANSACTION_SIMULATION_LIMITS = Object.freeze({ maxTransactionBytes: MAX_TRANSACTION_BYTES, maxSignatures: MAX_SIGNATURES });
