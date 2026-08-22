#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig, parseBoundedInteger } from "./config.js";
import { durableAtomicWrite } from "./durable-file.js";
import { redactDiagnostic } from "./diagnostic-redaction.js";
import { parseRetryAfterMs } from "./provider-retry.js";

export const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

export function validateLocalRpcUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "http:") throw new Error("Local validator RPC must use http://");
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)) throw new Error("Refusing non-loopback validator RPC endpoint");
  return url.href;
}

export class LocalValidatorClient {
  constructor(endpoint = "http://127.0.0.1:8899", { fetchImpl = fetch, timeoutMs = 30_000, now = () => Date.now() } = {}) { if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error("Local validator RPC timeout must be a positive integer"); this.endpoint = validateLocalRpcUrl(endpoint); this.fetchImpl = fetchImpl; this.timeoutMs = timeoutMs; this.now = now; this.id = 0; this.verifiedGenesisHash = null; }
  async call(method, params = []) {
    if (method !== "getGenesisHash" && this.verifiedGenesisHash == null) throw new Error("Local validator RPC requires genesis verification before data calls");
    const requestId = ++this.id;
    const response = await this.fetchImpl(this.endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }), signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) { const error = new Error(`local validator ${method}: HTTP ${response.status}`); error.retryable = [429, 503].includes(response.status); error.retryAfterMs = error.retryable ? parseRetryAfterMs(response.headers?.get?.("retry-after"), this.now()) : null; throw error; }
    const payload = await response.json(), hasResult = Object.hasOwn(payload ?? {}, "result"), hasError = Object.hasOwn(payload ?? {}, "error");
    if (payload?.jsonrpc !== "2.0" || payload.id !== requestId || hasResult === hasError) throw new Error(`local validator ${method}: invalid JSON-RPC response envelope`);
    if (hasError) throw new Error(`local validator ${method}: ${payload.error?.message ?? `RPC ${payload.error?.code ?? "unknown"}`}`); return payload.result;
  }
  async assertGenesis(expected = MAINNET_GENESIS_HASH) { const actual = await this.call("getGenesisHash"); if (expected !== "any" && actual !== expected) { this.verifiedGenesisHash = null; throw new Error(`validator genesis mismatch: expected ${expected}, received ${actual}`); } this.verifiedGenesisHash = actual; return actual; }
}

