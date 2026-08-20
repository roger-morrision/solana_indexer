const TOKEN_PROGRAMS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]);

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
  return { slot: block.slot, blockhash: block.blockhash ?? "", previousBlockhash: block.previousBlockhash ?? "", parentSlot: block.parentSlot ?? block.slot - 1, blockTime, provenance, transactions, transfers };
}

export function parseInput(text, filename = "input") {
  if (filename.endsWith(".ndjson")) return text.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`${filename}:${index + 1} contains invalid JSON`); }
  });
  const value = JSON.parse(text);
  return Array.isArray(value) ? value : [value];
}
