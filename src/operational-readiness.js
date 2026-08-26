#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assessBackupStatus } from "./backup-status.js";
import { readBoundedJsonFile } from "./bounded-json-file.js";
import { loadConfig } from "./config.js";
import { assessExporterStatus } from "./exporter-health.js";
import { validateProviderUrl } from "./external-rpc.js";
import { validateLocalRpcUrl } from "./local-validator-exporter.js";
import { validateLocalWsUrl } from "./local-validator-stream.js";
import { assessRecoveryQualification } from "./recovery-qualification.js";
import { IndexStore } from "./store.js";
import { applyWarehouseFailureStatus, assessWarehouseCheckpoint } from "./warehouse-sync.js";

const CHECK_NAMES = ["provider", "index_structure", "index_chain", "index_events", "index_transactions", "index_instructions", "decoder_registry", "decoder_output", "indexed_swaps", "program_events", "derived_ledger", "aggregate_projections", "snapshot_projections", "metadata_projections", "recovery_state", "index_freshness", "exporter", "warehouse", "backup", "recovery"];
const INDEX_REASONS = new Set(["no_indexed_blocks", "indexed_state_file_invalid", "indexed_state_json_invalid", "indexed_state_structure_invalid", "indexed_execution_qualification_invalid", "indexed_block_identity_invalid", "indexed_block_time_invalid", "latest_block_has_no_timestamp", "indexed_parent_hash_mismatch", "indexed_block_mainnet_identity_missing_or_invalid", "indexed_event_log_invalid", "indexed_event_evidence_invalid", "indexed_transaction_evidence_invalid", "indexed_instruction_evidence_invalid", "decoder_changed", "indexed_decoder_output_incomplete", "indexed_swap_evidence_invalid", "indexed_program_event_evidence_invalid", "indexed_derived_ledger_evidence_invalid", "indexed_aggregate_projection_invalid", "indexed_snapshot_projection_invalid", "indexed_metadata_projection_invalid", "indexed_recovery_evidence_invalid", "dead_letter_capacity_exceeded", "latest_block_time_is_in_future", "latest_block_is_stale"]);
const PUBLIC_REASONS = {
  provider: new Set(["provider_configuration_unavailable", "provider_configuration_incomplete", "provider_configuration_invalid"]),
  ...Object.fromEntries(CHECK_NAMES.slice(1, 16).map((name) => [name, INDEX_REASONS])),
  index_freshness: INDEX_REASONS,
  exporter: new Set(["status_unavailable", "invalid_source", "stream_disconnected", "invalid_failure_count", "exporter_failure", "not_finalized", "invalid_cursor", "invalid_lag", "invalid_skipped_slots", "cursor_ahead_of_tip", "inconsistent_progress", "exporter_lagging", "invalid_observed_at", "observed_at_in_future", "exporter_stale", "invalid_status_version", "wrong_network"]),
  warehouse: new Set(["checkpoint_unavailable", "checkpoint_invalid", "checkpoint_network_mismatch", "sink_evidence_unavailable", "sink_sequence_mismatch", "content_reconciliation_unavailable", "checkpoint_ahead_of_index", "checkpoint_clock_skew", "checkpoint_behind_replay_history", "warehouse_lag_exceeded", "warehouse_checkpoint_stale", "warehouse_status_invalid", "warehouse_sync_failed"]),
  backup: new Set(["backup_status_unavailable", "backup_status_invalid", "backup_status_future", "backup_status_stale"]),
  recovery: new Set(["recovery_qualification_unavailable", "recovery_qualification_invalid", "recovery_qualification_future", "recovery_qualification_stale"]),
};

export function assessProviderConfiguration(env = process.env) {
  const localValue = env.LOCAL_VALIDATOR_RPCS || env.LOCAL_VALIDATOR_RPC, localWsValue = env.LOCAL_VALIDATOR_WSS || env.LOCAL_VALIDATOR_WS, external = Boolean(env.HELIUS_RPC_URL && env.ALCHEMY_RPC_URL), partialExternal = Boolean(env.HELIUS_RPC_URL || env.ALCHEMY_RPC_URL);
  if (localValue || localWsValue) { try { const endpoints = String(localValue ?? "").split(",").map((value) => value.trim()).filter(Boolean), wsEndpoints = String(localWsValue ?? "").split(",").map((value) => value.trim()).filter(Boolean); if (!endpoints.length || endpoints.length > 4 || endpoints.length !== wsEndpoints.length) throw new Error("invalid local provider topology"); const canonicalRpc = endpoints.map(validateLocalRpcUrl), canonicalWs = wsEndpoints.map(validateLocalWsUrl); if (new Set(canonicalRpc).size !== canonicalRpc.length || new Set(canonicalWs).size !== canonicalWs.length) throw new Error("duplicate local provider identity"); return { available: true, healthy: true, reason: null, mode: "local_validator" }; } catch { return { available: true, healthy: false, reason: "provider_configuration_invalid", mode: null }; } }
  if (external) { try { validateProviderUrl("helius", env.HELIUS_RPC_URL); validateProviderUrl("alchemy", env.ALCHEMY_RPC_URL); return { available: true, healthy: true, reason: null, mode: "external_failover" }; } catch { return { available: true, healthy: false, reason: "provider_configuration_invalid", mode: null }; } }
  return { available: partialExternal, healthy: false, reason: partialExternal ? "provider_configuration_incomplete" : "provider_configuration_unavailable", mode: null };
}

