import crypto from "node:crypto";
import { getMultipleAccountsBatched } from "./rpc-account-batch.js";
import { extractToken2022MintEvidence, normalizeTransferFeeConfig, selectEpochTransferFee } from "./token-2022-transfer-fee.js";
import { decodeBase58Address, findProgramAddress } from "./solana-pda.js";
import { decodeTransferHookExtraAccountMetaList } from "./transfer-hook-evidence.js";

const LEGACY_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const TOKEN_PROGRAMS = new Set([LEGACY_TOKEN_PROGRAM, TOKEN_2022_PROGRAM]);
const MAX_HOOK_ACCOUNT_BYTES = 65_536;

function rawAccountEvidence(account, expectedOwner, label) {
  const encoded = account?.data?.[0], encoding = account?.data?.[1];
  if (account?.owner !== expectedOwner || typeof encoded !== "string" || encoding !== "base64") throw new Error(`${label} is invalid`);
  const data = Buffer.from(encoded, "base64");
  if (data.length > MAX_HOOK_ACCOUNT_BYTES || data.toString("base64").replaceAll("=", "") !== encoded.replaceAll("=", "")) throw new Error(`${label} is invalid`);
  return { owner: account.owner, dataLength: data.length, rawHex: data.toString("hex"), rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}

function validRawAccountEvidence(value, expectedOwner) {
  if (value?.owner !== expectedOwner || !Number.isSafeInteger(value.dataLength) || value.dataLength < 0 || value.dataLength > MAX_HOOK_ACCOUNT_BYTES || !/^(?:[0-9a-f]{2})*$/.test(value.rawHex ?? "") || value.rawHex.length !== value.dataLength * 2 || !/^[0-9a-f]{64}$/.test(value.rawPayloadHash ?? "")) return false;
  return crypto.createHash("sha256").update(Buffer.from(value.rawHex, "hex")).digest("hex") === value.rawPayloadHash;
}

export function deriveTransferHookValidationAccount(mint, programId) { return findProgramAddress(programId, [Buffer.from("extra-account-metas"), decodeBase58Address(mint)]); }

function transferHookState(info, mint) {
  const hooks = info.extensions.filter((extension) => extension?.extension === "transferHook");
  if (hooks.length > 1) throw new Error(`pool mint ${mint} transfer hook is ambiguous`);
  if (!hooks.length) return null;
  const authority = hooks[0]?.state?.authority, programId = hooks[0]?.state?.programId;
  try { if (authority != null) decodeBase58Address(authority); decodeBase58Address(programId); } catch { throw new Error(`pool mint ${mint} transfer hook is invalid`); }
  return { authority, programId, validationAccount: deriveTransferHookValidationAccount(mint, programId).address };
}

export async function acquirePoolMintEvidence(client, pools, minContextSlot) {
  if (!Array.isArray(pools) || !pools.length || !Number.isSafeInteger(minContextSlot) || minContextSlot < 0) throw new Error("pool mint evidence request is invalid");
  const epochInfo = await client.call("getEpochInfo", [{ commitment: "finalized", minContextSlot }]), slot = epochInfo?.absoluteSlot, epoch = epochInfo?.epoch;
  if (!Number.isSafeInteger(slot) || slot < minContextSlot || !Number.isSafeInteger(epoch) || epoch < 0) throw new Error("pool mint epoch context is invalid");
  const mints = [...new Set(pools.flatMap((pool) => [pool.tokenMint0, pool.tokenMint1]))];
  if (mints.some((mint) => typeof mint !== "string" || !mint)) throw new Error("pool mint identity is invalid");
  const response = await getMultipleAccountsBatched(client, mints, { commitment: "finalized", encoding: "jsonParsed", minContextSlot: slot }, { expectedSlot: slot, label: "pool mint" }), byMint = new Map(), hooks = [];
  for (let index = 0; index < mints.length; index++) {
    const mint = mints[index], account = response.value[index], info = account?.data?.parsed?.info;
    if (!TOKEN_PROGRAMS.has(account?.owner) || !Number.isInteger(info?.decimals) || info.decimals < 0 || info.decimals > 255 || !/^\d+$/.test(info?.supply ?? "")) throw new Error(`pool mint ${mint} evidence is invalid`);
    if (account.owner === TOKEN_2022_PROGRAM && !Array.isArray(info.extensions)) throw new Error(`pool mint ${mint} extension inventory is invalid`);
    const extensionTypes = account.owner === TOKEN_2022_PROGRAM ? info.extensions.map((extension) => extension?.extension) : [];
    if (extensionTypes.some((type) => typeof type !== "string" || !type) || new Set(extensionTypes).size !== extensionTypes.length) throw new Error(`pool mint ${mint} extension inventory is invalid`);
    const hook = account.owner === TOKEN_2022_PROGRAM ? transferHookState(info, mint) : null; if (hook) hooks.push({ mint, ...hook });
    byMint.set(mint, { schemaVersion: 1, mint, programId: account.owner, commitment: "finalized", slot, epoch, decimals: info.decimals, extensionTypes: extensionTypes.sort(), token2022Evidence: extractToken2022MintEvidence(account, epoch, slot), transferHookEvidence: null });
  }
  if (hooks.length) { const addresses = [...new Set(hooks.flatMap((hook) => [hook.validationAccount, hook.programId]))], hookResponse = await getMultipleAccountsBatched(client, addresses, { commitment: "finalized", encoding: "base64", minContextSlot: slot }, { expectedSlot: slot, label: "pool mint transfer hook" }), accounts = new Map(addresses.map((address, index) => [address, hookResponse.value[index]])); for (const hook of hooks) { const program = accounts.get(hook.programId), validation = accounts.get(hook.validationAccount); if (!program?.executable || typeof program.owner !== "string" || !program.owner) throw new Error(`pool mint ${hook.mint} transfer hook program is unavailable`); const programEvidence = rawAccountEvidence(program, program.owner, `pool mint ${hook.mint} transfer hook program`), validationEvidence = validation == null ? null : rawAccountEvidence(validation, hook.programId, `pool mint ${hook.mint} transfer hook validation account`); if (validationEvidence) validationEvidence.extraAccountMetaList = decodeTransferHookExtraAccountMetaList(validationEvidence.rawHex); byMint.get(hook.mint).transferHookEvidence = { schemaVersion: 1, commitment: "finalized", slot, authority: hook.authority, programId: hook.programId, programExecutable: true, program: programEvidence, validationAccount: hook.validationAccount, validation: validationEvidence }; } }
  return { slot, epoch, byMint };
}

export function bindPoolMintEvidence(pool, evidence) {
  const mint0 = evidence?.byMint?.get(pool?.tokenMint0), mint1 = evidence?.byMint?.get(pool?.tokenMint1);
  if (!mint0 || !mint1 || mint0.slot !== evidence.slot || mint1.slot !== evidence.slot || mint0.epoch !== evidence.epoch || mint1.epoch !== evidence.epoch || mint0.decimals !== pool.mintDecimals0 || mint1.decimals !== pool.mintDecimals1 || pool.tokenProgram0 && pool.tokenProgram0 !== mint0.programId || pool.tokenProgram1 && pool.tokenProgram1 !== mint1.programId) throw new Error(`pool ${pool?.address ?? "unknown"} mint evidence does not match state`);
  pool.tokenProgram0 = mint0.programId; pool.tokenProgram1 = mint1.programId; pool.mintEvidenceSlot = evidence.slot; pool.epoch = evidence.epoch; pool.mint0Evidence = mint0; pool.mint1Evidence = mint1; return pool;
}

export function validateBoundPoolMintEvidence(pool, minimumSlot = 0) {
  const rows = [pool?.mint0Evidence, pool?.mint1Evidence], expected = [[pool?.tokenMint0, pool?.tokenProgram0, pool?.mintDecimals0], [pool?.tokenMint1, pool?.tokenProgram1, pool?.mintDecimals1]];
  if (!Number.isSafeInteger(pool?.mintEvidenceSlot) || pool.mintEvidenceSlot < minimumSlot || !Number.isSafeInteger(pool.epoch) || pool.epoch < 0 || rows.some((row) => !row)) return false;
  for (let index = 0; index < 2; index++) {
    const row = rows[index], [mint, programId, decimals] = expected[index];
    if (row.schemaVersion !== 1 || row.mint !== mint || row.programId !== programId || row.commitment !== "finalized" || row.slot !== pool.mintEvidenceSlot || row.epoch !== pool.epoch || row.decimals !== decimals || !TOKEN_PROGRAMS.has(row.programId) || !Array.isArray(row.extensionTypes) || row.extensionTypes.some((type, position) => typeof type !== "string" || !type || position && type <= row.extensionTypes[position - 1])) return false;
    if (row.programId === LEGACY_TOKEN_PROGRAM) { if (row.token2022Evidence != null || row.transferHookEvidence != null || row.extensionTypes.length) return false; continue; }
    const evidence = row.token2022Evidence; if (evidence?.schemaVersion !== 1 || evidence.programId !== TOKEN_2022_PROGRAM || evidence.commitment !== "finalized" || evidence.slot !== row.slot || evidence.epoch !== row.epoch) return false;
    if (evidence.transferFeeConfig == null) { if (evidence.activeTransferFee != null) return false; }
    else { let config, active; try { config = normalizeTransferFeeConfig(evidence.transferFeeConfig); active = selectEpochTransferFee(config, row.epoch); } catch { return false; } if (JSON.stringify(config) !== JSON.stringify(evidence.transferFeeConfig) || JSON.stringify(active) !== JSON.stringify(evidence.activeTransferFee)) return false; }
    const hasHook = row.extensionTypes.includes("transferHook"), hook = row.transferHookEvidence; if (!hasHook) { if (hook != null) return false; } else { let derived; try { derived = deriveTransferHookValidationAccount(row.mint, hook?.programId).address; if (hook.authority != null) decodeBase58Address(hook.authority); } catch { return false; } if (hook?.schemaVersion !== 1 || hook.commitment !== "finalized" || hook.slot !== row.slot || !hook.programExecutable || !validRawAccountEvidence(hook.program, hook.program?.owner) || hook.validationAccount !== derived || hook.validation != null && !validRawAccountEvidence(hook.validation, hook.programId)) return false; if (hook.validation) { let decoded; try { decoded = decodeTransferHookExtraAccountMetaList(hook.validation.rawHex); } catch { return false; } if (JSON.stringify(decoded) !== JSON.stringify(hook.validation.extraAccountMetaList)) return false; } }
  }
  return true;
}

export const POOL_MINT_EVIDENCE_CONSTANTS = Object.freeze({ legacyTokenProgram: LEGACY_TOKEN_PROGRAM, token2022Program: TOKEN_2022_PROGRAM });
