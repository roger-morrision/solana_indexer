import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { indexInbox } from "../src/indexer.js";
import { loadConfig } from "../src/config.js";
import { decodePumpSwapEvents, decodePumpTradeEvents, decodeRaydiumClmmSwapEvents, decodeRaydiumSwapEvents, parseBlock } from "../src/parser.js";
import { createServer } from "../src/server.js";
import { IndexStore } from "../src/store.js";
import { exportFinalizedBlocks, LocalValidatorClient, MAINNET_GENESIS_HASH, recordExporterFailure, validateLocalRpcUrl } from "../src/local-validator-exporter.js";
import { LocalValidatorStream, validateLocalWsUrl } from "../src/local-validator-stream.js";
import { createAccountSnapshot } from "../src/account-snapshot.js";
import { createClmmPoolSnapshot, decodeClmmBitmapExtensionAccount, decodeClmmPoolAccount, decodeClmmTickArrayAccount, parseClmmBitmapExtensionMap, parseClmmTickArrayMap, RAYDIUM_CLMM_PROGRAM } from "../src/clmm-pool-snapshot.js";
import { ExternalRpcPool, providerPoolFromEnv, validateProviderUrl } from "../src/external-rpc.js";
import { retainInbox } from "../src/inbox-retention.js";
import { completeArchiveReceipt, createInboxManifest } from "../src/archive-receipt.js";
import { reconcileDeadLetters } from "../src/dead-letter-reconcile.js";
import { exporterHealthCheck } from "../src/exporter-health.js";
import { archiveInbox } from "../src/inbox-archive.js";
import { reducedPreflight } from "../src/reduced-preflight.js";

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/block.json");
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("pins the canonical Solana mainnet genesis hash", () => {
  assert.equal(MAINNET_GENESIS_HASH, "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d");
});