function publicCheck(name, value) { const healthy = value?.healthy === true, reason = PUBLIC_REASONS[name].has(value?.reason) ? value.reason : `${name}_evidence_invalid`; return { name, healthy, reason: healthy ? null : reason }; }

export function compileOperationalReadiness(values) {
  const checks = CHECK_NAMES.map((name) => publicCheck(name, values[name])), blockers = checks.filter((check) => !check.healthy).map((check) => ({ check: check.name, reason: check.reason }));
  return { schemaVersion: 2, kind: "upstream_operational_readiness", ready: blockers.length === 0, blockerCount: blockers.length, checks, blockers, productionMutationAuthorized: false };
}

function quality(value, property, fallback) { const healthy = value?.[property] === true; return { healthy, reason: healthy ? null : value?.reason ?? fallback }; }

export async function operationalReadinessCheck({ config = loadConfig(), env = process.env, now = Date.now() } = {}) {
  const store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds, null, null, 200, config.maxStateFileBytes); await store.load();
  const [exporterEvidence, warehouseCheckpoint, warehouseFailure, backupEvidence, recoveryEvidence] = await Promise.all([config.exporterStatusFile, config.warehouseCheckpointFile, config.warehouseStatusFile, config.backupStatusFile, config.recoveryReportFile].map((filename) => readBoundedJsonFile(filename)));
  const eventSequence = Number.isSafeInteger(store.state?.eventSequence) ? store.state.eventSequence : 0, events = Array.isArray(store.state?.events) ? store.state.events : [], indexHealth = store.health(config.staleAfterMs, now), structure = store.structureQuality(), chain = store.chainQuality(), eventQuality = store.eventQuality(), transactions = store.indexedTransactions(), instructions = store.instructionQuality(), decoderRegistry = store.decoderRegistryQuality(), decoderOutput = store.decoderOutputCoverageQuality(), swaps = store.indexedSwaps(), programEvents = store.programEventQuality(), derivedLedger = store.derivedLedgerQuality(), aggregates = store.aggregateQuality(), snapshots = store.snapshotQuality(), metadata = store.metadataQuality(), recoveryState = store.recoveryQuality();
  const warehouse = applyWarehouseFailureStatus(assessWarehouseCheckpoint(warehouseCheckpoint, eventSequence, events[0]?.sequence ?? eventSequence + 1, config.warehouseStaleAfterMs, config.maxWarehouseLagEvents, now), warehouseFailure);
  return compileOperationalReadiness({ provider: assessProviderConfiguration(env), index_structure: quality(structure, "canonical", "indexed_state_structure_invalid"), index_chain: quality(chain, "canonical", "indexed_parent_hash_mismatch"), index_events: quality(eventQuality, "canonical", "indexed_event_evidence_invalid"), index_transactions: quality(transactions, "available", "indexed_transaction_evidence_invalid"), index_instructions: quality(instructions, "canonical", "indexed_instruction_evidence_invalid"), decoder_registry: quality(decoderRegistry, "current", "decoder_changed"), decoder_output: quality(decoderOutput, "complete", "indexed_decoder_output_incomplete"), indexed_swaps: quality(swaps, "available", "indexed_swap_evidence_invalid"), program_events: quality(programEvents, "canonical", "indexed_program_event_evidence_invalid"), derived_ledger: quality(derivedLedger, "canonical", "indexed_derived_ledger_evidence_invalid"), aggregate_projections: quality(aggregates, "canonical", "indexed_aggregate_projection_invalid"), snapshot_projections: quality(snapshots, "canonical", "indexed_snapshot_projection_invalid"), metadata_projections: quality(metadata, "canonical", "indexed_metadata_projection_invalid"), recovery_state: { healthy: recoveryState.canonical && !recoveryState.capacityExceeded, reason: recoveryState.reason }, index_freshness: { healthy: indexHealth.healthy, reason: indexHealth.reason }, exporter: assessExporterStatus(exporterEvidence, config.staleAfterMs, now, config.maxExporterLagSlots), warehouse, backup: assessBackupStatus(backupEvidence, config.backupMaximumAgeMs, now), recovery: assessRecoveryQualification(recoveryEvidence, config.recoveryMaximumAgeMs, now) });
}

async function main() { const result = await operationalReadinessCheck(); console.log(JSON.stringify(result)); if (!result.ready) process.exitCode = 1; }
export function isInvokedFile(invoked, moduleFile = fileURLToPath(import.meta.url), realpath = fs.realpathSync.native) { if (!invoked) return false; try { return realpath(path.resolve(invoked)).toLowerCase() === realpath(moduleFile).toLowerCase(); } catch { return path.resolve(invoked).toLowerCase() === path.resolve(moduleFile).toLowerCase(); } }
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (isInvokedFile(invoked)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