export class LocalValidatorPool {
  constructor(endpoints, { failureThreshold = 3, cooldownMs = 30_000, now = () => Date.now(), ...clientOptions } = {}) {
    if (!Array.isArray(endpoints) || endpoints.length < 2 || endpoints.length > 4) throw new Error("Local validator pool requires 2 through 4 unique endpoints");
    const normalized = endpoints.map(validateLocalRpcUrl);
    if (new Set(normalized).size !== normalized.length) throw new Error("Local validator pool requires 2 through 4 unique endpoints");
    if (!Number.isSafeInteger(failureThreshold) || failureThreshold < 1 || !Number.isSafeInteger(cooldownMs) || cooldownMs < 1) throw new Error("Local validator pool circuit settings must be positive integers");
    this.nodes = normalized.map((endpoint, index) => { const client = new LocalValidatorClient(endpoint, { ...clientOptions, now }), name = `local-agave-rpc-${index + 1}`; client.provenanceSource = name; return { name, client, failures: 0, openUntil: 0, probeInFlight: false, calls: 0, errors: 0 }; }); this.failureThreshold = failureThreshold; this.cooldownMs = cooldownMs; this.now = now; this.provenanceSource = this.nodes[0].name;
  }
  async assertGenesis(expected = MAINNET_GENESIS_HASH) {
    const hashes = [];
    try {
      for (const { client } of this.nodes) hashes.push(await client.assertGenesis(expected));
      if (new Set(hashes).size !== 1) throw new Error("inconsistent validator genesis identities");
      return hashes[0];
    } catch {
      for (const { client } of this.nodes) client.verifiedGenesisHash = null;
      throw new Error("local validator pool genesis verification failed");
    }
  }
  async call(method, params = []) {
    if (this.nodes.some(({ client }) => client.verifiedGenesisHash == null) || new Set(this.nodes.map(({ client }) => client.verifiedGenesisHash)).size !== 1) throw new Error("Local validator pool requires complete consistent genesis verification before data calls");
    const errors = [];
    for (const node of this.nodes) {
      if (node.openUntil > this.now() || node.probeInFlight) continue;
      const probe = node.failures > 0; if (probe) node.probeInFlight = true;
      node.calls++;
      try { const result = await node.client.call(method, params); node.failures = 0; node.openUntil = 0; this.provenanceSource = node.name; return result; } catch (error) { node.errors++; node.failures++; const retryAfter = Number.isSafeInteger(error.retryAfterMs) ? error.retryAfterMs : null; if (retryAfter != null || error.retryable === true || node.failures >= this.failureThreshold) node.openUntil = this.now() + (retryAfter ?? this.cooldownMs); errors.push(`${node.name}: ${safeError(error)}`); } finally { if (probe) node.probeInFlight = false; }
    }
    throw new Error(`local validator pool ${method} failed: ${errors.join("; ") || "circuits_open"}`);
  }
  telemetry() { const now = this.now(); return this.nodes.map(({ client, ...node }) => ({ ...node, circuitOpen: node.openUntil > now, circuitState: node.openUntil > now ? "open" : node.failures > 0 ? "half_open" : "closed", retryInMs: Math.max(0, node.openUntil - now) })); }
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
async function readStatus(filename) { try { return JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return {}; throw error; } }

function priorSkippedSlots(status) {
  if (!Object.hasOwn(status, "durableSkippedSlots")) return [];
  const slots = status.durableSkippedSlots;
  if (!Array.isArray(slots) || slots.length > 10_000 || slots.some((slot, index) => !Number.isSafeInteger(slot) || slot < 0 || (index > 0 && slots[index - 1] >= slot))) throw new Error("prior exporter skipped-slot evidence is invalid");
  return slots;
}

function safeError(error) {
  return redactDiagnostic(error, "exporter failure");
}

export async function recordExporterFailure(statusFile, error, { source = "unknown", attemptedAt = new Date().toISOString() } = {}) {
  if (!statusFile) return null;
  const previous = await readStatus(statusFile);
  const status = { ...previous, version: 2, source: previous.source ?? source, lastAttemptAt: attemptedAt, lastError: safeError(error), consecutiveFailures: (Number(previous.consecutiveFailures) || 0) + 1 };
  await durableAtomicWrite(statusFile, `${JSON.stringify(status)}\n`);
  return status;
}

export async function exportFinalizedBlocks({ client, inbox, cursorFile, statusFile = null, batchSize = 32, expectedGenesisHash = null }) {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 256) throw new Error("exporter batch size must be an integer from 1 through 256");
  if (expectedGenesisHash != null && (typeof expectedGenesisHash !== "string" || !expectedGenesisHash)) throw new Error("expected genesis hash must be a non-empty string");
  const previous = statusFile ? await readStatus(statusFile) : {}; let previousSkippedSlots = priorSkippedSlots(previous);
  let genesisHash = null;
  if (expectedGenesisHash) {
    genesisHash = await client.assertGenesis(expectedGenesisHash);
    let names = []; try { names = await fs.readdir(inbox); } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (!previous.genesisHash && names.some((name) => /\.(?:json|ndjson)$/i.test(name))) throw new Error("refusing to attach a verified network to an inbox with unknown genesis; use a new empty inbox");
    if (previous.genesisHash && previous.genesisHash !== genesisHash) throw new Error(`refusing to reuse exporter state from genesis ${previous.genesisHash}`);
  }
  const tip = await client.call("getSlot", [{ commitment: "finalized" }]);
  if (!Number.isSafeInteger(tip) || tip < 0) throw new Error("finalized RPC tip must be a non-negative safe integer");
  let cursor = await readCursor(cursorFile);
  if (cursor == null) cursor = Math.max(0, tip - 1);
  if (cursor > tip) throw new Error(`exporter cursor ${cursor} is ahead of finalized tip ${tip}; inspect provider/network state and cursor ownership`);
  if (Object.hasOwn(previous, "cursor")) {
    if (!Number.isSafeInteger(previous.cursor) || previous.cursor < 0 || previous.cursor > tip) throw new Error("prior exporter status cursor is invalid");
    // Status is published before the cursor. If a crash lands between those writes,
    // replay from the lower checkpoint; inbox writes are idempotent and skipped-slot
    // evidence above that checkpoint will be rediscovered from getBlocks.
    cursor = Math.min(cursor, previous.cursor);
    previousSkippedSlots = previousSkippedSlots.filter((slot) => slot <= cursor);
  } else if (previousSkippedSlots.some((slot) => slot > cursor)) throw new Error("prior exporter skipped-slot evidence is ahead of the durable cursor");
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
    if (!produced.has(slot)) { skippedSlots.push(slot); continue; }
    const { block, source } = produced.get(slot);
    const provenance = { source, genesisHash, commitment: "finalized", observedAt: new Date().toISOString(), sourceTip: tip, exportLagSlots: tip - slot };
    await durableAtomicWrite(path.join(inbox, `${slot}.json`), `${JSON.stringify({ slot, ...block, provenance })}\n`); exported++;
  }
  const result = { localValidatorTip: tip, cursor: end, lagSlots: tip - end, exported, skipped: skippedSlots.length, skippedSlots: skippedSlots.slice(0, 256) };
  if (statusFile) {
    const durableSkippedSlots = [...new Set([...previousSkippedSlots, ...skippedSlots])].sort((a, b) => a - b).slice(-10_000);
    const observedAt = new Date().toISOString();
    await durableAtomicWrite(statusFile, `${JSON.stringify({ version: 2, source: client.provenanceSource ?? "local-agave-rpc", genesisHash, commitment: "finalized", observedAt, lastAttemptAt: observedAt, lastError: null, consecutiveFailures: 0, ...result, durableSkippedSlots })}\n`);
  }
  await durableAtomicWrite(cursorFile, `${end}\n`);
  return result;
}

