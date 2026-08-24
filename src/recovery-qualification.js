#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { preflightBackup } from "./backup-preflight.js";
import { loadConfig } from "./config.js";
import { assessExporterStatus } from "./exporter-health.js";
import { IndexStore } from "./store.js";
import { assessWarehouseCheckpoint } from "./warehouse-sync.js";
import { durableExclusiveWrite } from "./durable-file.js";
import { decodeUtf8, readBoundedFile, readBoundedJsonFile } from "./bounded-json-file.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";

const SHA256 = /^[0-9a-f]{64}$/;
const BACKUP_ID = /^[0-9]{8}T[0-9]{6}Z$/;
const BACKUP_INVARIANTS = ["completeInventory", "checksums", "manifestEvidence", "writersQuiesced", "inboxIdentity", "inboxArchiveComplete", "rpo", "safeTar", "canonicalStatePresent", "mainnetIdentity"];
const RECOVERY_INVARIANTS = ["mainnetIdentity", "backupIntegrity", "canonicalIndexHealthy", "exactWarehouseConvergence", "finalizedExporterHealthy", "rto"];
const RECONCILIATION_COUNTS = ["events", "instructions", "swaps", "balanceChanges", "nativeTransfers", "deadLetters", "tokens", "candidates", "pools"];
const EXPORTER_SOURCE = /^(?:local-agave-(?:rpc|pubsub)(?:-[1-4])?|external-rpc-(?:helius|alchemy))$/;
const RECOVERY_MARKER = "terminal-dex-isolated-recovery-v1";
function exactTimestamp(value, label) { const parsed = Date.parse(value ?? ""); if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) throw new Error(`invalid recovery ${label}`); return parsed; }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])); return value; }
function evidenceDigest(evidence) { return crypto.createHash("sha256").update(JSON.stringify(stable(evidence))).digest("hex"); }
function canonicalRecoveryEvidence(evidence, backupId) {
  const reconciliation = evidence?.warehouse, exporter = evidence?.exporter;
  return evidence?.chain === "solana-mainnet" && evidence.backupId === backupId && BACKUP_ID.test(evidence.backupId ?? "") && SHA256.test(evidence.backupManifestSha256 ?? "") && Number.isSafeInteger(evidence.eventSequence) && evidence.eventSequence >= 0 && Number.isSafeInteger(evidence.index?.tip) && evidence.index.tip >= 0 && Number.isSafeInteger(evidence.index?.ageMs) && evidence.index.ageMs >= 0 && reconciliation?.schemaVersion === 9 && reconciliation.verified === true && reconciliation.sequence === evidence.eventSequence && RECONCILIATION_COUNTS.every((key) => Number.isSafeInteger(reconciliation[key]) && reconciliation[key] >= 0) && reconciliation.events === evidence.eventSequence && SHA256.test(reconciliation.eventContentChain ?? "") && SHA256.test(reconciliation.clickhouseIdentityDigest ?? "") && SHA256.test(reconciliation.clickhouseContentDigest ?? "") && /^[0-9a-f]{32}$/.test(reconciliation.postgresIdentityDigest ?? "") && /^[0-9a-f]{32}$/.test(reconciliation.postgresContentDigest ?? "") && /^[0-9a-f]{40}$/.test(reconciliation.redisIdentityDigest ?? "") && /^[0-9a-f]{40}$/.test(reconciliation.redisTokenContentDigest ?? "") && /^[0-9a-f]{40}$/.test(reconciliation.redisPoolContentDigest ?? "") && /^[0-9a-f]{40}$/.test(reconciliation.redisStatsContentDigest ?? "") && EXPORTER_SOURCE.test(exporter?.source ?? "") && parseCanonicalUtcTimestamp(exporter?.observedAt) != null && Number.isSafeInteger(exporter.cursor) && exporter.cursor >= 0 && Number.isSafeInteger(exporter.localValidatorTip) && exporter.localValidatorTip >= exporter.cursor && Number.isSafeInteger(exporter.lagSlots) && exporter.lagSlots === exporter.localValidatorTip - exporter.cursor;
}

