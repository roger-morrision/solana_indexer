#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { canonicalPersistedRecoveryState } from "./store.js";
import { readBoundedJsonFile } from "./bounded-json-file.js";
import { canonicalInboxNames, readCanonicalInboxFile } from "./archive-receipt.js";

export const MAX_RETENTION_STATE_BYTES = 536_870_912;
export const MAX_RETENTION_RECEIPT_BYTES = 16_777_216;

function fingerprint(content) { return crypto.createHash("sha256").update(content).digest("hex"); }
export async function retainInbox({ inbox, dataFile, archiveReceiptFile = path.resolve(process.env.INBOX_ARCHIVE_RECEIPT_FILE ?? "data/inbox-archive-receipt.json"), retentionSeconds, now = Date.now(), confirmDelete = false, maximumStateBytes = MAX_RETENTION_STATE_BYTES, maximumReceiptBytes = MAX_RETENTION_RECEIPT_BYTES, maximumEntries = 100_000 }) {
  if (!Number.isSafeInteger(retentionSeconds) || retentionSeconds < 1 || !Number.isSafeInteger(now) || now < 0) throw new Error("invalid inbox retention parameters");
  const state = await readBoundedJsonFile(dataFile, { maximumBytes: maximumStateBytes, missing: null });
  if (!canonicalPersistedRecoveryState(state)) throw new Error("indexed recovery evidence invalid; inbox retention refused");
  const cutoff = now - retentionSeconds * 1_000, dead = new Set(state.deadLetters.filter((row) => !row.resolved).map((row) => row.filename));
  const receipt = await readBoundedJsonFile(archiveReceiptFile, { maximumBytes: maximumReceiptBytes, missing: null });
  const receiptValid = receipt?.schemaVersion === 1 && receipt?.storage === "self-hosted" && ["uploaded", "verified_local"].includes(receipt?.status) && parseCanonicalUtcTimestamp(receipt?.completedAt ?? receipt?.uploadCompletedAt) != null;
  const result = { dryRun: !confirmDelete, eligible: [], deleted: [], archiveReceiptValid: receiptValid, retained: { recent: 0, uncheckpointed: 0, changed: 0, deadLetter: 0, unarchived: 0 } };
  for (const name of await canonicalInboxNames(inbox, maximumEntries)) {
    const filename = path.join(inbox, name), stat = await fs.lstat(filename); if (stat.mtimeMs >= cutoff) { result.retained.recent++; continue; }
    if (dead.has(name)) { result.retained.deadLetter++; continue; }
    const checkpoint = state.processedFiles?.[name]; if (!checkpoint?.fingerprint || checkpoint.parserVersion !== 2) { result.retained.uncheckpointed++; continue; }
    if (fingerprint(await readCanonicalInboxFile(inbox, name)) !== checkpoint.fingerprint) { result.retained.changed++; continue; }
    if (!receiptValid || receipt.files?.[name] !== checkpoint.fingerprint) { result.retained.unarchived++; continue; }
    if (confirmDelete && fingerprint(await readCanonicalInboxFile(inbox, name)) !== checkpoint.fingerprint) { result.retained.changed++; continue; }
    result.eligible.push(name); if (confirmDelete) { await fs.unlink(filename); result.deleted.push(name); }
  }
  return result;
}

async function main() { const config = loadConfig(), retentionSeconds = config.retentionSeconds, archiveReceiptFile = path.resolve(process.env.INBOX_ARCHIVE_RECEIPT_FILE ?? "data/inbox-archive-receipt.json"); if (!process.argv.includes("--confirm-delete")) console.warn("dry run only; deletion also requires a verified self-hosted archive receipt"); console.log(JSON.stringify(await retainInbox({ inbox: config.inbox, dataFile: config.dataFile, archiveReceiptFile, retentionSeconds, confirmDelete: process.argv.includes("--confirm-delete"), maximumEntries: config.maxInboxEntries }), null, 2)); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
