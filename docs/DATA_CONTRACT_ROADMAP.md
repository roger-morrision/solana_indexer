# Data contract and roadmap

This matrix describes verified capabilities, not aspirational marketing claims.

| Consumer | Required data | Current source | Normalized contract | Freshness / safety | Exposure | Coverage |
|---|---|---|---|---|---|---|
| Terminal DEX activity | provisional and canonical blocks, transactions, transfers and swaps | local Agave confirmed/finalized PubSub plus HTTP gap repair | exact slots, hashes, signatures, per-transaction event index/swap ID, commitment, string base-unit amounts | finalized promotion, downgrade refusal, source deduplication, stale/conflict health | REST/RPC/WebSocket | stream, finality, gap, multi-event pagination and decoder tests |
| Trending page | rolling token activity rank | successful SPL transfers and verified Raydium CPMM, PumpSwap and Pump bonding-curve trades | 5m/1h/6h/24h swap, buy/sell, unique-trader and transfer counts | no USD volume or holder claim | `GET /api/trending` | window boundary, deterministic ranking and protocol decoder tests |
| Token page | token transfer, authority, extension and holder history | successful SPL/Token-2022 instructions, transaction balances, finalized bounded account snapshots | token account, owner, mint, exact raw amount, decimals, authority, extension and snapshot slot | monotonic finalized snapshots; concentration remains unsafe until exclusions are authoritative | mint, token-account, holders and internal security REST | parser, versioned-address, snapshot, security, holder and reorg tests |
| Wallet/AI analysis | decoded trading performance | swaps carrying an explicit decoded user | exact rational remaining quantity, average cost, realized and mark-to-market unrealized PnL per base/quote pair | partial coverage is explicit; never inferred from generic transfers and never automation-safe | `/internal/wallets/:address/performance` | exact buy/sell cost-basis regression test |
| AI analysis | immutable traceable evidence | canonical index instructions, transfers, balances, swaps and holder observations | stable event IDs, instruction locations, registry/decoder versions, payload hashes, freshness, provenance and explicit missing fields | incomplete evidence always returns insufficient confidence and blocks automation | `/internal/evidence/:mint` and token views | evidence, registry, auth and missing-field contract tests |
| AI trading bot | execution decision inputs | Raydium CPMM, PumpSwap and Pump bonding-curve evidence | protocol-oriented base/quote identity, exact execution-price ratio, exact OHLCV, venue type, directional reserves and targeted data-quality risk | explicit venue, healthy index, 20+ unique finalized observations, two-way flow and freshness | swaps, pools/curves, candles, risk, readiness | decoder, direction-reversal candle, pool, risk and readiness tests |
| Commercial clients | stable versioned API and read-only RPC | local index | JSON, `X-API-Version: 1`, additive cursor envelopes, JSON-RPC 2.0 | optional API keys and fixed-window quotas; tenancy, metering and SLA absent | REST/RPC; public bind requires keys | HTTP pagination, RPC, auth and quota tests |
| Streaming clients | persisted block and filtered swap events | local canonical index | monotonic block sequence, cursor replay, token/pool/protocol filters, resync signal | serialized ingestion, persistence-before-broadcast, heartbeat, slow-consumer eviction | `WS /ws` | end-to-end replay and filtered-topic tests |

## Dependency-ordered roadmap

1. ~~Add deterministic REST contract tests, validation errors, stable cursor pagination, and response envelopes without breaking legacy routes.~~ Completed for block and transaction lists.
2. ~~Persist explicit ingestion provenance, finalized commitment, exporter lag, skipped-slot evidence, and bounded data-quality telemetry.~~ Completed with atomic exporter status and a bounded 10,000-slot history.
3. Decode supported DEX swaps and pool lifecycle events behind protocol-specific fixtures; never infer swaps from generic transfers. Raydium CPMM, PumpSwap and Pump bonding-curve trade events are covered; pool lifecycle and additional protocols remain.
4. Normalize token metadata, pool identity, reserves, liquidity, price and volume with exact decimal arithmetic and source timestamps. Protocol-oriented pair identity, raw reserves, execution ratios and direction-stable raw OHLCV are complete for decoded trades; metadata, lifecycle state and USD-denominated metrics remain.
5. ~~Add replayable WebSocket subscriptions with monotonic sequence IDs, resume cursors, heartbeats, bounded queues and slow-consumer eviction.~~ Completed for canonical block and mint/pool/protocol-filtered swap topics.
6. Add API keys, tenant quotas, audit logs, usage metering, retention tiers and documented SLOs before any commercial exposure. Static API keys, public-bind guard, and per-key quotas are complete; tenant persistence, metering, rotation, audit logs and SLOs remain.
7. Add trading-bot input schemas and hard gates for freshness, finality, liquidity, confidence, manipulation risk and incomplete coverage. Target-pool freshness/finality/history/two-way-flow gates and snapshot-backed authority/Token-2022 findings are complete; holder exclusions, sell-route simulation and manipulation detection remain.
8. ~~Add real-time confirmed/finalized ingestion with reconnects, durable resume, bounded gap repair, finality promotion, rollback safety, and operational telemetry.~~ Completed using local Agave block PubSub with the HTTP exporter retained for backfill.
9. Migrate immutable facts to ClickHouse, metadata/jobs/audit state to PostgreSQL, hot state/fan-out to Redis, and raw archives/dead letters to S3-compatible object storage. Current JSON state is a verified compatibility implementation, not the final production storage layer.
10. Add Yellowstone/Geyser as the primary bounded ingestion gateway with the current block PubSub path retained for reconciliation and backfill. This is blocked until the validator/plugin ABI is aligned: current Yellowstone 14.2.2 targets Agave 4.1.0 while this deployment pins Agave 3.1.14; either upgrade Agave or qualify a compatible Yellowstone 11.x release, including sustained-stream memory testing.

## Known limits

The current index is an offline local prototype. It is not yet a SolanaTracker-equivalent service, an RPC replacement, a price oracle, or a safe trading signal. Generic parsed transfer activity cannot faithfully supply pool liquidity, USD price/volume, holders, trader PnL, swaps, or risk scores.

## Decoder sources

- Raydium's official CPMM repository identifies the mainnet program as `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`.
- Raydium's official `SwapEvent` definition is the authoritative field order for the Anchor log decoder: pool, pre-swap vault amounts, input/output amounts and fees, direction, mints, trade fee, and creator fee.
- Pump.fun's official PumpSwap IDL is authoritative for the `BuyEvent` and `SellEvent` layouts and program `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`.
- Pump.fun's official Pump IDL is authoritative for the bonding-curve `TradeEvent` layout and program `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`.
