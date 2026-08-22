#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { fetchOffchainTokenMetadata } from "./offchain-token-metadata.js";

const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }

export async function createOffchainMetadataSnapshot({ mint, onchainMetadataHash, uri, observedAt = new Date().toISOString(), fetchMetadata = fetchOffchainTokenMetadata }) {
  if (!ADDRESS.test(mint ?? "") || !/^[0-9a-f]{64}$/.test(onchainMetadataHash ?? "") || typeof uri !== "string" || !Number.isFinite(Date.parse(observedAt)) || typeof fetchMetadata !== "function") throw new Error("off-chain metadata snapshot request is invalid"); let canonicalUri; try { canonicalUri = new URL(uri).toString(); } catch { throw new Error("off-chain metadata snapshot request is invalid"); } const metadata = await fetchMetadata({ uri: canonicalUri, observedAt }); if (metadata?.sourceUri !== canonicalUri || metadata.observedAt !== observedAt || metadata.trusted !== false || metadata.automationSafe !== false) throw new Error("off-chain metadata fetch result is invalid"); return { schemaVersion: 1, type: "offchain_token_metadata_snapshot", chain: "solana", observedAt, entries: [{ mint, onchainMetadataHash, metadata }] };
}

async function main() { const [, , artifactOnly, mint, onchainMetadataHash, uri] = process.argv; if (artifactOnly !== "--artifact-only") throw new Error("off-chain metadata snapshots require --artifact-only"); const snapshot = await createOffchainMetadataSnapshot({ mint, onchainMetadataHash, uri }), config = loadConfig(); await atomicWrite(config.offchainMetadataSnapshotFile, snapshot); console.log(JSON.stringify({ mint, observedAt: snapshot.observedAt, artifactOnly: true })); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
