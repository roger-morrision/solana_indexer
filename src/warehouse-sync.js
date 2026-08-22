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

function factBase(row) {
  if (!Number.isSafeInteger(row?.slot) || row.slot < 0 || (row.blockTime != null && (!Number.isSafeInteger(row.blockTime) || row.blockTime < 0)) || typeof row.signature !== "string" || !row.signature || !["confirmed", "finalized"].includes(row.provenance?.commitment)) throw new Error("invalid canonical warehouse fact");
  return { chain: CHAIN, slot: row.slot, block_time: row.blockTime == null ? null : new Date(row.blockTime * 1_000).toISOString(), signature: row.signature, commitment: row.provenance.commitment };
}

export function compileWarehouseFacts(state, batch) {
  const slots = [...new Set(batch.events.map((event) => event.slot))].sort((a, b) => a - b), selected = (rows) => (rows ?? []).filter((row) => slots.includes(row.slot));
  const identities = new Set(), unique = (identity) => { if (identities.has(identity)) throw new Error(`duplicate canonical warehouse fact ${identity}`); identities.add(identity); };
  const instructions = selected(state.instructions).map((row) => { const base = factBase(row); if (!Number.isInteger(row.instructionIndex) || row.instructionIndex < 0 || (row.innerIndex != null && (!Number.isInteger(row.innerIndex) || row.innerIndex < 0)) || typeof row.eventId !== "string" || !row.eventId || typeof row.programId !== "string" || !row.programId || !Array.isArray(row.accounts) || !/^([0-9a-f]{64})$/.test(row.rawPayloadHash ?? "")) throw new Error("invalid canonical instruction fact"); unique(`instruction:${row.eventId}`); return { ...base, event_id: row.eventId, instruction_index: row.instructionIndex, inner_index: row.innerIndex, program_id: row.programId, protocol: row.protocol ?? null, registry_version: row.registryVersion, decoder_version: row.decoderVersion ?? null, parsed_type: row.parsedType ?? null, accounts: row.accounts, data: row.data ?? null, raw_payload_hash: row.rawPayloadHash, payload: JSON.stringify(row) }; });
  const swaps = selected(state.swaps).map((row) => { const base = factBase(row); if (typeof row.swapId !== "string" || !row.swapId || !Number.isInteger(row.eventIndex) || row.eventIndex < 0 || !row.pool || !row.protocol || !row.baseMint || !row.quoteMint || !row.inputMint || !row.outputMint || !/^\d+$/.test(row.inputAmountRaw ?? "") || !/^\d+$/.test(row.outputAmountRaw ?? "") || (row.tradeFeeRaw != null && !/^\d+$/.test(row.tradeFeeRaw)) || !/^([0-9a-f]{64})$/.test(row.rawPayloadHash ?? "")) throw new Error("invalid canonical swap fact"); unique(`swap:${row.swapId}`); return { ...base, swap_id: row.swapId, event_index: row.eventIndex, pool: row.pool, protocol: row.protocol, base_mint: row.baseMint, quote_mint: row.quoteMint, input_mint: row.inputMint, output_mint: row.outputMint, input_amount_raw: row.inputAmountRaw, output_amount_raw: row.outputAmountRaw, trade_fee_raw: row.tradeFeeRaw ?? null, decoder_version: row.decoderVersion ?? null, raw_payload_hash: row.rawPayloadHash, payload: JSON.stringify(row) }; });
  const balanceChanges = selected(state.balanceChanges).map((row) => { const base = factBase(row); if (!Number.isInteger(row.accountIndex) || row.accountIndex < 0 || !row.tokenAccount || !row.mint || !Number.isInteger(row.decimals) || row.decimals < 0 || row.decimals > 255 || !/^\d+$/.test(row.preAmountRaw ?? "") || !/^\d+$/.test(row.postAmountRaw ?? "") || typeof row.closed !== "boolean") throw new Error("invalid canonical balance fact"); unique(`balance:${row.signature}:${row.accountIndex}`); return { ...base, account_index: row.accountIndex, token_account: row.tokenAccount, owner: row.owner ?? null, program_id: row.programId ?? null, mint: row.mint, decimals: row.decimals, pre_amount_raw: row.preAmountRaw, post_amount_raw: row.postAmountRaw, closed: row.closed ? 1 : 0, payload: JSON.stringify(row) }; });
  return { slots, instructions, swaps, balanceChanges };
}

