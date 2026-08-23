#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readBoundedDirectoryNames } from "./bounded-directory.js";
import { readBoundedFile } from "./bounded-json-file.js";
import { durableExclusiveWrite } from "./durable-file.js";
import { indexInbox } from "./indexer.js";
import { IndexStore } from "./store.js";

const REQUIRED_CAPABILITIES = ["canonicalBlocks", "canonicalTransactions", "canonicalInstructions", "currentDecoderRegistry", "completeDecoderOutput", "canonicalProgramEvents", "canonicalSwaps", "canonicalDerivedLedger", "canonicalAggregates", "canonicalRecoveryState", "replayableEvents", "mainnetIdentity", "finalizedProvenance"];
const canonicalPath = (value) => path.resolve(value).toLowerCase();
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

export function assessBackfillQualification(report, output) {
  const invariantNames = ["nonEmpty", "completeInbox", "currentDecoderRegistry", "completeDecoderOutput", "allFinalized", "canonicalCore"], invariantValues = invariantNames.map((name) => report?.invariants?.[name]), qualified = invariantValues.every((value) => value === true), observedAt = Date.parse(report?.observedAt ?? ""), canonicalTime = Number.isFinite(observedAt) && new Date(observedAt).toISOString() === report.observedAt, files = report?.ingestion?.files, completeFileCount = report?.invariants?.completeInbox === true ? files === report?.sourceFileCount : Number.isSafeInteger(files) && files >= 0 && files <= report?.sourceFileCount, canonical = Buffer.isBuffer(output) && report?.schemaVersion === 1 && report.kind === "isolated_backfill_qualification" && report.chain === "solana-mainnet" && report.qualified === qualified && report.promotionAuthorized === false && canonicalTime && Number.isSafeInteger(report.sourceFileCount) && report.sourceFileCount > 0 && /^[0-9a-f]{64}$/.test(report.sourceInventorySha256 ?? "") && /^[0-9a-f]{64}$/.test(report.outputSha256 ?? "") && digest(output) === report.outputSha256 && report.registry?.current === report.invariants.currentDecoderRegistry && report.decoderOutput?.complete === report.invariants.completeDecoderOutput && completeFileCount && Number.isSafeInteger(report.ingestion?.errors) && report.ingestion.errors >= 0 && Number.isSafeInteger(report.ingestion?.deferredFiles) && report.ingestion.deferredFiles >= 0;
  return { available: canonical, qualified: canonical && qualified, reason: !canonical ? "backfill_qualification_invalid" : qualified ? null : "backfill_not_qualified", promotionAuthorized: false };
}

async function requireAbsent(filename, label) {
  try { await fs.lstat(filename); throw new Error(`${label} already exists`); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}

export async function qualifyIsolatedBackfill({ inbox, outputFile, reportFile, activeDataFile = null, maxInboxEntries = 100_000, maxIngestionFileBytes = 67_108_864, maxStateFileBytes = 536_870_912, now = Date.now() }) {
  if (![inbox, outputFile, reportFile].every(path.isAbsolute) || !Number.isSafeInteger(now) || now < 0) throw new Error("backfill paths must be absolute and time must be valid");
  const identities = [inbox, outputFile, reportFile, activeDataFile].filter(Boolean).map(canonicalPath); if (new Set(identities).size !== identities.length) throw new Error("backfill source, output, report, and active index must be distinct");
  const source = await fs.lstat(inbox); if (!source.isDirectory() || source.isSymbolicLink()) throw new Error("backfill inbox must be a real directory");
  await requireAbsent(outputFile, "backfill output"); await requireAbsent(reportFile, "backfill report");
  const names = (await readBoundedDirectoryNames(inbox, { maximumEntries: maxInboxEntries })).filter((name) => /\.(?:json|ndjson)$/i.test(name)).sort();
  if (!names.length) throw new Error("backfill inbox has no block artifacts");
  const temporary = `${outputFile}.${process.pid}.${crypto.randomUUID()}.qualification.tmp`, store = new IndexStore(temporary, 2_000_000, 31_536_000, null, null, 200, maxStateFileBytes);
  try {
    const ingestion = await indexInbox({ inbox, maxInboxEntries, maxIngestionFileBytes, maxStateFileBytes, accountSnapshotFile: null, cpmmPoolSnapshotFile: null, pumpSwapPoolSnapshotFile: null, pumpBondingCurveSnapshotFile: null, clmmPoolSnapshotFile: null, orcaPoolSnapshotFile: null, meteoraDlmmPoolSnapshotFile: null, offchainMetadataSnapshotFile: null }, store, { now });
    const blockTimes = Object.values(store.state.blocks).map((block) => block.blockTime * 1_000).filter(Number.isSafeInteger), evaluationTime = blockTimes.length ? Math.max(...blockTimes) : now, capabilities = store.dataCapabilities(86_400_000, evaluationTime), registry = store.decoderRegistryQuality(), decoderOutput = store.decoderOutputCoverageQuality(), stats = store.stats(), processed = Object.entries(store.state.processedFiles).sort(([left], [right]) => left.localeCompare(right)), sourceInventorySha256 = digest(JSON.stringify(processed));
    const invariants = { nonEmpty: stats.blocks > 0, completeInbox: ingestion.errors.length === 0 && ingestion.deferredFiles === 0 && ingestion.files === names.length && processed.length === names.length, currentDecoderRegistry: registry.current, completeDecoderOutput: decoderOutput.complete, allFinalized: capabilities.finalizedBlocks === capabilities.totalBlocks && capabilities.totalBlocks > 0, canonicalCore: REQUIRED_CAPABILITIES.every((name) => capabilities[name] === true) };
    const qualified = Object.values(invariants).every(Boolean), output = await readBoundedFile(temporary, { maximumBytes: maxStateFileBytes }); if (!Buffer.isBuffer(output)) throw new Error("isolated backfill output is unavailable");
    await durableExclusiveWrite(outputFile, output);
    const report = { schemaVersion: 1, kind: "isolated_backfill_qualification", chain: "solana-mainnet", qualified, promotionAuthorized: false, observedAt: new Date(now).toISOString(), sourceFileCount: names.length, sourceInventorySha256, outputSha256: digest(output), stats, ingestion: { files: ingestion.files, blocks: ingestion.blocks, transactions: ingestion.transactions, transfers: ingestion.transfers, balanceChanges: ingestion.balanceChanges, swaps: ingestion.swaps, errors: ingestion.errors.length, deferredFiles: ingestion.deferredFiles }, registry, decoderOutput, invariants };
    await durableExclusiveWrite(reportFile, `${JSON.stringify(report, null, 2)}\n`); return report;
  } finally { await fs.rm(temporary, { force: true }).catch(() => {}); }
}

async function main() {
  if (process.argv.length !== 5) throw new Error("usage: backfill-qualification.js /absolute/inbox /absolute/output-index.json /absolute/report.json");
  const report = await qualifyIsolatedBackfill({ inbox: process.argv[2], outputFile: process.argv[3], reportFile: process.argv[4], activeDataFile: process.env.INDEXER_DATA_FILE ? path.resolve(process.env.INDEXER_DATA_FILE) : path.resolve("data/index.json") }); console.log(JSON.stringify(report)); if (!report.qualified) process.exitCode = 1;
}
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invoked.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
