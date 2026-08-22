import { encodeBase58 } from "./solana-pda.js";

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

export const TRANSFER_HOOK_EVIDENCE_CONSTANTS = Object.freeze({ executeDiscriminatorHex: EXECUTE_DISCRIMINATOR.toString("hex"), metaLength: META_LENGTH, maxMetas: MAX_METAS });
