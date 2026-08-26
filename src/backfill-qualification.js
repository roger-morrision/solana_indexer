#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isInvokedFile } from "./invoked-file.js";
import { readBoundedDirectoryNames } from "./bounded-directory.js";
import { readBoundedFile } from "./bounded-json-file.js";
import { durableExclusiveWrite } from "./durable-file.js";
import { indexInbox } from "./indexer.js";
import { IndexStore } from "./store.js";

const REQUIRED_CAPABILITIES = ["canonicalBlocks", "canonicalTransactions", "canonicalInstructions", "currentDecoderRegistry", "completeDecoderOutput", "canonicalProgramEvents", "canonicalSwaps", "canonicalDerivedLedger", "canonicalAggregates", "canonicalRecoveryState", "replayableEvents", "mainnetIdentity", "finalizedProvenance"];
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])); return value; }
const evidenceDigest = (value) => digest(JSON.stringify(stable(value)));
function reportEvidence(report) { return { chain: report?.chain, qualified: report?.qualified, promotionAuthorized: report?.promotionAuthorized, observedAt: report?.observedAt, sourceFileCount: report?.sourceFileCount, sourceInventorySha256: report?.sourceInventorySha256, outputSha256: report?.outputSha256, stats: report?.stats, ingestion: report?.ingestion, registry: report?.registry, decoderOutput: report?.decoderOutput, invariants: report?.invariants }; }
function containsPath(parent, candidate) { const relative = path.relative(parent, candidate); return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)); }

async function canonicalTarget(filename, label) {
  if (!path.isAbsolute(filename ?? "")) throw new Error("backfill paths must be absolute and time must be valid");
  const existing = await fs.realpath(filename).catch(() => null); if (existing) return existing;
  const parent = await fs.realpath(path.dirname(filename)).catch(() => null), name = path.basename(filename);
  if (!parent || !name || name === "." || name === "..") throw new Error(`${label} parent must exist`);
  return path.join(parent, name);
}

export async function validateBackfillPaths({ inbox, outputFile, reportFile, activeDataFile = null }) {
  if (![inbox, outputFile, reportFile].every((value) => path.isAbsolute(value ?? "")) || activeDataFile != null && !path.isAbsolute(activeDataFile)) throw new Error("backfill paths must be absolute and time must be valid");
  const sourceStat = await fs.lstat(inbox).catch(() => null), source = await fs.realpath(inbox).catch(() => null);
  if (!sourceStat?.isDirectory() || sourceStat.isSymbolicLink() || !source) throw new Error("backfill inbox must be a real directory");
  const output = await canonicalTarget(outputFile, "backfill output"), report = await canonicalTarget(reportFile, "backfill report"), active = activeDataFile == null ? null : await canonicalTarget(activeDataFile, "active index");
  const identities = [source, output, report, active].filter(Boolean); if (new Set(identities.map((value) => process.platform === "win32" ? value.toLowerCase() : value)).size !== identities.length) throw new Error("backfill source, output, report, and active index must be distinct");
  if ([output, report, active].filter(Boolean).some((filename) => containsPath(source, filename))) throw new Error("backfill output, report, and active index must be outside the source inbox");
  return { inbox: source, outputFile: output, reportFile: report, activeDataFile: active };
}

export function assessBackfillQualification(report, output) {
  const invariantNames = ["nonEmpty", "completeInbox", "currentDecoderRegistry", "completeDecoderOutput", "allFinalized", "canonicalCore"], invariantValues = invariantNames.map((name) => report?.invariants?.[name]), qualified = invariantValues.every((value) => value === true), observedAt = Date.parse(report?.observedAt ?? ""), canonicalTime = Number.isFinite(observedAt) && new Date(observedAt).toISOString() === report.observedAt, files = report?.ingestion?.files, completeFileCount = report?.invariants?.completeInbox === true ? files === report?.sourceFileCount : Number.isSafeInteger(files) && files >= 0 && files <= report?.sourceFileCount, canonical = Buffer.isBuffer(output) && report?.schemaVersion === 2 && report.kind === "isolated_backfill_qualification" && /^[0-9a-f]{64}$/.test(report.evidenceSha256 ?? "") && evidenceDigest(reportEvidence(report)) === report.evidenceSha256 && report.chain === "solana-mainnet" && report.qualified === qualified && report.promotionAuthorized === false && canonicalTime && Number.isSafeInteger(report.sourceFileCount) && report.sourceFileCount > 0 && /^[0-9a-f]{64}$/.test(report.sourceInventorySha256 ?? "") && /^[0-9a-f]{64}$/.test(report.outputSha256 ?? "") && digest(output) === report.outputSha256 && report.registry?.current === report.invariants?.currentDecoderRegistry && report.decoderOutput?.complete === report.invariants?.completeDecoderOutput && completeFileCount && Number.isSafeInteger(report.ingestion?.errors) && report.ingestion.errors >= 0 && Number.isSafeInteger(report.ingestion?.deferredFiles) && report.ingestion.deferredFiles >= 0;
  return { available: canonical, qualified: canonical && qualified, reason: !canonical ? "backfill_qualification_invalid" : qualified ? null : "backfill_not_qualified", promotionAuthorized: false };
}

