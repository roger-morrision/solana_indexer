import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parseBlock, parseInput } from "./parser.js";
import { redactDiagnostic } from "./diagnostic-redaction.js";
import { PROGRAM_REGISTRY_VERSION } from "./program-registry.js";
import { decodeUtf8, readBoundedFile } from "./bounded-json-file.js";
import { readBoundedDirectoryNames } from "./bounded-directory.js";

function fingerprint(content) { return crypto.createHash("sha256").update(content).digest("hex"); }
export const INGESTION_RETRY_IDENTITY = `parser-v2:registry-v${PROGRAM_REGISTRY_VERSION}:state-v21`;
const DEFAULT_MAX_INGESTION_FILE_BYTES = 67_108_864;

async function readIngestionFile(filename, maximumBytes) {
  const content = await readBoundedFile(filename, { maximumBytes, missing: null });
  if (content == null) { const error = new Error("ingestion file is unavailable"); error.code = "ENOENT"; throw error; }
  if (!Buffer.isBuffer(content)) throw new Error(`ingestion file is unsafe: ${content.evidenceReadError}`);
  return content;
}

export async function applySnapshotArtifacts(config, store, { now = Date.now(), retryIdentity = INGESTION_RETRY_IDENTITY } = {}) {
  store.assertWritable();
  const descriptors = [{ type: "account", filename: config.accountSnapshotFile, apply: (value) => store.applyAccountSnapshot(value) }, { type: "cpmm_pool", filename: config.cpmmPoolSnapshotFile, apply: (value) => store.applyCpmmPoolSnapshot(value) }, { type: "amm_v4_pool", filename: config.ammV4PoolSnapshotFile, apply: (value) => store.applyAmmV4PoolSnapshot(value) }, { type: "pump_swap_pool", filename: config.pumpSwapPoolSnapshotFile, apply: (value) => store.applyPumpSwapPoolSnapshot(value) }, { type: "pump_bonding_curve", filename: config.pumpBondingCurveSnapshotFile, apply: (value) => store.applyPumpBondingCurveSnapshot(value) }, { type: "clmm_pool", filename: config.clmmPoolSnapshotFile, apply: (value) => store.applyPoolSnapshot(value) }, { type: "orca_pool", filename: config.orcaPoolSnapshotFile, apply: (value) => store.applyOrcaPoolSnapshot(value) }, { type: "meteora_dlmm_pool", filename: config.meteoraDlmmPoolSnapshotFile, apply: (value) => store.applyMeteoraDlmmPoolSnapshot(value) }, { type: "offchain_metadata", filename: config.offchainMetadataSnapshotFile, apply: (value) => store.applyOffchainMetadataSnapshot(value) }], result = { applied: 0, skipped: 0, deferred: 0, resolvedDeadLetters: 0, errors: [] }; store.state.checkpoints.snapshotArtifacts ??= {};
  for (const descriptor of descriptors) {
    if (!descriptor.filename) continue; const deadLetterName = `snapshot:${descriptor.type}`; if (!store.deadLetterRetryStatus(deadLetterName, null, retryIdentity, now).eligible) { result.deferred++; continue; } let content; try { content = await readIngestionFile(descriptor.filename, config.maxIngestionFileBytes ?? DEFAULT_MAX_INGESTION_FILE_BYTES); } catch (error) { if (error.code === "ENOENT") { result.skipped++; continue; } const safeError = store.recordDeadLetter(deadLetterName, null, error, { failureStage: "snapshot_read", retryIdentity, now }); result.errors.push({ type: descriptor.type, error: safeError }); continue; } const hash = fingerprint(content); if (store.state.checkpoints.snapshotArtifacts[descriptor.type]?.fingerprint === hash) { result.resolvedDeadLetters += store.resolveDeadLetters(deadLetterName, hash, now); result.skipped++; continue; } if (!store.deadLetterRetryStatus(deadLetterName, hash, retryIdentity, now).eligible) { result.deferred++; continue; } const before = structuredClone(store.state);
    try { const value = JSON.parse(decodeUtf8(content)); descriptor.apply(value); store.state.checkpoints.snapshotArtifacts[descriptor.type] = { fingerprint: hash, observedAt: value.observedAt, sourceSlot: value.slot ?? value.balanceSlot ?? value.stateSlot, appliedAt: new Date(now).toISOString() }; result.resolvedDeadLetters += store.resolveDeadLetters(deadLetterName, hash, now); result.applied++; }
    catch (error) { store.state = before; const safeError = store.recordDeadLetter(deadLetterName, hash, error, { failureStage: "snapshot_apply", retryIdentity, now }); result.errors.push({ type: descriptor.type, error: safeError }); }
  }
  return result;
}