export function compileRecoveryQualification({ backup, indexHealth, warehouse, exporter, eventSequence, startedAt, completedAt, maximumRtoMs = 4 * 60 * 60 * 1_000 }) {
  const startedAtMs = exactTimestamp(startedAt, "start time"), completedAtMs = exactTimestamp(completedAt, "completion time"), durationMs = completedAtMs - startedAtMs;
  if (!Number.isSafeInteger(maximumRtoMs) || maximumRtoMs < 1 || durationMs < 0 || durationMs > maximumRtoMs) throw new Error("recovery exceeds configured RTO");
  if (backup?.schemaVersion !== 4 || backup.kind !== "backup_restore_preflight" || backup.chain !== "solana-mainnet" || !/^[0-9]{8}T[0-9]{6}Z$/.test(backup.backupId ?? "") || !SHA256.test(backup.backupManifestSha256 ?? "") || backup.restoreAuthorized !== false || !backup.invariants || BACKUP_INVARIANTS.some((key) => backup.invariants[key] !== true)) throw new Error("backup preflight evidence is incomplete or wrong-chain");
  if (indexHealth?.available !== true || indexHealth.healthy !== true || indexHealth.reason != null || !Number.isSafeInteger(indexHealth.tip) || indexHealth.tip < 0 || !Number.isSafeInteger(indexHealth.ageMs) || indexHealth.ageMs < 0) throw new Error("restored canonical index is unhealthy");
  if (!Number.isSafeInteger(eventSequence) || eventSequence < 0 || warehouse?.available !== true || warehouse.healthy !== true || warehouse.chain !== "solana-mainnet" || warehouse.genesisHash !== "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d" || warehouse.sequence !== eventSequence || warehouse.eventSequence !== eventSequence || warehouse.lagEvents !== 0 || warehouse.reconciliation?.schemaVersion !== 9 || warehouse.reconciliation.verified !== true || warehouse.reconciliation.sequence !== eventSequence) throw new Error("restored warehouse is not exactly reconciled on mainnet");
  const exporterObservedAtMs = parseCanonicalUtcTimestamp(exporter?.observedAt);
  if (exporter?.available !== true || exporter.healthy !== true || exporter.reason != null || exporter.cursor == null || exporter.localValidatorTip == null || exporter.cursor > exporter.localValidatorTip || exporterObservedAtMs == null || exporterObservedAtMs < startedAtMs || exporterObservedAtMs > completedAtMs) throw new Error("finalized exporter recovery evidence is unhealthy or outside the recovery window");
  const evidence = { chain: backup.chain, backupId: backup.backupId, backupManifestSha256: backup.backupManifestSha256, eventSequence, index: { tip: indexHealth.tip, ageMs: indexHealth.ageMs }, warehouse: warehouse.reconciliation, exporter: { source: exporter.source, observedAt: exporter.observedAt, cursor: exporter.cursor, localValidatorTip: exporter.localValidatorTip, lagSlots: exporter.lagSlots } };
  if (!canonicalRecoveryEvidence(evidence, backup.backupId)) throw new Error("recovery qualification evidence is noncanonical");
  return { schemaVersion: 5, kind: "isolated_recovery_qualification", chain: backup.chain, qualified: true, backupId: backup.backupId, startedAt, completedAt, durationMs, maximumRtoMs, evidence, evidenceSha256: evidenceDigest(evidence), invariants: { mainnetIdentity: true, backupIntegrity: true, canonicalIndexHealthy: true, exactWarehouseConvergence: true, finalizedExporterHealthy: true, rto: true }, consumersMayBeEnabled: true };
}

export function assessRecoveryQualification(report, maximumAgeMs = 90 * 86_400_000, now = Date.now()) {
  if (!Number.isSafeInteger(maximumAgeMs) || maximumAgeMs < 1 || !Number.isFinite(now)) throw new Error("invalid recovery qualification assessment parameters");
  let startedAtMs = null, completedAtMs = null;
  try { startedAtMs = exactTimestamp(report?.startedAt, "start time"); completedAtMs = exactTimestamp(report?.completedAt, "completion time"); } catch { /* invalid report handled below */ }
  const exporterObservedAtMs = parseCanonicalUtcTimestamp(report?.evidence?.exporter?.observedAt), canonical = report?.schemaVersion === 5 && report.kind === "isolated_recovery_qualification" && report.chain === "solana-mainnet" && report.qualified === true && report.consumersMayBeEnabled === true && BACKUP_ID.test(report.backupId ?? "") && SHA256.test(report.evidenceSha256 ?? "") && canonicalRecoveryEvidence(report.evidence, report.backupId) && evidenceDigest(report.evidence) === report.evidenceSha256 && Number.isSafeInteger(report.durationMs) && report.durationMs >= 0 && Number.isSafeInteger(report.maximumRtoMs) && report.maximumRtoMs > 0 && report.durationMs <= report.maximumRtoMs && startedAtMs != null && completedAtMs != null && completedAtMs - startedAtMs === report.durationMs && exporterObservedAtMs != null && exporterObservedAtMs >= startedAtMs && exporterObservedAtMs <= completedAtMs && report.invariants && RECOVERY_INVARIANTS.every((key) => report.invariants[key] === true);
  if (!canonical) return { available: false, healthy: false, reason: report == null ? "recovery_qualification_unavailable" : "recovery_qualification_invalid", ageMs: null, maximumAgeMs };
  const ageMs = now - completedAtMs, identity = { backupId: report.backupId, completedAt: report.completedAt, durationMs: report.durationMs };
  if (ageMs < 0) return { available: true, healthy: false, reason: "recovery_qualification_future", ageMs, maximumAgeMs, ...identity };
  return { available: true, healthy: ageMs <= maximumAgeMs, reason: ageMs <= maximumAgeMs ? null : "recovery_qualification_stale", ageMs, maximumAgeMs, ...identity };
}

export async function writeRecoveryReport(filename, value) { await durableExclusiveWrite(filename, `${JSON.stringify(value, null, 2)}\n`); }

