import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { indexInbox } from "../src/indexer.js";
import { loadConfig } from "../src/config.js";
import { decodePumpSwapEvents, decodePumpTradeEvents, decodeRaydiumSwapEvents, parseBlock } from "../src/parser.js";
import { createServer } from "../src/server.js";
import { IndexStore } from "../src/store.js";
import { exportFinalizedBlocks, validateLocalRpcUrl } from "../src/local-validator-exporter.js";
import { LocalValidatorStream, validateLocalWsUrl } from "../src/local-validator-stream.js";

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/block.json");

test("parses a canonical parsed block and SPL transfer", async () => {
  const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  assert.equal(block.transactions.length, 1); assert.equal(block.transfers.length, 1);
  assert.equal(block.transfers[0].mint, "mint-address");
  assert.equal(block.provenance.commitment, "finalized");
  assert.deepEqual({ amountRaw: block.transfers[0].amountRaw, decimals: block.transfers[0].decimals, amountUiString: block.transfers[0].amountUiString }, { amountRaw: "12500000", decimals: 6, amountUiString: "12.5" });
  assert.deepEqual({ protocol: block.swaps[0].protocol, pool: block.swaps[0].pool, inputAmountRaw: block.swaps[0].inputAmountRaw, outputAmountRaw: block.swaps[0].outputAmountRaw }, { protocol: "raydium-cpmm", pool: "pool-address", inputAmountRaw: "12500000", outputAmountRaw: "2500000" });
});

test("indexes loaded-address token balance changes and rebuilds partial holders on reorg", async (t) => {
  const input = JSON.parse(await fs.readFile(fixture, "utf8")); const entry = input.transactions[0]; entry.meta.loadedAddresses = { writable: ["loaded-token-account"], readonly: ["loaded-program-account"] };
  entry.meta.preTokenBalances = [{ accountIndex: 3, mint: "holder-mint", owner: "wallet-a", programId: "TokenzQdBN", uiTokenAmount: { amount: "10", decimals: 6 } }];
  entry.meta.postTokenBalances = [{ accountIndex: 3, mint: "holder-mint", owner: "wallet-a", programId: "TokenzQdBN", uiTokenAmount: { amount: "25", decimals: 6 } }]; input.dexEvents = [];
  const block = parseBlock(input); assert.ok(block.transactions[0].accounts.includes("loaded-program-account")); assert.deepEqual(block.balanceChanges[0], { signature: "signature-1", slot: 100, blockTime: 1_700_000_000, accountIndex: 3, tokenAccount: "loaded-token-account", owner: "wallet-a", programId: "TokenzQdBN", mint: "holder-mint", decimals: 6, preAmountRaw: "10", postAmountRaw: "25", deltaDirection: "credit", closed: false });
  const store = new IndexStore("unused"); await store.load(); store.apply(block); assert.equal(store.tokenAccount("loaded-token-account").amountRaw, "25"); assert.deepEqual(store.holders("holder-mint").holders, [{ owner: "wallet-a", amountRaw: "25", tokenAccounts: 1 }]);
  const replacement = { ...block, blockhash: "replacement", balanceChanges: [{ ...block.balanceChanges[0], preAmountRaw: "10", postAmountRaw: "5", deltaDirection: "debit" }] }; store.apply(replacement);
  assert.equal(store.holders("holder-mint").observedRaw, "5"); assert.equal(store.holders("holder-mint").complete, false);
  const server = createServer({}, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise((resolve) => server.close(resolve))); const base = `http://127.0.0.1:${server.address().port}`;
  const holders = await (await fetch(`${base}/api/v1/holders/holder-mint`)).json(); assert.equal(holders.coverage, "observed_changes_only"); assert.equal(holders.safeForAutomation, false);
  assert.equal((await (await fetch(`${base}/api/v1/token-account/loaded-token-account`)).json()).amountRaw, "5");
});

