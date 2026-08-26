#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isInvokedFile } from "./invoked-file.js";
import { loadConfig } from "./config.js";
import { IndexStore } from "./store.js";

export async function reconcileDeadLetters({ dataFile, confirm = false }) {
  const store = new IndexStore(dataFile); await store.load(); store.assertWritable();
  if (store.state.checkpoints.deadLetterOverflow != null) throw new Error("dead-letter capacity exceeded; omitted evidence requires controlled replay");
  const eligible = store.state.deadLetters.flatMap((row) => {
    const snapshotType = row.filename.startsWith("snapshot:") ? row.filename.slice(9) : null, checkpoint = snapshotType == null ? store.state.processedFiles[row.filename] : store.state.checkpoints.snapshotArtifacts?.[snapshotType], fingerprint = checkpoint?.fingerprint, checkpointValid = snapshotType == null ? checkpoint?.parserVersion === 2 : Boolean(checkpoint);
    return !row.resolved && checkpointValid && typeof fingerprint === "string" && (row.fingerprint == null || row.fingerprint === fingerprint) ? [{ row, fingerprint }] : [];
  });
  if (confirm) {
    for (const candidate of eligible) store.resolveDeadLetters(candidate.row.filename, candidate.fingerprint);
    if (eligible.length) await store.save();
  }
  return { dryRun: !confirm, eligible: eligible.map(({ row }) => ({ id: row.id, filename: row.filename, resolution: "parser_v2_checkpoint" })), resolved: confirm ? eligible.length : 0, unresolvedRemaining: store.state.deadLetters.filter((row) => !row.resolved).length };
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  if (!confirm) console.warn("dry run only; pass --confirm to persist exact-fingerprint reconciliation");
  console.log(JSON.stringify(await reconcileDeadLetters({ dataFile: loadConfig().dataFile, confirm }), null, 2));
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (isInvokedFile(invokedFile, fileURLToPath(import.meta.url))) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