export async function indexInbox(config, store, { now = Date.now(), retryIdentity = INGESTION_RETRY_IDENTITY } = {}) {
  await store.load(); store.assertWritable(); await fs.mkdir(config.inbox, { recursive: true });
  const names = (await readBoundedDirectoryNames(config.inbox, { maximumEntries: config.maxInboxEntries ?? 100_000 })).filter((name) => /\.(?:json|ndjson)$/i.test(name)).sort((a, b) => { const left = Number(a.match(/^(\d+)/)?.[1]), right = Number(b.match(/^(\d+)/)?.[1]); return Number.isSafeInteger(left) && Number.isSafeInteger(right) && left !== right ? left - right : a.localeCompare(b); });
  const result = { files: 0, blocks: 0, transactions: 0, transfers: 0, balanceChanges: 0, swaps: 0, snapshots: 0, skippedFiles: 0, deferredFiles: 0, deferredSnapshots: 0, resolvedDeadLetters: 0, errors: [] };
  for (const name of names) {
    const filename = path.join(config.inbox, name); let hash = null, failureStage = "inbox_read";
    try {
      if (!store.deadLetterRetryStatus(name, null, retryIdentity, now).eligible) { result.deferredFiles++; continue; }
      const content = await readIngestionFile(filename, config.maxIngestionFileBytes ?? DEFAULT_MAX_INGESTION_FILE_BYTES);
      hash = fingerprint(content);
      if (store.hasFile(name, hash)) { result.resolvedDeadLetters += store.resolveDeadLetters(name, hash, now); result.skippedFiles++; continue; }
      if (!store.deadLetterRetryStatus(name, hash, retryIdentity, now).eligible) { result.deferredFiles++; continue; }
      failureStage = "input_parse";
      const inputs = parseInput(decodeUtf8(content), name);
      failureStage = "block_parse";
      const blocks = inputs.map(parseBlock);
      const stateBeforeBatch = blocks.length > 1 ? structuredClone(store.state) : null;
      const pendingEventCount = store.pendingEvents.length;
      const fileResult = { blocks: 0, transactions: 0, transfers: 0, balanceChanges: 0, swaps: 0 };
      try { failureStage = "state_apply";
        for (const block of blocks) {
          const applied = store.apply(block);
          if (applied.inserted) { fileResult.blocks++; fileResult.transactions += block.transactions.length; fileResult.transfers += block.transfers.length; fileResult.balanceChanges += block.balanceChanges.length; fileResult.swaps += block.swaps.length; }
        }
      } catch (error) {
        if (stateBeforeBatch) store.state = stateBeforeBatch;
        store.pendingEvents.splice(pendingEventCount);
        throw error;
      }
      for (const key of Object.keys(fileResult)) result[key] += fileResult[key];
      result.resolvedDeadLetters += store.markFile(name, hash, now); result.files++;
    } catch (error) { const safeError = store.recordDeadLetter(name, hash, error, { failureStage, retryIdentity, now }); result.errors.push({ file: name, error: safeError }); }
  }
  const snapshots = await applySnapshotArtifacts(config, store, { now, retryIdentity }); result.snapshots = snapshots.applied; result.deferredSnapshots = snapshots.deferred; result.resolvedDeadLetters += snapshots.resolvedDeadLetters; result.errors.push(...snapshots.errors.map((row) => ({ file: `snapshot:${row.type}`, error: row.error })));
  if (result.files || result.blocks || result.snapshots || result.resolvedDeadLetters || result.errors.length) await store.save();
  return result;
}

export function watchInbox(config, store, onCycle = () => {}) {
  let stopped = false, running = false;
  let timer; const cycle = async () => { if (running || stopped) return; running = true; try { onCycle(await indexInbox(config, store)); } catch (error) { const safeError = redactDiagnostic(error, "index cycle failure"); if (error.code === "INDEX_STATE_QUARANTINED") { stopped = true; if (timer) clearInterval(timer); onCycle({ suspended: true, reason: error.reason, errors: [{ code: error.code, error: safeError }] }); } else onCycle({ errors: [{ error: safeError }] }); } finally { running = false; } };
  void cycle(); timer = setInterval(cycle, config.pollMs);
  return () => { stopped = true; clearInterval(timer); };
}