test("indexes idempotently and persists queryable state", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-indexer-"));
  const inbox = path.join(root, "inbox"); await fs.mkdir(inbox); await fs.copyFile(fixture, path.join(inbox, "100.json"));
  const config = { inbox, dataFile: path.join(root, "data/index.json"), maxTransactions: 1000 };
  const store = new IndexStore(config.dataFile, config.maxTransactions);
  const first = await indexInbox(config, store); const second = await indexInbox(config, store);
  assert.deepEqual({ blocks: first.blocks, transactions: first.transactions, transfers: first.transfers }, { blocks: 1, transactions: 1, transfers: 1 });
  assert.equal(second.skippedFiles, 1); assert.equal(store.stats().transactions, 1);
  assert.equal(store.account("payer").transactions[0].signature, "signature-1");
  assert.equal(store.mint("mint-address").transfers[0].amountRaw, "12500000");
});

test("checkpoint fingerprints detect same-sized content replacement", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-fingerprint-")); const inbox = path.join(root, "inbox"); await fs.mkdir(inbox);
  const firstBlock = JSON.parse(await fs.readFile(fixture, "utf8")); firstBlock.dexEvents = []; const first = JSON.stringify(firstBlock); const second = JSON.stringify({ ...firstBlock, blockhash: "clock-100" });
  assert.equal(Buffer.byteLength(first), Buffer.byteLength(second)); const filename = path.join(inbox, "100.json"); await fs.writeFile(filename, first);
  const store = new IndexStore(path.join(root, "data.json"), 1000); const config = { inbox, dataFile: path.join(root, "data.json"), maxTransactions: 1000 };
  await indexInbox(config, store); await fs.writeFile(filename, second); const result = await indexInbox(config, store);
  assert.equal(result.files, 1); assert.equal(store.state.blocks["100"].blockhash, "clock-100");
});

test("replaces a conflicting slot without retaining orphaned records", async () => {
  const store = new IndexStore("unused"); await store.load();
  const original = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(original);
  const replacement = { ...original, blockhash: "replacement", transactions: [{ ...original.transactions[0], signature: "signature-2" }], transfers: [{ ...original.transfers[0], signature: "signature-2" }] };
  assert.equal(store.apply(replacement).reason, "replaced"); assert.equal(store.transaction("signature-1"), null); assert.ok(store.transaction("signature-2"));
});

test("promotes matching confirmed blocks and refuses finalized downgrades", async () => {
  const store = new IndexStore("unused"); await store.load(); const original = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  const confirmed = { ...original, provenance: { ...original.provenance, commitment: "confirmed" }, swaps: original.swaps.map((swap) => ({ ...swap, provenance: { ...swap.provenance, commitment: "confirmed" } })) };
  store.apply(confirmed); const promoted = store.apply(original); assert.equal(promoted.reason, "finalized"); assert.equal(store.state.blocks["100"].provenance.commitment, "finalized"); assert.equal(store.state.swaps[0].provenance.commitment, "finalized"); assert.equal(store.state.events.at(-1).type, "block_finalized");
  assert.throws(() => store.apply({ ...confirmed, blockhash: "late-confirmed-fork" }), /refusing to replace finalized slot/);
});

test("health fails closed for empty and stale indexes", async () => {
  const store = new IndexStore("unused"); await store.load();
  assert.deepEqual({ status: store.health().status, healthy: store.health().healthy }, { status: "empty", healthy: false });
  const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block); store.state.updatedAt = "2023-11-14T22:13:20.000Z";
  assert.equal(store.health(1000, 1_700_000_002_000).status, "stale");
  assert.equal(store.health(5000, 1_700_000_002_000).status, "healthy");
});

test("health fails closed when indexed parent hashes conflict", async () => {
  const store = new IndexStore("unused"); await store.load();
  const original = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  store.apply({ ...original, slot: 99, blockhash: "actual-parent", previousBlockhash: "block-98", parentSlot: 98 });
  store.apply(original); store.state.updatedAt = "2023-11-14T22:13:20.000Z";
  const health = store.health(5_000, 1_700_000_002_000);
  assert.equal(health.status, "chain_conflict"); assert.equal(health.healthy, false);
  assert.deepEqual(health.chain.conflicts[0], { slot: 100, parentSlot: 99, expectedPreviousBlockhash: "actual-parent", actualPreviousBlockhash: "block-99" });
});

