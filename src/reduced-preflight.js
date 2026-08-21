#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateProviderUrl } from "./external-rpc.js";
import { MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";

function parseEnvironment(text) { const values = {}; for (const raw of text.split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith("#")) continue; const index = line.indexOf("="); if (index <= 0) throw new Error("invalid protected environment line"); values[line.slice(0, index).trim()] = line.slice(index + 1).trim(); } return values; }

export async function reducedPreflight({ root, nodeImage, envFile }) {
  if (!/^[a-z0-9][a-z0-9._\/-]*@sha256:[a-f0-9]{64}$/i.test(nodeImage ?? "")) throw new Error("NODE_IMAGE must be an explicit sha256 image digest");
  const env = parseEnvironment(await fs.readFile(envFile, "utf8"));
  for (const [name, provider] of [["HELIUS_RPC_URL", "helius"], ["ALCHEMY_RPC_URL", "alchemy"]]) { if (!env[name] || /REPLACE/i.test(env[name])) throw new Error(`${name} must be configured`); validateProviderUrl(provider, env[name]); }
  if (env.INDEXER_EXPECTED_GENESIS_HASH !== MAINNET_GENESIS_HASH) throw new Error("INDEXER_EXPECTED_GENESIS_HASH must pin Solana mainnet");
  const apiKeys = (env.INDEXER_API_KEYS ?? "").split(",").map((value) => value.trim()).filter(Boolean); if (!apiKeys.length || apiKeys.some((value) => value.length < 32 || /replace/i.test(value))) throw new Error("INDEXER_API_KEYS must contain non-placeholder keys of at least 32 characters");
  for (const directory of ["data", "inbox-mainnet"]) await fs.access(path.join(root, directory), fs.constants.R_OK | fs.constants.W_OK);
  return { ready: true, providers: ["helius", "alchemy"], mainnetPinned: true, apiKeys: apiKeys.length, nodeImageDigestPinned: true, writableDirectories: ["data", "inbox-mainnet"] };
}

async function main() { const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); const result = await reducedPreflight({ root, nodeImage: process.env.NODE_IMAGE, envFile: path.resolve(process.env.EXTERNAL_RPC_ENV_FILE ?? "validator/external-rpc.env") }); console.log(JSON.stringify(result)); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
