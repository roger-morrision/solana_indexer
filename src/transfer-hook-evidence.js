import { decodeBase58Address, encodeBase58, findProgramAddress } from "./solana-pda.js";

const EXECUTE_DISCRIMINATOR = Buffer.from([105, 37, 101, 197, 75, 251, 102, 26]);
const META_LENGTH = 35;
const MAX_METAS = 64;

export function decodeTransferHookExtraAccountMetaList(rawHex) {
  if (typeof rawHex !== "string" || !/^(?:[0-9a-f]{2})*$/.test(rawHex)) throw new Error("transfer-hook validation data is invalid");
  const data = Buffer.from(rawHex, "hex");
  if (data.length < 16 || !data.subarray(0, 8).equals(EXECUTE_DISCRIMINATOR)) throw new Error("transfer-hook execute TLV entry is invalid");
  const valueLength = data.readUInt32LE(8), count = data.readUInt32LE(12);
  if (count > MAX_METAS || valueLength !== 4 + count * META_LENGTH || data.length !== 12 + valueLength) throw new Error("transfer-hook extra-account list length is invalid");
  const accounts = [];
  for (let index = 0; index < count; index++) {
    const offset = 16 + index * META_LENGTH, discriminator = data[offset], addressConfig = data.subarray(offset + 1, offset + 33), signer = data[offset + 33], writable = data[offset + 34];
    if (signer > 1 || writable > 1) throw new Error("transfer-hook account privileges are invalid");
    const type = discriminator === 0 ? "static" : discriminator === 1 ? "hook_program_pda" : discriminator === 2 ? "pubkey_data" : discriminator >= 128 ? "external_program_pda" : "unknown";
    accounts.push({ index: index + 5, discriminator, type, ...(type === "static" ? { address: encodeBase58(addressConfig) } : { addressConfigHex: addressConfig.toString("hex") }), signer: signer === 1, writable: writable === 1 });
  }
  return { schemaVersion: 1, executeDiscriminatorHex: EXECUTE_DISCRIMINATOR.toString("hex"), count, fullyStaticallyResolvable: accounts.every((account) => account.type === "static"), accounts };
}

function u64(value) { let parsed; try { parsed = BigInt(value); } catch { throw new Error("transfer-hook amount is invalid"); } if (parsed < 0n || parsed > 18_446_744_073_709_551_615n) throw new Error("transfer-hook amount is invalid"); const data = Buffer.alloc(8); data.writeBigUInt64LE(parsed); return data; }

function accountBytes(previous, index) {
  if (index >= previous.length) throw new Error("transfer-hook account-data source is invalid");
  const data = previous[index].data;
  if (!Buffer.isBuffer(data)) throw new Error("transfer-hook account-data seed requires finalized source-account evidence");
  return data;
}

function unpackSeeds(config, previous, instructionData) {
  const seeds = []; let offset = 0;
  while (offset < config.length && config[offset] !== 0) {
    const discriminator = config[offset++];
    if (discriminator === 1) { const length = config[offset++]; if (!length || offset + length > config.length) throw new Error("transfer-hook literal seed is invalid"); seeds.push(config.subarray(offset, offset + length)); offset += length; }
    else if (discriminator === 2) { const index = config[offset++], length = config[offset++]; if (!length || index + length > instructionData.length) throw new Error("transfer-hook instruction seed is invalid"); seeds.push(instructionData.subarray(index, index + length)); }
    else if (discriminator === 3) { const index = config[offset++]; if (index >= previous.length) throw new Error("transfer-hook account-key seed is invalid"); seeds.push(decodeBase58Address(previous[index].address)); }
    else if (discriminator === 4) { const accountIndex = config[offset++], dataIndex = config[offset++], length = config[offset++], data = accountBytes(previous, accountIndex); if (!length || dataIndex + length > data.length) throw new Error("transfer-hook account-data seed is invalid"); seeds.push(data.subarray(dataIndex, dataIndex + length)); }
    else throw new Error("transfer-hook seed discriminator is invalid");
  }
  if (!seeds.length || config.subarray(offset).some((byte) => byte !== 0)) throw new Error("transfer-hook seed padding is invalid");
  return seeds;
}

