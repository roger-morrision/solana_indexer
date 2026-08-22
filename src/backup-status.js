#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { durableAtomicWrite } from "./durable-file.js";

const BACKUP_ID = /^[0-9]{8}T[0-9]{6}Z$/;
const SHA256 = /^[0-9a-f]{64}$/;
const digest = (content) => crypto.createHash("sha256").update(content).digest("hex");

export function assessBackupStatus(status, maximumAgeMs = 86_400_000, now = Date.now()) {
  if (!Number.isSafeInteger(maximumAgeMs) || maximumAgeMs < 1 || !Number.isFinite(now)) throw new Error("invalid backup status assessment parameters");
  const completedAt = parseCanonicalUtcTimestamp(status?.completedAt), canonical = status?.schemaVersion === 1 && status.kind === "self_hosted_backup_completed" && status.chain === "solana-mainnet" && status.storage === "self-hosted" && BACKUP_ID.test(status.backupId ?? "") && SHA256.test(status.backupManifestSha256 ?? "") && SHA256.test(status.archiveReceiptSha256 ?? "") && completedAt != null;
  if (!canonical) return { available: false, healthy: false, reason: status == null ? "backup_status_unavailable" : "backup_status_invalid", ageMs: null, maximumAgeMs };
  const ageMs = now - completedAt;
  if (ageMs < 0) return { available: true, healthy: false, reason: "backup_status_future", ageMs, maximumAgeMs, backupId: status.backupId, completedAt: status.completedAt };
  return { available: true, healthy: ageMs <= maximumAgeMs, reason: ageMs <= maximumAgeMs ? null : "backup_status_stale", ageMs, maximumAgeMs, backupId: status.backupId, completedAt: status.completedAt };
}

export async function createBackupStatus({ manifestFile, archiveReceiptFile, output, completedAt = new Date().toISOString() }) {
  const [manifestBytes, receiptBytes] = await Promise.all([fs.readFile(manifestFile), fs.readFile(archiveReceiptFile)]), manifest = JSON.parse(manifestBytes), receipt = JSON.parse(receiptBytes), completedAtMs = parseCanonicalUtcTimestamp(completedAt), receiptCompletedAtMs = parseCanonicalUtcTimestamp(receipt.completedAt);
  if (manifest.schemaVersion !== 3 || manifest.chain !== "solana-mainnet" || !BACKUP_ID.test(manifest.backupId ?? "") || receipt.schemaVersion !== 1 || receipt.storage !== "self-hosted" || receipt.status !== "uploaded" || receipt.archiveId !== manifest.backupId || receiptCompletedAtMs == null || completedAtMs == null || completedAtMs < receiptCompletedAtMs) throw new Error("backup completion evidence is invalid");
  const status = { schemaVersion: 1, kind: "self_hosted_backup_completed", chain: "solana-mainnet", storage: "self-hosted", backupId: manifest.backupId, completedAt, backupManifestSha256: digest(manifestBytes), archiveReceiptSha256: digest(receiptBytes) };
  await durableAtomicWrite(output, `${JSON.stringify(status, null, 2)}\n`);
  return status;
}

async function main() {
  if (process.argv.length !== 5) throw new Error("usage: backup-status.js /absolute/manifest.json /absolute/inbox-archive-receipt.json /absolute/backup-status.json");
  console.log(JSON.stringify(await createBackupStatus({ manifestFile: process.argv[2], archiveReceiptFile: process.argv[3], output: process.argv[4] })));
}
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invoked.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
