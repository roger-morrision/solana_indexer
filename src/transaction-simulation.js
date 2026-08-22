import crypto from "node:crypto";
import { validateLocalRpcUrl } from "./local-validator-exporter.js";

const MAX_TRANSACTION_BYTES = 1_232;
const MAX_SIGNATURES = 32;
const TOKEN_PROGRAMS = new Set(["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"]);

function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }

function base58Bytes(value) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  if (typeof value !== "string" || value.length < 1 || value.length > 44) throw new Error("Solana address is invalid");
  let number = 0n;
  for (const character of value) { const digit = alphabet.indexOf(character); if (digit < 0) throw new Error("Solana address is invalid"); number = number * 58n + BigInt(digit); }
  const bytes = []; while (number) { bytes.unshift(Number(number & 255n)); number >>= 8n; }
  let leading = 0; while (value[leading] === "1") leading++;
  const decoded = Buffer.concat([Buffer.alloc(leading), Buffer.from(bytes)]);
  if (decoded.length !== 32 || base58(decoded) !== value) throw new Error("Solana address is invalid");
  return decoded;
}

function shortVec(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 16_383) throw new Error("short vector length is invalid");
  const bytes = []; do { let byte = value & 0x7f; value >>= 7; if (value) byte |= 0x80; bytes.push(byte); } while (value); return Buffer.from(bytes);
}

export function buildUnsignedLegacyTransaction({ feePayer, recentBlockhash, instructions }) {
  base58Bytes(feePayer); const blockhash = base58Bytes(recentBlockhash);
  if (!Array.isArray(instructions) || instructions.length < 1 || instructions.length > 64) throw new Error("transaction instructions are invalid");
  const metas = new Map([[feePayer, { address: feePayer, signer: true, writable: true, payer: true }]]), normalized = instructions.map((instruction) => {
    if (!instruction || !Array.isArray(instruction.accounts) || instruction.accounts.length > 64 || typeof instruction.dataHex !== "string" || !/^(?:[0-9a-f]{2})*$/.test(instruction.dataHex)) throw new Error("transaction instruction is invalid");
    base58Bytes(instruction.programId);
    for (const account of instruction.accounts) { if (!account || typeof account.signer !== "boolean" || typeof account.writable !== "boolean") throw new Error("transaction account meta is invalid"); base58Bytes(account.address); const prior = metas.get(account.address); metas.set(account.address, { address: account.address, signer: account.signer || prior?.signer === true, writable: account.writable || prior?.writable === true, payer: prior?.payer === true }); }
    const programMeta = metas.get(instruction.programId); if (programMeta?.signer || programMeta?.writable) throw new Error("program account cannot request signer or writable privileges"); metas.set(instruction.programId, { address: instruction.programId, signer: false, writable: false, payer: false });
    return instruction;
  });
  const rank = (meta) => meta.payer ? 0 : meta.signer && meta.writable ? 1 : meta.signer ? 2 : meta.writable ? 3 : 4, accounts = [...metas.values()].sort((left, right) => rank(left) - rank(right) || left.address.localeCompare(right.address));
  if (accounts.length > 64) throw new Error("transaction account count is invalid");
  const requiredSignatures = accounts.filter((meta) => meta.signer).length; if (requiredSignatures < 1 || requiredSignatures > MAX_SIGNATURES) throw new Error("transaction signature count is invalid"); const readonlySigned = accounts.filter((meta) => meta.signer && !meta.writable).length, readonlyUnsigned = accounts.filter((meta) => !meta.signer && !meta.writable).length, indexes = new Map(accounts.map((meta, index) => [meta.address, index]));
  const compiled = normalized.map((instruction) => Buffer.concat([Buffer.from([indexes.get(instruction.programId)]), shortVec(instruction.accounts.length), Buffer.from(instruction.accounts.map((account) => indexes.get(account.address))), shortVec(instruction.dataHex.length / 2), Buffer.from(instruction.dataHex, "hex")]));
  const message = Buffer.concat([Buffer.from([requiredSignatures, readonlySigned, readonlyUnsigned]), shortVec(accounts.length), ...accounts.map((meta) => base58Bytes(meta.address)), blockhash, shortVec(compiled.length), ...compiled]), transaction = Buffer.concat([shortVec(requiredSignatures), Buffer.alloc(requiredSignatures * 64), message]);
  if (transaction.length > MAX_TRANSACTION_BYTES) throw new Error("constructed transaction exceeds the Solana packet limit");
  const transactionBase64 = transaction.toString("base64"), policy = normalized.map((instruction) => ({ programId: instruction.programId, accounts: instruction.accounts.map((account) => ({ address: account.address, signer: metas.get(account.address).signer, writable: metas.get(account.address).writable })), dataHex: instruction.dataHex }));
  const inspection = inspectUnsignedTransactionPrograms(transactionBase64, { allowedProgramIds: [...new Set(normalized.map((instruction) => instruction.programId))], instructionPolicies: policy });
  return { schemaVersion: 1, transactionBase64, transactionHash: crypto.createHash("sha256").update(transaction).digest("hex"), messageHash: inspection.messageHash, signatureCount: requiredSignatures, messageVersion: "legacy", instructionPolicies: policy, submitted: false, signed: false };
}

