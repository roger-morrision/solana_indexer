#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { exportFinalizedBlocks, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";

const PUBLIC_MAINNET = "https://api.mainnet.solana.com/";
const ALLOWED = { helius: new Set(["mainnet.helius-rpc.com"]), alchemy: new Set(["solana-mainnet.g.alchemy.com"]), "solana-public": new Set(["api.mainnet.solana.com", "api.mainnet-beta.solana.com"]) };
export function validateProviderUrl(name, value) { const url = new URL(value); if (url.protocol !== "https:" || !ALLOWED[name]?.has(url.hostname)) throw new Error(`invalid ${name} RPC endpoint`); return url.href; }

export class ExternalRpcPool {
  constructor(providers, { fetchImpl = fetch, timeoutMs = 20_000, failureThreshold = 3, cooldownMs = 30_000, now = () => Date.now() } = {}) { if (!providers.length) throw new Error("at least one RPC provider is required"); this.providers = providers.map((row) => ({ name: row.name, endpoint: validateProviderUrl(row.name, row.endpoint), failures: 0, openUntil: 0, calls: 0, errors: 0 })); this.fetchImpl = fetchImpl; this.timeoutMs = timeoutMs; this.failureThreshold = failureThreshold; this.cooldownMs = cooldownMs; this.now = now; this.id = 0; this.lastProvider = null; }
  get provenanceSource() { return this.lastProvider ? `external-rpc-${this.lastProvider}` : "external-rpc-pool"; }
  async call(method, params = []) { const errors = []; for (const provider of this.providers) { if (provider.openUntil > this.now()) continue; provider.calls++; try { const response = await this.fetchImpl(provider.endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++this.id, method, params }), signal: AbortSignal.timeout(this.timeoutMs) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const payload = await response.json(); if (payload.error) throw new Error(`RPC ${payload.error.code}`); provider.failures = 0; provider.openUntil = 0; this.lastProvider = provider.name; return payload.result; } catch (error) { provider.errors++; provider.failures++; if (provider.failures >= this.failureThreshold) provider.openUntil = this.now() + this.cooldownMs; errors.push(`${provider.name}:${error.name ?? "Error"}`); } } throw new Error(`all external RPC providers unavailable (${errors.join(",") || "circuits_open"})`); }
  async assertGenesis(expected = MAINNET_GENESIS_HASH) { const actual = await this.call("getGenesisHash"); if (actual !== expected) throw new Error(`external RPC genesis mismatch: expected ${expected}, received ${actual}`); return actual; }
  telemetry() { return this.providers.map(({ endpoint, ...row }) => ({ ...row, circuitOpen: row.openUntil > this.now() })); }
}

export function providerPoolFromEnv(env = process.env, options) { if (!env.HELIUS_RPC_URL || !env.ALCHEMY_RPC_URL) throw new Error("HELIUS_RPC_URL and ALCHEMY_RPC_URL are required"); return new ExternalRpcPool([{ name: "helius", endpoint: env.HELIUS_RPC_URL }, { name: "alchemy", endpoint: env.ALCHEMY_RPC_URL }], options); }
export function publicHealthClient(options) { return new ExternalRpcPool([{ name: "solana-public", endpoint: PUBLIC_MAINNET }], { ...options, failureThreshold: 1, cooldownMs: 60_000 }); }

async function main() {
  if (process.argv.includes("--health-public")) { const client = publicHealthClient(); const genesisHash = await client.call("getGenesisHash"), health = await client.call("getHealth"); if (genesisHash !== MAINNET_GENESIS_HASH || health !== "ok") throw new Error("Solana public mainnet health check failed"); console.log(JSON.stringify({ provider: "solana-public", genesisHash, health })); return; }
  const config = loadConfig(), emergency = process.argv.includes("--emergency-public"), once = process.argv.includes("--once") || emergency; if (emergency && !process.argv.includes("--once")) console.warn("emergency public backfill is forced to one bounded cycle"); const client = emergency ? publicHealthClient() : providerPoolFromEnv(); const cursorFile = path.resolve(process.cwd(), process.env.EXPORTER_CURSOR_FILE || "data/external-exporter.cursor"), requestedBatch = Number(process.env.EXPORTER_BATCH_SIZE) || 8, batchSize = emergency ? Math.min(4, Math.max(1, requestedBatch)) : Math.min(32, Math.max(1, requestedBatch));
  do { const result = await exportFinalizedBlocks({ client, inbox: config.inbox, cursorFile, statusFile: config.exporterStatusFile, batchSize, expectedGenesisHash: MAINNET_GENESIS_HASH }); console.log(JSON.stringify({ ...result, providers: client.telemetry() })); if (!once) await new Promise((resolve) => setTimeout(resolve, Number(process.env.EXPORTER_POLL_MS) || 2000)); } while (!once);
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
