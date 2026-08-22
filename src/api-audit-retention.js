import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { durableAtomicWrite } from "./durable-file.js";

export async function retainApiAudit({ filename, defaultRetentionDays = 30, now = Date.now(), confirm = false }) {
  if (!filename) throw new Error("API audit log file is required"); if (!Number.isInteger(defaultRetentionDays) || defaultRetentionDays < 1 || defaultRetentionDays > 3_650) throw new Error("invalid default audit retention days");
  let text; try { text = await fs.readFile(filename, "utf8"); } catch (error) { if (error.code === "ENOENT") return { available: false, confirmRequired: true, retained: 0, eligible: 0, deleted: 0 }; throw error; }
  const lines = text.split(/\r?\n/).filter(Boolean), retained = [], eligible = [];
  for (let index = 0; index < lines.length; index++) { let row; try { row = JSON.parse(lines[index]); } catch { throw new Error(`invalid audit JSON at line ${index + 1}`); } const observed = Date.parse(row?.observedAt ?? ""), retentionDays = row?.retentionDays ?? defaultRetentionDays; if (row?.schemaVersion !== 1 || !Number.isFinite(observed) || !Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3_650) throw new Error(`invalid audit record at line ${index + 1}`); if (observed + retentionDays * 86_400_000 <= now) eligible.push(lines[index]); else retained.push(lines[index]); }
  if (confirm && eligible.length) await durableAtomicWrite(filename, retained.length ? `${retained.join("\n")}\n` : "");
  return { available: true, confirmRequired: !confirm, retained: retained.length, eligible: eligible.length, deleted: confirm ? eligible.length : 0 };
}

async function main() { const config = loadConfig(), confirm = process.argv.includes("--confirm-delete"), result = await retainApiAudit({ filename: config.auditLogFile, defaultRetentionDays: config.auditRetentionDays, confirm }); if (!confirm) console.warn("dry run only; pass --confirm-delete after reviewing eligible records"); console.log(JSON.stringify(result, null, 2)); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
