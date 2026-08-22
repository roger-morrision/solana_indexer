import crypto from "node:crypto";
import { durableAppendFile } from "./durable-file.js";

const DYNAMIC_ROUTES = [
  [/^\/api\/v1\/(price|volume|holders|token-account|pool|candles|risk)\/[^/]+$/, "/api/v1/$1/:id"],
  [/^\/api\/(transaction|account|mint)\/[^/]+$/, "/api/$1/:id"],
  [/^\/internal\/evidence\/[^/]+$/, "/internal/evidence/:id"],
  [/^\/internal\/tokens\/[^/]+$/, "/internal/tokens/:id"],
  [/^\/internal\/tokens\/[^/]+\/(market|security|holders|trades|ohlcv|liquidity|executable-depth|prepare-swap)$/, "/internal/tokens/:id/$1"],
  [/^\/internal\/wallets\/[^/]+$/, "/internal/wallets/:id"],
  [/^\/internal\/wallets\/[^/]+\/(performance|profile|funding|funding-cluster)$/, "/internal/wallets/:id/$1"],
  [/^\/internal\/pools\/[^/]+\/(quote|prepare-swap)$/, "/internal/pools/:id/$1"]
];
const STATIC_ROUTES = new Set(["/", "/index.html", "/rpc", "/metrics", "/api/health", "/api/stats", "/api/trending", "/api/blocks", "/api/transactions", "/api/v1/blocks", "/api/v1/transactions", "/api/v1/swaps", "/api/v1/tokens", "/api/v1/pools", "/api/v1/bot/readiness", "/api/v1/ingestion", "/api/v1/warehouse", "/api/v1/backup", "/api/v1/recovery", "/internal/registry", "/internal/feed/health", "/internal/feed/gaps", "/internal/trending", "/internal/candidates", "/internal/new-pairs", "/internal/execution-policy"]);

export function normalizeAuditRoute(value) {
  if (typeof value !== "string" || !value.startsWith("/") || Buffer.byteLength(value) > 2_048 || /[?\u0000-\u001f\u007f]/.test(value)) throw new Error("audit route is invalid");
  if (STATIC_ROUTES.has(value)) return value;
  for (const [pattern, replacement] of DYNAMIC_ROUTES) if (pattern.test(value)) return value.replace(pattern, replacement);
  if (value.startsWith("/api/")) return "/api/:unmatched";
  if (value.startsWith("/internal/")) return "/internal/:unmatched";
  return "/:unmatched";
}

export class ApiAuditSink {
  constructor(filename) { this.filename = filename; this.pending = Promise.resolve(); this.failures = 0; }
  record(entry) {
    if (!this.filename) return;
    const line = `${JSON.stringify({ schemaVersion: 1, ...entry })}\n`;
    this.pending = this.pending.then(() => durableAppendFile(this.filename, line)).catch(() => { this.failures++; });
  }
  async flush() { await this.pending; }
}

export function auditIdentity(apiKey, remoteAddress) {
  const scope = apiKey ? `key:${apiKey}` : `local:${remoteAddress ?? "unknown"}`;
  return crypto.createHash("sha256").update(scope).digest("hex");
}
