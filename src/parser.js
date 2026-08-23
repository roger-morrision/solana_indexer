import crypto from "node:crypto";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { PROGRAM_REGISTRY_VERSION, programRegistration } from "./program-registry.js";

const TOKEN_PROGRAMS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]);
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const RAYDIUM_CPMM = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";
const RAYDIUM_CLMM = "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK";
const ORCA_WHIRLPOOL = "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc";
const PUMP_AMM = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const METEORA_DLMM = "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo";
const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const STAKE_PROGRAM = "Stake11111111111111111111111111111111111111";
function u64(value, field) { if (typeof value !== "string" || !/^\d+$/.test(value) || BigInt(value) > 18_446_744_073_709_551_615n) throw new Error(`${field} must be a decimal u64 string`); return value; }
function u128(value, field) { if (typeof value !== "string" || !/^\d+$/.test(value) || BigInt(value) > 340_282_366_920_938_463_463_374_607_431_768_211_455n) throw new Error(`${field} must be a decimal u128 string`); return value; }
function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte !== 0) break; output = `1${output}`; } return output || "1"; }
function decodeBase58(value) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", indexes = new Map([...alphabet].map((character, index) => [character, index])); if (typeof value !== "string" || !value) throw new Error("invalid base58 payload"); let number = 0n; for (const character of value) { const digit = indexes.get(character); if (digit == null) throw new Error("invalid base58 payload"); number = number * 58n + BigInt(digit); } const bytes = []; while (number) { bytes.unshift(Number(number & 255n)); number >>= 8n; } for (const character of value) { if (character !== "1") break; bytes.unshift(0); } return Buffer.from(bytes); }
function readU64(buffer, offset) { return buffer.readBigUInt64LE(offset).toString(); }
function readU128(buffer, offset) { return (buffer.readBigUInt64LE(offset + 8) << 64n | buffer.readBigUInt64LE(offset)).toString(); }
const SWAP_EVENT_DISCRIMINATOR = crypto.createHash("sha256").update("event:SwapEvent").digest().subarray(0, 8);
const ORCA_TRADED_EVENT_DISCRIMINATOR = crypto.createHash("sha256").update("event:Traded").digest().subarray(0, 8);
const ORCA_POOL_INITIALIZED_EVENT_DISCRIMINATOR = crypto.createHash("sha256").update("event:PoolInitialized").digest().subarray(0, 8);
const ORCA_INITIALIZE_POOL_DISCRIMINATOR = Buffer.from([95, 180, 10, 172, 84, 174, 232, 40]);
const ORCA_INITIALIZE_POOL_V2_DISCRIMINATOR = Buffer.from([207, 45, 87, 242, 27, 63, 204, 67]);
const ORCA_INITIALIZE_ADAPTIVE_POOL_DISCRIMINATOR = Buffer.from([143, 94, 96, 76, 172, 124, 119, 199]);
const RAYDIUM_CPMM_INITIALIZE_DISCRIMINATOR = crypto.createHash("sha256").update("global:initialize").digest().subarray(0, 8);
const RAYDIUM_CLMM_CREATE_POOL_DISCRIMINATOR = crypto.createHash("sha256").update("global:create_pool").digest().subarray(0, 8);
const PUMP_AMM_CREATE_POOL_DISCRIMINATOR = Buffer.from([233, 146, 209, 142, 207, 104, 64, 188]);
const PUMP_CREATE_V2_DISCRIMINATOR = Buffer.from([214, 144, 76, 236, 95, 139, 49, 180]);
const PUMP_MIGRATE_DISCRIMINATOR = Buffer.from([155, 234, 231, 146, 236, 158, 162, 30]);
const PUMP_MIGRATE_V2_DISCRIMINATOR = Buffer.from([187, 203, 18, 31, 206, 237, 254, 41]);
const PUMP_COMPLETE_EVENT_DISCRIMINATOR = Buffer.from([95, 114, 97, 156, 212, 46, 152, 8]);
const PUMP_COMPLETE_MIGRATION_EVENT_DISCRIMINATOR = Buffer.from([189, 233, 93, 185, 92, 148, 234, 148]);
const METEORA_SWAP_INSTRUCTION_DISCRIMINATOR = Buffer.from([248, 198, 158, 145, 225, 117, 135, 200]);
const METEORA_SWAP2_INSTRUCTION_DISCRIMINATOR = Buffer.from([65, 75, 63, 76, 235, 91, 91, 136]);
const METEORA_INITIALIZE_LB_PAIR_DISCRIMINATOR = Buffer.from([45, 154, 237, 210, 221, 15, 166, 92]);
const METEORA_INITIALIZE_LB_PAIR2_DISCRIMINATOR = Buffer.from([73, 59, 36, 120, 237, 83, 108, 198]);
const METEORA_LB_PAIR_CREATE_EVENT_DISCRIMINATOR = Buffer.from([185, 74, 252, 125, 27, 215, 188, 111]);
const RAYDIUM_CPMM_SWAP_BASE_INPUT_DISCRIMINATOR = crypto.createHash("sha256").update("global:swap_base_input").digest().subarray(0, 8);
const RAYDIUM_CLMM_SWAP_V2_DISCRIMINATOR = crypto.createHash("sha256").update("global:swap_v2").digest().subarray(0, 8);
const ORCA_SWAP_INSTRUCTION_DISCRIMINATOR = Buffer.from([248, 198, 158, 145, 225, 117, 135, 200]);
const PUMP_SWAP_SELL_DISCRIMINATOR = Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]);
const PUMP_SWAP_BUY_EXACT_QUOTE_IN_DISCRIMINATOR = Buffer.from([198, 46, 21, 82, 180, 217, 232, 112]);
const PUMP_SELL_V2_DISCRIMINATOR = Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]);
const PUMP_BUY_EXACT_QUOTE_IN_V2_DISCRIMINATOR = Buffer.from([194, 171, 28, 70, 104, 77, 91, 47]);
const METEORA_SWAP_EVENT_DISCRIMINATOR = Buffer.from([81, 108, 227, 190, 205, 208, 10, 196]);
const METEORA_SWAP2_EVENT_DISCRIMINATOR = Buffer.from([46, 116, 82, 215, 148, 27, 84, 77]);
const WRAPPED_SOL = "So11111111111111111111111111111111111111112";
export function recognizedSwapInstructionProtocol(instruction) {
  if (typeof instruction?.data !== "string") return null;
  let data; try { data = decodeBase58(instruction.data); } catch { return null; }
  const discriminator = data.subarray(0, 8), exact = (length, expected) => data.length === length && discriminator.equals(expected);
  if (instruction.programId === RAYDIUM_CPMM && exact(24, RAYDIUM_CPMM_SWAP_BASE_INPUT_DISCRIMINATOR)) return "raydium-cpmm";
  if (instruction.programId === RAYDIUM_CLMM && exact(41, RAYDIUM_CLMM_SWAP_V2_DISCRIMINATOR)) return "raydium-clmm";
  if (instruction.programId === ORCA_WHIRLPOOL && exact(42, ORCA_SWAP_INSTRUCTION_DISCRIMINATOR)) return "orca-whirlpool";
  if (instruction.programId === PUMP_AMM && (exact(24, PUMP_SWAP_SELL_DISCRIMINATOR) || exact(25, PUMP_SWAP_BUY_EXACT_QUOTE_IN_DISCRIMINATOR))) return "pump-swap";
  if (instruction.programId === PUMP_PROGRAM && (exact(24, PUMP_SELL_V2_DISCRIMINATOR) || exact(24, PUMP_BUY_EXACT_QUOTE_IN_V2_DISCRIMINATOR))) return "pump-bonding-curve";
  if (instruction.programId === METEORA_DLMM && exact(24, METEORA_SWAP_INSTRUCTION_DISCRIMINATOR)) return "meteora-dlmm";
  if (instruction.programId === METEORA_DLMM && data.length >= 28 && discriminator.equals(METEORA_SWAP2_INSTRUCTION_DISCRIMINATOR)) {
    const count = data.readUInt32LE(24), slices = data.subarray(28); if (count <= 2 && slices.length === count * 2 && new Set(Array.from({ length: count }, (_, index) => slices[index * 2])).size === count && Array.from({ length: count }, (_, index) => slices[index * 2]).every((type) => type <= 1)) return "meteora-dlmm";
  }
  return null;
}
export function recognizedLifecycleInstructionOutput(instruction) {
  if (typeof instruction?.data !== "string") return null;
  let data; try { data = decodeBase58(instruction.data); } catch { return null; }
  const discriminator = data.subarray(0, 8), exact = (length, expected) => data.length === length && discriminator.equals(expected);
  if (instruction.programId === RAYDIUM_CPMM && exact(32, RAYDIUM_CPMM_INITIALIZE_DISCRIMINATOR)) return { protocol: "raydium-cpmm", type: "pool_created" };
  if (instruction.programId === RAYDIUM_CLMM && exact(32, RAYDIUM_CLMM_CREATE_POOL_DISCRIMINATOR)) return { protocol: "raydium-clmm", type: "pool_created" };
  if (instruction.programId === PUMP_AMM && exact(60, PUMP_AMM_CREATE_POOL_DISCRIMINATOR) && data[58] <= 1 && data[59] <= 1) return { protocol: "pump-swap", type: "pool_created" };
  if (instruction.programId === PUMP_PROGRAM && data.length >= 55 && discriminator.equals(PUMP_CREATE_V2_DISCRIMINATOR)) {
    try { let cursor = 8; cursor = readBorshString(data, cursor, 32).offset; cursor = readBorshString(data, cursor, 10).offset; cursor = readBorshString(data, cursor, 200).offset; if (cursor + 34 === data.length && data[cursor + 32] <= 1 && data[cursor + 33] <= 1) return { protocol: "pump-bonding-curve", type: "pool_created" }; } catch {}
  }
  if (instruction.programId === PUMP_PROGRAM && (exact(8, PUMP_MIGRATE_DISCRIMINATOR) || exact(8, PUMP_MIGRATE_V2_DISCRIMINATOR))) return { protocol: "pump-bonding-curve", type: "pool_migrated" };
  if (instruction.programId === METEORA_DLMM && (exact(14, METEORA_INITIALIZE_LB_PAIR_DISCRIMINATOR) || exact(14, METEORA_INITIALIZE_LB_PAIR2_DISCRIMINATOR)) && data.readUInt16LE(12) > 0) return { protocol: "meteora-dlmm", type: "pool_created" };
  if (instruction.programId === ORCA_WHIRLPOOL && exact(27, ORCA_INITIALIZE_POOL_DISCRIMINATOR) && data.readUInt16LE(9) > 0 && BigInt(readU128(data, 11)) > 0n) return { protocol: "orca-whirlpool", type: "pool_created" };
  if (instruction.programId === ORCA_WHIRLPOOL && exact(26, ORCA_INITIALIZE_POOL_V2_DISCRIMINATOR) && data.readUInt16LE(8) > 0 && BigInt(readU128(data, 10)) > 0n) return { protocol: "orca-whirlpool", type: "pool_created" };
  if (instruction.programId === ORCA_WHIRLPOOL && discriminator.equals(ORCA_INITIALIZE_ADAPTIVE_POOL_DISCRIMINATOR) && data.length >= 25 && BigInt(readU128(data, 8)) > 0n && ((data.length === 25 && data[24] === 0) || (data.length === 33 && data[24] === 1))) return { protocol: "orca-whirlpool", type: "pool_created" };
  return null;
}
function readBorshString(buffer, offset, maxCharacters) {
  if (offset + 4 > buffer.length) throw new Error("truncated borsh string");
  const byteLength = buffer.readUInt32LE(offset); offset += 4;
  if (byteLength > buffer.length - offset) throw new Error("truncated borsh string");
  const bytes = buffer.subarray(offset, offset + byteLength), value = bytes.toString("utf8");
  if (!Buffer.from(value, "utf8").equals(bytes) || Array.from(value).length > maxCharacters) throw new Error("invalid borsh string");
  return { value, offset: offset + byteLength };
}
export function decodeRaydiumCpmmPoolInitializations(entry, signature) {
  if (entry.meta?.err != null) return [];
  const events = [], keys = accountKeys(entry.transaction?.message, entry.meta);
  for (const instruction of instructionRows(entry)) {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null), accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account);
    if (programId !== RAYDIUM_CPMM || accounts.length < 14 || accounts.some((account) => typeof account !== "string" || !account) || typeof instruction.data !== "string") continue;
    let data; try { data = decodeBase58(instruction.data); } catch { continue; }
    if (data.length !== 32 || !data.subarray(0, 8).equals(RAYDIUM_CPMM_INITIALIZE_DISCRIMINATOR)) continue;
    events.push({ type: "pool_created", protocol: "raydium-cpmm", programId: RAYDIUM_CPMM, signature, creator: accounts[0], ammConfig: accounts[1], pool: accounts[3], tokenMint0: accounts[4], tokenMint1: accounts[5], lpMint: accounts[6], tokenVault0: accounts[10], tokenVault1: accounts[11], observationKey: accounts[13], initialAmount0Raw: readU64(data, 8), initialAmount1Raw: readU64(data, 16), requestedOpenTime: readU64(data, 24), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
export function decodeRaydiumClmmPoolInitializations(entry, signature) {
  if (entry.meta?.err != null) return [];
  const events = [], keys = accountKeys(entry.transaction?.message, entry.meta);
  for (const instruction of instructionRows(entry)) {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null), accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account);
    if (programId !== RAYDIUM_CLMM || accounts.length < 13 || accounts.length > 15 || accounts.some((account) => typeof account !== "string" || !account) || !TOKEN_PROGRAMS.has(accounts[9]) || !TOKEN_PROGRAMS.has(accounts[10]) || accounts[11] !== SYSTEM_PROGRAM || accounts[12] !== "SysvarRent111111111111111111111111111111111" || typeof instruction.data !== "string") continue;
    let data, mint0, mint1; try { data = decodeBase58(instruction.data); mint0 = decodeBase58(accounts[3]); mint1 = decodeBase58(accounts[4]); } catch { continue; }
    if (data.length !== 32 || !data.subarray(0, 8).equals(RAYDIUM_CLMM_CREATE_POOL_DISCRIMINATOR) || mint0.length !== 32 || mint1.length !== 32 || Buffer.compare(mint0, mint1) >= 0 || accounts[2] === accounts[5] || accounts[2] === accounts[6] || accounts[5] === accounts[6]) continue;
    const sqrtPriceX64 = readU128(data, 8); if (BigInt(sqrtPriceX64) === 0n) continue;
    events.push({ type: "pool_created", protocol: "raydium-clmm", venueType: "clmm", programId: RAYDIUM_CLMM, signature, creator: accounts[0], ammConfig: accounts[1], pool: accounts[2], tokenMint0: accounts[3], tokenMint1: accounts[4], tokenVault0: accounts[5], tokenVault1: accounts[6], observationKey: accounts[7], tickArrayBitmap: accounts[8], baseTokenProgram: accounts[9], quoteTokenProgram: accounts[10], initialSqrtPriceX64: sqrtPriceX64, requestedOpenTime: readU64(data, 24), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
export function decodePumpSwapPoolInitializations(entry, signature) {
  if (entry.meta?.err != null) return [];
  const events = [], keys = accountKeys(entry.transaction?.message, entry.meta);
  for (const instruction of instructionRows(entry)) {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null), accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account);
    if (programId !== PUMP_AMM || accounts.length < 11 || accounts.some((account) => typeof account !== "string" || !account) || typeof instruction.data !== "string") continue;
    let data; try { data = decodeBase58(instruction.data); } catch { continue; }
    if (data.length !== 60 || !data.subarray(0, 8).equals(PUMP_AMM_CREATE_POOL_DISCRIMINATOR) || data[58] > 1 || data[59] > 1) continue;
    events.push({ type: "pool_created", protocol: "pump-swap", programId: PUMP_AMM, signature, pool: accounts[0], ammConfig: accounts[1], creator: accounts[2], tokenMint0: accounts[3], tokenMint1: accounts[4], lpMint: accounts[5], tokenVault0: accounts[9], tokenVault1: accounts[10], poolIndex: data.readUInt16LE(8), initialAmount0Raw: readU64(data, 10), initialAmount1Raw: readU64(data, 18), coinCreator: base58(data.subarray(26, 58)), mayhemMode: data[58] === 1, cashbackCoin: data[59] === 1, rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
export function decodePumpBondingCurveInitializations(entry, signature) {
  if (entry.meta?.err != null) return [];
  const events = [], keys = accountKeys(entry.transaction?.message, entry.meta);
  for (const instruction of instructionRows(entry)) {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null), accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account);
    if (programId !== PUMP_PROGRAM || ![16, 19].includes(accounts.length) || accounts.some((account) => typeof account !== "string" || !account) || typeof instruction.data !== "string") continue;
    let data; try { data = decodeBase58(instruction.data); } catch { continue; }
    if (data.length < 55 || !data.subarray(0, 8).equals(PUMP_CREATE_V2_DISCRIMINATOR)) continue;
    try {
      let cursor = 8; const name = readBorshString(data, cursor, 32); cursor = name.offset; const symbol = readBorshString(data, cursor, 13); cursor = symbol.offset; const uri = readBorshString(data, cursor, 200); cursor = uri.offset;
      if (cursor + 34 !== data.length || data[cursor + 32] > 1 || data[cursor + 33] > 1) continue;
      events.push({ type: "pool_created", protocol: "pump-bonding-curve", programId: PUMP_PROGRAM, venueType: "bonding_curve", signature, pool: accounts[2], creator: base58(data.subarray(cursor, cursor + 32)), tokenMint0: accounts[0], tokenMint1: accounts[16] ?? WRAPPED_SOL, tokenVault0: accounts[3], tokenVault1: accounts[17] ?? null, globalConfig: accounts[4], payer: accounts[5], baseTokenProgram: accounts[7], quoteTokenProgram: accounts[18] ?? null, name: name.value, symbol: symbol.value, uri: uri.value, mayhemMode: data[cursor + 32] === 1, cashbackCoin: data[cursor + 33] === 1, rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
    } catch { continue; }
  }
  return events;
}
export function decodePumpMigrations(entry, signature) {
  if (entry.meta?.err != null) return [];
  const events = [], keys = accountKeys(entry.transaction?.message, entry.meta);
  for (const instruction of instructionRows(entry)) {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null), accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account);
    if (programId !== PUMP_PROGRAM || typeof instruction.data !== "string") continue;
    let data; try { data = decodeBase58(instruction.data); } catch { continue; }
    const legacy = data.length === 8 && data.equals(PUMP_MIGRATE_DISCRIMINATOR), v2 = data.length === 8 && data.equals(PUMP_MIGRATE_V2_DISCRIMINATOR);
    if ((!legacy && !v2) || accounts.length !== (legacy ? 25 : 27) || accounts.some((account) => typeof account !== "string" || !account)) continue;
    events.push({ type: "pool_migrated", protocol: "pump-bonding-curve", destinationProtocol: "pump-swap", programId: PUMP_PROGRAM, venueType: "amm", signature, pool: accounts[legacy ? 9 : 10], sourcePool: accounts[legacy ? 3 : 4], migrator: accounts[legacy ? 5 : 7], tokenMint0: accounts[2], tokenMint1: legacy ? accounts[14] : accounts[3], lpMint: accounts[15], tokenVault0: accounts[legacy ? 17 : 17], tokenVault1: accounts[legacy ? 18 : 18], ammConfig: accounts[legacy ? 13 : 14], poolAuthority: accounts[legacy ? 10 : 11], baseTokenProgram: accounts[legacy ? 7 : 19], quoteTokenProgram: legacy ? accounts[7] : accounts[20], migrationVersion: legacy ? 1 : 2, rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
export function decodePumpCompletionEvents(entry, signature) {
  if (entry.meta?.err != null) return [];
  const events = [], stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== PUMP_PROGRAM || !line.startsWith("Program data: ")) continue;
    let data; try { data = Buffer.from(line.slice(14), "base64"); } catch { continue; }
    if (data.length === 144 && data.subarray(0, 8).equals(PUMP_COMPLETE_EVENT_DISCRIMINATOR)) events.push({ type: "curve_completed", protocol: "pump-bonding-curve", programId: PUMP_PROGRAM, venueType: "bonding_curve", signature, user: base58(data.subarray(8, 40)), tokenMint0: base58(data.subarray(40, 72)), pool: base58(data.subarray(72, 104)), completedAtUnix: data.readBigInt64LE(104).toString(), tokenMint1: base58(data.subarray(112, 144)), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
    if (data.length === 200 && data.subarray(0, 8).equals(PUMP_COMPLETE_MIGRATION_EVENT_DISCRIMINATOR)) events.push({ type: "migration_completed", protocol: "pump-bonding-curve", destinationProtocol: "pump-swap", programId: PUMP_PROGRAM, venueType: "amm", signature, user: base58(data.subarray(8, 40)), tokenMint0: base58(data.subarray(40, 72)), migratedBaseAmountRaw: readU64(data, 72), migratedQuoteAmountRaw: readU64(data, 80), poolMigrationFeeRaw: readU64(data, 88), sourcePool: base58(data.subarray(96, 128)), completedAtUnix: data.readBigInt64LE(128).toString(), pool: base58(data.subarray(136, 168)), tokenMint1: base58(data.subarray(168, 200)), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
export function decodeRaydiumSwapEvents(entry, signature) {
  if (entry.meta?.err != null) return [];
  const decimals = mintDecimalEvidence(entry);
  const events = []; const stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== RAYDIUM_CPMM || !line.startsWith("Program data: ")) continue;
    let data; try { data = Buffer.from(line.slice(14), "base64"); } catch { continue; }
    if (data.length !== 170 || !data.subarray(0, 8).equals(SWAP_EVENT_DISCRIMINATOR)) continue;
    const inputMint = base58(data.subarray(89, 121)); const outputMint = base58(data.subarray(121, 153));
    const baseInput = data[88] !== 0;
    events.push({ protocol: "raydium-cpmm", programId: RAYDIUM_CPMM, type: "swap", signature, pool: base58(data.subarray(8, 40)), inputVaultBeforeRaw: readU64(data, 40), outputVaultBeforeRaw: readU64(data, 48), inputAmountRaw: readU64(data, 56), outputAmountRaw: readU64(data, 64), inputTransferFeeRaw: readU64(data, 72), outputTransferFeeRaw: readU64(data, 80), baseInput, baseMint: baseInput ? inputMint : outputMint, quoteMint: baseInput ? outputMint : inputMint, inputMint, outputMint, tradeFeeRaw: readU64(data, 153), creatorFeeRaw: readU64(data, 161), creatorFeeOnInput: data[169] !== 0, inputDecimals: decimals.get(inputMint), outputDecimals: decimals.get(outputMint) });
  }
  return events;
}
export function decodeRaydiumClmmSwapEvents(entry, signature) {
  if (entry.meta?.err != null) return [];
  const keys = accountKeys(entry.transaction?.message, entry.meta), tokenAccounts = dexTokenAccountEvidence(entry, keys);
  const events = [], stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== RAYDIUM_CLMM || !line.startsWith("Program data: ")) continue;
    let data; try { data = Buffer.from(line.slice(14), "base64"); } catch { continue; }
    if (data.length !== 221 || !data.subarray(0, 8).equals(SWAP_EVENT_DISCRIMINATOR)) continue;
    const account0 = base58(data.subarray(72, 104)), account1 = base58(data.subarray(104, 136)), token0 = tokenAccounts.get(account0), token1 = tokenAccounts.get(account1);
    if (!token0 || !token1 || data[168] > 1) continue; const zeroForOne = data[168] === 1;
    events.push({ protocol: "raydium-clmm", programId: RAYDIUM_CLMM, venueType: "clmm", type: "swap", signature, pool: base58(data.subarray(8, 40)), user: base58(data.subarray(40, 72)), baseMint: token0.mint, quoteMint: token1.mint, inputMint: zeroForOne ? token0.mint : token1.mint, outputMint: zeroForOne ? token1.mint : token0.mint, inputAmountRaw: readU64(data, zeroForOne ? 136 : 152), outputAmountRaw: readU64(data, zeroForOne ? 152 : 136), inputVaultBeforeRaw: null, outputVaultBeforeRaw: null, reserveTiming: "unavailable", inputDecimals: zeroForOne ? token0.decimals : token1.decimals, outputDecimals: zeroForOne ? token1.decimals : token0.decimals, inputTransferFeeRaw: readU64(data, zeroForOne ? 144 : 160), outputTransferFeeRaw: readU64(data, zeroForOne ? 160 : 144), tradeFeeRaw: readU64(data, zeroForOne ? 205 : 213), zeroForOne, sqrtPriceX64: readU128(data, 169), liquidityRaw: readU128(data, 185), tick: data.readInt32LE(201), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
export function decodeOrcaWhirlpoolSwapEvents(entry, signature) {
  if (entry.meta?.err != null) return [];
  const keys = accountKeys(entry.transaction?.message, entry.meta), tokenAccounts = dexTokenAccountEvidence(entry, keys);
  const contexts = instructionRows(entry).flatMap((instruction) => {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null);
    const accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account);
    if (programId !== ORCA_WHIRLPOOL || accounts.length < 7 || accounts.some((account) => typeof account !== "string" || !account)) return [];
    const tokenAOwner = tokenAccounts.get(accounts[3]), tokenAVault = tokenAccounts.get(accounts[4]), tokenBOwner = tokenAccounts.get(accounts[5]), tokenBVault = tokenAccounts.get(accounts[6]);
    if (!tokenAOwner || !tokenAVault || !tokenBOwner || !tokenBVault || tokenAOwner.mint !== tokenAVault.mint || tokenBOwner.mint !== tokenBVault.mint || tokenAOwner.decimals !== tokenAVault.decimals || tokenBOwner.decimals !== tokenBVault.decimals) return [];
    return [{ user: accounts[1], pool: accounts[2], tokenA: tokenAOwner, tokenB: tokenBOwner }];
  });
  const events = [], stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== ORCA_WHIRLPOOL || !line.startsWith("Program data: ")) continue;
    let data; try { data = Buffer.from(line.slice(14), "base64"); } catch { continue; }
    if (data.length !== 121 || !data.subarray(0, 8).equals(ORCA_TRADED_EVENT_DISCRIMINATOR) || data[40] > 1) continue;
    const pool = base58(data.subarray(8, 40)), context = contexts.find((candidate) => candidate.pool === pool); if (!context) continue;
    const aToB = data[40] === 1, input = aToB ? context.tokenA : context.tokenB, output = aToB ? context.tokenB : context.tokenA;
    const lpFeeRaw = readU64(data, 105), protocolFeeRaw = readU64(data, 113), tradeFeeRaw = (BigInt(lpFeeRaw) + BigInt(protocolFeeRaw)).toString();
    if (BigInt(tradeFeeRaw) > 18_446_744_073_709_551_615n) continue;
    events.push({ protocol: "orca-whirlpool", programId: ORCA_WHIRLPOOL, venueType: "clmm", type: "swap", signature, pool, user: context.user, baseMint: context.tokenA.mint, quoteMint: context.tokenB.mint, inputMint: input.mint, outputMint: output.mint, inputAmountRaw: readU64(data, 73), outputAmountRaw: readU64(data, 81), inputVaultBeforeRaw: null, outputVaultBeforeRaw: null, reserveTiming: "unavailable", inputDecimals: input.decimals, outputDecimals: output.decimals, inputTransferFeeRaw: readU64(data, 89), outputTransferFeeRaw: readU64(data, 97), tradeFeeRaw, lpFeeRaw, protocolFeeRaw, zeroForOne: aToB, preSqrtPriceX64: readU128(data, 41), sqrtPriceX64: readU128(data, 57), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
export function decodeMeteoraDlmmSwapEvents(entry, signature) {
  if (entry.meta?.err != null) return [];
  const keys = accountKeys(entry.transaction?.message, entry.meta), decimals = mintDecimalEvidence(entry);
  const contexts = instructionRows(entry).flatMap((instruction) => {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null), accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account);
    if (programId !== METEORA_DLMM || accounts.some((account) => typeof account !== "string" || !account) || typeof instruction.data !== "string") return [];
    let data; try { data = decodeBase58(instruction.data); } catch { return []; }
    const legacy = data.length === 24 && data.subarray(0, 8).equals(METEORA_SWAP_INSTRUCTION_DISCRIMINATOR), v2 = data.length >= 25 && data.subarray(0, 8).equals(METEORA_SWAP2_INSTRUCTION_DISCRIMINATOR); if (!legacy && !v2) return [];
    const requiredAccounts = v2 ? 16 : 15, programAccountIndex = v2 ? 15 : 14;
    if (accounts.length < requiredAccounts || accounts[programAccountIndex] !== METEORA_DLMM || !TOKEN_PROGRAMS.has(accounts[11]) || !TOKEN_PROGRAMS.has(accounts[12]) || accounts[6] === accounts[7]) return [];
    return [{ pool: accounts[0], user: accounts[10], tokenMint0: accounts[6], tokenMint1: accounts[7], instructionVersion: v2 ? 2 : 1 }];
  });
  const events = [], stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== METEORA_DLMM || !line.startsWith("Program data: ")) continue;
    let data; try { data = Buffer.from(line.slice(14), "base64"); } catch { continue; }
    const legacy = data.length === 137 && data.subarray(0, 8).equals(METEORA_SWAP_EVENT_DISCRIMINATOR), v2 = data.length === 155 && data.subarray(0, 8).equals(METEORA_SWAP2_EVENT_DISCRIMINATOR); if (!legacy && !v2 || v2 && (data[153] > 1 || data[154] > 1)) continue;
    const pool = base58(data.subarray(8, 40)), user = base58(data.subarray(40, 72)), context = contexts.find((candidate) => candidate.pool === pool && candidate.user === user && candidate.instructionVersion === (v2 ? 2 : 1)); if (!context) continue;
    const swapForY = data[v2 ? 80 : 96]; if (swapForY > 1) continue; const token0Decimals = decimals.get(context.tokenMint0), token1Decimals = decimals.get(context.tokenMint1); if (!Number.isInteger(token0Decimals) || !Number.isInteger(token1Decimals)) continue;
    const inputMint = swapForY ? context.tokenMint0 : context.tokenMint1, outputMint = swapForY ? context.tokenMint1 : context.tokenMint0, amountIn = readU64(data, v2 ? 97 : 80), amountLeft = v2 ? readU64(data, 105) : "0", consumed = BigInt(amountIn) - BigInt(amountLeft); if (consumed <= 0n) continue;
    const mmFee = readU64(data, v2 ? 121 : 97), protocolFee = readU64(data, v2 ? 129 : 105), limitOrderFee = v2 ? readU64(data, 137) : "0", hostFee = readU64(data, v2 ? 145 : 129), tradeFee = BigInt(mmFee) + BigInt(limitOrderFee); if (tradeFee > 18_446_744_073_709_551_615n) continue;
    events.push({ protocol: "meteora-dlmm", programId: METEORA_DLMM, venueType: "dlmm", type: "swap", signature, pool, user, baseMint: context.tokenMint0, quoteMint: context.tokenMint1, inputMint, outputMint, inputAmountRaw: consumed.toString(), outputAmountRaw: readU64(data, v2 ? 113 : 88), inputVaultBeforeRaw: null, outputVaultBeforeRaw: null, reserveTiming: "unavailable", inputDecimals: swapForY ? token0Decimals : token1Decimals, outputDecimals: swapForY ? token1Decimals : token0Decimals, tradeFeeRaw: tradeFee.toString(), protocolFeeRaw: protocolFee, hostFeeRaw: hostFee, limitOrderFeeRaw: limitOrderFee, amountLeftRaw: amountLeft, swapForY: Boolean(swapForY), startBinId: data.readInt32LE(72), endBinId: data.readInt32LE(76), feeBpsRaw: readU128(data, v2 ? 81 : 113), feesOnInput: v2 ? data[153] === 1 : null, feesOnTokenX: v2 ? data[154] === 1 : null, rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
export function decodeOrcaWhirlpoolPoolInitializations(entry, signature) {
  if (entry.meta?.err != null) return [];
  const keys = accountKeys(entry.transaction?.message, entry.meta), contexts = [];
  for (const instruction of instructionRows(entry)) {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null), accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account);
    if (programId !== ORCA_WHIRLPOOL || typeof instruction.data !== "string" || accounts.some((account) => typeof account !== "string" || !account)) continue;
    let data; try { data = decodeBase58(instruction.data); } catch { continue; }
    if (data.length === 27 && data.subarray(0, 8).equals(ORCA_INITIALIZE_POOL_DISCRIMINATOR) && accounts.length >= 11) contexts.push({ whirlpoolsConfig: accounts[0], tokenMint0: accounts[1], tokenMint1: accounts[2], pool: accounts[4], tokenProgram0: accounts[8], tokenProgram1: accounts[8], tickSpacing: data.readUInt16LE(9), initialSqrtPriceX64: readU128(data, 11) });
    else if (data.length === 26 && data.subarray(0, 8).equals(ORCA_INITIALIZE_POOL_V2_DISCRIMINATOR) && accounts.length >= 14) contexts.push({ whirlpoolsConfig: accounts[0], tokenMint0: accounts[1], tokenMint1: accounts[2], pool: accounts[6], tokenProgram0: accounts[10], tokenProgram1: accounts[11], tickSpacing: data.readUInt16LE(8), initialSqrtPriceX64: readU128(data, 10) });
    else if (data.length >= 25 && data.subarray(0, 8).equals(ORCA_INITIALIZE_ADAPTIVE_POOL_DISCRIMINATOR) && accounts.length >= 16 && ((data.length === 25 && data[24] === 0) || (data.length === 33 && data[24] === 1))) contexts.push({ whirlpoolsConfig: accounts[0], tokenMint0: accounts[1], tokenMint1: accounts[2], pool: accounts[7], tokenProgram0: accounts[12], tokenProgram1: accounts[13], tickSpacing: null, initialSqrtPriceX64: readU128(data, 8) });
  }
  const events = [], stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== ORCA_WHIRLPOOL || !line.startsWith("Program data: ")) continue;
    let data; try { data = Buffer.from(line.slice(14), "base64"); } catch { continue; }
    if (data.length !== 220 || !data.subarray(0, 8).equals(ORCA_POOL_INITIALIZED_EVENT_DISCRIMINATOR)) continue;
    const tickSpacing = data.readUInt16LE(136), decoded = { pool: base58(data.subarray(8, 40)), whirlpoolsConfig: base58(data.subarray(40, 72)), tokenMint0: base58(data.subarray(72, 104)), tokenMint1: base58(data.subarray(104, 136)), tokenProgram0: base58(data.subarray(138, 170)), tokenProgram1: base58(data.subarray(170, 202)), initialSqrtPriceX64: readU128(data, 204) }; if (!tickSpacing) continue;
    const contextIndex = contexts.findIndex((context) => context.pool === decoded.pool && context.whirlpoolsConfig === decoded.whirlpoolsConfig && context.tokenMint0 === decoded.tokenMint0 && context.tokenMint1 === decoded.tokenMint1 && context.tokenProgram0 === decoded.tokenProgram0 && context.tokenProgram1 === decoded.tokenProgram1 && (context.tickSpacing == null || context.tickSpacing === tickSpacing) && context.initialSqrtPriceX64 === decoded.initialSqrtPriceX64); if (contextIndex < 0) continue; contexts.splice(contextIndex, 1);
    events.push({ type: "pool_created", protocol: "orca-whirlpool", programId: ORCA_WHIRLPOOL, venueType: "clmm", signature, pool: decoded.pool, whirlpoolsConfig: decoded.whirlpoolsConfig, tokenMint0: decoded.tokenMint0, tokenMint1: decoded.tokenMint1, tickSpacing, baseTokenProgram: decoded.tokenProgram0, quoteTokenProgram: decoded.tokenProgram1, mintDecimals0: data[202], mintDecimals1: data[203], initialSqrtPriceX64: decoded.initialSqrtPriceX64, rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
export function decodeMeteoraDlmmPoolInitializations(entry, signature) {
  if (entry.meta?.err != null) return [];
  const keys = accountKeys(entry.transaction?.message, entry.meta), contexts = [];
  for (const instruction of instructionRows(entry)) {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null), accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account);
    if (programId !== METEORA_DLMM || typeof instruction.data !== "string" || accounts.some((account) => typeof account !== "string" || !account)) continue;
    let data; try { data = decodeBase58(instruction.data); } catch { continue; }
    const legacy = data.length === 14 && data.subarray(0, 8).equals(METEORA_INITIALIZE_LB_PAIR_DISCRIMINATOR), v2 = data.length === 14 && data.subarray(0, 8).equals(METEORA_INITIALIZE_LB_PAIR2_DISCRIMINATOR); if (!legacy && !v2) continue;
    const requiredAccounts = v2 ? 16 : 14, programAccountIndex = v2 ? 15 : 13, binStep = data.readUInt16LE(12);
    if (!binStep || accounts.length < requiredAccounts || accounts[programAccountIndex] !== METEORA_DLMM || accounts[2] === accounts[3] || (v2 ? !TOKEN_PROGRAMS.has(accounts[11]) || !TOKEN_PROGRAMS.has(accounts[12]) : !TOKEN_PROGRAMS.has(accounts[9]))) continue;
    contexts.push({ pool: accounts[0], tokenMint0: accounts[2], tokenMint1: accounts[3], binStep });
  }
  const events = [], stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== METEORA_DLMM || !line.startsWith("Program data: ")) continue;
    let data; try { data = Buffer.from(line.slice(14), "base64"); } catch { continue; }
    if (data.length !== 106 || !data.subarray(0, 8).equals(METEORA_LB_PAIR_CREATE_EVENT_DISCRIMINATOR)) continue;
    const binStep = data.readUInt16LE(40), pool = base58(data.subarray(8, 40)), tokenMint0 = base58(data.subarray(42, 74)), tokenMint1 = base58(data.subarray(74, 106));
    if (!binStep || tokenMint0 === tokenMint1) continue;
    const contextIndex = contexts.findIndex((context) => context.pool === pool && context.tokenMint0 === tokenMint0 && context.tokenMint1 === tokenMint1 && context.binStep === binStep); if (contextIndex < 0) continue; contexts.splice(contextIndex, 1);
    events.push({ type: "pool_created", protocol: "meteora-dlmm", programId: METEORA_DLMM, venueType: "dlmm", signature, pool, tokenMint0, tokenMint1, binStep, rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
  }
  return events;
}
function pumpPoolContext(entry) {
  for (const instruction of instructionRows(entry)) {
    if ((instruction.programId ?? instruction.program) !== PUMP_AMM || !Array.isArray(instruction.accounts) || instruction.accounts.length < 5) continue;
    return { pool: instruction.accounts[0], baseMint: instruction.accounts[3], quoteMint: instruction.accounts[4] };
  }
  return null;
}
export function decodePumpSwapEvents(entry, signature) {
  if (entry.meta?.err != null) return [];
  const context = pumpPoolContext(entry); if (!context) return [];
  const decimals = mintDecimalEvidence(entry);
  const buyDiscriminator = crypto.createHash("sha256").update("event:BuyEvent").digest().subarray(0, 8); const sellDiscriminator = crypto.createHash("sha256").update("event:SellEvent").digest().subarray(0, 8);
  const events = []; const stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== PUMP_AMM || !line.startsWith("Program data: ")) continue;
    const data = Buffer.from(line.slice(14), "base64"); const buy = data.subarray(0, 8).equals(buyDiscriminator); const sell = data.subarray(0, 8).equals(sellDiscriminator);
    if (!buy && !sell) continue;
    const minimum = buy ? 442 : 417; if (data.length < minimum) continue;
    const amountBase = readU64(data, 16); const poolBaseReserve = readU64(data, 48); const poolQuoteReserve = readU64(data, 56); const actualQuote = readU64(data, 64);
    const inputMint = buy ? context.quoteMint : context.baseMint; const outputMint = buy ? context.baseMint : context.quoteMint;
    const tradeFeeRaw = (BigInt(readU64(data, 80)) + BigInt(readU64(data, 96))).toString();
    events.push({ protocol: "pump-swap", programId: PUMP_AMM, type: "swap", side: buy ? "buy" : "sell", signature, pool: context.pool, baseMint: context.baseMint, quoteMint: context.quoteMint, inputMint, outputMint, inputAmountRaw: buy ? actualQuote : amountBase, outputAmountRaw: buy ? amountBase : actualQuote, inputVaultBeforeRaw: buy ? poolQuoteReserve : poolBaseReserve, outputVaultBeforeRaw: buy ? poolBaseReserve : poolQuoteReserve, tradeFeeRaw, inputDecimals: decimals.get(inputMint), outputDecimals: decimals.get(outputMint), reserveTiming: "after" });
  }
  return events;
}
const PUMP_TRADE_DISCRIMINATOR = Buffer.from([189, 219, 127, 211, 78, 230, 97, 238]);
function pumpTradeContext(entry, mint) {
  for (const instruction of instructionRows(entry)) {
    if ((instruction.programId ?? instruction.program) !== PUMP_PROGRAM || !Array.isArray(instruction.accounts)) continue;
    if (instruction.accounts[2] === mint && typeof instruction.accounts[3] === "string") return instruction.accounts[3];
  }
  return null;
}
export function decodePumpTradeEvents(entry, signature) {
  if (entry.meta?.err != null) return [];
  const decimals = mintDecimalEvidence(entry);
  const events = []; const stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== PUMP_PROGRAM || !line.startsWith("Program data: ")) continue;
    let data; try { data = Buffer.from(line.slice(14), "base64"); } catch { continue; }
    if (data.length < 263 || !data.subarray(0, 8).equals(PUMP_TRADE_DISCRIMINATOR)) continue;
    try {
      const mint = base58(data.subarray(8, 40)); const buy = data[56] !== 0; const user = base58(data.subarray(57, 89));
      const stringLength = data.readUInt32LE(258); if (stringLength > 128 || 262 + stringLength + 37 > data.length) continue;
      const ixName = data.toString("utf8", 262, 262 + stringLength); let offset = 262 + stringLength;
      const mayhemMode = data[offset++] !== 0; const cashbackFeeBasisPoints = readU64(data, offset); offset += 8; const cashbackRaw = readU64(data, offset); offset += 8;
      const buybackFeeBasisPoints = readU64(data, offset); offset += 8; const buybackRaw = readU64(data, offset); offset += 8;
      const shareholderCount = data.readUInt32LE(offset); offset += 4; if (shareholderCount > 64 || offset + shareholderCount * 34 + 56 > data.length) continue;
      offset += shareholderCount * 34; const quoteMint = base58(data.subarray(offset, offset + 32)); offset += 32;
      const quoteAmountRaw = readU64(data, offset); offset += 8; const virtualQuoteReservesRaw = readU64(data, offset); offset += 8; const realQuoteReservesRaw = readU64(data, offset);
      const pool = pumpTradeContext(entry, mint); if (!pool) continue;
      const inputMint = buy ? quoteMint : mint; const outputMint = buy ? mint : quoteMint;
      events.push({ protocol: "pump-bonding-curve", programId: PUMP_PROGRAM, type: "swap", venueType: "bonding_curve", side: buy ? "buy" : "sell", signature, pool, mint, quoteMint, inputMint, outputMint, inputAmountRaw: buy ? quoteAmountRaw : readU64(data, 48), outputAmountRaw: buy ? readU64(data, 48) : quoteAmountRaw, inputVaultBeforeRaw: buy ? realQuoteReservesRaw : readU64(data, 121), outputVaultBeforeRaw: buy ? readU64(data, 121) : realQuoteReservesRaw, reserveTiming: "reported", tradeFeeRaw: readU64(data, 169), creatorFeeRaw: readU64(data, 217), cashbackRaw, buybackRaw, feeBasisPoints: readU64(data, 161), creatorFeeBasisPoints: readU64(data, 209), cashbackFeeBasisPoints, buybackFeeBasisPoints, user, creator: base58(data.subarray(177, 209)), feeRecipient: base58(data.subarray(129, 161)), virtualSolReservesRaw: readU64(data, 97), virtualTokenReservesRaw: readU64(data, 105), realSolReservesRaw: readU64(data, 113), realTokenReservesRaw: readU64(data, 121), virtualQuoteReservesRaw, realQuoteReservesRaw, ixName, mayhemMode, shareholderCount, inputDecimals: decimals.get(inputMint), outputDecimals: decimals.get(outputMint) });
    } catch { continue; }
  }
  return events;
}
function dexSwaps(block, transactions, decodedEvents) {
  const successful = new Set(transactions.filter((row) => row.success).map((row) => row.signature));
  const sidecar = block.dexEvents ?? [];
  // Provider blocks do not guarantee that every mint touched by a program log
  // appears in pre/post token balances. Preserve the canonical block and raw
  // instruction evidence, but do not publish a swap whose decimal precision is
  // unknown. Explicit sidecars remain strict contracts and are validated below.
  const completeDecoded = decodedEvents.filter((event) => Number.isInteger(event.inputDecimals) && Number.isInteger(event.outputDecimals));
  const evidenceKey = (event) => [event.signature, event.protocol, event.pool, event.inputMint, event.outputMint, event.inputAmountRaw, event.outputAmountRaw].join("\u0000"), covered = new Map();
  for (const event of sidecar) { const key = evidenceKey(event); covered.set(key, (covered.get(key) ?? 0) + 1); }
  const uncoveredDecoded = completeDecoded.filter((event) => { const key = evidenceKey(event), remaining = covered.get(key) ?? 0; if (!remaining) return true; covered.set(key, remaining - 1); return false; });
  const events = [...sidecar, ...uncoveredDecoded]; const indices = new Map();
  return events.map((event, index) => {
    const field = (name) => { const value = event[name]; if (typeof value !== "string" || !value) throw new Error(`dexEvents[${index}].${name} is required`); return value; };
    const supported = (event.protocol === "raydium-cpmm" && event.programId === RAYDIUM_CPMM) || (event.protocol === "raydium-clmm" && event.programId === RAYDIUM_CLMM) || (event.protocol === "orca-whirlpool" && event.programId === ORCA_WHIRLPOOL) || (event.protocol === "pump-swap" && event.programId === PUMP_AMM) || (event.protocol === "pump-bonding-curve" && event.programId === PUMP_PROGRAM) || (event.protocol === "meteora-dlmm" && event.programId === METEORA_DLMM);
    if (!supported || event.type !== "swap") throw new Error(`dexEvents[${index}] is not a supported DEX swap`);
    const signature = field("signature"); if (!successful.has(signature)) throw new Error(`dexEvents[${index}].signature must reference a successful transaction`);
    const inputDecimals = event.inputDecimals; const outputDecimals = event.outputDecimals;
    if (!Number.isInteger(inputDecimals) || inputDecimals < 0 || inputDecimals > 255 || !Number.isInteger(outputDecimals) || outputDecimals < 0 || outputDecimals > 255) throw new Error(`dexEvents[${index}] decimals must be integers from 0 to 255`);
    const eventIndex = indices.get(signature) ?? 0; indices.set(signature, eventIndex + 1);
    const inputMint = field("inputMint"), outputMint = field("outputMint"); const authoritativeBase = event.baseMint ?? (event.protocol === "pump-bonding-curve" ? event.mint : null); const baseMint = authoritativeBase ?? [inputMint, outputMint].sort()[0]; const quoteMint = event.quoteMint ?? (baseMint === inputMint ? outputMint : inputMint);
    const nullableReserves = event.protocol === "raydium-clmm" || event.protocol === "orca-whirlpool" || event.protocol === "meteora-dlmm"; let clmmEvidence = null;
    if (nullableReserves) {
      if (typeof event.user !== "string" || !event.user) throw new Error(`dexEvents[${index}].user is required`);
      if (event.protocol !== "meteora-dlmm" && typeof event.zeroForOne !== "boolean") throw new Error(`dexEvents[${index}].zeroForOne must be boolean`);
      if (event.protocol === "raydium-clmm" && (!Number.isInteger(event.tick) || event.tick < -2_147_483_648 || event.tick > 2_147_483_647)) throw new Error(`dexEvents[${index}].tick must be an i32`);
      if (event.reserveTiming !== "unavailable" || event.inputVaultBeforeRaw != null || event.outputVaultBeforeRaw != null) throw new Error(`dexEvents[${index}] CLMM SwapEvent reserves must be explicitly unavailable`);
      if (event.protocol === "meteora-dlmm") {
        if (typeof event.swapForY !== "boolean") throw new Error(`dexEvents[${index}].swapForY must be boolean`);
        if (![event.startBinId, event.endBinId].every((value) => Number.isInteger(value) && value >= -2_147_483_648 && value <= 2_147_483_647)) throw new Error(`dexEvents[${index}] bin IDs must be i32 integers`);
        if (![event.feesOnInput, event.feesOnTokenX].every((value) => value == null || typeof value === "boolean")) throw new Error(`dexEvents[${index}] fee-side flags must be boolean or null`);
        clmmEvidence = { user: event.user, swapForY: event.swapForY, startBinId: event.startBinId, endBinId: event.endBinId, feeBpsRaw: u128(event.feeBpsRaw, "feeBpsRaw"), protocolFeeRaw: u64(event.protocolFeeRaw, "protocolFeeRaw"), hostFeeRaw: u64(event.hostFeeRaw, "hostFeeRaw"), limitOrderFeeRaw: u64(event.limitOrderFeeRaw, "limitOrderFeeRaw"), amountLeftRaw: u64(event.amountLeftRaw, "amountLeftRaw"), feesOnInput: event.feesOnInput, feesOnTokenX: event.feesOnTokenX };
      }
      else { clmmEvidence = { user: event.user, zeroForOne: event.zeroForOne, sqrtPriceX64: u128(event.sqrtPriceX64, "sqrtPriceX64"), inputTransferFeeRaw: u64(event.inputTransferFeeRaw, "inputTransferFeeRaw"), outputTransferFeeRaw: u64(event.outputTransferFeeRaw, "outputTransferFeeRaw") }; if (event.protocol === "raydium-clmm") Object.assign(clmmEvidence, { liquidityRaw: u128(event.liquidityRaw, "liquidityRaw"), tick: event.tick }); else Object.assign(clmmEvidence, { preSqrtPriceX64: u128(event.preSqrtPriceX64, "preSqrtPriceX64"), lpFeeRaw: u64(event.lpFeeRaw, "lpFeeRaw"), protocolFeeRaw: u64(event.protocolFeeRaw, "protocolFeeRaw") }); }
    }
    const normalized = { swapId: `${signature}:${eventIndex}`, eventIndex, protocol: event.protocol, programId: event.programId, venueType: event.venueType ?? "amm", side: event.side ?? null, signature, pool: field("pool"), baseMint, quoteMint, pairIdentitySource: authoritativeBase && event.quoteMint ? "protocol_event" : "canonical_lexical", inputMint, outputMint, inputAmountRaw: u64(event.inputAmountRaw, "inputAmountRaw"), outputAmountRaw: u64(event.outputAmountRaw, "outputAmountRaw"), inputVaultBeforeRaw: nullableReserves && event.inputVaultBeforeRaw == null ? null : u64(event.inputVaultBeforeRaw, "inputVaultBeforeRaw"), outputVaultBeforeRaw: nullableReserves && event.outputVaultBeforeRaw == null ? null : u64(event.outputVaultBeforeRaw, "outputVaultBeforeRaw"), tradeFeeRaw: u64(event.tradeFeeRaw, "tradeFeeRaw"), reserveTiming: event.reserveTiming ?? "before", inputDecimals, outputDecimals, baseDecimals: baseMint === inputMint ? inputDecimals : outputDecimals, quoteDecimals: quoteMint === inputMint ? inputDecimals : outputDecimals, slot: block.slot, blockTime: Number.isInteger(block.blockTime) ? block.blockTime : null, provenance: block.provenance };
    if (clmmEvidence) Object.assign(normalized, clmmEvidence);
    if (event.protocol === "pump-bonding-curve") for (const name of ["mint", "quoteMint", "user", "creator", "feeRecipient", "creatorFeeRaw", "cashbackRaw", "buybackRaw", "feeBasisPoints", "creatorFeeBasisPoints", "cashbackFeeBasisPoints", "buybackFeeBasisPoints", "virtualSolReservesRaw", "virtualTokenReservesRaw", "realSolReservesRaw", "realTokenReservesRaw", "virtualQuoteReservesRaw", "realQuoteReservesRaw", "ixName", "mayhemMode", "shareholderCount"]) normalized[name] = event[name];
    const registration = programRegistration(event.programId, block.slot); normalized.eventId = `solana:${block.slot}:${signature}:-1:${eventIndex}:swap`; normalized.registryVersion = PROGRAM_REGISTRY_VERSION; normalized.decoderVersion = registration?.decoderVersion ?? null; normalized.rawPayloadHash = event.rawPayloadHash ?? crypto.createHash("sha256").update(JSON.stringify(event)).digest("hex"); normalized.payloadHashKind = event.rawPayloadHash ? "raw" : "source_event";
    return normalized;
  });
}

function accountKeys(message, meta = null) {
  if (message?.accountKeys == null) return [];
  if (!Array.isArray(message.accountKeys)) throw new Error("transaction message accountKeys must be an array");
  const normalize = (key) => typeof key === "string" ? key : key?.pubkey;
  const staticKeys = message.accountKeys.map(normalize);
  const loadedWritable = meta?.loadedAddresses?.writable ?? [], loadedReadonly = meta?.loadedAddresses?.readonly ?? [];
  if (!Array.isArray(loadedWritable) || !Array.isArray(loadedReadonly)) throw new Error("transaction loaded addresses must be arrays");
  const keys = [...staticKeys, ...loadedWritable.map(normalize), ...loadedReadonly.map(normalize)];
  if (keys.some((key) => typeof key !== "string" || !key)) throw new Error("transaction account keys must be non-empty strings");
  return keys;
}

function mintDecimalEvidence(entry) {
  const decimals = new Map(), conflicts = new Set();
  for (const row of [...(entry.meta?.preTokenBalances ?? []), ...(entry.meta?.postTokenBalances ?? [])]) {
    const mint = row?.mint, value = row?.uiTokenAmount?.decimals, programId = row?.programId;
    if (typeof mint !== "string" || !mint) continue;
    if ((programId != null && !TOKEN_PROGRAMS.has(programId)) || !Number.isInteger(value) || value < 0 || value > 255 || conflicts.has(mint) || (decimals.has(mint) && decimals.get(mint) !== value)) { decimals.delete(mint); conflicts.add(mint); continue; }
    decimals.set(mint, value);
  }
  return decimals;
}

function dexTokenAccountEvidence(entry, keys) {
  const accounts = new Map(), conflicts = new Set();
  for (const row of [...(entry.meta?.preTokenBalances ?? []), ...(entry.meta?.postTokenBalances ?? [])]) {
    const address = Number.isSafeInteger(row?.accountIndex) && row.accountIndex >= 0 ? keys[row.accountIndex] : null, mint = row?.mint, decimals = row?.uiTokenAmount?.decimals, programId = row?.programId ?? null;
    if (!address) continue;
    const prior = accounts.get(address), valid = typeof mint === "string" && Boolean(mint) && Number.isInteger(decimals) && decimals >= 0 && decimals <= 255 && (programId == null || TOKEN_PROGRAMS.has(programId));
    if (!valid || conflicts.has(address) || (prior && (prior.mint !== mint || prior.decimals !== decimals || (prior.programId && programId && prior.programId !== programId)))) { accounts.delete(address); conflicts.add(address); continue; }
    accounts.set(address, { mint, decimals, programId: prior?.programId ?? programId });
  }
  return accounts;
}

function tokenBalanceChanges(entry, keys, signature, slot, blockTime) {
  const collect = (rows) => { const values = new Map(), conflicts = new Set(); for (const row of rows ?? []) { if (!Number.isSafeInteger(row?.accountIndex) || values.has(row.accountIndex)) { if (Number.isSafeInteger(row?.accountIndex)) conflicts.add(row.accountIndex); continue; } values.set(row.accountIndex, row); } return { values, conflicts }; }, beforeRows = collect(entry.meta?.preTokenBalances), afterRows = collect(entry.meta?.postTokenBalances), pre = beforeRows.values, post = afterRows.values, changes = [];
  for (const accountIndex of new Set([...pre.keys(), ...post.keys()])) {
    if (accountIndex < 0 || accountIndex >= keys.length || beforeRows.conflicts.has(accountIndex) || afterRows.conflicts.has(accountIndex)) continue;
    const before = pre.get(accountIndex), after = post.get(accountIndex), mint = after?.mint ?? before?.mint, owner = after?.owner ?? before?.owner, programId = after?.programId ?? before?.programId, decimals = after?.uiTokenAmount?.decimals ?? before?.uiTokenAmount?.decimals;
    const differs = (left, right) => left != null && right != null && left !== right, identityConflict = before && after && (differs(before.mint, after.mint) || differs(before.owner, after.owner) || differs(before.programId, after.programId) || differs(before.uiTokenAmount?.decimals, after.uiTokenAmount?.decimals));
    if (typeof mint !== "string" || !mint || typeof owner !== "string" || !owner || !TOKEN_PROGRAMS.has(programId) || !Number.isInteger(decimals) || decimals < 0 || decimals > 255 || identityConflict) continue;
    const beforeAmount = before?.uiTokenAmount?.amount, afterAmount = after?.uiTokenAmount?.amount, validAmount = (value) => typeof value === "string" && /^\d+$/.test(value) && BigInt(value) <= 18_446_744_073_709_551_615n;
    if ((before && !validAmount(beforeAmount)) || (after && !validAmount(afterAmount))) continue;
    const preAmountRaw = beforeAmount ?? "0", postAmountRaw = afterAmount ?? "0"; if (preAmountRaw === postAmountRaw) continue;
    changes.push({ signature, slot, blockTime, accountIndex, tokenAccount: keys[accountIndex], owner, programId, mint, decimals, preAmountRaw, postAmountRaw, deltaDirection: BigInt(postAmountRaw) >= BigInt(preAmountRaw) ? "credit" : "debit", closed: !after });
  }
  return changes;
}

function instructionRows(transaction) {
  const outer = transaction?.transaction?.message?.instructions ?? [];
  const inner = (transaction?.meta?.innerInstructions ?? []).flatMap((group) => group.instructions ?? []);
  return [...outer, ...inner];
}

function validateInstructionLayout(entry) {
  const outer = entry?.transaction?.message?.instructions ?? [], groups = entry?.meta?.innerInstructions ?? [];
  if (!Array.isArray(outer) || !Array.isArray(groups)) throw new Error("transaction instructions must be arrays");
  const seen = new Set();
  for (const group of groups) {
    if (!Number.isSafeInteger(group?.index) || group.index < 0 || group.index >= outer.length || seen.has(group.index) || !Array.isArray(group.instructions)) throw new Error("invalid inner instruction group");
    seen.add(group.index);
  }
}

function normalizedInstructions(entry, keys, signature, slot, blockTime) {
  const outer = entry.transaction?.message?.instructions ?? []; const innerGroups = new Map((entry.meta?.innerInstructions ?? []).map((group) => [group.index, group.instructions ?? []])); const rows = [];
  const append = (instruction, instructionIndex, innerIndex) => {
    const indexedProgram = instruction.programId == null && instruction.program == null;
    if (indexedProgram && (!Number.isSafeInteger(instruction.programIdIndex) || instruction.programIdIndex < 0 || instruction.programIdIndex >= keys.length)) return;
    const programId = instruction.programId ?? instruction.program ?? keys[instruction.programIdIndex]; if (typeof programId !== "string" || !programId) return;
    const instructionAccounts = instruction.accounts ?? []; if (!Array.isArray(instructionAccounts)) return;
    const accounts = instructionAccounts.map((account) => Number.isSafeInteger(account) && account >= 0 && account < keys.length ? keys[account] : typeof account === "string" && account ? account : null); if (accounts.some((account) => account == null)) return;
    const rawPayloadHash = crypto.createHash("sha256").update(JSON.stringify(instruction)).digest("hex"); const registration = programRegistration(programId, slot);
    rows.push({ eventId: `solana:${slot}:${signature}:${instructionIndex}:${innerIndex ?? -1}:instruction`, chain: "solana", slot, blockTime, signature, instructionIndex, innerIndex, programId, protocol: registration?.protocol ?? null, registryVersion: PROGRAM_REGISTRY_VERSION, decoderVersion: registration?.decoderVersion ?? null, parsedType: instruction.parsed?.type ?? null, accounts, data: typeof instruction.data === "string" ? instruction.data : null, parsed: instruction.parsed ?? null, rawPayloadHash });
  };
  outer.forEach((instruction, instructionIndex) => { append(instruction, instructionIndex, null); (innerGroups.get(instructionIndex) ?? []).forEach((inner, innerIndex) => append(inner, instructionIndex, innerIndex)); });
  return rows;
}

export function decodeSystemTransfers(rows) {
  const transfers = [];
  for (const row of rows ?? []) {
    const systemInstruction = [SYSTEM_PROGRAM, "system"].includes(row?.programId), stakeInstruction = [STAKE_PROGRAM, "stake"].includes(row?.programId);
    if (!systemInstruction && !stakeInstruction) continue;
    let source, destination, lamportsRaw, transferKind, allocatedSpaceRaw = null, ownerProgram = null, baseAddress = null, seed = null;
    const parsedU64 = (value, field) => { if (!(typeof value === "string" && /^\d+$/.test(value)) && !(Number.isSafeInteger(value) && value >= 0)) return null; try { return u64(String(value), field); } catch { return null; } };
    if (stakeInstruction && row.parsedType === "withdraw" && row.parsed?.info) { source = row.parsed.info.stakeAccount; destination = row.parsed.info.destination; lamportsRaw = parsedU64(row.parsed.info.lamports, "stake withdrawal lamports"); transferKind = "stake_withdrawal"; }
    else if (stakeInstruction && row.parsed == null && typeof row.data === "string") { let data; try { data = decodeBase58(row.data); } catch { continue; } if (data.length !== 12 || data.readUInt32LE(0) !== 4 || ![5, 6].includes(row.accounts?.length)) continue; [source, destination] = row.accounts; lamportsRaw = readU64(data, 4); transferKind = "stake_withdrawal"; }
    else if (stakeInstruction) continue;
    else if (row.parsedType === "transfer" && row.parsed?.info) { source = row.parsed.info.source; destination = row.parsed.info.destination; lamportsRaw = parsedU64(row.parsed.info.lamports, "system transfer lamports"); transferKind = "transfer"; }
    else if (row.parsedType === "transferWithSeed" && row.parsed?.info) { source = row.parsed.info.source; destination = row.parsed.info.destination; baseAddress = row.parsed.info.sourceBase; seed = row.parsed.info.sourceSeed; ownerProgram = row.parsed.info.sourceOwner; lamportsRaw = parsedU64(row.parsed.info.lamports, "system seeded transfer lamports"); transferKind = "seeded_transfer"; }
    else if (row.parsedType === "createAccount" && row.parsed?.info) { source = row.parsed.info.source; destination = row.parsed.info.newAccount; lamportsRaw = parsedU64(row.parsed.info.lamports, "system create-account lamports"); allocatedSpaceRaw = parsedU64(row.parsed.info.space, "system create-account space"); ownerProgram = row.parsed.info.owner; transferKind = "account_creation"; }
    else if (row.parsedType === "createAccountWithSeed" && row.parsed?.info) { source = row.parsed.info.source; destination = row.parsed.info.newAccount; baseAddress = row.parsed.info.base; seed = row.parsed.info.seed; lamportsRaw = parsedU64(row.parsed.info.lamports, "system seeded create-account lamports"); allocatedSpaceRaw = parsedU64(row.parsed.info.space, "system seeded create-account space"); ownerProgram = row.parsed.info.owner; transferKind = "seeded_account_creation"; }
    else if (row.parsedType === "withdrawNonce" && row.parsed?.info) { source = row.parsed.info.nonceAccount; destination = row.parsed.info.destination; lamportsRaw = parsedU64(row.parsed.info.lamports, "system nonce withdrawal lamports"); transferKind = "nonce_withdrawal"; }
    else if (row.parsed == null && typeof row.data === "string") { let data; try { data = decodeBase58(row.data); } catch { continue; } const discriminator = data.length >= 4 ? data.readUInt32LE(0) : -1; if (discriminator === 2 && data.length === 12 && row.accounts?.length === 2) { [source, destination] = row.accounts; lamportsRaw = readU64(data, 4); transferKind = "transfer"; } else if (discriminator === 0 && data.length === 52 && row.accounts?.length === 2) { [source, destination] = row.accounts; lamportsRaw = readU64(data, 4); allocatedSpaceRaw = readU64(data, 12); ownerProgram = base58(data.subarray(20, 52)); transferKind = "account_creation"; } else if (discriminator === 3 && data.length >= 92 && [2, 3].includes(row.accounts?.length)) { const seedLength = Number(data.readBigUInt64LE(36)); if (!Number.isSafeInteger(seedLength) || seedLength > 32 || data.length !== 92 + seedLength) continue; const seedBytes = data.subarray(44, 44 + seedLength); if ([...seedBytes].some((byte) => byte > 0x7f)) continue; [source, destination] = row.accounts; baseAddress = base58(data.subarray(4, 36)); seed = seedBytes.toString("ascii"); lamportsRaw = readU64(data, 44 + seedLength); allocatedSpaceRaw = readU64(data, 52 + seedLength); ownerProgram = base58(data.subarray(60 + seedLength, 92 + seedLength)); transferKind = "seeded_account_creation"; } else if (discriminator === 5 && data.length === 12 && row.accounts?.length === 5) { [source, destination] = row.accounts; lamportsRaw = readU64(data, 4); transferKind = "nonce_withdrawal"; } else if (discriminator === 11 && data.length >= 52 && row.accounts?.length === 3) { const seedLength = Number(data.readBigUInt64LE(12)); if (!Number.isSafeInteger(seedLength) || seedLength > 32 || data.length !== 52 + seedLength) continue; const seedBytes = data.subarray(20, 20 + seedLength); if ([...seedBytes].some((byte) => byte > 0x7f)) continue; [source, baseAddress, destination] = row.accounts; lamportsRaw = readU64(data, 4); seed = seedBytes.toString("ascii"); ownerProgram = base58(data.subarray(20 + seedLength, 52 + seedLength)); transferKind = "seeded_transfer"; } else if (discriminator === 13 && data.length === 52 && row.accounts?.length === 2) { [destination, source] = row.accounts; lamportsRaw = readU64(data, 4); if (lamportsRaw === "0") continue; allocatedSpaceRaw = readU64(data, 12); ownerProgram = base58(data.subarray(20, 52)); transferKind = "prefunded_account_creation"; } else continue; }
    else continue;
    const accountCreation = ["account_creation", "seeded_account_creation", "prefunded_account_creation"].includes(transferKind), seeded = ["seeded_account_creation", "seeded_transfer"].includes(transferKind); if (typeof source !== "string" || !source || typeof destination !== "string" || !destination || lamportsRaw == null || (accountCreation && (allocatedSpaceRaw == null || typeof ownerProgram !== "string" || !ownerProgram)) || (seeded && (typeof baseAddress !== "string" || !baseAddress || typeof seed !== "string" || seed.length > 32 || [...seed].some((character) => character.charCodeAt(0) > 0x7f) || typeof ownerProgram !== "string" || !ownerProgram))) continue;
    transfers.push({ transferId: row.eventId.replace(/:instruction$/, ":native_transfer"), chain: "solana", slot: row.slot, blockTime: row.blockTime, signature: row.signature, instructionIndex: row.instructionIndex, innerIndex: row.innerIndex, programId: stakeInstruction ? STAKE_PROGRAM : SYSTEM_PROGRAM, transferKind, source, destination, lamportsRaw, allocatedSpaceRaw, ownerProgram, baseAddress, seed, decoderVersion: 7, rawPayloadHash: row.rawPayloadHash });
  }
  return transfers;
}

function tokenAccountEvidence(entry, keys) {
  const accounts = new Map();
  for (const balance of [...(entry.meta?.preTokenBalances ?? []), ...(entry.meta?.postTokenBalances ?? [])]) {
    const tokenAccount = keys[balance.accountIndex], decimals = balance.uiTokenAmount?.decimals;
    if (!tokenAccount) continue;
    const next = { mint: typeof balance.mint === "string" && balance.mint ? balance.mint : null, owner: typeof balance.owner === "string" && balance.owner ? balance.owner : null, programId: typeof balance.programId === "string" && balance.programId ? balance.programId : null, decimals: Number.isInteger(decimals) && decimals >= 0 && decimals <= 255 ? decimals : null };
    const prior = accounts.get(tokenAccount);
    if (prior?.conflict || !next.mint || next.decimals == null || (prior && (prior.mint !== next.mint || prior.decimals !== next.decimals || (prior.owner && next.owner && prior.owner !== next.owner) || (prior.programId && next.programId && prior.programId !== next.programId)))) { accounts.set(tokenAccount, { conflict: true }); continue; }
    accounts.set(tokenAccount, { mint: next.mint, decimals: next.decimals, owner: prior?.owner ?? next.owner, programId: prior?.programId ?? next.programId, conflict: false });
  }
  return accounts;
}

function parsedTransfer(instruction, tokenAccounts = new Map()) {
  const programId = instruction.programId || instruction.program;
  const parsed = instruction.parsed;
  if (!TOKEN_PROGRAMS.has(programId)) return null;
  if (!parsed && typeof instruction.data === "string") {
    let data; try { data = decodeBase58(instruction.data); } catch { return null; }
    const checkedWithFee = programId === TOKEN_2022_PROGRAM && data.length === 19 && data[0] === 26 && data[1] === 1;
    const checked = data.length === 10 && data[0] === 12, unchecked = data.length === 9 && data[0] === 3;
    if ((!checkedWithFee && !checked && !unchecked) || ((checkedWithFee || checked) ? instruction.accounts?.length < 4 : instruction.accounts?.length < 3)) return null;
    const isChecked = checkedWithFee || checked, source = instruction.accounts[0], destination = instruction.accounts[isChecked ? 2 : 1], authority = instruction.accounts[isChecked ? 3 : 2], sourceEvidence = tokenAccounts.get(source), destinationEvidence = tokenAccounts.get(destination);
    if (sourceEvidence?.conflict || destinationEvidence?.conflict || !sourceEvidence?.mint || sourceEvidence.mint !== destinationEvidence?.mint || sourceEvidence.programId !== programId || destinationEvidence.programId !== programId || !sourceEvidence.owner || !destinationEvidence.owner) return null;
    const amountRaw = readU64(data, checkedWithFee ? 2 : 1), feeAmountRaw = checkedWithFee ? readU64(data, 11) : "0", mint = sourceEvidence.mint, decimals = isChecked ? data[checkedWithFee ? 10 : 9] : (sourceEvidence.decimals === destinationEvidence.decimals ? sourceEvidence.decimals : null);
    if ((isChecked && instruction.accounts[1] !== mint) || !Number.isInteger(decimals) || sourceEvidence.decimals !== decimals || destinationEvidence.decimals !== decimals || BigInt(feeAmountRaw) > BigInt(amountRaw)) return null;
    return { source, destination, sourceOwner: sourceEvidence.owner, destinationOwner: destinationEvidence.owner, authority, mint, amountRaw, feeAmountRaw, netAmountRaw: (BigInt(amountRaw) - BigInt(feeAmountRaw)).toString(), decimals, amountUiString: null };
  }
  if (!parsed?.info) return null;
  if (!["transfer", "transferChecked"].includes(parsed.type)) return null;
  const tokenAmount = parsed.info.tokenAmount;
  const amountRaw = tokenAmount?.amount ?? parsed.info.amount ?? null;
  const source = parsed.info.source, destination = parsed.info.destination;
  if (typeof source !== "string" || !source || typeof destination !== "string" || !destination || typeof amountRaw !== "string" || !/^\d+$/.test(amountRaw) || BigInt(amountRaw) > 18_446_744_073_709_551_615n) return null;
  const sourceEvidence = tokenAccounts.get(source), destinationEvidence = tokenAccounts.get(destination);
  if (sourceEvidence?.conflict || destinationEvidence?.conflict) return null;
  const inferredMint = sourceEvidence?.mint && sourceEvidence.mint === destinationEvidence?.mint ? sourceEvidence.mint : null;
  const mint = parsed.info.mint ?? inferredMint;
  const inferredDecimals = Number.isInteger(sourceEvidence?.decimals) && sourceEvidence.decimals === destinationEvidence?.decimals ? sourceEvidence.decimals : null;
  const decimals = Number.isInteger(tokenAmount?.decimals) ? tokenAmount.decimals : inferredDecimals;
  if (typeof mint !== "string" || !mint || !Number.isInteger(decimals) || decimals < 0 || decimals > 255 || (sourceEvidence?.mint && sourceEvidence.mint !== mint) || (destinationEvidence?.mint && destinationEvidence.mint !== mint) || (Number.isInteger(sourceEvidence?.decimals) && sourceEvidence.decimals !== decimals) || (Number.isInteger(destinationEvidence?.decimals) && destinationEvidence.decimals !== decimals)) return null;
  const amountUiString = tokenAmount?.uiAmountString ?? null;
  return {
    source,
    destination,
    sourceOwner: sourceEvidence?.programId === programId && sourceEvidence.mint === mint && sourceEvidence.decimals === decimals ? sourceEvidence.owner ?? null : null,
    destinationOwner: destinationEvidence?.programId === programId && destinationEvidence.mint === mint && destinationEvidence.decimals === decimals ? destinationEvidence.owner ?? null : null,
    authority: parsed.info.authority ?? parsed.info.multisigAuthority ?? "",
    mint,
    // Keep integer base units as a string. JavaScript numbers cannot safely
    // represent the full u64 range used by SPL token amounts.
    amountRaw,
    feeAmountRaw: "0",
    netAmountRaw: amountRaw,
    decimals,
    amountUiString: amountUiString == null ? null : String(amountUiString),
  };
}

export function parseBlock(block) {
  if (!Number.isSafeInteger(block?.slot) || block.slot < 0) throw new Error("block.slot must be a non-negative safe integer");
  if (typeof block.blockhash !== "string" || !block.blockhash || typeof block.previousBlockhash !== "string" || !block.previousBlockhash) throw new Error("block hashes must be non-empty strings");
  if (!Number.isSafeInteger(block.parentSlot) || block.parentSlot < 0 || (block.slot > 0 && block.parentSlot >= block.slot)) throw new Error("block.parentSlot must precede block.slot");
  if (block.blockTime != null && (!Number.isSafeInteger(block.blockTime) || block.blockTime < 0)) throw new Error("block.blockTime must be null or a non-negative safe integer");
  if (!Array.isArray(block.transactions)) throw new Error("block.transactions must be an array");
  const blockTime = block.blockTime ?? null;
  const transactions = [];
  const transfers = [];
  const nativeTransfers = [];
  const balanceChanges = [];
  const instructions = [];
  const decodedDexEvents = [];
  const poolLifecycleEvents = [];
  const transactionSignatures = new Set();
  for (const entry of block.transactions) {
    const signatures = entry?.transaction?.signatures;
    if (!Array.isArray(signatures) || signatures.length < 1 || signatures.some((value) => typeof value !== "string" || !value)) throw new Error("transaction signatures must be non-empty strings");
    const signature = signatures[0], feeLamports = entry.meta?.fee ?? 0;
    if (transactionSignatures.has(signature)) throw new Error("block transaction signatures must be unique");
    transactionSignatures.add(signature);
    if (!Number.isSafeInteger(feeLamports) || feeLamports < 0) throw new Error("transaction fee must be a non-negative safe integer");
    const keys = accountKeys(entry.transaction.message, entry.meta);
    validateInstructionLayout(entry);
    const feePayer = keys[0] ?? "";
    const failed = entry.meta?.err != null;
    const record = {
      signature, slot: block.slot, blockTime, feePayer, success: !failed,
      feeLamports, accounts: keys,
      logCount: entry.meta?.logMessages?.length ?? 0,
    };
    transactions.push(record);
    const normalized = normalizedInstructions(entry, keys, signature, block.slot, blockTime); instructions.push(...normalized);
    if (failed) continue;
    nativeTransfers.push(...decodeSystemTransfers(normalized));
    poolLifecycleEvents.push(...[...decodeRaydiumCpmmPoolInitializations(entry, signature), ...decodeRaydiumClmmPoolInitializations(entry, signature), ...decodeOrcaWhirlpoolPoolInitializations(entry, signature), ...decodeMeteoraDlmmPoolInitializations(entry, signature), ...decodePumpSwapPoolInitializations(entry, signature), ...decodePumpBondingCurveInitializations(entry, signature), ...decodePumpMigrations(entry, signature), ...decodePumpCompletionEvents(entry, signature)].map((event, eventIndex) => { const registration = programRegistration(event.programId, block.slot); return { ...event, eventId: `solana:${block.slot}:${signature}:-1:${eventIndex}:${event.type}`, slot: block.slot, blockTime, instructionIndex: -1, innerIndex: eventIndex, registryVersion: PROGRAM_REGISTRY_VERSION, decoderVersion: registration?.decoderVersion ?? null }; }));
    decodedDexEvents.push(...decodeRaydiumSwapEvents(entry, signature), ...decodeRaydiumClmmSwapEvents(entry, signature), ...decodeOrcaWhirlpoolSwapEvents(entry, signature), ...decodeMeteoraDlmmSwapEvents(entry, signature), ...decodePumpSwapEvents(entry, signature), ...decodePumpTradeEvents(entry, signature));
    balanceChanges.push(...tokenBalanceChanges(entry, keys, signature, block.slot, blockTime));
    const tokenAccounts = tokenAccountEvidence(entry, keys);
    for (const instruction of normalized) {
      const transfer = parsedTransfer(instruction, tokenAccounts);
      if (transfer) transfers.push({ ...transfer, transferId: instruction.eventId.replace(/:instruction$/, ":token_transfer"), programId: instruction.programId, instructionIndex: instruction.instructionIndex, innerIndex: instruction.innerIndex, decoderVersion: 7, rawPayloadHash: instruction.rawPayloadHash, signature, slot: block.slot, blockTime });
    }
  }
  const suppliedProvenance = block.provenance ?? {};
  if (Object.hasOwn(suppliedProvenance, "source") && (typeof suppliedProvenance.source !== "string" || !suppliedProvenance.source.trim())) throw new Error("provenance.source must be a non-empty string");
  if (suppliedProvenance.genesisHash != null && (typeof suppliedProvenance.genesisHash !== "string" || !suppliedProvenance.genesisHash.trim())) throw new Error("provenance.genesisHash must be a non-empty string");
  if (Object.hasOwn(suppliedProvenance, "commitment") && !["unknown", "confirmed", "finalized"].includes(suppliedProvenance.commitment)) throw new Error("provenance.commitment must be unknown, confirmed, or finalized");
  const observedAtMs = suppliedProvenance.observedAt == null ? null : parseCanonicalUtcTimestamp(suppliedProvenance.observedAt);
  if (suppliedProvenance.observedAt != null && observedAtMs == null) throw new Error("provenance.observedAt must be a canonical UTC timestamp");
  if (suppliedProvenance.sourceTip != null && (!Number.isSafeInteger(suppliedProvenance.sourceTip) || suppliedProvenance.sourceTip < block.slot)) throw new Error("provenance.sourceTip must be a safe integer at or above block.slot");
  if (suppliedProvenance.exportLagSlots != null && (!Number.isSafeInteger(suppliedProvenance.exportLagSlots) || suppliedProvenance.exportLagSlots < 0)) throw new Error("provenance.exportLagSlots must be a non-negative safe integer");
  if (suppliedProvenance.sourceTip != null && suppliedProvenance.exportLagSlots != null && suppliedProvenance.sourceTip - block.slot !== suppliedProvenance.exportLagSlots) throw new Error("provenance source tip and export lag are inconsistent");
  const provenance = {
    source: suppliedProvenance.source?.trim() || "unknown",
    genesisHash: suppliedProvenance.genesisHash?.trim() || null,
    commitment: suppliedProvenance.commitment ?? "unknown",
    observedAt: observedAtMs == null ? null : new Date(observedAtMs).toISOString(),
    sourceTip: suppliedProvenance.sourceTip ?? null,
    exportLagSlots: suppliedProvenance.exportLagSlots ?? null,
  };
  const swaps = dexSwaps({ ...block, provenance }, transactions, decodedDexEvents);
  return { slot: block.slot, blockhash: block.blockhash, previousBlockhash: block.previousBlockhash, parentSlot: block.parentSlot, blockTime, provenance, transactions, instructions, transfers, nativeTransfers, balanceChanges, swaps, poolLifecycleEvents };
}

export function parseInput(text, filename = "input") {
  if (filename.endsWith(".ndjson")) return text.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`${filename}:${index + 1} contains invalid JSON`); }
  });
  const value = JSON.parse(text);
  return Array.isArray(value) ? value : [value];
}