async function requireAbsent(filename, label) {
  try { await fs.lstat(filename); throw new Error(`${label} already exists`); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}

async function removeInstalledCandidate(filename, expectedSha256, maximumBytes) {
  const content = await readBoundedFile(filename, { maximumBytes });
  if (Buffer.isBuffer(content) && digest(content) === expectedSha256) await fs.unlink(filename).catch(() => {});
}

async function sourceInventoryUnchanged(inbox, names, processed, maximumEntries, maximumBytes) {
  const currentNames = (await readBoundedDirectoryNames(inbox, { maximumEntries })).filter((name) => /\.(?:json|ndjson)$/i.test(name)).sort((left, right) => left.localeCompare(right)), processedNames = processed.map(([name]) => name).sort((left, right) => left.localeCompare(right)), expectedNames = [...names].sort((left, right) => left.localeCompare(right));
  if (JSON.stringify(currentNames) !== JSON.stringify(expectedNames) || JSON.stringify(processedNames) !== JSON.stringify(expectedNames)) return false;
  for (const [name, checkpoint] of processed) { const content = await readBoundedFile(path.join(inbox, name), { maximumBytes }); if (!Buffer.isBuffer(content) || digest(content) !== checkpoint?.fingerprint) return false; }
  return true;
}

export async function qualifyIsolatedBackfill({ inbox, outputFile, reportFile, activeDataFile = null, maxInboxEntries = 100_000, maxIngestionFileBytes = 67_108_864, maxStateFileBytes = 536_870_912, now = Date.now(), exclusiveWrite = durableExclusiveWrite, beforeSourceRecheck = async () => {} }) {
  if (![inbox, outputFile, reportFile].every(path.isAbsolute) || !Number.isSafeInteger(now) || now < 0) throw new Error("backfill paths must be absolute and time must be valid");
  const paths = await validateBackfillPaths({ inbox, outputFile, reportFile, activeDataFile });
  await requireAbsent(paths.outputFile, "backfill output"); await requireAbsent(paths.reportFile, "backfill report");
  const names = (await readBoundedDirectoryNames(paths.inbox, { maximumEntries: maxInboxEntries })).filter((name) => /\.(?:json|ndjson)$/i.test(name)).sort();
  if (!names.length) throw new Error("backfill inbox has no block artifacts");
  const temporary = `${paths.outputFile}.${process.pid}.${crypto.randomUUID()}.qualification.tmp`, store = new IndexStore(temporary, 2_000_000, 31_536_000, null, null, 200, maxStateFileBytes);
  try {
    const ingestion = await indexInbox({ inbox: paths.inbox, maxInboxEntries, maxIngestionFileBytes, maxStateFileBytes, accountSnapshotFile: null, cpmmPoolSnapshotFile: null, ammV4PoolSnapshotFile: null, pumpSwapPoolSnapshotFile: null, pumpBondingCurveSnapshotFile: null, clmmPoolSnapshotFile: null, orcaPoolSnapshotFile: null, meteoraDlmmPoolSnapshotFile: null, offchainMetadataSnapshotFile: null }, store, { now });
    const blockTimes = Object.values(store.state.blocks).map((block) => block.blockTime * 1_000).filter(Number.isSafeInteger), evaluationTime = blockTimes.length ? Math.max(...blockTimes) : now, capabilities = store.dataCapabilities(86_400_000, evaluationTime), registry = store.decoderRegistryQuality(), decoderOutput = store.decoderOutputCoverageQuality(), stats = store.stats(), processed = Object.entries(store.state.processedFiles).sort(([left], [right]) => left.localeCompare(right)), sourceInventorySha256 = digest(JSON.stringify(processed)); await beforeSourceRecheck(); const stableSource = await sourceInventoryUnchanged(paths.inbox, names, processed, maxInboxEntries, maxIngestionFileBytes);
    const invariants = { nonEmpty: stats.blocks > 0, completeInbox: stableSource && ingestion.errors.length === 0 && ingestion.deferredFiles === 0 && ingestion.files === names.length && processed.length === names.length, currentDecoderRegistry: registry.current, completeDecoderOutput: decoderOutput.complete, allFinalized: capabilities.finalizedBlocks === capabilities.totalBlocks && capabilities.totalBlocks > 0, canonicalCore: REQUIRED_CAPABILITIES.every((name) => capabilities[name] === true) };
    const qualified = Object.values(invariants).every(Boolean), output = await readBoundedFile(temporary, { maximumBytes: maxStateFileBytes }); if (!Buffer.isBuffer(output)) throw new Error("isolated backfill output is unavailable");
    const outputSha256 = digest(output); await exclusiveWrite(paths.outputFile, output);
    const evidence = { chain: "solana-mainnet", qualified, promotionAuthorized: false, observedAt: new Date(now).toISOString(), sourceFileCount: names.length, sourceInventorySha256, outputSha256, stats, ingestion: { files: ingestion.files, blocks: ingestion.blocks, transactions: ingestion.transactions, transfers: ingestion.transfers, balanceChanges: ingestion.balanceChanges, swaps: ingestion.swaps, errors: ingestion.errors.length, deferredFiles: ingestion.deferredFiles }, registry, decoderOutput, invariants }, report = { schemaVersion: 2, kind: "isolated_backfill_qualification", ...evidence, evidenceSha256: evidenceDigest(evidence) };
    try { await exclusiveWrite(paths.reportFile, `${JSON.stringify(report, null, 2)}\n`); }
    catch (error) { await removeInstalledCandidate(paths.outputFile, outputSha256, maxStateFileBytes); throw error; }
    return report;
  } finally { await fs.rm(temporary, { force: true }).catch(() => {}); }
}

async function main() {
  if (process.argv.length !== 5) throw new Error("usage: backfill-qualification.js /absolute/inbox /absolute/output-index.json /absolute/report.json");
  const report = await qualifyIsolatedBackfill({ inbox: process.argv[2], outputFile: process.argv[3], reportFile: process.argv[4], activeDataFile: process.env.INDEXER_DATA_FILE ? path.resolve(process.env.INDEXER_DATA_FILE) : path.resolve("data/index.json") }); console.log(JSON.stringify(report)); if (!report.qualified) process.exitCode = 1;
}
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (isInvokedFile(invoked, fileURLToPath(import.meta.url))) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
