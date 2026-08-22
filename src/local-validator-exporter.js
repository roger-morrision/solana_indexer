#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";

export const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

export function validateLocalRpcUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "http:") throw new Error("Local validator RPC must use http://");
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)) throw new Error("Refusing non-loopback validator RPC endpoint");
  return url.href;
}

export class LocalValidatorClient {
  constructor(endpoint = "http://127.0.0.1:8899", { fetchImpl = fetch, timeoutMs = 30_000 } = {}) { this.endpoint = validateLocalRpcUrl(endpoint); this.fetchImpl = fetchImpl; this.timeoutMs = timeoutMs; this.id = 0; }
  async call(method, params = []) {
    const requestId = ++this.id;
    const response = await this.fetchImpl(this.endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }), signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) throw new Error(`local validator ${method}: HTTP ${response.status}`);
    const payload = await response.json(), hasResult = Object.hasOwn(payload ?? {}, "result"), hasError = Object.hasOwn(payload ?? {}, "error");
    if (payload?.jsonrpc !== "2.0" || payload.id !== requestId || hasResult === hasError) throw new Error(`local validator ${method}: invalid JSON-RPC response envelope`);
    if (hasError) throw new Error(`local validator ${method}: ${payload.error?.message ?? `RPC ${payload.error?.code ?? "unknown"}`}`); return payload.result;
  }
  async assertGenesis(expected = MAINNET_GENESIS_HASH) { const actual = await this.call("getGenesisHash"); if (expected !== "any" && actual !== expected) throw new Error(`validator genesis mismatch: expected ${expected}, received ${actual}`); return actual; }
}

export class LocalValidatorPool {
  constructor(endpoints, options = {}) {
    if (!Array.isArray(endpoints) || endpoints.length < 2 || endpoints.length > 4) throw new Error("Local validator pool requires 2 through 4 unique endpoints");
    const normalized = endpoints.map(validateLocalRpcUrl);
    if (new Set(normalized).size !== normalized.length) throw new Error("Local validator pool requires 2 through 4 unique endpoints");
    this.clients = normalized.map((endpoint, index) => { const client = new LocalValidatorClient(endpoint, options); client.provenanceSource = `local-agave-rpc-${index + 1}`; return client; }); this.activeIndex = 0; this.provenanceSource = this.clients[0].provenanceSource;
  }
  async assertGenesis(expected = MAINNET_GENESIS_HASH) {
    const hashes = await Promise.all(this.clients.map((client) => client.assertGenesis(expected)));
    if (new Set(hashes).size !== 1) throw new Error("local validator pool genesis mismatch");
    return hashes[0];
  }
  async call(method, params = []) {
    const errors = [];
    for (let offset = 0; offset < this.clients.length; offset++) {
      const index = (this.activeIndex + offset) % this.clients.length, client = this.clients[index];
      try { const result = await client.call(method, params); this.activeIndex = index; this.provenanceSource = client.provenanceSource; return result; } catch (error) { errors.push(`${client.provenanceSource}: ${safeError(error)}`); }
    }
    throw new Error(`local validator pool ${method} failed: ${errors.join("; ")}`);
  }
}

async function readCursor(filename) {
  try {
    const raw = (await fs.readFile(filename, "utf8")).trim();
    if (!/^\d+$/.test(raw)) throw new Error("exporter cursor must be a non-negative integer");
    const cursor = Number(raw);
    if (!Number.isSafeInteger(cursor)) throw new Error("exporter cursor exceeds the safe integer range");
    return cursor;
  } catch (error) { if (error.code === "ENOENT") return null; throw error; }
}
async function atomicWrite(filename, body) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, body); await fs.rename(temporary, filename); }
async function readStatus(filename) { try { return JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return {}; throw error; } }

function safeError(error) {
  return String(error?.message ?? error?.name ?? "exporter failure")
    .replace(/https?:\/\/[^\s]+/gi, "[redacted-url]")
    .slice(0, 512);
}

export async function recordExporterFailure(statusFile, error, { source = "unknown", attemptedAt = new Date().toISOString() } = {}) {
  if (!statusFile) return null;
  const previous = await readStatus(statusFile);
  const status = { ...previous, version: 2, source: previous.source ?? source, lastAttemptAt: attemptedAt, lastError: safeError(error), consecutiveFailures: (Number(previous.consecutiveFailures) || 0) + 1 };
  await atomicWrite(statusFile, `${JSON.stringify(status)}\n`);
  return status;
}

