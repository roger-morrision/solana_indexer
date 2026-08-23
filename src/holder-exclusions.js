import crypto from "node:crypto";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { readBoundedJsonFile } from "./bounded-json-file.js";

const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const CATEGORIES = new Set(["burn", "exchange", "locker", "pool", "protocol", "vault"]);

function normalizedContent(value) {
  return { schemaVersion: 2, chain: "solana", genesisHash: value.genesisHash, observedAt: value.observedAt, expiresAt: value.expiresAt, source: value.source, completeMints: [...value.completeMints].sort(), entries: value.entries.map((entry) => ({ mint: entry.mint, owner: entry.owner ?? null, tokenAccount: entry.tokenAccount ?? null, category: entry.category, evidenceSource: entry.evidenceSource })).sort((left, right) => left.mint.localeCompare(right.mint) || String(left.owner).localeCompare(String(right.owner)) || String(left.tokenAccount).localeCompare(String(right.tokenAccount)) || left.category.localeCompare(right.category) || left.evidenceSource.localeCompare(right.evidenceSource)) };
}

export function holderExclusionContentSha256(value) { return crypto.createHash("sha256").update(JSON.stringify(normalizedContent(value))).digest("hex"); }

export function compileHolderExclusions(value) {
  const observedAt = parseCanonicalUtcTimestamp(value?.observedAt), expiresAt = parseCanonicalUtcTimestamp(value?.expiresAt);
  if (value?.schemaVersion !== 2 || value.chain !== "solana" || value.genesisHash !== MAINNET_GENESIS_HASH || observedAt == null || expiresAt == null || expiresAt <= observedAt || typeof value.source !== "string" || !value.source || !Array.isArray(value.completeMints) || !Array.isArray(value.entries) || !/^[0-9a-f]{64}$/.test(value.contentSha256 ?? "")) throw new Error("invalid holder exclusion registry");
  const completeMints = new Set(); for (const mint of value.completeMints) { if (typeof mint !== "string" || !mint || completeMints.has(mint)) throw new Error("invalid complete holder exclusion mint"); completeMints.add(mint); }
  const byMint = new Map(), selectors = new Set();
  for (const entry of value.entries) {
    const hasOwner = typeof entry?.owner === "string" && Boolean(entry.owner), hasTokenAccount = typeof entry?.tokenAccount === "string" && Boolean(entry.tokenAccount);
    if (typeof entry?.mint !== "string" || !entry.mint || hasOwner === hasTokenAccount || !CATEGORIES.has(entry.category) || typeof entry.evidenceSource !== "string" || !entry.evidenceSource) throw new Error("invalid holder exclusion entry");
    const selector = `${entry.mint}:${hasOwner ? `owner:${entry.owner}` : `tokenAccount:${entry.tokenAccount}`}`; if (selectors.has(selector)) throw new Error("duplicate holder exclusion entry"); selectors.add(selector);
    const rows = byMint.get(entry.mint) ?? []; rows.push(Object.freeze({ mint: entry.mint, owner: hasOwner ? entry.owner : null, tokenAccount: hasTokenAccount ? entry.tokenAccount : null, category: entry.category, evidenceSource: entry.evidenceSource })); byMint.set(entry.mint, rows);
  }
  if (holderExclusionContentSha256(value) !== value.contentSha256) throw new Error("holder exclusion registry content hash mismatch");
  return Object.freeze({ schemaVersion: 2, chain: "solana", genesisHash: value.genesisHash, observedAt: value.observedAt, expiresAt: value.expiresAt, contentSha256: value.contentSha256, source: value.source, completeMints, byMint });
}

export async function loadHolderExclusions(filename) {
  if (!filename) return null;
  const document = await readBoundedJsonFile(filename);
  if (document == null) return null;
  if (document.evidenceReadError) throw new Error(`holder exclusion registry is unavailable: ${document.evidenceReadError}`);
  return compileHolderExclusions(document);
}
