import fs from "node:fs/promises";
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { attachWebSocket } from "./websocket.js";
import { registrySnapshot } from "./program-registry.js";
import { assessExporterStatus } from "./exporter-health.js";
import { ApiAuditSink, auditIdentity, normalizeAuditRoute } from "./api-audit.js";
import { resolveApiTenant } from "./api-tenants.js";
import { assessWarehouseCheckpoint } from "./warehouse-sync.js";
import { assessBackupStatus } from "./backup-status.js";
import { assessRecoveryQualification } from "./recovery-qualification.js";
import { quoteRaydiumSnapshotExactInput } from "./clmm-math.js";
import { quoteCpmmSnapshotExactInput, RAYDIUM_CPMM_PROGRAM } from "./cpmm-pool-snapshot.js";
import { RAYDIUM_CLMM_PROGRAM } from "./clmm-pool-snapshot.js";
import { quotePumpSwapSnapshotExactInput, PUMP_PROGRAM, PUMP_SWAP_PROGRAM } from "./pump-swap-pool-snapshot.js";
import { quoteOrcaSnapshotExactInput } from "./orca-clmm-math.js";
import { ORCA_WHIRLPOOL_PROGRAM } from "./orca-pool-snapshot.js";
import { prepareOrcaWhirlpoolSwapSimulation } from "./orca-whirlpool-execution.js";
import { quoteMeteoraDlmmSnapshotExactInput } from "./meteora-dlmm-math.js";
import { METEORA_DLMM_PROGRAM } from "./meteora-dlmm-pool-snapshot.js";
import { prepareMeteoraDlmmSwapSimulation } from "./meteora-dlmm-execution.js";
import { prepareRaydiumClmmSwapV2Simulation } from "./raydium-clmm-execution.js";
import { prepareRaydiumCpmmSwapBaseInputSimulation } from "./raydium-cpmm-execution.js";
import { preparePumpSwapBuyExactQuoteInSimulation, preparePumpSwapSellSimulation } from "./pump-swap-execution.js";
import { preparePumpBuyExactQuoteInV2Simulation, preparePumpSellV2Simulation } from "./pump-bonding-curve-execution.js";
import { bindExecutionHandoff, EXECUTION_HANDOFF_POLICY } from "./execution-handoff-policy.js";
import { redactDiagnostic } from "./diagnostic-redaction.js";

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
const INTERNAL_FAILURE_EVENTS = ["http_internal_error", "pool_quote_failed", "pool_swap_preparation_failed", "curve_swap_preparation_failed"];
const HTTP_DURATION_BUCKETS_SECONDS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5];
function json(response, status, value, headers = {}) { const body = JSON.stringify(value); response.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store", "x-api-version": "1", ...headers }); response.end(body); }
function reportDiagnostic(config, metrics, event, error) { metrics.internalFailures[event]++; if (typeof config.onDiagnostic !== "function") return; try { const result = config.onDiagnostic({ event, error: redactDiagnostic(error, "internal server failure") }); if (result?.then) result.catch(() => {}); } catch {} }
function limit(url) { const raw = url.searchParams.get("limit"); if (raw == null) return 100; if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 1 || Number(raw) > 500) { const error = new Error("limit must be an integer from 1 through 500"); error.code = "BAD_REQUEST"; throw error; } return Number(raw); }
function trendingWindow(url) { const value = url.searchParams.get("window") ?? "1h"; const windows = { "5m": 300, "1h": 3600, "6h": 21_600, "24h": 86_400, all: null }; if (!(value in windows)) { const error = new Error("window must be 5m, 1h, 6h, 24h, or all"); error.code = "BAD_REQUEST"; throw error; } return { label: value, seconds: windows[value] }; }
function candleInterval(url) { const value = Number(url.searchParams.get("interval") ?? 60); if (![60, 300, 900, 3600, 14_400, 86_400].includes(value)) { const error = new Error("interval must be 60, 300, 900, 3600, 14400, or 86400 seconds"); error.code = "BAD_REQUEST"; throw error; } return value; }
function encodeCursor(key, scope) { return Buffer.from(JSON.stringify({ version: 1, key, scope })).toString("base64url"); }
function decodeCursor(value) {
  if (!value) return null;
  try { const bytes = Buffer.from(value, "base64url"), decoded = JSON.parse(bytes.toString("utf8")), keys = Object.keys(decoded ?? {}).sort().join(","); if (value.length > 1_024 || !/^[A-Za-z0-9_-]+$/.test(value) || bytes.toString("base64url") !== value || keys !== "key,scope,version" || decoded.version !== 1 || typeof decoded.key !== "string" || !decoded.key || decoded.key.length > 256 || decoded.scope !== null && (typeof decoded.scope !== "string" || !decoded.scope || decoded.scope.length > 256)) throw new Error("invalid cursor contract"); return decoded; }
  catch { const error = new Error("cursor must be canonical version-1 base64url JSON"); error.code = "INVALID_CURSOR"; throw error; }
}
function page(rows, size, cursor, key, scope = null) {
  const decoded = decodeCursor(cursor);
  if (decoded != null && decoded.scope !== scope) { const error = new Error("cursor does not match the requested collection or filters"); error.code = "INVALID_CURSOR"; throw error; }
  const start = decoded == null ? 0 : rows.findIndex((row) => key(row) === decoded.key) + 1;
  if (decoded != null && start === 0) { const error = new Error("cursor does not reference a retained record"); error.code = "INVALID_CURSOR"; throw error; }
  const data = rows.slice(start, start + size);
  const hasMore = start + data.length < rows.length;
  return { data, nextCursor: hasMore && data.length ? encodeCursor(key(data.at(-1)), scope) : null };
}
function tokenCatalogRow(address, row) { const enrichment = row.offchainMetadata; return { address, transferCount: row.transferCount ?? 0, swapCount: row.swapCount ?? 0, lastSlot: row.lastSlot ?? null, lastBlockTime: row.lastBlockTime ?? null, decimals: row.mintInfo?.decimals ?? null, metadata: row.metadata ?? null, offchainMetadata: enrichment ? { observedAt: enrichment.observedAt, rawPayloadHash: enrichment.rawPayloadHash, sourceUri: enrichment.sourceUri, trusted: false, automationSafe: false } : null, authoritySourceSlot: row.authoritySourceSlot ?? null }; }
function poolCatalogRow(address, row) { const snapshot = row.accountSnapshot; return { address, protocol: row.protocol ?? null, venueType: row.venueType ?? null, baseMint: row.baseMint ?? null, quoteMint: row.quoteMint ?? null, pairIdentitySource: row.pairIdentitySource ?? null, swapCount: row.swapCount ?? 0, lastSlot: row.lastSlot ?? null, lastEventIndex: row.lastEventIndex ?? null, lastBlockTime: row.lastBlockTime ?? null, lifecycleState: row.lifecycleState ?? null, lifecycle: row.lifecycle ?? null, snapshot: snapshot ? { commitment: snapshot.commitment, stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, observedAt: snapshot.observedAt, liquidityRaw: snapshot.liquidityRaw, sqrtPriceX64: snapshot.sqrtPriceX64, tick: snapshot.tick, tickSpacing: snapshot.tickSpacing, tickArrayCoverage: snapshot.tickArrayCoverage } : null }; }
function optionalFilter(url, name, maximum = 64) { const value = url.searchParams.get(name); if (value == null) return null; if (!value || value.length > maximum || /[\u0000-\u001f]/.test(value)) { const error = new Error(`${name} filter is invalid`); error.code = "BAD_REQUEST"; throw error; } return value; }
async function readJsonFile(filename) { if (!filename) return null; try { return JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return null; if (error instanceof SyntaxError) return { evidenceReadError: "invalid_json" }; throw error; } }
async function readJsonBody(request, maximum = 65_536) {
  const declared = request.headers["content-length"]; if (declared != null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))) { const error = new Error("content-length must be a non-negative safe integer"); error.code = "BAD_REQUEST"; throw error; }
  if (declared != null && Number(declared) > maximum) { const error = new Error(`request body exceeds ${maximum} bytes`); error.code = "PAYLOAD_TOO_LARGE"; throw error; }
  const chunks = []; let size = 0;
  for await (const chunk of request) { size += chunk.length; if (size > maximum) { const error = new Error(`request body exceeds ${maximum} bytes`); error.code = "PAYLOAD_TOO_LARGE"; throw error; } chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { const error = new Error("request body must be valid JSON"); error.code = "BAD_REQUEST"; throw error; }
}
function rpcResult(id, result) { return { jsonrpc: "2.0", id: id ?? null, result }; }
function rpcError(id, code, message) { return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }; }
export function gateBotReadiness(readiness, ingestion, warehouse) { const ingestionAutomationEligible = Boolean(ingestion?.healthy && ingestion?.automationEligible !== false), warehouseExactlyConverged = Boolean(warehouse?.healthy && warehouse?.lagEvents === 0), missing = [...new Set([...(readiness?.missing ?? []), ...(!ingestionAutomationEligible ? ["ingestionHealth"] : []), ...(!warehouseExactlyConverged ? ["warehouseHealth"] : [])])], dependenciesHealthy = Boolean(ingestionAutomationEligible && warehouseExactlyConverged), ready = Boolean(readiness?.ready && dependenciesHealthy); return { ...readiness, schemaVersion: 2, ready, reason: ready ? null : readiness?.ready ? "dependency_unhealthy" : readiness?.reason ?? "market_readiness_unavailable", missing, dependencies: { ingestion: { healthy: Boolean(ingestion?.healthy), automationEligible: ingestionAutomationEligible, source: ingestion?.source ?? null, reason: ingestion?.reason ?? (ingestion?.healthy && !ingestionAutomationEligible ? "emergency_provider_not_automation_eligible" : null), ageMs: ingestion?.ageMs ?? null, lagSlots: ingestion?.lagSlots ?? null }, warehouse: { healthy: Boolean(warehouse?.healthy), exactlyConverged: warehouseExactlyConverged, reason: warehouse?.reason ?? (warehouse?.healthy && !warehouseExactlyConverged ? "warehouse_not_exactly_converged" : null), ageMs: warehouse?.ageMs ?? null, lagEvents: warehouse?.lagEvents ?? null } } }; }
function dispatchRpc(payload, config, store) {
  if (!payload || payload.jsonrpc !== "2.0" || typeof payload.method !== "string" || !("id" in payload)) return rpcError(payload?.id, -32600, "Invalid Request");
  if (payload.method === "getIndexerHealth") return rpcResult(payload.id, store.health(config.staleAfterMs));
  if (payload.method === "getIndexerStats") { const structure = store.structureQuality(); return rpcResult(payload.id, { ...store.stats(), structure, chain: structure.canonical ? store.chainQuality() : { canonical: false, conflicts: [], conflictCount: 0, invalidStateStructure: true } }); }
  if (!store.structureQuality().canonical) return rpcError(payload.id, -32000, "Index state unavailable");
  if (payload.method === "getIndexedBlock") {
    const slot = Array.isArray(payload.params) ? payload.params[0] : payload.params?.slot;
    if (!Number.isSafeInteger(slot) || slot < 0) return rpcError(payload.id, -32602, "Invalid params");
    const view = store.indexedBlocks(); if (!view.available) return rpcError(payload.id, -32001, "Indexed block evidence unavailable");
    return rpcResult(payload.id, view.data.find((block) => block.slot === slot) ?? null);
  }
  if (payload.method === "getIndexedBlocks") {
    const params = payload.params == null ? {} : Array.isArray(payload.params) ? { limit: payload.params[0], cursor: payload.params[1] } : payload.params;
    if (!params || typeof params !== "object" || Array.isArray(params)) return rpcError(payload.id, -32602, "Invalid params");
    const size = params.limit ?? 100, cursor = params.cursor ?? null; if (!Number.isInteger(size) || size < 1 || size > 500 || (cursor !== null && typeof cursor !== "string")) return rpcError(payload.id, -32602, "Invalid params");
    const view = store.indexedBlocks(); if (!view.available) return rpcError(payload.id, -32001, "Indexed block evidence unavailable");
    try { return rpcResult(payload.id, page(view.data, size, cursor, (row) => String(row.slot), "rpc:getIndexedBlocks:v1")); } catch { return rpcError(payload.id, -32602, "Invalid params"); }
  }
  if (payload.method === "getIndexedTransaction") {
    const signature = Array.isArray(payload.params) ? payload.params[0] : payload.params?.signature;
    if (typeof signature !== "string" || !signature) return rpcError(payload.id, -32602, "Invalid params");
    const view = store.indexedTransactions(); if (!view.available) return rpcError(payload.id, -32002, "Indexed transaction evidence unavailable");
    return rpcResult(payload.id, view.data.find((transaction) => transaction.signature === signature) ?? null);
  }
  return rpcError(payload.id, -32601, "Method not found");
}
function dispatchRpcEnvelope(payload, config, store) { if (!Array.isArray(payload)) return dispatchRpc(payload, config, store); if (!payload.length || payload.length > 100) return rpcError(null, -32600, "Invalid Request"); return payload.map((request) => dispatchRpc(request, config, store)); }
function presentedApiKey(request) {
  const bearer = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const protocols = String(request.headers["sec-websocket-protocol"] ?? "").split(",").map((value) => value.trim());
  const encoded = protocols.find((value) => value.startsWith("bearer."))?.slice(7);
  let websocketBearer = ""; try { if (encoded) websocketBearer = Buffer.from(encoded, "base64url").toString("utf8"); } catch { websocketBearer = ""; }
  return String(request.headers["x-api-key"] ?? bearer ?? websocketBearer ?? "");
}
function keyMatches(presented, configured) {
  if (!presented) return false;
  const candidate = crypto.createHash("sha256").update(presented).digest();
  return configured.some((key) => crypto.timingSafeEqual(candidate, crypto.createHash("sha256").update(key).digest()));
}
function prometheus(metrics, store, staleAfterMs, exporter, maxExporterLagSlots, warehouseCheckpoint, warehouseStaleAfterMs, maxWarehouseLagEvents, backup, backupMaximumAgeMs, recovery, recoveryMaximumAgeMs, auditFailures = 0, webSocketStats = {}) {
  const structure = store.structureQuality(), now = Date.now(), health = store.health(staleAfterMs), exporterStatus = assessExporterStatus(exporter, staleAfterMs, now, maxExporterLagSlots), eventSequence = Number.isSafeInteger(store.state?.eventSequence) ? store.state.eventSequence : 0, events = Array.isArray(store.state?.events) ? store.state.events : [], warehouseStatus = assessWarehouseCheckpoint(warehouseCheckpoint, eventSequence, events[0]?.sequence ?? eventSequence + 1, warehouseStaleAfterMs, maxWarehouseLagEvents), backupStatus = assessBackupStatus(backup, backupMaximumAgeMs, now), recoveryStatus = assessRecoveryQualification(recovery, recoveryMaximumAgeMs, now), stats = store.stats(now), retry = stats.deadLetterRetry, lines = [
    "# HELP terminal_dex_http_requests_total HTTP requests handled by status class.",
    "# TYPE terminal_dex_http_requests_total counter",
    ...Object.entries(metrics.statusClasses).map(([status, count]) => `terminal_dex_http_requests_total{status_class="${status}"} ${count}`),
    "# HELP terminal_dex_http_request_duration_seconds HTTP request duration in fixed route-free buckets.",
    "# TYPE terminal_dex_http_request_duration_seconds histogram",
    ...HTTP_DURATION_BUCKETS_SECONDS.map((le) => `terminal_dex_http_request_duration_seconds_bucket{le="${le}"} ${metrics.durationBuckets[le]}`),
    `terminal_dex_http_request_duration_seconds_bucket{le="+Inf"} ${metrics.durationCount}`,
    `terminal_dex_http_request_duration_seconds_sum ${metrics.durationMs / 1000}`,
    `terminal_dex_http_request_duration_seconds_count ${metrics.durationCount}`,
    "# HELP terminal_dex_index_healthy Whether the canonical index meets freshness and chain checks.",
    "# TYPE terminal_dex_index_healthy gauge",
    `terminal_dex_index_healthy ${health.healthy ? 1 : 0}`,
    "# HELP terminal_dex_index_state_quarantined Whether persisted index state is isolated from serving and mutation.",
    "# TYPE terminal_dex_index_state_quarantined gauge",
    `terminal_dex_index_state_quarantined ${structure.canonical ? 0 : 1}`,
    "# HELP terminal_dex_index_state_invalid_fields Number of invalid top-level persisted-state collections; zero for syntax-invalid JSON.",
    "# TYPE terminal_dex_index_state_invalid_fields gauge",
    `terminal_dex_index_state_invalid_fields ${structure.fields.length}`,
    "# HELP terminal_dex_index_age_seconds Age of the newest indexed block.",
    "# TYPE terminal_dex_index_age_seconds gauge",
    `terminal_dex_index_age_seconds ${health.ageMs == null ? "NaN" : health.ageMs / 1000}`,
    "# TYPE terminal_dex_exporter_healthy gauge", `terminal_dex_exporter_healthy ${exporterStatus.healthy ? 1 : 0}`,
    "# TYPE terminal_dex_exporter_age_seconds gauge", `terminal_dex_exporter_age_seconds ${exporterStatus.ageMs == null ? "NaN" : exporterStatus.ageMs / 1000}`,
    "# TYPE terminal_dex_exporter_lag_slots gauge", `terminal_dex_exporter_lag_slots ${exporterStatus.lagSlots ?? "NaN"}`,
    "# TYPE terminal_dex_exporter_consecutive_failures gauge", `terminal_dex_exporter_consecutive_failures ${exporterStatus.consecutiveFailures ?? "NaN"}`,
    "# TYPE terminal_dex_warehouse_healthy gauge", `terminal_dex_warehouse_healthy ${warehouseStatus.healthy ? 1 : 0}`,
    "# TYPE terminal_dex_warehouse_age_seconds gauge", `terminal_dex_warehouse_age_seconds ${warehouseStatus.ageMs == null ? "NaN" : warehouseStatus.ageMs / 1000}`,
    "# TYPE terminal_dex_warehouse_lag_events gauge", `terminal_dex_warehouse_lag_events ${warehouseStatus.lagEvents ?? "NaN"}`,
    "# HELP terminal_dex_backup_healthy Whether a content-bound completed self-hosted backup meets the configured RPO.",
    "# TYPE terminal_dex_backup_healthy gauge", `terminal_dex_backup_healthy ${backupStatus.healthy ? 1 : 0}`,
    "# HELP terminal_dex_backup_age_seconds Age of the last content-bound completed self-hosted backup.",
    "# TYPE terminal_dex_backup_age_seconds gauge", `terminal_dex_backup_age_seconds ${backupStatus.ageMs == null ? "NaN" : backupStatus.ageMs / 1000}`,
    "# HELP terminal_dex_recovery_qualified Whether the latest isolated recovery rehearsal evidence is canonical and current.",
    "# TYPE terminal_dex_recovery_qualified gauge", `terminal_dex_recovery_qualified ${recoveryStatus.healthy ? 1 : 0}`,
    "# HELP terminal_dex_recovery_qualification_age_seconds Age of the latest isolated recovery qualification.",
    "# TYPE terminal_dex_recovery_qualification_age_seconds gauge", `terminal_dex_recovery_qualification_age_seconds ${recoveryStatus.ageMs == null ? "NaN" : recoveryStatus.ageMs / 1000}`,
    "# TYPE terminal_dex_index_tip_slot gauge", `terminal_dex_index_tip_slot ${stats.tip ?? "NaN"}`,
    "# TYPE terminal_dex_dead_letters gauge", `terminal_dex_dead_letters ${stats.unresolvedDeadLetters}`,
    "# HELP terminal_dex_dead_letter_retries Number of unresolved dead letters by retry eligibility.",
    "# TYPE terminal_dex_dead_letter_retries gauge",
    `terminal_dex_dead_letter_retries{state="due"} ${retry.due ?? "NaN"}`,
    `terminal_dex_dead_letter_retries{state="deferred"} ${retry.deferred ?? "NaN"}`,
    `terminal_dex_dead_letter_retries{state="legacy"} ${retry.legacy ?? "NaN"}`,
    "# HELP terminal_dex_dead_letter_retries_by_stage Scheduled unresolved dead letters by bounded failure stage.",
    "# TYPE terminal_dex_dead_letter_retries_by_stage gauge",
    ...Object.entries(retry.stages ?? {}).map(([stage, count]) => `terminal_dex_dead_letter_retries_by_stage{stage="${stage}"} ${count ?? "NaN"}`),
    "# TYPE terminal_dex_dead_letter_next_retry_seconds gauge", `terminal_dex_dead_letter_next_retry_seconds ${retry.nextRetryInMs == null ? "NaN" : retry.nextRetryInMs / 1000}`,
    "# TYPE terminal_dex_reorg_corrections_total counter", `terminal_dex_reorg_corrections_total ${stats.reorgCorrections}`,
    "# TYPE terminal_dex_indexed_swaps gauge", `terminal_dex_indexed_swaps ${stats.swaps}`,
    "# TYPE terminal_dex_api_audit_failures_total counter", `terminal_dex_api_audit_failures_total ${auditFailures}`,
    "# TYPE terminal_dex_distributed_quota_failures_total counter", `terminal_dex_distributed_quota_failures_total ${metrics.distributedQuotaFailures}`,
    "# HELP terminal_dex_internal_failures_total Unexpected API failures by bounded operation; exception content is never a label.",
    "# TYPE terminal_dex_internal_failures_total counter",
    ...INTERNAL_FAILURE_EVENTS.map((event) => `terminal_dex_internal_failures_total{operation="${event}"} ${metrics.internalFailures[event]}`),
    "# TYPE terminal_dex_websocket_clients gauge", `terminal_dex_websocket_clients ${webSocketStats.activeClients ?? 0}`,
    "# TYPE terminal_dex_websocket_capacity_rejections_total counter", `terminal_dex_websocket_capacity_rejections_total ${webSocketStats.capacityRejections ?? 0}`,
    "# TYPE terminal_dex_websocket_slow_consumer_evictions_total counter", `terminal_dex_websocket_slow_consumer_evictions_total ${webSocketStats.slowConsumerEvictions ?? 0}`,
    "# TYPE terminal_dex_websocket_protocol_closes_total counter", `terminal_dex_websocket_protocol_closes_total ${webSocketStats.protocolCloses ?? 0}`,
    "# TYPE terminal_dex_websocket_acknowledgement_clients gauge", `terminal_dex_websocket_acknowledgement_clients ${webSocketStats.acknowledgementClients ?? 0}`,
    "# TYPE terminal_dex_websocket_acknowledgement_timeouts_total counter", `terminal_dex_websocket_acknowledgement_timeouts_total ${webSocketStats.acknowledgementTimeouts ?? 0}`,
    "# HELP terminal_dex_websocket_acknowledgement_latency_seconds Persisted event commit-to-client-acknowledgement latency.",
    "# TYPE terminal_dex_websocket_acknowledgement_latency_seconds histogram",
    ...HTTP_DURATION_BUCKETS_SECONDS.map((le) => `terminal_dex_websocket_acknowledgement_latency_seconds_bucket{le="${le}"} ${webSocketStats.acknowledgementLatencyBuckets?.[le] ?? 0}`),
    `terminal_dex_websocket_acknowledgement_latency_seconds_bucket{le="+Inf"} ${webSocketStats.acknowledgementCount ?? 0}`,
    `terminal_dex_websocket_acknowledgement_latency_seconds_sum ${(webSocketStats.acknowledgementLatencyMs ?? 0) / 1_000}`,
    `terminal_dex_websocket_acknowledgement_latency_seconds_count ${webSocketStats.acknowledgementCount ?? 0}`,
  ]; return `${lines.join("\n")}\n`;
}

