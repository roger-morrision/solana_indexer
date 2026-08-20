import fs from "node:fs/promises";
import path from "node:path";

function emptyState() {
  return { version: 2, tip: null, blocks: {}, transactions: {}, transfers: [], accounts: {}, mints: {}, processedFiles: {}, events: [], eventSequence: 0, updatedAt: null };
}

export class IndexStore {
  constructor(filename, maxTransactions = 250_000) { this.filename = filename; this.maxTransactions = maxTransactions; this.state = emptyState(); this.loaded = false; this.listeners = new Set(); this.pendingEvents = []; }
  async load() {
    if (this.loaded) return;
    try { this.state = JSON.parse(await fs.readFile(this.filename, "utf8")); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    this.state.events ??= []; this.state.eventSequence ??= 0; this.state.version = 2;
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
    if (prior && prior.blockhash === block.blockhash) return { inserted: false, reason: "duplicate" };
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
    for (const transfer of block.transfers) if (transfer.mint) {
      const current = this.state.mints[transfer.mint] ?? { transferCount: 0, lastSlot: 0, lastBlockTime: null };
      current.transferCount += 1; current.lastSlot = Math.max(current.lastSlot, transfer.slot); current.lastBlockTime = Math.max(current.lastBlockTime ?? 0, transfer.blockTime ?? 0) || null;
      this.state.mints[transfer.mint] = current;
    }
    this.prune();
    this.state.tip = this.computeTip();
    const event = { sequence: ++this.state.eventSequence, type: prior ? "block_replaced" : "block_indexed", slot: block.slot, blockhash: block.blockhash, parentSlot: block.parentSlot, blockTime: block.blockTime, transactionCount: block.transactions.length, transferCount: block.transfers.length, provenance: block.provenance };
    this.state.events.push(event); if (this.state.events.length > 10_000) this.state.events.splice(0, this.state.events.length - 10_000); this.pendingEvents.push(event);
    return { inserted: true, reason: prior ? "replaced" : "new" };
  }
  removeSlot(slot) {
    const signatures = new Set(Object.values(this.state.transactions).filter((tx) => tx.slot === slot).map((tx) => tx.signature));
    for (const signature of signatures) delete this.state.transactions[signature];
    this.state.transfers = this.state.transfers.filter((row) => row.slot !== slot);
    delete this.state.blocks[String(slot)];
    this.rebuildAggregates();
  }
  rebuildAggregates() {
    this.state.accounts = {}; this.state.mints = {};
    for (const tx of Object.values(this.state.transactions)) for (const account of tx.accounts) {
      const row = this.state.accounts[account] ?? { transactionCount: 0, successfulTransactionCount: 0, lastSlot: 0 };
      row.transactionCount++; row.successfulTransactionCount += tx.success ? 1 : 0; row.lastSlot = Math.max(row.lastSlot, tx.slot); this.state.accounts[account] = row;
    }
    for (const transfer of this.state.transfers) if (transfer.mint) {
      const row = this.state.mints[transfer.mint] ?? { transferCount: 0, lastSlot: 0, lastBlockTime: null };
      row.transferCount++; row.lastSlot = Math.max(row.lastSlot, transfer.slot); row.lastBlockTime = Math.max(row.lastBlockTime ?? 0, transfer.blockTime ?? 0) || null; this.state.mints[transfer.mint] = row;
    }
  }
  prune() {
    const rows = Object.values(this.state.transactions);
    if (rows.length <= this.maxTransactions) return;
    const keep = new Set(rows.sort((a, b) => b.slot - a.slot).slice(0, this.maxTransactions).map((row) => row.signature));
    for (const signature of Object.keys(this.state.transactions)) if (!keep.has(signature)) delete this.state.transactions[signature];
    this.state.transfers = this.state.transfers.filter((row) => keep.has(row.signature));
    this.rebuildAggregates();
  }
  computeTip() { const slots = Object.keys(this.state.blocks).map(Number); return slots.length ? Math.max(...slots) : null; }
  stats() {
    const tipBlock = this.state.tip == null ? null : this.state.blocks[String(this.state.tip)];
    return { tip: this.state.tip, blocks: Object.keys(this.state.blocks).length, transactions: Object.keys(this.state.transactions).length, transfers: this.state.transfers.length, accounts: Object.keys(this.state.accounts).length, mints: Object.keys(this.state.mints).length, updatedAt: this.state.updatedAt, ingestion: { source: tipBlock?.provenance?.source ?? "unknown", commitment: tipBlock?.provenance?.commitment ?? "unknown", sourceTip: tipBlock?.provenance?.sourceTip ?? null, exportLagSlots: tipBlock?.provenance?.exportLagSlots ?? null } };
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
  dataCapabilities() {
    const blocks = Object.values(this.state.blocks);
    const finalizedBlocks = blocks.filter((block) => block.provenance?.commitment === "finalized").length;
    return {
      canonicalBlocks: blocks.length > 0,
      finalizedProvenance: blocks.length > 0 && finalizedBlocks === blocks.length,
      splTransfers: this.state.transfers.length > 0,
      dexSwaps: false,
      poolLiquidity: false,
      marketPrices: false,
      riskSignals: false,
      finalizedBlocks,
      totalBlocks: blocks.length,
    };
  }
  botReadiness(staleAfterMs = 120_000, now = Date.now()) {
    const health = this.health(staleAfterMs, now);
    const capabilities = this.dataCapabilities();
    const required = ["canonicalBlocks", "finalizedProvenance", "dexSwaps", "poolLiquidity", "marketPrices", "riskSignals"];
    const missing = required.filter((name) => !capabilities[name]);
    return { ready: health.healthy && missing.length === 0, reason: !health.healthy ? "index_unhealthy" : missing.length ? "missing_required_capabilities" : null, missing, health: { status: health.status, ageMs: health.ageMs ?? null }, capabilities };
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
  mint(address, limit = 100) { return { address, summary: this.state.mints[address] ?? null, transfers: this.state.transfers.filter((row) => row.mint === address).sort((a, b) => b.slot - a.slot).slice(0, limit) }; }
  trending(limit = 50) { return Object.entries(this.state.mints).map(([mint, row]) => ({ mint, ...row })).sort((a, b) => b.transferCount - a.transferCount || b.lastSlot - a.lastSlot).slice(0, limit); }
}