test("parses a canonical parsed block and SPL transfer", async () => {
  const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  assert.equal(block.transactions.length, 1); assert.equal(block.transfers.length, 1);
  assert.equal(block.instructions.length, 1); assert.equal(block.instructions[0].eventId, "solana:100:signature-1:0:-1:instruction"); assert.equal(block.instructions[0].protocol, "spl-token"); assert.match(block.instructions[0].rawPayloadHash, /^[0-9a-f]{64}$/);
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

test("canonical finalized account snapshots persist complete holder and authority evidence", async () => {
  const client = { call: async (method, params) => { if (method === "getSlot") return 500; if (method === "getMultipleAccounts") return { value: [{ data: { parsed: { info: { decimals: 6, supply: "100", mintAuthority: null, freezeAuthority: null, extensions: [] } } } }] }; if (method === "getProgramAccounts") return params[0].startsWith("Tokenkeg") ? [{ pubkey: "token-a", account: { data: { parsed: { info: { mint: "mint-a", owner: "wallet-a", state: "initialized", tokenAmount: { amount: "100", decimals: 6 } } } } } }] : []; throw new Error(method); } };
  const snapshot = await createAccountSnapshot({ client, mints: ["mint-a"], genesisHash: MAINNET_GENESIS_HASH, observedAt: "2026-08-20T00:00:00.000Z" }); const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-account-snapshot-")), filename = path.join(root, "index.json"); const store = new IndexStore(filename); await store.load(); store.applyAccountSnapshot(snapshot); await store.save();
  const reloaded = new IndexStore(filename); await reloaded.load(); const holders = reloaded.holders("mint-a"); assert.equal(holders.complete, true); assert.equal(holders.coverage, "finalized_program_account_snapshot_plus_changes"); assert.equal(holders.observedRaw, "100"); assert.equal(reloaded.state.mints["mint-a"].mintInfo.supply, "100");
  const holderObservedAt = Date.parse(snapshot.observedAt); assert.equal(reloaded.holders("mint-a", 100, 120_000, holderObservedAt + 60_000).complete, true); const staleHolders = reloaded.holders("mint-a", 100, 120_000, holderObservedAt + 180_000); assert.equal(staleHolders.complete, false); assert.equal(staleHolders.snapshotComplete, true); assert.equal(staleHolders.coverage, "stale_finalized_snapshot_plus_observed_changes"); const futureHolders = reloaded.holders("mint-a", 100, 120_000, holderObservedAt - 1); assert.equal(futureHolders.freshness.observedInFuture, true);
  const security = reloaded.tokenSecurity("mint-a"); assert.equal(security.assessable, true); assert.equal(security.evidence.slot, 500); assert.deepEqual(security.findings, []); assert.equal(security.safeForAutomation, false);
  const observedAt = Date.parse(snapshot.observedAt); assert.equal(reloaded.tokenSecurity("mint-a", 120_000, observedAt + 60_000).assessable, true); const staleSecurity = reloaded.tokenSecurity("mint-a", 120_000, observedAt + 180_000); assert.equal(staleSecurity.assessable, false); assert.ok(staleSecurity.missing.includes("fresh_finalized_mint_account_snapshot")); const futureSecurity = reloaded.tokenSecurity("mint-a", 120_000, observedAt - 1); assert.equal(futureSecurity.freshness.observedInFuture, true); assert.ok(futureSecurity.missing.includes("security_snapshot_clock_skew"));
  assert.equal(reloaded.evidence("mint-a", 120_000, observedAt + 60_000).missing.includes("mint_authority"), false);
  reloaded.applyAccountSnapshot({ ...snapshot, slot: 499, mints: [{ ...snapshot.mints[0], mintInfo: { ...snapshot.mints[0].mintInfo, mintAuthority: "stale-authority" }, accounts: [] }] });
  assert.equal(reloaded.state.holderSnapshots["mint-a"].slot, 500); assert.equal(reloaded.tokenSecurity("mint-a").evidence.mintAuthority, null);
  reloaded.applyAccountSnapshot({ ...snapshot, slot: 501, mints: [{ ...snapshot.mints[0], accounts: [] }] }); assert.equal(reloaded.tokenAccount("token-a"), null); assert.equal(reloaded.holders("mint-a").observedRaw, "0");
  reloaded.state.tokenAccounts["newer-token-a"] = { mint: "mint-a", owner: "wallet-a", programId: "token", decimals: 6, amountRaw: "7", lastSlot: 503, lastSignature: "newer", closed: false }; reloaded.state.holderSnapshots["mint-a"] = { ...reloaded.state.holderSnapshots["mint-a"], accounts: [{ tokenAccount: "newer-token-a", owner: "wallet-a", programId: "token", decimals: 6, amountRaw: "7" }] }; reloaded.applyAccountSnapshot({ ...snapshot, slot: 502, mints: [{ ...snapshot.mints[0], accounts: [] }] }); assert.equal(reloaded.tokenAccount("newer-token-a").amountRaw, "7");
  assert.throws(() => reloaded.applyAccountSnapshot({ ...snapshot, genesisHash: "devnet" }), /invalid finalized mainnet account snapshot/);
  assert.throws(() => reloaded.applyAccountSnapshot({ ...snapshot, observedAt: "invalid" }), /invalid finalized mainnet account snapshot/);
});

test("finalized Raydium CLMM snapshots decode canonical pool state and vault balances", async () => {
  const encode58 = (bytes) => { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let out = ""; while (value) { out = alphabet[Number(value % 58n)] + out; value /= 58n; } for (const byte of bytes) { if (byte) break; out = `1${out}`; } return out || "1"; };
  const writeU128 = (buffer, value, offset) => { buffer.writeBigUInt64LE(value & ((1n << 64n) - 1n), offset); buffer.writeBigUInt64LE(value >> 64n, offset + 8); };
  const data = Buffer.alloc(1_544); crypto.createHash("sha256").update("account:PoolState").digest().copy(data, 0, 0, 8); data[8] = 255; const mint0Bytes = Buffer.alloc(32, 1), mint1Bytes = Buffer.alloc(32, 2), vault0Bytes = Buffer.alloc(32, 3), vault1Bytes = Buffer.alloc(32, 4); mint0Bytes.copy(data, 73); mint1Bytes.copy(data, 105); vault0Bytes.copy(data, 137); vault1Bytes.copy(data, 169); data[233] = 6; data[234] = 9; data.writeUInt16LE(64, 235); writeU128(data, (1n << 90n) + 7n, 237); writeU128(data, (1n << 80n) + 5n, 253); data.writeInt32LE(-42, 269); data.writeBigUInt64LE(1n << 63n, 904 + (7 * 8));
  const mint0 = encode58(mint0Bytes), mint1 = encode58(mint1Bytes), vault0 = encode58(vault0Bytes), vault1 = encode58(vault1Bytes), account = { owner: RAYDIUM_CLMM_PROGRAM, data: [data.toString("base64"), "base64"] };
  const decodedPool = decodeClmmPoolAccount("pool-a", account); assert.equal(decodedPool.tickSpacing, 64); assert.deepEqual(decodedPool.defaultTickArrayBitmap.initializedTickArrayStartIndexes, [-3_840]); assert.equal(decodedPool.defaultTickArrayBitmap.rawHex.length, 256); assert.throws(() => decodeClmmPoolAccount("pool-a", { ...account, owner: "untrusted" }), /unexpected owner/);
  const client = { call: async (method, params) => { assert.equal(method, "getMultipleAccounts"); if (params[1].encoding === "base64") return { context: { slot: 500 }, value: [account] }; assert.equal(params[1].minContextSlot, 500); return { context: { slot: 501 }, value: [{ data: { parsed: { info: { mint: mint0, tokenAmount: { amount: "1000" } } } } }, { data: { parsed: { info: { mint: mint1, tokenAmount: { amount: "2000" } } } } }] }; } };
  const snapshot = await createClmmPoolSnapshot({ client, pools: ["pool-a"], genesisHash: MAINNET_GENESIS_HASH, observedAt: "2026-08-21T00:00:00.000Z" }); assert.equal(snapshot.stateSlot, 500); assert.equal(snapshot.balanceSlot, 501); assert.equal(snapshot.pools[0].tokenVault0, vault0); assert.equal(snapshot.pools[0].tokenVault1, vault1); assert.equal(snapshot.pools[0].vault0AmountRaw, "1000"); assert.equal(snapshot.pools[0].vault1AmountRaw, "2000"); assert.deepEqual({ tickArraySlot: snapshot.pools[0].tickArraySlot, tickArrays: snapshot.pools[0].tickArrays }, { tickArraySlot: null, tickArrays: [] });
  const store = new IndexStore("unused"); await store.load(); store.applyPoolSnapshot(snapshot); const pool = store.pool("pool-a").summary; assert.equal(pool.pairIdentitySource, "protocol_account"); assert.equal(pool.accountSnapshot.commitment, "finalized"); assert.equal(pool.accountSnapshot.tick, -42); assert.equal(store.stats().poolSnapshots, 1); store.rebuildAggregates(); assert.equal(store.pool("pool-a").summary.accountSnapshot.balanceSlot, 501);
  const freshRisk = store.poolRisk("pool-a", 120_000, Date.parse(snapshot.observedAt) + 60_000); assert.equal(freshRisk.liquidity.assessable, true); assert.equal(freshRisk.liquidity.stale, false); assert.equal(freshRisk.liquidity.ageMs, 60_000);
  const staleRisk = store.poolRisk("pool-a", 120_000, Date.parse(snapshot.observedAt) + 180_000); assert.equal(staleRisk.liquidity.assessable, false); assert.equal(staleRisk.liquidity.stale, true); assert.ok(staleRisk.blockers.includes("liquidity_state_stale"));
  const futureRisk = store.poolRisk("pool-a", 120_000, Date.parse(snapshot.observedAt) - 1); assert.equal(futureRisk.liquidity.assessable, false); assert.equal(futureRisk.liquidity.observedInFuture, true); assert.equal(futureRisk.liquidity.ageMs, -1);
  store.applyPoolSnapshot({ ...snapshot, stateSlot: 499, balanceSlot: 499, pools: [{ ...snapshot.pools[0], vault0AmountRaw: "1" }] }); assert.equal(store.pool("pool-a").summary.accountSnapshot.vault0AmountRaw, "1000");
  store.applyPoolSnapshot({ ...snapshot, stateSlot: 499, balanceSlot: 501, pools: [{ ...snapshot.pools[0], vault0AmountRaw: "1" }] }); assert.equal(store.pool("pool-a").summary.accountSnapshot.vault0AmountRaw, "1000");
  assert.throws(() => store.applyPoolSnapshot({ ...snapshot, observedAt: "invalid" }), /invalid finalized mainnet CLMM pool snapshot/);
  assert.throws(() => store.applyPoolSnapshot({ ...snapshot, genesisHash: "devnet" }), /invalid finalized mainnet CLMM pool snapshot/);
});

test("finalized Raydium CLMM snapshots bind canonical tick-array headers to their pool", async () => {
  const encode58 = (bytes) => { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let out = ""; while (value) { out = alphabet[Number(value % 58n)] + out; value /= 58n; } for (const byte of bytes) { if (byte) break; out = `1${out}`; } return out || "1"; };
  const poolBytes = Buffer.alloc(32, 9), pool = encode58(poolBytes), data = Buffer.alloc(10_240); crypto.createHash("sha256").update("account:TickArrayState").digest().copy(data, 0, 0, 8); poolBytes.copy(data, 8); data.writeInt32LE(-3_840, 40); const tickOffset = 44 + (2 * 168); data.writeInt32LE(-3_712, tickOffset); data.writeBigUInt64LE((1n << 64n) - 5n, tickOffset + 4); data.writeBigUInt64LE((1n << 64n) - 1n, tickOffset + 12); data.writeBigUInt64LE(9n, tickOffset + 20); data.writeBigUInt64LE(11n, tickOffset + 36); data.writeBigUInt64LE(12n, tickOffset + 52); data.writeBigUInt64LE(13n, tickOffset + 68); data[10_124] = 1; data.writeBigUInt64LE(77n, 10_125); const account = { owner: RAYDIUM_CLMM_PROGRAM, data: [data.toString("base64"), "base64"] };
  const decoded = decodeClmmTickArrayAccount("ticks-a", account, 64); assert.deepEqual({ pool: decoded.pool, startTickIndex: decoded.startTickIndex, initializedTickCount: decoded.initializedTickCount, recentEpoch: decoded.recentEpoch }, { pool, startTickIndex: -3_840, initializedTickCount: 1, recentEpoch: "77" }); assert.deepEqual(decoded.initializedTicks, [{ tick: -3_712, liquidityNetRaw: "-5", liquidityGrossRaw: "9", feeGrowthOutside0X64: "11", feeGrowthOutside1X64: "12", rewardGrowthsOutsideX64: ["13", "0", "0"] }]); assert.match(decoded.rawPayloadHash, /^[0-9a-f]{64}$/);
  const inconsistent = Buffer.from(data); inconsistent.writeInt32LE(-3_711, tickOffset); assert.throws(() => decodeClmmTickArrayAccount("ticks-a", { ...account, data: [inconsistent.toString("base64"), "base64"] }, 64), /inconsistent initialized tick/); const mismatched = Buffer.from(data); mismatched[10_124] = 0; assert.throws(() => decodeClmmTickArrayAccount("ticks-a", { ...account, data: [mismatched.toString("base64"), "base64"] }, 64), /count mismatch/);
  data[10_124] = 61; assert.throws(() => decodeClmmTickArrayAccount("ticks-a", { ...account, data: [data.toString("base64"), "base64"] }), /invalid initialized tick count/);
  assert.deepEqual(parseClmmTickArrayMap(JSON.stringify({ [pool]: ["ticks-a"] }), [pool]), { [pool]: ["ticks-a"] }); assert.throws(() => parseClmmTickArrayMap(JSON.stringify({ unknown: ["ticks-a"] }), [pool]), /unknown pool/); assert.throws(() => parseClmmTickArrayMap(JSON.stringify({ [pool]: ["ticks-a", "ticks-a"] }), [pool]), /unique/);
});

test("Raydium CLMM overflow bitmap extensions preserve pool-bound raw segments", () => {
  const encode58 = (bytes) => { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let out = ""; while (value) { out = alphabet[Number(value % 58n)] + out; value /= 58n; } for (const byte of bytes) { if (byte) break; out = `1${out}`; } return out || "1"; }, poolBytes = Buffer.alloc(32, 8), pool = encode58(poolBytes), data = Buffer.alloc(1_832); crypto.createHash("sha256").update("account:TickArrayBitmapExtension").digest().copy(data, 0, 0, 8); poolBytes.copy(data, 8); data.writeBigUInt64LE(5n, 40); data.writeBigUInt64LE(7n, 40 + (14 * 64)); const account = { owner: RAYDIUM_CLMM_PROGRAM, data: [data.toString("base64"), "base64"] }, decoded = decodeClmmBitmapExtensionAccount("extension-a", account);
  assert.equal(decoded.pool, pool); assert.equal(decoded.positiveBitmapSegments.length, 14); assert.match(decoded.positiveBitmapSegments[0], /^0500000000000000/); assert.match(decoded.negativeBitmapSegments[0], /^0700000000000000/); assert.match(decoded.rawPayloadHash, /^[0-9a-f]{64}$/); assert.deepEqual(parseClmmBitmapExtensionMap(JSON.stringify({ [pool]: "extension-a" }), [pool]), { [pool]: "extension-a" }); assert.throws(() => parseClmmBitmapExtensionMap(JSON.stringify({ unknown: "extension-a" }), [pool]), /unknown pool/);
});

test("token security blocks authority and hazardous Token-2022 extension evidence", async () => {
  const store = new IndexStore("unused"); await store.load(); store.applyAccountSnapshot({ schemaVersion: 1, chain: "solana", genesisHash: MAINNET_GENESIS_HASH, commitment: "finalized", slot: 700, observedAt: "2026-08-20T00:00:00.000Z", mints: [{ mint: "mint-risk", mintInfo: { mintAuthority: "authority", freezeAuthority: null, extensions: [{ extension: "transferHook" }, { extension: "transferFeeConfig" }] }, accounts: [] }] });
  const security = store.tokenSecurity("mint-risk"); assert.equal(security.assessable, true); assert.deepEqual(security.findings.map((row) => row.code), ["mint_authority_present", "token_2022_extension", "transfer_fee_extension"]); assert.ok(security.findings.every((row) => row.blocksAutomation));
});

test("snapshot batches validate atomically before mutating canonical state", async () => {
  const store = new IndexStore("unused"); await store.load();
  const accountEnvelope = { schemaVersion: 1, chain: "solana", genesisHash: MAINNET_GENESIS_HASH, commitment: "finalized", slot: 800, observedAt: "2026-08-21T00:00:00.000Z" };
  assert.throws(() => store.applyAccountSnapshot({ ...accountEnvelope, mints: [{ mint: "valid", mintInfo: {}, accounts: [{ tokenAccount: "account-a", owner: "wallet", programId: "token", decimals: 6, amountRaw: "1" }] }, { mint: "invalid", mintInfo: {}, accounts: [{ tokenAccount: "account-b", decimals: 999, amountRaw: "1" }] }] }), /invalid token account snapshot row/);
  assert.equal(store.state.holderSnapshots.valid, undefined); assert.equal(store.state.tokenAccounts["account-a"], undefined);
  const poolRow = { address: "pool-a", programId: RAYDIUM_CLMM_PROGRAM, tokenMint0: "mint-a", tokenMint1: "mint-b", tokenVault0: "vault-a", tokenVault1: "vault-b", vault0AmountRaw: "1", vault1AmountRaw: "2", liquidityRaw: "3", sqrtPriceX64: "4", tick: 0, tickSpacing: 1 };
  const poolEnvelope = { ...accountEnvelope, type: "raydium_clmm_pool_snapshot", stateSlot: 800, balanceSlot: 801 };
  assert.throws(() => store.applyPoolSnapshot({ ...poolEnvelope, pools: [poolRow, { ...poolRow, address: "pool-b", liquidityRaw: "invalid" }] }), /invalid CLMM pool snapshot row/);
  assert.throws(() => store.applyPoolSnapshot({ ...poolEnvelope, pools: [{ ...poolRow, tickArraySlot: 800, tickArrays: [{ address: "ticks-a", pool: "wrong-pool", startTickIndex: 0, initializedTickCount: 1, recentEpoch: "1", rawPayloadHash: "a".repeat(64) }] }] }), /invalid CLMM tick array snapshot row/);
  const tickEvidence = { address: "ticks-a", pool: "pool-a", startTickIndex: 0, initializedTickCount: 1, initializedTicks: [{ tick: 61, liquidityNetRaw: "-1", liquidityGrossRaw: "1", feeGrowthOutside0X64: "0", feeGrowthOutside1X64: "0", rewardGrowthsOutsideX64: ["0", "0", "0"] }], recentEpoch: "1", rawPayloadHash: "a".repeat(64) }; assert.throws(() => store.applyPoolSnapshot({ ...poolEnvelope, pools: [{ ...poolRow, tickArraySlot: 800, tickArrays: [tickEvidence] }] }), /invalid CLMM initialized tick snapshot row/);
  const falseBitmap = { bitCount: 1024, minStartTickIndex: -30_720, maxStartTickIndexExclusive: 30_720, initializedTickArrayStartIndexes: [0], rawHex: "00".repeat(128) }; assert.throws(() => store.applyPoolSnapshot({ ...poolEnvelope, pools: [{ ...poolRow, defaultTickArrayBitmap: falseBitmap }] }), /invalid CLMM pool snapshot row/);
  const falseExtension = { address: "extension-a", pool: "wrong-pool", segmentBits: 512, positiveBitmapSegments: Array(14).fill("00".repeat(64)), negativeBitmapSegments: Array(14).fill("00".repeat(64)), rawPayloadHash: "a".repeat(64) }; assert.throws(() => store.applyPoolSnapshot({ ...poolEnvelope, pools: [{ ...poolRow, bitmapExtension: falseExtension, bitmapExtensionSlot: 800 }] }), /invalid CLMM pool snapshot row/);
  assert.equal(store.state.poolSnapshots["pool-a"], undefined); assert.equal(store.state.pools["pool-a"], undefined);
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

test("time retention follows indexed time and preserves canonical snapshot authority", async () => {
  const store = new IndexStore("unused", 1000, 3600); await store.load(); store.applyAccountSnapshot({ schemaVersion: 1, chain: "solana", commitment: "finalized", slot: 50, observedAt: "2026-08-20T00:00:00.000Z", genesisHash: MAINNET_GENESIS_HASH, mints: [{ mint: "mint-a", mintInfo: { mintAuthority: null, freezeAuthority: null, extensions: [] }, accounts: [] }] }); const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block); store.apply({ ...block, slot: 200, blockhash: "block-200", previousBlockhash: "unknown", parentSlot: 199, blockTime: block.blockTime + 7200, transactions: [], instructions: [], transfers: [], balanceChanges: [], swaps: [] });
  assert.equal(store.state.blocks["100"], undefined); assert.ok(store.state.blocks["200"]); assert.equal(store.tokenSecurity("mint-a").assessable, true); assert.equal(store.state.mints["mint-a"].authoritySourceSlot, 50);
});

test("checkpoint fingerprints detect same-sized content replacement", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-fingerprint-")); const inbox = path.join(root, "inbox"); await fs.mkdir(inbox);
  const firstBlock = JSON.parse(await fs.readFile(fixture, "utf8")); firstBlock.dexEvents = []; const first = JSON.stringify(firstBlock); const second = JSON.stringify({ ...firstBlock, blockhash: "clock-100" });
  assert.equal(Buffer.byteLength(first), Buffer.byteLength(second)); const filename = path.join(inbox, "100.json"); await fs.writeFile(filename, first);
  const store = new IndexStore(path.join(root, "data.json"), 1000); const config = { inbox, dataFile: path.join(root, "data.json"), maxTransactions: 1000 };
  await indexInbox(config, store); await fs.writeFile(filename, second); const result = await indexInbox(config, store);
  assert.equal(result.files, 1); assert.equal(store.state.blocks["100"].blockhash, "clock-100");
});

test("raw inbox retention is dry-run-first and deletes only unchanged durable files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-inbox-retention-")), inbox = path.join(root, "inbox"), dataFile = path.join(root, "index.json"), manifestFile = path.join(root, "manifest.json"), archiveReceiptFile = path.join(root, "receipt.json"); await fs.mkdir(inbox); const old = path.join(inbox, "old.json"), changed = path.join(inbox, "changed.json"), pending = path.join(inbox, "pending.json"); await fs.writeFile(old, "durable"); await fs.writeFile(changed, "changed-now"); await fs.writeFile(pending, "pending"); const hash = (value) => crypto.createHash("sha256").update(value).digest("hex"); await fs.writeFile(dataFile, JSON.stringify({ processedFiles: { "old.json": { fingerprint: hash("durable"), parserVersion: 2 }, "changed.json": { fingerprint: hash("changed-before"), parserVersion: 2 } }, deadLetters: [] })); const past = new Date("2020-01-01T00:00:00Z"); await Promise.all([fs.utimes(old, past, past), fs.utimes(changed, past, past), fs.utimes(pending, past, past)]);
  const blocked = await retainInbox({ inbox, dataFile, archiveReceiptFile, retentionSeconds: 3600, now: Date.parse("2020-01-02T00:00:00Z"), confirmDelete: true }); assert.deepEqual(blocked.deleted, []); assert.equal(blocked.retained.unarchived, 1); assert.equal(blocked.archiveReceiptValid, false);
  await createInboxManifest({ inbox, output: manifestFile, archiveId: "20200101T000000Z" }); await completeArchiveReceipt({ manifestFile, output: archiveReceiptFile, completedAt: "2020-01-01T01:00:00.000Z" });
  const preview = await retainInbox({ inbox, dataFile, archiveReceiptFile, retentionSeconds: 3600, now: Date.parse("2020-01-02T00:00:00Z") }); assert.deepEqual(preview.eligible, ["old.json"]); assert.equal(preview.deleted.length, 0); assert.equal(preview.retained.changed, 1); assert.equal(preview.retained.uncheckpointed, 1); const applied = await retainInbox({ inbox, dataFile, archiveReceiptFile, retentionSeconds: 3600, now: Date.parse("2020-01-02T00:00:00Z"), confirmDelete: true }); assert.deepEqual(applied.deleted, ["old.json"]); await assert.rejects(fs.access(old)); assert.doesNotReject(fs.access(changed));
});