test("validator exporter accepts only loopback RPC", () => {
  assert.equal(validateLocalRpcUrl("http://127.0.0.1:8899"), "http://127.0.0.1:8899/");
  assert.throws(() => validateLocalRpcUrl("https://api.mainnet-beta.solana.com"), /must use http/);
  assert.throws(() => validateLocalRpcUrl("http://192.168.1.10:8899"), /non-loopback/);
});

test("validator stream accepts only loopback WebSocket endpoints", () => {
  assert.equal(validateLocalWsUrl("ws://127.0.0.1:8900"), "ws://127.0.0.1:8900/");
  assert.throws(() => validateLocalWsUrl("wss://example.com"), /must use ws/); assert.throws(() => validateLocalWsUrl("ws://192.168.1.2:8900"), /non-loopback/);
});

test("validator stream atomically persists commitments and repairs bounded gaps", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-stream-")); const calls = [];
  const rpcClient = { call: async (method, params) => { calls.push([method, params[0]]); return { blockhash: `block-${params[0]}`, previousBlockhash: `block-${params[0] - 1}`, parentSlot: params[0] - 1, blockTime: 1_700_000_000, transactions: [] }; } };
  const stream = new LocalValidatorStream({ rpcClient, inbox: path.join(root, "inbox"), statusFile: path.join(root, "status.json"), WebSocketClass: class {}, endpoint: "ws://127.0.0.1:8900" });
  const block = (slot) => ({ blockhash: `block-${slot}`, previousBlockhash: `block-${slot - 1}`, parentSlot: slot - 1, blockTime: 1_700_000_000, transactions: [] });
  await stream.ingestBlock("confirmed", 10, block(10)); await stream.ingestBlock("confirmed", 12, block(12)); await stream.ingestBlock("finalized", 10, block(10));
  assert.deepEqual(calls, [["getBlock", 11]]); assert.ok(await fs.readFile(path.join(root, "inbox", "11.confirmed.json"), "utf8"));
  const status = JSON.parse(await fs.readFile(path.join(root, "status.json"), "utf8")); assert.deepEqual({ confirmed: status.lastConfirmedSlot, finalized: status.lastFinalizedSlot, lag: status.finalizationLagSlots, repairs: status.gapRepairs }, { confirmed: 12, finalized: 10, lag: 2, repairs: 1 });
});

test("exporter records finalized provenance, lag, and skipped slots", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-exporter-"));
  const client = { call: async (method, params) => method === "getSlot" ? 12 : params[0] === 11 ? null : { blockhash: `block-${params[0]}`, previousBlockhash: "parent", parentSlot: params[0] - 1, blockTime: 1_700_000_000, transactions: [] } };
  await fs.writeFile(path.join(root, "cursor"), "9\n");
  const statusFile = path.join(root, "status.json");
  const result = await exportFinalizedBlocks({ client, inbox: path.join(root, "inbox"), cursorFile: path.join(root, "cursor"), statusFile, batchSize: 2 });
  assert.deepEqual(result, { localValidatorTip: 12, cursor: 11, lagSlots: 1, exported: 1, skipped: 1, skippedSlots: [11] });
  const block = JSON.parse(await fs.readFile(path.join(root, "inbox", "10.json"), "utf8"));
  assert.deepEqual({ source: block.provenance.source, commitment: block.provenance.commitment, sourceTip: block.provenance.sourceTip, exportLagSlots: block.provenance.exportLagSlots }, { source: "local-agave-rpc", commitment: "finalized", sourceTip: 12, exportLagSlots: 2 });
  const status = JSON.parse(await fs.readFile(statusFile, "utf8"));
  assert.deepEqual({ commitment: status.commitment, lagSlots: status.lagSlots, durableSkippedSlots: status.durableSkippedSlots }, { commitment: "finalized", lagSlots: 1, durableSkippedSlots: [11] });
});

