#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";

export function assessExporterStatus(status, staleAfterMs, now = Date.now(), maxLagSlots = 512) {
  if (status == null) return { available: false, healthy: false, reason: "status_unavailable", source: "unknown", cursor: null, localValidatorTip: null, lagSlots: null, maxLagSlots, ageMs: null, staleAfterMs, consecutiveFailures: 0 };
  const observed = Date.parse(status.observedAt ?? ""), ageMs = Number.isFinite(observed) ? now - observed : null, failures = Number.isSafeInteger(status.consecutiveFailures) && status.consecutiveFailures >= 0 ? status.consecutiveFailures : null, cursor = Number.isSafeInteger(status.cursor) && status.cursor >= 0 ? status.cursor : null, lagSlots = Number.isSafeInteger(status.lagSlots) && status.lagSlots >= 0 ? status.lagSlots : null, tip = Number.isSafeInteger(status.localValidatorTip) && status.localValidatorTip >= 0 ? status.localValidatorTip : null;
  const durableSkippedSlotsValid = Array.isArray(status.durableSkippedSlots) && status.durableSkippedSlots.length <= 10_000 && status.durableSkippedSlots.every((slot, index, rows) => Number.isSafeInteger(slot) && slot >= 0 && (index === 0 || rows[index - 1] < slot) && (cursor == null || slot <= cursor));
  const streamDisconnected = String(status.source ?? "").startsWith("local-agave-pubsub") && status.connected !== true;
  const reason = streamDisconnected ? "stream_disconnected" : failures == null ? "invalid_failure_count" : failures > 0 ? "exporter_failure" : status.commitment !== "finalized" ? "not_finalized" : cursor == null ? "invalid_cursor" : lagSlots == null ? "invalid_lag" : !durableSkippedSlotsValid ? "invalid_skipped_slots" : tip != null && cursor > tip ? "cursor_ahead_of_tip" : tip != null && tip - cursor !== lagSlots ? "inconsistent_progress" : lagSlots > maxLagSlots ? "exporter_lagging" : ageMs == null ? "invalid_observed_at" : ageMs < 0 ? "observed_at_in_future" : ageMs > staleAfterMs ? "exporter_stale" : status.version !== 2 ? "invalid_status_version" : status.genesisHash !== MAINNET_GENESIS_HASH ? "wrong_network" : null;
  return { available: true, healthy: reason == null, reason, source: status.source ?? "unknown", cursor, localValidatorTip: tip, lagSlots, maxLagSlots, ageMs, staleAfterMs, consecutiveFailures: failures };
}

export async function exporterHealthCheck(filename, staleAfterMs, now = Date.now(), maxLagSlots = 512) {
  let status; try { status = JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return assessExporterStatus(null, staleAfterMs, now, maxLagSlots); throw error; }
  return assessExporterStatus(status, staleAfterMs, now, maxLagSlots);
}

async function main() { const config = loadConfig(), result = await exporterHealthCheck(config.exporterStatusFile, config.staleAfterMs, Date.now(), config.maxExporterLagSlots); console.log(JSON.stringify(result)); if (!result.healthy) process.exitCode = 1; }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
