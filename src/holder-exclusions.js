import fs from "node:fs/promises";

const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const CATEGORIES = new Set(["burn", "exchange", "locker", "pool", "protocol", "vault"]);

export function compileHolderExclusions(value) {
  if (value?.schemaVersion !== 1 || value.chain !== "solana" || value.genesisHash !== MAINNET_GENESIS_HASH || !Number.isFinite(Date.parse(value.observedAt ?? "")) || typeof value.source !== "string" || !value.source || !Array.isArray(value.completeMints) || !Array.isArray(value.entries)) throw new Error("invalid holder exclusion registry");
  const completeMints = new Set(); for (const mint of value.completeMints) { if (typeof mint !== "string" || !mint || completeMints.has(mint)) throw new Error("invalid complete holder exclusion mint"); completeMints.add(mint); }
  const byMint = new Map(), selectors = new Set();
  for (const entry of value.entries) {
    const hasOwner = typeof entry?.owner === "string" && Boolean(entry.owner), hasTokenAccount = typeof entry?.tokenAccount === "string" && Boolean(entry.tokenAccount);
    if (typeof entry?.mint !== "string" || !entry.mint || hasOwner === hasTokenAccount || !CATEGORIES.has(entry.category) || typeof entry.evidenceSource !== "string" || !entry.evidenceSource) throw new Error("invalid holder exclusion entry");
    const selector = `${entry.mint}:${hasOwner ? `owner:${entry.owner}` : `tokenAccount:${entry.tokenAccount}`}`; if (selectors.has(selector)) throw new Error("duplicate holder exclusion entry"); selectors.add(selector);
    const rows = byMint.get(entry.mint) ?? []; rows.push(Object.freeze({ mint: entry.mint, owner: hasOwner ? entry.owner : null, tokenAccount: hasTokenAccount ? entry.tokenAccount : null, category: entry.category, evidenceSource: entry.evidenceSource })); byMint.set(entry.mint, rows);
  }
  return Object.freeze({ schemaVersion: 1, chain: "solana", genesisHash: value.genesisHash, observedAt: value.observedAt, source: value.source, completeMints, byMint });
}

export async function loadHolderExclusions(filename) {
  if (!filename) return null;
  try { return compileHolderExclusions(JSON.parse(await fs.readFile(filename, "utf8"))); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}
