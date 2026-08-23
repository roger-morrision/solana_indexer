#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { gzip, gunzip } from "node:zlib";
import { canonicalInboxNames, completeArchiveReceipt, createInboxManifest, readCanonicalInboxFile } from "./archive-receipt.js";
import { readBoundedFile } from "./bounded-json-file.js";
import { loadConfig } from "./config.js";
import { durableAtomicWrite } from "./durable-file.js";

const compress = promisify(gzip), decompress = promisify(gunzip);
const sha256 = (content) => crypto.createHash("sha256").update(content).digest("hex");

export async function archiveInbox({ inbox, archiveRoot, receiptFile, archiveId = new Date().toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[-:]/g, ""), maximumEntries = 100_000 }) {
  if (!/^[0-9]{8}T[0-9]{6}Z$/.test(archiveId)) throw new Error("archiveId must be a UTC timestamp token");
  const names = await canonicalInboxNames(inbox, maximumEntries);
  const root = path.resolve(archiveRoot); await fs.mkdir(root, { recursive: true }); const target = path.join(root, archiveId); let staging = await fs.mkdtemp(path.join(root, `.${archiveId}.`));
  try {
    const fingerprints = {}; let originalBytes = 0;
    for (const name of names) {
      const source = await readCanonicalInboxFile(inbox, name), fingerprint = sha256(source), destination = path.join(staging, `${name}.gz`);
      if (!Number.isSafeInteger(originalBytes + source.length)) throw new Error("archive source byte total exceeds the safe integer range");
      originalBytes += source.length;
      const encoded = await compress(source, { level: 9 }); if (sha256(await decompress(encoded)) !== fingerprint) throw new Error(`archive verification failed for ${name}`);
      await durableAtomicWrite(destination, encoded); fingerprints[name] = fingerprint;
    }
    const manifestFile = path.join(staging, "inbox-manifest.json"), archiveReceipt = path.join(staging, "inbox-archive-receipt.json"), manifest = await createInboxManifest({ inbox, output: manifestFile, archiveId, maximumEntries });
    if (JSON.stringify(manifest.files) !== JSON.stringify(fingerprints)) throw new Error("inbox changed while archive was being created");
    const receipt = await completeArchiveReceipt({ manifestFile, output: archiveReceipt, status: "verified_local" }), receiptBytes = await readBoundedFile(archiveReceipt, { maximumBytes: 16_777_216 }), expectedReceiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
    if (!Buffer.isBuffer(receiptBytes)) throw new Error(`generated archive receipt is unavailable: ${receiptBytes?.evidenceReadError ?? "missing"}`);
    if (!receiptBytes.equals(expectedReceiptBytes)) throw new Error("generated archive receipt does not match completion evidence");
    await fs.rename(staging, target); staging = null; await durableAtomicWrite(receiptFile, receiptBytes);
    return { archiveId, files: names.length, originalBytes, archiveDirectory: target, receiptFile, receipt };
  } finally { if (staging !== null && path.dirname(staging) === root && path.basename(staging).startsWith(`.${archiveId}.`)) await fs.rm(staging, { recursive: true, force: true }); }
}

async function main() { const config = loadConfig(), result = await archiveInbox({ inbox: config.inbox, archiveRoot: path.resolve(process.env.INBOX_ARCHIVE_ROOT ?? "archive-mainnet"), receiptFile: path.resolve(process.env.INBOX_ARCHIVE_RECEIPT_FILE ?? "data/inbox-archive-receipt.json"), maximumEntries: config.maxInboxEntries }); console.log(JSON.stringify({ archiveId: result.archiveId, files: result.files, originalBytes: result.originalBytes, archiveDirectory: result.archiveDirectory }, null, 2)); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
