#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { IndexStore } from "./store.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";

const TOKEN_PROGRAMS = ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"];
async function atomicWrite(filename, value) { await fs.mkdir(path.dirname(filename), { recursive: true }); const temporary = `${filename}.${process.pid}.tmp`; await fs.writeFile(temporary, `${JSON.stringify(value)}\n`); await fs.rename(temporary, filename); }

export async function createAccountSnapshot({ client, mints, genesisHash, observedAt = new Date().toISOString() }) {
  const slot = await client.call("getSlot", [{ commitment: "finalized" }]); const mintAccounts = await client.call("getMultipleAccounts", [mints, { commitment: "finalized", encoding: "jsonParsed" }]); const rows = [];
  for (let index = 0; index < mints.length; index++) {
    const mint = mints[index], mintInfo = mintAccounts?.value?.[index]?.data?.parsed?.info ?? null; const accounts = new Map();
    for (const programId of TOKEN_PROGRAMS) {
      const found = await client.call("getProgramAccounts", [programId, { commitment: "finalized", encoding: "jsonParsed", filters: [{ memcmp: { offset: 0, bytes: mint } }] }]);
      for (const row of found ?? []) { const info = row.account?.data?.parsed?.info; if (info?.mint !== mint || !info.tokenAmount?.amount) continue; accounts.set(row.pubkey, { tokenAccount: row.pubkey, owner: info.owner ?? null, programId, amountRaw: String(info.tokenAmount.amount), decimals: info.tokenAmount.decimals, state: info.state ?? null }); }
    }
    rows.push({ mint, mintInfo, accounts: [...accounts.values()].sort((a, b) => a.tokenAccount.localeCompare(b.tokenAccount)) });
  }
  return { schemaVersion: 1, chain: "solana", genesisHash, commitment: "finalized", slot, observedAt, mints: rows };
}

async function main() {
  const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions); await store.load(); const requested = process.argv.slice(2).filter(Boolean); const mints = requested.length ? requested : Object.keys(store.state.mints); if (!mints.length) throw new Error("no mints supplied or discovered");
  const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected); const snapshot = await createAccountSnapshot({ client, mints, genesisHash }); store.applyAccountSnapshot(snapshot); await store.save(); await atomicWrite(path.resolve(process.cwd(), process.env.ACCOUNT_SNAPSHOT_FILE || "data/account-snapshot.json"), snapshot); console.log(JSON.stringify({ slot: snapshot.slot, mints: snapshot.mints.length, accounts: snapshot.mints.reduce((sum, row) => sum + row.accounts.length, 0) }));
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
