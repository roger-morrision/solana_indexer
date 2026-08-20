import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { indexInbox } from "../src/indexer.js";
import { loadConfig } from "../src/config.js";
import { decodePumpSwapEvents, decodeRaydiumSwapEvents, parseBlock } from "../src/parser.js";
import { createServer } from "../src/server.js";
import { IndexStore } from "../src/store.js";
import { exportFinalizedBlocks, validateLocalRpcUrl } from "../src/local-validator-exporter.js";

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/block.json");

test("parses a canonical parsed block and SPL transfer", async () => {
  const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  assert.equal(block.transactions.length, 1); assert.equal(block.transfers.length, 1);
  assert.equal(block.transfers[0].mint, "mint-address");
  assert.equal(block.provenance.commitment, "finalized");
  assert.deepEqual({ amountRaw: block.transfers[0].amountRaw, decimals: block.transfers[0].decimals, amountUiString: block.transfers[0].amountUiString }, { amountRaw: "12500000", decimals: 6, amountUiString: "12.5" });
  assert.deepEqual({ protocol: block.swaps[0].protocol, pool: block.swaps[0].pool, inputAmountRaw: block.swaps[0].inputAmountRaw, outputAmountRaw: block.swaps[0].outputAmountRaw }, { protocol: "raydium-cpmm", pool: "pool-address", inputAmountRaw: "12500000", outputAmountRaw: "2500000" });
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

test("replaces a conflicting slot without retaining orphaned records", async () => {
  const store = new IndexStore("unused"); await store.load();
  const original = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(original);
  const replacement = { ...original, blockhash: "replacement", transactions: [{ ...original.transactions[0], signature: "signature-2" }], transfers: [{ ...original.transfers[0], signature: "signature-2" }] };
  assert.equal(store.apply(replacement).reason, "replaced"); assert.equal(store.transaction("signature-1"), null); assert.ok(store.transaction("signature-2"));
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

test("pool state keeps exact reserve and execution-price evidence", async () => {
  const store = new IndexStore("unused"); await store.load(); const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block);
  const pool = store.pool("pool-address"); assert.equal(pool.summary.swapCount, 1);
  assert.deepEqual(pool.summary.executionPrice, { numeratorRaw: "2500000", denominatorRaw: "12500000", inputDecimals: 6, outputDecimals: 6 });
  assert.equal(store.dataCapabilities().dexSwaps, true); assert.equal(store.dataCapabilities().poolLiquidity, true); assert.equal(store.dataCapabilities().marketPrices, true);
  assert.equal(store.mint("mint-address").swaps[0].pool, "pool-address"); assert.equal(store.mint("quote-mint").swaps[0].signature, "signature-1");
});

test("pool risk and bot readiness require explicit mature two-way finalized evidence", async () => {
  const store = new IndexStore("unused"); await store.load(); const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  for (let index = 0; index < 20; index++) { const swap = { ...block.swaps[0], signature: `risk-${index}`, slot: 100 + index, blockTime: 1_700_000_000 + index, inputMint: index % 2 ? "quote-mint" : "mint-address", outputMint: index % 2 ? "mint-address" : "quote-mint" }; store.state.swaps.push(swap); }
  const now = 1_700_000_020_000; const risk = store.poolRisk("pool-address", 120_000, now); assert.equal(risk.assessable, true); assert.equal(risk.safeForAutomation, false); assert.deepEqual(risk.flags, []); assert.ok(risk.blockers.includes("holder_concentration_unknown"));
  store.state.blocks["119"] = { blockTime: 1_700_000_019, provenance: { commitment: "finalized" } }; store.state.tip = 119; store.state.updatedAt = new Date(now).toISOString(); store.state.pools["pool-address"] = { swapCount: 20 };
  const readiness = store.botReadiness(120_000, now, "pool-address"); assert.equal(readiness.ready, false); assert.deepEqual(readiness.missing, ["riskSignals"]);
});

test("trending is deterministic for equal transfer counts", async () => {
  const store = new IndexStore("unused"); await store.load();
  store.state.mints = { older: { transferCount: 2, lastSlot: 10 }, newer: { transferCount: 2, lastSlot: 11 }, busy: { transferCount: 3, lastSlot: 9 } };
  assert.deepEqual(store.trending(3).map((row) => row.mint), ["busy", "newer", "older"]);
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
