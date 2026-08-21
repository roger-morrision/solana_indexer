import fs from "node:fs/promises";
import path from "node:path";

function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a || 1n; }
function rational(numerator = 0n, denominator = 1n) { if (denominator === 0n) throw new Error("zero rational denominator"); if (denominator < 0n) { numerator = -numerator; denominator = -denominator; } const divisor = gcd(numerator, denominator); return { n: numerator / divisor, d: denominator / divisor }; }
function addRational(a, b) { return rational(a.n * b.d + b.n * a.d, a.d * b.d); }
function subtractRational(a, b) { return rational(a.n * b.d - b.n * a.d, a.d * b.d); }
function multiplyRational(a, numerator, denominator = 1n) { return rational(a.n * numerator, a.d * denominator); }
function publicRational(value, quoteMint) { return { numeratorRaw: value.n.toString(), denominatorRaw: value.d.toString(), quoteMint }; }
const MAINNET_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WRAPPED_SOL = "So11111111111111111111111111111111111111112";
const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
function pow10(decimals) { return 10n ** BigInt(decimals); }
function mergePoolSwap(current, swap) {
  const next = { ...current, protocol: current.protocol ?? swap.protocol, swapCount: (current.swapCount ?? 0) + 1 };
  const currentSlot = Number.isSafeInteger(current.lastSlot) ? current.lastSlot : -1;
  const currentEventIndex = Number.isSafeInteger(current.lastEventIndex) ? current.lastEventIndex : -1;
  const eventIndex = Number.isSafeInteger(swap.eventIndex) ? swap.eventIndex : 0;
  if (swap.slot < currentSlot || (swap.slot === currentSlot && eventIndex < currentEventIndex)) return next;
  return { ...next, venueType: swap.venueType, baseMint: swap.baseMint, quoteMint: swap.quoteMint, pairIdentitySource: swap.pairIdentitySource, lastSlot: swap.slot, lastEventIndex: eventIndex, lastBlockTime: swap.blockTime, inputMint: swap.inputMint, outputMint: swap.outputMint, inputVaultBeforeRaw: swap.inputVaultBeforeRaw, outputVaultBeforeRaw: swap.outputVaultBeforeRaw, reserveTiming: swap.reserveTiming, sqrtPriceX64: swap.sqrtPriceX64, liquidityRaw: swap.liquidityRaw, tick: swap.tick, realTokenReservesRaw: swap.realTokenReservesRaw, realQuoteReservesRaw: swap.realQuoteReservesRaw, virtualTokenReservesRaw: swap.virtualTokenReservesRaw, virtualQuoteReservesRaw: swap.virtualQuoteReservesRaw, mayhemMode: swap.mayhemMode, executionPrice: { numeratorRaw: swap.outputAmountRaw, denominatorRaw: swap.inputAmountRaw, inputDecimals: swap.inputDecimals, outputDecimals: swap.outputDecimals } };
}

function emptyState() {
  return { version: 9, tip: null, blocks: {}, transactions: {}, instructions: [], programEvents: [], transfers: [], balanceChanges: [], tokenAccounts: {}, holderSnapshots: {}, poolSnapshots: {}, swaps: [], pools: {}, accounts: {}, mints: {}, processedFiles: {}, checkpoints: {}, deadLetters: [], reorgCorrections: [], events: [], eventSequence: 0, updatedAt: null };
}

