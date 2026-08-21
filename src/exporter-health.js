#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";

export async function exporterHealthCheck(filename, staleAfterMs, now = Date.now()) {
  let status; try { status = JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return { healthy: false, reason: "status_unavailable" }; throw error; }
  const observed = Date.parse(status.observedAt ?? ""), ageMs = Number.isFinite(observed) ? now - observed : null, failures = Number(status.consecutiveFailures) || 0;
  const reason = failures > 0 ? "exporter_failure" : status.commitment !== "finalized" ? "not_finalized" : ageMs == null ? "invalid_observed_at" : ageMs < 0 ? "observed_at_in_future" : ageMs > staleAfterMs ? "exporter_stale" : null;
  return { healthy: reason == null, reason, source: status.source ?? "unknown", cursor: Number.isSafeInteger(status.cursor) ? status.cursor : null, lagSlots: Number.isSafeInteger(status.lagSlots) ? status.lagSlots : null, ageMs, consecutiveFailures: failures };
}

async function main() { const config = loadConfig(), result = await exporterHealthCheck(config.exporterStatusFile, config.staleAfterMs); console.log(JSON.stringify(result)); if (!result.healthy) process.exitCode = 1; }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
