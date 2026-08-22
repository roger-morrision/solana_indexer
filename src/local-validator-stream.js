#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";

export function validateLocalWsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "ws:") throw new Error("Local validator WebSocket must use ws://");
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)) throw new Error("Refusing non-loopback validator WebSocket endpoint");
  return url.href;
}
async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, typeof value === "string" ? value : `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }
async function readJson(filename) { try { return JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return {}; throw error; } }

export class LocalValidatorStream {
  constructor({ endpoint = "ws://127.0.0.1:8900", rpcClient, inbox, statusFile, WebSocketClass = globalThis.WebSocket, reconnectMinMs = 500, reconnectMaxMs = 30_000, expectedGenesisHash = MAINNET_GENESIS_HASH }) {
    this.endpoint = validateLocalWsUrl(endpoint); this.rpcClient = rpcClient; this.inbox = inbox; this.statusFile = statusFile; this.WebSocketClass = WebSocketClass; this.reconnectMinMs = reconnectMinMs; this.reconnectMaxMs = reconnectMaxMs;
    this.expectedGenesisHash = expectedGenesisHash; this.genesisHash = null; this.socket = null; this.stopped = false; this.reconnectMs = reconnectMinMs; this.subscriptions = new Map(); this.lastSlots = { confirmed: null, finalized: null }; this.messageQueue = Promise.resolve(); this.lastError = null; this.metrics = { connections: 0, reconnects: 0, notifications: 0, gapRepairs: 0, decodeErrors: 0, skippedSlots: [] };
  }
  async start() { this.stopped = false; await this.initializeAndConnect(); return () => this.stop(); }
  async initializeAndConnect() { this.genesisHash = await this.rpcClient.assertGenesis(this.expectedGenesisHash); const prior = await readJson(this.statusFile); let names = []; try { names = await fs.readdir(this.inbox); } catch (error) { if (error.code !== "ENOENT") throw error; } if (!prior.genesisHash && names.some((name) => /\.(?:json|ndjson)$/i.test(name))) throw new Error("refusing to attach a verified network to an inbox with unknown genesis; use a new empty inbox"); if (prior.genesisHash && prior.genesisHash !== this.genesisHash) throw new Error(`refusing to reuse stream state from genesis ${prior.genesisHash}`); if (Number.isSafeInteger(prior.lastConfirmedSlot)) this.lastSlots.confirmed = prior.lastConfirmedSlot; if (Number.isSafeInteger(prior.lastFinalizedSlot)) this.lastSlots.finalized = prior.lastFinalizedSlot; await this.writeStatus(); this.connect(); }
  stop() { this.stopped = true; this.socket?.close(); this.socket = null; }
  connect() {
    if (this.stopped) return;
    const socket = new this.WebSocketClass(this.endpoint); this.socket = socket;
    socket.onopen = () => { this.metrics.connections++; this.reconnectMs = this.reconnectMinMs; this.subscriptions.clear(); for (const [id, commitment] of [[1, "confirmed"], [2, "finalized"]]) socket.send(JSON.stringify({ jsonrpc: "2.0", id, method: "blockSubscribe", params: ["all", { commitment, encoding: "jsonParsed", transactionDetails: "full", maxSupportedTransactionVersion: 0, showRewards: false }] })); };
    socket.onmessage = ({ data }) => { if (socket !== this.socket) return; this.messageQueue = this.messageQueue.then(() => this.handleMessage(data)).catch(async (error) => { this.metrics.decodeErrors++; this.lastError = { at: new Date().toISOString(), message: error.message }; await this.writeStatus(); }); };
    socket.onerror = () => {};
    socket.onclose = () => { if (this.stopped || socket !== this.socket) return; this.metrics.reconnects++; const delay = this.reconnectMs; this.reconnectMs = Math.min(this.reconnectMaxMs, this.reconnectMs * 2); setTimeout(() => this.connect(), delay); };
  }
  async handleMessage(data) {
    const payload = JSON.parse(String(data));
    if (payload.id === 1 || payload.id === 2) {
      const commitment = payload.id === 1 ? "confirmed" : "finalized", hasResult = Object.hasOwn(payload ?? {}, "result"), hasError = Object.hasOwn(payload ?? {}, "error");
      if (payload.jsonrpc !== "2.0" || hasResult === hasError || !Number.isSafeInteger(payload.result) || payload.result < 0 || this.subscriptions.has(payload.result) || [...this.subscriptions.values()].includes(commitment)) throw new Error(`invalid ${commitment} blockSubscribe acknowledgement`);
      this.subscriptions.set(payload.result, commitment); return;
    }
    if (payload.method !== "blockNotification") return;
    if (payload.jsonrpc !== "2.0") throw new Error("invalid blockNotification JSON-RPC version");
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
    const producedSlots = await this.rpcClient.call("getBlocks", [first, last, { commitment }]);
    if (!Array.isArray(producedSlots) || producedSlots.some((slot, index) => !Number.isSafeInteger(slot) || slot < first || slot > last || (index > 0 && producedSlots[index - 1] >= slot))) throw new Error("stream getBlocks response must be a strictly increasing in-range slot list");
    const produced = new Set(producedSlots);
    for (let slot = first; slot <= last; slot++) {
      if (!produced.has(slot)) { this.metrics.skippedSlots.push(slot); continue; }
      const block = await this.rpcClient.call("getBlock", [slot, { commitment, encoding: "jsonParsed", transactionDetails: "full", rewards: false, maxSupportedTransactionVersion: 0 }]);
      if (!block) throw new Error(`stream block ${slot} was listed by getBlocks but is unavailable`);
      await this.persistBlock(commitment, slot, block, last); this.metrics.gapRepairs++;
    }
    this.metrics.skippedSlots = [...new Set(this.metrics.skippedSlots)].sort((a, b) => a - b).slice(-10_000);
  }
  async persistBlock(commitment, slot, block, sourceTip) {
    const provenance = { source: "local-agave-pubsub", commitment, observedAt: new Date().toISOString(), sourceTip, exportLagSlots: Math.max(0, sourceTip - slot) };
    await atomicWrite(path.join(this.inbox, `${slot}.${commitment}.json`), { slot, ...block, provenance });
  }
  async writeStatus() {
    const previous = await readJson(this.statusFile); const durableSkippedSlots = [...new Set([...(previous.durableSkippedSlots ?? []), ...this.metrics.skippedSlots])].sort((a, b) => a - b).slice(-10_000);
    await atomicWrite(this.statusFile, { version: 2, source: "local-agave-pubsub", genesisHash: this.genesisHash, observedAt: new Date().toISOString(), connected: this.socket?.readyState === 1, lastConfirmedSlot: this.lastSlots.confirmed, lastFinalizedSlot: this.lastSlots.finalized, finalizationLagSlots: this.lastSlots.confirmed != null && this.lastSlots.finalized != null ? Math.max(0, this.lastSlots.confirmed - this.lastSlots.finalized) : null, ...this.metrics, lastError: this.lastError, durableSkippedSlots });
  }
}

async function main() {
  const config = loadConfig(); const rpcClient = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899");
  const stream = new LocalValidatorStream({ endpoint: process.env.LOCAL_VALIDATOR_WS || "ws://127.0.0.1:8900", rpcClient, inbox: config.inbox, statusFile: config.exporterStatusFile, reconnectMinMs: config.streamReconnectMinMs, reconnectMaxMs: config.streamReconnectMaxMs, expectedGenesisHash: process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH });
  await stream.start(); const stop = () => { stream.stop(); process.exit(0); }; process.once("SIGINT", stop); process.once("SIGTERM", stop);
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