export class IndexStore {
  constructor(filename, maxTransactions = 250_000, retentionSeconds = null) { this.filename = filename; this.maxTransactions = maxTransactions; this.retentionSeconds = retentionSeconds; this.state = emptyState(); this.loaded = false; this.listeners = new Set(); this.pendingEvents = []; }
  async load() {
    if (this.loaded) return;
    try { this.state = JSON.parse(await fs.readFile(this.filename, "utf8")); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    this.state.events ??= []; this.state.eventSequence ??= 0; this.state.swaps ??= []; this.state.pools ??= {}; this.state.balanceChanges ??= []; this.state.tokenAccounts ??= {}; this.state.holderSnapshots ??= {}; this.state.poolSnapshots ??= {}; this.state.instructions ??= []; this.state.programEvents ??= []; this.state.checkpoints ??= {}; this.state.deadLetters ??= []; this.state.reorgCorrections ??= [];
    const indices = new Map(); for (const swap of this.state.swaps) if (Number.isSafeInteger(swap.eventIndex)) indices.set(swap.signature, Math.max(indices.get(swap.signature) ?? 0, swap.eventIndex + 1));
    for (const swap of this.state.swaps) if (!swap.swapId) { const eventIndex = indices.get(swap.signature) ?? 0; indices.set(swap.signature, eventIndex + 1); swap.eventIndex = eventIndex; swap.swapId = `${swap.signature}:${eventIndex}`; }
    for (const swap of this.state.swaps) if (!swap.baseMint || !swap.quoteMint) { swap.baseMint = [swap.inputMint, swap.outputMint].sort()[0]; swap.quoteMint = swap.baseMint === swap.inputMint ? swap.outputMint : swap.inputMint; swap.pairIdentitySource = "canonical_lexical"; swap.baseDecimals = swap.baseMint === swap.inputMint ? swap.inputDecimals : swap.outputDecimals; swap.quoteDecimals = swap.quoteMint === swap.inputMint ? swap.inputDecimals : swap.outputDecimals; }
    this.state.version = 9; this.rebuildTokenAccounts(); this.mergePoolSnapshots();
    this.loaded = true;
  }
  async save() {
    await fs.mkdir(path.dirname(this.filename), { recursive: true });
    const temporary = `${this.filename}.${process.pid}.tmp`;
    this.state.updatedAt = new Date().toISOString();
    await fs.writeFile(temporary, `${JSON.stringify(this.state)}\n`);
    await fs.rename(temporary, this.filename);
    const committed = this.pendingEvents.splice(0);
    for (const event of committed) for (const listener of this.listeners) listener(event);
  }
  hasFile(name, fingerprint) { const row = this.state.processedFiles[name]; return row?.fingerprint === fingerprint && row?.parserVersion === 2; }
  resolveDeadLetters(filename, fingerprint) { let resolved = 0; for (const row of this.state.deadLetters) if (!row.resolved && row.filename === filename && row.fingerprint === fingerprint) { row.resolved = true; row.resolvedAt = new Date().toISOString(); row.resolution = "parser_v2_checkpoint"; resolved++; } return resolved; }
  markFile(name, fingerprint) { this.state.processedFiles[name] = { fingerprint, parserVersion: 2 }; this.state.checkpoints.inbox = { filename: name, fingerprint, parserVersion: 2, updatedAt: new Date().toISOString() }; return this.resolveDeadLetters(name, fingerprint); }
  recordDeadLetter(filename, fingerprint, error) { const existing = this.state.deadLetters.find((row) => row.filename === filename && row.fingerprint === fingerprint); if (existing) { existing.attempts++; existing.lastObservedAt = new Date().toISOString(); existing.error = error; existing.resolved = false; delete existing.resolvedAt; delete existing.resolution; return; } this.state.deadLetters.push({ id: `${filename}:${fingerprint ?? "unreadable"}`, filename, fingerprint, error, attempts: 1, firstObservedAt: new Date().toISOString(), lastObservedAt: new Date().toISOString(), resolved: false }); if (this.state.deadLetters.length > 10_000) this.state.deadLetters.splice(0, this.state.deadLetters.length - 10_000); }
  applyAccountSnapshot(snapshot) {
    if (snapshot?.schemaVersion !== 1 || snapshot.chain !== "solana" || snapshot.genesisHash !== MAINNET_GENESIS_HASH || snapshot.commitment !== "finalized" || !Number.isFinite(Date.parse(snapshot.observedAt ?? "")) || !Number.isSafeInteger(snapshot.slot) || !Array.isArray(snapshot.mints)) throw new Error("invalid finalized mainnet account snapshot");
    const seenMints = new Set(), seenAccounts = new Set();
    for (const row of snapshot.mints) {
      if (typeof row.mint !== "string" || !row.mint || seenMints.has(row.mint) || !Array.isArray(row.accounts)) throw new Error("invalid mint snapshot row"); seenMints.add(row.mint);
      for (const account of row.accounts) { if (!/^\d+$/.test(account.amountRaw) || !account.tokenAccount || seenAccounts.has(account.tokenAccount) || !Number.isInteger(account.decimals) || account.decimals < 0 || account.decimals > 255) throw new Error("invalid token account snapshot row"); seenAccounts.add(account.tokenAccount); }
    }
    for (const row of snapshot.mints) { const priorSnapshot = this.state.holderSnapshots[row.mint]; if (priorSnapshot && snapshot.slot < priorSnapshot.slot) continue; const present = new Set(row.accounts.map((account) => account.tokenAccount)); for (const account of priorSnapshot?.accounts ?? []) { const current = this.state.tokenAccounts[account.tokenAccount]; if (!present.has(account.tokenAccount) && current?.mint === row.mint && current.lastSlot <= snapshot.slot) delete this.state.tokenAccounts[account.tokenAccount]; } let complete = true; for (const account of row.accounts) { if (!account.owner) complete = false; const prior = this.state.tokenAccounts[account.tokenAccount]; if (!prior || snapshot.slot >= prior.lastSlot) this.state.tokenAccounts[account.tokenAccount] = { mint: row.mint, owner: account.owner, programId: account.programId, decimals: account.decimals, amountRaw: account.amountRaw, lastSlot: snapshot.slot, lastSignature: null, closed: BigInt(account.amountRaw) === 0n }; } this.state.holderSnapshots[row.mint] = { slot: snapshot.slot, observedAt: snapshot.observedAt, genesisHash: snapshot.genesisHash, accountCount: row.accounts.length, complete, mintInfo: row.mintInfo, accounts: row.accounts }; const mint = this.state.mints[row.mint] ?? { transferCount: 0, swapCount: 0, lastSlot: snapshot.slot, lastBlockTime: null }; mint.mintInfo = row.mintInfo; mint.authoritySourceSlot = snapshot.slot; this.state.mints[row.mint] = mint; }
  }
  applyPoolSnapshot(snapshot) {
    if (snapshot?.schemaVersion !== 1 || snapshot.type !== "raydium_clmm_pool_snapshot" || snapshot.chain !== "solana" || snapshot.genesisHash !== MAINNET_GENESIS_HASH || snapshot.commitment !== "finalized" || !Number.isFinite(Date.parse(snapshot.observedAt ?? "")) || !Number.isSafeInteger(snapshot.stateSlot) || !Number.isSafeInteger(snapshot.balanceSlot) || snapshot.balanceSlot < snapshot.stateSlot || !Array.isArray(snapshot.pools)) throw new Error("invalid finalized mainnet CLMM pool snapshot");
    const seenPools = new Set();
    for (const row of snapshot.pools) { if (!row.address || seenPools.has(row.address) || row.programId !== "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK" || !row.tokenMint0 || !row.tokenMint1 || !row.tokenVault0 || !row.tokenVault1 || !/^\d+$/.test(row.vault0AmountRaw) || !/^\d+$/.test(row.vault1AmountRaw) || !/^\d+$/.test(row.liquidityRaw) || !/^\d+$/.test(row.sqrtPriceX64) || !Number.isInteger(row.tick) || !Number.isInteger(row.tickSpacing)) throw new Error("invalid CLMM pool snapshot row"); seenPools.add(row.address); }
    for (const row of snapshot.pools) { const prior = this.state.poolSnapshots[row.address]; if (prior && (prior.balanceSlot > snapshot.balanceSlot || (prior.balanceSlot === snapshot.balanceSlot && prior.stateSlot > snapshot.stateSlot))) continue; this.state.poolSnapshots[row.address] = { ...row, commitment: "finalized", stateSlot: snapshot.stateSlot, balanceSlot: snapshot.balanceSlot, observedAt: snapshot.observedAt, genesisHash: snapshot.genesisHash }; }
    this.mergePoolSnapshots();
  }
  mergePoolSnapshots() { for (const [address, snapshot] of Object.entries(this.state.poolSnapshots ?? {})) { const current = this.state.pools[address] ?? { protocol: "raydium-clmm", venueType: "clmm", swapCount: 0, baseMint: snapshot.tokenMint0, quoteMint: snapshot.tokenMint1, pairIdentitySource: "protocol_account" }; this.state.pools[address] = { ...current, accountSnapshot: snapshot }; } }
  apply(block) {
    const slot = String(block.slot);
    let prior = this.state.blocks[slot]; const enrichment = prior?.blockhash === block.blockhash && prior.instructionCount == null;
    if (enrichment) { if (prior.provenance?.commitment === "finalized") { block.provenance = prior.provenance; for (const swap of block.swaps) swap.provenance = prior.provenance; } this.removeSlot(block.slot); prior = null; }
    if (prior && prior.blockhash === block.blockhash) {
      if (prior.provenance?.commitment === "confirmed" && block.provenance?.commitment === "finalized") {
        prior.provenance = block.provenance; for (const swap of this.state.swaps) if (swap.slot === block.slot) swap.provenance = block.provenance;
        const event = { sequence: ++this.state.eventSequence, type: "block_finalized", slot: block.slot, blockhash: block.blockhash, parentSlot: block.parentSlot, blockTime: block.blockTime, transactionCount: block.transactions.length, transferCount: block.transfers.length, balanceChangeCount: (block.balanceChanges ?? []).length, swapCount: block.swaps.length, swaps: block.swaps.map((swap) => ({ ...swap, provenance: block.provenance })), provenance: block.provenance };
        this.state.events.push(event); if (this.state.events.length > 10_000) this.state.events.splice(0, this.state.events.length - 10_000); this.pendingEvents.push(event);
        return { inserted: false, updated: true, reason: "finalized" };
      }
      return { inserted: false, updated: false, reason: "duplicate" };
    }
    if (prior?.provenance?.commitment === "finalized" && block.provenance?.commitment !== "finalized") throw new Error(`refusing to replace finalized slot ${block.slot} with non-finalized data`);
    if (prior) { this.state.reorgCorrections.push({ slot: block.slot, replacedBlockhash: prior.blockhash, canonicalBlockhash: block.blockhash, observedAt: new Date().toISOString() }); if (this.state.reorgCorrections.length > 10_000) this.state.reorgCorrections.splice(0, this.state.reorgCorrections.length - 10_000); this.removeSlot(block.slot); }
    this.state.blocks[slot] = { blockhash: block.blockhash, previousBlockhash: block.previousBlockhash, parentSlot: block.parentSlot, blockTime: block.blockTime, provenance: block.provenance, transactionCount: block.transactions.length, instructionCount: (block.instructions ?? []).length, transferCount: block.transfers.length };
    for (const transaction of block.transactions) {
      this.state.transactions[transaction.signature] = transaction;
      for (const account of transaction.accounts) {
        const current = this.state.accounts[account] ?? { transactionCount: 0, successfulTransactionCount: 0, lastSlot: 0 };
        current.transactionCount += 1; current.successfulTransactionCount += transaction.success ? 1 : 0; current.lastSlot = Math.max(current.lastSlot, transaction.slot);
        this.state.accounts[account] = current;
      }
    }
    this.state.instructions.push(...(block.instructions ?? [])); this.state.programEvents.push(...block.swaps.map((swap) => ({ eventId: swap.eventId, type: "swap", slot: swap.slot, blockTime: swap.blockTime, signature: swap.signature, programId: swap.programId, protocol: swap.protocol, instructionIndex: -1, innerIndex: swap.eventIndex, registryVersion: swap.registryVersion, decoderVersion: swap.decoderVersion, rawPayloadHash: swap.rawPayloadHash, payloadHashKind: swap.payloadHashKind, swapId: swap.swapId })));
    this.state.transfers.push(...block.transfers);
    this.state.balanceChanges.push(...(block.balanceChanges ?? [])); for (const change of block.balanceChanges ?? []) this.state.tokenAccounts[change.tokenAccount] = { mint: change.mint, owner: change.owner, programId: change.programId, decimals: change.decimals, amountRaw: change.postAmountRaw, lastSlot: change.slot, lastSignature: change.signature, closed: change.closed };
    this.state.swaps.push(...block.swaps);
    for (const transfer of block.transfers) if (transfer.mint) {
      const current = this.state.mints[transfer.mint] ?? { transferCount: 0, lastSlot: 0, lastBlockTime: null };
      current.transferCount += 1; current.lastSlot = Math.max(current.lastSlot, transfer.slot); current.lastBlockTime = Math.max(current.lastBlockTime ?? 0, transfer.blockTime ?? 0) || null;
      this.state.mints[transfer.mint] = current;
    }
    for (const swap of block.swaps) {
      const current = this.state.pools[swap.pool] ?? { protocol: swap.protocol, swapCount: 0 };
      this.state.pools[swap.pool] = mergePoolSwap(current, swap);
      for (const mint of [swap.inputMint, swap.outputMint]) { const row = this.state.mints[mint] ?? { transferCount: 0, swapCount: 0, lastSlot: 0, lastBlockTime: null }; row.swapCount = (row.swapCount ?? 0) + 1; row.lastSlot = Math.max(row.lastSlot, swap.slot); row.lastBlockTime = Math.max(row.lastBlockTime ?? 0, swap.blockTime ?? 0) || null; this.state.mints[mint] = row; }
    }
    this.prune();
    this.state.tip = this.computeTip();
    const event = { sequence: ++this.state.eventSequence, type: prior ? "block_replaced" : "block_indexed", slot: block.slot, blockhash: block.blockhash, parentSlot: block.parentSlot, blockTime: block.blockTime, transactionCount: block.transactions.length, transferCount: block.transfers.length, balanceChangeCount: (block.balanceChanges ?? []).length, swapCount: block.swaps.length, swaps: block.swaps, provenance: block.provenance };
    this.state.events.push(event); if (this.state.events.length > 10_000) this.state.events.splice(0, this.state.events.length - 10_000); this.pendingEvents.push(event);
    return { inserted: true, reason: prior ? "replaced" : "new" };
  }
  removeSlot(slot) {
    const signatures = new Set(Object.values(this.state.transactions).filter((tx) => tx.slot === slot).map((tx) => tx.signature));
    for (const signature of signatures) delete this.state.transactions[signature];
    this.state.transfers = this.state.transfers.filter((row) => row.slot !== slot);
    this.state.instructions = this.state.instructions.filter((row) => row.slot !== slot); this.state.programEvents = this.state.programEvents.filter((row) => row.slot !== slot);
    this.state.balanceChanges = this.state.balanceChanges.filter((row) => row.slot !== slot);
    this.state.swaps = this.state.swaps.filter((row) => row.slot !== slot);
    delete this.state.blocks[String(slot)];
    this.rebuildAggregates();
  }
  rebuildAggregates() {
    this.state.accounts = {}; this.state.mints = {}; this.state.pools = {}; this.rebuildTokenAccounts();
    for (const tx of Object.values(this.state.transactions)) for (const account of tx.accounts) {
      const row = this.state.accounts[account] ?? { transactionCount: 0, successfulTransactionCount: 0, lastSlot: 0 };
      row.transactionCount++; row.successfulTransactionCount += tx.success ? 1 : 0; row.lastSlot = Math.max(row.lastSlot, tx.slot); this.state.accounts[account] = row;
    }
    for (const transfer of this.state.transfers) if (transfer.mint) {
      const row = this.state.mints[transfer.mint] ?? { transferCount: 0, lastSlot: 0, lastBlockTime: null };
      row.transferCount++; row.lastSlot = Math.max(row.lastSlot, transfer.slot); row.lastBlockTime = Math.max(row.lastBlockTime ?? 0, transfer.blockTime ?? 0) || null; this.state.mints[transfer.mint] = row;
    }
    for (const swap of this.state.swaps) {
      const current = this.state.pools[swap.pool] ?? { protocol: swap.protocol, swapCount: 0 };
      this.state.pools[swap.pool] = mergePoolSwap(current, swap);
      for (const mint of [swap.inputMint, swap.outputMint]) { const row = this.state.mints[mint] ?? { transferCount: 0, swapCount: 0, lastSlot: 0, lastBlockTime: null }; row.swapCount = (row.swapCount ?? 0) + 1; row.lastSlot = Math.max(row.lastSlot, swap.slot); row.lastBlockTime = Math.max(row.lastBlockTime ?? 0, swap.blockTime ?? 0) || null; this.state.mints[mint] = row; }
    }
    for (const [mint, snapshot] of Object.entries(this.state.holderSnapshots)) { const row = this.state.mints[mint] ?? { transferCount: 0, swapCount: 0, lastSlot: snapshot.slot, lastBlockTime: null }; row.mintInfo = this.state.mints[mint]?.mintInfo ?? snapshot.mintInfo ?? null; row.authoritySourceSlot = snapshot.slot; this.state.mints[mint] = row; } this.mergePoolSnapshots();
  }
  prune() {
    if (this.retentionSeconds) { const newest = Object.values(this.state.blocks).reduce((value, row) => Math.max(value, Number(row.blockTime ?? 0)), 0), cutoff = newest - this.retentionSeconds; if (newest && cutoff > 0) { const expiredSlots = new Set(Object.entries(this.state.blocks).filter(([, row]) => row.blockTime != null && row.blockTime < cutoff).map(([slot]) => Number(slot))); if (expiredSlots.size) { for (const slot of expiredSlots) delete this.state.blocks[String(slot)]; for (const [signature, row] of Object.entries(this.state.transactions)) if (expiredSlots.has(row.slot)) delete this.state.transactions[signature]; this.state.instructions = this.state.instructions.filter((row) => !expiredSlots.has(row.slot)); this.state.programEvents = this.state.programEvents.filter((row) => !expiredSlots.has(row.slot)); this.state.transfers = this.state.transfers.filter((row) => !expiredSlots.has(row.slot)); this.state.balanceChanges = this.state.balanceChanges.filter((row) => !expiredSlots.has(row.slot)); this.state.swaps = this.state.swaps.filter((row) => !expiredSlots.has(row.slot)); this.rebuildAggregates(); this.state.tip = this.computeTip(); } } }
    const rows = Object.values(this.state.transactions);
    if (rows.length <= this.maxTransactions) return;
    const keep = new Set(rows.sort((a, b) => b.slot - a.slot).slice(0, this.maxTransactions).map((row) => row.signature));
    for (const signature of Object.keys(this.state.transactions)) if (!keep.has(signature)) delete this.state.transactions[signature];
    this.state.transfers = this.state.transfers.filter((row) => keep.has(row.signature));
    this.state.instructions = this.state.instructions.filter((row) => keep.has(row.signature)); this.state.programEvents = this.state.programEvents.filter((row) => keep.has(row.signature));
    this.state.balanceChanges = this.state.balanceChanges.filter((row) => keep.has(row.signature));
    this.state.swaps = this.state.swaps.filter((row) => keep.has(row.signature));
    this.rebuildAggregates();
  }
  rebuildTokenAccounts() {
    this.state.tokenAccounts = {};
    for (const change of [...this.state.balanceChanges].sort((a, b) => a.slot - b.slot)) this.state.tokenAccounts[change.tokenAccount] = { mint: change.mint, owner: change.owner, programId: change.programId, decimals: change.decimals, amountRaw: change.postAmountRaw, lastSlot: change.slot, lastSignature: change.signature, closed: change.closed };
    for (const [mint, snapshot] of Object.entries(this.state.holderSnapshots)) for (const account of snapshot.accounts ?? []) { const prior = this.state.tokenAccounts[account.tokenAccount]; if (!prior || snapshot.slot >= prior.lastSlot) this.state.tokenAccounts[account.tokenAccount] = { mint, owner: account.owner, programId: account.programId, decimals: account.decimals, amountRaw: account.amountRaw, lastSlot: snapshot.slot, lastSignature: null, closed: BigInt(account.amountRaw) === 0n }; }
  }
  computeTip() { const slots = Object.keys(this.state.blocks).map(Number); return slots.length ? Math.max(...slots) : null; }
  evidence(mint, staleAfterMs = 120_000, now = Date.now()) {
    const token = this.mint(mint, 100), security = this.tokenSecurity(mint, staleAfterMs, now), usdReference = this.referencePrice(mint, staleAfterMs, now); const swaps = this.state.swaps.filter((row) => row.inputMint === mint || row.outputMint === mint).sort((a, b) => b.slot - a.slot); const pools = [...new Set(swaps.map((row) => row.pool))].map((address) => this.pool(address).summary).filter(Boolean); const latest = swaps[0] ?? null; const ageMs = latest?.blockTime == null ? null : now - latest.blockTime * 1_000; const observedInFuture = ageMs != null && ageMs < 0; const missing = [];
    if (!latest) missing.push("market_activity"); if (observedInFuture) missing.push("market_clock_skew"); if (!pools.length) missing.push("pool_state"); if (!token.observedHolders.observedHolders) missing.push("holder_evidence"); if (!token.observedHolders.complete) missing.push("complete_holder_snapshot"); if (!security.assessable) missing.push("mint_authority", "freeze_authority", "token_2022_extensions"); missing.push("executable_route"); if (!usdReference.available) missing.push("usd_reference_price");
    return { schemaVersion: 1, mint, observedAt: new Date(now).toISOString(), immutableSnapshotId: `solana:${this.state.tip ?? "empty"}:${mint}`, freshness: { latestMarketSlot: latest?.slot ?? null, latestBlockTime: latest?.blockTime ?? null, ageMs, observedInFuture, stale: ageMs == null || ageMs < 0 || ageMs > staleAfterMs }, provenance: latest?.provenance ?? null, identity: { mint }, market: { latestSwap: latest, pools, usdReference }, holders: token.observedHolders, security, missing: [...new Set(missing)], confidence: missing.length ? "insufficient" : "complete", safeForAutomation: false };
  }
  referencePrice(mint, staleAfterMs = 120_000, now = Date.now()) {
    const unavailable = (reason) => ({ schemaVersion: 1, mint, available: false, safeForAutomation: false, reference: "nominal_usd_via_mainnet_usdc", reason, missing: ["fresh_finalized_usdc_path"] });
    if (mint === MAINNET_USDC) return { schemaVersion: 1, mint, available: true, safeForAutomation: false, reference: "nominal_usd_via_mainnet_usdc", price: { numeratorRaw: "1", denominatorRaw: "1" }, path: [MAINNET_USDC], observations: [], missing: ["independent_usdc_depeg_reference"] };
    const eligible = this.state.swaps.filter((row) => { const ageMs = row.blockTime == null ? null : now - row.blockTime * 1_000; return row.provenance?.commitment === "finalized" && Number.isInteger(row.inputDecimals) && Number.isInteger(row.outputDecimals) && /^\d+$/.test(row.inputAmountRaw) && /^\d+$/.test(row.outputAmountRaw) && ageMs != null && ageMs >= 0 && ageMs <= staleAfterMs && BigInt(row.inputAmountRaw) > 0n && BigInt(row.outputAmountRaw) > 0n; }).sort((a, b) => b.slot - a.slot || (b.eventIndex ?? 0) - (a.eventIndex ?? 0)); const edges = new Map();
    for (const swap of eligible) { const forwardKey = `${swap.inputMint}>${swap.outputMint}`, reverseKey = `${swap.outputMint}>${swap.inputMint}`; if (!edges.has(forwardKey)) edges.set(forwardKey, { from: swap.inputMint, to: swap.outputMint, rate: rational(BigInt(swap.outputAmountRaw) * pow10(swap.inputDecimals), BigInt(swap.inputAmountRaw) * pow10(swap.outputDecimals)), swap }); if (!edges.has(reverseKey)) edges.set(reverseKey, { from: swap.outputMint, to: swap.inputMint, rate: rational(BigInt(swap.inputAmountRaw) * pow10(swap.outputDecimals), BigInt(swap.outputAmountRaw) * pow10(swap.inputDecimals)), swap }); }
    const direct = edges.get(`${mint}>${MAINNET_USDC}`); const first = direct ? [direct] : [edges.get(`${mint}>${WRAPPED_SOL}`), edges.get(`${WRAPPED_SOL}>${MAINNET_USDC}`)].filter(Boolean); if ((!direct && first.length !== 2) || !first.length) return unavailable("no_fresh_finalized_usdc_path"); let price = rational(1n); for (const edge of first) price = multiplyRational(price, edge.rate.n, edge.rate.d); const swaps = first.map((edge) => edge.swap); return { schemaVersion: 1, mint, available: true, safeForAutomation: false, reference: "nominal_usd_via_mainnet_usdc", price: { numeratorRaw: price.n.toString(), denominatorRaw: price.d.toString() }, path: [mint, ...first.map((edge) => edge.to)], observations: swaps.map((swap) => ({ swapId: swap.swapId, pool: swap.pool, protocol: swap.protocol, slot: swap.slot, blockTime: swap.blockTime, commitment: swap.provenance.commitment })), ageMs: Math.max(...swaps.map((swap) => now - swap.blockTime * 1_000)), missing: ["independent_usdc_depeg_reference", "multi_venue_twap", "manipulation_adjusted_price"] };
  }
  walletPerformance(address) {
    const swaps = this.state.swaps.filter((row) => row.user === address && row.baseMint && row.quoteMint).sort((a, b) => a.slot - b.slot || a.eventIndex - b.eventIndex); const positions = new Map(); const anomalies = [];
    for (const swap of swaps) { const key = `${swap.baseMint}:${swap.quoteMint}`, row = positions.get(key) ?? { baseMint: swap.baseMint, quoteMint: swap.quoteMint, quantityRaw: 0n, cost: rational(), realized: rational(), latestPrice: null, buys: 0, sells: 0 }; const buy = swap.inputMint === row.quoteMint && swap.outputMint === row.baseMint, sell = swap.inputMint === row.baseMint && swap.outputMint === row.quoteMint; if (!buy && !sell) { anomalies.push({ swapId: swap.swapId, reason: "pair_direction_mismatch" }); continue; } const baseRaw = BigInt(buy ? swap.outputAmountRaw : swap.inputAmountRaw), quoteRaw = BigInt(buy ? swap.inputAmountRaw : swap.outputAmountRaw); if (baseRaw === 0n) { anomalies.push({ swapId: swap.swapId, reason: "zero_base_amount" }); continue; } row.latestPrice = rational(quoteRaw, baseRaw); if (buy) { row.quantityRaw += baseRaw; row.cost = addRational(row.cost, rational(quoteRaw)); row.buys++; } else if (row.quantityRaw === 0n) { anomalies.push({ swapId: swap.swapId, reason: "sell_without_indexed_inventory" }); row.sells++; } else { const sold = baseRaw > row.quantityRaw ? row.quantityRaw : baseRaw, allocated = multiplyRational(row.cost, sold, row.quantityRaw), proceeds = rational(quoteRaw * sold, baseRaw); row.realized = addRational(row.realized, subtractRational(proceeds, allocated)); row.cost = subtractRational(row.cost, allocated); row.quantityRaw -= sold; row.sells++; if (sold !== baseRaw) anomalies.push({ swapId: swap.swapId, reason: "sell_exceeds_indexed_inventory" }); } positions.set(key, row); }
    return { schemaVersion: 1, address, coverage: "decoded_swaps_with_explicit_user_only", complete: false, safeForAutomation: false, swaps: swaps.length, anomalies, positions: [...positions.values()].map((row) => { const marketValue = row.latestPrice ? multiplyRational(row.latestPrice, row.quantityRaw) : rational(); return { baseMint: row.baseMint, quoteMint: row.quoteMint, quantityRaw: row.quantityRaw.toString(), costBasis: publicRational(row.cost, row.quoteMint), realizedPnl: publicRational(row.realized, row.quoteMint), unrealizedPnl: publicRational(subtractRational(marketValue, row.cost), row.quoteMint), latestPrice: row.latestPrice ? publicRational(row.latestPrice, row.quoteMint) : null, buys: row.buys, sells: row.sells }; }) };
  }
  walletProfile(address) {
    const swaps = this.state.swaps.filter((row) => row.user === address), performance = this.walletPerformance(address), protocols = [...new Set(swaps.map((row) => row.protocol).filter(Boolean))].sort(); const realized = performance.positions.map((row) => BigInt(row.realizedPnl.numeratorRaw));
    return { schemaVersion: 1, address, profileVersion: "wallet-evidence-v1", assessable: swaps.length >= 20 && performance.anomalies.length === 0, smartMoney: false, safeForAutomation: false, coverage: performance.coverage, observations: swaps.length, uniquePools: new Set(swaps.map((row) => row.pool)).size, protocols, profitableClosedPositions: realized.filter((value) => value > 0n).length, losingClosedPositions: realized.filter((value) => value < 0n).length, performance, missing: ["complete_wallet_history", "usd_reference_prices", "funding_graph", "sybil_cluster_analysis"] };
  }
  tokenSecurity(mint, staleAfterMs = null, now = Date.now()) {
    const token = this.state.mints[mint], info = token?.mintInfo ?? null, snapshot = this.state.holderSnapshots[mint] ?? null;
    if (!info || !snapshot) return { schemaVersion: 1, mint, assessable: false, safeForAutomation: false, ruleVersion: "token-security-v1", missing: ["finalized_mint_account_snapshot"], findings: [], evidence: null };
    const observed = Date.parse(snapshot.observedAt ?? ""), ageMs = Number.isFinite(observed) ? now - observed : null, observedInFuture = ageMs != null && ageMs < 0, freshnessRequired = Number.isFinite(staleAfterMs), fresh = ageMs != null && ageMs >= 0 && (!freshnessRequired || ageMs <= staleAfterMs);
    const findings = [];
    if (info.mintAuthority) findings.push({ code: "mint_authority_present", severity: "high", blocksAutomation: true, value: info.mintAuthority });
    if (info.freezeAuthority) findings.push({ code: "freeze_authority_present", severity: "high", blocksAutomation: true, value: info.freezeAuthority });
    const extensions = Array.isArray(info.extensions) ? info.extensions : [];
    const extensionNames = extensions.map((row) => String(row?.extension ?? row?.type ?? row?.name ?? "unknown"));
    const blockingExtensions = new Set(["permanentDelegate", "transferHook", "confidentialTransferMint", "defaultAccountState", "nonTransferable"]);
    for (const extension of extensionNames) if (blockingExtensions.has(extension)) findings.push({ code: "token_2022_extension", severity: "high", blocksAutomation: true, value: extension });
    if (extensionNames.includes("transferFeeConfig")) findings.push({ code: "transfer_fee_extension", severity: "medium", blocksAutomation: true, value: "transferFeeConfig" });
    return { schemaVersion: 1, mint, assessable: !freshnessRequired || fresh, safeForAutomation: false, ruleVersion: "token-security-v1", freshness: { ageMs, staleAfterMs, observedInFuture, stale: !fresh }, missing: [...(!freshnessRequired || fresh ? [] : [observedInFuture ? "security_snapshot_clock_skew" : "fresh_finalized_mint_account_snapshot"]), "executable_sell_route", "liquidity_lock_evidence", "holder_exclusions"], findings, evidence: { commitment: "finalized", slot: snapshot.slot, observedAt: snapshot.observedAt, genesisHash: snapshot.genesisHash, mintAuthority: info.mintAuthority ?? null, freezeAuthority: info.freezeAuthority ?? null, extensions: extensionNames } };
  }
  stats() {
    const tipBlock = this.state.tip == null ? null : this.state.blocks[String(this.state.tip)];
    return { tip: this.state.tip, blocks: Object.keys(this.state.blocks).length, transactions: Object.keys(this.state.transactions).length, instructions: this.state.instructions.length, programEvents: this.state.programEvents.length, transfers: this.state.transfers.length, balanceChanges: this.state.balanceChanges.length, tokenAccounts: Object.keys(this.state.tokenAccounts).length, swaps: this.state.swaps.length, pools: Object.keys(this.state.pools).length, poolSnapshots: Object.keys(this.state.poolSnapshots).length, accounts: Object.keys(this.state.accounts).length, mints: Object.keys(this.state.mints).length, deadLetters: this.state.deadLetters.length, unresolvedDeadLetters: this.state.deadLetters.filter((row) => !row.resolved).length, reorgCorrections: this.state.reorgCorrections.length, updatedAt: this.state.updatedAt, ingestion: { source: tipBlock?.provenance?.source ?? "unknown", commitment: tipBlock?.provenance?.commitment ?? "unknown", sourceTip: tipBlock?.provenance?.sourceTip ?? null, exportLagSlots: tipBlock?.provenance?.exportLagSlots ?? null } };
  }
  chainQuality() {
    const slots = Object.keys(this.state.blocks).map(Number).sort((a, b) => a - b);
    const conflicts = [];
    for (const slot of slots) {
      const block = this.state.blocks[String(slot)];
      const parent = this.state.blocks[String(block.parentSlot)];
      if (parent && block.previousBlockhash && parent.blockhash && block.previousBlockhash !== parent.blockhash) {
        conflicts.push({ slot, parentSlot: block.parentSlot, expectedPreviousBlockhash: parent.blockhash, actualPreviousBlockhash: block.previousBlockhash });
      }
    }
    return { canonical: conflicts.length === 0, conflicts: conflicts.slice(0, 100), conflictCount: conflicts.length };
  }
  dataCapabilities(staleAfterMs = 120_000, now = Date.now()) {
    const blocks = Object.values(this.state.blocks);
    const finalizedBlocks = blocks.filter((block) => block.provenance?.commitment === "finalized").length;
    return {
      canonicalBlocks: blocks.length > 0,
      finalizedProvenance: blocks.length > 0 && finalizedBlocks === blocks.length,
      splTransfers: this.state.transfers.length > 0,
      observedTokenBalances: this.state.balanceChanges.length > 0,
      completeHolderSnapshots: Object.values(this.state.holderSnapshots).some((snapshot) => snapshot.complete),
      dexSwaps: this.state.swaps.length > 0,
      poolLiquidity: Object.keys(this.state.pools).length > 0,
      marketPrices: this.state.swaps.length > 0,
      riskSignals: Object.keys(this.state.pools).some((pool) => this.poolRisk(pool, staleAfterMs, now).assessable),
      finalizedBlocks,
      totalBlocks: blocks.length,
    };
  }
  poolRisk(address, staleAfterMs = 120_000, now = Date.now()) {
    const swaps = this.state.swaps.filter((row) => row.pool === address); const directions = new Set(swaps.map((row) => `${row.inputMint}>${row.outputMint}`)); const signatures = new Set(swaps.map((row) => row.signature)); const swapIds = new Set(swaps.map((row) => row.swapId));
    const latestBlockTime = swaps.reduce((latest, row) => Math.max(latest, Number(row.blockTime ?? 0) * 1_000), 0); const ageMs = latestBlockTime ? now - latestBlockTime : null;
    const flags = []; if (signatures.size < 20) flags.push("insufficient_observations"); if (directions.size < 2) flags.push("one_sided_flow"); if (swapIds.size !== swaps.length) flags.push("duplicate_swap_ids"); if (!swaps.length || swaps.some((row) => row.provenance?.commitment !== "finalized")) flags.push("unfinalized_or_unknown_provenance"); if (ageMs != null && ageMs < 0) flags.push("future_market_activity"); else if (ageMs == null || ageMs > staleAfterMs) flags.push("stale_market_activity");
    const traders = new Map(), amounts = new Map(); for (const swap of swaps) { if (swap.user) traders.set(swap.user, (traders.get(swap.user) ?? 0) + 1); const key = `${swap.inputAmountRaw}:${swap.outputAmountRaw}`; amounts.set(key, (amounts.get(key) ?? 0) + 1); }
    const topTraderSwaps = Math.max(0, ...traders.values()), repeatedAmountSwaps = Math.max(0, ...amounts.values()), decodedTraderCount = swaps.filter((row) => row.user).length; const manipulationFlags = []; if (swaps.length >= 20 && topTraderSwaps * 2 > swaps.length) manipulationFlags.push("dominant_trader_flow"); if (swaps.length >= 20 && repeatedAmountSwaps * 2 > swaps.length) manipulationFlags.push("repeated_amount_pattern");
    const summary = this.state.pools[address] ?? null, mints = [...new Set(swaps.flatMap((row) => [row.baseMint, row.quoteMint]).filter(Boolean))], security = mints.map((mint) => this.tokenSecurity(mint, staleAfterMs, now)), holders = mints.map((mint) => this.holders(mint, 10)); const manipulationAssessable = swaps.length >= 20 && decodedTraderCount * 10 >= swaps.length * 9, holderAssessable = holders.length === 2 && holders.every((row) => row.complete && row.exclusionsApplied), securityPass = security.length === 2 && security.every((row) => row.assessable && !row.findings.some((finding) => finding.blocksAutomation)); const snapshotObserved = Date.parse(summary?.accountSnapshot?.observedAt ?? ""), snapshotAgeMs = Number.isFinite(snapshotObserved) ? now - snapshotObserved : null, snapshotFuture = snapshotAgeMs != null && snapshotAgeMs < 0, snapshotFresh = summary?.accountSnapshot?.commitment === "finalized" && snapshotAgeMs != null && snapshotAgeMs >= 0 && snapshotAgeMs <= staleAfterMs, eventReserves = summary && (summary.inputVaultBeforeRaw != null || summary.realTokenReservesRaw != null); const liquidity = { assessable: Boolean((snapshotFresh && summary.accountSnapshot.vault0AmountRaw != null && summary.accountSnapshot.vault1AmountRaw != null) || eventReserves), stale: Boolean(summary?.accountSnapshot) && !snapshotFresh, observedInFuture: snapshotFuture, ageMs: snapshotAgeMs, staleAfterMs, venueType: summary?.venueType ?? null, reserveTiming: summary?.accountSnapshot ? "finalized_account_snapshot" : summary?.reserveTiming ?? null, inputVaultBeforeRaw: summary?.inputVaultBeforeRaw ?? null, outputVaultBeforeRaw: summary?.outputVaultBeforeRaw ?? null, vault0AmountRaw: summary?.accountSnapshot?.vault0AmountRaw ?? null, vault1AmountRaw: summary?.accountSnapshot?.vault1AmountRaw ?? null, stateSlot: summary?.accountSnapshot?.stateSlot ?? null, balanceSlot: summary?.accountSnapshot?.balanceSlot ?? null, realTokenReservesRaw: summary?.realTokenReservesRaw ?? null, realQuoteReservesRaw: summary?.realQuoteReservesRaw ?? null };
    const assessable = flags.length === 0; const blockers = []; if (!securityPass) blockers.push("token_security_incomplete_or_blocked"); if (!holderAssessable) blockers.push("holder_concentration_exclusions_incomplete"); if (!manipulationAssessable) blockers.push("manipulation_detection_incomplete"); if (manipulationFlags.length) blockers.push("manipulation_signals_detected"); if (!liquidity.assessable) blockers.push(liquidity.stale ? "liquidity_state_stale" : "liquidity_state_incomplete"); const safeForAutomation = assessable && blockers.length === 0;
    return { pool: address, assessable, dataQualityPass: assessable, safeForAutomation, scope: "multi-signal-risk-v1", observations: swaps.length, uniqueSignatures: signatures.size, directions: directions.size, latestBlockTime: latestBlockTime ? new Date(latestBlockTime).toISOString() : null, ageMs, flags, blockers, liquidity, security, holders: holders.map(({ holders: ignored, snapshot, ...row }) => ({ ...row, snapshot: snapshot ? { slot: snapshot.slot, observedAt: snapshot.observedAt } : null })), manipulation: { assessable: manipulationAssessable, decodedTraderCoverage: swaps.length ? { numeratorRaw: String(decodedTraderCount), denominatorRaw: String(swaps.length) } : null, uniqueTraders: traders.size, topTraderShare: swaps.length ? { numeratorRaw: String(topTraderSwaps), denominatorRaw: String(swaps.length) } : null, repeatedAmountShare: swaps.length ? { numeratorRaw: String(repeatedAmountSwaps), denominatorRaw: String(swaps.length) } : null, flags: manipulationFlags } };
  }
  botReadiness(staleAfterMs = 120_000, now = Date.now(), poolAddress = null) {
    const health = this.health(staleAfterMs, now);
    const capabilities = this.dataCapabilities(staleAfterMs, now);
    const required = ["canonicalBlocks", "finalizedProvenance", "dexSwaps", "poolLiquidity", "marketPrices", "riskSignals"];
    const risk = poolAddress ? this.poolRisk(poolAddress, staleAfterMs, now) : null; const missing = required.filter((name) => name === "riskSignals" ? !risk?.safeForAutomation : !capabilities[name]); if (!poolAddress) missing.unshift("targetPool");
    return { ready: health.healthy && missing.length === 0, reason: !health.healthy ? "index_unhealthy" : missing.length ? "missing_required_capabilities" : null, targetPool: poolAddress, missing, health: { status: health.status, ageMs: health.ageMs ?? null }, capabilities, risk };
  }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  replayEvents(cursor = this.state.eventSequence) {
    const oldest = this.state.events[0]?.sequence ?? this.state.eventSequence + 1;
    return { cursor, latestCursor: this.state.eventSequence, cursorTooOld: cursor < oldest - 1, events: this.state.events.filter((event) => event.sequence > cursor) };
  }
  health(staleAfterMs = 120_000, now = Date.now()) {
    const stats = this.stats();
    if (stats.tip == null || !stats.updatedAt) return { status: "empty", healthy: false, reason: "no_indexed_blocks", ageMs: null, staleAfterMs, ...stats };
    const newestBlockTime = Object.values(this.state.blocks).reduce((latest, block) => Math.max(latest, Number(block.blockTime ?? 0) * 1_000), 0);
    if (!newestBlockTime) return { status: "unknown_time", healthy: false, reason: "latest_block_has_no_timestamp", ageMs: null, staleAfterMs, ...stats };
    const chain = this.chainQuality();
    if (!chain.canonical) return { status: "chain_conflict", healthy: false, reason: "indexed_parent_hash_mismatch", ageMs: null, staleAfterMs, chain, ...stats };
    const ageMs = now - newestBlockTime; if (ageMs < 0) return { status: "clock_skew", healthy: false, reason: "latest_block_time_is_in_future", latestBlockTime: new Date(newestBlockTime).toISOString(), ageMs, staleAfterMs, chain, ...stats };
    const healthy = ageMs <= staleAfterMs;
    return { status: healthy ? "healthy" : "stale", healthy, reason: healthy ? null : "latest_block_is_stale", latestBlockTime: new Date(newestBlockTime).toISOString(), ageMs, staleAfterMs, chain, ...stats };
  }
  transaction(signature) { return this.state.transactions[signature] ?? null; }
  account(address, limit = 100) { return { address, summary: this.state.accounts[address] ?? null, transactions: Object.values(this.state.transactions).filter((tx) => tx.accounts.includes(address)).sort((a, b) => b.slot - a.slot).slice(0, limit) }; }
  mint(address, limit = 100) { return { address, summary: this.state.mints[address] ?? null, observedHolders: this.holders(address, limit), transfers: this.state.transfers.filter((row) => row.mint === address).sort((a, b) => b.slot - a.slot).slice(0, limit), swaps: this.state.swaps.filter((row) => row.inputMint === address || row.outputMint === address).sort((a, b) => b.slot - a.slot).slice(0, limit) }; }
  tokenAccount(address) { return this.state.tokenAccounts[address] ?? null; }
  holders(mint, limit = 100) {
    const accounts = Object.entries(this.state.tokenAccounts).filter(([, row]) => row.mint === mint && BigInt(row.amountRaw) > 0n); const owners = new Map(); let observedRaw = 0n;
    for (const [tokenAccount, row] of accounts) { observedRaw += BigInt(row.amountRaw); const owner = row.owner ?? `unknown:${tokenAccount}`; const current = owners.get(owner) ?? { owner, amountRaw: 0n, tokenAccounts: 0 }; current.amountRaw += BigInt(row.amountRaw); current.tokenAccounts++; owners.set(owner, current); }
    const ranked = [...owners.values()].sort((a, b) => a.amountRaw === b.amountRaw ? a.owner.localeCompare(b.owner) : a.amountRaw > b.amountRaw ? -1 : 1); const top10Raw = ranked.slice(0, 10).reduce((sum, row) => sum + row.amountRaw, 0n);
    const snapshot = this.state.holderSnapshots[mint] ?? null, complete = Boolean(snapshot?.complete);
    return { mint, coverage: complete ? "finalized_program_account_snapshot_plus_changes" : "observed_changes_only", complete, concentrationAssessable: complete, safeForAutomation: false, exclusionsApplied: false, snapshot, observedTokenAccounts: accounts.length, observedHolders: ranked.length, observedRaw: observedRaw.toString(), top10ObservedRaw: top10Raw.toString(), concentration: observedRaw > 0n ? { numeratorRaw: top10Raw.toString(), denominatorRaw: observedRaw.toString() } : null, holders: ranked.slice(0, limit).map((row) => ({ ...row, amountRaw: row.amountRaw.toString() })) };
  }
  pool(address) { return { address, summary: this.state.pools[address] ?? null, swaps: this.state.swaps.filter((row) => row.pool === address).sort((a, b) => b.slot - a.slot) }; }
  candles(address, intervalSeconds = 60, limit = 300, now = Date.now()) {
    const swaps = this.state.swaps.filter((row) => row.pool === address && row.blockTime != null && row.baseMint && row.quoteMint).sort((a, b) => a.blockTime - b.blockTime || a.slot - b.slot || a.eventIndex - b.eventIndex); const buckets = new Map(); let rejected = 0, futureRejected = 0, pair = null;
    const compare = (left, right) => { const a = BigInt(left.numeratorRaw) * BigInt(right.denominatorRaw), b = BigInt(right.numeratorRaw) * BigInt(left.denominatorRaw); return a === b ? 0 : a < b ? -1 : 1; };
    for (const swap of swaps) {
      if (swap.blockTime * 1_000 > now) { rejected++; futureRejected++; continue; }
      const swapPair = `${swap.baseMint}:${swap.quoteMint}`; if (pair && pair !== swapPair) { rejected++; continue; } pair ??= swapPair;
      const baseRaw = swap.inputMint === swap.baseMint ? swap.inputAmountRaw : swap.outputMint === swap.baseMint ? swap.outputAmountRaw : null; const quoteRaw = swap.inputMint === swap.quoteMint ? swap.inputAmountRaw : swap.outputMint === swap.quoteMint ? swap.outputAmountRaw : null;
      if (!baseRaw || !quoteRaw || BigInt(baseRaw) === 0n) { rejected++; continue; }
      const startTime = Math.floor(swap.blockTime / intervalSeconds) * intervalSeconds; const price = { numeratorRaw: quoteRaw, denominatorRaw: baseRaw }; const row = buckets.get(startTime) ?? { startTime, endTime: startTime + intervalSeconds, open: price, high: price, low: price, close: price, baseVolumeRaw: 0n, quoteVolumeRaw: 0n, trades: 0, firstSlot: swap.slot, lastSlot: swap.slot, baseMint: swap.baseMint, quoteMint: swap.quoteMint, baseDecimals: swap.baseDecimals, quoteDecimals: swap.quoteDecimals, pairIdentitySource: swap.pairIdentitySource };
      if (compare(price, row.high) > 0) row.high = price; if (compare(price, row.low) < 0) row.low = price; row.close = price; row.baseVolumeRaw += BigInt(baseRaw); row.quoteVolumeRaw += BigInt(quoteRaw); row.trades++; row.lastSlot = swap.slot; buckets.set(startTime, row);
    }
    const data = [...buckets.values()].slice(-limit).map((row) => ({ ...row, baseVolumeRaw: row.baseVolumeRaw.toString(), quoteVolumeRaw: row.quoteVolumeRaw.toString(), closed: row.endTime * 1_000 <= now }));
    return { pool: address, intervalSeconds, price: "quote_raw_per_base_raw", exact: true, rejectedSwaps: rejected, futureRejectedSwaps: futureRejected, data };
  }
  trending(limit = 50, windowSeconds = null, now = Date.now()) {
    if (windowSeconds == null) return Object.entries(this.state.mints).map(([mint, row]) => ({ mint, ...row })).sort((a, b) => (b.swapCount ?? 0) - (a.swapCount ?? 0) || (b.transferCount ?? 0) - (a.transferCount ?? 0) || b.lastSlot - a.lastSlot).slice(0, limit);
    const currentSecond = Math.floor(now / 1_000), cutoff = currentSecond - windowSeconds; const rows = new Map();
    const get = (mint) => { const row = rows.get(mint) ?? { mint, swapCount: 0, buyCount: 0, sellCount: 0, transferCount: 0, uniqueTraders: new Set(), protocols: new Set(), lastSlot: 0, lastBlockTime: null }; rows.set(mint, row); return row; };
    for (const swap of this.state.swaps) if (swap.blockTime != null && swap.blockTime >= cutoff && swap.blockTime <= currentSecond) {
      const tradedMint = swap.side === "buy" ? swap.outputMint : swap.side === "sell" ? swap.inputMint : null;
      for (const mint of new Set([swap.inputMint, swap.outputMint])) { const row = get(mint); row.swapCount++; row.lastSlot = Math.max(row.lastSlot, swap.slot); row.lastBlockTime = Math.max(row.lastBlockTime ?? 0, swap.blockTime); row.protocols.add(swap.protocol); if (swap.user) row.uniqueTraders.add(swap.user); if (mint === tradedMint) row[swap.side === "buy" ? "buyCount" : "sellCount"]++; }
    }
    for (const transfer of this.state.transfers) if (transfer.mint && transfer.blockTime != null && transfer.blockTime >= cutoff && transfer.blockTime <= currentSecond) { const row = get(transfer.mint); row.transferCount++; row.lastSlot = Math.max(row.lastSlot, transfer.slot); row.lastBlockTime = Math.max(row.lastBlockTime ?? 0, transfer.blockTime); }
    return [...rows.values()].map((row) => ({ ...row, uniqueTraders: row.uniqueTraders.size, protocols: [...row.protocols].sort() })).sort((a, b) => b.swapCount - a.swapCount || b.uniqueTraders - a.uniqueTraders || b.transferCount - a.transferCount || b.lastSlot - a.lastSlot || a.mint.localeCompare(b.mint)).slice(0, limit);
  }
}
