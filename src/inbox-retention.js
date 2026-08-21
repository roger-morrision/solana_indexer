#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";

function fingerprint(content) { return crypto.createHash("sha256").update(content).digest("hex"); }
export async function retainInbox({ inbox, dataFile, retentionSeconds, now = Date.now(), confirmDelete = false }) {
  const state = JSON.parse(await fs.readFile(dataFile, "utf8")), cutoff = now - retentionSeconds * 1_000, dead = new Set((state.deadLetters ?? []).filter((row) => !row.resolved).map((row) => row.filename));
  const result = { dryRun: !confirmDelete, eligible: [], deleted: [], retained: { recent: 0, uncheckpointed: 0, changed: 0, deadLetter: 0 } };
  for (const name of (await fs.readdir(inbox)).filter((value) => /\.(?:json|ndjson)$/i.test(value)).sort()) {
    const filename = `${inbox}/${name}`, stat = await fs.stat(filename); if (stat.mtimeMs >= cutoff) { result.retained.recent++; continue; }
    if (dead.has(name)) { result.retained.deadLetter++; continue; }
    const checkpoint = state.processedFiles?.[name]; if (!checkpoint?.fingerprint || checkpoint.parserVersion !== 2) { result.retained.uncheckpointed++; continue; }
    if (fingerprint(await fs.readFile(filename)) !== checkpoint.fingerprint) { result.retained.changed++; continue; }
    result.eligible.push(name); if (confirmDelete) { await fs.unlink(filename); result.deleted.push(name); }
  }
  return result;
}

async function main() { const config = loadConfig(), retentionSeconds = config.retentionSeconds; if (!process.argv.includes("--confirm-delete")) console.warn("dry run only; pass --confirm-delete after a verified backup"); console.log(JSON.stringify(await retainInbox({ inbox: config.inbox, dataFile: config.dataFile, retentionSeconds, confirmDelete: process.argv.includes("--confirm-delete") }), null, 2)); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
