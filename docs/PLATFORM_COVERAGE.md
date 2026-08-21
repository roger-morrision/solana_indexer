# Terminal DEX platform coverage

This is the implementation ledger for the supplied target architecture. A row
is complete only when production code, fail-closed behavior, and regression
coverage exist. Unsupported fields are returned as missing; they are never
synthetically populated.

| Capability | Status | Current implementation | Next dependency |
|---|---|---|---|
| Mainnet RPC | deployable, not running here | non-voting Agave unit, genesis verifier, private loopback RPC | production Ubuntu hosts and snapshots |
| Secondary RPC/load balancing | missing | none | second host and operator network decision |
| Reduced external RPC | deployable, credentials configured locally | supervised Linux units and bounded Docker Desktop profile/preflight, Helius primary, Alchemy failover, redacted telemetry, Retry-After circuits, strict mainnet genesis, durable fail-closed exporter health probe/metrics; public RPC health/emergency-only | reviewed Node image digest, non-placeholder API key, healthy Docker daemon, operator start and quota monitoring |
| Confirmed/finalized streaming | complete for block PubSub | serialized stream, durable status, gap repair, fork promotion | Yellowstone parallel lane |
| Immutable instruction facts | complete in compatibility store | stable location identity, registry version, decoder version and payload hash | ClickHouse sink |
| Dead letters/checkpoints/reorg corrections | complete in compatibility store | bounded persisted evidence, dry-run-first exact-fingerprint reconciliation, resolution/reopen lifecycle, REST health, and archive-receipt/checkpoint-gated raw inbox retention | protocol-aware retry queue and durable database sink |
| Token balances/observed holders | deployable partial | finalized SPL/Token-2022 account snapshots overlaid with loaded-address-aware exact deltas; monotonic snapshot slots and reorg rebuild | authoritative pool/burn/locker/exchange exclusions and periodic scheduler |
| Protocol swaps | partial | fixture-backed Raydium CPMM/CLMM, PumpSwap, Pump bonding curve; finalized CLMM PoolState/vault/TickArrayState snapshots include the default bitmap, exact initialized ticks, and pool-bound overflow bitmaps with verified signed tick-array indexes | remaining registry entries and fixture-backed decoders |
| OHLCV/pricing | deployable partial | exact raw candles and exact nominal USD references through fresh finalized direct-USDC or wrapped-SOL paths | self-hosted depeg reference, multi-venue TWAP and late-event worker |
| Internal evidence API | partial | authenticated token, market, snapshot-backed security/holders, trades, OHLCV, liquidity, trending, candidates, exact partial wallet performance, feed health/gaps | routes, USD references and complete risk workers |
| PostgreSQL/ClickHouse/Redis | deployable, not integrated | reviewed-image-required Compose, secret files, loopback ports, health checks, PostgreSQL metadata/ops schema and ClickHouse immutable-event schema | connector interfaces and verified dual-write migration |
| Object storage | self-hosted deployable | loopback SeaweedFS master/volume/filer plus reduced-mode verified gzip raw archive, checksum/receipt-gated retention, no S3/cloud dependency | multi-host replication, encryption/retention policy and restore drill |
| Yellowstone/Geyser | blocked on compatible release | repository Agave 3.1.14 cannot load current Yellowstone 14.2.2 built for Agave 4.1.0 | operator-approved Agave 4.1 upgrade or reviewed Yellowstone 11.x pin; load/leak qualification |
| Executable routing | self-hosted blocker | explicit unavailable response; no Jupiter dependency | protocol account-state decoders and transaction builders for supported local venues |
| Security/liquidity/manipulation | partial, fail closed | finalized authority/extensions, holder evidence, exact venue reserve coverage, trader coverage/concentration and repeated-amount signals | holder exclusions, funding clusters, locks, executable sell route and protocol-specific liquidity state |
| Smart money | evidence only | exact partial cost basis/PnL and activity profile | complete wallet history, USD references, funding graph and sybil clustering |
| mTLS/SLO/backup | deployable | optional mTLS gateway, Prometheus endpoint, alert rules, stated SLO/RPO/RTO and checksum-gated restore | production PKI, monitoring destination and quarterly recovery drill |
| Social/news/CEX context | out of scope | never presented as on-chain evidence | approved external research sources |
