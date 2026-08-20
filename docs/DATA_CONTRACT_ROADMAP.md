# Data contract and roadmap

This matrix describes verified capabilities, not aspirational marketing claims.

| Consumer | Required data | Current source | Normalized contract | Freshness / safety | Exposure | Coverage |
|---|---|---|---|---|---|---|
| Terminal DEX activity | canonical blocks, transactions, SPL transfers | finalized local Agave block export | exact slots, hashes, signatures, string base-unit amounts | health rejects stale data and indexed parent-hash conflicts | REST v1 | unit/integration fixture |
| Trending page | token activity rank | successful locally indexed SPL transfers | mint, transfer count, last slot/time | explicitly not price, liquidity, volume, holders, or swap direction | `GET /api/trending` | deterministic store test pending |
| Token page | token transfer history | successful SPL/Token-2022 parsed instructions | raw amount string, nullable decimals/UI string, provenance by signature/slot | bounded by retained transactions | `GET /api/mint/:mint` | parser and index tests |
| AI analysis | traceable factual inputs | same local canonical index | every record tied to slot/signature | must reject unhealthy index; confidence model not implemented | REST health + queries | safety-gate contract pending |
| AI trading bot | execution decision inputs | not yet sufficient | price, liquidity, swap direction, pool identity and risk evidence absent | fail-closed capability and health gate | `GET /api/v1/bot/readiness` | readiness unit test |
| Commercial clients | stable versioned API and read-only RPC | local index | JSON, `X-API-Version: 1`, additive cursor envelopes, JSON-RPC 2.0 | auth, quotas, tenancy and SLA absent | loopback REST/RPC only | HTTP pagination and RPC contract tests |
| Streaming clients | ordered/replayable events | not implemented | sequence, cursor, resume and backpressure required | disconnect on stale/conflicting source | none | none |

## Dependency-ordered roadmap

1. ~~Add deterministic REST contract tests, validation errors, stable cursor pagination, and response envelopes without breaking legacy routes.~~ Completed for block and transaction lists.
2. ~~Persist explicit ingestion provenance, finalized commitment, exporter lag, skipped-slot evidence, and bounded data-quality telemetry.~~ Completed with atomic exporter status and a bounded 10,000-slot history.
3. Decode supported DEX swaps and pool lifecycle events behind protocol-specific fixtures; never infer swaps from generic transfers.
4. Normalize token metadata, pool identity, reserves, liquidity, price and volume with exact decimal arithmetic and source timestamps.
5. Add replayable WebSocket subscriptions with monotonic sequence IDs, resume cursors, heartbeats, bounded queues and slow-consumer eviction.
6. Add API keys, tenant quotas, audit logs, usage metering, retention tiers and documented SLOs before any commercial exposure.
7. Add trading-bot input schemas and hard gates for freshness, finality, liquidity, confidence, manipulation risk and incomplete coverage.

## Known limits

The current index is an offline local prototype. It is not yet a SolanaTracker-equivalent service, an RPC replacement, a price oracle, or a safe trading signal. Generic parsed transfer activity cannot faithfully supply pool liquidity, USD price/volume, holders, trader PnL, swaps, or risk scores.
