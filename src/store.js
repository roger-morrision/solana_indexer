import fs from "node:fs/promises";
import path from "node:path";

function emptyState() {
  return { version: 6, tip: null, blocks: {}, transactions: {}, transfers: [], balanceChanges: [], tokenAccounts: {}, swaps: [], pools: {}, accounts: {}, mints: {}, processedFiles: {}, events: [], eventSequence: 0, updatedAt: null };
}

export class IndexStore {
  constructor(filename, maxTransactions = 250_000) { this.filename = filename; this.maxTransactions = maxTransactions; this.state = emptyState(); this.loaded = false; this.listeners = new Set(); this.pendingEvents = []; }
  async load() {
    if (this.loaded) return;
    try { this.state = JSON.parse(await fs.readFile(this.filename, "utf8")); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    this.state.events ??= []; this.state.eventSequence ??= 0; this.state.swaps ??= []; this.state.pools ??= {}; this.state.balanceChanges ??= []; this.state.tokenAccounts ??= {};
    const indices = new Map(); for (const swap of this.state.swaps) if (Number.isSafeInteger(swap.eventIndex)) indices.set(swap.signature, Math.max(indices.get(swap.signature) ?? 0, swap.eventIndex + 1));
    for (const swap of this.state.swaps) if (!swap.swapId) { const eventIndex = indices.get(swap.signature) ?? 0; indices.set(swap.signature, eventIndex + 1); swap.eventIndex = eventIndex; swap.swapId = `${swap.signature}:${eventIndex}`; }
    for (const swap of this.state.swaps) if (!swap.baseMint || !swap.quoteMint) { swap.baseMint = [swap.inputMint, swap.outputMint].sort()[0]; swap.quoteMint = swap.baseMint === swap.inputMint ? swap.outputMint : swap.inputMint; swap.pairIdentitySource = "canonical_lexical"; swap.baseDecimals = swap.baseMint === swap.inputMint ? swap.inputDecimals : swap.outputDecimals; swap.quoteDecimals = swap.quoteMint === swap.inputMint ? swap.inputDecimals : swap.outputDecimals; }
    this.state.version = 6; this.rebuildTokenAccounts();
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
  hasFile(name, fingerprint) { return this.state.processedFiles[name] === fingerprint; }
  markFile(name, fingerprint) { this.state.processedFiles[name] = fingerprint; }
  apply(block) {
    const slot = String(block.slot);
    const prior = this.state.blocks[slot];
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
    if (prior) this.removeSlot(block.slot);
    this.state.blocks[slot] = { blockhash: block.blockhash, previousBlockhash: block.previousBlockhash, parentSlot: block.parentSlot, blockTime: block.blockTime, provenance: block.provenance, transactionCount: block.transactions.length, transferCount: block.transfers.length };
    for (const transaction of block.transactions) {
      this.state.transactions[transaction.signature] = transaction;
      for (const account of transaction.accounts) {
        const current = this.state.accounts[account] ?? { transactionCount: 0, successfulTransactionCount: 0, lastSlot: 0 };
        current.transactionCount += 1; current.successfulTransactionCount += transaction.success ? 1 : 0; current.lastSlot = Math.max(current.lastSlot, transaction.slot);
        this.state.accounts[account] = current;
      }
    }
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
      this.state.pools[swap.pool] = { ...current, swapCount: current.swapCount + 1, venueType: swap.venueType, baseMint: swap.baseMint, quoteMint: swap.quoteMint, pairIdentitySource: swap.pairIdentitySource, lastSlot: swap.slot, lastBlockTime: swap.blockTime, inputMint: swap.inputMint, outputMint: swap.outputMint, inputVaultBeforeRaw: swap.inputVaultBeforeRaw, outputVaultBeforeRaw: swap.outputVaultBeforeRaw, reserveTiming: swap.reserveTiming, realTokenReservesRaw: swap.realTokenReservesRaw, realQuoteReservesRaw: swap.realQuoteReservesRaw, virtualTokenReservesRaw: swap.virtualTokenReservesRaw, virtualQuoteReservesRaw: swap.virtualQuoteReservesRaw, mayhemMode: swap.mayhemMode, executionPrice: { numeratorRaw: swap.outputAmountRaw, denominatorRaw: swap.inputAmountRaw, inputDecimals: swap.inputDecimals, outputDecimals: swap.outputDecimals } };
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
      this.state.pools[swap.pool] = { ...current, swapCount: current.swapCount + 1, venueType: swap.venueType, baseMint: swap.baseMint, quoteMint: swap.quoteMint, pairIdentitySource: swap.pairIdentitySource, lastSlot: swap.slot, lastBlockTime: swap.blockTime, inputMint: swap.inputMint, outputMint: swap.outputMint, inputVaultBeforeRaw: swap.inputVaultBeforeRaw, outputVaultBeforeRaw: swap.outputVaultBeforeRaw, reserveTiming: swap.reserveTiming, realTokenReservesRaw: swap.realTokenReservesRaw, realQuoteReservesRaw: swap.realQuoteReservesRaw, virtualTokenReservesRaw: swap.virtualTokenReservesRaw, virtualQuoteReservesRaw: swap.virtualQuoteReservesRaw, mayhemMode: swap.mayhemMode, executionPrice: { numeratorRaw: swap.outputAmountRaw, denominatorRaw: swap.inputAmountRaw, inputDecimals: swap.inputDecimals, outputDecimals: swap.outputDecimals } };
      for (const mint of [swap.inputMint, swap.outputMint]) { const row = this.state.mints[mint] ?? { transferCount: 0, swapCount: 0, lastSlot: 0, lastBlockTime: null }; row.swapCount = (row.swapCount ?? 0) + 1; row.lastSlot = Math.max(row.lastSlot, swap.slot); row.lastBlockTime = Math.max(row.lastBlockTime ?? 0, swap.blockTime ?? 0) || null; this.state.mints[mint] = row; }
    }
  }
  prune() {
    const rows = Object.values(this.state.transactions);
    if (rows.length <= this.maxTransactions) return;
    const keep = new Set(rows.sort((a, b) => b.slot - a.slot).slice(0, this.maxTransactions).map((row) => row.signature));
    for (const signature of Object.keys(this.state.transactions)) if (!keep.has(signature)) delete this.state.transactions[signature];
    this.state.transfers = this.state.transfers.filter((row) => keep.has(row.signature));
    this.state.balanceChanges = this.state.balanceChanges.filter((row) => keep.has(row.signature));
    this.state.swaps = this.state.swaps.filter((row) => keep.has(row.signature));
    this.rebuildAggregates();
  }
  rebuildTokenAccounts() {
    this.state.tokenAccounts = {};
    for (const change of [...this.state.balanceChanges].sort((a, b) => a.slot - b.slot)) this.state.tokenAccounts[change.tokenAccount] = { mint: change.mint, owner: change.owner, programId: change.programId, decimals: change.decimals, amountRaw: change.postAmountRaw, lastSlot: change.slot, lastSignature: change.signature, closed: change.closed };
  }
  computeTip() { const slots = Object.keys(this.state.blocks).map(Number); return slots.length ? Math.max(...slots) : null; }
  stats() {
    const tipBlock = this.state.tip == null ? null : this.state.blocks[String(this.state.tip)];
    return { tip: this.state.tip, blocks: Object.keys(this.state.blocks).length, transactions: Object.keys(this.state.transactions).length, transfers: this.state.transfers.length, balanceChanges: this.state.balanceChanges.length, tokenAccounts: Object.keys(this.state.tokenAccounts).length, swaps: this.state.swaps.length, pools: Object.keys(this.state.pools).length, accounts: Object.keys(this.state.accounts).length, mints: Object.keys(this.state.mints).length, updatedAt: this.state.updatedAt, ingestion: { source: tipBlock?.provenance?.source ?? "unknown", commitment: tipBlock?.provenance?.commitment ?? "unknown", sourceTip: tipBlock?.provenance?.sourceTip ?? null, exportLagSlots: tipBlock?.provenance?.exportLagSlots ?? null } };
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
      completeHolderSnapshots: false,
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
    const latestBlockTime = swaps.reduce((latest, row) => Math.max(latest, Number(row.blockTime ?? 0) * 1_000), 0); const ageMs = latestBlockTime ? Math.max(0, now - latestBlockTime) : null;
    const flags = []; if (signatures.size < 20) flags.push("insufficient_observations"); if (directions.size < 2) flags.push("one_sided_flow"); if (swapIds.size !== swaps.length) flags.push("duplicate_swap_ids"); if (!swaps.length || swaps.some((row) => row.provenance?.commitment !== "finalized")) flags.push("unfinalized_or_unknown_provenance"); if (ageMs == null || ageMs > staleAfterMs) flags.push("stale_market_activity");
    const assessable = flags.length === 0; const blockers = ["mint_authority_unknown", "freeze_authority_unknown", "holder_concentration_unknown", "manipulation_detection_unavailable"];
    return { pool: address, assessable, dataQualityPass: assessable, safeForAutomation: false, scope: "data_quality_only", observations: swaps.length, uniqueSignatures: signatures.size, directions: directions.size, latestBlockTime: latestBlockTime ? new Date(latestBlockTime).toISOString() : null, ageMs, flags, blockers };
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
    const ageMs = Math.max(0, now - newestBlockTime);
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
    return { mint, coverage: "observed_changes_only", complete: false, safeForAutomation: false, observedTokenAccounts: accounts.length, observedHolders: ranked.length, observedRaw: observedRaw.toString(), top10ObservedRaw: top10Raw.toString(), concentration: observedRaw > 0n ? { numeratorRaw: top10Raw.toString(), denominatorRaw: observedRaw.toString() } : null, holders: ranked.slice(0, limit).map((row) => ({ ...row, amountRaw: row.amountRaw.toString() })) };
  }
  pool(address) { return { address, summary: this.state.pools[address] ?? null, swaps: this.state.swaps.filter((row) => row.pool === address).sort((a, b) => b.slot - a.slot) }; }
  candles(address, intervalSeconds = 60, limit = 300, now = Date.now()) {
    const swaps = this.state.swaps.filter((row) => row.pool === address && row.blockTime != null && row.baseMint && row.quoteMint).sort((a, b) => a.blockTime - b.blockTime || a.slot - b.slot || a.eventIndex - b.eventIndex); const buckets = new Map(); let rejected = 0, pair = null;
    const compare = (left, right) => { const a = BigInt(left.numeratorRaw) * BigInt(right.denominatorRaw), b = BigInt(right.numeratorRaw) * BigInt(left.denominatorRaw); return a === b ? 0 : a < b ? -1 : 1; };
    for (const swap of swaps) {
      const swapPair = `${swap.baseMint}:${swap.quoteMint}`; if (pair && pair !== swapPair) { rejected++; continue; } pair ??= swapPair;
      const baseRaw = swap.inputMint === swap.baseMint ? swap.inputAmountRaw : swap.outputMint === swap.baseMint ? swap.outputAmountRaw : null; const quoteRaw = swap.inputMint === swap.quoteMint ? swap.inputAmountRaw : swap.outputMint === swap.quoteMint ? swap.outputAmountRaw : null;
      if (!baseRaw || !quoteRaw || BigInt(baseRaw) === 0n) { rejected++; continue; }
      const startTime = Math.floor(swap.blockTime / intervalSeconds) * intervalSeconds; const price = { numeratorRaw: quoteRaw, denominatorRaw: baseRaw }; const row = buckets.get(startTime) ?? { startTime, endTime: startTime + intervalSeconds, open: price, high: price, low: price, close: price, baseVolumeRaw: 0n, quoteVolumeRaw: 0n, trades: 0, firstSlot: swap.slot, lastSlot: swap.slot, baseMint: swap.baseMint, quoteMint: swap.quoteMint, baseDecimals: swap.baseDecimals, quoteDecimals: swap.quoteDecimals, pairIdentitySource: swap.pairIdentitySource };
      if (compare(price, row.high) > 0) row.high = price; if (compare(price, row.low) < 0) row.low = price; row.close = price; row.baseVolumeRaw += BigInt(baseRaw); row.quoteVolumeRaw += BigInt(quoteRaw); row.trades++; row.lastSlot = swap.slot; buckets.set(startTime, row);
    }
    const data = [...buckets.values()].slice(-limit).map((row) => ({ ...row, baseVolumeRaw: row.baseVolumeRaw.toString(), quoteVolumeRaw: row.quoteVolumeRaw.toString(), closed: row.endTime * 1_000 <= now }));
    return { pool: address, intervalSeconds, price: "quote_raw_per_base_raw", exact: true, rejectedSwaps: rejected, data };
  }
  trending(limit = 50, windowSeconds = null, now = Date.now()) {
    if (windowSeconds == null) return Object.entries(this.state.mints).map(([mint, row]) => ({ mint, ...row })).sort((a, b) => (b.swapCount ?? 0) - (a.swapCount ?? 0) || (b.transferCount ?? 0) - (a.transferCount ?? 0) || b.lastSlot - a.lastSlot).slice(0, limit);
    const cutoff = Math.floor(now / 1_000) - windowSeconds; const rows = new Map();
    const get = (mint) => { const row = rows.get(mint) ?? { mint, swapCount: 0, buyCount: 0, sellCount: 0, transferCount: 0, uniqueTraders: new Set(), protocols: new Set(), lastSlot: 0, lastBlockTime: null }; rows.set(mint, row); return row; };
    for (const swap of this.state.swaps) if (swap.blockTime != null && swap.blockTime >= cutoff) {
      const tradedMint = swap.side === "buy" ? swap.outputMint : swap.side === "sell" ? swap.inputMint : null;
      for (const mint of new Set([swap.inputMint, swap.outputMint])) { const row = get(mint); row.swapCount++; row.lastSlot = Math.max(row.lastSlot, swap.slot); row.lastBlockTime = Math.max(row.lastBlockTime ?? 0, swap.blockTime); row.protocols.add(swap.protocol); if (swap.user) row.uniqueTraders.add(swap.user); if (mint === tradedMint) row[swap.side === "buy" ? "buyCount" : "sellCount"]++; }
    }
    for (const transfer of this.state.transfers) if (transfer.mint && transfer.blockTime != null && transfer.blockTime >= cutoff) { const row = get(transfer.mint); row.transferCount++; row.lastSlot = Math.max(row.lastSlot, transfer.slot); row.lastBlockTime = Math.max(row.lastBlockTime ?? 0, transfer.blockTime); }
    return [...rows.values()].map((row) => ({ ...row, uniqueTraders: row.uniqueTraders.size, protocols: [...row.protocols].sort() })).sort((a, b) => b.swapCount - a.swapCount || b.uniqueTraders - a.uniqueTraders || b.transferCount - a.transferCount || b.lastSlot - a.lastSlot || a.mint.localeCompare(b.mint)).slice(0, limit);
  }
}
