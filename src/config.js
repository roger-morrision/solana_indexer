import path from "node:path";

export function loadConfig(env = process.env, cwd = process.cwd()) {
  return {
    inbox: path.resolve(cwd, env.INDEXER_INBOX || "inbox"),
    dataFile: path.resolve(cwd, env.INDEXER_DATA_FILE || "data/index.json"),
    exporterStatusFile: path.resolve(cwd, env.EXPORTER_STATUS_FILE || "data/exporter-status.json"),
    host: env.INDEXER_HOST || "127.0.0.1",
    port: boundedInt(env.INDEXER_PORT, 8787, 1, 65535),
    pollMs: boundedInt(env.INDEXER_POLL_MS, 1000, 100, 60_000),
    staleAfterMs: boundedInt(env.INDEXER_STALE_AFTER_MS, 120_000, 1_000, 86_400_000),
    maxTransactions: boundedInt(env.INDEXER_MAX_TRANSACTIONS, 250_000, 1000, 2_000_000),
  };
}

function boundedInt(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}
