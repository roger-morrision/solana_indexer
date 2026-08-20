import fs from "node:fs/promises";
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
function json(response, status, value, headers = {}) { const body = JSON.stringify(value); response.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store", "x-api-version": "1", ...headers }); response.end(body); }
function limit(url) { return Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 100)); }
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
function dispatchRpc(payload, config, store) {
  if (!payload || payload.jsonrpc !== "2.0" || typeof payload.method !== "string" || !("id" in payload)) return rpcError(payload?.id, -32600, "Invalid Request");
  if (payload.method === "getIndexerHealth") return rpcResult(payload.id, store.health(config.staleAfterMs));
  if (payload.method === "getIndexerStats") return rpcResult(payload.id, { ...store.stats(), chain: store.chainQuality() });
  if (payload.method === "getIndexedTransaction") {
    const signature = Array.isArray(payload.params) ? payload.params[0] : payload.params?.signature;
    if (typeof signature !== "string" || !signature) return rpcError(payload.id, -32602, "Invalid params");
    return rpcResult(payload.id, store.transaction(signature));
  }
  return rpcError(payload.id, -32601, "Method not found");
}
function presentedApiKey(request) {
  const bearer = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  return String(request.headers["x-api-key"] ?? bearer ?? "");
}
function keyMatches(presented, configured) {
  if (!presented) return false;
  const candidate = crypto.createHash("sha256").update(presented).digest();
  return configured.some((key) => crypto.timingSafeEqual(candidate, crypto.createHash("sha256").update(key).digest()));
}

export function createServer(config, store) {
  const quotas = new Map();
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
      const protectedRoute = url.pathname === "/rpc" || url.pathname.startsWith("/api/");
      const apiKeys = config.apiKeys ?? [];
      if (protectedRoute && apiKeys.length && !keyMatches(presentedApiKey(request), apiKeys)) return json(response, 401, { error: "unauthorized" }, { "www-authenticate": "Bearer" });
      if (protectedRoute && config.rateLimitPerMinute) {
        const identity = apiKeys.length ? crypto.createHash("sha256").update(presentedApiKey(request)).digest("hex") : request.socket.remoteAddress ?? "unknown";
        const window = Math.floor(Date.now() / 60_000); const prior = quotas.get(identity); const quota = prior?.window === window ? prior : { window, count: 0 }; quota.count++; quotas.set(identity, quota);
        const remaining = Math.max(0, config.rateLimitPerMinute - quota.count);
        response.setHeader("x-ratelimit-limit", config.rateLimitPerMinute); response.setHeader("x-ratelimit-remaining", remaining);
        if (quota.count > config.rateLimitPerMinute) return json(response, 429, { error: "rate_limit_exceeded" }, { "retry-after": String(60 - (Math.floor(Date.now() / 1000) % 60)) });
      }
      if (request.method === "POST" && url.pathname === "/rpc") return json(response, 200, dispatchRpc(await readJsonBody(request), config, store));
      if (request.method !== "GET") return json(response, 405, { error: "method_not_allowed" });
      if (url.pathname === "/api/health") { const health = { network: "offline-local", ...store.health(config.staleAfterMs) }; return json(response, health.healthy ? 200 : 503, health); }
      if (url.pathname === "/api/stats") return json(response, 200, { ...store.stats(), chain: store.chainQuality() });
      if (url.pathname === "/api/v1/ingestion") {
        const exporter = await readJsonFile(config.exporterStatusFile);
        const payload = { available: exporter != null, exporter, index: store.stats().ingestion };
        return json(response, exporter ? 200 : 503, payload);
      }
      if (url.pathname === "/api/v1/blocks") {
        const rows = Object.entries(store.state.blocks).map(([slot, row]) => ({ slot: Number(slot), ...row })).sort((a, b) => b.slot - a.slot);
        return json(response, 200, page(rows, limit(url), url.searchParams.get("cursor"), (row) => String(row.slot)));
      }
      if (url.pathname === "/api/v1/transactions") {
        const rows = Object.values(store.state.transactions).sort((a, b) => b.slot - a.slot || a.signature.localeCompare(b.signature));
        return json(response, 200, page(rows, limit(url), url.searchParams.get("cursor"), (row) => `${row.slot}:${row.signature}`));
      }
      if (url.pathname === "/api/v1/bot/readiness") { const readiness = store.botReadiness(config.staleAfterMs); return json(response, readiness.ready ? 200 : 503, readiness); }
      if (url.pathname === "/api/blocks") return json(response, 200, Object.entries(store.state.blocks).map(([slot, row]) => ({ slot: Number(slot), ...row })).sort((a, b) => b.slot - a.slot).slice(0, limit(url)));
      if (url.pathname === "/api/transactions") return json(response, 200, Object.values(store.state.transactions).sort((a, b) => b.slot - a.slot).slice(0, limit(url)));
      if (url.pathname === "/api/trending") return json(response, 200, { methodology: "ranked by indexed SPL transfer count; no price or trading claim", tokens: store.trending(limit(url)) });
      const transaction = url.pathname.match(/^\/api\/transaction\/([^/]+)$/); if (transaction) { const row = store.transaction(decodeURIComponent(transaction[1])); return json(response, row ? 200 : 404, row ?? { error: "not_found" }); }
      const account = url.pathname.match(/^\/api\/account\/([^/]+)$/); if (account) return json(response, 200, store.account(decodeURIComponent(account[1]), limit(url)));
      const mint = url.pathname.match(/^\/api\/mint\/([^/]+)$/); if (mint) return json(response, 200, store.mint(decodeURIComponent(mint[1]), limit(url)));
      if (url.pathname === "/" || url.pathname === "/index.html") { const body = await fs.readFile(path.join(PUBLIC, "index.html")); response.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return response.end(body); }
      return json(response, 404, { error: "not_found" });
    } catch (error) { const badRequest = ["INVALID_CURSOR", "BAD_REQUEST"].includes(error.code); return json(response, badRequest ? 400 : 500, { error: error.code === "INVALID_CURSOR" ? "invalid_cursor" : badRequest ? "bad_request" : "internal_error", detail: error.message }); }
  });
}
