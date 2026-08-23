#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { durableAtomicWrite } from "./durable-file.js";
import { IndexStore } from "./store.js";
import { assertSnapshotAcquisitionAllowed } from "./snapshot-cli-policy.js";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";
import { decodeTokenMetadataAccount, TOKEN_METADATA_PROGRAM } from "./token-metadata.js";
import { decodeRawToken2022MintEvidence, extractToken2022MintEvidence } from "./token-2022-transfer-fee.js";
import { encodeBase58 } from "./solana-pda.js";
export { extractToken2022MintEvidence } from "./token-2022-transfer-fee.js";

const TOKEN_PROGRAMS = ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"];
const U64_MAX = (1n << 64n) - 1n;
const validAmount = (value) => typeof value === "string" && /^\d+$/.test(value);
const validU64 = (value) => validAmount(value) && BigInt(value) <= U64_MAX;
const validDecimals = (value) => Number.isInteger(value) && value >= 0 && value <= 255;
async function atomicWrite(filename, value) { await durableAtomicWrite(filename, `${JSON.stringify(value)}\n`); }

export function decodeRawToken2022Account(account, expectedMint, decimals, transferFeeConfig) {
  if (account?.owner !== TOKEN_PROGRAMS[1] || !Array.isArray(account.data) || account.data.length !== 2 || account.data[1] !== "base64" || typeof account.data[0] !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(account.data[0])) throw new Error("invalid raw Token-2022 account encoding");
  const bytes = Buffer.from(account.data[0], "base64");
  if (bytes.length < 165 || bytes.length > 65_536 || bytes.toString("base64").replace(/=+$/, "") !== account.data[0].replace(/=+$/, "") || encodeBase58(bytes.subarray(0, 32)) !== expectedMint || !validDecimals(decimals)) throw new Error("invalid raw Token-2022 account identity");
  const state = bytes[108]; if (state !== 1 && state !== 2) throw new Error("invalid raw Token-2022 account state");
  const extensions = new Set(); let withheldAmountRaw = null;
  if (bytes.length > 165) {
    if (bytes.length < 170 || bytes[165] !== 2) throw new Error("invalid raw Token-2022 account extension envelope");
    let offset = 166;
    while (offset < bytes.length) {
      if (offset + 4 > bytes.length) throw new Error("truncated raw Token-2022 account extension");
      const type = bytes.readUInt16LE(offset), length = bytes.readUInt16LE(offset + 2); offset += 4;
      if (type === 0 && length === 0) { if (bytes.subarray(offset).some((byte) => byte !== 0)) throw new Error("invalid raw Token-2022 account extension padding"); break; }
      if (extensions.has(type) || offset + length > bytes.length) throw new Error("invalid raw Token-2022 account extension");
      extensions.add(type);
      if (type === 2) { if (length !== 8) throw new Error("invalid raw Token-2022 transfer fee amount"); withheldAmountRaw = bytes.readBigUInt64LE(offset).toString(); }
      offset += length;
    }
  }
  if (Boolean(transferFeeConfig) !== extensions.has(2)) throw new Error("incomplete raw Token-2022 transfer fee evidence");
  return { mint: expectedMint, owner: encodeBase58(bytes.subarray(32, 64)), tokenAmount: { amount: bytes.readBigUInt64LE(64).toString(), decimals }, state: state === 1 ? "initialized" : "frozen", withheldAmountRaw };
}

