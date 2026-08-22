import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";

const CHAIN = "solana-mainnet";
const GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

function sqlLiteral(value) { return `'${String(value).replaceAll("'", "''")}'`; }

export function compileWarehouseBatch(state, checkpoint = { lastSequence: 0 }) {
  const lastSequence = Number(checkpoint?.lastSequence ?? 0);
  if (!Number.isSafeInteger(lastSequence) || lastSequence < 0) throw new Error("invalid warehouse checkpoint");
  if (!Number.isSafeInteger(state?.eventSequence) || !Array.isArray(state?.events)) throw new Error("invalid index event state");
  let previous = null;
  for (const event of state.events) { if (!Number.isSafeInteger(event?.sequence) || (previous != null && event.sequence !== previous + 1) || typeof event.type !== "string" || !event.type) throw new Error(previous != null && event?.sequence > previous + 1 ? "warehouse event sequence gap" : "invalid non-monotonic index event sequence"); if (!Number.isSafeInteger(event.slot) || event.slot < 0 || (event.blockTime != null && (!Number.isSafeInteger(event.blockTime) || event.blockTime < 0)) || !["confirmed", "finalized"].includes(event.provenance?.commitment) || typeof event.blockhash !== "string" || !event.blockhash) throw new Error(`invalid warehouse event ${event.sequence}`); previous = event.sequence; }
  if (state.events.length && previous !== state.eventSequence) throw new Error("index event high-water mark mismatch");
  if (lastSequence > state.eventSequence) throw new Error("warehouse checkpoint is ahead of index");
  const oldest = state.events[0]?.sequence ?? state.eventSequence + 1;
  if (lastSequence < oldest - 1) throw new Error("warehouse checkpoint is older than retained replay history");
  const events = state.events.filter((event) => event.sequence > lastSequence);
  if (events.length && events[0].sequence !== lastSequence + 1) throw new Error("warehouse event sequence gap");
  const rows = events.map((event) => ({ chain: CHAIN, sequence: event.sequence, event_type: event.type, slot: event.slot, block_time: event.blockTime == null ? null : new Date(event.blockTime * 1_000).toISOString(), commitment: event.provenance?.commitment ?? "unknown", blockhash: event.blockhash ?? "", payload: JSON.stringify(event) }));
  return { fromSequence: lastSequence + 1, toSequence: events.at(-1)?.sequence ?? lastSequence, events: rows };
}

export function checkpointSql(sequence) {
  if (!Number.isSafeInteger(sequence) || sequence < 0) throw new Error("invalid warehouse sequence");
  return `INSERT INTO ingestion_checkpoints (consumer, chain, genesis_hash, slot, cursor, schema_version) VALUES ('warehouse-canonical-events', 'solana', ${sqlLiteral(GENESIS_HASH)}, ${sequence}, ${sqlLiteral(String(sequence))}, 1) ON CONFLICT (consumer) DO UPDATE SET chain = EXCLUDED.chain, genesis_hash = EXCLUDED.genesis_hash, slot = EXCLUDED.slot, cursor = EXCLUDED.cursor, schema_version = EXCLUDED.schema_version, updated_at = now();\n`;
}

function runProcess(command, args, input, spawnProcess = spawn, env = process.env) {
  return new Promise((resolve, reject) => { const child = spawnProcess(command, args, { shell: false, windowsHide: true, stdio: ["pipe", "ignore", "pipe"], env }); let errorText = ""; child.stderr.on("data", (chunk) => { if (errorText.length < 8_192) errorText += chunk; }); child.on("error", reject); child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${command} warehouse sync failed (${code}): ${errorText.trim().slice(0, 512)}`))); child.stdin.end(input); });
}

export async function syncWarehouseBatch(batch, spawnProcess = spawn, env = process.env) {
  if (!batch.events.length) return { synced: 0, sequence: batch.toSequence };
  const body = `${batch.events.map((row) => JSON.stringify(row)).join("\n")}\n`;
  await runProcess("clickhouse-client", ["--query", "INSERT INTO terminal_dex.canonical_events FORMAT JSONEachRow"], body, spawnProcess, env);
  await runProcess("psql", ["--no-psqlrc", "--set", "ON_ERROR_STOP=1"], checkpointSql(batch.toSequence), spawnProcess, env);
  return { synced: batch.events.length, sequence: batch.toSequence };
}

export async function writeWarehouseCheckpoint(filename, sequence) {
  const temporary = `${filename}.${process.pid}.tmp`; await fs.mkdir(path.dirname(filename), { recursive: true }); await fs.writeFile(temporary, `${JSON.stringify({ schemaVersion: 1, consumer: "warehouse-canonical-events", lastSequence: sequence, updatedAt: new Date().toISOString() })}\n`, { mode: 0o600 }); await fs.rename(temporary, filename);
}

async function main() {
  const config = loadConfig(), checkpointFile = config.warehouseCheckpointFile; let checkpoint = { lastSequence: 0 };
  try { checkpoint = JSON.parse(await fs.readFile(checkpointFile, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const clientEnv = { ...process.env }; if (config.clickhousePasswordFile) { const password = (await fs.readFile(config.clickhousePasswordFile, "utf8")).trim(); if (!password) throw new Error("CLICKHOUSE_PASSWORD_FILE is empty"); clientEnv.CLICKHOUSE_PASSWORD = password; }
  const state = JSON.parse(await fs.readFile(config.dataFile, "utf8")), batch = compileWarehouseBatch(state, checkpoint), result = await syncWarehouseBatch(batch, spawn, clientEnv); await writeWarehouseCheckpoint(checkpointFile, result.sequence); console.log(JSON.stringify(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
