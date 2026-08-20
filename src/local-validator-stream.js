#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { LocalValidatorClient } from "./local-validator-exporter.js";

export function validateLocalWsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "ws:") throw new Error("Local validator WebSocket must use ws://");
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)) throw new Error("Refusing non-loopback validator WebSocket endpoint");
  return url.href;
}
async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, typeof value === "string" ? value : `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }
async function readJson(filename) { try { return JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return {}; throw error; } }

export class LocalValidatorStream {
  constructor({ endpoint = "ws://127.0.0.1:8900", rpcClient, inbox, statusFile, WebSocketClass = globalThis.WebSocket, reconnectMinMs = 500, reconnectMaxMs = 30_000 }) {
    this.endpoint = validateLocalWsUrl(endpoint); this.rpcClient = rpcClient; this.inbox = inbox; this.statusFile = statusFile; this.WebSocketClass = WebSocketClass; this.reconnectMinMs = reconnectMinMs; this.reconnectMaxMs = reconnectMaxMs;
    this.socket = null; this.stopped = false; this.reconnectMs = reconnectMinMs; this.subscriptions = new Map(); this.lastSlots = { confirmed: null, finalized: null }; this.metrics = { connections: 0, reconnects: 0, notifications: 0, gapRepairs: 0, decodeErrors: 0, skippedSlots: [] };
  }
  start() { this.stopped = false; void this.initializeAndConnect(); return () => this.stop(); }
  async initializeAndConnect() { const prior = await readJson(this.statusFile); if (Number.isSafeInteger(prior.lastConfirmedSlot)) this.lastSlots.confirmed = prior.lastConfirmedSlot; if (Number.isSafeInteger(prior.lastFinalizedSlot)) this.lastSlots.finalized = prior.lastFinalizedSlot; this.connect(); }
  stop() { this.stopped = true; this.socket?.close(); this.socket = null; }
  connect() {
    if (this.stopped) return;
    const socket = new this.WebSocketClass(this.endpoint); this.socket = socket;
    socket.onopen = () => { this.metrics.connections++; this.reconnectMs = this.reconnectMinMs; this.subscriptions.clear(); for (const [id, commitment] of [[1, "confirmed"], [2, "finalized"]]) socket.send(JSON.stringify({ jsonrpc: "2.0", id, method: "blockSubscribe", params: ["all", { commitment, encoding: "jsonParsed", transactionDetails: "full", maxSupportedTransactionVersion: 0, showRewards: false }] })); };
    socket.onmessage = ({ data }) => { void this.handleMessage(data).catch(async () => { this.metrics.decodeErrors++; await this.writeStatus(); }); };
    socket.onerror = () => {};
    socket.onclose = () => { if (this.stopped) return; this.metrics.reconnects++; const delay = this.reconnectMs; this.reconnectMs = Math.min(this.reconnectMaxMs, this.reconnectMs * 2); setTimeout(() => this.connect(), delay); };
  }
  async handleMessage(data) {
    const payload = JSON.parse(String(data));
    if (payload.id === 1 || payload.id === 2) { if (Number.isInteger(payload.result)) this.subscriptions.set(payload.result, payload.id === 1 ? "confirmed" : "finalized"); return; }
    if (payload.method !== "blockNotification") return;
    const commitment = this.subscriptions.get(payload.params?.subscription); const value = payload.params?.result?.value;
    if (!commitment || value?.err || !Number.isSafeInteger(value?.slot) || !value.block) return;
    await this.ingestBlock(commitment, value.slot, value.block);
  }
  async ingestBlock(commitment, slot, block) {
    const previous = this.lastSlots[commitment];
    if (previous != null && slot > previous + 1) await this.repairGap(commitment, previous + 1, slot - 1);
    await this.persistBlock(commitment, slot, block, slot); this.lastSlots[commitment] = Math.max(previous ?? slot, slot); this.metrics.notifications++; await this.writeStatus();
  }
  async repairGap(commitment, first, last) {
    if (last - first > 511) throw new Error(`stream gap ${first}-${last} exceeds bounded repair window`);
    for (let slot = first; slot <= last; slot++) {
      const block = await this.rpcClient.call("getBlock", [slot, { commitment, encoding: "jsonParsed", transactionDetails: "full", rewards: false, maxSupportedTransactionVersion: 0 }]);
      if (block) { await this.persistBlock(commitment, slot, block, last); this.metrics.gapRepairs++; }
      else this.metrics.skippedSlots.push(slot);
    }
    this.metrics.skippedSlots = [...new Set(this.metrics.skippedSlots)].sort((a, b) => a - b).slice(-10_000);
  }
  async persistBlock(commitment, slot, block, sourceTip) {
    const provenance = { source: "local-agave-pubsub", commitment, observedAt: new Date().toISOString(), sourceTip, exportLagSlots: Math.max(0, sourceTip - slot) };
    await atomicWrite(path.join(this.inbox, `${slot}.${commitment}.json`), { slot, ...block, provenance });
  }
  async writeStatus() {
    const previous = await readJson(this.statusFile); const durableSkippedSlots = [...new Set([...(previous.durableSkippedSlots ?? []), ...this.metrics.skippedSlots])].sort((a, b) => a - b).slice(-10_000);
    await atomicWrite(this.statusFile, { version: 2, source: "local-agave-pubsub", observedAt: new Date().toISOString(), connected: this.socket?.readyState === 1, lastConfirmedSlot: this.lastSlots.confirmed, lastFinalizedSlot: this.lastSlots.finalized, finalizationLagSlots: this.lastSlots.confirmed != null && this.lastSlots.finalized != null ? Math.max(0, this.lastSlots.confirmed - this.lastSlots.finalized) : null, ...this.metrics, durableSkippedSlots });
  }
}

async function main() {
  const config = loadConfig(); const rpcClient = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899");
  const stream = new LocalValidatorStream({ endpoint: process.env.LOCAL_VALIDATOR_WS || "ws://127.0.0.1:8900", rpcClient, inbox: config.inbox, statusFile: config.exporterStatusFile, reconnectMinMs: config.streamReconnectMinMs, reconnectMaxMs: config.streamReconnectMaxMs });
  stream.start(); const stop = () => { stream.stop(); process.exit(0); }; process.once("SIGINT", stop); process.once("SIGTERM", stop);
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