test("self-hosted inbox archive verifies compressed copies before installing its receipt", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-inbox-archive-")), inbox = path.join(root, "inbox"), archiveRoot = path.join(root, "archive"), receiptFile = path.join(root, "data", "receipt.json"); await fs.mkdir(inbox); await fs.writeFile(path.join(inbox, "10.json"), "raw-block-one"); await fs.writeFile(path.join(inbox, "11.ndjson"), "raw-block-two\n"); const result = await archiveInbox({ inbox, archiveRoot, receiptFile, archiveId: "20260821T000000Z" }); assert.equal(result.files, 2); assert.equal(gunzipSync(await fs.readFile(path.join(result.archiveDirectory, "10.json.gz"))).toString(), "raw-block-one"); assert.equal(gunzipSync(await fs.readFile(path.join(result.archiveDirectory, "11.ndjson.gz"))).toString(), "raw-block-two\n"); const receipt = JSON.parse(await fs.readFile(receiptFile, "utf8")); assert.equal(receipt.status, "verified_local"); assert.equal(receipt.storage, "self-hosted"); assert.equal(receipt.archiveId, "20260821T000000Z"); assert.equal(Object.keys(receipt.files).length, 2); assert.equal(await fs.readFile(path.join(inbox, "10.json"), "utf8"), "raw-block-one");
});