export function createServer(config, store) {
  const quotas = new Map(), metrics = { requests: 0, durationCount: 0, durationMs: 0, durationBuckets: Object.fromEntries(HTTP_DURATION_BUCKETS_SECONDS.map((le) => [le, 0])), distributedQuotaFailures: 0, internalFailures: Object.fromEntries(INTERNAL_FAILURE_EVENTS.map((event) => [event, 0])), statusClasses: { "2xx": 0, "4xx": 0, "5xx": 0 } }, auditSink = new ApiAuditSink(config.auditLogFile);
  const server = http.createServer(async (request, response) => {
    const started = process.hrtime.bigint(), presented = presentedApiKey(request), identity = auditIdentity(presented, request.socket.remoteAddress), tenant = resolveApiTenant(config.apiTenants, presented); let auditPath = null, auditUnits = 1;
    response.once("finish", () => { const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000; metrics.requests++; if (request.method === "GET" && (auditPath?.startsWith("/api/") || auditPath?.startsWith("/internal/"))) { metrics.durationCount++; metrics.durationMs += durationMs; for (const le of HTTP_DURATION_BUCKETS_SECONDS) if (durationMs <= le * 1_000) metrics.durationBuckets[le]++; } const key = `${Math.floor(response.statusCode / 100)}xx`; metrics.statusClasses[key] = (metrics.statusClasses[key] ?? 0) + 1; if (auditPath) auditSink.record({ observedAt: new Date().toISOString(), identityHash: identity, tenantId: tenant?.id ?? null, plan: tenant?.plan ?? null, retentionDays: tenant?.retentionDays ?? config.auditRetentionDays ?? 30, method: request.method, path: auditPath, statusCode: response.statusCode, durationMs: Math.round(durationMs * 1_000) / 1_000, quotaUnits: auditUnits }); });
    try {
      const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
      auditPath = normalizeAuditRoute(url.pathname);
      const protectedRoute = url.pathname === "/rpc" || url.pathname === "/metrics" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/internal/");
      const apiKeys = config.apiKeys ?? [];
      if (protectedRoute && config.auditLogFile && auditSink.failures > 0) return json(response, 503, { error: "audit_sink_unavailable" });
      if (protectedRoute && config.apiTenants && !tenant) return json(response, 401, { error: "unauthorized" }, { "www-authenticate": "Bearer" });
      if (protectedRoute && !config.apiTenants && apiKeys.length && !keyMatches(presented, apiKeys)) return json(response, 401, { error: "unauthorized" }, { "www-authenticate": "Bearer" });
      const preparePoolSwap = request.method === "POST" ? url.pathname.match(/^\/internal\/pools\/([^/]+)\/prepare-swap$/) : null, prepareCurveSwap = request.method === "POST" ? url.pathname.match(/^\/internal\/tokens\/([^/]+)\/prepare-swap$/) : null; let rpcPayload = null, preparePayload = null; if (request.method === "POST" && url.pathname === "/rpc") rpcPayload = await readJsonBody(request, config.rpcMaxBodyBytes ?? 65_536); else if (preparePoolSwap || prepareCurveSwap) preparePayload = await readJsonBody(request, config.executionMaxBodyBytes ?? 524_288); const requestWeight = Array.isArray(rpcPayload) && rpcPayload.length >= 1 && rpcPayload.length <= 100 ? rpcPayload.length : 1; auditUnits = requestWeight;
      const requestLimit = tenant?.rateLimitPerMinute ?? config.rateLimitPerMinute;
      if (protectedRoute && requestLimit) {
        const quotaIdentity = tenant?.id ?? (apiKeys.length ? identity : request.socket.remoteAddress ?? "unknown");
        let quota; if (config.distributedQuotaEnabled) { if (typeof config.quotaAdmitter !== "function") { metrics.distributedQuotaFailures++; return json(response, 503, { error: "distributed_quota_unavailable" }); } try { quota = await config.quotaAdmitter(quotaIdentity, requestLimit, Date.now(), requestWeight); } catch { metrics.distributedQuotaFailures++; return json(response, 503, { error: "distributed_quota_unavailable" }); } if (!quota || !Number.isSafeInteger(quota.count) || quota.count < 1 || !Number.isSafeInteger(quota.remaining) || quota.remaining < 0 || !Number.isInteger(quota.retryAfterSeconds) || quota.retryAfterSeconds < 1) { metrics.distributedQuotaFailures++; return json(response, 503, { error: "distributed_quota_invalid_response" }); } } else { const window = Math.floor(Date.now() / 60_000), prior = quotas.get(quotaIdentity); quota = prior?.window === window ? prior : { window, count: 0 }; quota.count += requestWeight; quota.remaining = Math.max(0, requestLimit - quota.count); quota.retryAfterSeconds = 60 - (Math.floor(Date.now() / 1000) % 60); quotas.set(quotaIdentity, quota); }
        const remaining = quota.remaining;
        response.setHeader("x-ratelimit-limit", requestLimit); response.setHeader("x-ratelimit-remaining", remaining); if (tenant) { response.setHeader("x-tenant-plan", tenant.plan); response.setHeader("x-retention-days", tenant.retentionDays); }
        if (quota.count > requestLimit) return json(response, 429, { error: "rate_limit_exceeded" }, { "retry-after": String(quota.retryAfterSeconds) });
      }
      const structure = store.structureQuality(), diagnosticRoute = new Set(["/metrics", "/api/health", "/api/stats", "/api/v1/ingestion", "/api/v1/warehouse", "/api/v1/backup", "/api/v1/recovery", "/internal/registry", "/internal/feed/health", "/internal/execution-policy"]).has(url.pathname);
      if (protectedRoute && url.pathname !== "/rpc" && !diagnosticRoute && !structure.canonical) return json(response, 503, { schemaVersion: 1, available: false, reason: structure.reason, fields: structure.fields });
      if (request.method === "POST" && url.pathname === "/rpc") return json(response, 200, dispatchRpcEnvelope(rpcPayload, config, store));
      if (preparePoolSwap) {
        const poolAddress = decodeURIComponent(preparePoolSwap[1]), row = store.state.poolSnapshots[poolAddress];
        if (!row) return json(response, 404, { error: "pool_snapshot_not_found" });
        if (row.sourceHash) { const quality = store.snapshotQuality(); if (!quality.canonical) return json(response, 503, { schemaVersion: 1, prepared: false, automationSafe: false, reason: quality.reason }); }
        const meteora = row.programId === METEORA_DLMM_PROGRAM, orca = row.programId === ORCA_WHIRLPOOL_PROGRAM, clmm = row.programId === RAYDIUM_CLMM_PROGRAM, cpmm = row.programId === RAYDIUM_CPMM_PROGRAM, pumpSwap = row.programId === PUMP_SWAP_PROGRAM;
        if (!meteora && !orca && !clmm && !cpmm && !pumpSwap) return json(response, 503, { schemaVersion: 1, prepared: false, automationSafe: false, reason: "unsupported_construction_protocol" });
        if (!preparePayload || typeof preparePayload !== "object" || Array.isArray(preparePayload) || !/^\d+$/.test(preparePayload.amountRaw ?? "") || typeof preparePayload.inputMint !== "string" || !preparePayload.inputMint) return json(response, 400, { error: "invalid_prepare_parameters" });
        if (((orca || clmm) && !Number.isSafeInteger(preparePayload.limitTick)) || (!(orca || clmm) && preparePayload.limitTick != null)) return json(response, 400, { error: "invalid_prepare_parameters" });
        const snapshot = { schemaVersion: 1, type: meteora ? "meteora_dlmm_pool_snapshot" : orca ? "orca_whirlpool_pool_snapshot" : clmm ? "raydium_clmm_pool_snapshot" : cpmm ? "raydium_cpmm_pool_snapshot" : "pump_swap_pool_snapshot", commitment: row.commitment, stateSlot: row.stateSlot, configSlot: row.configSlot, balanceSlot: row.balanceSlot, observedAt: row.observedAt, pools: [row] };
        try {
          const quote = meteora ? quoteMeteoraDlmmSnapshotExactInput({ snapshot, poolAddress, inputMint: preparePayload.inputMint, amountIn: preparePayload.amountRaw, staleAfterMs: config.staleAfterMs }) : orca ? quoteOrcaSnapshotExactInput({ snapshot, poolAddress, inputMint: preparePayload.inputMint, amountIn: preparePayload.amountRaw, limitTick: preparePayload.limitTick, maxAgeMs: config.staleAfterMs }) : clmm ? quoteRaydiumSnapshotExactInput({ snapshot, poolAddress, inputMint: preparePayload.inputMint, amountIn: preparePayload.amountRaw, limitTick: preparePayload.limitTick, maxAgeMs: config.staleAfterMs }) : cpmm ? quoteCpmmSnapshotExactInput({ snapshot, poolAddress, inputMint: preparePayload.inputMint, amountIn: preparePayload.amountRaw, staleAfterMs: config.staleAfterMs }) : quotePumpSwapSnapshotExactInput({ snapshot, poolAddress, inputMint: preparePayload.inputMint, amountIn: preparePayload.amountRaw, staleAfterMs: config.staleAfterMs });
          const common = { quote, pool: row, inputPreAmountRaw: preparePayload.inputPreAmountRaw, outputPreAmountRaw: preparePayload.outputPreAmountRaw, minimumOutputRaw: preparePayload.minimumOutputRaw, recentBlockhash: preparePayload.recentBlockhash }, pumpCommon = { ...common, user: preparePayload.user, userBaseTokenAccount: preparePayload.userBaseTokenAccount, userQuoteTokenAccount: preparePayload.userQuoteTokenAccount, protocolFeeRecipient: preparePayload.protocolFeeRecipient, buybackFeeRecipient: preparePayload.buybackFeeRecipient }, preparation = meteora ? prepareMeteoraDlmmSwapSimulation({ ...common, user: preparePayload.user, inputTokenAccount: preparePayload.inputTokenAccount, outputTokenAccount: preparePayload.outputTokenAccount, bitmapExtension: preparePayload.bitmapExtension ?? null, hostFeeAccount: preparePayload.hostFeeAccount ?? null, transferHookAccountData: preparePayload.transferHookAccountData ?? null }) : orca ? prepareOrcaWhirlpoolSwapSimulation({ ...common, tokenAuthority: preparePayload.user, tokenOwnerAccountA: preparePayload.tokenOwnerAccountA, tokenOwnerAccountB: preparePayload.tokenOwnerAccountB }) : clmm ? prepareRaydiumClmmSwapV2Simulation({ ...common, payer: preparePayload.user, inputTokenAccount: preparePayload.inputTokenAccount, outputTokenAccount: preparePayload.outputTokenAccount }) : cpmm ? prepareRaydiumCpmmSwapBaseInputSimulation({ ...common, payer: preparePayload.user, inputTokenAccount: preparePayload.inputTokenAccount, outputTokenAccount: preparePayload.outputTokenAccount }) : quote.direction === "base_to_quote" ? preparePumpSwapSellSimulation(pumpCommon) : preparePumpSwapBuyExactQuoteInSimulation(pumpCommon);
          return json(response, 200, { schemaVersion: 1, prepared: true, automationSafe: false, signed: false, submitted: false, requiredNextSteps: EXECUTION_HANDOFF_POLICY.requiredSteps, executionHandoff: bindExecutionHandoff(preparation), quote, preparation });
        } catch (error) { reportDiagnostic(config, metrics, "pool_swap_preparation_failed", error); return json(response, 503, { schemaVersion: 1, prepared: false, automationSafe: false, reason: "execution_preparation_unavailable" }); }
      }
      if (prepareCurveSwap) {
        const mint = decodeURIComponent(prepareCurveSwap[1]), side = preparePayload?.side ?? "sell", curve = Object.values(store.state.poolSnapshots).find((row) => row?.programId === PUMP_PROGRAM && row.mint === mint);
        if (!curve) return json(response, 404, { error: "bonding_curve_snapshot_not_found" });
        if (curve.sourceHash) { const quality = store.snapshotQuality(); if (!quality.canonical) return json(response, 503, { schemaVersion: 1, prepared: false, automationSafe: false, reason: quality.reason }); }
        if (!preparePayload || typeof preparePayload !== "object" || Array.isArray(preparePayload) || !new Set(["buy", "sell"]).has(side) || !/^\d+$/.test(preparePayload.amountRaw ?? "")) return json(response, 400, { error: "invalid_prepare_parameters" });
        try {
          const quote = side === "buy" ? store.buyRouteQuote(mint, preparePayload.amountRaw, config.staleAfterMs) : store.sellRouteQuote(mint, preparePayload.amountRaw, config.staleAfterMs);
          if (quote.available !== true) return json(response, quote.reason === "invalid_amount" ? 400 : 503, { schemaVersion: 1, prepared: false, automationSafe: false, reason: quote.reason, missing: quote.missing });
          const common = { quote, curve, user: preparePayload.user, userBaseTokenAccount: preparePayload.userBaseTokenAccount, userQuoteTokenAccount: preparePayload.userQuoteTokenAccount, protocolFeeRecipient: preparePayload.protocolFeeRecipient, buybackFeeRecipient: preparePayload.buybackFeeRecipient, inputPreAmountRaw: preparePayload.inputPreAmountRaw, outputPreAmountRaw: preparePayload.outputPreAmountRaw, minimumOutputRaw: preparePayload.minimumOutputRaw, recentBlockhash: preparePayload.recentBlockhash }, preparation = side === "buy" ? preparePumpBuyExactQuoteInV2Simulation(common) : preparePumpSellV2Simulation(common);
          return json(response, 200, { schemaVersion: 1, prepared: true, automationSafe: false, signed: false, submitted: false, requiredNextSteps: EXECUTION_HANDOFF_POLICY.requiredSteps, executionHandoff: bindExecutionHandoff(preparation), quote, preparation });
        } catch (error) { reportDiagnostic(config, metrics, "curve_swap_preparation_failed", error); return json(response, 503, { schemaVersion: 1, prepared: false, automationSafe: false, reason: "execution_preparation_unavailable" }); }
      }
      if (request.method !== "GET") return json(response, 405, { error: "method_not_allowed" });
      const derivedLedgerConsumer = new Set(["/internal/trending", "/internal/candidates", "/api/trending"]).has(url.pathname) || ["/internal/evidence/", "/internal/tokens/", "/internal/wallets/", "/api/account/", "/api/mint/", "/api/v1/holders/", "/api/v1/token-account/"].some((prefix) => url.pathname.startsWith(prefix));
      if (derivedLedgerConsumer) { const quality = store.derivedLedgerQuality(); if (!quality.canonical) return json(response, 503, { schemaVersion: 1, available: false, reason: quality.reason }); }
      const aggregateConsumer = new Set(["/internal/trending", "/internal/candidates", "/internal/new-pairs", "/api/trending", "/api/v1/tokens", "/api/v1/pools"]).has(url.pathname) || ["/internal/evidence/", "/internal/tokens/", "/internal/wallets/", "/api/account/", "/api/mint/", "/api/v1/holders/", "/api/v1/token-account/"].some((prefix) => url.pathname.startsWith(prefix));
      if (aggregateConsumer && !url.pathname.endsWith("/executable-depth")) { const quality = store.aggregateQuality(); if (!quality.canonical) return json(response, 503, { schemaVersion: 1, available: false, reason: quality.reason }); }
      if (aggregateConsumer && !url.pathname.endsWith("/executable-depth")) { const quality = store.programEventQuality(); if (!quality.canonical) return json(response, 503, { schemaVersion: 1, available: false, reason: quality.reason }); }
      if (aggregateConsumer && !url.pathname.endsWith("/executable-depth")) { const quality = store.snapshotQuality(); if (!quality.canonical) return json(response, 503, { schemaVersion: 1, available: false, reason: quality.reason }); }
      if (aggregateConsumer && !url.pathname.endsWith("/executable-depth")) { const quality = store.metadataQuality(); if (!quality.canonical) return json(response, 503, { schemaVersion: 1, available: false, reason: quality.reason }); }
      if (url.pathname === "/internal/execution-policy") return json(response, 200, EXECUTION_HANDOFF_POLICY);
      if (url.pathname === "/metrics") { const [exporter, warehouseCheckpoint, backup, recovery] = await Promise.all([readJsonFile(config.exporterStatusFile), readJsonFile(config.warehouseCheckpointFile), readJsonFile(config.backupStatusFile), readJsonFile(config.recoveryReportFile)]), body = prometheus(metrics, store, config.staleAfterMs, exporter, config.maxExporterLagSlots, warehouseCheckpoint, config.warehouseStaleAfterMs, config.maxWarehouseLagEvents, backup, config.backupMaximumAgeMs, recovery, config.recoveryMaximumAgeMs, auditSink.failures, server.webSocketStats); response.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store" }); return response.end(body); }
      if (url.pathname === "/api/health") { const health = { network: "offline-local", ...store.health(config.staleAfterMs) }; return json(response, health.healthy ? 200 : 503, health); }
      if (url.pathname === "/api/stats") { const structure = store.structureQuality(), payload = { ...store.stats(), structure, chain: structure.canonical ? store.chainQuality() : { canonical: false, conflicts: [], conflictCount: 0, invalidStateStructure: true } }; return json(response, structure.canonical ? 200 : 503, payload); }
      if (url.pathname === "/api/v1/ingestion") {
        const exporter = await readJsonFile(config.exporterStatusFile);
        const status = assessExporterStatus(exporter, config.staleAfterMs, Date.now(), config.maxExporterLagSlots), payload = { ...status, exporter, index: store.stats().ingestion };
        return json(response, status.healthy ? 200 : 503, payload);
      }
      if (url.pathname === "/api/v1/warehouse") { const checkpoint = await readJsonFile(config.warehouseCheckpointFile), sequence = Number.isSafeInteger(store.state?.eventSequence) ? store.state.eventSequence : 0, events = Array.isArray(store.state?.events) ? store.state.events : [], status = assessWarehouseCheckpoint(checkpoint, sequence, events[0]?.sequence ?? sequence + 1, config.warehouseStaleAfterMs, config.maxWarehouseLagEvents); return json(response, status.healthy ? 200 : 503, status); }
      if (url.pathname === "/api/v1/backup") { const status = assessBackupStatus(await readJsonFile(config.backupStatusFile), config.backupMaximumAgeMs); return json(response, status.healthy ? 200 : 503, status); }
      if (url.pathname === "/api/v1/recovery") { const status = assessRecoveryQualification(await readJsonFile(config.recoveryReportFile), config.recoveryMaximumAgeMs); return json(response, status.healthy ? 200 : 503, status); }
      if (url.pathname === "/internal/registry") return json(response, 200, registrySnapshot());
      if (url.pathname === "/internal/feed/health") { const health = store.health(config.staleAfterMs), ingestion = assessExporterStatus(await readJsonFile(config.exporterStatusFile), config.staleAfterMs, Date.now(), config.maxExporterLagSlots), healthy = health.healthy && ingestion.healthy; return json(response, healthy ? 200 : 503, { ...health, healthy, ingestion }); }
      if (url.pathname === "/internal/feed/gaps") { const recovery = store.recoveryQuality(); if (!recovery.canonical) return json(response, 503, { schemaVersion: 1, available: false, reason: recovery.reason }); const evidence = await readJsonFile(config.exporterStatusFile), ingestion = assessExporterStatus(evidence, config.staleAfterMs, Date.now(), config.maxExporterLagSlots); return json(response, ingestion.healthy ? 200 : 503, { schemaVersion: 1, available: ingestion.healthy, reason: ingestion.reason, ingestion, durableSkippedSlots: ingestion.healthy ? evidence.durableSkippedSlots : [], reorgCorrections: store.state.reorgCorrections.slice(-100), checkpoint: store.state.checkpoints.inbox ?? null }); }
      if (url.pathname === "/internal/trending") { const window = trendingWindow(url); return json(response, 200, { schemaVersion: 1, window: window.label, scoreVersion: "activity-v1", tokens: store.trending(limit(url), window.seconds) }); }
      if (url.pathname === "/internal/new-pairs") { const rows = Object.entries(store.state.pools).map(([address, row]) => ({ address, ...row })).sort((a, b) => b.lastSlot - a.lastSlot).slice(0, limit(url)); return json(response, 200, { schemaVersion: 1, data: rows }); }
      if (url.pathname === "/internal/candidates") { const window = trendingWindow(url); const data = store.trending(limit(url), window.seconds).map((row) => ({ mint: row.mint, evidence: store.evidence(row.mint, config.staleAfterMs) })); return json(response, 200, { schemaVersion: 1, scoreVersion: "activity-v1", data }); }
      const internalPoolQuote = url.pathname.match(/^\/internal\/pools\/([^/]+)\/quote$/); if (internalPoolQuote) {
        const poolAddress = decodeURIComponent(internalPoolQuote[1]), amountRaw = url.searchParams.get("amountRaw"), inputMint = url.searchParams.get("inputMint"), limitTickText = url.searchParams.get("limitTick"); if (!/^\d+$/.test(amountRaw ?? "") || !inputMint) return json(response, 400, { error: "invalid_quote_parameters" }); const row = store.state.poolSnapshots[poolAddress]; if (!row) return json(response, 404, { error: "pool_snapshot_not_found" });
        const cpmm = row.programId === RAYDIUM_CPMM_PROGRAM, clmm = row.programId === RAYDIUM_CLMM_PROGRAM, pumpSwap = row.programId === PUMP_SWAP_PROGRAM, orca = row.programId === ORCA_WHIRLPOOL_PROGRAM, meteora = row.programId === METEORA_DLMM_PROGRAM; if (!cpmm && !clmm && !pumpSwap && !orca && !meteora) return json(response, 503, { schemaVersion: 1, available: false, automationSafe: false, reason: "unsupported_quote_protocol" }); const concentrated = clmm || orca; if ((concentrated && (!/^-?\d+$/.test(limitTickText ?? "") || !Number.isSafeInteger(Number(limitTickText)))) || (!concentrated && limitTickText != null)) return json(response, 400, { error: "invalid_quote_parameters" });
        const type = cpmm ? "raydium_cpmm_pool_snapshot" : clmm ? "raydium_clmm_pool_snapshot" : pumpSwap ? "pump_swap_pool_snapshot" : orca ? "orca_whirlpool_pool_snapshot" : "meteora_dlmm_pool_snapshot", snapshot = { schemaVersion: 1, type, commitment: row.commitment, stateSlot: row.stateSlot, configSlot: row.configSlot, balanceSlot: row.balanceSlot, observedAt: row.observedAt, pools: [row] };
        try { const quote = cpmm ? quoteCpmmSnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn: amountRaw, staleAfterMs: config.staleAfterMs }) : clmm ? quoteRaydiumSnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn: amountRaw, limitTick: Number(limitTickText), maxAgeMs: config.staleAfterMs }) : pumpSwap ? quotePumpSwapSnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn: amountRaw, staleAfterMs: config.staleAfterMs }) : orca ? quoteOrcaSnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn: amountRaw, limitTick: Number(limitTickText), maxAgeMs: config.staleAfterMs }) : quoteMeteoraDlmmSnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn: amountRaw, staleAfterMs: config.staleAfterMs }); const blockers = ["local_simulation_required", "external_signer_approval_required", "transaction_submission_out_of_scope"]; return json(response, 200, { schemaVersion: 1, available: true, automationSafe: false, executionBoundary: "offline_unsigned_construction_and_read_only_confirmation", constructionAvailable: true, simulationRequired: true, submissionPerformed: false, blockers, quote }); } catch (error) { reportDiagnostic(config, metrics, "pool_quote_failed", error); return json(response, 503, { schemaVersion: 1, available: false, automationSafe: false, reason: "quote_unavailable" }); }
      }
      const evidence = url.pathname.match(/^\/internal\/evidence\/([^/]+)$/); if (evidence) return json(response, 200, store.evidence(decodeURIComponent(evidence[1]), config.staleAfterMs));
      const internalToken = url.pathname.match(/^\/internal\/tokens\/([^/]+)(?:\/(market|security|holders|trades|ohlcv|liquidity|executable-depth))?$/); if (internalToken) {
        const mintAddress = decodeURIComponent(internalToken[1]), view = internalToken[2] ?? "token", token = store.mint(mintAddress, limit(url), config.staleAfterMs), swaps = store.state.swaps.filter((row) => row.inputMint === mintAddress || row.outputMint === mintAddress).sort((a, b) => b.slot - a.slot), poolAddresses = [...new Set(swaps.map((row) => row.pool))];
        if (view === "holders") return json(response, 200, token.observedHolders); if (view === "trades") return json(response, 200, { schemaVersion: 1, data: swaps.slice(0, limit(url)) }); if (view === "liquidity") return json(response, 200, { schemaVersion: 1, pools: poolAddresses.map((address) => ({ address, ...store.pool(address).summary })) }); if (view === "ohlcv") return json(response, 200, { schemaVersion: 1, pools: poolAddresses.map((address) => store.candles(address, candleInterval(url), limit(url))) }); if (view === "market") return json(response, 200, store.evidence(mintAddress, config.staleAfterMs).market); if (view === "security") return json(response, 200, store.tokenSecurity(mintAddress, config.staleAfterMs)); if (view === "executable-depth") { const side = url.searchParams.get("side") ?? "sell"; if (!new Set(["buy", "sell"]).has(side)) return json(response, 400, { error: "invalid_quote_side" }); const quote = side === "buy" ? store.buyRouteQuote(mintAddress, url.searchParams.get("amountRaw"), config.staleAfterMs) : store.sellRouteQuote(mintAddress, url.searchParams.get("amountRaw"), config.staleAfterMs); return json(response, quote.available ? 200 : quote.reason === "invalid_amount" ? 400 : 503, quote); } return json(response, 200, token);
      }
      const internalWallet = url.pathname.match(/^\/internal\/wallets\/([^/]+)(?:\/(performance|profile|funding|funding-cluster))?$/); if (internalWallet) { const address = decodeURIComponent(internalWallet[1]); return json(response, 200, internalWallet[2] === "performance" ? store.walletPerformance(address) : internalWallet[2] === "profile" ? store.walletProfile(address) : internalWallet[2] === "funding" ? store.walletFunding(address, limit(url)) : internalWallet[2] === "funding-cluster" ? store.walletFundingCluster(address, limit(url)) : store.account(address, limit(url))); }
      if (url.pathname === "/api/v1/blocks") {
        const view = store.indexedBlocks(); if (!view.available) return json(response, 503, { schemaVersion: 1, available: false, reason: view.reason });
        return json(response, 200, page(view.data, limit(url), url.searchParams.get("cursor"), (row) => String(row.slot), "blocks:v1"));
      }
      if (url.pathname === "/api/v1/transactions") {
        const view = store.indexedTransactions(); if (!view.available) return json(response, 503, { schemaVersion: 1, available: false, reason: view.reason });
        return json(response, 200, page(view.data, limit(url), url.searchParams.get("cursor"), (row) => `${row.slot}:${row.signature}`, "transactions:v1"));
      }
      if (url.pathname === "/api/v1/swaps") { const view = store.indexedSwaps(); if (!view.available) return json(response, 503, { schemaVersion: 1, available: false, reason: view.reason }); const mint = optionalFilter(url, "mint"), pool = optionalFilter(url, "pool"), protocol = optionalFilter(url, "protocol"), rows = view.data.filter((row) => (!mint || row.inputMint === mint || row.outputMint === mint) && (!pool || row.pool === pool) && (!protocol || row.protocol === protocol)); return json(response, 200, page(rows, limit(url), url.searchParams.get("cursor"), (row) => row.swapId, `swaps:v1:${mint ?? ""}:${pool ?? ""}:${protocol ?? ""}`)); }
      if (url.pathname === "/api/v1/tokens") { const rows = Object.entries(store.state.mints).sort(([left], [right]) => left.localeCompare(right)).map(([address, row]) => tokenCatalogRow(address, row)); return json(response, 200, page(rows, limit(url), url.searchParams.get("cursor"), (row) => row.address, "tokens:v1")); }
      if (url.pathname === "/api/v1/pools") { const protocol = optionalFilter(url, "protocol"), mint = optionalFilter(url, "mint"), status = optionalFilter(url, "status"); if (status && !["active", "completed", "migrated", "unknown"].includes(status)) { const error = new Error("status filter is invalid"); error.code = "BAD_REQUEST"; throw error; } const rows = Object.entries(store.state.pools).filter(([, row]) => (!protocol || row.protocol === protocol || row.destinationProtocol === protocol) && (!mint || row.baseMint === mint || row.quoteMint === mint) && (!status || (row.lifecycleState?.status ?? "unknown") === status)).sort(([left], [right]) => left.localeCompare(right)).map(([address, row]) => poolCatalogRow(address, row)); return json(response, 200, page(rows, limit(url), url.searchParams.get("cursor"), (row) => row.address, `pools:v1:${protocol ?? ""}:${mint ?? ""}:${status ?? ""}`)); }
      const price = url.pathname.match(/^\/api\/v1\/price\/([^/]+)$/); if (price) { const result = store.referencePrice(decodeURIComponent(price[1]), config.staleAfterMs); return json(response, result.available ? 200 : 503, result); }
      const volume = url.pathname.match(/^\/api\/v1\/volume\/([^/]+)$/); if (volume) { const window = trendingWindow(url), result = store.usdVolume(decodeURIComponent(volume[1]), window.seconds ?? 86_400, config.staleAfterMs); return json(response, result.available ? 200 : 503, result); }
      if (url.pathname === "/api/v1/bot/readiness") { const now = Date.now(), readiness = store.botReadiness(config.staleAfterMs, now, url.searchParams.get("pool")), [exporter, checkpoint] = await Promise.all([readJsonFile(config.exporterStatusFile), readJsonFile(config.warehouseCheckpointFile)]), ingestion = assessExporterStatus(exporter, config.staleAfterMs, now, config.maxExporterLagSlots), warehouse = assessWarehouseCheckpoint(checkpoint, store.state.eventSequence, store.state.events[0]?.sequence ?? store.state.eventSequence + 1, config.warehouseStaleAfterMs, config.maxWarehouseLagEvents, now), gated = gateBotReadiness(readiness, ingestion, warehouse); return json(response, gated.ready ? 200 : 503, gated); }
      if (url.pathname === "/api/blocks") { const view = store.indexedBlocks(); return json(response, view.available ? 200 : 503, view.available ? view.data.slice(0, limit(url)) : { schemaVersion: 1, available: false, reason: view.reason }); }
      if (url.pathname === "/api/transactions") { const view = store.indexedTransactions(); return json(response, view.available ? 200 : 503, view.available ? view.data.slice(0, limit(url)) : { schemaVersion: 1, available: false, reason: view.reason }); }
      if (url.pathname === "/api/trending") { const window = trendingWindow(url); return json(response, 200, { asOf: new Date().toISOString(), window: window.label, methodology: "ranked by verified DEX swaps, unique decoded traders, then SPL transfers; no USD volume claim", tokens: store.trending(limit(url), window.seconds) }); }
      const transaction = url.pathname.match(/^\/api\/transaction\/([^/]+)$/); if (transaction) { const view = store.indexedTransactions(); if (!view.available) return json(response, 503, { schemaVersion: 1, available: false, reason: view.reason }); const row = view.data.find((item) => item.signature === decodeURIComponent(transaction[1])); return json(response, row ? 200 : 404, row ?? { error: "not_found" }); }
      const account = url.pathname.match(/^\/api\/account\/([^/]+)$/); if (account) return json(response, 200, store.account(decodeURIComponent(account[1]), limit(url)));
      const mint = url.pathname.match(/^\/api\/mint\/([^/]+)$/); if (mint) return json(response, 200, store.mint(decodeURIComponent(mint[1]), limit(url), config.staleAfterMs));
      const holders = url.pathname.match(/^\/api\/v1\/holders\/([^/]+)$/); if (holders) return json(response, 200, store.holders(decodeURIComponent(holders[1]), limit(url), config.staleAfterMs));
      const tokenAccount = url.pathname.match(/^\/api\/v1\/token-account\/([^/]+)$/); if (tokenAccount) { const row = store.tokenAccount(decodeURIComponent(tokenAccount[1])); return json(response, row ? 200 : 404, row ?? { error: "not_found" }); }
      const pool = url.pathname.match(/^\/api\/v1\/pool\/([^/]+)$/); if (pool) { const row = store.pool(decodeURIComponent(pool[1])); return json(response, row.summary ? 200 : 404, row.summary ? row : { error: "not_found" }); }
      const candles = url.pathname.match(/^\/api\/v1\/candles\/([^/]+)$/); if (candles) return json(response, 200, store.candles(decodeURIComponent(candles[1]), candleInterval(url), limit(url)));
      const risk = url.pathname.match(/^\/api\/v1\/risk\/([^/]+)$/); if (risk) return json(response, 200, store.poolRisk(decodeURIComponent(risk[1]), config.staleAfterMs));
      if (url.pathname === "/" || url.pathname === "/index.html") { const body = await fs.readFile(path.join(PUBLIC, "index.html")); response.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return response.end(body); }
      return json(response, 404, { error: "not_found" });
    } catch (error) { const tooLarge = error.code === "PAYLOAD_TOO_LARGE", badRequest = ["INVALID_CURSOR", "BAD_REQUEST"].includes(error.code), controlled = tooLarge || badRequest; if (!controlled) reportDiagnostic(config, metrics, "http_internal_error", error); return json(response, tooLarge ? 413 : badRequest ? 400 : 500, { error: tooLarge ? "payload_too_large" : error.code === "INVALID_CURSOR" ? "invalid_cursor" : badRequest ? "bad_request" : "internal_error", ...(controlled ? { detail: error.message } : {}) }); }
  });
  server.auditSink = auditSink;
  server.shutdownTimeoutMs = config.shutdownTimeoutMs ?? 30_000;
  server.headersTimeout = config.httpHeadersTimeoutMs ?? 10_000;
  server.requestTimeout = config.httpRequestTimeoutMs ?? 30_000;
  server.keepAliveTimeout = config.httpKeepAliveTimeoutMs ?? 5_000;
  server.maxRequestsPerSocket = config.httpMaxRequestsPerSocket ?? 1_000;
  return attachWebSocket(server, store, config, (request) => config.apiTenants ? Boolean(resolveApiTenant(config.apiTenants, presentedApiKey(request))) : !(config.apiKeys ?? []).length || keyMatches(presentedApiKey(request), config.apiKeys));
}
