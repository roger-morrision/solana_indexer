#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { assessBackupStatus } from "./backup-status.js";
import { readBoundedJsonFile } from "./bounded-json-file.js";
import { loadConfig } from "./config.js";
import { assessExporterStatus } from "./exporter-health.js";
import { validateProviderUrl } from "./external-rpc.js";
import { validateLocalRpcUrl } from "./local-validator-exporter.js";
import { assessRecoveryQualification } from "./recovery-qualification.js";
import { IndexStore } from "./store.js";
import { applyWarehouseFailureStatus, assessWarehouseCheckpoint } from "./warehouse-sync.js";

const CHECK_NAMES = ["provider", "index", "exporter", "warehouse", "backup", "recovery"];

export function assessProviderConfiguration(env = process.env) {
  const localValue = env.LOCAL_VALIDATOR_RPCS || env.LOCAL_VALIDATOR_RPC, external = Boolean(env.HELIUS_RPC_URL && env.ALCHEMY_RPC_URL), partialExternal = Boolean(env.HELIUS_RPC_URL || env.ALCHEMY_RPC_URL);
  if (localValue) { try { const endpoints = localValue.split(",").map((value) => value.trim()).filter(Boolean); if (!endpoints.length || endpoints.length > 4) throw new Error("invalid local provider count"); endpoints.forEach(validateLocalRpcUrl); return { available: true, healthy: true, reason: null, mode: "local_validator" }; } catch { return { available: true, healthy: false, reason: "provider_configuration_invalid", mode: null }; } }
  if (external) { try { validateProviderUrl("helius", env.HELIUS_RPC_URL); validateProviderUrl("alchemy", env.ALCHEMY_RPC_URL); return { available: true, healthy: true, reason: null, mode: "external_failover" }; } catch { return { available: true, healthy: false, reason: "provider_configuration_invalid", mode: null }; } }
  return { available: partialExternal, healthy: false, reason: partialExternal ? "provider_configuration_incomplete" : "provider_configuration_unavailable", mode: null };
}

function publicCheck(name, value) { return { name, healthy: value?.healthy === true, reason: value?.healthy === true ? null : typeof value?.reason === "string" ? value.reason : `${name}_unavailable` }; }

export function compileOperationalReadiness({ provider, index, exporter, warehouse, backup, recovery }) {
  const values = { provider, index, exporter, warehouse, backup, recovery }, checks = CHECK_NAMES.map((name) => publicCheck(name, values[name])), blockers = checks.filter((check) => !check.healthy).map((check) => ({ check: check.name, reason: check.reason }));
  return { schemaVersion: 1, kind: "upstream_operational_readiness", ready: blockers.length === 0, blockerCount: blockers.length, checks, blockers, productionMutationAuthorized: false };
}

export async function operationalReadinessCheck({ config = loadConfig(), env = process.env, now = Date.now() } = {}) {
  const store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds, null, null, 200, config.maxStateFileBytes); await store.load();
  const [exporterEvidence, warehouseCheckpoint, warehouseFailure, backupEvidence, recoveryEvidence] = await Promise.all([config.exporterStatusFile, config.warehouseCheckpointFile, config.warehouseStatusFile, config.backupStatusFile, config.recoveryReportFile].map((filename) => readBoundedJsonFile(filename)));
  const eventSequence = Number.isSafeInteger(store.state?.eventSequence) ? store.state.eventSequence : 0, events = Array.isArray(store.state?.events) ? store.state.events : [], indexHealth = store.health(config.staleAfterMs, now);
  const warehouse = applyWarehouseFailureStatus(assessWarehouseCheckpoint(warehouseCheckpoint, eventSequence, events[0]?.sequence ?? eventSequence + 1, config.warehouseStaleAfterMs, config.maxWarehouseLagEvents, now), warehouseFailure);
  return compileOperationalReadiness({ provider: assessProviderConfiguration(env), index: { healthy: indexHealth.healthy, reason: indexHealth.reason }, exporter: assessExporterStatus(exporterEvidence, config.staleAfterMs, now, config.maxExporterLagSlots), warehouse, backup: assessBackupStatus(backupEvidence, config.backupMaximumAgeMs, now), recovery: assessRecoveryQualification(recoveryEvidence, config.recoveryMaximumAgeMs, now) });
}

async function main() { const result = await operationalReadinessCheck(); console.log(JSON.stringify(result)); if (!result.ready) process.exitCode = 1; }
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invoked.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