test("persists bounded dead-letter evidence for invalid inbox payloads", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-dead-letter-")); const inbox = path.join(root, "inbox"); await fs.mkdir(inbox); await fs.writeFile(path.join(inbox, "bad.json"), "not-json"); const dataFile = path.join(root, "index.json"); const store = new IndexStore(dataFile);
  const result = await indexInbox({ inbox, dataFile, maxTransactions: 1000 }, store); assert.equal(result.errors.length, 1); assert.equal(store.state.deadLetters.length, 1); assert.match(store.state.deadLetters[0].fingerprint, /^[0-9a-f]{64}$/);
  const persisted = JSON.parse(await fs.readFile(dataFile, "utf8")); assert.equal(persisted.deadLetters[0].attempts, 1);
});

test("successful exact-fingerprint checkpoints resolve stale dead letters and later failures reopen them", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-dead-letter-resolution-")), inbox = path.join(root, "inbox"), dataFile = path.join(root, "index.json"); await fs.mkdir(inbox); const filename = path.join(inbox, "100.json"), content = await fs.readFile(fixture), fingerprint = crypto.createHash("sha256").update(content).digest("hex"); await fs.writeFile(filename, content);
  const seed = new IndexStore(dataFile); await seed.load(); seed.state.processedFiles["100.json"] = { fingerprint, parserVersion: 2 }; seed.recordDeadLetter("100.json", fingerprint, "old parser rejected input"); await seed.save();
  const store = new IndexStore(dataFile); const result = await indexInbox({ inbox, dataFile, maxTransactions: 1000 }, store); assert.equal(result.skippedFiles, 1); assert.equal(result.resolvedDeadLetters, 1); assert.equal(store.state.deadLetters[0].resolved, true); assert.equal(store.state.deadLetters[0].resolution, "parser_v2_checkpoint"); assert.ok(store.state.deadLetters[0].resolvedAt);
  store.recordDeadLetter("100.json", fingerprint, "decoder regression"); assert.equal(store.state.deadLetters[0].resolved, false); assert.equal(store.state.deadLetters[0].resolution, undefined); assert.equal(store.state.deadLetters[0].attempts, 2);
});

test("dead-letter reconciliation command is dry-run-first and ignores nonmatching checkpoints", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-dead-letter-command-")), dataFile = path.join(root, "index.json"), store = new IndexStore(dataFile); await store.load(); store.state.processedFiles = { "fixed.json": { fingerprint: "same", parserVersion: 2 }, "old-parser.json": { fingerprint: "same", parserVersion: 1 }, "changed.json": { fingerprint: "new", parserVersion: 2 } }; store.recordDeadLetter("fixed.json", "same", "old error"); store.recordDeadLetter("old-parser.json", "same", "old error"); store.recordDeadLetter("changed.json", "old", "old error"); await store.save();
  const preview = await reconcileDeadLetters({ dataFile }); assert.equal(preview.dryRun, true); assert.deepEqual(preview.eligible.map((row) => row.filename), ["fixed.json"]); assert.equal(preview.resolved, 0); assert.equal(preview.unresolvedRemaining, 3); assert.equal(JSON.parse(await fs.readFile(dataFile, "utf8")).deadLetters[0].resolved, false);
  const applied = await reconcileDeadLetters({ dataFile, confirm: true }); assert.equal(applied.resolved, 1); assert.equal(applied.unresolvedRemaining, 2); const persisted = JSON.parse(await fs.readFile(dataFile, "utf8")); assert.equal(persisted.deadLetters[0].resolved, true); assert.equal(persisted.deadLetters[1].resolved, false); assert.equal(persisted.deadLetters[2].resolved, false);
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

test("health rejects future canonical block timestamps", async () => {
  const store = new IndexStore("unused"); await store.load(); const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block); store.state.updatedAt = new Date(block.blockTime * 1_000).toISOString(); const result = store.health(120_000, block.blockTime * 1_000 - 1); assert.equal(result.healthy, false); assert.equal(result.status, "clock_skew"); assert.equal(result.reason, "latest_block_time_is_in_future"); assert.equal(result.ageMs, -1);
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

test("external RPC pool enforces providers, fails over, and never exposes credential URLs", async () => {
  assert.throws(() => providerPoolFromEnv({}), /HELIUS_RPC_URL and ALCHEMY_RPC_URL/); assert.throws(() => validateProviderUrl("helius", "https://example.com/key"), /invalid helius/);
  const calls = [], fetchImpl = async (endpoint) => { calls.push(new URL(endpoint).hostname); if (endpoint.includes("helius")) throw new Error("offline"); return { ok: true, json: async () => ({ result: MAINNET_GENESIS_HASH }) }; }, pool = new ExternalRpcPool([{ name: "helius", endpoint: "https://mainnet.helius-rpc.com/?api-key=secret" }, { name: "alchemy", endpoint: "https://solana-mainnet.g.alchemy.com/v2/secret" }], { fetchImpl });
  assert.equal(await pool.assertGenesis(), MAINNET_GENESIS_HASH); assert.deepEqual(calls, ["mainnet.helius-rpc.com", "solana-mainnet.g.alchemy.com"]); assert.equal(pool.provenanceSource, "external-rpc-alchemy"); assert.equal("endpoint" in pool.telemetry()[0], false); assert.equal(JSON.stringify(pool.telemetry()).includes("secret"), false);
});

test("external RPC pool honors bounded Retry-After without retrying a limited primary", async () => {
  let now = 1_000, heliusCalls = 0; const fetchImpl = async (endpoint) => endpoint.includes("helius") ? (heliusCalls++, { ok: false, status: 429, headers: { get: () => "120" } }) : { ok: true, json: async () => ({ result: "ok" }) };
  const pool = new ExternalRpcPool([{ name: "helius", endpoint: "https://mainnet.helius-rpc.com/?api-key=secret" }, { name: "alchemy", endpoint: "https://solana-mainnet.g.alchemy.com/v2/secret" }], { fetchImpl, now: () => now });
  assert.equal(await pool.call("getHealth"), "ok"); assert.equal(await pool.call("getHealth"), "ok"); assert.equal(heliusCalls, 1); assert.equal(pool.telemetry()[0].openUntil, 121_000); now = 121_001; await pool.call("getHealth"); assert.equal(heliusCalls, 2);
});

test("mainnet verification rejects a private validator genesis", async () => {
  const client = Object.create(LocalValidatorClient.prototype); client.call = async () => "private-development-genesis";
  await assert.rejects(() => client.assertGenesis(MAINNET_GENESIS_HASH), /validator genesis mismatch/);
});

test("validator stream accepts only loopback WebSocket endpoints", () => {
  assert.equal(validateLocalWsUrl("ws://127.0.0.1:8900"), "ws://127.0.0.1:8900/");
  assert.throws(() => validateLocalWsUrl("wss://example.com"), /must use ws/); assert.throws(() => validateLocalWsUrl("ws://192.168.1.2:8900"), /non-loopback/);
});

test("verified stream refuses an existing inbox with unknown genesis", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-network-boundary-")); const inbox = path.join(root, "inbox"); await fs.mkdir(inbox); await fs.writeFile(path.join(inbox, "1.json"), "{}\n");
  const stream = new LocalValidatorStream({ rpcClient: { assertGenesis: async () => MAINNET_GENESIS_HASH }, inbox, statusFile: path.join(root, "status.json"), WebSocketClass: class {} });
  await assert.rejects(() => stream.initializeAndConnect(), /inbox with unknown genesis/);
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
  assert.deepEqual({ commitment: status.commitment, lagSlots: status.lagSlots, durableSkippedSlots: status.durableSkippedSlots, failures: status.consecutiveFailures, error: status.lastError }, { commitment: "finalized", lagSlots: 1, durableSkippedSlots: [11], failures: 0, error: null });
});

test("exporter failure evidence is durable, redacted, and preserves the last success", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-exporter-failure-")), statusFile = path.join(root, "status.json");
  await fs.writeFile(statusFile, JSON.stringify({ version: 2, source: "external-rpc-alchemy", commitment: "finalized", observedAt: "2026-08-20T00:00:00.000Z", cursor: 42, consecutiveFailures: 1 }));
  const status = await recordExporterFailure(statusFile, new Error("request failed at https://provider.invalid/?api-key=secret"), { source: "external-rpc-pool", attemptedAt: "2026-08-21T00:00:00.000Z" });
  assert.equal(status.cursor, 42); assert.equal(status.observedAt, "2026-08-20T00:00:00.000Z"); assert.equal(status.lastAttemptAt, "2026-08-21T00:00:00.000Z"); assert.equal(status.consecutiveFailures, 2); assert.equal(status.lastError, "request failed at [redacted-url]"); assert.equal(JSON.stringify(status).includes("secret"), false);
  assert.deepEqual(JSON.parse(await fs.readFile(statusFile, "utf8")), status);
});

