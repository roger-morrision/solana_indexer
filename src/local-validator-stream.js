#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig, parseBoundedInteger } from "./config.js";
import { LocalValidatorClient, LocalValidatorPool, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { durableAtomicWrite } from "./durable-file.js";
import { redactDiagnostic } from "./diagnostic-redaction.js";
import { readBoundedJsonFile } from "./bounded-json-file.js";
import { readBoundedDirectoryNames } from "./bounded-directory.js";

export function validateLocalWsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "ws:") throw new Error("Local validator WebSocket must use ws://");
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)) throw new Error("Refusing non-loopback validator WebSocket endpoint");
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("Local validator WebSocket endpoint must use a credential-free root URL");
  return url.href;
}
async function atomicWrite(filename, value) { await durableAtomicWrite(filename, typeof value === "string" ? value : `${JSON.stringify(value)}\n`); }
async function readStatus(filename) {
  const status = await readBoundedJsonFile(filename, { missing: {} });
  if (status?.evidenceReadError) throw new Error(`prior stream status is unavailable: ${status.evidenceReadError}`);
  return status;
}
function priorSkippedSlots(status) { if (!Object.hasOwn(status, "durableSkippedSlots")) return []; const slots = status.durableSkippedSlots; if (!Array.isArray(slots) || slots.length > 10_000 || slots.some((slot, index) => !Number.isSafeInteger(slot) || slot < 0 || (index > 0 && slots[index - 1] >= slot))) throw new Error("prior stream skipped-slot evidence is invalid"); return slots; }
function priorSlot(status, field) { const value = status[field]; if (value == null) return null; if (!Number.isSafeInteger(value) || value < 0) throw new Error(`prior stream ${field} is invalid`); return value; }
function invalidStreamMessage(message) { const error = new Error(message); error.code = "STREAM_MESSAGE_INVALID"; return error; }