async function main() {
  const config = loadConfig(), endpoints = (process.env.LOCAL_VALIDATOR_RPCS || process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899").split(",").map((value) => value.trim()).filter(Boolean), poolOptions = { failureThreshold: parseBoundedInteger(process.env.LOCAL_RPC_FAILURE_THRESHOLD, 3, 1, 100), cooldownMs: parseBoundedInteger(process.env.LOCAL_RPC_COOLDOWN_MS, 30_000, 100, 3_600_000) }, client = endpoints.length === 1 ? new LocalValidatorClient(endpoints[0]) : new LocalValidatorPool(endpoints, poolOptions);
  const cursorFile = path.resolve(process.cwd(), process.env.EXPORTER_CURSOR_FILE || "data/exporter.cursor"); const batchSize = parseBoundedInteger(process.env.EXPORTER_BATCH_SIZE, 32, 1, 256), pollMs = parseBoundedInteger(process.env.EXPORTER_POLL_MS, 2_000, 100, 60_000); const once = process.argv.includes("--once");
  const expectedGenesisHash = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH;
  do { try { const result = await exportFinalizedBlocks({ client, inbox: config.inbox, cursorFile, statusFile: config.exporterStatusFile, batchSize, expectedGenesisHash }); console.log(JSON.stringify({ ...result, ...(client instanceof LocalValidatorPool ? { validators: client.telemetry() } : {}) })); } catch (error) { await recordExporterFailure(config.exporterStatusFile, error, { source: client.provenanceSource ?? "local-agave-rpc" }); throw error; } if (!once) await new Promise((resolve) => setTimeout(resolve, pollMs)); } while (!once);
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
