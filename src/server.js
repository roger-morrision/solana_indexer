import fs from "node:fs/promises";
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { attachWebSocket } from "./websocket.js";
import { registrySnapshot } from "./program-registry.js";
import { assessExporterStatus } from "./exporter-health.js";
import { ApiAuditSink, auditIdentity } from "./api-audit.js";
import { resolveApiTenant } from "./api-tenants.js";
import { assessWarehouseCheckpoint } from "./warehouse-sync.js";
import { quoteRaydiumSnapshotExactInput } from "./clmm-math.js";

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
function json(response, status, value, headers = {}) { const body = JSON.stringify(value); response.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store", "x-api-version": "1", ...headers }); response.end(body); }
function limit(url) { return Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 100)); }
function trendingWindow(url) { const value = url.searchParams.get("window") ?? "1h"; const windows = { "5m": 300, "1h": 3600, "6h": 21_600, "24h": 86_400, all: null }; if (!(value in windows)) { const error = new Error("window must be 5m, 1h, 6h, 24h, or all"); error.code = "BAD_REQUEST"; throw error; } return { label: value, seconds: windows[value] }; }
function candleInterval(url) { const value = Number(url.searchParams.get("interval") ?? 60); if (![60, 300, 900, 3600, 14_400, 86_400].includes(value)) { const error = new Error("interval must be 60, 300, 900, 3600, 14400, or 86400 seconds"); error.code = "BAD_REQUEST"; throw error; } return value; }
function encodeCursor(value) { return Buffer.from(JSON.stringify(value)).toString("base64url"); }
function decodeCursor(value) {
  if (!value) return null;
  try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")); }
  catch { const error = new Error("cursor must be valid base64url JSON"); error.code = "INVALID_CURSOR"; throw error; }
}
function page(rows, size, cursor, key) {
  const decoded = decodeCursor(cursor);
  const start = decoded == null ? 0 : rows.findIndex((row) => key(row) === decoded.key) + 1;
  if (decoded != null && start === 0) { const error = new Error("cursor does not reference a retained record"); error.code = "INVALID_CURSOR"; throw error; }
  const data = rows.slice(start, start + size);
  const hasMore = start + data.length < rows.length;
  return { data, nextCursor: hasMore && data.length ? encodeCursor({ key: key(data.at(-1)) }) : null };
}
async function readJsonFile(filename) { if (!filename) return null; try { return JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return null; throw error; } }
async function readJsonBody(request, maximum = 65_536) {
  const chunks = []; let size = 0;
  for await (const chunk of request) { size += chunk.length; if (size > maximum) { const error = new Error("request body exceeds 64 KiB"); error.code = "BAD_REQUEST"; throw error; } chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { const error = new Error("request body must be valid JSON"); error.code = "BAD_REQUEST"; throw error; }
}
function rpcResult(id, result) { return { jsonrpc: "2.0", id: id ?? null, result }; }
function rpcError(id, code, message) { return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }; }
export function gateBotReadiness(readiness, ingestion, warehouse) { const missing = [...new Set([...(readiness?.missing ?? []), ...(!ingestion?.healthy ? ["ingestionHealth"] : []), ...(!warehouse?.healthy ? ["warehouseHealth"] : [])])], dependenciesHealthy = Boolean(ingestion?.healthy && warehouse?.healthy), ready = Boolean(readiness?.ready && dependenciesHealthy); return { ...readiness, schemaVersion: 2, ready, reason: ready ? null : readiness?.ready ? "dependency_unhealthy" : readiness?.reason ?? "market_readiness_unavailable", missing, dependencies: { ingestion: { healthy: Boolean(ingestion?.healthy), reason: ingestion?.reason ?? null, ageMs: ingestion?.ageMs ?? null, lagSlots: ingestion?.lagSlots ?? null }, warehouse: { healthy: Boolean(warehouse?.healthy), reason: warehouse?.reason ?? null, ageMs: warehouse?.ageMs ?? null, lagEvents: warehouse?.lagEvents ?? null } } }; }
function dispatchRpc(payload, config, store) {
  if (!payload || payload.jsonrpc !== "2.0" || typeof payload.method !== "string" || !("id" in payload)) return rpcError(payload?.id, -32600, "Invalid Request");
  if (payload.method === "getIndexerHealth") return rpcResult(payload.id, store.health(config.staleAfterMs));
  if (payload.method === "getIndexerStats") return rpcResult(payload.id, { ...store.stats(), chain: store.chainQuality() });
  if (payload.method === "getIndexedBlock") {
    const slot = Array.isArray(payload.params) ? payload.params[0] : payload.params?.slot;
    if (!Number.isSafeInteger(slot) || slot < 0) return rpcError(payload.id, -32602, "Invalid params");
    const block = store.state.blocks[String(slot)]; return rpcResult(payload.id, block ? { slot, ...block } : null);
  }
  if (payload.method === "getIndexedBlocks") {
    const params = payload.params == null ? {} : Array.isArray(payload.params) ? { limit: payload.params[0], cursor: payload.params[1] } : payload.params;
    if (!params || typeof params !== "object" || Array.isArray(params)) return rpcError(payload.id, -32602, "Invalid params");
    const size = params.limit ?? 100, cursor = params.cursor ?? null; if (!Number.isInteger(size) || size < 1 || size > 500 || (cursor !== null && typeof cursor !== "string")) return rpcError(payload.id, -32602, "Invalid params");
    const rows = Object.entries(store.state.blocks).map(([slot, row]) => ({ slot: Number(slot), ...row })).sort((a, b) => b.slot - a.slot); try { return rpcResult(payload.id, page(rows, size, cursor, (row) => String(row.slot))); } catch { return rpcError(payload.id, -32602, "Invalid params"); }
  }
  if (payload.method === "getIndexedTransaction") {
    const signature = Array.isArray(payload.params) ? payload.params[0] : payload.params?.signature;
    if (typeof signature !== "string" || !signature) return rpcError(payload.id, -32602, "Invalid params");
    return rpcResult(payload.id, store.transaction(signature));
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
function prometheus(metrics, store, staleAfterMs, exporter, maxExporterLagSlots, warehouseCheckpoint, warehouseStaleAfterMs, maxWarehouseLagEvents, auditFailures = 0) {
  const health = store.health(staleAfterMs), exporterStatus = assessExporterStatus(exporter, staleAfterMs, Date.now(), maxExporterLagSlots), warehouseStatus = assessWarehouseCheckpoint(warehouseCheckpoint, store.state.eventSequence, store.state.events[0]?.sequence ?? store.state.eventSequence + 1, warehouseStaleAfterMs, maxWarehouseLagEvents), stats = store.stats(), lines = [
    "# HELP terminal_dex_http_requests_total HTTP requests handled by status class.",
    "# TYPE terminal_dex_http_requests_total counter",
    ...Object.entries(metrics.statusClasses).map(([status, count]) => `terminal_dex_http_requests_total{status_class="${status}"} ${count}`),
    "# HELP terminal_dex_http_request_duration_seconds_sum Total HTTP request duration.",
    "# TYPE terminal_dex_http_request_duration_seconds_sum counter",
    `terminal_dex_http_request_duration_seconds_sum ${metrics.durationMs / 1000}`,
    "# HELP terminal_dex_http_request_duration_seconds_count Timed HTTP requests.",
    "# TYPE terminal_dex_http_request_duration_seconds_count counter",
    `terminal_dex_http_request_duration_seconds_count ${metrics.requests}`,
    "# HELP terminal_dex_index_healthy Whether the canonical index meets freshness and chain checks.",
    "# TYPE terminal_dex_index_healthy gauge",
    `terminal_dex_index_healthy ${health.healthy ? 1 : 0}`,
    "# HELP terminal_dex_index_age_seconds Age of the newest indexed block.",
    "# TYPE terminal_dex_index_age_seconds gauge",
    `terminal_dex_index_age_seconds ${health.ageMs == null ? "NaN" : health.ageMs / 1000}`,
    "# TYPE terminal_dex_exporter_healthy gauge", `terminal_dex_exporter_healthy ${exporterStatus.healthy ? 1 : 0}`,
    "# TYPE terminal_dex_exporter_age_seconds gauge", `terminal_dex_exporter_age_seconds ${exporterStatus.ageMs == null ? "NaN" : exporterStatus.ageMs / 1000}`,
    "# TYPE terminal_dex_exporter_lag_slots gauge", `terminal_dex_exporter_lag_slots ${exporterStatus.lagSlots ?? "NaN"}`,
    "# TYPE terminal_dex_exporter_consecutive_failures gauge", `terminal_dex_exporter_consecutive_failures ${exporterStatus.consecutiveFailures}`,
    "# TYPE terminal_dex_warehouse_healthy gauge", `terminal_dex_warehouse_healthy ${warehouseStatus.healthy ? 1 : 0}`,
    "# TYPE terminal_dex_warehouse_age_seconds gauge", `terminal_dex_warehouse_age_seconds ${warehouseStatus.ageMs == null ? "NaN" : warehouseStatus.ageMs / 1000}`,
    "# TYPE terminal_dex_warehouse_lag_events gauge", `terminal_dex_warehouse_lag_events ${warehouseStatus.lagEvents ?? "NaN"}`,
    "# TYPE terminal_dex_index_tip_slot gauge", `terminal_dex_index_tip_slot ${stats.tip ?? "NaN"}`,
    "# TYPE terminal_dex_dead_letters gauge", `terminal_dex_dead_letters ${stats.unresolvedDeadLetters}`,
    "# TYPE terminal_dex_reorg_corrections_total counter", `terminal_dex_reorg_corrections_total ${stats.reorgCorrections}`,
    "# TYPE terminal_dex_indexed_swaps gauge", `terminal_dex_indexed_swaps ${stats.swaps}`,
    "# TYPE terminal_dex_api_audit_failures_total counter", `terminal_dex_api_audit_failures_total ${auditFailures}`,
    "# TYPE terminal_dex_distributed_quota_failures_total counter", `terminal_dex_distributed_quota_failures_total ${metrics.distributedQuotaFailures}`,
  ]; return `${lines.join("\n")}\n`;
}

export function createServer(config, store) {
  const quotas = new Map(), metrics = { requests: 0, durationMs: 0, distributedQuotaFailures: 0, statusClasses: { "2xx": 0, "4xx": 0, "5xx": 0 } }, auditSink = new ApiAuditSink(config.auditLogFile);
  const server = http.createServer(async (request, response) => {
    const started = process.hrtime.bigint(), presented = presentedApiKey(request), identity = auditIdentity(presented, request.socket.remoteAddress), tenant = resolveApiTenant(config.apiTenants, presented); let auditPath = null, auditUnits = 1;
    response.once("finish", () => { const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000; metrics.requests++; metrics.durationMs += durationMs; const key = `${Math.floor(response.statusCode / 100)}xx`; metrics.statusClasses[key] = (metrics.statusClasses[key] ?? 0) + 1; if (auditPath) auditSink.record({ observedAt: new Date().toISOString(), identityHash: identity, tenantId: tenant?.id ?? null, plan: tenant?.plan ?? null, retentionDays: tenant?.retentionDays ?? config.auditRetentionDays ?? 30, method: request.method, path: auditPath, statusCode: response.statusCode, durationMs: Math.round(durationMs * 1_000) / 1_000, quotaUnits: auditUnits }); });
    try {
      const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
      auditPath = url.pathname;
      const protectedRoute = url.pathname === "/rpc" || url.pathname === "/metrics" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/internal/");
      const apiKeys = config.apiKeys ?? [];
      if (protectedRoute && config.auditLogFile && auditSink.failures > 0) return json(response, 503, { error: "audit_sink_unavailable" });
      if (protectedRoute && config.apiTenants && !tenant) return json(response, 401, { error: "unauthorized" }, { "www-authenticate": "Bearer" });
      if (protectedRoute && !config.apiTenants && apiKeys.length && !keyMatches(presented, apiKeys)) return json(response, 401, { error: "unauthorized" }, { "www-authenticate": "Bearer" });
      let rpcPayload = null; if (request.method === "POST" && url.pathname === "/rpc") rpcPayload = await readJsonBody(request); const requestWeight = Array.isArray(rpcPayload) && rpcPayload.length >= 1 && rpcPayload.length <= 100 ? rpcPayload.length : 1; auditUnits = requestWeight;
      const requestLimit = tenant?.rateLimitPerMinute ?? config.rateLimitPerMinute;
      if (protectedRoute && requestLimit) {
        const quotaIdentity = tenant?.id ?? (apiKeys.length ? identity : request.socket.remoteAddress ?? "unknown");
        let quota; if (config.distributedQuotaEnabled) { if (typeof config.quotaAdmitter !== "function") { metrics.distributedQuotaFailures++; return json(response, 503, { error: "distributed_quota_unavailable" }); } try { quota = await config.quotaAdmitter(quotaIdentity, requestLimit, Date.now(), requestWeight); } catch { metrics.distributedQuotaFailures++; return json(response, 503, { error: "distributed_quota_unavailable" }); } if (!quota || !Number.isSafeInteger(quota.count) || quota.count < 1 || !Number.isSafeInteger(quota.remaining) || quota.remaining < 0 || !Number.isInteger(quota.retryAfterSeconds) || quota.retryAfterSeconds < 1) { metrics.distributedQuotaFailures++; return json(response, 503, { error: "distributed_quota_invalid_response" }); } } else { const window = Math.floor(Date.now() / 60_000), prior = quotas.get(quotaIdentity); quota = prior?.window === window ? prior : { window, count: 0 }; quota.count += requestWeight; quota.remaining = Math.max(0, requestLimit - quota.count); quota.retryAfterSeconds = 60 - (Math.floor(Date.now() / 1000) % 60); quotas.set(quotaIdentity, quota); }
        const remaining = quota.remaining;
        response.setHeader("x-ratelimit-limit", requestLimit); response.setHeader("x-ratelimit-remaining", remaining); if (tenant) { response.setHeader("x-tenant-plan", tenant.plan); response.setHeader("x-retention-days", tenant.retentionDays); }
        if (quota.count > requestLimit) return json(response, 429, { error: "rate_limit_exceeded" }, { "retry-after": String(quota.retryAfterSeconds) });
      }
      if (request.method === "POST" && url.pathname === "/rpc") return json(response, 200, dispatchRpcEnvelope(rpcPayload, config, store));
      if (request.method !== "GET") return json(response, 405, { error: "method_not_allowed" });
      if (url.pathname === "/metrics") { const [exporter, warehouseCheckpoint] = await Promise.all([readJsonFile(config.exporterStatusFile), readJsonFile(config.warehouseCheckpointFile)]), body = prometheus(metrics, store, config.staleAfterMs, exporter, config.maxExporterLagSlots, warehouseCheckpoint, config.warehouseStaleAfterMs, config.maxWarehouseLagEvents, auditSink.failures); response.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store" }); return response.end(body); }
      if (url.pathname === "/api/health") { const health = { network: "offline-local", ...store.health(config.staleAfterMs) }; return json(response, health.healthy ? 200 : 503, health); }
      if (url.pathname === "/api/stats") return json(response, 200, { ...store.stats(), chain: store.chainQuality() });
      if (url.pathname === "/api/v1/ingestion") {
        const exporter = await readJsonFile(config.exporterStatusFile);
        const status = assessExporterStatus(exporter, config.staleAfterMs, Date.now(), config.maxExporterLagSlots), payload = { ...status, exporter, index: store.stats().ingestion };
        return json(response, status.healthy ? 200 : 503, payload);
      }
      if (url.pathname === "/api/v1/warehouse") { const checkpoint = await readJsonFile(config.warehouseCheckpointFile), status = assessWarehouseCheckpoint(checkpoint, store.state.eventSequence, store.state.events[0]?.sequence ?? store.state.eventSequence + 1, config.warehouseStaleAfterMs, config.maxWarehouseLagEvents); return json(response, status.healthy ? 200 : 503, status); }
      if (url.pathname === "/internal/registry") return json(response, 200, registrySnapshot());
      if (url.pathname === "/internal/feed/health") { const health = store.health(config.staleAfterMs); return json(response, health.healthy ? 200 : 503, { ...health, ingestion: await readJsonFile(config.exporterStatusFile), deadLetters: store.state.deadLetters.length, unresolvedDeadLetters: store.state.deadLetters.filter((row) => !row.resolved).length }); }
      if (url.pathname === "/internal/feed/gaps") { const ingestion = await readJsonFile(config.exporterStatusFile); return json(response, ingestion ? 200 : 503, { available: Boolean(ingestion), durableSkippedSlots: ingestion?.durableSkippedSlots ?? [], reorgCorrections: store.state.reorgCorrections.slice(-100), checkpoint: store.state.checkpoints.inbox ?? null }); }
      if (url.pathname === "/internal/trending") { const window = trendingWindow(url); return json(response, 200, { schemaVersion: 1, window: window.label, scoreVersion: "activity-v1", tokens: store.trending(limit(url), window.seconds) }); }
      if (url.pathname === "/internal/new-pairs") { const rows = Object.entries(store.state.pools).map(([address, row]) => ({ address, ...row })).sort((a, b) => b.lastSlot - a.lastSlot).slice(0, limit(url)); return json(response, 200, { schemaVersion: 1, data: rows }); }
      if (url.pathname === "/internal/candidates") { const window = trendingWindow(url); const data = store.trending(limit(url), window.seconds).map((row) => ({ mint: row.mint, evidence: store.evidence(row.mint, config.staleAfterMs) })); return json(response, 200, { schemaVersion: 1, scoreVersion: "activity-v1", data }); }
      const internalPoolQuote = url.pathname.match(/^\/internal\/pools\/([^/]+)\/quote$/); if (internalPoolQuote) { const poolAddress = decodeURIComponent(internalPoolQuote[1]), amountRaw = url.searchParams.get("amountRaw"), inputMint = url.searchParams.get("inputMint"), limitTickText = url.searchParams.get("limitTick"); if (!/^\d+$/.test(amountRaw ?? "") || !inputMint || !/^-?\d+$/.test(limitTickText ?? "") || !Number.isSafeInteger(Number(limitTickText))) return json(response, 400, { error: "invalid_quote_parameters" }); const row = store.state.poolSnapshots[poolAddress]; if (!row) return json(response, 404, { error: "pool_snapshot_not_found" }); const snapshot = { schemaVersion: 1, type: "raydium_clmm_pool_snapshot", commitment: row.commitment, stateSlot: row.stateSlot, balanceSlot: row.balanceSlot, observedAt: row.observedAt, pools: [row] }; try { const quote = quoteRaydiumSnapshotExactInput({ snapshot, poolAddress, inputMint, amountIn: amountRaw, limitTick: Number(limitTickText), maxAgeMs: config.staleAfterMs }); return json(response, 200, { schemaVersion: 1, available: true, automationSafe: false, blockers: ["local_simulation_required", "transaction_construction_unavailable", "landed_confirmation_unavailable"], quote }); } catch (error) { return json(response, 503, { schemaVersion: 1, available: false, automationSafe: false, reason: error.message }); } }
      const evidence = url.pathname.match(/^\/internal\/evidence\/([^/]+)$/); if (evidence) return json(response, 200, store.evidence(decodeURIComponent(evidence[1]), config.staleAfterMs));
      const internalToken = url.pathname.match(/^\/internal\/tokens\/([^/]+)(?:\/(market|security|holders|trades|ohlcv|liquidity|executable-depth))?$/); if (internalToken) {
        const mintAddress = decodeURIComponent(internalToken[1]), view = internalToken[2] ?? "token", token = store.mint(mintAddress, limit(url), config.staleAfterMs), swaps = store.state.swaps.filter((row) => row.inputMint === mintAddress || row.outputMint === mintAddress).sort((a, b) => b.slot - a.slot), poolAddresses = [...new Set(swaps.map((row) => row.pool))];
        if (view === "holders") return json(response, 200, token.observedHolders); if (view === "trades") return json(response, 200, { schemaVersion: 1, data: swaps.slice(0, limit(url)) }); if (view === "liquidity") return json(response, 200, { schemaVersion: 1, pools: poolAddresses.map((address) => ({ address, ...store.pool(address).summary })) }); if (view === "ohlcv") return json(response, 200, { schemaVersion: 1, pools: poolAddresses.map((address) => store.candles(address, candleInterval(url), limit(url))) }); if (view === "market") return json(response, 200, store.evidence(mintAddress, config.staleAfterMs).market); if (view === "security") return json(response, 200, store.tokenSecurity(mintAddress, config.staleAfterMs)); if (view === "executable-depth") { const quote = store.sellRouteQuote(mintAddress, url.searchParams.get("amountRaw"), config.staleAfterMs); return json(response, quote.available ? 200 : quote.reason === "invalid_amount" ? 400 : 503, quote); } return json(response, 200, token);
      }
      const internalWallet = url.pathname.match(/^\/internal\/wallets\/([^/]+)(?:\/(performance|profile))?$/); if (internalWallet) { const address = decodeURIComponent(internalWallet[1]); return json(response, 200, internalWallet[2] === "performance" ? store.walletPerformance(address) : internalWallet[2] === "profile" ? store.walletProfile(address) : store.account(address, limit(url))); }
      if (url.pathname === "/api/v1/blocks") {
        const rows = Object.entries(store.state.blocks).map(([slot, row]) => ({ slot: Number(slot), ...row })).sort((a, b) => b.slot - a.slot);
        return json(response, 200, page(rows, limit(url), url.searchParams.get("cursor"), (row) => String(row.slot)));
      }
      if (url.pathname === "/api/v1/transactions") {
        const rows = Object.values(store.state.transactions).sort((a, b) => b.slot - a.slot || a.signature.localeCompare(b.signature));
        return json(response, 200, page(rows, limit(url), url.searchParams.get("cursor"), (row) => `${row.slot}:${row.signature}`));
      }
      if (url.pathname === "/api/v1/swaps") { const mint = url.searchParams.get("mint"), pool = url.searchParams.get("pool"), protocol = url.searchParams.get("protocol"); const rows = store.state.swaps.filter((row) => (!mint || row.inputMint === mint || row.outputMint === mint) && (!pool || row.pool === pool) && (!protocol || row.protocol === protocol)).sort((a, b) => b.slot - a.slot || a.signature.localeCompare(b.signature) || a.eventIndex - b.eventIndex); return json(response, 200, page(rows, limit(url), url.searchParams.get("cursor"), (row) => row.swapId)); }
      const price = url.pathname.match(/^\/api\/v1\/price\/([^/]+)$/); if (price) { const result = store.referencePrice(decodeURIComponent(price[1]), config.staleAfterMs); return json(response, result.available ? 200 : 503, result); }
      const volume = url.pathname.match(/^\/api\/v1\/volume\/([^/]+)$/); if (volume) { const window = trendingWindow(url), result = store.usdVolume(decodeURIComponent(volume[1]), window.seconds ?? 86_400, config.staleAfterMs); return json(response, result.available ? 200 : 503, result); }
      if (url.pathname === "/api/v1/bot/readiness") { const now = Date.now(), readiness = store.botReadiness(config.staleAfterMs, now, url.searchParams.get("pool")), [exporter, checkpoint] = await Promise.all([readJsonFile(config.exporterStatusFile), readJsonFile(config.warehouseCheckpointFile)]), ingestion = assessExporterStatus(exporter, config.staleAfterMs, now, config.maxExporterLagSlots), warehouse = assessWarehouseCheckpoint(checkpoint, store.state.eventSequence, store.state.events[0]?.sequence ?? store.state.eventSequence + 1, config.warehouseStaleAfterMs, config.maxWarehouseLagEvents, now), gated = gateBotReadiness(readiness, ingestion, warehouse); return json(response, gated.ready ? 200 : 503, gated); }
      if (url.pathname === "/api/blocks") return json(response, 200, Object.entries(store.state.blocks).map(([slot, row]) => ({ slot: Number(slot), ...row })).sort((a, b) => b.slot - a.slot).slice(0, limit(url)));
      if (url.pathname === "/api/transactions") return json(response, 200, Object.values(store.state.transactions).sort((a, b) => b.slot - a.slot).slice(0, limit(url)));
      if (url.pathname === "/api/trending") { const window = trendingWindow(url); return json(response, 200, { asOf: new Date().toISOString(), window: window.label, methodology: "ranked by verified DEX swaps, unique decoded traders, then SPL transfers; no USD volume claim", tokens: store.trending(limit(url), window.seconds) }); }
      const transaction = url.pathname.match(/^\/api\/transaction\/([^/]+)$/); if (transaction) { const row = store.transaction(decodeURIComponent(transaction[1])); return json(response, row ? 200 : 404, row ?? { error: "not_found" }); }
      const account = url.pathname.match(/^\/api\/account\/([^/]+)$/); if (account) return json(response, 200, store.account(decodeURIComponent(account[1]), limit(url)));
      const mint = url.pathname.match(/^\/api\/mint\/([^/]+)$/); if (mint) return json(response, 200, store.mint(decodeURIComponent(mint[1]), limit(url), config.staleAfterMs));
      const holders = url.pathname.match(/^\/api\/v1\/holders\/([^/]+)$/); if (holders) return json(response, 200, store.holders(decodeURIComponent(holders[1]), limit(url), config.staleAfterMs));
      const tokenAccount = url.pathname.match(/^\/api\/v1\/token-account\/([^/]+)$/); if (tokenAccount) { const row = store.tokenAccount(decodeURIComponent(tokenAccount[1])); return json(response, row ? 200 : 404, row ?? { error: "not_found" }); }
      const pool = url.pathname.match(/^\/api\/v1\/pool\/([^/]+)$/); if (pool) { const row = store.pool(decodeURIComponent(pool[1])); return json(response, row.summary ? 200 : 404, row.summary ? row : { error: "not_found" }); }
      const candles = url.pathname.match(/^\/api\/v1\/candles\/([^/]+)$/); if (candles) return json(response, 200, store.candles(decodeURIComponent(candles[1]), candleInterval(url), limit(url)));
      const risk = url.pathname.match(/^\/api\/v1\/risk\/([^/]+)$/); if (risk) return json(response, 200, store.poolRisk(decodeURIComponent(risk[1]), config.staleAfterMs));
      if (url.pathname === "/" || url.pathname === "/index.html") { const body = await fs.readFile(path.join(PUBLIC, "index.html")); response.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return response.end(body); }
      return json(response, 404, { error: "not_found" });
    } catch (error) { const badRequest = ["INVALID_CURSOR", "BAD_REQUEST"].includes(error.code); return json(response, badRequest ? 400 : 500, { error: error.code === "INVALID_CURSOR" ? "invalid_cursor" : badRequest ? "bad_request" : "internal_error", detail: error.message }); }
  });
  server.auditSink = auditSink;
  return attachWebSocket(server, store, config, (request) => config.apiTenants ? Boolean(resolveApiTenant(config.apiTenants, presentedApiKey(request))) : !(config.apiKeys ?? []).length || keyMatches(presentedApiKey(request), config.apiKeys));
}