export function checkpointSql(sequence) {
  if (!Number.isSafeInteger(sequence) || sequence < 0) throw new Error("invalid warehouse sequence");
  return `INSERT INTO ingestion_checkpoints (consumer, chain, genesis_hash, slot, cursor, schema_version) VALUES ('warehouse-canonical-events', 'solana', ${sqlLiteral(GENESIS_HASH)}, ${sequence}, ${sqlLiteral(String(sequence))}, 1) ON CONFLICT (consumer) DO UPDATE SET chain = EXCLUDED.chain, genesis_hash = EXCLUDED.genesis_hash, slot = EXCLUDED.slot, cursor = EXCLUDED.cursor, schema_version = EXCLUDED.schema_version, updated_at = now();\n`;
}

function jsonbLiteral(value) { return `${sqlLiteral(JSON.stringify(value))}::jsonb`; }

export function compileWarehouseMetadataSql(state, sequence) {
  if (!state?.mints || typeof state.mints !== "object" || Array.isArray(state.mints)) throw new Error("invalid warehouse mint state"); checkpointSql(sequence);
  const rows = Object.entries(state.mints).sort(([left], [right]) => left.localeCompare(right)).map(([mint, row]) => { const info = row?.mintInfo ?? null, decimals = info?.decimals ?? null, sourceSlot = row?.authoritySourceSlot ?? row?.lastSlot ?? null, transferCount = row?.transferCount ?? 0, swapCount = row?.swapCount ?? 0, lastSlot = row?.lastSlot ?? null, lastBlockTime = row?.lastBlockTime ?? null; if (!mint || /[\u0000-\u001f]/.test(mint) || (decimals != null && (!Number.isInteger(decimals) || decimals < 0 || decimals > 255)) || (sourceSlot != null && (!Number.isSafeInteger(sourceSlot) || sourceSlot < 0)) || !Number.isSafeInteger(transferCount) || transferCount < 0 || !Number.isSafeInteger(swapCount) || swapCount < 0 || (lastSlot != null && (!Number.isSafeInteger(lastSlot) || lastSlot < 0)) || (lastBlockTime != null && (!Number.isSafeInteger(lastBlockTime) || lastBlockTime < 0))) throw new Error(`invalid warehouse mint metadata ${mint}`); const metadata = { transferCount, swapCount, lastSlot, lastBlockTime }, authorities = { mintAuthority: info?.mintAuthority ?? null, freezeAuthority: info?.freezeAuthority ?? null }, extensions = Array.isArray(info?.extensions) ? info.extensions : []; return `('solana', ${sqlLiteral(mint)}, ${decimals ?? "NULL"}, ${jsonbLiteral(metadata)}, ${jsonbLiteral(authorities)}, ${jsonbLiteral(extensions)}, ${sourceSlot ?? "NULL"})`; });
  return `BEGIN;\n${rows.length ? `INSERT INTO tokens (chain, mint, decimals, metadata, authorities, extensions, source_slot) VALUES\n${rows.join(",\n")}\nON CONFLICT (chain, mint) DO UPDATE SET decimals = EXCLUDED.decimals, metadata = EXCLUDED.metadata, authorities = EXCLUDED.authorities, extensions = EXCLUDED.extensions, source_slot = EXCLUDED.source_slot, updated_at = now();\n` : ""}${checkpointSql(sequence)}COMMIT;\n`;
}

export function assessWarehouseCheckpoint(checkpoint, eventSequence, oldestSequence, staleAfterMs = 300_000, maxLagEvents = 1_000, now = Date.now()) {
  const unavailable = (reason) => ({ available: false, healthy: false, reason, sequence: null, eventSequence, lagEvents: null, ageMs: null, staleAfterMs, maxLagEvents });
  if (!checkpoint) return unavailable("checkpoint_unavailable");
  const updated = Date.parse(checkpoint.updatedAt ?? ""), sequence = Number(checkpoint.lastSequence);
  if (checkpoint.schemaVersion !== 1 || checkpoint.consumer !== "warehouse-canonical-events" || !Number.isSafeInteger(sequence) || sequence < 0 || !Number.isSafeInteger(eventSequence) || eventSequence < 0 || !Number.isSafeInteger(oldestSequence) || oldestSequence < 1 || !Number.isFinite(updated)) return unavailable("checkpoint_invalid");
  if (sequence > eventSequence) return { ...unavailable("checkpoint_ahead_of_index"), sequence };
  const lagEvents = eventSequence - sequence, ageMs = now - updated, replayHistoryLost = sequence < oldestSequence - 1, reason = ageMs < 0 ? "checkpoint_clock_skew" : replayHistoryLost ? "checkpoint_behind_replay_history" : lagEvents > maxLagEvents ? "warehouse_lag_exceeded" : ageMs > staleAfterMs ? "warehouse_checkpoint_stale" : null;
  return { available: true, healthy: reason == null, reason, sequence, eventSequence, oldestSequence, lagEvents, ageMs, staleAfterMs, maxLagEvents, replayHistoryLost };
}

