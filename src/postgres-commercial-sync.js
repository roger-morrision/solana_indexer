import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadApiTenants } from "./api-tenants.js";
import { loadConfig } from "./config.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { runBoundedProcess } from "./bounded-process.js";
import { redactDiagnostic } from "./diagnostic-redaction.js";

function literal(value) { return value == null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`; }
function values(rows) { return rows.map((row) => `(${row.join(", ")})`).join(",\n"); }

export function buildCommercialSyncSql(registry, auditText) {
  if (!registry?.tenants?.length) throw new Error("API tenant registry is required"); const tenantIds = new Set(registry.tenants.map((row) => row.id)), usage = new Map();
  for (const [index, line] of auditText.split(/\r?\n/).filter(Boolean).entries()) { let row; try { row = JSON.parse(line); } catch { throw new Error(`invalid audit JSON at line ${index + 1}`); } const observed = parseCanonicalUtcTimestamp(row?.observedAt), statusClass = Math.floor(Number(row?.statusCode) / 100), quotaUnits = row?.quotaUnits ?? 1; if (row?.schemaVersion !== 1 || !row.tenantId || !tenantIds.has(row.tenantId) || observed == null || typeof row.path !== "string" || !row.path.startsWith("/") || /[\u0000-\u001f]/.test(row.path) || !Number.isFinite(row.durationMs) || row.durationMs < 0 || !Number.isInteger(quotaUnits) || quotaUnits < 1 || quotaUnits > 100 || statusClass < 1 || statusClass > 5) throw new Error(`invalid tenant usage audit at line ${index + 1}`); const bucket = new Date(Math.floor(observed / 3_600_000) * 3_600_000).toISOString(), key = `${row.tenantId}\u0000${bucket}\u0000${row.path}\u0000${statusClass}`, current = usage.get(key) ?? { tenantId: row.tenantId, bucket, route: row.path, statusClass, requests: 0, durationMs: 0 }; current.requests += quotaUnits; current.durationMs += row.durationMs; usage.set(key, current); }
  const tenants = registry.tenants.map((row) => [literal(row.id), literal(row.plan), literal(row.status), row.rateLimitPerMinute, row.retentionDays]), keys = registry.tenants.flatMap((tenant) => tenant.keys.map((key) => [literal(key.hash), literal(tenant.id), literal(key.activatesAt), literal(key.expiresAt)])), usageRows = [...usage.values()].map((row) => [literal(row.tenantId), literal(row.bucket), literal(row.route), row.statusClass, row.requests, Number(row.durationMs.toFixed(3))]);
  return `BEGIN;\nINSERT INTO api_tenants (tenant_id, plan, status, rate_limit_per_minute, retention_days) VALUES\n${values(tenants)}\nON CONFLICT (tenant_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, rate_limit_per_minute = EXCLUDED.rate_limit_per_minute, retention_days = EXCLUDED.retention_days, updated_at = now();\nINSERT INTO api_key_hashes (key_hash, tenant_id, activates_at, expires_at) VALUES\n${values(keys)}\nON CONFLICT (key_hash) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, activates_at = EXCLUDED.activates_at, expires_at = EXCLUDED.expires_at;\n${usageRows.length ? `INSERT INTO api_usage_hourly (tenant_id, bucket_start, route, status_class, requests, duration_ms) VALUES\n${values(usageRows)}\nON CONFLICT (tenant_id, bucket_start, route, status_class) DO UPDATE SET requests = EXCLUDED.requests, duration_ms = EXCLUDED.duration_ms;\n` : ""}COMMIT;\n`;
}

export async function runCommercialSync(sql, spawnProcess = spawn, processOptions = {}) {
  try { await runBoundedProcess({ command: "psql", args: ["--no-psqlrc", "--set", "ON_ERROR_STOP=1"], input: sql, spawnProcess, timeoutMs: 300_000, label: "psql commercial sync", ...processOptions }); }
  catch (error) { throw new Error(redactDiagnostic(error, "commercial sync failed")); }
}

async function main() { const config = loadConfig(), registry = await loadApiTenants(config.apiTenantsFile); if (!config.auditLogFile) throw new Error("INDEXER_AUDIT_LOG_FILE is required"); const auditText = await fs.readFile(config.auditLogFile, "utf8"), sql = buildCommercialSyncSql(registry, auditText); await runCommercialSync(sql); console.log(JSON.stringify({ tenants: registry.tenants.length, auditRecords: auditText.split(/\r?\n/).filter(Boolean).length, synced: true })); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