export function verifySignedTransactionBase64({ signedTransactionBase64, unsignedTransactionBase64, expectedMessageHash }) {
  const unsigned = validateUnsignedTransactionBase64(unsignedTransactionBase64);
  if (unsigned.messageHash !== expectedMessageHash || typeof signedTransactionBase64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(signedTransactionBase64)) throw new Error("signed transaction identity is invalid");
  const signedBytes = Buffer.from(signedTransactionBase64, "base64"); if (signedBytes.toString("base64").replace(/=+$/, "") !== signedTransactionBase64.replace(/=+$/, "") || signedBytes.length > MAX_TRANSACTION_BYTES) throw new Error("signed transaction encoding or size is invalid");
  const signatures = decodeShortVec(signedBytes), messageOffset = signatures.offset + signatures.value * 64; if (signatures.value !== unsigned.signatureCount || messageOffset >= signedBytes.length || !signedBytes.subarray(messageOffset).equals(unsigned.bytes.subarray(unsigned.messageOffset))) throw new Error("signed transaction message does not match approval");
  const message = signedBytes.subarray(messageOffset); if ((message[0] & 0x80) !== 0 || message[0] !== signatures.value) throw new Error("signed transaction header is invalid"); const cursor = { offset: 3 }, accountCount = takeShortVec(message, cursor); if (accountCount < signatures.value) throw new Error("signed transaction accounts are invalid"); const signerKeys = Array.from({ length: signatures.value }, () => take(message, cursor, 32)), spkiPrefix = Buffer.from("302a300506032b6570032100", "hex"), signerAddresses = [];
  for (let index = 0; index < signatures.value; index++) { const signature = signedBytes.subarray(signatures.offset + index * 64, signatures.offset + (index + 1) * 64), publicKey = crypto.createPublicKey({ key: Buffer.concat([spkiPrefix, signerKeys[index]]), format: "der", type: "spki" }); if (!crypto.verify(null, message, publicKey, signature)) throw new Error("signed transaction signature is invalid"); signerAddresses.push(base58(signerKeys[index])); }
  return { schemaVersion: 1, status: "signature_verified", submitted: false, signed: true, transactionBase64: signedTransactionBase64, transactionHash: crypto.createHash("sha256").update(signedBytes).digest("hex"), approvedTransactionHash: unsigned.transactionHash, messageHash: expectedMessageHash, signatureCount: signatures.value, signerAddresses };
}

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