test("REST v1 exposes chain quality and fails closed when empty", async (t) => {
  const store = new IndexStore("unused"); await store.load();
  const server = createServer({ staleAfterMs: 120_000 }, store);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 503); assert.equal(health.headers.get("x-api-version"), "1");
  assert.equal((await health.json()).status, "empty");
  const stats = await fetch(`${base}/api/stats`);
  assert.equal(stats.status, 200); assert.deepEqual((await stats.json()).chain, { canonical: true, conflicts: [], conflictCount: 0 });
});

test("REST v1 paginates stably and rejects invalid cursors", async (t) => {
  const store = new IndexStore("unused"); await store.load();
  const original = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  store.apply(original); store.apply({ ...original, slot: 101, blockhash: "block-101", previousBlockhash: "block-100", parentSlot: 100, transactions: [{ ...original.transactions[0], signature: "signature-2", slot: 101 }], transfers: [] });
  store.state.updatedAt = new Date().toISOString();
  const server = createServer({ staleAfterMs: 120_000 }, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve))); const base = `http://127.0.0.1:${server.address().port}`;
  const first = await (await fetch(`${base}/api/v1/blocks?limit=1`)).json();
  assert.equal(first.data[0].slot, 101); assert.ok(first.nextCursor);
  const second = await (await fetch(`${base}/api/v1/blocks?limit=1&cursor=${first.nextCursor}`)).json();
  assert.equal(second.data[0].slot, 100); assert.equal(second.nextCursor, null);
  assert.equal((await fetch(`${base}/api/v1/blocks?cursor=bad`)).status, 400);
});

test("same-transaction swaps retain unique identities and paginate without loss", async (t) => {
  const input = JSON.parse(await fs.readFile(fixture, "utf8")); input.dexEvents.push({ ...input.dexEvents[0], pool: "second-pool", inputAmountRaw: "7", outputAmountRaw: "9" });
  const block = parseBlock(input); assert.deepEqual(block.swaps.map((row) => row.swapId), ["signature-1:0", "signature-1:1"]);
  const store = new IndexStore("unused"); await store.load(); store.apply(block);
  const server = createServer({ staleAfterMs: 120_000 }, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise((resolve) => server.close(resolve))); const base = `http://127.0.0.1:${server.address().port}`;
  const first = await (await fetch(`${base}/api/v1/swaps?limit=1`)).json(); const second = await (await fetch(`${base}/api/v1/swaps?limit=1&cursor=${first.nextCursor}`)).json();
  assert.equal(first.data.length, 1); assert.equal(second.data.length, 1); assert.notEqual(first.data[0].swapId, second.data[0].swapId); assert.equal(second.nextCursor, null);
});

test("bot readiness refuses incomplete market data", async () => {
  const store = new IndexStore("unused"); await store.load();
  const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block); store.state.updatedAt = new Date().toISOString();
  const readiness = store.botReadiness(120_000, 1_700_000_001_000);
  assert.equal(readiness.ready, false); assert.equal(readiness.reason, "missing_required_capabilities");
  assert.deepEqual(readiness.missing, ["targetPool", "riskSignals"]);
});

test("Raydium decoder boundary rejects unsupported programs and failed signatures", async () => {
  const fixtureBlock = JSON.parse(await fs.readFile(fixture, "utf8"));
  assert.throws(() => parseBlock({ ...fixtureBlock, dexEvents: [{ ...fixtureBlock.dexEvents[0], programId: "untrusted" }] }), /not a supported DEX swap/);
  fixtureBlock.transactions[0].meta.err = { InstructionError: [0, "Custom"] };
  assert.throws(() => parseBlock(fixtureBlock), /must reference a successful transaction/);
});

