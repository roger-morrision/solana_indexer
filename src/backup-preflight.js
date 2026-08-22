#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REQUIRED = new Set(["postgres.dump", "clickhouse-instructions.native", "clickhouse-swaps.native", "clickhouse-balance_changes.native", "clickhouse-dead_letters.native", "redis.rdb", "indexer-state.tar", "inbox-manifest.json", "manifest.json"]);
function safeName(value) { return typeof value === "string" && /^[a-z0-9][a-z0-9._-]{0,127}$/i.test(value) && value !== "." && value !== ".."; }
async function sha256(filename) { const hash = crypto.createHash("sha256"); for await (const chunk of createReadStream(filename)) hash.update(chunk); return hash.digest("hex"); }
function parseSums(text) { const rows = new Map(); for (const [index, line] of text.trim().split(/\r?\n/).entries()) { const match = /^([0-9a-f]{64})  ([A-Za-z0-9][A-Za-z0-9._-]{0,127})$/.exec(line); if (!match || rows.has(match[2])) throw new Error(`invalid SHA256SUMS line ${index + 1}`); rows.set(match[2], match[1]); } return rows; }
async function tarInventory(filename) {
  const handle = await fs.open(filename, "r"), names = [], seen = new Set(); let offset = 0;
  try { while (true) {
    const header = Buffer.alloc(512), { bytesRead } = await handle.read(header, 0, 512, offset); if (bytesRead === 0) break; if (bytesRead !== 512) throw new Error("truncated indexer-state tar header"); if (header.every((byte) => byte === 0)) break;
    const read = (start, length) => header.subarray(start, start + length).toString("utf8").replace(/\0.*$/s, ""), name = [read(345, 155), read(0, 100)].filter(Boolean).join("/"), sizeText = read(124, 12).trim(), type = read(156, 1) || "0";
    if (!name || path.posix.isAbsolute(name) || name.split("/").includes("..") || seen.has(name)) throw new Error("unsafe or duplicate indexer-state tar member");
    if (!/^[0-7]+$/.test(sizeText)) throw new Error(`invalid tar size for ${name}`); const size = Number.parseInt(sizeText, 8); if (!Number.isSafeInteger(size) || size < 0 || !["0", "5"].includes(type)) throw new Error(`unsupported tar member ${name}`);
    const stored = Number.parseInt(read(148, 8).trim(), 8), checksumHeader = Buffer.from(header); checksumHeader.fill(0x20, 148, 156); const computed = checksumHeader.reduce((sum, byte) => sum + byte, 0); if (stored !== computed) throw new Error(`invalid tar header checksum for ${name}`);
    offset += 512 + Math.ceil(size / 512) * 512; if (offset > (await handle.stat()).size) throw new Error(`truncated tar member ${name}`); seen.add(name); names.push(name);
  } } finally { await handle.close(); }
  if (!names.includes("data/index.json") || !names.includes("data/exporter-status.json")) throw new Error("indexer-state tar lacks required canonical state"); return names.sort();
}

export async function preflightBackup(directory, { now = Date.now(), maximumAgeMs = 24 * 60 * 60 * 1_000 } = {}) {
  if (!path.isAbsolute(directory)) throw new Error("backup directory must be absolute"); const root = path.resolve(directory); if (root === path.parse(root).root || !Number.isSafeInteger(maximumAgeMs) || maximumAgeMs < 1) throw new Error("invalid backup preflight parameters");
  const sums = parseSums(await fs.readFile(path.join(root, "SHA256SUMS"), "utf8")); if (sums.size !== REQUIRED.size || [...REQUIRED].some((name) => !sums.has(name))) throw new Error("backup checksum inventory is incomplete or unexpected");
  for (const [name, expected] of sums) { if (!safeName(name) || await sha256(path.join(root, name)) !== expected) throw new Error(`backup checksum mismatch for ${name}`); }
  const manifest = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8")), createdAtMs = Date.parse(manifest.createdAt); if (manifest.schemaVersion !== 1 || manifest.chain !== "solana" || manifest.scope !== "postgres-clickhouse-redis-indexer-state" || !Number.isFinite(createdAtMs) || createdAtMs > now || now - createdAtMs > maximumAgeMs) throw new Error("backup manifest is invalid, future-dated, or outside RPO");
  const members = await tarInventory(path.join(root, "indexer-state.tar")); return { schemaVersion: 1, kind: "backup_restore_preflight", createdAt: manifest.createdAt, ageMs: now - createdAtMs, checksumFiles: sums.size, tarMembers: members, restoreAuthorized: false, invariants: { completeInventory: true, checksums: true, rpo: true, safeTar: true, canonicalStatePresent: true } };
}

async function main() { if (process.argv.length !== 3) throw new Error("usage: backup-preflight.js /absolute/backup-directory"); console.log(JSON.stringify(await preflightBackup(process.argv[2]))); }
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invoked.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
