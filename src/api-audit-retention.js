import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { durableAtomicRewriteIfUnchanged } from "./durable-file.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { decodeUtf8, readBoundedFile } from "./bounded-json-file.js";

export const MAX_AUDIT_RETENTION_BYTES = 67_108_864;
export const MAX_AUDIT_RETENTION_RECORDS = 250_000;

export async function retainApiAudit({ filename, defaultRetentionDays = 30, now = Date.now(), confirm = false, expectedSha256 = null, writerQuiesced = false, maximumBytes = MAX_AUDIT_RETENTION_BYTES, maximumRecords = MAX_AUDIT_RETENTION_RECORDS }) {
  if (!filename) throw new Error("API audit log file is required"); if (!Number.isInteger(defaultRetentionDays) || defaultRetentionDays < 1 || defaultRetentionDays > 3_650) throw new Error("invalid default audit retention days"); if (!Number.isSafeInteger(now) || now < 0 || now > 8_640_000_000_000_000) throw new Error("invalid audit retention time");
  if (!Number.isSafeInteger(maximumRecords) || maximumRecords < 1) throw new Error("maximum audit records must be a positive safe integer");
  const content = await readBoundedFile(filename, { maximumBytes, missing: null });
  if (content == null) return { available: false, confirmRequired: true, retained: 0, eligible: 0, deleted: 0 };
  if (!Buffer.isBuffer(content)) throw new Error(`audit retention source is unsafe: ${content.evidenceReadError}`);
  const text = decodeUtf8(content), contentSha256 = crypto.createHash("sha256").update(content).digest("hex");
  const lines = text.split(/\r?\n/).filter(Boolean), retained = [], eligible = [];
  if (lines.length > maximumRecords) throw new Error("audit retention record limit exceeded");
  for (let index = 0; index < lines.length; index++) { let row; try { row = JSON.parse(lines[index]); } catch { throw new Error(`invalid audit JSON at line ${index + 1}`); } const observed = parseCanonicalUtcTimestamp(row?.observedAt), retentionDays = row?.retentionDays ?? defaultRetentionDays; if (row?.schemaVersion !== 1 || observed == null || !Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3_650) throw new Error(`invalid audit record at line ${index + 1}`); if (observed + retentionDays * 86_400_000 <= now) eligible.push(lines[index]); else retained.push(lines[index]); }
  if (confirm && (!writerQuiesced || expectedSha256 !== contentSha256)) throw new Error(!writerQuiesced ? "audit writer must be quiesced before deletion" : "audit retention source digest changed");
  if (confirm && eligible.length) await durableAtomicRewriteIfUnchanged(filename, expectedSha256, retained.length ? `${retained.join("\n")}\n` : "", { maximumBytes });
  return { available: true, confirmRequired: !confirm, contentSha256, retained: retained.length, eligible: eligible.length, deleted: confirm ? eligible.length : 0 };
}

async function main() { const config = loadConfig(), confirm = process.argv.includes("--confirm-delete"), writerQuiesced = process.argv.includes("--writer-quiesced"), expectedSha256 = process.argv.find((value) => value.startsWith("--expected-sha256="))?.slice("--expected-sha256=".length) ?? null, result = await retainApiAudit({ filename: config.auditLogFile, defaultRetentionDays: config.auditRetentionDays, confirm, writerQuiesced, expectedSha256 }); if (!confirm) console.warn("dry run only; stop the API writer, then pass --confirm-delete --writer-quiesced and the reviewed --expected-sha256 digest"); console.log(JSON.stringify(result, null, 2)); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