export function inspectUnsignedTransactionPrograms(transactionBase64, { allowedProgramIds, requiredProgramIds = [], instructionPolicies = null }) {
  const validated = validateUnsignedTransactionBase64(transactionBase64); if (!Array.isArray(allowedProgramIds) || !allowedProgramIds.length || !Array.isArray(requiredProgramIds) || (instructionPolicies != null && (!Array.isArray(instructionPolicies) || instructionPolicies.length > 64))) throw new Error("transaction program policy is invalid"); const allowed = new Set(allowedProgramIds), required = new Set(requiredProgramIds); if (allowed.size !== allowedProgramIds.length || requiredProgramIds.some((program) => !allowed.has(program))) throw new Error("transaction program policy is invalid");
  const bytes = validated.bytes, cursor = { offset: validated.messageOffset }; let version = "legacy", first = take(bytes, cursor, 1)[0]; if ((first & 0x80) !== 0) { if ((first & 0x7f) !== 0) throw new Error("unsupported transaction message version"); version = "v0"; first = take(bytes, cursor, 1)[0]; }
  const requiredSignatures = first, readonlySigned = take(bytes, cursor, 1)[0], readonlyUnsigned = take(bytes, cursor, 1)[0]; if (requiredSignatures !== validated.signatureCount || readonlySigned > requiredSignatures) throw new Error("transaction header signature policy is invalid");
  const accountCount = takeShortVec(bytes, cursor); if (accountCount < requiredSignatures || accountCount > 64 || readonlyUnsigned > accountCount - requiredSignatures) throw new Error("transaction account header is invalid"); const accounts = Array.from({ length: accountCount }, () => base58(take(bytes, cursor, 32))); take(bytes, cursor, 32);
  const accountMeta = accounts.map((address, index) => ({ address, signer: index < requiredSignatures, writable: index < requiredSignatures ? index < requiredSignatures - readonlySigned : index < accountCount - readonlyUnsigned }));
  const instructionCount = takeShortVec(bytes, cursor); if (instructionCount < 1 || instructionCount > 64 || (instructionPolicies != null && instructionPolicies.length !== instructionCount)) throw new Error("transaction instruction count is invalid"); const programs = [], instructions = [];
  for (let index = 0; index < instructionCount; index++) { const programIndex = take(bytes, cursor, 1)[0], accountIndexCount = takeShortVec(bytes, cursor); if (programIndex >= accounts.length || accountIndexCount > accounts.length) throw new Error("transaction instruction index is invalid"); const accountIndexes = [...take(bytes, cursor, accountIndexCount)]; for (const accountIndex of accountIndexes) if (accountIndex >= accounts.length) throw new Error("transaction instruction account index is invalid"); const data = take(bytes, cursor, takeShortVec(bytes, cursor)), programId = accounts[programIndex], instruction = { programId, accounts: accountIndexes.map((accountIndex) => accountMeta[accountIndex]), dataHex: data.toString("hex") }; if (!allowed.has(programId)) throw new Error("transaction invokes a program outside the allowlist"); if (instructionPolicies != null) { const policy = instructionPolicies[index]; if (!policy || policy.programId !== programId || !Array.isArray(policy.accounts) || policy.accounts.length !== instruction.accounts.length || typeof policy.dataHex !== "string" || !/^(?:[0-9a-f]{2})*$/.test(policy.dataHex) || policy.dataHex !== instruction.dataHex || policy.accounts.some((expected, accountIndex) => expected?.address !== instruction.accounts[accountIndex].address || expected.signer !== instruction.accounts[accountIndex].signer || expected.writable !== instruction.accounts[accountIndex].writable)) throw new Error("transaction instruction does not match the approved policy"); } programs.push(programId); instructions.push(instruction); required.delete(programId); }
  if (version === "v0" && takeShortVec(bytes, cursor) !== 0) throw new Error("address-table transactions require independent lookup resolution"); if (cursor.offset !== bytes.length || required.size) throw new Error(required.size ? "transaction is missing a required program" : "transaction message has trailing data");
  return { messageVersion: version, messageHash: validated.messageHash, signatureCount: validated.signatureCount, accountCount, instructionCount, programIds: [...new Set(programs)], instructions };
}

function tokenExpectations(rows) {
  if (!Array.isArray(rows) || rows.length > 32) throw new Error("simulation token expectations are invalid"); const addresses = new Set();
  return rows.map((row) => { if (typeof row?.address !== "string" || !row.address || addresses.has(row.address) || typeof row.mint !== "string" || !row.mint || !/^\d+$/.test(row.preAmountRaw ?? "") || !/^-?\d+$/.test(row.minDeltaRaw ?? "") || !/^-?\d+$/.test(row.maxDeltaRaw ?? "") || BigInt(row.minDeltaRaw) > BigInt(row.maxDeltaRaw)) throw new Error("simulation token expectation is invalid"); addresses.add(row.address); return row; });
}

export function decodeSimulatedTokenAccount(account, expectedMint) {
  if (!TOKEN_PROGRAMS.has(account?.owner) || !Array.isArray(account?.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error("simulated token account is invalid"); const bytes = Buffer.from(account.data[0], "base64"); if (bytes.length < 72 || base58(bytes.subarray(0, 32)) !== expectedMint) throw new Error("simulated token account mint mismatch"); return { programId: account.owner, mint: expectedMint, amountRaw: bytes.readBigUInt64LE(64).toString() };
}

export async function simulateUnsignedTransaction(client, { transactionBase64, minContextSlot, expectedGenesisHash, genesisHash, accountExpectations = [], allowedProgramIds = null, requiredProgramIds = [], instructionPolicies = null }) {
  if (!client || typeof client.call !== "function" || !Number.isSafeInteger(minContextSlot) || minContextSlot < 0 || typeof expectedGenesisHash !== "string" || genesisHash !== expectedGenesisHash) throw new Error("simulation provenance is invalid");
  validateLocalRpcUrl(client.endpoint);
  const validated = validateUnsignedTransactionBase64(transactionBase64), inspection = allowedProgramIds == null ? null : inspectUnsignedTransactionPrograms(transactionBase64, { allowedProgramIds, requiredProgramIds, instructionPolicies }), expectations = tokenExpectations(accountExpectations), options = { encoding: "base64", commitment: "finalized", sigVerify: false, replaceRecentBlockhash: true, innerInstructions: true, minContextSlot }; if (expectations.length) options.accounts = { encoding: "base64", addresses: expectations.map((row) => row.address) }; const result = await client.call("simulateTransaction", [transactionBase64, options]);
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
