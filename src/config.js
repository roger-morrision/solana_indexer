import path from "node:path";

export function loadConfig(env = process.env, cwd = process.cwd()) {
  const apiKeys = (env.INDEXER_API_KEYS || "").split(",").map((value) => value.trim()).filter(Boolean);
  const host = env.INDEXER_HOST || "127.0.0.1";
  if (!["127.0.0.1", "localhost", "::1"].includes(host) && apiKeys.length === 0) throw new Error("INDEXER_API_KEYS is required when INDEXER_HOST is not loopback");
  return {
    inbox: path.resolve(cwd, env.INDEXER_INBOX || "inbox"),
    dataFile: path.resolve(cwd, env.INDEXER_DATA_FILE || "data/index.json"),
    exporterStatusFile: path.resolve(cwd, env.EXPORTER_STATUS_FILE || "data/exporter-status.json"),
    host,
    port: boundedInt(env.INDEXER_PORT, 8787, 1, 65535),
    pollMs: boundedInt(env.INDEXER_POLL_MS, 1000, 100, 60_000),
    staleAfterMs: boundedInt(env.INDEXER_STALE_AFTER_MS, 120_000, 1_000, 86_400_000),
    maxTransactions: boundedInt(env.INDEXER_MAX_TRANSACTIONS, 250_000, 1000, 2_000_000),
    apiKeys,
    rateLimitPerMinute: boundedInt(env.INDEXER_RATE_LIMIT_PER_MINUTE, 600, 1, 100_000),
    webSocketHeartbeatMs: boundedInt(env.INDEXER_WS_HEARTBEAT_MS, 30_000, 1_000, 300_000),
    webSocketMaxBufferedBytes: boundedInt(env.INDEXER_WS_MAX_BUFFERED_BYTES, 1_048_576, 65_536, 16_777_216),
    streamReconnectMinMs: boundedInt(env.INDEXER_STREAM_RECONNECT_MIN_MS, 500, 100, 60_000),
    streamReconnectMaxMs: boundedInt(env.INDEXER_STREAM_RECONNECT_MAX_MS, 30_000, 1_000, 300_000),
  };
}

function boundedInt(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}
