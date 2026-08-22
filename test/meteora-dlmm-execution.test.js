import assert from "node:assert/strict";
import test from "node:test";
import { MAINNET_GENESIS_HASH } from "../src/local-validator-exporter.js";
import { buildMeteoraDlmmSwapInstruction, METEORA_DLMM_EXECUTION_CONSTANTS, prepareMeteoraDlmmSwapSimulation, simulatePreparedMeteoraDlmmSwap } from "../src/meteora-dlmm-execution.js";
import { METEORA_DLMM_PROGRAM } from "../src/meteora-dlmm-pool-snapshot.js";
import { inspectUnsignedTransactionPrograms } from "../src/transaction-simulation.js";

const address = (fill) => { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n, output = ""; const bytes = Buffer.alloc(32, fill); for (const byte of bytes) value = value * 256n + BigInt(byte); while (value) { output = alphabet[Number(value % 58n)] + output; value /= 58n; } return output; };
const tokenProgram = METEORA_DLMM_EXECUTION_CONSTANTS.tokenProgram;
const mintEvidence = (mint) => ({ schemaVersion: 1, mint, programId: tokenProgram, commitment: "finalized", slot: 103, epoch: 2, decimals: 6, extensionTypes: [], token2022Evidence: null });

function fixture() {
  const pool = { address: address(1), programId: METEORA_DLMM_PROGRAM, tokenMint0: address(2), tokenMint1: address(3), tokenVault0: address(4), tokenVault1: address(5), oracle: address(6), tokenProgram0: tokenProgram, tokenProgram1: tokenProgram, mintDecimals0: 6, mintDecimals1: 6, stateSlot: 100, binArraySlot: 101, mintEvidenceSlot: 103, epoch: 2, binArrayCoverage: "finalized_program_account_snapshot", binArrays: [{ index: 0, address: address(7) }] };
  pool.mint0Evidence = mintEvidence(pool.tokenMint0); pool.mint1Evidence = mintEvidence(pool.tokenMint1);
  const quote = { schemaVersion: 1, protocol: "meteora-dlmm", status: "quoted", pool: pool.address, inputMint: pool.tokenMint0, outputMint: pool.tokenMint1, swapForY: true, amountInRaw: "1000", consumedInRaw: "1000", amountLeftRaw: "0", amountOutRaw: "900", inputTransferFeeRaw: "0", outputTransferFeeRaw: "0", stateSlot: 100, binArraySlot: 101, balanceSlot: 102, mintEvidenceSlot: 103, epoch: 2, binArrayIndexes: [0] };
  return { pool, quote, user: address(8), inputTokenAccount: address(9), outputTokenAccount: address(10), recentBlockhash: address(11) };
}

test("Meteora legacy swap construction binds official ABI accounts and finalized path evidence", () => {
  const args = fixture(), instruction = buildMeteoraDlmmSwapInstruction({ ...args, minimumOutputRaw: "850" });
  assert.equal(instruction.programId, METEORA_DLMM_PROGRAM); assert.equal(instruction.dataHex, `${METEORA_DLMM_EXECUTION_CONSTANTS.swapDiscriminatorHex}e8030000000000005203000000000000`);
  assert.deepEqual(instruction.accounts.slice(0, 15).map(({ signer, writable }) => [signer, writable]), [[false, true], [false, false], [false, true], [false, true], [false, true], [false, true], [false, false], [false, false], [false, true], [false, false], [true, false], [false, false], [false, false], [false, false], [false, false]]);
  assert.equal(instruction.accounts.at(-1).address, args.pool.binArrays[0].address); assert.equal(instruction.evidence.minimumOutputRaw, "850");
  assert.throws(() => buildMeteoraDlmmSwapInstruction({ ...args, minimumOutputRaw: "901" }), /bounds/); assert.throws(() => buildMeteoraDlmmSwapInstruction({ ...args, quote: { ...args.quote, binArrayIndexes: [512] }, minimumOutputRaw: "850" }), /default-bitmap/); assert.throws(() => buildMeteoraDlmmSwapInstruction({ ...args, pool: { ...args.pool, tokenProgram0: address(12) }, minimumOutputRaw: "850" }), /evidence/);
});

test("Meteora preparation and local simulation remain unsigned, policy-bound, and effect-bounded", async () => {
  const args = fixture(), preparation = prepareMeteoraDlmmSwapSimulation({ ...args, inputPreAmountRaw: "2000", outputPreAmountRaw: "100", minimumOutputRaw: "850" });
  assert.equal(preparation.transaction.signed, false); assert.equal(preparation.transaction.submitted, false); assert.equal(preparation.minContextSlot, 103);
  assert.deepEqual(inspectUnsignedTransactionPrograms(preparation.transaction.transactionBase64, { allowedProgramIds: [METEORA_DLMM_PROGRAM], requiredProgramIds: [METEORA_DLMM_PROGRAM], instructionPolicies: preparation.transaction.instructionPolicies }).programIds, [METEORA_DLMM_PROGRAM]);
  const account = (mint, amount) => { const bytes = Buffer.alloc(165); Buffer.from(base58Bytes(mint)).copy(bytes); bytes.writeBigUInt64LE(BigInt(amount), 64); return { owner: tokenProgram, data: [bytes.toString("base64"), "base64"] }; };
  const receipt = await simulatePreparedMeteoraDlmmSwap({ endpoint: "http://127.0.0.1:8899", call: async () => ({ context: { slot: 104 }, value: { err: null, logs: [], unitsConsumed: 50_000, accounts: [account(args.quote.inputMint, 1000), account(args.quote.outputMint, 950)] } }) }, { preparation, expectedGenesisHash: MAINNET_GENESIS_HASH, genesisHash: MAINNET_GENESIS_HASH });
  assert.deepEqual({ type: receipt.type, slot: receipt.simulationSlot, input: receipt.tokenEffects[0].deltaRaw, output: receipt.tokenEffects[1].deltaRaw }, { type: "meteora_dlmm_swap_simulation_receipt", slot: 104, input: "-1000", output: "850" });
  await assert.rejects(simulatePreparedMeteoraDlmmSwap({ endpoint: "http://127.0.0.1:8899", call: async () => null }, { preparation: { ...preparation, minContextSlot: 102 }, expectedGenesisHash: MAINNET_GENESIS_HASH, genesisHash: MAINNET_GENESIS_HASH }), /preparation is invalid/);
});

function base58Bytes(value) { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", indexes = new Map([...alphabet].map((character, index) => [character, index])); let number = 0n; for (const character of value) number = number * 58n + BigInt(indexes.get(character)); const bytes = []; while (number) { bytes.unshift(Number(number & 255n)); number >>= 8n; } while (bytes.length < 32) bytes.unshift(0); return bytes; }
