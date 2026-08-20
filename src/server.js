import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
function json(response, status, value) { const body = JSON.stringify(value); response.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store", "x-api-version": "1" }); response.end(body); }
function limit(url) { return Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 100)); }

export function createServer(config, store) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
      if (request.method !== "GET") return json(response, 405, { error: "method_not_allowed" });
      if (url.pathname === "/api/health") { const health = { network: "offline-local", ...store.health(config.staleAfterMs) }; return json(response, health.healthy ? 200 : 503, health); }
      if (url.pathname === "/api/stats") return json(response, 200, { ...store.stats(), chain: store.chainQuality() });
      if (url.pathname === "/api/blocks") return json(response, 200, Object.entries(store.state.blocks).map(([slot, row]) => ({ slot: Number(slot), ...row })).sort((a, b) => b.slot - a.slot).slice(0, limit(url)));
      if (url.pathname === "/api/transactions") return json(response, 200, Object.values(store.state.transactions).sort((a, b) => b.slot - a.slot).slice(0, limit(url)));
      if (url.pathname === "/api/trending") return json(response, 200, { methodology: "ranked by indexed SPL transfer count; no price or trading claim", tokens: store.trending(limit(url)) });
      const transaction = url.pathname.match(/^\/api\/transaction\/([^/]+)$/); if (transaction) { const row = store.transaction(decodeURIComponent(transaction[1])); return json(response, row ? 200 : 404, row ?? { error: "not_found" }); }
      const account = url.pathname.match(/^\/api\/account\/([^/]+)$/); if (account) return json(response, 200, store.account(decodeURIComponent(account[1]), limit(url)));
      const mint = url.pathname.match(/^\/api\/mint\/([^/]+)$/); if (mint) return json(response, 200, store.mint(decodeURIComponent(mint[1]), limit(url)));
      if (url.pathname === "/" || url.pathname === "/index.html") { const body = await fs.readFile(path.join(PUBLIC, "index.html")); response.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return response.end(body); }
      return json(response, 404, { error: "not_found" });
    } catch (error) { return json(response, 500, { error: "internal_error", detail: error.message }); }
  });
}