test("exporter health probe fails closed for missing, stale, and failed durable status", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-exporter-health-")), statusFile = path.join(root, "status.json"), now = Date.parse("2026-08-21T00:00:00.000Z"); assert.equal((await exporterHealthCheck(statusFile, 120_000, now)).reason, "status_unavailable"); await fs.writeFile(statusFile, JSON.stringify({ source: "external-rpc-alchemy", commitment: "finalized", cursor: 42, lagSlots: 0, observedAt: "2026-08-20T00:00:00.000Z" })); assert.equal((await exporterHealthCheck(statusFile, 120_000, now)).reason, "exporter_stale"); await fs.writeFile(statusFile, JSON.stringify({ source: "external-rpc-helius", commitment: "finalized", cursor: 43, lagSlots: 0, observedAt: "2026-08-20T23:59:30.000Z", consecutiveFailures: 1 })); assert.equal((await exporterHealthCheck(statusFile, 120_000, now)).reason, "exporter_failure"); await fs.writeFile(statusFile, JSON.stringify({ source: "external-rpc-helius", commitment: "finalized", cursor: 44, lagSlots: 0, observedAt: "2026-08-20T23:59:30.000Z", consecutiveFailures: 0 })); assert.equal((await exporterHealthCheck(statusFile, 120_000, now)).healthy, true);
  await fs.writeFile(statusFile, JSON.stringify({ source: "external-rpc-helius", commitment: "finalized", cursor: 45, observedAt: "2026-08-21T00:00:00.001Z" })); const future = await exporterHealthCheck(statusFile, 120_000, now); assert.equal(future.healthy, false); assert.equal(future.reason, "observed_at_in_future"); assert.equal(future.ageMs, -1);
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

test("Prometheus endpoint exposes fail-closed SLO signals", async (t) => {
  const store = new IndexStore("unused"); await store.load(); const server = createServer({ staleAfterMs: 120_000 }, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/metrics`), body = await response.text(); assert.equal(response.status, 200); assert.match(response.headers.get("content-type"), /text\/plain/); assert.match(body, /terminal_dex_index_healthy 0/); assert.match(body, /terminal_dex_dead_letters 0/); assert.match(body, /terminal_dex_http_requests_total/);
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

test("decodes Raydium CLMM SwapEvent with exact price state and explicit unavailable reserves", async () => {
  const encode58 = (bytes) => { const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let value = 0n; for (const byte of bytes) value = value * 256n + BigInt(byte); let out = ""; while (value) { out = alphabet[Number(value % 58n)] + out; value /= 58n; } for (const byte of bytes) { if (byte) break; out = `1${out}`; } return out || "1"; };
  const writeU128 = (buffer, value, offset) => { buffer.writeBigUInt64LE(value & ((1n << 64n) - 1n), offset); buffer.writeBigUInt64LE(value >> 64n, offset + 8); };
  const data = Buffer.alloc(221); crypto.createHash("sha256").update("event:SwapEvent").digest().copy(data, 0, 0, 8);
  const poolBytes = Buffer.alloc(32, 1), userBytes = Buffer.alloc(32, 2), account0Bytes = Buffer.alloc(32, 3), account1Bytes = Buffer.alloc(32, 4);
  poolBytes.copy(data, 8); userBytes.copy(data, 40); account0Bytes.copy(data, 72); account1Bytes.copy(data, 104);
  data.writeBigUInt64LE(1_000n, 136); data.writeBigUInt64LE(5n, 144); data.writeBigUInt64LE(1_900n, 152); data.writeBigUInt64LE(7n, 160); data[168] = 1;
  const sqrtPriceX64 = (1n << 80n) + 5n, liquidity = (1n << 96n) + 9n; writeU128(data, sqrtPriceX64, 169); writeU128(data, liquidity, 185); data.writeInt32LE(-123, 201); data.writeBigUInt64LE(3n, 205); data.writeBigUInt64LE(4n, 213);
  const program = "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", account0 = encode58(account0Bytes), account1 = encode58(account1Bytes); const logs = [`Program ${program} invoke [1]`, `Program data: ${data.toString("base64")}`, `Program ${program} success`];
  const entry = { transaction: { message: { accountKeys: [account0, account1], instructions: [] } }, meta: { err: null, logMessages: logs, preTokenBalances: [{ accountIndex: 0, mint: "mint-0", uiTokenAmount: { decimals: 6 } }, { accountIndex: 1, mint: "mint-1", uiTokenAmount: { decimals: 9 } }], postTokenBalances: [] } };
  const [event] = decodeRaydiumClmmSwapEvents(entry, "clmm-signature");
  assert.deepEqual({ protocol: event.protocol, pool: event.pool, user: event.user, inputMint: event.inputMint, outputMint: event.outputMint, inputAmountRaw: event.inputAmountRaw, outputAmountRaw: event.outputAmountRaw, inputTransferFeeRaw: event.inputTransferFeeRaw, outputTransferFeeRaw: event.outputTransferFeeRaw, tradeFeeRaw: event.tradeFeeRaw, sqrtPriceX64: event.sqrtPriceX64, liquidityRaw: event.liquidityRaw, tick: event.tick, reserveTiming: event.reserveTiming }, { protocol: "raydium-clmm", pool: encode58(poolBytes), user: encode58(userBytes), inputMint: "mint-0", outputMint: "mint-1", inputAmountRaw: "1000", outputAmountRaw: "1900", inputTransferFeeRaw: "5", outputTransferFeeRaw: "7", tradeFeeRaw: "3", sqrtPriceX64: sqrtPriceX64.toString(), liquidityRaw: liquidity.toString(), tick: -123, reserveTiming: "unavailable" });
  assert.equal(event.inputVaultBeforeRaw, null); assert.equal(event.outputVaultBeforeRaw, null);
  assert.equal(decodeRaydiumClmmSwapEvents({ ...entry, meta: { ...entry.meta, logMessages: [`Program other invoke [1]`, `Program data: ${data.toString("base64")}`, "Program other success"] } }, "clmm-signature").length, 0);
  data[168] = 2; const malformedLogs = [`Program ${program} invoke [1]`, `Program data: ${data.toString("base64")}`, `Program ${program} success`]; assert.equal(decodeRaydiumClmmSwapEvents({ ...entry, meta: { ...entry.meta, logMessages: malformedLogs } }, "clmm-signature").length, 0); data[168] = 1;
  const input = JSON.parse(await fs.readFile(fixture, "utf8")); input.dexEvents = []; input.transactions[0] = { transaction: { signatures: ["clmm-signature"], message: entry.transaction.message }, meta: entry.meta };
  const block = parseBlock(input), swap = block.swaps[0]; assert.equal(swap.registryVersion, 2); assert.equal(swap.decoderVersion, 1); assert.equal(swap.inputVaultBeforeRaw, null); assert.equal(swap.sqrtPriceX64, sqrtPriceX64.toString());
  const store = new IndexStore("unused"); await store.load(); store.apply(block); const summary = store.pool(encode58(poolBytes)).summary; assert.equal(summary.liquidityRaw, liquidity.toString()); assert.equal(summary.tick, -123); assert.equal(summary.reserveTiming, "unavailable");
});

test("rejects malformed or reserve-fabricating Raydium CLMM sidecars", async () => {
  const input = JSON.parse(await fs.readFile(fixture, "utf8")), original = input.dexEvents[0]; input.dexEvents = [{ ...original, protocol: "raydium-clmm", programId: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", venueType: "clmm", user: "user", zeroForOne: true, sqrtPriceX64: "18446744073709551616", liquidityRaw: "1000", tick: 10, inputTransferFeeRaw: "1", outputTransferFeeRaw: "2", inputVaultBeforeRaw: null, outputVaultBeforeRaw: null, reserveTiming: "unavailable" }];
  assert.equal(parseBlock(input).swaps[0].liquidityRaw, "1000");
  input.dexEvents[0].sqrtPriceX64 = "not-an-integer"; assert.throws(() => parseBlock(input), /sqrtPriceX64 must be a decimal u128 string/);
  input.dexEvents[0].sqrtPriceX64 = (1n << 128n).toString(); assert.throws(() => parseBlock(input), /sqrtPriceX64 must be a decimal u128 string/);
  input.dexEvents[0].sqrtPriceX64 = "18446744073709551616"; input.dexEvents[0].tick = 2_147_483_648; assert.throws(() => parseBlock(input), /tick must be an i32/);
  input.dexEvents[0].tick = 10; input.dexEvents[0].inputVaultBeforeRaw = "1"; assert.throws(() => parseBlock(input), /reserves must be explicitly unavailable/);
});

test("indexes canonical blocks while withholding decoded swaps with unknown decimals", async () => {
  const input = JSON.parse(await fs.readFile(fixture, "utf8")); const data = Buffer.alloc(170); crypto.createHash("sha256").update("event:SwapEvent").digest().copy(data, 0, 0, 8); data.fill(1, 8, 40); data.writeBigUInt64LE(100n, 56); data.writeBigUInt64LE(190n, 64); data.fill(2, 89, 121); data.fill(3, 121, 153); const program = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C";
  input.dexEvents = []; input.transactions[0].meta.preTokenBalances = []; input.transactions[0].meta.postTokenBalances = []; input.transactions[0].meta.logMessages = [`Program ${program} invoke [1]`, `Program data: ${data.toString("base64")}`, `Program ${program} success`];
  const block = parseBlock(input); assert.equal(block.transactions.length, 1); assert.equal(block.swaps.length, 0); assert.ok(block.instructions.length > 0);
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

test("pool projection remains monotonic when older swaps arrive after newer swaps", async () => {
  const store = new IndexStore("unused"); await store.load();
  const common = { pool: "pool", protocol: "raydium-clmm", venueType: "clmm", baseMint: "base", quoteMint: "quote", pairIdentitySource: "protocol_event", inputMint: "base", outputMint: "quote", inputDecimals: 6, outputDecimals: 6, inputVaultBeforeRaw: null, outputVaultBeforeRaw: null, reserveTiming: "unavailable" };
  store.state.swaps = [
    { ...common, swapId: "new:1", signature: "new", slot: 20, eventIndex: 1, blockTime: 200, inputAmountRaw: "20", outputAmountRaw: "40", sqrtPriceX64: "200", liquidityRaw: "2000", tick: 2 },
    { ...common, swapId: "old:0", signature: "old", slot: 10, eventIndex: 0, blockTime: 100, inputAmountRaw: "10", outputAmountRaw: "15", sqrtPriceX64: "100", liquidityRaw: "1000", tick: 1 },
  ];
  store.rebuildAggregates(); const summary = store.pool("pool").summary;
  assert.equal(summary.swapCount, 2); assert.equal(summary.lastSlot, 20); assert.equal(summary.lastEventIndex, 1); assert.equal(summary.sqrtPriceX64, "200"); assert.equal(summary.tick, 2); assert.deepEqual(summary.executionPrice, { numeratorRaw: "40", denominatorRaw: "20", inputDecimals: 6, outputDecimals: 6 });
});

test("builds direction-stable exact OHLCV candles without floating point", async (t) => {
  const store = new IndexStore("unused"); await store.load(); const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block); const first = block.swaps[0];
  store.state.swaps.push({ ...first, swapId: "reverse:0", signature: "reverse", eventIndex: 0, inputMint: first.quoteMint, outputMint: first.baseMint, inputAmountRaw: "3000000", outputAmountRaw: "10000000", inputDecimals: first.quoteDecimals, outputDecimals: first.baseDecimals, blockTime: first.blockTime + 1 });
  const candle = store.candles("pool-address", 60, 10, (first.blockTime + 120) * 1_000).data[0];
  assert.deepEqual({ open: candle.open, high: candle.high, low: candle.low, close: candle.close, baseVolumeRaw: candle.baseVolumeRaw, quoteVolumeRaw: candle.quoteVolumeRaw, trades: candle.trades, closed: candle.closed }, { open: { numeratorRaw: "2500000", denominatorRaw: "12500000" }, high: { numeratorRaw: "3000000", denominatorRaw: "10000000" }, low: { numeratorRaw: "2500000", denominatorRaw: "12500000" }, close: { numeratorRaw: "3000000", denominatorRaw: "10000000" }, baseVolumeRaw: "22500000", quoteVolumeRaw: "5500000", trades: 2, closed: true });
  const server = createServer({}, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise((resolve) => server.close(resolve))); const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/api/v1/candles/pool-address?interval=7`)).status, 400); assert.equal((await (await fetch(`${base}/api/v1/candles/pool-address?interval=60`)).json()).exact, true);
});

