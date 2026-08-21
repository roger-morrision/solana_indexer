#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { IndexStore } from "./store.js";

export async function reconcileDeadLetters({ dataFile, confirm = false }) {
  const store = new IndexStore(dataFile); await store.load();
  const eligible = store.state.deadLetters.filter((row) => {
    const checkpoint = store.state.processedFiles[row.filename];
    return !row.resolved && Boolean(row.fingerprint) && checkpoint?.parserVersion === 2 && checkpoint.fingerprint === row.fingerprint;
  });
  if (confirm) {
    for (const row of eligible) store.resolveDeadLetters(row.filename, row.fingerprint);
    if (eligible.length) await store.save();
  }
  return { dryRun: !confirm, eligible: eligible.map((row) => ({ id: row.id, filename: row.filename, resolution: "parser_v2_checkpoint" })), resolved: confirm ? eligible.length : 0, unresolvedRemaining: store.state.deadLetters.filter((row) => !row.resolved).length };
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  if (!confirm) console.warn("dry run only; pass --confirm to persist exact-fingerprint reconciliation");
  console.log(JSON.stringify(await reconcileDeadLetters({ dataFile: loadConfig().dataFile, confirm }), null, 2));
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
