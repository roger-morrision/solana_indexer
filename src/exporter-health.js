#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isInvokedFile } from "./invoked-file.js";
import { loadConfig } from "./config.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { readBoundedJsonFile } from "./bounded-json-file.js";

export function assessExporterStatus(status, staleAfterMs, now = Date.now(), maxLagSlots = 512) {
  if (status == null) return { available: false, healthy: false, reason: "status_unavailable", source: "unknown", cursor: null, localValidatorTip: null, lagSlots: null, maxLagSlots, ageMs: null, staleAfterMs, consecutiveFailures: 0 };
  const observed = parseCanonicalUtcTimestamp(status.observedAt), ageMs = observed == null ? null : now - observed, failures = Number.isSafeInteger(status.consecutiveFailures) && status.consecutiveFailures >= 0 ? status.consecutiveFailures : null, cursor = Number.isSafeInteger(status.cursor) && status.cursor >= 0 ? status.cursor : null, lagSlots = Number.isSafeInteger(status.lagSlots) && status.lagSlots >= 0 ? status.lagSlots : null, tip = Number.isSafeInteger(status.localValidatorTip) && status.localValidatorTip >= 0 ? status.localValidatorTip : null;
  const source = typeof status.source === "string" ? status.source : "", sourceValid = /^(?:local-agave-(?:rpc|pubsub)(?:-[1-4])?|external-rpc-(?:helius|alchemy|solana-public))$/.test(source), streamSource = source.startsWith("local-agave-pubsub"), skippedSlotCeiling = streamSource ? tip : cursor;
  const durableSkippedSlotsValid = Array.isArray(status.durableSkippedSlots) && status.durableSkippedSlots.length <= 10_000 && status.durableSkippedSlots.every((slot, index, rows) => Number.isSafeInteger(slot) && slot >= 0 && (index === 0 || rows[index - 1] < slot) && (skippedSlotCeiling == null || slot <= skippedSlotCeiling));
  const streamDisconnected = streamSource && status.connected !== true;
  const reason = !sourceValid ? "invalid_source" : streamDisconnected ? "stream_disconnected" : failures == null ? "invalid_failure_count" : failures > 0 ? "exporter_failure" : status.commitment !== "finalized" ? "not_finalized" : cursor == null ? "invalid_cursor" : lagSlots == null ? "invalid_lag" : !durableSkippedSlotsValid ? "invalid_skipped_slots" : tip != null && cursor > tip ? "cursor_ahead_of_tip" : tip != null && tip - cursor !== lagSlots ? "inconsistent_progress" : lagSlots > maxLagSlots ? "exporter_lagging" : ageMs == null ? "invalid_observed_at" : ageMs < 0 ? "observed_at_in_future" : ageMs > staleAfterMs ? "exporter_stale" : status.version !== 2 ? "invalid_status_version" : status.genesisHash !== MAINNET_GENESIS_HASH ? "wrong_network" : tip == null ? "invalid_validator_tip" : null;
  const healthy = reason == null, automationEligible = healthy && source !== "external-rpc-solana-public";
  return { available: true, healthy, automationEligible, reason, version: status.version === 2 ? 2 : null, source: sourceValid ? source : "unknown", genesisHash: status.genesisHash === MAINNET_GENESIS_HASH ? MAINNET_GENESIS_HASH : null, commitment: status.commitment === "finalized" ? "finalized" : null, observedAt: observed == null ? null : status.observedAt, cursor, localValidatorTip: tip, lagSlots, maxLagSlots, ageMs, staleAfterMs, consecutiveFailures: failures, durableSkippedSlots: durableSkippedSlotsValid ? [...status.durableSkippedSlots] : [] };
}

export async function exporterHealthCheck(filename, staleAfterMs, now = Date.now(), maxLagSlots = 512) {
  return assessExporterStatus(await readBoundedJsonFile(filename), staleAfterMs, now, maxLagSlots);
}

async function main() { const config = loadConfig(), result = await exporterHealthCheck(config.exporterStatusFile, config.staleAfterMs, Date.now(), config.maxExporterLagSlots); console.log(JSON.stringify(result)); if (!result.healthy) process.exitCode = 1; }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (isInvokedFile(invokedFile, fileURLToPath(import.meta.url))) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