function sourceData(accountData, address) {
  const value = accountData instanceof Map ? accountData.get(address) : accountData?.[address], rawHex = typeof value === "string" ? value : value?.rawHex;
  if (rawHex == null) return null;
  if (typeof rawHex !== "string" || !/^(?:[0-9a-f]{2})*$/.test(rawHex) || rawHex.length > 131_072) throw new Error("transfer-hook finalized source-account evidence is invalid");
  return Buffer.from(rawHex, "hex");
}

function resolvePubkeyData(config, previous, instructionData) {
  const discriminator = config[0]; let bytes, used;
  if (discriminator === 1) { const index = config[1]; used = 2; if (index + 32 > instructionData.length) throw new Error("transfer-hook pubkey instruction data is invalid"); bytes = instructionData.subarray(index, index + 32); }
  else if (discriminator === 2) { const accountIndex = config[1], dataIndex = config[2], data = accountBytes(previous, accountIndex); used = 3; if (dataIndex + 32 > data.length) throw new Error("transfer-hook pubkey account data is invalid"); bytes = data.subarray(dataIndex, dataIndex + 32); }
  else throw new Error("transfer-hook pubkey-data configuration is invalid");
  if (config.subarray(used).some((byte) => byte !== 0)) throw new Error("transfer-hook pubkey-data padding is invalid");
  return encodeBase58(bytes);
}

function deescalate(meta, previous) {
  const duplicates = previous.filter((account) => account.address === meta.address);
  return { address: meta.address, signer: false, writable: duplicates.length && !duplicates.some((account) => account.writable) ? false : meta.writable };
}

export function resolveTransferHookAccountMetas({ metaList, hookProgramId, validationAccount, source, mint, destination, authority, amountRaw, accountData = null }) {
  if (metaList?.schemaVersion !== 1 || !Array.isArray(metaList.accounts) || metaList.accounts.length !== metaList.count) throw new Error("transfer-hook meta list is invalid");
  const previous = [source, mint, destination, authority, validationAccount].map((address, index) => ({ address, signer: index === 3, writable: index === 0 || index === 2, data: sourceData(accountData, address) }));
  const instructionData = Buffer.concat([EXECUTE_DISCRIMINATOR, u64(amountRaw)]);
  for (const meta of metaList.accounts) {
    let address;
    if (meta.index !== previous.length || typeof meta.signer !== "boolean" || typeof meta.writable !== "boolean") throw new Error("transfer-hook meta ordering is invalid");
    if (meta.discriminator === 0) address = meta.address;
    else if (meta.discriminator === 2) { if (typeof meta.addressConfigHex !== "string" || !/^[0-9a-f]{64}$/.test(meta.addressConfigHex)) throw new Error("transfer-hook pubkey-data metadata is invalid"); address = resolvePubkeyData(Buffer.from(meta.addressConfigHex, "hex"), previous, instructionData); }
    else { const program = meta.discriminator === 1 ? hookProgramId : meta.discriminator >= 128 && meta.discriminator - 128 < previous.length ? previous[meta.discriminator - 128].address : null; if (!program || typeof meta.addressConfigHex !== "string" || !/^[0-9a-f]{64}$/.test(meta.addressConfigHex)) throw new Error("transfer-hook PDA metadata is invalid"); const seeds = unpackSeeds(Buffer.from(meta.addressConfigHex, "hex"), previous, instructionData); address = findProgramAddress(program, seeds).address; }
    decodeBase58Address(address); const resolved = deescalate({ address, signer: meta.signer, writable: meta.writable }, previous); previous.push({ ...resolved, data: sourceData(accountData, address) });
  }
  return { schemaVersion: 1, amountRaw: BigInt(amountRaw).toString(), validationAccount, hookProgramId, accounts: previous.slice(5).map(({ data: _data, ...account }) => account) };
}

export const TRANSFER_HOOK_EVIDENCE_CONSTANTS = Object.freeze({ executeDiscriminatorHex: EXECUTE_DISCRIMINATOR.toString("hex"), metaLength: META_LENGTH, maxMetas: MAX_METAS });