test("decodes Raydium CPMM Anchor swap events only inside its invocation", () => {
  const data = Buffer.alloc(170); const discriminator = crypto.createHash("sha256").update("event:SwapEvent").digest(); discriminator.copy(data, 0, 0, 8);
  data.fill(1, 8, 40); data.writeBigUInt64LE(1000n, 40); data.writeBigUInt64LE(2000n, 48); data.writeBigUInt64LE(100n, 56); data.writeBigUInt64LE(190n, 64); data[88] = 1; data.fill(2, 89, 121); data.fill(3, 121, 153); data.writeBigUInt64LE(1n, 153);
  const program = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"; const encoded = data.toString("base64");
  const events = decodeRaydiumSwapEvents({ meta: { err: null, logMessages: [`Program ${program} invoke [1]`, `Program data: ${encoded}`, `Program ${program} success`], preTokenBalances: [], postTokenBalances: [] } }, "sig");
  assert.equal(events.length, 1); assert.deepEqual({ inputAmountRaw: events[0].inputAmountRaw, outputAmountRaw: events[0].outputAmountRaw, tradeFeeRaw: events[0].tradeFeeRaw }, { inputAmountRaw: "100", outputAmountRaw: "190", tradeFeeRaw: "1" });
  assert.equal(decodeRaydiumSwapEvents({ meta: { err: null, logMessages: [`Program other invoke [1]`, `Program data: ${encoded}`, "Program other success"] } }, "sig").length, 0);
});

test("decodes PumpSwap sell events with exact directional amounts and reserves", () => {
  const data = Buffer.alloc(417); crypto.createHash("sha256").update("event:SellEvent").digest().copy(data, 0, 0, 8);
  data.writeBigUInt64LE(100n, 16); data.writeBigUInt64LE(900n, 48); data.writeBigUInt64LE(1800n, 56); data.writeBigUInt64LE(190n, 64); data.writeBigUInt64LE(2n, 80); data.writeBigUInt64LE(1n, 96);
  const program = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
  const entry = { transaction: { message: { instructions: [{ programId: program, accounts: ["pump-pool", "user", "config", "base-mint", "quote-mint"] }] } }, meta: { err: null, logMessages: [`Program ${program} invoke [1]`, `Program data: ${data.toString("base64")}`, `Program ${program} success`], preTokenBalances: [{ mint: "base-mint", uiTokenAmount: { decimals: 6 } }, { mint: "quote-mint", uiTokenAmount: { decimals: 9 } }] } };
  const [swap] = decodePumpSwapEvents(entry, "pump-signature");
  assert.deepEqual({ side: swap.side, pool: swap.pool, inputMint: swap.inputMint, outputMint: swap.outputMint, inputAmountRaw: swap.inputAmountRaw, outputAmountRaw: swap.outputAmountRaw, inputVaultBeforeRaw: swap.inputVaultBeforeRaw, outputVaultBeforeRaw: swap.outputVaultBeforeRaw, tradeFeeRaw: swap.tradeFeeRaw, reserveTiming: swap.reserveTiming }, { side: "sell", pool: "pump-pool", inputMint: "base-mint", outputMint: "quote-mint", inputAmountRaw: "100", outputAmountRaw: "190", inputVaultBeforeRaw: "900", outputVaultBeforeRaw: "1800", tradeFeeRaw: "3", reserveTiming: "after" });
});

