import assert from "node:assert/strict";
import test from "node:test";
import { findProgramAddress } from "../src/solana-pda.js";
import { decodeTransferHookExtraAccountMetaList, resolveTransferHookAccountMetas } from "../src/transfer-hook-evidence.js";

const address = (fill) => { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; for (const byte of Buffer.alloc(32, fill)) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } return output; };
function list(entries) { const data = Buffer.alloc(16 + entries.length * 35); Buffer.from([105, 37, 101, 197, 75, 251, 102, 26]).copy(data); data.writeUInt32LE(4 + entries.length * 35, 8); data.writeUInt32LE(entries.length, 12); entries.forEach((entry, index) => { const offset = 16 + index * 35; data[offset] = entry.discriminator; entry.config.copy(data, offset + 1); data[offset + 33] = entry.signer ? 1 : 0; data[offset + 34] = entry.writable ? 1 : 0; }); return decodeTransferHookExtraAccountMetaList(data.toString("hex")); }

test("transfer-hook metadata resolves static, hook PDA, and prior-account external PDA forms", () => {
  const source = address(1), mint = address(2), destination = address(3), authority = address(4), validationAccount = address(5), hookProgramId = address(6), externalProgram = address(7), literal = Buffer.from("vault"), amount = Buffer.alloc(8), hookConfig = Buffer.alloc(32), externalConfig = Buffer.alloc(32); amount.writeBigUInt64LE(42n); hookConfig[0] = 1; hookConfig[1] = literal.length; literal.copy(hookConfig, 2); hookConfig[2 + literal.length] = 3; hookConfig[3 + literal.length] = 1; hookConfig[4 + literal.length] = 2; hookConfig[5 + literal.length] = 8; hookConfig[6 + literal.length] = 8; externalConfig[0] = 3; externalConfig[1] = 0;
  const metaList = list([{ discriminator: 0, config: Buffer.alloc(32, 7), writable: false }, { discriminator: 1, config: hookConfig, writable: true }, { discriminator: 133, config: externalConfig, writable: true }]), resolved = resolveTransferHookAccountMetas({ metaList, hookProgramId, validationAccount, source, mint, destination, authority, amountRaw: "42" });
  assert.deepEqual(resolved.accounts, [{ address: externalProgram, signer: false, writable: false }, { address: findProgramAddress(hookProgramId, [literal, Buffer.alloc(32, 2), amount]).address, signer: false, writable: true }, { address: findProgramAddress(externalProgram, [Buffer.alloc(32, 1)]).address, signer: false, writable: true }]);
});

test("transfer-hook metadata rejects source-account-derived and malformed seed forms", () => {
  const common = { hookProgramId: address(6), validationAccount: address(5), source: address(1), mint: address(2), destination: address(3), authority: address(4), amountRaw: "42" }, accountData = Buffer.alloc(32); accountData[0] = 4; accountData[1] = 0; accountData[2] = 0; accountData[3] = 1;
  assert.throws(() => resolveTransferHookAccountMetas({ ...common, metaList: list([{ discriminator: 1, config: accountData }]) }), /source-account evidence/); const bad = Buffer.alloc(16); Buffer.from([105, 37, 101, 197, 75, 251, 102, 26]).copy(bad); bad.writeUInt32LE(4, 8); bad.writeUInt32LE(65, 12); assert.throws(() => decodeTransferHookExtraAccountMetaList(bad.toString("hex")), /length/);
});
