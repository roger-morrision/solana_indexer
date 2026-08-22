import path from "node:path";

export function loadConfig(env = process.env, cwd = process.cwd()) {
  const apiKeys = (env.INDEXER_API_KEYS || "").split(",").map((value) => value.trim()).filter(Boolean);
  const host = env.INDEXER_HOST || "127.0.0.1";
  if (!["127.0.0.1", "localhost", "::1"].includes(host) && apiKeys.length === 0 && !env.INDEXER_API_TENANTS_FILE) throw new Error("INDEXER_API_KEYS or INDEXER_API_TENANTS_FILE is required when INDEXER_HOST is not loopback");
  if (!["127.0.0.1", "localhost", "::1"].includes(host) && !env.INDEXER_AUDIT_LOG_FILE) throw new Error("INDEXER_AUDIT_LOG_FILE is required when INDEXER_HOST is not loopback");
  return {
    inbox: path.resolve(cwd, env.INDEXER_INBOX || "inbox"),
    dataFile: path.resolve(cwd, env.INDEXER_DATA_FILE || "data/index.json"),
    exporterStatusFile: path.resolve(cwd, env.EXPORTER_STATUS_FILE || "data/exporter-status.json"),
    holderExclusionsFile: env.HOLDER_EXCLUSIONS_FILE ? path.resolve(cwd, env.HOLDER_EXCLUSIONS_FILE) : null,
    usdDepegReferenceFile: env.USD_DEPEG_REFERENCE_FILE ? path.resolve(cwd, env.USD_DEPEG_REFERENCE_FILE) : null,
    usdcMaxDeviationBasisPoints: boundedInt(env.USDC_MAX_DEVIATION_BASIS_POINTS, 200, 1, 5_000),
    accountSnapshotFile: path.resolve(cwd, env.ACCOUNT_SNAPSHOT_FILE || "data/account-snapshot.json"),
    cpmmPoolSnapshotFile: path.resolve(cwd, env.CPMM_POOL_SNAPSHOT_FILE || "data/cpmm-pool-snapshot.json"),
    pumpSwapPoolSnapshotFile: path.resolve(cwd, env.PUMP_SWAP_POOL_SNAPSHOT_FILE || "data/pump-swap-pool-snapshot.json"),
    pumpBondingCurveSnapshotFile: path.resolve(cwd, env.PUMP_BONDING_CURVE_SNAPSHOT_FILE || "data/pump-bonding-curve-snapshot.json"),
    clmmPoolSnapshotFile: path.resolve(cwd, env.CLMM_POOL_SNAPSHOT_FILE || "data/clmm-pool-snapshot.json"),
    orcaPoolSnapshotFile: path.resolve(cwd, env.ORCA_POOL_SNAPSHOT_FILE || "data/orca-pool-snapshot.json"),
    offchainMetadataSnapshotFile: path.resolve(cwd, env.OFFCHAIN_METADATA_SNAPSHOT_FILE || "data/offchain-metadata-snapshot.json"),
    auditLogFile: env.INDEXER_AUDIT_LOG_FILE ? path.resolve(cwd, env.INDEXER_AUDIT_LOG_FILE) : null,
    apiTenantsFile: env.INDEXER_API_TENANTS_FILE ? path.resolve(cwd, env.INDEXER_API_TENANTS_FILE) : null,
    warehouseCheckpointFile: path.resolve(cwd, env.INDEXER_WAREHOUSE_CHECKPOINT_FILE || "data/warehouse-checkpoint.json"),
    clickhousePasswordFile: env.CLICKHOUSE_PASSWORD_FILE ? path.resolve(cwd, env.CLICKHOUSE_PASSWORD_FILE) : null,
    redisPasswordFile: env.REDIS_PASSWORD_FILE ? path.resolve(cwd, env.REDIS_PASSWORD_FILE) : null,
    redisHotTtlSeconds: boundedInt(env.INDEXER_REDIS_HOT_TTL_SECONDS, 86_400, 300, 604_800),
    redisHotMaxBytes: boundedInt(env.INDEXER_REDIS_HOT_MAX_BYTES, 16_777_216, 65_536, 134_217_728),
    distributedQuotaEnabled: env.INDEXER_DISTRIBUTED_QUOTA === "true",
    redisHost: env.INDEXER_REDIS_HOST || "127.0.0.1",
    redisPort: boundedInt(env.INDEXER_REDIS_PORT, 6379, 1, 65_535),
    redisQuotaTimeoutMs: boundedInt(env.INDEXER_REDIS_QUOTA_TIMEOUT_MS, 250, 10, 5_000),
    operationalJobLeaseSeconds: boundedInt(env.INDEXER_OPERATIONAL_JOB_LEASE_SECONDS, 300, 30, 3_600),
    operationalJobMaxAttempts: boundedInt(env.INDEXER_OPERATIONAL_JOB_MAX_ATTEMPTS, 5, 1, 20),
    operationalJobBackoffSeconds: boundedInt(env.INDEXER_OPERATIONAL_JOB_BACKOFF_SECONDS, 30, 1, 3_600),
    host,
    port: boundedInt(env.INDEXER_PORT, 8787, 1, 65535),
    pollMs: boundedInt(env.INDEXER_POLL_MS, 1000, 100, 60_000),
    staleAfterMs: boundedInt(env.INDEXER_STALE_AFTER_MS, 120_000, 1_000, 86_400_000),
    maxExporterLagSlots: boundedInt(env.INDEXER_MAX_EXPORT_LAG_SLOTS, 512, 0, 1_000_000),
    warehouseStaleAfterMs: boundedInt(env.INDEXER_WAREHOUSE_STALE_AFTER_MS, 300_000, 10_000, 86_400_000),
    maxWarehouseLagEvents: boundedInt(env.INDEXER_MAX_WAREHOUSE_LAG_EVENTS, 1_000, 0, 1_000_000),
    maxTransactions: boundedInt(env.INDEXER_MAX_TRANSACTIONS, 250_000, 1000, 2_000_000),
    retentionSeconds: boundedInt(env.INDEXER_RETENTION_SECONDS, 604_800, 3_600, 31_536_000),
    apiKeys,
    rateLimitPerMinute: boundedInt(env.INDEXER_RATE_LIMIT_PER_MINUTE, 600, 1, 100_000),
    auditRetentionDays: boundedInt(env.INDEXER_AUDIT_RETENTION_DAYS, 30, 1, 3_650),
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