test("decodes Pump.fun bonding-curve TradeEvent with exact quote and reserve evidence", () => {
  const encode58 = (bytes) => { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let out = ""; while (value) { out = alphabet[Number(value % 58n)] + out; value /= 58n; } for (const byte of bytes) { if (byte) break; out = `1${out}`; } return out || "1"; };
  const data = Buffer.alloc(358); Buffer.from([189, 219, 127, 211, 78, 230, 97, 238]).copy(data); const mintBytes = Buffer.alloc(32, 1); const quoteBytes = Buffer.alloc(32, 2); mintBytes.copy(data, 8);
  data.writeBigUInt64LE(500n, 40); data.writeBigUInt64LE(2_000n, 48); data[56] = 1; Buffer.alloc(32, 3).copy(data, 57); data.writeBigInt64LE(1_700_000_000n, 89); data.writeBigUInt64LE(10_000n, 97); data.writeBigUInt64LE(20_000n, 105); data.writeBigUInt64LE(8_000n, 113); data.writeBigUInt64LE(18_000n, 121); Buffer.alloc(32, 4).copy(data, 129); data.writeBigUInt64LE(100n, 161); data.writeBigUInt64LE(5n, 169); Buffer.alloc(32, 5).copy(data, 177); data.writeBigUInt64LE(25n, 209); data.writeBigUInt64LE(2n, 217);
  const name = Buffer.from("buy"); data.writeUInt32LE(name.length, 258); name.copy(data, 262); let offset = 265; data[offset++] = 1; data.writeBigUInt64LE(10n, offset); offset += 8; data.writeBigUInt64LE(1n, offset); offset += 8; data.writeBigUInt64LE(20n, offset); offset += 8; data.writeBigUInt64LE(2n, offset); offset += 8; data.writeUInt32LE(0, offset); offset += 4; quoteBytes.copy(data, offset); offset += 32; data.writeBigUInt64LE(510n, offset); offset += 8; data.writeBigUInt64LE(9_500n, offset); offset += 8; data.writeBigUInt64LE(7_500n, offset);
  const program = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"; const mint = encode58(mintBytes); const quoteMint = encode58(quoteBytes);
  const entry = { transaction: { message: { instructions: [{ programId: program, accounts: ["global", "fee", mint, "bonding-curve"] }] } }, meta: { err: null, logMessages: [`Program ${program} invoke [1]`, `Program data: ${data.toString("base64")}`, `Program ${program} success`], preTokenBalances: [{ mint, uiTokenAmount: { decimals: 6 } }, { mint: quoteMint, uiTokenAmount: { decimals: 9 } }] } };
  const [swap] = decodePumpTradeEvents(entry, "trade-signature");
  assert.deepEqual({ protocol: swap.protocol, venueType: swap.venueType, side: swap.side, pool: swap.pool, inputMint: swap.inputMint, outputMint: swap.outputMint, inputAmountRaw: swap.inputAmountRaw, outputAmountRaw: swap.outputAmountRaw, realTokenReservesRaw: swap.realTokenReservesRaw, realQuoteReservesRaw: swap.realQuoteReservesRaw, ixName: swap.ixName, mayhemMode: swap.mayhemMode }, { protocol: "pump-bonding-curve", venueType: "bonding_curve", side: "buy", pool: "bonding-curve", inputMint: quoteMint, outputMint: mint, inputAmountRaw: "510", outputAmountRaw: "2000", realTokenReservesRaw: "18000", realQuoteReservesRaw: "7500", ixName: "buy", mayhemMode: true });
  assert.equal(decodePumpTradeEvents({ ...entry, meta: { ...entry.meta, logMessages: [`Program other invoke [1]`, `Program data: ${data.toString("base64")}`, "Program other success"] } }, "trade-signature").length, 0);
});

test("pool state keeps exact reserve and execution-price evidence", async () => {
  const store = new IndexStore("unused"); await store.load(); const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block);
  const pool = store.pool("pool-address"); assert.equal(pool.summary.swapCount, 1);
  assert.deepEqual(pool.summary.executionPrice, { numeratorRaw: "2500000", denominatorRaw: "12500000", inputDecimals: 6, outputDecimals: 6 });
  assert.equal(store.dataCapabilities().dexSwaps, true); assert.equal(store.dataCapabilities().poolLiquidity, true); assert.equal(store.dataCapabilities().marketPrices, true);
  assert.equal(store.mint("mint-address").swaps[0].pool, "pool-address"); assert.equal(store.mint("quote-mint").swaps[0].signature, "signature-1");
});