export async function exportFinalizedBlocks({ client, inbox, cursorFile, statusFile = null, batchSize = 32, expectedGenesisHash = null }) {
  let genesisHash = null;
  if (expectedGenesisHash) {
    genesisHash = await client.assertGenesis(expectedGenesisHash); const prior = statusFile ? await readStatus(statusFile) : {};
    let names = []; try { names = await fs.readdir(inbox); } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (!prior.genesisHash && names.some((name) => /\.(?:json|ndjson)$/i.test(name))) throw new Error("refusing to attach a verified network to an inbox with unknown genesis; use a new empty inbox");
    if (prior.genesisHash && prior.genesisHash !== genesisHash) throw new Error(`refusing to reuse exporter state from genesis ${prior.genesisHash}`);
  }
  const tip = await client.call("getSlot", [{ commitment: "finalized" }]);
  if (!Number.isSafeInteger(tip) || tip < 0) throw new Error("finalized RPC tip must be a non-negative safe integer");
  let cursor = await readCursor(cursorFile);
  if (cursor == null) cursor = Math.max(0, tip - 1);
  if (cursor > tip) throw new Error(`exporter cursor ${cursor} is ahead of finalized tip ${tip}; inspect provider/network state and cursor ownership`);
  const end = Math.min(tip, cursor + batchSize); let exported = 0; const skippedSlots = [];
  const producedSlots = end > cursor ? await client.call("getBlocks", [cursor + 1, end, { commitment: "finalized" }]) : [];
  if (!Array.isArray(producedSlots) || producedSlots.some((slot, index) => !Number.isSafeInteger(slot) || slot < cursor + 1 || slot > end || (index > 0 && producedSlots[index - 1] >= slot))) throw new Error("finalized getBlocks response must be a strictly increasing in-range slot list");
  const produced = new Map();
  for (const slot of producedSlots) {
    const block = await client.call("getBlock", [slot, { commitment: "finalized", encoding: "jsonParsed", transactionDetails: "full", rewards: false, maxSupportedTransactionVersion: 0 }]);
    if (!block) throw new Error(`finalized block ${slot} was listed by getBlocks but is unavailable`);
    produced.set(slot, { block, source: client.provenanceSource ?? "local-agave-rpc" });
  }
  for (let slot = cursor + 1; slot <= end; slot++) {
    if (!produced.has(slot)) { skippedSlots.push(slot); await atomicWrite(cursorFile, `${slot}\n`); continue; }
    const { block, source } = produced.get(slot);
    const provenance = { source, commitment: "finalized", observedAt: new Date().toISOString(), sourceTip: tip, exportLagSlots: tip - slot };
    await atomicWrite(path.join(inbox, `${slot}.json`), `${JSON.stringify({ slot, ...block, provenance })}\n`); exported++;
    await atomicWrite(cursorFile, `${slot}\n`);
  }
  const result = { localValidatorTip: tip, cursor: end, lagSlots: tip - end, exported, skipped: skippedSlots.length, skippedSlots: skippedSlots.slice(0, 256) };
  if (statusFile) {
    const previous = await readStatus(statusFile);
    const durableSkippedSlots = [...new Set([...(previous.durableSkippedSlots ?? []), ...skippedSlots])].sort((a, b) => a - b).slice(-10_000);
    const observedAt = new Date().toISOString();
    await atomicWrite(statusFile, `${JSON.stringify({ version: 2, source: client.provenanceSource ?? "local-agave-rpc", genesisHash, commitment: "finalized", observedAt, lastAttemptAt: observedAt, lastError: null, consecutiveFailures: 0, ...result, durableSkippedSlots })}\n`);
  }
  return result;
}

async function main() {
  const config = loadConfig(), endpoints = (process.env.LOCAL_VALIDATOR_RPCS || process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899").split(",").map((value) => value.trim()).filter(Boolean), client = endpoints.length === 1 ? new LocalValidatorClient(endpoints[0]) : new LocalValidatorPool(endpoints);
  const cursorFile = path.resolve(process.cwd(), process.env.EXPORTER_CURSOR_FILE || "data/exporter.cursor"); const batchSize = Math.min(256, Math.max(1, Number(process.env.EXPORTER_BATCH_SIZE) || 32)); const once = process.argv.includes("--once");
  const expectedGenesisHash = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH;
  do { try { console.log(JSON.stringify(await exportFinalizedBlocks({ client, inbox: config.inbox, cursorFile, statusFile: config.exporterStatusFile, batchSize, expectedGenesisHash }))); } catch (error) { await recordExporterFailure(config.exporterStatusFile, error, { source: "local-agave-rpc" }); throw error; } if (!once) await new Promise((resolve) => setTimeout(resolve, Number(process.env.EXPORTER_POLL_MS) || 2000)); } while (!once);
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
