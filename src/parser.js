import crypto from "node:crypto";
import { PROGRAM_REGISTRY_VERSION, programRegistration } from "./program-registry.js";

const TOKEN_PROGRAMS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]);
const RAYDIUM_CPMM = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";
const RAYDIUM_CLMM = "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK";
const PUMP_AMM = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
function u64(value, field) { if (typeof value !== "string" || !/^\d+$/.test(value) || BigInt(value) > 18_446_744_073_709_551_615n) throw new Error(`${field} must be a decimal u64 string`); return value; }
function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte !== 0) break; output = `1${output}`; } return output || "1"; }
function readU64(buffer, offset) { return buffer.readBigUInt64LE(offset).toString(); }
function readU128(buffer, offset) { return (buffer.readBigUInt64LE(offset + 8) << 64n | buffer.readBigUInt64LE(offset)).toString(); }
const SWAP_EVENT_DISCRIMINATOR = crypto.createHash("sha256").update("event:SwapEvent").digest().subarray(0, 8);
export function decodeRaydiumSwapEvents(entry, signature) {
  if (entry.meta?.err != null) return [];
  const decimals = new Map([...(entry.meta?.preTokenBalances ?? []), ...(entry.meta?.postTokenBalances ?? [])].map((row) => [row.mint, row.uiTokenAmount?.decimals]));
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
  const keys = accountKeys(entry.transaction?.message, entry.meta), tokenAccounts = new Map();
  for (const row of [...(entry.meta?.preTokenBalances ?? []), ...(entry.meta?.postTokenBalances ?? [])]) if (Number.isSafeInteger(row.accountIndex) && keys[row.accountIndex] && row.mint) tokenAccounts.set(keys[row.accountIndex], { mint: row.mint, decimals: row.uiTokenAmount?.decimals });
  const events = [], stack = [];
  for (const line of entry.meta?.logMessages ?? []) {
    const invoke = line.match(/^Program (\S+) invoke /); if (invoke) { stack.push(invoke[1]); continue; }
    const done = line.match(/^Program (\S+) (?:success|failed:)/); if (done) { const index = stack.lastIndexOf(done[1]); if (index >= 0) stack.splice(index); continue; }
    if (stack.at(-1) !== RAYDIUM_CLMM || !line.startsWith("Program data: ")) continue;
    let data; try { data = Buffer.from(line.slice(14), "base64"); } catch { continue; }
    if (data.length !== 221 || !data.subarray(0, 8).equals(SWAP_EVENT_DISCRIMINATOR)) continue;
    const account0 = base58(data.subarray(72, 104)), account1 = base58(data.subarray(104, 136)), token0 = tokenAccounts.get(account0), token1 = tokenAccounts.get(account1), zeroForOne = data[168] !== 0;
    if (!token0 || !token1) continue;
    events.push({ protocol: "raydium-clmm", programId: RAYDIUM_CLMM, venueType: "clmm", type: "swap", signature, pool: base58(data.subarray(8, 40)), user: base58(data.subarray(40, 72)), baseMint: token0.mint, quoteMint: token1.mint, inputMint: zeroForOne ? token0.mint : token1.mint, outputMint: zeroForOne ? token1.mint : token0.mint, inputAmountRaw: readU64(data, zeroForOne ? 136 : 152), outputAmountRaw: readU64(data, zeroForOne ? 152 : 136), inputVaultBeforeRaw: null, outputVaultBeforeRaw: null, reserveTiming: "unavailable", inputDecimals: zeroForOne ? token0.decimals : token1.decimals, outputDecimals: zeroForOne ? token1.decimals : token0.decimals, inputTransferFeeRaw: readU64(data, zeroForOne ? 144 : 160), outputTransferFeeRaw: readU64(data, zeroForOne ? 160 : 144), tradeFeeRaw: readU64(data, zeroForOne ? 205 : 213), zeroForOne, sqrtPriceX64: readU128(data, 169), liquidityRaw: readU128(data, 185), tick: data.readInt32LE(201), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") });
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
  const decimals = new Map([...(entry.meta?.preTokenBalances ?? []), ...(entry.meta?.postTokenBalances ?? [])].map((row) => [row.mint, row.uiTokenAmount?.decimals]));
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
  const decimals = new Map([...(entry.meta?.preTokenBalances ?? []), ...(entry.meta?.postTokenBalances ?? [])].map((row) => [row.mint, row.uiTokenAmount?.decimals]));
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
  const sidecar = block.dexEvents ?? []; const covered = new Set(sidecar.map((event) => `${event.signature}:${event.protocol}`));
  // Provider blocks do not guarantee that every mint touched by a program log
  // appears in pre/post token balances. Preserve the canonical block and raw
  // instruction evidence, but do not publish a swap whose decimal precision is
  // unknown. Explicit sidecars remain strict contracts and are validated below.
  const completeDecoded = decodedEvents.filter((event) => Number.isInteger(event.inputDecimals) && Number.isInteger(event.outputDecimals));
  const events = [...sidecar, ...completeDecoded.filter((event) => !covered.has(`${event.signature}:${event.protocol}`))]; const indices = new Map();
  return events.map((event, index) => {
    const field = (name) => { const value = event[name]; if (typeof value !== "string" || !value) throw new Error(`dexEvents[${index}].${name} is required`); return value; };
    const supported = (event.protocol === "raydium-cpmm" && event.programId === RAYDIUM_CPMM) || (event.protocol === "raydium-clmm" && event.programId === RAYDIUM_CLMM) || (event.protocol === "pump-swap" && event.programId === PUMP_AMM) || (event.protocol === "pump-bonding-curve" && event.programId === PUMP_PROGRAM);
    if (!supported || event.type !== "swap") throw new Error(`dexEvents[${index}] is not a supported DEX swap`);
    const signature = field("signature"); if (!successful.has(signature)) throw new Error(`dexEvents[${index}].signature must reference a successful transaction`);
    const inputDecimals = event.inputDecimals; const outputDecimals = event.outputDecimals;
    if (!Number.isInteger(inputDecimals) || inputDecimals < 0 || inputDecimals > 255 || !Number.isInteger(outputDecimals) || outputDecimals < 0 || outputDecimals > 255) throw new Error(`dexEvents[${index}] decimals must be integers from 0 to 255`);
    const eventIndex = indices.get(signature) ?? 0; indices.set(signature, eventIndex + 1);
    const inputMint = field("inputMint"), outputMint = field("outputMint"); const authoritativeBase = event.baseMint ?? (event.protocol === "pump-bonding-curve" ? event.mint : null); const baseMint = authoritativeBase ?? [inputMint, outputMint].sort()[0]; const quoteMint = event.quoteMint ?? (baseMint === inputMint ? outputMint : inputMint);
    const nullableReserves = event.protocol === "raydium-clmm";
    const normalized = { swapId: `${signature}:${eventIndex}`, eventIndex, protocol: event.protocol, programId: event.programId, venueType: event.venueType ?? "amm", side: event.side ?? null, signature, pool: field("pool"), baseMint, quoteMint, pairIdentitySource: authoritativeBase && event.quoteMint ? "protocol_event" : "canonical_lexical", inputMint, outputMint, inputAmountRaw: u64(event.inputAmountRaw, "inputAmountRaw"), outputAmountRaw: u64(event.outputAmountRaw, "outputAmountRaw"), inputVaultBeforeRaw: nullableReserves && event.inputVaultBeforeRaw == null ? null : u64(event.inputVaultBeforeRaw, "inputVaultBeforeRaw"), outputVaultBeforeRaw: nullableReserves && event.outputVaultBeforeRaw == null ? null : u64(event.outputVaultBeforeRaw, "outputVaultBeforeRaw"), tradeFeeRaw: u64(event.tradeFeeRaw, "tradeFeeRaw"), reserveTiming: event.reserveTiming ?? "before", inputDecimals, outputDecimals, baseDecimals: baseMint === inputMint ? inputDecimals : outputDecimals, quoteDecimals: quoteMint === inputMint ? inputDecimals : outputDecimals, slot: block.slot, blockTime: Number.isInteger(block.blockTime) ? block.blockTime : null, provenance: block.provenance };
    if (event.protocol === "raydium-clmm") for (const name of ["user", "zeroForOne", "sqrtPriceX64", "liquidityRaw", "tick", "inputTransferFeeRaw", "outputTransferFeeRaw"]) normalized[name] = event[name];
    if (event.protocol === "pump-bonding-curve") for (const name of ["mint", "quoteMint", "user", "creator", "feeRecipient", "creatorFeeRaw", "cashbackRaw", "buybackRaw", "feeBasisPoints", "creatorFeeBasisPoints", "cashbackFeeBasisPoints", "buybackFeeBasisPoints", "virtualSolReservesRaw", "virtualTokenReservesRaw", "realSolReservesRaw", "realTokenReservesRaw", "virtualQuoteReservesRaw", "realQuoteReservesRaw", "ixName", "mayhemMode", "shareholderCount"]) normalized[name] = event[name];
    const registration = programRegistration(event.programId, block.slot); normalized.eventId = `solana:${block.slot}:${signature}:-1:${eventIndex}:swap`; normalized.registryVersion = PROGRAM_REGISTRY_VERSION; normalized.decoderVersion = registration?.decoderVersion ?? null; normalized.rawPayloadHash = event.rawPayloadHash ?? crypto.createHash("sha256").update(JSON.stringify(event)).digest("hex"); normalized.payloadHashKind = event.rawPayloadHash ? "raw" : "source_event";
    return normalized;
  });
}

function accountKeys(message, meta = null) {
  const staticKeys = (message?.accountKeys ?? []).map((key) => typeof key === "string" ? key : key.pubkey).filter(Boolean);
  return [...staticKeys, ...(meta?.loadedAddresses?.writable ?? []), ...(meta?.loadedAddresses?.readonly ?? [])];
}

function tokenBalanceChanges(entry, keys, signature, slot, blockTime) {
  const pre = new Map((entry.meta?.preTokenBalances ?? []).map((row) => [row.accountIndex, row])); const post = new Map((entry.meta?.postTokenBalances ?? []).map((row) => [row.accountIndex, row])); const changes = [];
  for (const accountIndex of new Set([...pre.keys(), ...post.keys()])) {
    if (!Number.isSafeInteger(accountIndex) || accountIndex < 0 || accountIndex >= keys.length) continue;
    const before = pre.get(accountIndex), after = post.get(accountIndex); const mint = after?.mint ?? before?.mint; if (!mint) continue;
    const preAmountRaw = u64(String(before?.uiTokenAmount?.amount ?? "0"), "preTokenBalance.amount"); const postAmountRaw = u64(String(after?.uiTokenAmount?.amount ?? "0"), "postTokenBalance.amount"); if (preAmountRaw === postAmountRaw) continue;
    const decimals = after?.uiTokenAmount?.decimals ?? before?.uiTokenAmount?.decimals; if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) continue;
    changes.push({ signature, slot, blockTime, accountIndex, tokenAccount: keys[accountIndex], owner: after?.owner ?? before?.owner ?? null, programId: after?.programId ?? before?.programId ?? null, mint, decimals, preAmountRaw, postAmountRaw, deltaDirection: BigInt(postAmountRaw) >= BigInt(preAmountRaw) ? "credit" : "debit", closed: !after });
  }
  return changes;
}

function instructionRows(transaction) {
  const outer = transaction?.transaction?.message?.instructions ?? [];
  const inner = (transaction?.meta?.innerInstructions ?? []).flatMap((group) => group.instructions ?? []);
  return [...outer, ...inner];
}

function normalizedInstructions(entry, keys, signature, slot, blockTime) {
  const outer = entry.transaction?.message?.instructions ?? []; const innerGroups = new Map((entry.meta?.innerInstructions ?? []).map((group) => [group.index, group.instructions ?? []])); const rows = [];
  const append = (instruction, instructionIndex, innerIndex) => {
    const programId = instruction.programId ?? instruction.program ?? (Number.isSafeInteger(instruction.programIdIndex) ? keys[instruction.programIdIndex] : null); if (!programId) return;
    const accounts = (instruction.accounts ?? []).map((account) => Number.isSafeInteger(account) ? keys[account] : account).filter(Boolean); const rawPayloadHash = crypto.createHash("sha256").update(JSON.stringify(instruction)).digest("hex"); const registration = programRegistration(programId, slot);
    rows.push({ eventId: `solana:${slot}:${signature}:${instructionIndex}:${innerIndex ?? -1}:instruction`, chain: "solana", slot, blockTime, signature, instructionIndex, innerIndex, programId, protocol: registration?.protocol ?? null, registryVersion: PROGRAM_REGISTRY_VERSION, decoderVersion: registration?.decoderVersion ?? null, parsedType: instruction.parsed?.type ?? null, accounts, data: typeof instruction.data === "string" ? instruction.data : null, parsed: instruction.parsed ?? null, rawPayloadHash });
  };
  outer.forEach((instruction, instructionIndex) => { append(instruction, instructionIndex, null); (innerGroups.get(instructionIndex) ?? []).forEach((inner, innerIndex) => append(inner, instructionIndex, innerIndex)); });
  return rows;
}

function parsedTransfer(instruction) {
  const programId = instruction.programId || instruction.program;
  const parsed = instruction.parsed;
  if ((!TOKEN_PROGRAMS.has(programId) && instruction.program !== "spl-token") || !parsed?.info) return null;
  if (!["transfer", "transferChecked"].includes(parsed.type)) return null;
  const tokenAmount = parsed.info.tokenAmount;
  const amountRaw = tokenAmount?.amount ?? parsed.info.amount ?? null;
  const decimals = Number.isInteger(tokenAmount?.decimals) ? tokenAmount.decimals : null;
  const amountUiString = tokenAmount?.uiAmountString ?? null;
  return {
    source: parsed.info.source ?? "",
    destination: parsed.info.destination ?? "",
    authority: parsed.info.authority ?? parsed.info.multisigAuthority ?? "",
    mint: parsed.info.mint ?? null,
    // Keep integer base units as a string. JavaScript numbers cannot safely
    // represent the full u64 range used by SPL token amounts.
    amountRaw: amountRaw == null ? null : String(amountRaw),
    decimals,
    amountUiString: amountUiString == null ? null : String(amountUiString),
  };
}

export function parseBlock(block) {
  if (!Number.isInteger(block?.slot) || block.slot < 0) throw new Error("block.slot must be a non-negative integer");
  if (!Array.isArray(block.transactions)) throw new Error("block.transactions must be an array");
  const blockTime = Number.isInteger(block.blockTime) ? block.blockTime : null;
  const transactions = [];
  const transfers = [];
  const balanceChanges = [];
  const instructions = [];
  const decodedDexEvents = [];
  for (const entry of block.transactions) {
    const signature = entry?.transaction?.signatures?.[0];
    if (!signature) continue;
    const keys = accountKeys(entry.transaction.message, entry.meta);
    const feePayer = keys[0] ?? "";
    const failed = entry.meta?.err != null;
    const record = {
      signature, slot: block.slot, blockTime, feePayer, success: !failed,
      feeLamports: Number(entry.meta?.fee ?? 0), accounts: keys,
      logCount: entry.meta?.logMessages?.length ?? 0,
    };
    transactions.push(record);
    instructions.push(...normalizedInstructions(entry, keys, signature, block.slot, blockTime));
    if (failed) continue;
    decodedDexEvents.push(...decodeRaydiumSwapEvents(entry, signature), ...decodeRaydiumClmmSwapEvents(entry, signature), ...decodePumpSwapEvents(entry, signature), ...decodePumpTradeEvents(entry, signature));
    balanceChanges.push(...tokenBalanceChanges(entry, keys, signature, block.slot, blockTime));
    for (const instruction of instructionRows(entry)) {
      const transfer = parsedTransfer(instruction);
      if (transfer) transfers.push({ ...transfer, signature, slot: block.slot, blockTime });
    }
  }
  const provenance = {
    source: typeof block.provenance?.source === "string" ? block.provenance.source : "unknown",
    commitment: block.provenance?.commitment === "finalized" ? "finalized" : "unknown",
    observedAt: typeof block.provenance?.observedAt === "string" ? block.provenance.observedAt : null,
    sourceTip: Number.isInteger(block.provenance?.sourceTip) ? block.provenance.sourceTip : null,
    exportLagSlots: Number.isInteger(block.provenance?.exportLagSlots) && block.provenance.exportLagSlots >= 0 ? block.provenance.exportLagSlots : null,
  };
  const swaps = dexSwaps(block, transactions, decodedDexEvents);
  return { slot: block.slot, blockhash: block.blockhash ?? "", previousBlockhash: block.previousBlockhash ?? "", parentSlot: block.parentSlot ?? block.slot - 1, blockTime, provenance, transactions, instructions, transfers, balanceChanges, swaps };
}

export function parseInput(text, filename = "input") {
  if (filename.endsWith(".ndjson")) return text.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`${filename}:${index + 1} contains invalid JSON`); }
  });
  const value = JSON.parse(text);
  return Array.isArray(value) ? value : [value];
}
