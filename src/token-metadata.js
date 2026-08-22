import crypto from "node:crypto";

export const TOKEN_METADATA_PROGRAM = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58(bytes) { let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let output = ""; while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } for (const byte of bytes) { if (byte) break; output = `1${output}`; } return output || "1"; }
function borshString(data, cursor, maximum, label) { if (cursor.offset + 4 > data.length) throw new Error(`truncated token metadata ${label}`); const length = data.readUInt32LE(cursor.offset); cursor.offset += 4; if (length > maximum || cursor.offset + length > data.length) throw new Error(`invalid token metadata ${label}`); let value; try { value = new TextDecoder("utf-8", { fatal: true }).decode(data.subarray(cursor.offset, cursor.offset + length)); } catch { throw new Error(`invalid token metadata ${label}`); } cursor.offset += length; value = value.replace(/\0+$/g, "").trim(); if (/[\u0000-\u001f\u007f]/.test(value)) throw new Error(`invalid token metadata ${label}`); return value; }

export function isCanonicalTokenMetadata(metadata, mint = metadata?.mint) {
  const bounded = (value, maximum) => typeof value === "string" && Buffer.byteLength(value) <= maximum && !/[\u0000-\u001f\u007f]/.test(value);
  return metadata?.mint === mint && typeof mint === "string" && Boolean(mint) && typeof metadata.account === "string" && Boolean(metadata.account) && metadata.programId === TOKEN_METADATA_PROGRAM && typeof metadata.updateAuthority === "string" && Boolean(metadata.updateAuthority) && bounded(metadata.name, 32) && bounded(metadata.symbol, 10) && bounded(metadata.uri, 200) && Number.isInteger(metadata.sellerFeeBasisPoints) && metadata.sellerFeeBasisPoints >= 0 && metadata.sellerFeeBasisPoints <= 10_000 && /^[0-9a-f]{64}$/.test(metadata.rawPayloadHash ?? "");
}

export function decodeTokenMetadataAccount(address, account, expectedMint) {
  if (account?.owner !== TOKEN_METADATA_PROGRAM || !Array.isArray(account.data) || account.data[1] !== "base64" || typeof account.data[0] !== "string") throw new Error(`invalid token metadata account ${address}`);
  const data = Buffer.from(account.data[0], "base64"); if (data.length < 75 || data[0] !== 4) throw new Error(`invalid token metadata account ${address}`);
  const updateAuthority = base58(data.subarray(1, 33)), mint = base58(data.subarray(33, 65)); if (mint !== expectedMint) throw new Error(`token metadata ${address} mint identity mismatch`);
  const cursor = { offset: 65 }, name = borshString(data, cursor, 32, "name"), symbol = borshString(data, cursor, 10, "symbol"), uri = borshString(data, cursor, 200, "uri"); if (cursor.offset + 2 > data.length) throw new Error(`truncated token metadata ${address}`); const sellerFeeBasisPoints = data.readUInt16LE(cursor.offset); if (sellerFeeBasisPoints > 10_000) throw new Error(`invalid token metadata seller fee ${address}`);
  return { account: address, programId: TOKEN_METADATA_PROGRAM, mint, updateAuthority, name, symbol, uri, sellerFeeBasisPoints, rawPayloadHash: crypto.createHash("sha256").update(data).digest("hex") };
}
