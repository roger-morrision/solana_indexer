#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { durableAtomicWrite } from "./durable-file.js";

const sha256 = (content) => crypto.createHash("sha256").update(content).digest("hex");

async function writeAtomic(filename, value) {
  await durableAtomicWrite(filename, `${JSON.stringify(value, null, 2)}\n`);
}

export async function createInboxManifest({ inbox, output, archiveId }) {
  const files = {};
  for (const name of (await fs.readdir(inbox)).filter((value) => /\.(?:json|ndjson)$/i.test(value)).sort()) {
    files[name] = sha256(await fs.readFile(path.join(inbox, name)));
  }
  const manifest = { schemaVersion: 1, archiveId, files };
  await writeAtomic(output, manifest);
  return manifest;
}

export async function completeArchiveReceipt({ manifestFile, output, completedAt = new Date().toISOString(), status = "uploaded" }) {
  const manifestBytes = await fs.readFile(manifestFile);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (manifest.schemaVersion !== 1 || !manifest.archiveId || !manifest.files) throw new Error("invalid inbox archive manifest");
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