function containsPath(parent, candidate) { const relative = path.relative(parent, candidate); return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)); }

export async function validateRecoveryStatePaths(config, recoveryStateRoot, recoveryTargetMarker, backupDirectory, repository = process.cwd(), reportFile = null) {
  if (!path.isAbsolute(recoveryStateRoot ?? "") || !path.isAbsolute(recoveryTargetMarker ?? "") || !path.isAbsolute(backupDirectory ?? "")) throw new Error("recovery state, marker, and backup paths must be absolute");
  const [rootStat, root, backup, repo] = await Promise.all([fs.lstat(recoveryStateRoot).catch(() => null), fs.realpath(recoveryStateRoot).catch(() => null), fs.realpath(backupDirectory).catch(() => null), fs.realpath(repository).catch(() => null)]);
  if (!rootStat || !root || !backup || !repo) throw new Error("recovery state root, backup, and repository must exist");
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink() || root === path.parse(root).root || containsPath(repo, root) || containsPath(root, repo) || containsPath(backup, root) || containsPath(root, backup)) throw new Error("recovery state root is not isolated");
  const expectedMarker = path.join(root, ".terminal-dex-isolated-recovery"), marker = await fs.realpath(recoveryTargetMarker).catch(() => null), markerBytes = marker === expectedMarker ? await readBoundedFile(marker, { maximumBytes: 64 }) : null;
  if (!Buffer.isBuffer(markerBytes) || !new RegExp(`^${RECOVERY_MARKER}(?:\\r?\\n)?$`).test(decodeUtf8(markerBytes))) throw new Error("recovery state marker is invalid");
  const expected = { dataFile: path.join(root, "data", "index.json"), exporterStatusFile: path.join(root, "data", "exporter-status.json"), warehouseCheckpointFile: path.join(root, "data", "warehouse-checkpoint.json") };
  for (const [key, filename] of Object.entries(expected)) { const actual = await fs.realpath(config?.[key] ?? "").catch(() => null); if (actual !== filename) throw new Error(`recovery ${key} is outside the isolated state root`); }
  let report = null;
  if (reportFile != null) {
    if (!path.isAbsolute(reportFile)) throw new Error("recovery report path must be absolute");
    const reportParent = await fs.realpath(path.dirname(reportFile)).catch(() => null);
    if (!reportParent) throw new Error("recovery report parent must exist");
    report = path.join(reportParent, path.basename(reportFile));
    if (containsPath(root, report) || containsPath(backup, report)) throw new Error("recovery report must be outside recovery state and backup evidence");
  }
  return { stateRoot: root, backupDirectory: backup, marker: expectedMarker, report, ...expected };
}

export async function qualifyRecoveryEnvironment(backupDirectory, startedAt, reportFile, { now = Date.now(), config = loadConfig(), recoveryStateRoot = process.env.RECOVERY_STATE_ROOT, recoveryTargetMarker = process.env.RECOVERY_TARGET_MARKER } = {}) {
  const recoveryPaths = await validateRecoveryStatePaths(config, recoveryStateRoot, recoveryTargetMarker, backupDirectory, process.cwd(), reportFile);
  const recoveredConfig = { ...config, dataFile: recoveryPaths.dataFile, exporterStatusFile: recoveryPaths.exporterStatusFile, warehouseCheckpointFile: recoveryPaths.warehouseCheckpointFile };
  const backup = await preflightBackup(recoveryPaths.backupDirectory, { now }), store = new IndexStore(recoveredConfig.dataFile, recoveredConfig.maxTransactions, recoveredConfig.retentionSeconds, null, null, 200, recoveredConfig.maxStateFileBytes); await store.load();
  store.assertWritable();
  const eventSequence = store.state.eventSequence, indexHealth = store.health(recoveredConfig.staleAfterMs, now), oldestSequence = store.state.events[0]?.sequence ?? eventSequence + 1, checkpoint = await readBoundedJsonFile(recoveredConfig.warehouseCheckpointFile), warehouse = assessWarehouseCheckpoint(checkpoint, eventSequence, oldestSequence, recoveredConfig.warehouseStaleAfterMs, 0, now), exporterStatus = await readBoundedJsonFile(recoveredConfig.exporterStatusFile), exporter = { ...assessExporterStatus(exporterStatus, recoveredConfig.staleAfterMs, now, recoveredConfig.maxExporterLagSlots), observedAt: exporterStatus?.observedAt }, completedAt = new Date(now).toISOString();
  const result = compileRecoveryQualification({ backup, indexHealth, warehouse, exporter, eventSequence, startedAt, completedAt }); await writeRecoveryReport(recoveryPaths.report, result); return result;
}

async function main() { if (process.argv.length !== 5) throw new Error("usage: recovery-qualification.js /absolute/backup-directory STARTED_AT_ISO /absolute/report.json"); console.log(JSON.stringify(await qualifyRecoveryEnvironment(process.argv[2], process.argv[3], process.argv[4]))); }
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invoked.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
