#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { IndexStore } from "./store.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";

const TOKEN_PROGRAMS = ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"];
const validAmount = (value) => typeof value === "string" && /^\d+$/.test(value);
const validDecimals = (value) => Number.isInteger(value) && value >= 0 && value <= 255;
async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }

export async function createAccountSnapshot({ client, mints, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(mints) || !mints.length || new Set(mints).size !== mints.length || mints.some((mint) => typeof mint !== "string" || !mint)) throw new Error("snapshot mints must be unique non-empty addresses");
  const slot = await client.call("getSlot", [{ commitment: "finalized" }]); if (!Number.isSafeInteger(slot) || slot < 0) throw new Error("invalid finalized account snapshot slot");
  const mintAccounts = await getMultipleAccountsBatched(client, mints, { commitment: "finalized", encoding: "jsonParsed", minContextSlot: slot }, { expectedSlot: slot, label: "mint" }); const rows = [];
  for (let index = 0; index < mints.length; index++) {
    const mint = mints[index], mintAccount = mintAccounts.value[index], mintInfo = mintAccount?.data?.parsed?.info; const accounts = new Map();
    if (!TOKEN_PROGRAMS.includes(mintAccount?.owner) || !mintInfo || !validAmount(mintInfo.supply) || !validDecimals(mintInfo.decimals)) throw new Error(`invalid canonical mint account ${mint}`);
    for (const programId of TOKEN_PROGRAMS) {
      const found = await client.call("getProgramAccounts", [programId, { commitment: "finalized", encoding: "jsonParsed", minContextSlot: slot, withContext: true, filters: [{ memcmp: { offset: 0, bytes: mint } }] }]);
      if (found?.context?.slot !== slot || !Array.isArray(found.value)) throw new Error(`token accounts for ${mint} did not share the exact finalized snapshot context`);
      for (const row of found.value) {
        const info = row.account?.data?.parsed?.info;
        if (typeof row.pubkey !== "string" || !row.pubkey || row.account?.owner !== programId || info?.mint !== mint || !validAmount(info?.tokenAmount?.amount) || !validDecimals(info?.tokenAmount?.decimals)) throw new Error(`invalid canonical token account identity for ${mint}`);
        if (accounts.has(row.pubkey)) throw new Error(`duplicate token account ${row.pubkey}`);
        accounts.set(row.pubkey, { tokenAccount: row.pubkey, owner: info.owner ?? null, programId, amountRaw: info.tokenAmount.amount, decimals: info.tokenAmount.decimals, state: info.state ?? null });
      }
    }
    rows.push({ mint, mintInfo, accounts: [...accounts.values()].sort((a, b) => a.tokenAccount.localeCompare(b.tokenAccount)) });
  }
  return { schemaVersion: 1, chain: "solana", genesisHash, commitment: "finalized", slot, observedAt, mints: rows };
}

async function main() {
  const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"); const mints = requested.length ? requested : Object.keys(store.state.mints); if (!mints.length) throw new Error("no mints supplied or discovered");
  const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected); const snapshot = await createAccountSnapshot({ client, mints, genesisHash }); if (!artifactOnly) { store.applyAccountSnapshot(snapshot); await store.save(); } await atomicWrite(config.accountSnapshotFile, snapshot); console.log(JSON.stringify({ slot: snapshot.slot, mints: snapshot.mints.length, accounts: snapshot.mints.reduce((sum, row) => sum + row.accounts.length, 0), artifactOnly }));
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