test("derives exact self-hosted nominal USD references only through fresh finalized USDC paths", async (t) => {
  const usdc = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", sol = "So11111111111111111111111111111111111111112", now = 1_700_000_100_000, common = { provenance: { commitment: "finalized" }, blockTime: 1_700_000_090, eventIndex: 0, protocol: "fixture" };
  const store = new IndexStore("unused"); await store.load(); store.state.swaps = [{ ...common, swapId: "token-sol", signature: "a", slot: 10, pool: "token-sol-pool", inputMint: "token", outputMint: sol, inputAmountRaw: "2000000", outputAmountRaw: "1000000000", inputDecimals: 6, outputDecimals: 9 }, { ...common, swapId: "sol-usdc", signature: "b", slot: 11, pool: "sol-usdc-pool", inputMint: sol, outputMint: usdc, inputAmountRaw: "1000000000", outputAmountRaw: "150000000", inputDecimals: 9, outputDecimals: 6 }];
  const result = store.referencePrice("token", 120_000, now); assert.equal(result.available, true); assert.equal(result.safeForAutomation, false); assert.deepEqual(result.price, { numeratorRaw: "75", denominatorRaw: "1" }); assert.deepEqual(result.path, ["token", sol, usdc]); assert.equal(store.referencePrice("token", 1_000, now).available, false);
  const server = createServer({ staleAfterMs: Date.now() }, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise((resolve) => server.close(resolve))); assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/v1/price/token`)).status, 200);
});

test("pool risk and bot readiness require explicit mature two-way finalized evidence", async () => {
  const store = new IndexStore("unused"); await store.load(); const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8")));
  for (let index = 0; index < 20; index++) { const swap = { ...block.swaps[0], swapId: `risk-${index}:0`, eventIndex: 0, signature: `risk-${index}`, slot: 100 + index, blockTime: 1_700_000_000 + index, inputMint: index % 2 ? "quote-mint" : "mint-address", outputMint: index % 2 ? "mint-address" : "quote-mint" }; store.state.swaps.push(swap); }
  const now = 1_700_000_020_000; const risk = store.poolRisk("pool-address", 120_000, now); assert.equal(risk.assessable, true); assert.equal(risk.safeForAutomation, false); assert.deepEqual(risk.flags, []); assert.ok(risk.blockers.includes("holder_concentration_exclusions_incomplete")); assert.equal(risk.manipulation.assessable, false); assert.equal(risk.liquidity.assessable, false);
  const eventStore = new IndexStore("unused"); await eventStore.load(); eventStore.apply(block); const freshEventLiquidity = eventStore.poolRisk("pool-address", 120_000, (block.blockTime + 60) * 1_000).liquidity; assert.equal(freshEventLiquidity.assessable, true); assert.equal(freshEventLiquidity.eventEvidence.fresh, true); const staleEventLiquidity = eventStore.poolRisk("pool-address", 120_000, (block.blockTime + 180) * 1_000); assert.equal(staleEventLiquidity.liquidity.assessable, false); assert.equal(staleEventLiquidity.liquidity.stale, true); assert.ok(staleEventLiquidity.blockers.includes("liquidity_state_stale"));
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

test("future market observations fail closed across consumer projections", async () => {
  const store = new IndexStore("unused"); await store.load(); const now = 1_700_000_100_000, future = 1_700_000_101;
  const swap = { swapId: "future:0", signature: "future", eventIndex: 0, slot: 10, blockTime: future, pool: "future-pool", protocol: "fixture", provenance: { commitment: "finalized" }, side: "buy", user: "future-trader", inputMint: "token", outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", inputAmountRaw: "1000000", outputAmountRaw: "2000000", inputDecimals: 6, outputDecimals: 6, baseMint: "token", quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", baseDecimals: 6, quoteDecimals: 6 };
  store.state.swaps = [swap]; store.state.transfers = [{ mint: "token", slot: 10, blockTime: future }];
  assert.equal(store.referencePrice("token", 120_000, now).available, false);
  assert.equal(store.trending(10, 300, now).some((row) => row.mint === "token"), false);
  const candles = store.candles("future-pool", 60, 10, now); assert.equal(candles.data.length, 0); assert.equal(candles.futureRejectedSwaps, 1);
  const evidence = store.evidence("token", 120_000, now); assert.equal(evidence.freshness.observedInFuture, true); assert.equal(evidence.freshness.stale, true); assert.ok(evidence.missing.includes("market_clock_skew"));
});

test("wallet cost basis and PnL remain exact and disclose partial coverage", async () => {
  const store = new IndexStore("unused"); await store.load(); const common = { user: "wallet-a", baseMint: "token", quoteMint: "quote", inputDecimals: 6, outputDecimals: 6, slot: 1, eventIndex: 0 };
  store.state.swaps = [{ ...common, swapId: "buy:0", inputMint: "quote", outputMint: "token", inputAmountRaw: "200", outputAmountRaw: "100" }, { ...common, swapId: "sell:0", slot: 2, inputMint: "token", outputMint: "quote", inputAmountRaw: "40", outputAmountRaw: "120" }];
  const result = store.walletPerformance("wallet-a"), position = result.positions[0]; assert.equal(result.complete, false); assert.equal(result.safeForAutomation, false); assert.equal(position.quantityRaw, "60"); assert.deepEqual(position.costBasis, { numeratorRaw: "120", denominatorRaw: "1", quoteMint: "quote" }); assert.deepEqual(position.realizedPnl, { numeratorRaw: "40", denominatorRaw: "1", quoteMint: "quote" }); assert.deepEqual(position.unrealizedPnl, { numeratorRaw: "60", denominatorRaw: "1", quoteMint: "quote" });
  const profile = store.walletProfile("wallet-a"); assert.equal(profile.smartMoney, false); assert.equal(profile.observations, 2); assert.deepEqual(profile.missing, ["complete_wallet_history", "usd_reference_prices", "funding_graph", "sybil_cluster_analysis"]);
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
  await fs.writeFile(statusFile, JSON.stringify({ version: 2, commitment: "finalized", observedAt: new Date().toISOString(), lagSlots: 0, durableSkippedSlots: [7] }));
  const response = await fetch(endpoint); const body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.available, true); assert.deepEqual(body.exporter.durableSkippedSlots, [7]);
  await fs.writeFile(statusFile, JSON.stringify({ ...body.exporter, consecutiveFailures: 1, lastAttemptAt: new Date().toISOString(), lastError: "HTTP 429" })); const failed = await fetch(endpoint); assert.equal(failed.status, 503); assert.equal((await failed.json()).reason, "exporter_failure");
});

test("ingestion and metrics fail closed for stale exporter status", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-stale-exporter-")), statusFile = path.join(root, "status.json"); await fs.writeFile(statusFile, JSON.stringify({ version: 2, commitment: "finalized", observedAt: "2020-01-01T00:00:00.000Z", lagSlots: 9, consecutiveFailures: 3 })); const store = new IndexStore("unused"); await store.load(); const server = createServer({ staleAfterMs: 120_000, exporterStatusFile: statusFile }, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise((resolve) => server.close(resolve))); const base = `http://127.0.0.1:${server.address().port}`;
  const ingestion = await fetch(`${base}/api/v1/ingestion`); assert.equal(ingestion.status, 503); assert.equal((await ingestion.json()).reason, "exporter_failure"); const metrics = await (await fetch(`${base}/metrics`)).text(); assert.match(metrics, /terminal_dex_exporter_healthy 0/); assert.match(metrics, /terminal_dex_exporter_lag_slots 9/); assert.match(metrics, /terminal_dex_exporter_consecutive_failures 3/);
});

