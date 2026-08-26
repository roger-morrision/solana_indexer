#!/usr/bin/env node
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isInvokedFile } from "./invoked-file.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { durableAtomicWrite } from "./durable-file.js";
import { decodeUtf8, readBoundedFile } from "./bounded-json-file.js";

const BACKUP_ID = /^[0-9]{8}T[0-9]{6}Z$/;
const SHA256 = /^[0-9a-f]{64}$/;
const ARTIFACTS = ["clickhouse-canonical_balance_changes.native", "clickhouse-canonical_candles.native", "clickhouse-canonical_dead_letters.native", "clickhouse-canonical_events.native", "clickhouse-canonical_instructions.native", "clickhouse-canonical_native_transfers.native", "clickhouse-canonical_swaps.native", "inbox-manifest.json", "indexer-state.tar", "postgres.dump", "redis.rdb"];
const digest = (content) => crypto.createHash("sha256").update(content).digest("hex");
const canonicalArtifact = (value) => Number.isSafeInteger(value?.bytes) && value.bytes >= 0 && SHA256.test(value.sha256 ?? "");
const evidenceDigest = (evidence) => digest(JSON.stringify(evidence));
const canonicalEvidence = (evidence) => evidence?.chain === "solana-mainnet" && evidence.storage === "self-hosted" && BACKUP_ID.test(evidence.backupId ?? "") && parseCanonicalUtcTimestamp(evidence.completedAt) != null && SHA256.test(evidence.backupManifestSha256 ?? "") && SHA256.test(evidence.archiveReceiptSha256 ?? "");
export const MAX_BACKUP_STATUS_EVIDENCE_BYTES = 16_777_216;

async function readBackupEvidence(filename, label) {
  const content = await readBoundedFile(filename, { maximumBytes: MAX_BACKUP_STATUS_EVIDENCE_BYTES, missing: null });
  if (content == null) throw new Error(`${label} is unavailable`);
  if (!Buffer.isBuffer(content)) throw new Error(`${label} is unsafe: ${content.evidenceReadError}`);
  return content;
}

export function assessBackupStatus(status, maximumAgeMs = 86_400_000, now = Date.now()) {
  if (!Number.isSafeInteger(maximumAgeMs) || maximumAgeMs < 1 || !Number.isFinite(now)) throw new Error("invalid backup status assessment parameters");
  const completedAt = parseCanonicalUtcTimestamp(status?.completedAt), canonical = status?.schemaVersion === 2 && status.kind === "self_hosted_backup_completed" && status.chain === "solana-mainnet" && status.storage === "self-hosted" && BACKUP_ID.test(status.backupId ?? "") && completedAt != null && canonicalEvidence(status.evidence) && status.evidence.chain === status.chain && status.evidence.storage === status.storage && status.evidence.backupId === status.backupId && status.evidence.completedAt === status.completedAt && SHA256.test(status.evidenceSha256 ?? "") && evidenceDigest(status.evidence) === status.evidenceSha256;
  if (!canonical) return { available: false, healthy: false, reason: status == null ? "backup_status_unavailable" : "backup_status_invalid", ageMs: null, maximumAgeMs };
  const ageMs = now - completedAt;
  if (ageMs < 0) return { available: true, healthy: false, reason: "backup_status_future", ageMs, maximumAgeMs, backupId: status.backupId, completedAt: status.completedAt };
  return { available: true, healthy: ageMs <= maximumAgeMs, reason: ageMs <= maximumAgeMs ? null : "backup_status_stale", ageMs, maximumAgeMs, backupId: status.backupId, completedAt: status.completedAt };
}

export async function createBackupStatus({ manifestFile, archiveReceiptFile, output, completedAt = new Date().toISOString() }) {
  const [manifestBytes, receiptBytes] = await Promise.all([readBackupEvidence(manifestFile, "backup manifest"), readBackupEvidence(archiveReceiptFile, "archive receipt")]), manifest = JSON.parse(decodeUtf8(manifestBytes)), receipt = JSON.parse(decodeUtf8(receiptBytes)), manifestCreatedAtMs = parseCanonicalUtcTimestamp(manifest.createdAt), completedAtMs = parseCanonicalUtcTimestamp(completedAt), receiptCompletedAtMs = parseCanonicalUtcTimestamp(receipt.completedAt), uploadCompletedAtMs = parseCanonicalUtcTimestamp(receipt.uploadCompletedAt), artifactNames = Object.keys(manifest.artifacts ?? {}).sort(), receiptFiles = Object.entries(receipt.files ?? {});
  if (manifest.schemaVersion !== 4 || manifest.chain !== "solana-mainnet" || manifest.scope !== "postgres-clickhouse-redis-indexer-state" || manifest.writersQuiesced !== true || !BACKUP_ID.test(manifest.backupId ?? "") || manifestCreatedAtMs == null || JSON.stringify(artifactNames) !== JSON.stringify(ARTIFACTS) || ARTIFACTS.some((name) => !canonicalArtifact(manifest.artifacts[name])) || receipt.schemaVersion !== 1 || receipt.storage !== "self-hosted" || receipt.status !== "uploaded" || receipt.archiveId !== manifest.backupId || !receipt.files || Array.isArray(receipt.files) || typeof receipt.files !== "object" || receiptFiles.some(([name, hash]) => !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(name) || !SHA256.test(hash)) || receipt.manifestSha256 !== manifest.artifacts["inbox-manifest.json"].sha256 || receiptCompletedAtMs == null || uploadCompletedAtMs !== receiptCompletedAtMs || completedAtMs == null || manifestCreatedAtMs > receiptCompletedAtMs || completedAtMs < receiptCompletedAtMs) throw new Error("backup completion evidence is invalid");
  const evidence = { chain: "solana-mainnet", storage: "self-hosted", backupId: manifest.backupId, completedAt, backupManifestSha256: digest(manifestBytes), archiveReceiptSha256: digest(receiptBytes) }, status = { schemaVersion: 2, kind: "self_hosted_backup_completed", chain: evidence.chain, storage: evidence.storage, backupId: evidence.backupId, completedAt: evidence.completedAt, evidence, evidenceSha256: evidenceDigest(evidence) };
  await durableAtomicWrite(output, `${JSON.stringify(status, null, 2)}\n`);
  return status;
}

async function main() {
  if (process.argv.length !== 5) throw new Error("usage: backup-status.js /absolute/manifest.json /absolute/inbox-archive-receipt.json /absolute/backup-status.json");
  console.log(JSON.stringify(await createBackupStatus({ manifestFile: process.argv[2], archiveReceiptFile: process.argv[3], output: process.argv[4] })));
}
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (isInvokedFile(invoked, fileURLToPath(import.meta.url))) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
