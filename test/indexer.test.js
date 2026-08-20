import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { indexInbox } from "../src/indexer.js";
import { parseBlock } from "../src/parser.js";
import { createServer } from "../src/server.js";
import { IndexStore } from "../src/store.js";
import { validateLocalRpcUrl } from "../src/local-validator-exporter.js";

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/block.json");

test("parses a canonical parsed block and SPL transfer", async () => {
  const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  assert.equal(block.transactions.length, 1); assert.equal(block.transfers.length, 1);
  assert.equal(block.transfers[0].mint, "mint-address");
  assert.deepEqual({ amountRaw: block.transfers[0].amountRaw, decimals: block.transfers[0].decimals, amountUiString: block.transfers[0].amountUiString }, { amountRaw: "12500000", decimals: 6, amountUiString: "12.5" });
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