export async function createAccountSnapshot({ client, mints, genesisHash, observedAt = new Date().toISOString() }) {
  if (!Array.isArray(mints) || !mints.length || new Set(mints).size !== mints.length || mints.some((mint) => typeof mint !== "string" || !mint)) throw new Error("snapshot mints must be unique non-empty addresses");
  const epochInfo = await client.call("getEpochInfo", [{ commitment: "finalized" }]), slot = epochInfo?.absoluteSlot, epoch = epochInfo?.epoch; if (!Number.isSafeInteger(slot) || slot < 0 || !Number.isSafeInteger(epoch) || epoch < 0) throw new Error("invalid finalized account snapshot epoch context");
  const mintAccounts = await getMultipleAccountsBatched(client, mints, { commitment: "finalized", encoding: "jsonParsed", minContextSlot: slot }, { expectedSlot: slot, label: "mint" }), token2022Mints = mints.filter((_, index) => mintAccounts.value[index]?.owner === TOKEN_PROGRAMS[1]), rawToken2022 = token2022Mints.length ? await getMultipleAccountsBatched(client, token2022Mints, { commitment: "finalized", encoding: "base64", minContextSlot: slot }, { expectedSlot: slot, label: "raw Token-2022 mint" }) : { value: [] }, rawMintAccounts = new Map(token2022Mints.map((mint, index) => [mint, rawToken2022.value[index]])); const rows = [];
  for (let index = 0; index < mints.length; index++) {
    const mint = mints[index], mintAccount = mintAccounts.value[index], parsedMintInfo = mintAccount?.data?.parsed?.info; const accounts = new Map(); let totalAmount = 0n;
    if (!TOKEN_PROGRAMS.includes(mintAccount?.owner) || !parsedMintInfo || !validU64(parsedMintInfo.supply) || !validDecimals(parsedMintInfo.decimals)) throw new Error(`invalid canonical mint account ${mint}`);
    const rawMint = mintAccount.owner === TOKEN_PROGRAMS[1] ? decodeRawToken2022MintEvidence(rawMintAccounts.get(mint), epoch, slot) : null, parsedExtensionTypes = Array.isArray(parsedMintInfo.extensions) ? parsedMintInfo.extensions.map((extension) => extension?.extension) : null;
    if (rawMint && (parsedMintInfo.supply !== rawMint.mintInfo.supply || parsedMintInfo.decimals !== rawMint.mintInfo.decimals || (parsedMintInfo.mintAuthority ?? null) !== rawMint.mintInfo.mintAuthority || (parsedMintInfo.freezeAuthority ?? null) !== rawMint.mintInfo.freezeAuthority || !parsedExtensionTypes || JSON.stringify([...parsedExtensionTypes].sort()) !== JSON.stringify(rawMint.mintInfo.extensions.map((extension) => extension.extension).sort()))) throw new Error(`parsed and raw Token-2022 mint evidence differ for ${mint}`);
    const mintInfo = rawMint?.mintInfo ?? parsedMintInfo, token2022Evidence = rawMint?.token2022Evidence ?? extractToken2022MintEvidence(mintAccount, epoch, slot), transferFeeConfig = token2022Evidence?.transferFeeConfig ?? null;
    for (const programId of TOKEN_PROGRAMS) {
      const encoding = programId === TOKEN_PROGRAMS[1] ? "base64" : "jsonParsed", found = await client.call("getProgramAccounts", [programId, { commitment: "finalized", encoding, minContextSlot: slot, withContext: true, filters: [{ memcmp: { offset: 0, bytes: mint } }] }]);
      if (found?.context?.slot !== slot || !Array.isArray(found.value)) throw new Error(`token accounts for ${mint} did not share the exact finalized snapshot context`);
      for (const row of found.value) {
        let info; try { info = programId === TOKEN_PROGRAMS[1] ? decodeRawToken2022Account(row.account, mint, mintInfo.decimals, transferFeeConfig) : row.account?.data?.parsed?.info; } catch { throw new Error(`invalid canonical token account identity for ${mint}`); }
        if (typeof row.pubkey !== "string" || !row.pubkey || programId !== mintAccount.owner || row.account?.owner !== programId || info?.mint !== mint || typeof info.owner !== "string" || !info.owner || !validU64(info?.tokenAmount?.amount) || !validDecimals(info?.tokenAmount?.decimals) || info.tokenAmount.decimals !== mintInfo.decimals) throw new Error(`invalid canonical token account identity for ${mint}`);
        if (accounts.has(row.pubkey)) throw new Error(`duplicate token account ${row.pubkey}`);
        const withheldAmountRaw = info.withheldAmountRaw ?? null;
        totalAmount += BigInt(info.tokenAmount.amount) + BigInt(withheldAmountRaw ?? 0); if (totalAmount + BigInt(transferFeeConfig?.withheldAmountRaw ?? 0) > BigInt(mintInfo.supply)) throw new Error(`token accounts for ${mint} exceed mint supply`);
        accounts.set(row.pubkey, { tokenAccount: row.pubkey, owner: info.owner, programId, amountRaw: info.tokenAmount.amount, ...(withheldAmountRaw != null ? { withheldAmountRaw } : {}), decimals: info.tokenAmount.decimals, state: info.state ?? null });
      }
    }
    const metadataResponse = await client.call("getProgramAccounts", [TOKEN_METADATA_PROGRAM, { commitment: "finalized", encoding: "base64", minContextSlot: slot, withContext: true, filters: [{ memcmp: { offset: 33, bytes: mint } }] }]);
    if (metadataResponse?.context?.slot !== slot || !Array.isArray(metadataResponse.value) || metadataResponse.value.length > 1) throw new Error(`token metadata for ${mint} did not share the exact finalized snapshot context`);
    const metadata = metadataResponse.value.length ? decodeTokenMetadataAccount(metadataResponse.value[0].pubkey, metadataResponse.value[0].account, mint) : null;
    rows.push({ mint, mintProgramId: mintAccount.owner, mintInfo, ...(token2022Evidence ? { token2022Evidence } : {}), metadataSearchComplete: true, ...(metadata ? { metadata } : {}), accounts: [...accounts.values()].sort((a, b) => a.tokenAccount.localeCompare(b.tokenAccount)) });
  }
  return { schemaVersion: 1, chain: "solana", genesisHash, commitment: "finalized", slot, epoch, observedAt, mints: rows };
}

async function main() {
  const config = loadConfig(), store = new IndexStore(config.dataFile, config.maxTransactions); await store.load(); const artifactOnly = process.argv.includes("--artifact-only"), requested = process.argv.slice(2).filter((value) => value !== "--artifact-only"); assertSnapshotAcquisitionAllowed(store, { artifactOnly, requested }); const mints = requested.length ? requested : Object.keys(store.state.mints); if (!mints.length) throw new Error("no mints supplied or discovered");
  const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899"), expected = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH, genesisHash = await client.assertGenesis(expected); const snapshot = await createAccountSnapshot({ client, mints, genesisHash }); if (!artifactOnly) { store.applyAccountSnapshot(snapshot); await store.save(); } await atomicWrite(config.accountSnapshotFile, snapshot); console.log(JSON.stringify({ slot: snapshot.slot, mints: snapshot.mints.length, accounts: snapshot.mints.reduce((sum, row) => sum + row.accounts.length, 0), artifactOnly }));
}
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
