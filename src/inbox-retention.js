#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";

function fingerprint(content) { return crypto.createHash("sha256").update(content).digest("hex"); }
export async function retainInbox({ inbox, dataFile, archiveReceiptFile = path.resolve(process.env.INBOX_ARCHIVE_RECEIPT_FILE ?? "data/inbox-archive-receipt.json"), retentionSeconds, now = Date.now(), confirmDelete = false }) {
  const state = JSON.parse(await fs.readFile(dataFile, "utf8")), cutoff = now - retentionSeconds * 1_000, dead = new Set((state.deadLetters ?? []).filter((row) => !row.resolved).map((row) => row.filename));
  let receipt = null;
  try { receipt = JSON.parse(await fs.readFile(archiveReceiptFile, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const receiptValid = receipt?.schemaVersion === 1 && receipt?.storage === "self-hosted" && ["uploaded", "verified_local"].includes(receipt?.status) && Number.isFinite(Date.parse(receipt?.completedAt ?? receipt?.uploadCompletedAt));
  const result = { dryRun: !confirmDelete, eligible: [], deleted: [], archiveReceiptValid: receiptValid, retained: { recent: 0, uncheckpointed: 0, changed: 0, deadLetter: 0, unarchived: 0 } };
  for (const name of (await fs.readdir(inbox)).filter((value) => /\.(?:json|ndjson)$/i.test(value)).sort()) {
    const filename = `${inbox}/${name}`, stat = await fs.stat(filename); if (stat.mtimeMs >= cutoff) { result.retained.recent++; continue; }
    if (dead.has(name)) { result.retained.deadLetter++; continue; }
    const checkpoint = state.processedFiles?.[name]; if (!checkpoint?.fingerprint || checkpoint.parserVersion !== 2) { result.retained.uncheckpointed++; continue; }
    if (fingerprint(await fs.readFile(filename)) !== checkpoint.fingerprint) { result.retained.changed++; continue; }
    if (!receiptValid || receipt.files?.[name] !== checkpoint.fingerprint) { result.retained.unarchived++; continue; }
    result.eligible.push(name); if (confirmDelete) { await fs.unlink(filename); result.deleted.push(name); }
  }
  return result;
}

async function main() { const config = loadConfig(), retentionSeconds = config.retentionSeconds, archiveReceiptFile = path.resolve(process.env.INBOX_ARCHIVE_RECEIPT_FILE ?? "data/inbox-archive-receipt.json"); if (!process.argv.includes("--confirm-delete")) console.warn("dry run only; deletion also requires a verified self-hosted archive receipt"); console.log(JSON.stringify(await retainInbox({ inbox: config.inbox, dataFile: config.dataFile, archiveReceiptFile, retentionSeconds, confirmDelete: process.argv.includes("--confirm-delete") }), null, 2)); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
