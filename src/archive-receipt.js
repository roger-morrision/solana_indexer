#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { durableAtomicWrite } from "./durable-file.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";

const sha256 = (content) => crypto.createHash("sha256").update(content).digest("hex");
const ARCHIVE_ID = /^[0-9]{8}T[0-9]{6}Z$/;
const SHA256 = /^[0-9a-f]{64}$/;
const MAX_INBOX_FILE_BYTES = 256 * 1_024 * 1_024;
export function canonicalInboxName(name) { return typeof name === "string" && Buffer.byteLength(name) <= 100 && /^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:json|ndjson)$/.test(name); }
async function inspectCanonicalInboxFile(inbox, name) { if (!canonicalInboxName(name)) throw new Error(`invalid inbox filename: ${name}`); const filename = path.join(inbox, name), stat = await fs.lstat(filename); if (!stat.isFile() || stat.isSymbolicLink() || !Number.isSafeInteger(stat.size) || stat.size < 1 || stat.size > MAX_INBOX_FILE_BYTES) throw new Error(`inbox entry is not a bounded regular file: ${name}`); return { filename, size: stat.size }; }
export async function readCanonicalInboxFile(inbox, name) { const inspected = await inspectCanonicalInboxFile(inbox, name), content = await fs.readFile(inspected.filename); if (content.length !== inspected.size) throw new Error(`inbox entry changed while being read: ${name}`); return content; }
export async function canonicalInboxNames(inbox) { const names = (await fs.readdir(inbox)).filter((name) => /\.(?:json|ndjson)$/i.test(name)).sort(); for (const name of names) await inspectCanonicalInboxFile(inbox, name); return names; }

async function writeAtomic(filename, value) {
  await durableAtomicWrite(filename, `${JSON.stringify(value, null, 2)}\n`);
}

export async function createInboxManifest({ inbox, output, archiveId }) {
  if (!ARCHIVE_ID.test(archiveId ?? "")) throw new Error("invalid inbox archive identity");
  const files = {};
  for (const name of await canonicalInboxNames(inbox)) {
    files[name] = sha256(await readCanonicalInboxFile(inbox, name));
  }
  const manifest = { schemaVersion: 1, archiveId, files };
  await writeAtomic(output, manifest);
  return manifest;
}

export async function completeArchiveReceipt({ manifestFile, output, completedAt = new Date().toISOString(), status = "uploaded" }) {
  const manifestStat = await fs.lstat(manifestFile); if (!manifestStat.isFile() || manifestStat.isSymbolicLink() || !Number.isSafeInteger(manifestStat.size) || manifestStat.size < 1 || manifestStat.size > 16_777_216 || parseCanonicalUtcTimestamp(completedAt) == null) throw new Error("invalid inbox archive manifest or completion time"); const manifestBytes = await fs.readFile(manifestFile); if (manifestBytes.length !== manifestStat.size) throw new Error("inbox archive manifest changed while being read");
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const entries = Object.entries(manifest.files ?? {}); if (manifest.schemaVersion !== 1 || !ARCHIVE_ID.test(manifest.archiveId ?? "") || !manifest.files || Array.isArray(manifest.files) || typeof manifest.files !== "object" || entries.some(([name, hash]) => !canonicalInboxName(name) || !SHA256.test(hash))) throw new Error("invalid inbox archive manifest");
  if (!["uploaded", "verified_local"].includes(status)) throw new Error("invalid archive receipt status");
  const receipt = { ...manifest, storage: "self-hosted", status, completedAt, ...(status === "uploaded" ? { uploadCompletedAt: completedAt } : {}), manifestSha256: sha256(manifestBytes) };
  await writeAtomic(output, receipt);
  return receipt;
}

async function main() {
  const [command, input, output, archiveId] = process.argv.slice(2);
  if (command === "manifest" && input && output && archiveId) return createInboxManifest({ inbox: input, output, archiveId });
  if (command === "complete" && input && output) return completeArchiveReceipt({ manifestFile: input, output });
  throw new Error("usage: archive-receipt.js manifest <inbox> <output> <archive-id> | complete <manifest> <output>");
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
