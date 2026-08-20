# Data contract and roadmap

This matrix describes verified capabilities, not aspirational marketing claims.

| Consumer | Required data | Current source | Normalized contract | Freshness / safety | Exposure | Coverage |
|---|---|---|---|---|---|---|
| Terminal DEX activity | provisional and canonical blocks, transactions, transfers and swaps | local Agave confirmed/finalized PubSub plus HTTP gap repair | exact slots, hashes, signatures, per-transaction event index/swap ID, commitment, string base-unit amounts | finalized promotion, downgrade refusal, source deduplication, stale/conflict health | REST/RPC/WebSocket | stream, finality, gap, multi-event pagination and decoder tests |
| Trending page | rolling token activity rank | successful SPL transfers and verified Raydium CPMM, PumpSwap and Pump bonding-curve trades | 5m/1h/6h/24h swap, buy/sell, unique-trader and transfer counts | no USD volume or holder claim | `GET /api/trending` | window boundary, deterministic ranking and protocol decoder tests |
| Token page | token transfer history | successful SPL/Token-2022 parsed instructions | raw amount string, nullable decimals/UI string, provenance by signature/slot | bounded by retained transactions | `GET /api/mint/:mint` | parser and index tests |
| AI analysis | traceable factual inputs | same local canonical index | every record tied to slot/signature | must reject unhealthy index; confidence model not implemented | REST health + queries | safety-gate contract pending |
| AI trading bot | execution decision inputs | Raydium CPMM, PumpSwap and Pump bonding-curve evidence | exact execution-price ratio, venue type, directional mints/reserves and targeted data-quality risk | explicit venue, healthy index, 20+ unique finalized observations, two-way flow and freshness | swaps, pools/curves, risk, readiness | decoder, pool, risk and readiness tests |
| Commercial clients | stable versioned API and read-only RPC | local index | JSON, `X-API-Version: 1`, additive cursor envelopes, JSON-RPC 2.0 | optional API keys and fixed-window quotas; tenancy, metering and SLA absent | REST/RPC; public bind requires keys | HTTP pagination, RPC, auth and quota tests |
| Streaming clients | persisted block and filtered swap events | local canonical index | monotonic block sequence, cursor replay, token/pool/protocol filters, resync signal | serialized ingestion, persistence-before-broadcast, heartbeat, slow-consumer eviction | `WS /ws` | end-to-end replay and filtered-topic tests |

## Dependency-ordered roadmap

1. ~~Add deterministic REST contract tests, validation errors, stable cursor pagination, and response envelopes without breaking legacy routes.~~ Completed for block and transaction lists.
2. ~~Persist explicit ingestion provenance, finalized commitment, exporter lag, skipped-slot evidence, and bounded data-quality telemetry.~~ Completed with atomic exporter status and a bounded 10,000-slot history.
3. Decode supported DEX swaps and pool lifecycle events behind protocol-specific fixtures; never infer swaps from generic transfers. Raydium CPMM, PumpSwap and Pump bonding-curve trade events are covered; pool lifecycle and additional protocols remain.
4. Normalize token metadata, pool identity, reserves, liquidity, price and volume with exact decimal arithmetic and source timestamps. Raydium pool identity, pre-swap reserves, and exact execution-price ratios are complete; metadata and USD-denominated metrics remain.
5. ~~Add replayable WebSocket subscriptions with monotonic sequence IDs, resume cursors, heartbeats, bounded queues and slow-consumer eviction.~~ Completed for canonical block and mint/pool/protocol-filtered swap topics.
6. Add API keys, tenant quotas, audit logs, usage metering, retention tiers and documented SLOs before any commercial exposure. Static API keys, public-bind guard, and per-key quotas are complete; tenant persistence, metering, rotation, audit logs and SLOs remain.
7. Add trading-bot input schemas and hard gates for freshness, finality, liquidity, confidence, manipulation risk and incomplete coverage. Target-pool freshness/finality/history/two-way-flow gates are complete; holder concentration, mint authority and manipulation detection still require account-state inputs.
8. ~~Add real-time confirmed/finalized ingestion with reconnects, durable resume, bounded gap repair, finality promotion, rollback safety, and operational telemetry.~~ Completed using local Agave block PubSub with the HTTP exporter retained for backfill.

## Known limits

The current index is an offline local prototype. It is not yet a SolanaTracker-equivalent service, an RPC replacement, a price oracle, or a safe trading signal. Generic parsed transfer activity cannot faithfully supply pool liquidity, USD price/volume, holders, trader PnL, swaps, or risk scores.

## Decoder sources

- Raydium's official CPMM repository identifies the mainnet program as `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`.
- Raydium's official `SwapEvent` definition is the authoritative field order for the Anchor log decoder: pool, pre-swap vault amounts, input/output amounts and fees, direction, mints, trade fee, and creator fee.
- Pump.fun's official PumpSwap IDL is authoritative for the `BuyEvent` and `SellEvent` layouts and program `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`.
- Pump.fun's official Pump IDL is authoritative for the bonding-curve `TradeEvent` layout and program `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`.