export class LocalValidatorStream {
  constructor({ endpoint = "ws://127.0.0.1:8900", endpoints = null, rpcClient, inbox, statusFile, WebSocketClass = globalThis.WebSocket, reconnectMinMs = 500, reconnectMaxMs = 30_000, connectTimeoutMs = 10_000, idleTimeoutMs = 90_000, maxMessageBytes = 67_108_864, maxInboxEntries = 100_000, expectedGenesisHash = MAINNET_GENESIS_HASH, scheduleReconnect = setTimeout, cancelReconnect = scheduleReconnect === setTimeout ? clearTimeout : () => {}, scheduleConnectTimeout = setTimeout, cancelConnectTimeout = scheduleConnectTimeout === setTimeout ? clearTimeout : () => {}, scheduleIdleTimeout = setTimeout, cancelIdleTimeout = scheduleIdleTimeout === setTimeout ? clearTimeout : () => {} }) {
    const configured = (endpoints ?? [endpoint]).map(validateLocalWsUrl); if (configured.length < 1 || configured.length > 4 || new Set(configured).size !== configured.length) throw new Error("Local validator stream requires 1 through 4 unique endpoints");
    if (![reconnectMinMs, reconnectMaxMs].every((value) => Number.isSafeInteger(value) && value >= 1) || reconnectMinMs > reconnectMaxMs) throw new Error("validator stream reconnect bounds must be positive ordered integers");
    if (!Number.isSafeInteger(connectTimeoutMs) || connectTimeoutMs < 100 || connectTimeoutMs > 300_000) throw new Error("validator stream connect timeout must be an integer from 100 through 300000 milliseconds");
    if (!Number.isSafeInteger(idleTimeoutMs) || idleTimeoutMs < 1_000 || idleTimeoutMs > 600_000) throw new Error("validator stream idle timeout must be an integer from 1000 through 600000 milliseconds");
    if (!Number.isSafeInteger(maxMessageBytes) || maxMessageBytes < 65_536 || maxMessageBytes > 268_435_456) throw new Error("validator stream message limit must be an integer from 65536 through 268435456 bytes");
    if (!Number.isSafeInteger(maxInboxEntries) || maxInboxEntries < 1 || maxInboxEntries > 1_000_000) throw new Error("validator stream inbox entry limit must be an integer from 1 through 1000000");
    if (typeof expectedGenesisHash !== "string" || !expectedGenesisHash) throw new Error("validator stream expected genesis hash is required");
    this.endpoints = configured; this.endpointIndex = 0; this.rpcClient = rpcClient; this.inbox = inbox; this.statusFile = statusFile; this.WebSocketClass = WebSocketClass; this.reconnectMinMs = reconnectMinMs; this.reconnectMaxMs = reconnectMaxMs; this.connectTimeoutMs = connectTimeoutMs; this.idleTimeoutMs = idleTimeoutMs; this.maxMessageBytes = maxMessageBytes; this.maxInboxEntries = maxInboxEntries; this.scheduleReconnect = scheduleReconnect; this.cancelReconnect = cancelReconnect; this.scheduleConnectTimeout = scheduleConnectTimeout; this.cancelConnectTimeout = cancelConnectTimeout; this.scheduleIdleTimeout = scheduleIdleTimeout; this.cancelIdleTimeout = cancelIdleTimeout;
    this.expectedGenesisHash = expectedGenesisHash; this.genesisHash = null; this.socket = null; this.stopped = false; this.reconnectMs = reconnectMinMs; this.reconnectTimer = null; this.connectTimer = null; this.idleTimer = null; this.subscriptions = new Map(); this.lastSlots = { confirmed: null, finalized: null }; this.durableSkippedSlots = []; this.messageQueue = Promise.resolve(); this.lastError = null; this.metrics = { connections: 0, reconnects: 0, notifications: 0, gapRepairs: 0, decodeErrors: 0, skippedSlots: [] };
  }
  async start() { this.stopped = false; await this.initializeAndConnect(); return () => this.stop(); }
  async initializeAndConnect() { const prior = await readStatus(this.statusFile); this.durableSkippedSlots = priorSkippedSlots(prior); this.lastSlots.confirmed = priorSlot(prior, "lastConfirmedSlot"); this.lastSlots.finalized = priorSlot(prior, "lastFinalizedSlot"); if (Object.hasOwn(prior, "cursor") && prior.cursor !== this.lastSlots.finalized) throw new Error("prior stream cursor does not match finalized resume slot"); const ceiling = Math.max(this.lastSlots.confirmed ?? -1, this.lastSlots.finalized ?? -1); if (this.durableSkippedSlots.some((slot) => slot > ceiling)) throw new Error("prior stream skipped-slot evidence is ahead of durable progress"); this.genesisHash = await this.rpcClient.assertGenesis(this.expectedGenesisHash); const names = await readBoundedDirectoryNames(this.inbox, { maximumEntries: this.maxInboxEntries }); if (!prior.genesisHash && names.some((name) => /\.(?:json|ndjson)$/i.test(name))) throw new Error("refusing to attach a verified network to an inbox with unknown genesis; use a new empty inbox"); if (prior.genesisHash && prior.genesisHash !== this.genesisHash) throw new Error(`refusing to reuse stream state from genesis ${prior.genesisHash}`); await this.writeStatus(); this.connect(); }
  stop() { if (this.stopped) return this.messageQueue; const source = this.provenanceSource; this.stopped = true; if (this.reconnectTimer != null) { this.cancelReconnect(this.reconnectTimer); this.reconnectTimer = null; } if (this.connectTimer != null) { this.cancelConnectTimeout(this.connectTimer); this.connectTimer = null; } if (this.idleTimer != null) { this.cancelIdleTimeout(this.idleTimer); this.idleTimer = null; } this.socket?.close(); this.socket = null; this.lastError = { at: new Date().toISOString(), message: "validator stream stopped" }; return this.queueStatus(source, false); }
  get endpoint() { return this.endpoints[this.endpointIndex]; }
  get provenanceSource() { return this.endpoints.length === 1 ? "local-agave-pubsub" : `local-agave-pubsub-${this.endpointIndex + 1}`; }
  get ready() { return this.socket?.readyState === 1 && this.subscriptions.size === 2; }
  armIdleTimeout(socket) { if (this.idleTimer != null) this.cancelIdleTimeout(this.idleTimer); this.idleTimer = this.scheduleIdleTimeout(() => { this.idleTimer = null; if (this.stopped || socket !== this.socket || !this.ready) return; this.lastError = { at: new Date().toISOString(), message: "validator stream idle timeout" }; socket.close(); if (socket === this.socket) socket.onclose(); }, this.idleTimeoutMs); this.idleTimer?.unref?.(); }
  queueStatus(source = this.provenanceSource, connected = this.ready) { this.messageQueue = this.messageQueue.then(() => this.writeStatus(source, connected)).catch((error) => { this.lastError = { at: new Date().toISOString(), message: redactDiagnostic(error, "validator stream status failure") }; }); return this.messageQueue; }
  async authorizeSocket(socket, source) {
    if (this.stopped || socket !== this.socket) return;
    let actual;
    try { actual = await this.rpcClient.assertGenesis(this.expectedGenesisHash); }
    catch { throw new Error("validator stream network verification failed"); }
    if (this.stopped || socket !== this.socket) return;
    if (this.genesisHash != null && actual !== this.genesisHash) throw new Error("validator stream network identity changed");
    this.genesisHash = actual; this.metrics.connections++; this.reconnectMs = this.reconnectMinMs; this.subscriptions.clear(); this.lastError = null;
    for (const [id, commitment] of [[1, "confirmed"], [2, "finalized"]]) socket.send(JSON.stringify({ jsonrpc: "2.0", id, method: "blockSubscribe", params: ["all", { commitment, encoding: "jsonParsed", transactionDetails: "full", maxSupportedTransactionVersion: 0, showRewards: false }] }));
    await this.writeStatus(source, false);
  }
  connect() {
    if (this.stopped) return;
    if (this.reconnectTimer != null) { this.cancelReconnect(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.connectTimer != null) { this.cancelConnectTimeout(this.connectTimer); this.connectTimer = null; }
    if (this.idleTimer != null) { this.cancelIdleTimeout(this.idleTimer); this.idleTimer = null; }
    const source = this.provenanceSource, socket = new this.WebSocketClass(this.endpoint); this.socket = socket;
    this.connectTimer = this.scheduleConnectTimeout(() => { this.connectTimer = null; if (this.stopped || socket !== this.socket || this.ready) return; this.lastError = { at: new Date().toISOString(), message: socket.readyState === 1 ? "validator stream subscription handshake timed out" : "validator stream connection timed out" }; socket.close(); if (socket === this.socket) socket.onclose(); }, this.connectTimeoutMs);
    this.connectTimer?.unref?.();
    socket.onopen = () => { if (socket !== this.socket) return; this.messageQueue = this.messageQueue.then(() => this.authorizeSocket(socket, source)).catch(async () => { if (this.stopped || socket !== this.socket) return; this.lastError = { at: new Date().toISOString(), message: "validator stream network verification failed" }; await this.writeStatus(source, false); socket.close(); }); };
    socket.onmessage = ({ data }) => { if (socket !== this.socket) return; this.messageQueue = this.messageQueue.then(() => socket === this.socket ? this.handleMessage(data, source) : undefined).catch(async (error) => { this.metrics.decodeErrors++; this.lastError = { at: new Date().toISOString(), message: redactDiagnostic(error, "validator stream decode failure") }; await this.writeStatus(source); if (error.code === "STREAM_MESSAGE_INVALID" && socket === this.socket) socket.close(); }); };
    socket.onerror = () => { if (this.stopped || socket !== this.socket) return; this.lastError = { at: new Date().toISOString(), message: "validator stream transport error" }; socket.close(); if (socket === this.socket) socket.onclose(); };
    socket.onclose = () => { if (this.stopped || socket !== this.socket) return; if (this.connectTimer != null) { this.cancelConnectTimeout(this.connectTimer); this.connectTimer = null; } if (this.idleTimer != null) { this.cancelIdleTimeout(this.idleTimer); this.idleTimer = null; } this.socket = null; this.metrics.reconnects++; if (!["validator stream connection timed out", "validator stream subscription handshake timed out", "validator stream idle timeout", "validator stream transport error"].includes(this.lastError?.message)) this.lastError = { at: new Date().toISOString(), message: "validator stream disconnected" }; this.endpointIndex = (this.endpointIndex + 1) % this.endpoints.length; const delay = this.reconnectMs; this.reconnectMs = Math.min(this.reconnectMaxMs, this.reconnectMs * 2); this.queueStatus(source, false); this.reconnectTimer = this.scheduleReconnect(() => { this.reconnectTimer = null; this.connect(); }, delay); };
  }
  async handleMessage(data, source = this.provenanceSource) {
    if (typeof data !== "string" || Buffer.byteLength(data, "utf8") > this.maxMessageBytes) throw invalidStreamMessage("validator stream message is not bounded UTF-8 text");
    let payload; try { payload = JSON.parse(data); } catch { throw invalidStreamMessage("validator stream message is invalid JSON"); }
    if (!payload || Array.isArray(payload) || typeof payload !== "object") throw invalidStreamMessage("validator stream message must be a JSON-RPC object");
    if (payload.id === 1 || payload.id === 2) {
      const commitment = payload.id === 1 ? "confirmed" : "finalized", hasResult = Object.hasOwn(payload ?? {}, "result"), hasError = Object.hasOwn(payload ?? {}, "error");
      if (payload.jsonrpc !== "2.0" || hasResult === hasError || !Number.isSafeInteger(payload.result) || payload.result < 0 || this.subscriptions.has(payload.result) || [...this.subscriptions.values()].includes(commitment)) throw invalidStreamMessage(`invalid ${commitment} blockSubscribe acknowledgement`);
      this.subscriptions.set(payload.result, commitment); if (this.subscriptions.size === 2) { if (this.connectTimer != null) { this.cancelConnectTimeout(this.connectTimer); this.connectTimer = null; } this.lastError = null; this.armIdleTimeout(this.socket); await this.writeStatus(source, true); } return;
    }
    if (payload.method !== "blockNotification") return;
    if (payload.jsonrpc !== "2.0") throw invalidStreamMessage("invalid blockNotification JSON-RPC version");
    const commitment = this.subscriptions.get(payload.params?.subscription); const value = payload.params?.result?.value;
    if (!commitment || !value || typeof value !== "object" || Array.isArray(value)) throw invalidStreamMessage("invalid blockNotification payload");
    if (value.err) return;
    if (!Number.isSafeInteger(value.slot) || value.slot < 0 || !value.block || typeof value.block !== "object" || Array.isArray(value.block)) throw invalidStreamMessage("invalid blockNotification payload");
    this.armIdleTimeout(this.socket);
    await this.ingestBlock(commitment, value.slot, value.block, source);
  }
  async ingestBlock(commitment, slot, block, source = this.provenanceSource) {
    const previous = this.lastSlots[commitment];
    if (previous != null && slot > previous + 1) await this.repairGap(commitment, previous + 1, slot - 1);
    await this.persistBlock(commitment, slot, block, slot, source); this.lastSlots[commitment] = Math.max(previous ?? slot, slot); this.metrics.notifications++; await this.writeStatus(source);
  }
  async repairGap(commitment, first, last) {
    if (!["confirmed", "finalized"].includes(commitment) || !Number.isSafeInteger(first) || !Number.isSafeInteger(last) || first < 0 || last < first) throw new Error("stream gap repair range is invalid");
    if (last - first > 511) throw new Error(`stream gap ${first}-${last} exceeds bounded repair window`);
    const producedSlots = await this.rpcClient.call("getBlocks", [first, last, { commitment }]);
    if (!Array.isArray(producedSlots) || producedSlots.some((slot, index) => !Number.isSafeInteger(slot) || slot < first || slot > last || (index > 0 && producedSlots[index - 1] >= slot))) throw new Error("stream getBlocks response must be a strictly increasing in-range slot list");
    const produced = new Set(producedSlots), skippedSlots = []; let repaired = 0;
    for (let slot = first; slot <= last; slot++) {
      if (!produced.has(slot)) { skippedSlots.push(slot); continue; }
      const block = await this.rpcClient.call("getBlock", [slot, { commitment, encoding: "jsonParsed", transactionDetails: "full", rewards: false, maxSupportedTransactionVersion: 0 }]);
      if (!block) throw new Error(`stream block ${slot} was listed by getBlocks but is unavailable`);
      await this.persistBlock(commitment, slot, block, last, this.rpcClient.provenanceSource ?? "local-agave-rpc"); repaired++;
    }
    this.metrics.gapRepairs += repaired;
    this.metrics.skippedSlots = [...new Set([...this.metrics.skippedSlots, ...skippedSlots])].sort((a, b) => a - b).slice(-10_000);
  }
  async persistBlock(commitment, slot, block, sourceTip, source = this.provenanceSource) {
    const provenance = { source, genesisHash: this.genesisHash, commitment, observedAt: new Date().toISOString(), sourceTip, exportLagSlots: Math.max(0, sourceTip - slot) };
    await atomicWrite(path.join(this.inbox, `${slot}.${commitment}.json`), { slot, ...block, provenance });
  }
  async writeStatus(source = this.provenanceSource, connected = this.ready) {
    const durableSkippedSlots = [...new Set([...this.durableSkippedSlots, ...this.metrics.skippedSlots])].sort((a, b) => a - b).slice(-10_000); this.durableSkippedSlots = durableSkippedSlots;
    const observedTip = this.lastSlots.confirmed == null ? this.lastSlots.finalized : this.lastSlots.finalized == null ? this.lastSlots.confirmed : Math.max(this.lastSlots.confirmed, this.lastSlots.finalized), finalizationLagSlots = observedTip != null && this.lastSlots.finalized != null ? observedTip - this.lastSlots.finalized : null;
    await atomicWrite(this.statusFile, { version: 2, source, genesisHash: this.genesisHash, commitment: "finalized", observedAt: new Date().toISOString(), connected, cursor: this.lastSlots.finalized, localValidatorTip: observedTip, lagSlots: finalizationLagSlots, lastConfirmedSlot: this.lastSlots.confirmed, lastFinalizedSlot: this.lastSlots.finalized, finalizationLagSlots, consecutiveFailures: this.lastError ? 1 : 0, ...this.metrics, lastError: this.lastError, durableSkippedSlots });
  }
}

async function main() {
  const config = loadConfig(), rpcEndpoints = (process.env.LOCAL_VALIDATOR_RPCS || process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899").split(",").map((value) => value.trim()).filter(Boolean), wsEndpoints = (process.env.LOCAL_VALIDATOR_WSS || process.env.LOCAL_VALIDATOR_WS || "ws://127.0.0.1:8900").split(",").map((value) => value.trim()).filter(Boolean);
  if (wsEndpoints.length > 1 && rpcEndpoints.length !== wsEndpoints.length) throw new Error("Redundant validator streaming requires one verified RPC endpoint per WebSocket endpoint");
  const rpcClient = rpcEndpoints.length === 1 ? new LocalValidatorClient(rpcEndpoints[0]) : new LocalValidatorPool(rpcEndpoints, { failureThreshold: parseBoundedInteger(process.env.LOCAL_RPC_FAILURE_THRESHOLD, 3, 1, 100), cooldownMs: parseBoundedInteger(process.env.LOCAL_RPC_COOLDOWN_MS, 30_000, 100, 3_600_000) });
  const stream = new LocalValidatorStream({ endpoints: wsEndpoints, rpcClient, inbox: config.inbox, statusFile: config.exporterStatusFile, reconnectMinMs: config.streamReconnectMinMs, reconnectMaxMs: config.streamReconnectMaxMs, connectTimeoutMs: config.streamConnectTimeoutMs, idleTimeoutMs: config.streamIdleTimeoutMs, maxMessageBytes: config.streamMaxMessageBytes, maxInboxEntries: config.maxInboxEntries, expectedGenesisHash: process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH });
  await stream.start(); const stop = async () => { await stream.stop(); process.exit(0); }; process.once("SIGINT", stop); process.once("SIGTERM", stop);
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