function runProcess(command, args, input, spawnProcess = spawn, env = process.env) {
  return new Promise((resolve, reject) => { const child = spawnProcess(command, args, { shell: false, windowsHide: true, stdio: ["pipe", "ignore", "pipe"], env }); let errorText = ""; child.stderr.on("data", (chunk) => { if (errorText.length < 8_192) errorText += chunk; }); child.on("error", reject); child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${command} warehouse sync failed (${code}): ${errorText.trim().slice(0, 512)}`))); child.stdin.end(input); });
}

export async function syncWarehouseBatch(batch, spawnProcess = spawn, env = process.env, facts = null, postgresSql = checkpointSql(batch.toSequence)) {
  if (!batch.events.length) return { synced: 0, sequence: batch.toSequence };
  if (facts && (!Array.isArray(facts.slots) || facts.slots.some((slot) => !Number.isSafeInteger(slot) || slot < 0) || !Array.isArray(facts.instructions) || !Array.isArray(facts.swaps) || !Array.isArray(facts.balanceChanges))) throw new Error("invalid warehouse facts");
  if (typeof postgresSql !== "string" || !postgresSql.trim()) throw new Error("invalid warehouse PostgreSQL transaction");
  const body = `${batch.events.map((row) => JSON.stringify(row)).join("\n")}\n`;
  await runProcess("clickhouse-client", ["--query", "INSERT INTO terminal_dex.canonical_events FORMAT JSONEachRow"], body, spawnProcess, env);
  if (facts) {
    const suffixes = [["canonical_instructions", facts.instructions], ["canonical_swaps", facts.swaps], ["canonical_balance_changes", facts.balanceChanges]];
    if (facts.slots.length) for (const [table, rows] of suffixes) { const slotList = facts.slots.join(","); await runProcess("clickhouse-client", ["--multiquery", "--query", `ALTER TABLE terminal_dex.${table} DELETE WHERE slot IN (${slotList}) SETTINGS mutations_sync = 2`], "", spawnProcess, env); if (rows.length) await runProcess("clickhouse-client", ["--query", `INSERT INTO terminal_dex.${table} FORMAT JSONEachRow`], `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, spawnProcess, env); }
  }
  await runProcess("psql", ["--no-psqlrc", "--set", "ON_ERROR_STOP=1"], postgresSql, spawnProcess, env);
  return { synced: batch.events.length, sequence: batch.toSequence };
}

export async function writeWarehouseCheckpoint(filename, sequence) {
  const temporary = `${filename}.${process.pid}.tmp`; await fs.mkdir(path.dirname(filename), { recursive: true }); await fs.writeFile(temporary, `${JSON.stringify({ schemaVersion: 1, consumer: "warehouse-canonical-events", lastSequence: sequence, updatedAt: new Date().toISOString() })}\n`, { mode: 0o600 }); await fs.rename(temporary, filename);
}

async function main() {
  const config = loadConfig(), checkpointFile = config.warehouseCheckpointFile; let checkpoint = { lastSequence: 0 };
  try { checkpoint = JSON.parse(await fs.readFile(checkpointFile, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const clientEnv = { ...process.env }; if (config.clickhousePasswordFile) { const password = (await fs.readFile(config.clickhousePasswordFile, "utf8")).trim(); if (!password) throw new Error("CLICKHOUSE_PASSWORD_FILE is empty"); clientEnv.CLICKHOUSE_PASSWORD = password; }
  const state = JSON.parse(await fs.readFile(config.dataFile, "utf8")), batch = compileWarehouseBatch(state, checkpoint), facts = compileWarehouseFacts(state, batch), postgresSql = compileWarehouseMetadataSql(state, batch.toSequence), result = await syncWarehouseBatch(batch, spawn, clientEnv, facts, postgresSql); await writeWarehouseCheckpoint(checkpointFile, result.sequence); console.log(JSON.stringify({ ...result, instructions: facts.instructions.length, swaps: facts.swaps.length, balanceChanges: facts.balanceChanges.length, tokens: Object.keys(state.mints).length }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
