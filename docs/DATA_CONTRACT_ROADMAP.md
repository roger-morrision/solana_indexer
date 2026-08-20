# Data contract and roadmap

This matrix describes verified capabilities, not aspirational marketing claims.

| Consumer | Required data | Current source | Normalized contract | Freshness / safety | Exposure | Coverage |
|---|---|---|---|---|---|---|
| Terminal DEX activity | canonical blocks, transactions, SPL transfers | finalized local Agave block export | exact slots, hashes, signatures, string base-unit amounts | health rejects stale data and indexed parent-hash conflicts | REST v1 | unit/integration fixture |
| Trending page | token activity rank | successful SPL transfers and verified Raydium CPMM swaps | mint, swap/transfer counts, last slot/time | no USD volume or holder claim | `GET /api/trending` | deterministic ranking test |
| Token page | token transfer history | successful SPL/Token-2022 parsed instructions | raw amount string, nullable decimals/UI string, provenance by signature/slot | bounded by retained transactions | `GET /api/mint/:mint` | parser and index tests |
| AI analysis | traceable factual inputs | same local canonical index | every record tied to slot/signature | must reject unhealthy index; confidence model not implemented | REST health + queries | safety-gate contract pending |
| AI trading bot | execution decision inputs | Raydium CPMM and PumpSwap evidence | exact execution-price ratio, directional pool/mints/reserves, targeted data-quality risk | explicit pool, healthy index, 20+ unique finalized observations, two-way flow and freshness | swaps, pools, risk, readiness | decoder, pool, risk and readiness tests |
| Commercial clients | stable versioned API and read-only RPC | local index | JSON, `X-API-Version: 1`, additive cursor envelopes, JSON-RPC 2.0 | optional API keys and fixed-window quotas; tenancy, metering and SLA absent | REST/RPC; public bind requires keys | HTTP pagination, RPC, auth and quota tests |
| Streaming clients | persisted block events | local canonical index | monotonic sequence, cursor replay, resync signal | persistence-before-broadcast, heartbeat, slow-consumer eviction | `WS /ws` | end-to-end WebSocket replay test |

## Dependency-ordered roadmap

1. ~~Add deterministic REST contract tests, validation errors, stable cursor pagination, and response envelopes without breaking legacy routes.~~ Completed for block and transaction lists.
2. ~~Persist explicit ingestion provenance, finalized commitment, exporter lag, skipped-slot evidence, and bounded data-quality telemetry.~~ Completed with atomic exporter status and a bounded 10,000-slot history.
3. Decode supported DEX swaps and pool lifecycle events behind protocol-specific fixtures; never infer swaps from generic transfers. Raydium CPMM swap events are complete; pool lifecycle and additional protocols remain.
4. Normalize token metadata, pool identity, reserves, liquidity, price and volume with exact decimal arithmetic and source timestamps. Raydium pool identity, pre-swap reserves, and exact execution-price ratios are complete; metadata and USD-denominated metrics remain.
5. ~~Add replayable WebSocket subscriptions with monotonic sequence IDs, resume cursors, heartbeats, bounded queues and slow-consumer eviction.~~ Completed for canonical block events; DEX topics await decoded schemas.
6. Add API keys, tenant quotas, audit logs, usage metering, retention tiers and documented SLOs before any commercial exposure. Static API keys, public-bind guard, and per-key quotas are complete; tenant persistence, metering, rotation, audit logs and SLOs remain.
7. Add trading-bot input schemas and hard gates for freshness, finality, liquidity, confidence, manipulation risk and incomplete coverage. Target-pool freshness/finality/history/two-way-flow gates are complete; holder concentration, mint authority and manipulation detection still require account-state inputs.

## Known limits

The current index is an offline local prototype. It is not yet a SolanaTracker-equivalent service, an RPC replacement, a price oracle, or a safe trading signal. Generic parsed transfer activity cannot faithfully supply pool liquidity, USD price/volume, holders, trader PnL, swaps, or risk scores.

## Decoder sources

- Raydium's official CPMM repository identifies the mainnet program as `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`.
- Raydium's official `SwapEvent` definition is the authoritative field order for the Anchor log decoder: pool, pre-swap vault amounts, input/output amounts and fees, direction, mints, trade fee, and creator fee.
- Pump.fun's official PumpSwap IDL is authoritative for the `BuyEvent` and `SellEvent` layouts and program `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`.
