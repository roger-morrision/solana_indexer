#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";

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
}

async function readCursor(filename) { try { return Number((await fs.readFile(filename, "utf8")).trim()); } catch (error) { if (error.code === "ENOENT") return null; throw error; } }
async function atomicWrite(filename, body) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, body); await fs.rename(temporary, filename); }

export async function exportFinalizedBlocks({ client, inbox, cursorFile, batchSize = 32 }) {
  const tip = await client.call("getSlot", [{ commitment: "finalized" }]);
  let cursor = await readCursor(cursorFile);
  if (cursor == null) cursor = Math.max(0, tip - 1);
  const end = Math.min(tip, cursor + batchSize); let exported = 0, skipped = 0;
  for (let slot = cursor + 1; slot <= end; slot++) {
    const block = await client.call("getBlock", [slot, { commitment: "finalized", encoding: "jsonParsed", transactionDetails: "full", rewards: false, maxSupportedTransactionVersion: 0 }]);
    if (block) { await atomicWrite(path.join(inbox, `${slot}.json`), `${JSON.stringify({ slot, ...block })}\n`); exported++; } else skipped++;
    await atomicWrite(cursorFile, `${slot}\n`);
  }
  return { localValidatorTip: tip, cursor: end, exported, skipped };
}

async function main() {
  const config = loadConfig(); const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899");
  const cursorFile = path.resolve(process.cwd(), process.env.EXPORTER_CURSOR_FILE || "data/exporter.cursor"); const batchSize = Math.min(256, Math.max(1, Number(process.env.EXPORTER_BATCH_SIZE) || 32)); const once = process.argv.includes("--once");
  do { console.log(JSON.stringify(await exportFinalizedBlocks({ client, inbox: config.inbox, cursorFile, batchSize }))); if (!once) await new Promise((resolve) => setTimeout(resolve, Number(process.env.EXPORTER_POLL_MS) || 2000)); } while (!once);
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