test("pool risk and bot readiness require explicit mature two-way finalized evidence", async () => {
  const store = new IndexStore("unused"); await store.load(); const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  for (let index = 0; index < 20; index++) { const swap = { ...block.swaps[0], swapId: `risk-${index}:0`, eventIndex: 0, signature: `risk-${index}`, slot: 100 + index, blockTime: 1_700_000_000 + index, inputMint: index % 2 ? "quote-mint" : "mint-address", outputMint: index % 2 ? "mint-address" : "quote-mint" }; store.state.swaps.push(swap); }
  const now = 1_700_000_020_000; const risk = store.poolRisk("pool-address", 120_000, now); assert.equal(risk.assessable, true); assert.equal(risk.safeForAutomation, false); assert.deepEqual(risk.flags, []); assert.ok(risk.blockers.includes("holder_concentration_unknown"));
  store.state.blocks["119"] = { blockTime: 1_700_000_019, provenance: { commitment: "finalized" } }; store.state.tip = 119; store.state.updatedAt = new Date(now).toISOString(); store.state.pools["pool-address"] = { swapCount: 20 };
  const readiness = store.botReadiness(120_000, now, "pool-address"); assert.equal(readiness.ready, false); assert.deepEqual(readiness.missing, ["riskSignals"]);
});

test("trending is deterministic for equal transfer counts", async () => {
  const store = new IndexStore("unused"); await store.load();
  store.state.mints = { older: { transferCount: 2, lastSlot: 10 }, newer: { transferCount: 2, lastSlot: 11 }, busy: { transferCount: 3, lastSlot: 9 } };
  assert.deepEqual(store.trending(3).map((row) => row.mint), ["busy", "newer", "older"]);
});

test("rolling trending excludes stale activity and exposes trader and protocol evidence", async () => {
  const store = new IndexStore("unused"); await store.load(); const now = 1_700_000_100_000;
  store.state.swaps = [
    { slot: 10, blockTime: 1_700_000_090, protocol: "pump-bonding-curve", side: "buy", inputMint: "quote", outputMint: "token", user: "trader-a" },
    { slot: 11, blockTime: 1_700_000_095, protocol: "pump-bonding-curve", side: "sell", inputMint: "token", outputMint: "quote", user: "trader-b" },
    { slot: 1, blockTime: 1_699_990_000, protocol: "raydium-cpmm", inputMint: "stale", outputMint: "quote" },
  ];
  const rows = store.trending(10, 300, now); const token = rows.find((row) => row.mint === "token");
  assert.deepEqual({ swapCount: token.swapCount, buyCount: token.buyCount, sellCount: token.sellCount, uniqueTraders: token.uniqueTraders, protocols: token.protocols }, { swapCount: 2, buyCount: 1, sellCount: 1, uniqueTraders: 2, protocols: ["pump-bonding-curve"] });
  assert.equal(rows.some((row) => row.mint === "stale"), false);
});

test("JSON-RPC exposes only read-only indexed methods", async (t) => {
  const store = new IndexStore("unused"); await store.load();
  const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block); store.state.updatedAt = new Date().toISOString();
  const server = createServer({ staleAfterMs: 120_000, exporterStatusFile: "missing" }, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve))); const endpoint = `http://127.0.0.1:${server.address().port}/rpc`;
  const call = async (body) => (await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();
  const found = await call({ jsonrpc: "2.0", id: 1, method: "getIndexedTransaction", params: ["signature-1"] });
  assert.equal(found.result.signature, "signature-1");
  assert.equal((await call({ jsonrpc: "2.0", id: 2, method: "sendTransaction", params: [] })).error.code, -32601);
  assert.equal((await call({ jsonrpc: "2.0", id: 3, method: "getIndexedTransaction", params: [] })).error.code, -32602);
});

test("ingestion API distinguishes unavailable from durable exporter evidence", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-ingestion-api-")); const statusFile = path.join(root, "status.json");
  const store = new IndexStore("unused"); await store.load(); const config = { staleAfterMs: 120_000, exporterStatusFile: statusFile };
  const server = createServer(config, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve))); const endpoint = `http://127.0.0.1:${server.address().port}/api/v1/ingestion`;
  assert.equal((await fetch(endpoint)).status, 503);
  await fs.writeFile(statusFile, JSON.stringify({ version: 1, commitment: "finalized", lagSlots: 0, durableSkippedSlots: [7] }));
  const response = await fetch(endpoint); const body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.available, true); assert.deepEqual(body.exporter.durableSkippedSlots, [7]);
});

