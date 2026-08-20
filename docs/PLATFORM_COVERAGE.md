# Terminal DEX platform coverage

This is the implementation ledger for the supplied target architecture. A row
is complete only when production code, fail-closed behavior, and regression
coverage exist. Unsupported fields are returned as missing; they are never
synthetically populated.

| Capability | Status | Current implementation | Next dependency |
|---|---|---|---|
| Mainnet RPC | deployable, not running here | non-voting Agave unit, genesis verifier, private loopback RPC | production Ubuntu hosts and snapshots |
| Secondary RPC/load balancing | missing | none | second host and operator network decision |
| Confirmed/finalized streaming | complete for block PubSub | serialized stream, durable status, gap repair, fork promotion | Yellowstone parallel lane |
| Immutable instruction facts | complete in compatibility store | stable location identity, registry version, decoder version and payload hash | ClickHouse sink |
| Dead letters/checkpoints/reorg corrections | complete in compatibility store | bounded persisted evidence and REST health exposure | object storage and operational retry commands |
| Token balances/observed holders | deployable partial | finalized SPL/Token-2022 account snapshots overlaid with loaded-address-aware exact deltas; monotonic snapshot slots and reorg rebuild | authoritative pool/burn/locker/exchange exclusions and periodic scheduler |
| Protocol swaps | partial | Raydium CPMM, PumpSwap, Pump bonding curve | remaining registry entries and fixture-backed decoders |
| OHLCV | partial | exact raw 1m/5m/15m/1h/4h/1d pool candles | unique traders, USD/native references and late-event worker |
| Internal evidence API | partial | authenticated token, market, snapshot-backed security/holders, trades, OHLCV, liquidity, trending, candidates, exact partial wallet performance, feed health/gaps | routes, USD references and complete risk workers |
| PostgreSQL/ClickHouse/Redis | deployable, not integrated | reviewed-image-required Compose, secret files, loopback ports, health checks, PostgreSQL metadata/ops schema and ClickHouse immutable-event schema | connector interfaces and verified dual-write migration |
| Object storage | deployable contract | checksummed multi-store backup with optional operator-approved S3-compatible upload; credentials and archives excluded | select endpoint, encryption/object-lock and retention policy; conduct restore drill |
| Yellowstone/Geyser | blocked on compatible release | repository Agave 3.1.14 cannot load current Yellowstone 14.2.2 built for Agave 4.1.0 | operator-approved Agave 4.1 upgrade or reviewed Yellowstone 11.x pin; load/leak qualification |
| Executable routing | external by design initially | explicit unavailable response | approved Jupiter integration or local router |
| Security/liquidity/manipulation | partial, fail closed | finalized authority/extensions, holder evidence, exact venue reserve coverage, trader coverage/concentration and repeated-amount signals | holder exclusions, funding clusters, locks, executable sell route and protocol-specific liquidity state |
| Smart money | evidence only | exact partial cost basis/PnL and activity profile | complete wallet history, USD references, funding graph and sybil clustering |
| mTLS/SLO/backup | deployable | optional mTLS gateway, Prometheus endpoint, alert rules, stated SLO/RPO/RTO and checksum-gated restore | production PKI, monitoring destination and quarterly recovery drill |
| Social/news/CEX context | out of scope | never presented as on-chain evidence | approved external research sources |
