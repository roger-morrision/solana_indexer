#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";

export const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2dG";

export function validateLocalRpcUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "http:") throw new Error("Local validator RPC must use http://");
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)) throw new Error("Refusing non-loopback validator RPC endpoint");
  return url.href;
}

export class LocalValidatorClient {
  constructor(endpoint = "http://127.0.0.1:8899") { this.endpoint = validateLocalRpcUrl(endpoint); this.id = 0; }
  async call(method, params = []) {
    const response = await fetch(this.endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++this.id, method, params }), signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`local validator ${method}: HTTP ${response.status}`);
    const payload = await response.json(); if (payload.error) throw new Error(`local validator ${method}: ${payload.error.message}`); return payload.result;
  }
  async assertGenesis(expected = MAINNET_GENESIS_HASH) { const actual = await this.call("getGenesisHash"); if (expected !== "any" && actual !== expected) throw new Error(`validator genesis mismatch: expected ${expected}, received ${actual}`); return actual; }
}

async function readCursor(filename) { try { return Number((await fs.readFile(filename, "utf8")).trim()); } catch (error) { if (error.code === "ENOENT") return null; throw error; } }
async function atomicWrite(filename, body) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, body); await fs.rename(temporary, filename); }
async function readStatus(filename) { try { return JSON.parse(await fs.readFile(filename, "utf8")); } catch (error) { if (error.code === "ENOENT") return {}; throw error; } }

export async function exportFinalizedBlocks({ client, inbox, cursorFile, statusFile = null, batchSize = 32, expectedGenesisHash = null }) {
  let genesisHash = null;
  if (expectedGenesisHash) {
    genesisHash = await client.assertGenesis(expectedGenesisHash); const prior = statusFile ? await readStatus(statusFile) : {};
    let names = []; try { names = await fs.readdir(inbox); } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (!prior.genesisHash && names.some((name) => /\.(?:json|ndjson)$/i.test(name))) throw new Error("refusing to attach a verified network to an inbox with unknown genesis; use a new empty inbox");
    if (prior.genesisHash && prior.genesisHash !== genesisHash) throw new Error(`refusing to reuse exporter state from genesis ${prior.genesisHash}`);
  }
  const tip = await client.call("getSlot", [{ commitment: "finalized" }]);
  let cursor = await readCursor(cursorFile);
  if (cursor == null) cursor = Math.max(0, tip - 1);
  const end = Math.min(tip, cursor + batchSize); let exported = 0; const skippedSlots = [];
  for (let slot = cursor + 1; slot <= end; slot++) {
    const block = await client.call("getBlock", [slot, { commitment: "finalized", encoding: "jsonParsed", transactionDetails: "full", rewards: false, maxSupportedTransactionVersion: 0 }]);
    if (block) {
      const provenance = { source: "local-agave-rpc", commitment: "finalized", observedAt: new Date().toISOString(), sourceTip: tip, exportLagSlots: tip - slot };
      await atomicWrite(path.join(inbox, `${slot}.json`), `${JSON.stringify({ slot, ...block, provenance })}\n`); exported++;
    } else skippedSlots.push(slot);
    await atomicWrite(cursorFile, `${slot}\n`);
  }
  const result = { localValidatorTip: tip, cursor: end, lagSlots: tip - end, exported, skipped: skippedSlots.length, skippedSlots: skippedSlots.slice(0, 256) };
  if (statusFile) {
    const previous = await readStatus(statusFile);
    const durableSkippedSlots = [...new Set([...(previous.durableSkippedSlots ?? []), ...skippedSlots])].sort((a, b) => a - b).slice(-10_000);
    await atomicWrite(statusFile, `${JSON.stringify({ version: 2, source: "local-agave-rpc", genesisHash, commitment: "finalized", observedAt: new Date().toISOString(), ...result, durableSkippedSlots })}\n`);
  }
  return result;
}

async function main() {
  const config = loadConfig(); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899");
  const cursorFile = path.resolve(process.cwd(), process.env.EXPORTER_CURSOR_FILE || "data/exporter.cursor"); const batchSize = Math.min(256, Math.max(1, Number(process.env.EXPORTER_BATCH_SIZE) || 32)); const once = process.argv.includes("--once");
  const expectedGenesisHash = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH;
  do { console.log(JSON.stringify(await exportFinalizedBlocks({ client, inbox: config.inbox, cursorFile, statusFile: config.exporterStatusFile, batchSize, expectedGenesisHash }))); if (!once) await new Promise((resolve) => setTimeout(resolve, Number(process.env.EXPORTER_POLL_MS) || 2000)); } while (!once);
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