test("configuration refuses public binding without API keys", () => {
  assert.throws(() => loadConfig({ INDEXER_HOST: "0.0.0.0" }, process.cwd()), /INDEXER_API_KEYS is required/);
  const config = loadConfig({ INDEXER_HOST: "0.0.0.0", INDEXER_API_KEYS: "first, second", INDEXER_RATE_LIMIT_PER_MINUTE: "25" }, process.cwd());
  assert.deepEqual(config.apiKeys, ["first", "second"]); assert.equal(config.rateLimitPerMinute, 25);
});

test("API authentication and quotas fail closed", async (t) => {
  const store = new IndexStore("unused"); await store.load(); const config = { staleAfterMs: 120_000, apiKeys: ["secret"], rateLimitPerMinute: 2 };
  const server = createServer(config, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve))); const endpoint = `http://127.0.0.1:${server.address().port}/api/stats`;
  assert.equal((await fetch(endpoint)).status, 401); assert.equal((await fetch(endpoint, { headers: { "x-api-key": "wrong" } })).status, 401);
  const first = await fetch(endpoint, { headers: { authorization: "Bearer secret" } }); assert.equal(first.status, 200); assert.equal(first.headers.get("x-ratelimit-remaining"), "1");
  assert.equal((await fetch(endpoint, { headers: { "x-api-key": "secret" } })).status, 200);
  const limited = await fetch(endpoint, { headers: { "x-api-key": "secret" } }); assert.equal(limited.status, 429); assert.ok(limited.headers.get("retry-after"));
});

test("WebSocket replays only persisted ordered events and resumes by cursor", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-websocket-")); const store = new IndexStore(path.join(root, "index.json")); await store.load();
  const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block); await store.save();
  const server = createServer({ staleAfterMs: 120_000, webSocketHeartbeatMs: 60_000 }, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve))); const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}/ws?cursor=0`);
  const messages = []; socket.onmessage = ({ data }) => messages.push(JSON.parse(data)); await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  while (messages.length < 2) await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(messages[0].type, "ready"); assert.deepEqual({ type: messages[1].type, sequence: messages[1].sequence, slot: messages[1].slot }, { type: "block_indexed", sequence: 1, slot: 100 });
  store.apply({ ...block, slot: 101, blockhash: "block-101", previousBlockhash: "block-100", parentSlot: 100, transactions: [], transfers: [] });
  await new Promise((resolve) => setTimeout(resolve, 10)); assert.equal(messages.length, 2);
  await store.save(); while (messages.length < 3) await new Promise((resolve) => setTimeout(resolve, 5)); assert.equal(messages[2].sequence, 2); socket.close();
});

test("WebSocket accepts browser-compatible bearer subprotocol auth", async (t) => {
  const store = new IndexStore("unused"); await store.load(); const server = createServer({ apiKeys: ["secret"], webSocketHeartbeatMs: 60_000 }, store);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise((resolve) => server.close(resolve)));
  const credential = Buffer.from("secret").toString("base64url"); const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}/ws`, ["indexer.v1", `bearer.${credential}`]);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; }); assert.equal(socket.protocol, "indexer.v1"); socket.close();
});

test("WebSocket swap topic replays only matching token activity", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-websocket-filter-")); const store = new IndexStore(path.join(root, "index.json")); await store.load();
  const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block); await store.save();
  const server = createServer({ webSocketHeartbeatMs: 60_000 }, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise((resolve) => server.close(resolve)));
  const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}/ws?cursor=0&topic=swaps&mint=quote-mint`); const messages = [];
  socket.onmessage = ({ data }) => messages.push(JSON.parse(data)); await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  while (messages.length < 2) await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(messages[0].subscription.topic, "swaps"); assert.equal(messages[1].type, "swaps"); assert.equal(messages[1].swaps[0].pool, "pool-address"); socket.close();
});
