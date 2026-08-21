#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { gzip, gunzip } from "node:zlib";
import { completeArchiveReceipt, createInboxManifest } from "./archive-receipt.js";
import { loadConfig } from "./config.js";

const compress = promisify(gzip), decompress = promisify(gunzip);
const sha256 = (content) => crypto.createHash("sha256").update(content).digest("hex");

export async function archiveInbox({ inbox, archiveRoot, receiptFile, archiveId = new Date().toISOString().replace(/[-:.]/g, "") }) {
  if (!/^[0-9TZ]+$/.test(archiveId)) throw new Error("archiveId must be a UTC timestamp token");
  await fs.mkdir(archiveRoot, { recursive: true }); const target = path.join(archiveRoot, archiveId); await fs.mkdir(target, { recursive: false });
  const fingerprints = {}, names = (await fs.readdir(inbox)).filter((name) => /\.(?:json|ndjson)$/i.test(name)).sort();
  for (const name of names) {
    const source = await fs.readFile(path.join(inbox, name)), fingerprint = sha256(source), destination = path.join(target, `${name}.gz`), temporary = `${destination}.${process.pid}.tmp`;
    const encoded = await compress(source, { level: 9 }); await fs.writeFile(temporary, encoded, { mode: 0o600 });
    if (sha256(await decompress(await fs.readFile(temporary))) !== fingerprint) throw new Error(`archive verification failed for ${name}`);
    await fs.rename(temporary, destination); fingerprints[name] = fingerprint;
  }
  const manifestFile = path.join(target, "inbox-manifest.json"), archiveReceipt = path.join(target, "inbox-archive-receipt.json"), manifest = await createInboxManifest({ inbox, output: manifestFile, archiveId });
  if (JSON.stringify(manifest.files) !== JSON.stringify(fingerprints)) throw new Error("inbox changed while archive was being created");
  const receipt = await completeArchiveReceipt({ manifestFile, output: archiveReceipt, status: "verified_local" });
  await fs.mkdir(path.dirname(receiptFile), { recursive: true }); const temporaryReceipt = `${receiptFile}.${process.pid}.tmp`; await fs.copyFile(archiveReceipt, temporaryReceipt); await fs.rename(temporaryReceipt, receiptFile);
  return { archiveId, files: names.length, originalBytes: (await Promise.all(names.map((name) => fs.stat(path.join(inbox, name))))).reduce((sum, row) => sum + row.size, 0), archiveDirectory: target, receiptFile, receipt };
}

async function main() { const config = loadConfig(), result = await archiveInbox({ inbox: config.inbox, archiveRoot: path.resolve(process.env.INBOX_ARCHIVE_ROOT ?? "archive-mainnet"), receiptFile: path.resolve(process.env.INBOX_ARCHIVE_RECEIPT_FILE ?? "data/inbox-archive-receipt.json") }); console.log(JSON.stringify({ archiveId: result.archiveId, files: result.files, originalBytes: result.originalBytes, archiveDirectory: result.archiveDirectory }, null, 2)); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
