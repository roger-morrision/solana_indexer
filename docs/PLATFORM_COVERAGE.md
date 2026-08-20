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
| Token balances/observed holders | partial | loaded-address-aware exact deltas and reorg rebuild | canonical account snapshot service |
| Protocol swaps | partial | Raydium CPMM, PumpSwap, Pump bonding curve | remaining registry entries and fixture-backed decoders |
| OHLCV | partial | exact raw 1m/5m/15m/1h/4h/1d pool candles | unique traders, USD/native references and late-event worker |
| Internal evidence API | partial | authenticated token, market, holders, trades, OHLCV, liquidity, trending, candidates, feed health/gaps | authority, routes, wallet performance and risk workers |
| PostgreSQL/ClickHouse/Redis | deployable, not integrated | reviewed-image-required Compose, secret files, loopback ports, health checks, PostgreSQL metadata/ops schema and ClickHouse immutable-event schema | connector interfaces and verified dual-write migration |
| Object storage | contract pending | secrets and generated archives remain excluded from Git | select approved S3-compatible implementation, retention and backup policy |
| Yellowstone/Geyser | missing | no speculative client | reviewed protobuf/plugin release and deployment |
| Executable routing | external by design initially | explicit unavailable response | approved Jupiter integration or local router |
| Social/news/CEX context | out of scope | never presented as on-chain evidence | approved external research sources |