test("configuration refuses public binding without API keys", () => {
  assert.throws(() => loadConfig({ INDEXER_HOST: "0.0.0.0" }, process.cwd()), /INDEXER_API_KEYS is required/);
  const config = loadConfig({ INDEXER_HOST: "0.0.0.0", INDEXER_API_KEYS: "first, second", INDEXER_RATE_LIMIT_PER_MINUTE: "25" }, process.cwd());
  assert.deepEqual(config.apiKeys, ["first", "second"]); assert.equal(config.rateLimitPerMinute, 25);
});

test("storage deployment requires reviewed images, loopback ports, secrets, and core schemas", async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); const compose = await fs.readFile(path.join(root, "infra/compose.yaml"), "utf8"); const ignored = await fs.readFile(path.join(root, ".gitignore"), "utf8");
  assert.doesNotMatch(compose, /image:\s+\S+:latest/); assert.match(compose, /POSTGRES_IMAGE:\?Set POSTGRES_IMAGE/); assert.match(compose, /127\.0\.0\.1:5432:5432/); assert.match(compose, /postgres_password: \{ file:/); assert.match(ignored, /infra\/secrets\/\*/);
  const postgres = await fs.readFile(path.join(root, "infra/postgres/001_core.sql"), "utf8"), clickhouse = await fs.readFile(path.join(root, "infra/clickhouse/001_events.sql"), "utf8"); assert.match(postgres, /CREATE TABLE IF NOT EXISTS security_snapshots/); assert.match(postgres, /CREATE TABLE IF NOT EXISTS ingestion_checkpoints/); assert.match(clickhouse, /CREATE TABLE IF NOT EXISTS terminal_dex\.instructions/); assert.match(clickhouse, /UInt256/);
});

