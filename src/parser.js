import crypto from "node:crypto";

const TOKEN_PROGRAMS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]);
const RAYDIUM_CPMM = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";
function u64(value, field) { if (typeof value !== "string" || !/^\d+$/.test(value) || BigInt(value) > 18_446_744_073_709_551_615n) throw new Error(`${field} must be a decimal u64 string`); return value; }
function base58(bytes) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte !== 0) break; output = `1${output}`; } return output || "1"; }
function readU64(buffer, offset) { return buffer.readBigUInt64LE(offset).toString(); }
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
    events.push({ protocol: "raydium-cpmm", programId: RAYDIUM_CPMM, type: "swap", signature, pool: base58(data.subarray(8, 40)), inputVaultBeforeRaw: readU64(data, 40), outputVaultBeforeRaw: readU64(data, 48), inputAmountRaw: readU64(data, 56), outputAmountRaw: readU64(data, 64), inputTransferFeeRaw: readU64(data, 72), outputTransferFeeRaw: readU64(data, 80), baseInput: data[88] !== 0, inputMint, outputMint, tradeFeeRaw: readU64(data, 153), creatorFeeRaw: readU64(data, 161), creatorFeeOnInput: data[169] !== 0, inputDecimals: decimals.get(inputMint), outputDecimals: decimals.get(outputMint) });
  }
  return events;
}
function dexSwaps(block, transactions, decodedEvents) {
  const successful = new Set(transactions.filter((row) => row.success).map((row) => row.signature));
  return [...(block.dexEvents ?? []), ...decodedEvents].map((event, index) => {
    const field = (name) => { const value = event[name]; if (typeof value !== "string" || !value) throw new Error(`dexEvents[${index}].${name} is required`); return value; };
    if (event.protocol !== "raydium-cpmm" || event.programId !== RAYDIUM_CPMM || event.type !== "swap") throw new Error(`dexEvents[${index}] is not a supported Raydium CPMM swap`);
    const signature = field("signature"); if (!successful.has(signature)) throw new Error(`dexEvents[${index}].signature must reference a successful transaction`);
    const inputDecimals = event.inputDecimals; const outputDecimals = event.outputDecimals;
    if (!Number.isInteger(inputDecimals) || inputDecimals < 0 || inputDecimals > 255 || !Number.isInteger(outputDecimals) || outputDecimals < 0 || outputDecimals > 255) throw new Error(`dexEvents[${index}] decimals must be integers from 0 to 255`);
    return { protocol: event.protocol, programId: event.programId, signature, pool: field("pool"), inputMint: field("inputMint"), outputMint: field("outputMint"), inputAmountRaw: u64(event.inputAmountRaw, "inputAmountRaw"), outputAmountRaw: u64(event.outputAmountRaw, "outputAmountRaw"), inputVaultBeforeRaw: u64(event.inputVaultBeforeRaw, "inputVaultBeforeRaw"), outputVaultBeforeRaw: u64(event.outputVaultBeforeRaw, "outputVaultBeforeRaw"), tradeFeeRaw: u64(event.tradeFeeRaw, "tradeFeeRaw"), inputDecimals, outputDecimals, slot: block.slot, blockTime: Number.isInteger(block.blockTime) ? block.blockTime : null };
  });
}

function accountKeys(message) {
  return (message?.accountKeys ?? []).map((key) => typeof key === "string" ? key : key.pubkey).filter(Boolean);
}

function instructionRows(transaction) {
  const outer = transaction?.transaction?.message?.instructions ?? [];
  const inner = (transaction?.meta?.innerInstructions ?? []).flatMap((group) => group.instructions ?? []);
  return [...outer, ...inner];
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
  const decodedDexEvents = [];
  for (const entry of block.transactions) {
    const signature = entry?.transaction?.signatures?.[0];
    if (!signature) continue;
    const keys = accountKeys(entry.transaction.message);
    const feePayer = keys[0] ?? "";
    const failed = entry.meta?.err != null;
    const record = {
      signature, slot: block.slot, blockTime, feePayer, success: !failed,
      feeLamports: Number(entry.meta?.fee ?? 0), accounts: keys,
      logCount: entry.meta?.logMessages?.length ?? 0,
    };
    transactions.push(record);
    if (failed) continue;
    decodedDexEvents.push(...decodeRaydiumSwapEvents(entry, signature));
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
  return { slot: block.slot, blockhash: block.blockhash ?? "", previousBlockhash: block.previousBlockhash ?? "", parentSlot: block.parentSlot ?? block.slot - 1, blockTime, provenance, transactions, transfers, swaps };
}

export function parseInput(text, filename = "input") {
  if (filename.endsWith(".ndjson")) return text.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`${filename}:${index + 1} contains invalid JSON`); }
  });
  const value = JSON.parse(text);
  return Array.isArray(value) ? value : [value];
}