test("Docker Desktop reduced mode is bounded, private, and credential-externalized", async () => {
  const compose = await fs.readFile(path.join(rootDir, "infra/reduced/compose.yaml"), "utf8"), dockerfile = await fs.readFile(path.join(rootDir, "infra/reduced/Dockerfile"), "utf8"); assert.match(dockerfile, /ARG NODE_IMAGE/); assert.match(compose, /NODE_IMAGE:\s*\$\{NODE_IMAGE:\?Set NODE_IMAGE/); assert.match(compose, /env_file:\s*\.\.\/\.\.\/validator\/external-rpc\.env/); assert.match(compose, /INDEXER_RETENTION_SECONDS:\s*"86400"/); assert.match(compose, /INDEXER_MAX_TRANSACTIONS:\s*"50000"/); assert.match(compose, /read_only:\s*true/); assert.match(compose, /cap_drop:\s*\[ALL\]/); assert.match(compose, /ports:\s*\[127\.0\.0\.1:8787:8787\]/); assert.match(compose, /profiles:\s*\[tools\]/); assert.match(compose, /\.\.\/\.\.\/inbox-mainnet:\/app\/inbox-mainnet:ro/); assert.match(compose, /command:\s*\[src\/inbox-archive\.js\]/); assert.doesNotMatch(compose, /HELIUS_RPC_URL:|ALCHEMY_RPC_URL:/);
});

test("reduced Docker preflight requires digests, mainnet providers, API keys, and writable mounts", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solana-reduced-preflight-")), envFile = path.join(root, "external.env"); await fs.mkdir(path.join(root, "data")); await fs.mkdir(path.join(root, "inbox-mainnet")); await fs.writeFile(envFile, `HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=private\nALCHEMY_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/private\nINDEXER_EXPECTED_GENESIS_HASH=${MAINNET_GENESIS_HASH}\nINDEXER_API_KEYS=${"a".repeat(32)}\n`); const digest = `node@sha256:${"a".repeat(64)}`; const result = await reducedPreflight({ root, nodeImage: digest, envFile }); assert.deepEqual(result.providers, ["helius", "alchemy"]); assert.equal(result.apiKeys, 1); assert.equal(JSON.stringify(result).includes("private"), false); await assert.rejects(reducedPreflight({ root, nodeImage: "node:latest", envFile }), /explicit sha256/); await fs.writeFile(envFile, "HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=REPLACE\n"); await assert.rejects(reducedPreflight({ root, nodeImage: digest, envFile }), /HELIUS_RPC_URL must be configured/);
  const starter = await fs.readFile(path.join(rootDir, "infra/reduced/start.ps1"), "utf8"); assert.match(starter, /if \(-not \$Start\)/); assert.match(starter, /--no-env-resolution/); assert.match(starter, /up -d --build exporter api/);
});

test("external mainnet services are supervised, isolated, and never auto-started", async () => {
  const exporter = await fs.readFile(path.join(rootDir, "validator/solana-indexer-external-exporter.service"), "utf8"), api = await fs.readFile(path.join(rootDir, "validator/solana-indexer-external-api.service"), "utf8"), installer = await fs.readFile(path.join(rootDir, "validator/install-external-services.sh"), "utf8");
  for (const unit of [exporter, api]) { assert.match(unit, /EnvironmentFile=\/etc\/solana-indexer-external\.env/); assert.match(unit, /Restart=on-failure/); assert.match(unit, /ProtectSystem=strict/); assert.match(unit, /ReadWritePaths=.*inbox-mainnet .*data/); }
  assert.match(exporter, /npm run export:external/); assert.match(api, /npm start/); assert.match(installer, /must have mode 0600/); assert.match(installer, /systemctl daemon-reload/); assert.doesNotMatch(installer, /enable --now|systemctl start/);
});

test("object archives remain fully self-hosted without S3 or cloud endpoints", async () => {
  const compose = await fs.readFile(path.join(rootDir, "infra/compose.yaml"), "utf8"), backup = await fs.readFile(path.join(rootDir, "ops/backup.sh"), "utf8"); assert.match(compose, /SEAWEEDFS_IMAGE:\?Set SEAWEEDFS_IMAGE/); assert.match(compose, /127\.0\.0\.1:8888:8888/); assert.match(backup, /SELF_HOSTED_ARCHIVE_URL/); assert.match(backup, /must be loopback HTTP/); assert.doesNotMatch(backup, /BACKUP_S3|aws s3/);
  assert.match(backup, /archive-receipt\.js complete/); assert.match(backup, /install -m 0600 .*inbox-archive-receipt\.json/);
});

test("mTLS gateway and production SLO alerts fail closed", async () => {
  const compose = await fs.readFile(path.join(rootDir, "infra/compose.yaml"), "utf8"), nginx = await fs.readFile(path.join(rootDir, "infra/gateway/nginx.conf"), "utf8"), alerts = await fs.readFile(path.join(rootDir, "infra/monitoring/alerts.yaml"), "utf8");
  assert.match(compose, /NGINX_IMAGE:\?Set NGINX_IMAGE/); assert.match(compose, /client_ca_certificate/); assert.match(nginx, /ssl_verify_client on/); assert.match(nginx, /ssl_protocols TLSv1\.2 TLSv1\.3/); assert.match(alerts, /terminal_dex_index_healthy == 0/); assert.match(alerts, /terminal_dex_dead_letters > 0/);
});

test("backup and restore tooling verifies integrity and gates destructive restore", async () => {
  const backup = await fs.readFile(path.join(rootDir, "ops/backup.sh"), "utf8"), fetchBackup = await fs.readFile(path.join(rootDir, "ops/fetch-backup.sh"), "utf8"), restore = await fs.readFile(path.join(rootDir, "ops/restore.sh"), "utf8");
  assert.match(backup, /sha256sum .*SHA256SUMS/); assert.match(backup, /SELF_HOSTED_ARCHIVE_URL/); assert.match(backup, /BACKUP_WRITERS_QUIESCED/); assert.match(backup, /pg_dump/); assert.match(backup, /FORMAT Native/); assert.match(fetchBackup, /sha256sum --check SHA256SUMS/); assert.match(fetchBackup, /SELF_HOSTED_ARCHIVE_URL must be loopback HTTP/); assert.match(restore, /--confirm-empty-target/); assert.match(restore, /sha256sum --check SHA256SUMS/); assert.match(restore, /pg_restore --clean --if-exists/); assert.match(restore, /TRUNCATE TABLE/);
});

test("API authentication and quotas fail closed", async (t) => {
  const store = new IndexStore("unused"); await store.load(); const config = { staleAfterMs: 120_000, apiKeys: ["secret"], rateLimitPerMinute: 2 };
  const server = createServer(config, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve))); const endpoint = `http://127.0.0.1:${server.address().port}/api/stats`;
  assert.equal((await fetch(endpoint)).status, 401); assert.equal((await fetch(endpoint, { headers: { "x-api-key": "wrong" } })).status, 401);
  assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/internal/feed/health`)).status, 401);
  const first = await fetch(endpoint, { headers: { authorization: "Bearer secret" } }); assert.equal(first.status, 200); assert.equal(first.headers.get("x-ratelimit-remaining"), "1");
  assert.equal((await fetch(endpoint, { headers: { "x-api-key": "secret" } })).status, 200);
  const limited = await fetch(endpoint, { headers: { "x-api-key": "secret" } }); assert.equal(limited.status, 429); assert.ok(limited.headers.get("retry-after"));
});

test("internal evidence API exposes missing fields and immutable provenance contract", async (t) => {
  const store = new IndexStore("unused"); await store.load(); const block = parseBlock(JSON.parse(await fs.readFile(fixture, "utf8"))); store.apply(block); store.state.updatedAt = new Date().toISOString(); const server = createServer({ staleAfterMs: 120_000 }, store); await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise((resolve) => server.close(resolve))); const base = `http://127.0.0.1:${server.address().port}`;
  const evidence = await (await fetch(`${base}/internal/evidence/mint-address`)).json(); assert.equal(evidence.schemaVersion, 1); assert.match(evidence.immutableSnapshotId, /^solana:100:/); assert.equal(evidence.safeForAutomation, false); assert.ok(evidence.missing.includes("executable_route")); const route = await (await fetch(`${base}/internal/tokens/mint-address/executable-depth`)).json(); assert.equal(route.selfHosted, true); assert.equal(route.available, false); assert.ok(route.missing.includes("local_simulation"));
  const registry = await (await fetch(`${base}/internal/registry`)).json(); assert.equal(registry.version, 2); assert.ok(registry.programs.some((row) => row.protocol === "pump-bonding-curve")); assert.ok(registry.programs.some((row) => row.protocol === "raydium-clmm"));
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
