# UPSTREAM-QA Solana Indexer QC/QA

- Run: `2026-08-26T20:35:34+07:00`
- Scope: `C:\Tuan\devApps\solana_indexer`
- Revision: `16e97923b2b220dd4b68f5dbdd3bf5db9a95548e`
- Compared with QA baseline: `b0c99ec` (2 DEV commits, 5 changed files)
- Compared with `origin/main`: 10 ahead, 0 behind before this evidence report
- Latest DEV handoffs: `UPSTREAM-QUERY-PARITY-001` and `UPSTREAM-QUERY-ENCODING-001`
- Overall result: 42 of 43 available DEV outcomes pass. The prior token allowlist defect is closed and all 23 parity outcomes pass. `UPSTREAM-QUERY-ENCODING-001-01` fails because both `?limit=10&protocol=x` and `?protocol=x&limit=10` pass the canonical check despite having identical decoded semantics, so the claimed single cache/signature identity is not enforced. Live qualification remains blocked by absent fresh canonical evidence.

## Reviewed DEV delta (43/20)

### `UPSTREAM-QUERY-PARITY-001` (23/23 PASS)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-QUERY-PARITY-001-01` | `PASS` | Token market rejects ignored `limit`. |
| `UPSTREAM-QUERY-PARITY-001-02` | `PASS` | Token security rejects ignored `limit`. |
| `UPSTREAM-QUERY-PARITY-001-03` | `PASS` | Token liquidity rejects ignored `limit`. |
| `UPSTREAM-QUERY-PARITY-001-04` | `PASS` | Token executable depth rejects ignored `limit` while retaining `side` and `amountRaw`. |
| `UPSTREAM-QUERY-PARITY-001-05` | `PASS` | Duplicate WebSocket `cursor` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-06` | `PASS` | Duplicate WebSocket `topic` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-07` | `PASS` | Duplicate WebSocket `mint` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-08` | `PASS` | Duplicate WebSocket `pool` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-09` | `PASS` | Duplicate WebSocket `protocol` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-10` | `PASS` | Duplicate WebSocket `eventType` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-11` | `PASS` | Duplicate WebSocket `ack` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-12` | `PASS` | Unknown WebSocket query names are rejected. |
| `UPSTREAM-QUERY-PARITY-001-13` | `PASS` | Oversized `mint` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-14` | `PASS` | Empty `pool` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-15` | `PASS` | Control-bearing `protocol` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-16` | `PASS` | Empty lifecycle `eventType` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-17` | `PASS` | Block-topic `mint` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-18` | `PASS` | Block-topic `pool` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-19` | `PASS` | Block-topic `protocol` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-20` | `PASS` | Block-topic `eventType` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-21` | `PASS` | Swap-topic `eventType` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-22` | `PASS` | Unknown topic values are rejected. |
| `UPSTREAM-QUERY-PARITY-001-23` | `PASS` | Unsupported acknowledgement values are rejected after admission. |

### `UPSTREAM-QUERY-ENCODING-001` (19 PASS, 1 FAIL)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-QUERY-ENCODING-001-01` | `FAIL` | Noncanonical pagination escapes are rejected, but two valid parameter orders with identical decoded semantics are both accepted, contradicting the declared single wire/cache/signature identity. |
| `UPSTREAM-QUERY-ENCODING-001-02` | `PASS` | Token `mint` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-03` | `PASS` | Pool filter percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-04` | `PASS` | Protocol filter percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-05` | `PASS` | Status filter percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-06` | `PASS` | Trending window percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-07` | `PASS` | Candle interval percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-08` | `PASS` | Quote `amountRaw` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-09` | `PASS` | Quote `inputMint` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-10` | `PASS` | Token-depth `side` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-11` | `PASS` | Wallet `limit` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-12` | `PASS` | Diagnostic `pool` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-13` | `PASS` | WebSocket `cursor` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-14` | `PASS` | WebSocket `topic` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-15` | `PASS` | WebSocket `mint` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-16` | `PASS` | WebSocket `pool` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-17` | `PASS` | WebSocket `protocol` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-18` | `PASS` | WebSocket `eventType` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-19` | `PASS` | WebSocket `ack` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-20` | `PASS` | Shared HTTP/WebSocket canonical-escape boundary preserves ordinary documented ASCII controls. |

- Available DEV delta: exactly 43 distinct fixes/enhancements after `b0c99ec`; the complete delta was exhausted.
- Verification result: 42 PASS, 1 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 0; the reviewed delta exceeds the 20-item contract by 23 without duplicating or cosmetically splitting evidence.

## Prior reviewed DEV delta (44/20; retained)

### `UPSTREAM-HTTP-QUERY-ALLOWLIST-001` (21 PASS, 1 FAIL)

| Item | Status | Independent HTTP/source evidence |
|---|---|---|
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-01` | `PASS` | Internal trending rejects unsupported `widnow` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-02` | `PASS` | New pairs rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-03` | `PASS` | Candidates rejects unsupported `score` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-04` | `PASS` | Pool quote rejects unsupported `amount` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-05` | `PASS` | Token trades rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-06` | `PASS` | Token OHLCV rejects unsupported `bucket` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-07` | `FAIL` | Executable depth rejects unsupported `direction`, but independently accepts undocumented and response-irrelevant `limit`; the token regex grants `limit` to every subview. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-08` | `PASS` | Wallet funding rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-09` | `PASS` | Versioned blocks rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-10` | `PASS` | Versioned transactions rejects unsupported `after` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-11` | `PASS` | Versioned swaps rejects unsupported `venue` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-12` | `PASS` | Versioned tokens rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-13` | `PASS` | Versioned pools rejects unsupported `state` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-14` | `PASS` | Volume rejects unsupported `period` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-15` | `PASS` | Bot readiness rejects unsupported `address` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-16` | `PASS` | Holders rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-17` | `PASS` | Candles rejects unsupported `window` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-18` | `PASS` | Legacy blocks rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-19` | `PASS` | Legacy transactions rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-20` | `PASS` | Legacy trending rejects unsupported `period` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-21` | `PASS` | Legacy account rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-22` | `PASS` | Legacy mint rejects unsupported `page` with redacted HTTP 400. |

### `UPSTREAM-HTTP-EMPTY-QUERY-001` (22/22 PASS)

| Item | Status | Independent HTTP evidence |
|---|---|---|
| `UPSTREAM-HTTP-EMPTY-QUERY-001-01` | `PASS` | RPC rejects `debug` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-02` | `PASS` | Metrics rejects `format` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-03` | `PASS` | Health rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-04` | `PASS` | Stats rejects `details` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-05` | `PASS` | Ingestion rejects `refresh` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-06` | `PASS` | Warehouse rejects `refresh` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-07` | `PASS` | Backup rejects `refresh` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-08` | `PASS` | Recovery rejects `refresh` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-09` | `PASS` | Registry rejects `version` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-10` | `PASS` | Feed health rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-11` | `PASS` | Feed gaps rejects `limit` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-12` | `PASS` | Execution policy rejects `version` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-13` | `PASS` | Pool preparation rejects `dryRun` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-14` | `PASS` | Token preparation rejects `dryRun` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-15` | `PASS` | Evidence rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-16` | `PASS` | Price rejects `currency` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-17` | `PASS` | Transaction detail rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-18` | `PASS` | Token-account detail rejects `slot` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-19` | `PASS` | Pool detail rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-20` | `PASS` | Risk rejects `model` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-21` | `PASS` | Root document rejects `preview` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-22` | `PASS` | Index document rejects `preview` with redacted HTTP 400. |

- Available DEV delta: exactly 44 distinct fixes/enhancements after `6885ff0`; the complete delta was exhausted.
- Verification result: 43 PASS, 1 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 0; the reviewed delta exceeds the 20-item contract by 24 without duplicating or cosmetically splitting evidence.

## Prior reviewed DEV delta (50/20; retained)

### `UPSTREAM-CLI-ENTRYPOINT-007` (30/30 PASS)

| Item | Status | Evidence |
|---|---|---|
| `UPSTREAM-CLI-ENTRYPOINT-007-01` | `PASS` | `account-snapshot.js` imports and gates `main()` with `isInvokedFile`; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-02` | `PASS` | `amm-v4-pool-snapshot.js` uses the shared identity guard; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-03` | `PASS` | `api-audit-retention.js` uses the shared identity guard without changing dry-run semantics. |
| `UPSTREAM-CLI-ENTRYPOINT-007-04` | `PASS` | `archive-receipt.js` uses the shared identity guard; its exclusive receipt contract remains covered. |
| `UPSTREAM-CLI-ENTRYPOINT-007-05` | `PASS` | `backfill-qualification.js` uses the shared guard; immutable non-promoting qualification tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-06` | `PASS` | Aliased `backup-preflight.js` executes and returns usage failure with exit 1 rather than silent success. |
| `UPSTREAM-CLI-ENTRYPOINT-007-07` | `PASS` | `backup-status.js` uses the shared identity guard; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-08` | `PASS` | `clmm-pool-snapshot.js` uses the shared identity guard; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-09` | `PASS` | `cpmm-pool-snapshot.js` uses the shared identity guard; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-10` | `PASS` | Aliased `dead-letter-reconcile.js` executes its dry run, emits evidence, and exits 0. |
| `UPSTREAM-CLI-ENTRYPOINT-007-11` | `PASS` | Aliased `exporter-health.js` now emits the 216-character fail-closed result and exits 1. |
| `UPSTREAM-CLI-ENTRYPOINT-007-12` | `PASS` | `external-rpc.js` uses the shared identity guard; provider failover/redaction tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-13` | `PASS` | `geyser-abi-preflight.js` uses the shared guard; bounded probe and qualification tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-14` | `PASS` | `inbox-archive.js` uses the shared identity guard; verified archive tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-15` | `PASS` | Aliased `inbox-retention.js` executes its dry run, emits evidence, and exits 0 without deletion. |
| `UPSTREAM-CLI-ENTRYPOINT-007-16` | `PASS` | `local-validator-exporter.js` uses the shared guard; exporter provenance/gap tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-17` | `PASS` | `local-validator-stream.js` uses the shared guard; reconnect/replay/gap tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-18` | `PASS` | `meteora-dlmm-pool-snapshot.js` uses the shared identity guard; syntax and snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-19` | `PASS` | `offchain-metadata-snapshot.js` uses the shared guard; bounded metadata acquisition tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-20` | `PASS` | `openbook-market-snapshot.js` uses the shared identity guard; market snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-21` | `PASS` | `operational-job-worker.js` uses the shared guard; lease/retry tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-22` | `PASS` | `orca-pool-snapshot.js` uses the shared identity guard; Whirlpool snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-23` | `PASS` | `phoenix-market-snapshot.js` uses the shared identity guard; order-book snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-24` | `PASS` | `postgres-commercial-sync.js` uses the shared guard; deterministic upsert tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-25` | `PASS` | `pump-bonding-curve-snapshot.js` uses the shared identity guard; curve snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-26` | `PASS` | `pump-swap-pool-snapshot.js` uses the shared identity guard; PumpSwap snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-27` | `PASS` | Aliased `recovery-qualification.js` executes and returns usage failure with exit 1. |
| `UPSTREAM-CLI-ENTRYPOINT-007-28` | `PASS` | Aliased `reduced-preflight.js` executes, emits its missing-digest failure, and exits 1. |
| `UPSTREAM-CLI-ENTRYPOINT-007-29` | `PASS` | Aliased `usdc-oracle-snapshot.js` executes, emits its missing-source failure, and exits 1. |
| `UPSTREAM-CLI-ENTRYPOINT-007-30` | `PASS` | `warehouse-sync.js` uses the shared guard; ordered retry-safe convergence tests pass. |

### `UPSTREAM-HTTP-QUERY-CARDINALITY-001` (20/20 PASS)

| Item | Status | Independent HTTP evidence |
|---|---|---|
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-01` | `PASS` | Duplicate trending `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-02` | `PASS` | Duplicate trending `window` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-03` | `PASS` | Duplicate new-pairs `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-04` | `PASS` | Duplicate candidates `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-05` | `PASS` | Duplicate candidates `window` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-06` | `PASS` | Duplicate quote `amountRaw` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-07` | `PASS` | Duplicate quote `inputMint` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-08` | `PASS` | Duplicate quote `limitTick` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-09` | `PASS` | Duplicate token-trades `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-10` | `PASS` | Duplicate OHLCV `interval` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-11` | `PASS` | Duplicate depth `side` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-12` | `PASS` | Duplicate depth `amountRaw` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-13` | `PASS` | Duplicate wallet-funding `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-14` | `PASS` | Duplicate block `cursor` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-15` | `PASS` | Duplicate transaction `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-16` | `PASS` | Duplicate swap `mint` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-17` | `PASS` | Duplicate swap `protocol` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-18` | `PASS` | Duplicate token `cursor` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-19` | `PASS` | Duplicate pool `status` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-20` | `PASS` | Duplicate candle `interval` returns redacted HTTP 400 `bad_request`. |

- Prior available DEV delta: exactly 50 distinct fixes/enhancements after `07316ee`; that historical delta was exhausted.
- Prior verification result: 50 PASS, 0 FAIL, 0 BLOCKED, 0 SKIP.
- Prior fix/enhancement shortfall: 0; the historical delta exceeded the 20-item contract by 30 without duplicating or cosmetically splitting evidence.

## Independent 27-domain reconciliation

| Domain | Status | Concrete evidence |
|---|---|---|
| Path-parameter boundary | `PASS` | The committed focused regression passes empty and populated transaction state, a 32/32 malformed/delimiter matrix across all 16 consumers, valid transaction preservation, zero diagnostics, and zero `http_internal_error` metrics. |
| Token/account/supply authority | `PASS` | Full suite passes indexed token balance, Token-2022 funding, complete finalized account snapshot, token-account projection, and token-supply contracts. |
| Holder and whale concentration | `PASS` | `indexed token holders aggregate owners with versioned canonical evidence` and authoritative-exclusion concentration tests pass. |
| Trader and wallet analytics | `PASS` | Exact wallet cost basis/PnL, funding, funding-cluster, profile, and partial-coverage tests pass. |
| Pool identity and quote evidence | `PASS` | Finalized Raydium, Orca, Meteora, Pump/PumpSwap, Phoenix, and OpenBook snapshot/quote tests pass with exact venue dependencies. |
| Price and depeg reference | `PASS` | Independent USDC reference, Pyth evidence, expiry, depeg bound, and nominal USD path tests pass. |
| Liquidity and risk | `PASS` | Exact pool reserve/depth evidence and mature two-way finalized bot-readiness/risk gates pass. |
| Volume and candles | `PASS` | Exact rolling USD volume and direction-stable integer OHLCV tests pass without floating point. |
| Provenance, freshness, and finality | `PASS` | Malformed provenance, wrong-network, stale/future evidence, finality promotion, and finalized downgrade tests all fail closed as designed. |
| REST schemas and pagination | `PASS` | Stable cursor scope/digest, filtering, explicit projections, invalid-cursor rejection, and compact catalogs pass; the path defect is tracked separately. |
| Read-only JSON-RPC | `PASS` | Indexed method allowlist, parameter bounds, cursor isolation, malformed/oversized envelope, and invalid-evidence tests pass. |
| WebSocket contracts and replay | `PASS` | Ordered persisted replay, resume, snapshot isolation, corruption rejection, acknowledgement, timeout, capacity, and backpressure tests pass. |
| Numeric precision | `PASS` | Raw integer fields use exact string/UInt64/UInt256 or numerator/denominator contracts; Token-2022 epoch fee and Q64/lot/bin math tests pass. |
| Replay, reorg, and idempotency | `PASS` | 1,000-block replay preserves canonical counts, duplicate idempotency, replacement correction, heap, and throughput invariants. |
| Retry, failover, and `Retry-After` | `PASS` | Local/external provider rotation, half-open probes, wrong-network rejection, bounded 1,000-3,600,000 ms retry hints, and credential-safe failover tests pass. |
| Gap, backfill, and recovery logic | `PASS` | Atomic bounded gap repair, produced-slot refusal, immutable non-promoting backfill, and detached recovery-evidence rejection tests pass. |
| Persistence and atomic recovery | `PASS` | Durable concurrent writes/appends, snapshot batch validation-before-mutation, fingerprint replacement, quarantine, and exact checkpoint tests pass. |
| Warehouse and schema compatibility | `PASS` | Ordered retry-safe dual-sink checkpointing, canonical event/content hashes, PostgreSQL projection preimages, Redis hot-state bounds, and ClickHouse UInt256 raw amounts pass repository tests. |
| Fail-closed redaction | `PASS` | Explicit public projection allowlists, dead-letter/diagnostic credential redaction, bounded operational JSON, malformed evidence, and secret-file tests pass. |
| Operational readiness diagnostics | `PASS` | The schema-v2 report contains all twenty ordered redacted dimensions; local provider validation rejects missing, public, cardinality-mismatched, canonically duplicate, credential-bearing, path-bearing, query-bearing, and fragment-bearing topologies while accepting a distinct loopback pair set. Canonical real-path entrypoint comparison preserves CLI execution through workspace aliases. |
| CLI entrypoint execution | `PASS` | All 32 direct operator CLI consumers use the shared real-path guard and zero legacy lexical guards remain. Seven representative aliased commands execute with nonempty output and correct exit behavior. |
| HTTP query cardinality | `PASS` | Twenty independent duplicate-key route requests return the stable redacted HTTP 400 contract; a valid four-parameter control remains accepted by the validator. |
| HTTP query allowlists | `PASS` | The exact token-subview correction rejects all four previously ignored `limit` inputs; the 4/4 token correction matrix and 19/19 WebSocket parity matrix pass. |
| Empty-query HTTP contracts | `PASS` | Twenty-two independent real HTTP requests reject query input with the stable redacted HTTP 400 contract; six query-free controls remain accepted by the validator. |
| Canonical query identity | `FAIL` | Twenty percent-encoding variants fail closed, but the shared check accepts both `?limit=10&protocol=x` and `?protocol=x&limit=10`; decoded semantics match while wire/cache/signature identities differ. |
| Bounded performance | `PASS` | Full suite passes 355/355; syntax passes 86/86; replay completes at 2,803.99 blocks/s with 9,768,512-byte heap growth below 536,870,912 bytes. |
| Live operational qualification | `BLOCKED` | Provider variables and active exporter/warehouse/backup/recovery status files are absent; both retained indexes report `wrong_network`; retained finalized exporter evidence is 406,432 slots behind and 381,216,762 ms old at the trigger time. |

The contract minimum is satisfied with 27 distinct evidence domains: 25 PASS, 1 FAIL, and 1 BLOCKED. These domains use separate contracts or failure boundaries and are not cosmetic splits.

## UPSTREAM-QA-PATH-PARAMETER-003

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run `test/indexer.test.js` test `resource routes reject malformed or delimiter-decoding path parameters`; it exercises malformed escapes and decoded delimiters for preparation, quote, evidence, token, wallet, price, volume, transaction, account, mint, holder, token-account, pool, candle, and risk consumers, with empty/populated transaction state and a valid transaction control.
- Evidence: the committed test passes 32/32 consumer-matrix checks, retains 4/4 empty-state token-account/transaction checks and 2/2 populated transaction checks, preserves `signature-1` with HTTP 200, captures zero diagnostics, and observes `terminal_dex_internal_failures_total{operation="http_internal_error"} 0`.
- Affected contracts: shared REST/internal path-parameter validation, regression coverage for 16 resource consumers, internal failure metrics, diagnostic callback behavior, and client retry/error classification.
- Expected behavior: the source correction and committed regression together cover empty/populated transaction state, all 16 malformed/delimiter consumer boundaries, valid-route preservation, and unchanged internal-failure telemetry.
- Actual behavior: the committed regression now matches the expected controlled HTTP 400 and telemetry contracts across the complete scoped matrix.
- Acceptance criteria: committed table-driven 16-consumer malformed/delimiter matrix; retained empty and populated transaction checks; preserved valid transaction route; zero internal-failure counter and diagnostic callbacks. All criteria are met.
- Validation results: focused committed regression 1/1 PASS; malformed/delimiter matrix 32/32 PASS plus retained empty/populated transaction checks; valid transaction preservation PASS; diagnostics 0 PASS; internal-failure metric 0 PASS; full suite 348/348 PASS; syntax 84/84 PASS; replay invariants PASS at 7,547.45 blocks/s and 8,902,232-byte heap growth.
- Compatibility impact: source behavior is compatible for valid paths and deterministically rejects malformed paths; the regression enhancement changes no runtime or consumer contract.
- Performance impact: validation remains bounded to 256 decoded characters before lookup; no replay/heap/throughput regression was observed.
- Blockers: none; the prior regression gap is closed.

## UPSTREAM-QA-HEALTH-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run the health projection regression and the full suite.
- Evidence: injected unknown store and diagnostic fields remain excluded from REST `GET /api/health`, JSON-RPC `getIndexerHealth`, and `GET /internal/feed/health`; established status/quality fields remain compatible.
- Affected contracts: REST, JSON-RPC, internal feed health, nested structure/chain/quality projections, and diagnostic redaction.
- Expected versus actual: explicit allowlists omit unknown fields and unhealthy state fails closed; actual behavior matches.
- Acceptance criteria: explicit projection allowlists at every health endpoint, stable documented fields/status, and green regression/replay checks.
- Validation results: full suite 348/348, syntax 84/84, and all replay invariants PASS.
- Compatibility/performance impact: additive hardening only; no established field removal or bounded-performance regression observed.
- Blockers: none.

## UPSTREAM-QA-TOKEN-PROJECTION-002

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run the token balance/holder divergence regressions; independently corrupt an unrelated pool, then the requested mint projection, while querying holder and token-account REST routes.
- Evidence: unrelated pool corruption does not block valid mint-scoped responses; relevant mint divergence returns `indexed_holder_evidence_unavailable` and `indexed_token_account_evidence_unavailable`. Full token/account/holder regressions remain green.
- Affected contracts: REST holder/token-account projections, mint-scoped balance/snapshot evidence, explicit fields, and failure envelopes.
- Expected versus actual: unrelated aggregate evidence is isolated while relevant corruption fails closed; actual behavior matches.
- Acceptance criteria: mint-scoped isolation, stable explicit 503 reasons, unchanged successful shapes, and no unknown-field disclosure.
- Validation results: full suite 348/348, syntax 84/84, and all replay invariants PASS.
- Compatibility/performance impact: successful payloads remain unchanged and checks remain mint-scoped.
- Blockers: none.

## UPSTREAM-QA-OPS-PROVIDER-002

- Severity: `PASS` (resolved by `a5d60f6`, hardened by `7e78632` and `e8fb4c7`)
- Owner: `DEV`
- Reproduction: call `assessProviderConfiguration` with canonically equivalent loopback identities such as `http://LOCALHOST:80` and `http://localhost/`; directly validate RPC and WebSocket URLs containing userinfo, a non-root path, a query, or a fragment.
- Evidence: canonically equivalent RPC or WebSocket identities return `{ available: true, healthy: false, reason: "provider_configuration_invalid", mode: null }`. All eight independent authority cases throw the redacted `credential-free root URL` error, while a distinct IPv4/IPv6 two-pair topology returns healthy local-validator mode. Three focused committed regressions pass.
- Affected contracts: `npm run health:operational`, `upstream_operational_readiness` schema v2 `provider` check, aggregate `ready`, local polling/streaming qualification, operator incident response, and any QC/automation gate consuming the report.
- Expected behavior: local provider readiness is healthy only when RPC and WebSocket endpoint sets contain unique canonical credential-free loopback root URLs, remain within supported bounds, and are cardinality-compatible.
- Actual behavior: raw and canonical duplicate identities plus credential/path/query/fragment-bearing endpoints fail closed consistently with runtime constructors; valid distinct endpoint sets and external provider behavior remain available.
- Acceptance criteria: reject raw and canonical duplicate effective RPC/WebSocket endpoint sets; reject userinfo, non-root paths, queries, and fragments with a stable redacted reason; preserve root loopback, missing/public/mismatched/valid topology, external Helius/Alchemy, and secret-redaction behavior. All criteria are met.
- Validation results: independent canonical-duplicate, eight-case authority, and valid IPv4/IPv6 controls PASS; focused committed provider regressions 3/3 PASS; full suite 348/348 PASS; syntax 84/84 PASS; replay invariants PASS at 7,547.45 blocks/s with 8,902,232-byte heap growth.
- Compatibility impact: false-positive local `provider.healthy=true` results now fail closed; operators using credentials or non-root URL components must move those values out of local validator URLs. No REST/RPC/WebSocket payload changed.
- Performance impact: bounded parsing of at most four configured RPC and WebSocket endpoints; negligible relative to state/evidence loading.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-CLI-ENTRYPOINT-003

- Severity: `PASS` (resolved by `a6eb293`)
- Owner: `DEV`
- Reproduction: invoke `src/operational-readiness.js` through a workspace alias whose lexical path differs from the module file path but resolves to the same file; the prior lexical comparison could skip `main()` and return a silent success.
- Evidence: `isInvokedFile` now compares canonical real paths and falls back to deterministic resolved lexical paths only when file resolution fails. The injected same-file alias control returns true, a different-file control and empty invocation return false, and direct health smoke emits schema v2 with nine redacted blockers and exit 1.
- Affected contracts: scheduled `health:operational` execution, sandbox/workspace aliases, user-visible automation evidence, process exit status, and fail-closed readiness reporting.
- Expected behavior: every direct invocation of the readiness module executes `main()`, emits one bounded schema-v2 report, and exits nonzero when readiness is blocked, independent of equivalent workspace aliases.
- Actual behavior: canonical file identity selects direct invocation correctly while imported-module behavior and deterministic failure fallback remain unchanged.
- Acceptance criteria: compare file identity through canonical real paths; retain a deterministic non-throwing fallback; cover alias, different-file, and empty-invocation cases; demonstrate emitted fail-closed health evidence and nonzero blocked exit. All criteria are met.
- Validation results: focused readiness/provider regressions 3/3 PASS; direct health smoke emits twenty ordered checks, nine blockers, and exit 1; full suite 348/348 PASS; syntax 84/84 PASS; replay invariants PASS at 7,547.45 blocks/s with 8,902,232-byte heap growth; HEAD remained `a6eb293` and the DEV lock remained absent throughout the stable validation pass.
- Compatibility impact: no schema, configuration, REST, RPC, or WebSocket contract changed; direct aliased invocations that previously returned no evidence now correctly execute and can return blocked status.
- Performance impact: one bounded pair of filesystem real-path resolutions at CLI startup only; no replay/heap/throughput regression observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-CLI-ENTRYPOINT-004

- Severity: `PASS` (resolved by `c5e7495`)
- Owner: `DEV`
- Reproduction: create a filesystem junction to the repository and invoke `src/exporter-health.js` through that alias. Compare it with canonical-path invocation, then enumerate direct CLI guards that still compare `fileURLToPath(import.meta.url)` and `process.argv[1]` lexically.
- Evidence: source enumeration now finds zero legacy lexical guards and 32 direct consumers of `isInvokedFile`. Through a real junction, exporter health emits its 216-character fail-closed report and exits 1; backup and recovery usage gates, reduced preflight, and oracle snapshot emit nonempty failures with exit 1; inbox retention and dead-letter reconciliation emit nonempty dry-run results and exit 0.
- Affected contracts: scheduled job execution, health and qualification evidence, backup/recovery safety gates, ingestion/exporter activation, warehouse convergence, retention/reconciliation, all snapshot producers, automation exit status, and visible per-run reporting under workspace aliases.
- Expected behavior: every supported direct CLI executes exactly once through canonical or aliased workspace paths, imported modules remain side-effect free, and blocked commands emit their documented evidence with a nonzero exit.
- Actual behavior: all thirty previously affected CLIs now use the shared real-path guard; aliased commands execute instead of silently returning success, while direct and imported-module behavior remains stable.
- Acceptance criteria: migrate all 30 enumerated legacy direct-entrypoint guards to the shared helper; add a table-driven inventory regression proving no legacy lexical guard remains; exercise representative health, recovery/preflight, worker/sync, exporter/stream, retention/reconciliation, and snapshot commands through a real or injected alias; preserve direct and import behavior, output schemas, redaction, and blocked exit codes.
- Validation results: 30/30 migrated CLI outcomes PASS; inventory regression PASS with zero legacy guards; seven representative real-junction executions PASS; focused CLI inventory PASS; full suite 350/350 PASS; syntax 85/85 PASS; replay PASS at 5,196.11 blocks/s with 9,387,632-byte heap growth; stable HEAD `70279c1` and no DEV lock before or after validation.
- Compatibility impact: fixing the remaining guards changes only incorrectly silent aliased direct invocations; canonical direct invocation, imported-module behavior, command arguments, output schemas, and consumers must remain stable.
- Performance impact: at most one bounded real-path comparison at each CLI startup; no steady-state ingestion, API, persistence, or replay cost is expected.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-QUERY-CARDINALITY-001

- Severity: `PASS` (implemented by `70279c1`)
- Owner: `DEV`
- Reproduction: send each documented consumer/operator route a repeated query key, including pagination, windowing, quote, filtering, depth, wallet, token, pool, swap, and candle parameters; retain a valid request with four distinct keys as the compatibility control.
- Evidence: all twenty independent real HTTP requests return status 400 with `{ error: "bad_request", detail: "query parameters must appear at most once" }`; no key names or values are echoed. The distinct-key validator control does not throw.
- Affected contracts: REST/internal pagination and filtering, trending/candidate windows, quote and depth inputs, wallet history bounds, token/pool/swap catalogs, candle intervals, cache/signature identity, authentication/quota ordering, and client error classification.
- Expected behavior: repeated query names fail closed after authentication/base quota admission and before route parsing, while distinct names preserve existing successful or route-specific behavior.
- Actual behavior: a single bounded query-name pass rejects every duplicate consistently; response-success schemas, persistence, JSON-RPC, and WebSocket contracts are unchanged.
- Acceptance criteria: cover all twenty selected parameter boundaries with HTTP 400; use one stable redacted envelope; preserve a valid multi-parameter control; retain authentication/quota order and established route behavior. All criteria are met.
- Validation results: independent real HTTP matrix 20/20 PASS; focused CLI/query regressions 2/2 PASS; full suite 350/350 PASS; syntax 85/85 PASS; replay PASS at 5,196.11 blocks/s with 9,387,632-byte heap growth; operational health retains the expected nine blockers and production authorization false.
- Compatibility impact: only ambiguous repeated query names are rejected; clients must serialize each key at most once. Successful response schemas and non-HTTP contracts are unchanged.
- Performance impact: one linear pass over bounded request query names before routing; no replay, heap, ingestion, persistence, or API regression observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-QUERY-ALLOWLIST-002

- Severity: `PASS` (resolved by `f81cae3`)
- Owner: `DEV`
- Reproduction: call `validateAllowedQueryParameters` with `limit=1` on `/internal/tokens/:mint/market`, `/security`, `/liquidity`, and `/executable-depth`; compare the route implementation and documented executable-depth contract.
- Evidence: all four formerly ignored `limit` inputs now throw `BAD_REQUEST`. Market, security, and liquidity admit no query keys; executable depth admits only `side` and `amountRaw`; five documented token controls remain accepted.
- Affected contracts: authenticated token market/security/liquidity views, executable-depth bot input, cache and request-signature identity, client typo detection, fail-closed query semantics, and `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-07`.
- Expected behavior: allowlists are view-specific: token/base, holders, trades, and OHLCV admit their used `limit`; OHLCV additionally admits `interval`; executable depth admits only `side` and `amountRaw`; market, security, and liquidity admit no query keys.
- Actual behavior: the token allowlist is now derived from the exact subview and matches the documented inputs.
- Acceptance criteria: derive the allowed set from the exact token subview; reject `limit` with stable redacted HTTP 400 on market, security, liquidity, and executable depth; add real HTTP regressions for all four; preserve valid base/holders/trades/OHLCV limits, OHLCV interval, depth side/amountRaw, authentication/quota order, and response schemas.
- Validation results: all 4 token corrections and all 19 WebSocket parity outcomes PASS; focused query/WebSocket regressions 7/7 PASS; full suite 355/355 PASS; syntax 86/86 PASS; replay PASS at 2,803.99 blocks/s with 9,768,512-byte heap growth.
- Compatibility impact: fixing the defect rejects only ignored token-subview keys; documented token limits and executable-depth inputs remain compatible.
- Performance impact: view-specific constant allowlists remain bounded to the number of query keys; no steady-state ingestion, persistence, or replay impact is expected.
- Blockers: none; the prior finding is closed.

## UPSTREAM-QA-QUERY-ENCODING-001

- Severity: `FAIL` / `HIGH`
- Owner: `DEV`
- Reproduction: call `hasCanonicalQueryEncoding` for `/api/v1/pools?limit=10&protocol=x` and `/api/v1/pools?protocol=x&limit=10`; compare the decoded parameter entries after sorting.
- Evidence: both raw query strings return `true`; their decoded key/value sets are identical, and route behavior reads parameters by name. `URLSearchParams.toString()` preserves insertion order, so comparing it with `url.search` normalizes escaping but does not select one parameter order.
- Affected contracts: REST and WebSocket request identity, cache keys, request signing, audit correlation, replay selection, client serialization guidance, and `UPSTREAM-QUERY-ENCODING-001-01`.
- Expected behavior: when the handoff promises one canonical wire spelling for semantically identical query input, the boundary admits only one deterministic parameter ordering in addition to canonical percent encoding.
- Actual behavior: alternate orderings remain admitted and can produce identical application behavior under different wire, cache, signature, and audit identities.
- Acceptance criteria: define a deterministic query-key order, reject or normalize alternate orders before signing/caching, apply the same rule to HTTP and WebSocket inputs, add multi-parameter real HTTP and WebSocket regressions, and preserve authentication/quota order plus established response/event schemas.
- Validation results: committed noncanonical escape matrix 20/20 PASS; independent parity matrix 23/23 PASS; ordering reproduction FAIL with two accepted spellings; focused query/WebSocket regressions 7/7 PASS; full suite 355/355 PASS; syntax 86/86 PASS; replay PASS at 2,803.99 blocks/s with 9,768,512-byte heap growth.
- Compatibility impact: clients using noncanonical parameter order must migrate to the documented deterministic encoder; decoded parameter values and response/event schemas remain unchanged.
- Performance impact: bounded comparison or sorting over the already bounded query-key set; no ingestion, persistence, or replay change is expected.
- Blockers: none; the source boundary and two-string reproduction are available.

## UPSTREAM-QA-HTTP-EMPTY-QUERY-001

- Severity: `PASS` (implemented by `ca78cd3`)
- Owner: `DEV`
- Reproduction: send a query key to each of the twenty-two declared query-free RPC, diagnostic, preparation, detail, and static routes; retain six query-free paths as validator controls.
- Evidence: all twenty-two independent real HTTP requests return the stable redacted HTTP 400 unsupported-query contract; the six query-free validator controls remain admitted.
- Affected contracts: RPC, metrics, health/stats, ingestion/warehouse/backup/recovery, registry/feed/execution-policy diagnostics, pool/token preparation, evidence, price, transaction/token-account/pool/risk detail, and root/index documents.
- Expected versus actual: routes with no query dimension reject every query name after authentication/base quota admission while query-free requests retain established behavior; actual behavior matches.
- Acceptance criteria: 22 rejection cases, six no-query controls, stable redacted 400, unchanged POST bodies and success schemas, authentication and quota ordering. All criteria are met.
- Validation results: independent HTTP matrix 22/22 PASS; authentication/quota order PASS; focused query regressions 3/3 PASS; full suite 352/352 PASS; syntax 85/85 PASS; replay and operational-health checks PASS as designed.
- Compatibility/performance impact: clients must remove ignored query strings; one bounded query-name pass adds no observed replay or API regression.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-OPS-001

- Severity: `BLOCKED`
- Owner: `DEV`
- Reproduction: run `npm run health:operational`; load `data/index.json` and `data/mainnet-index.json` through `IndexStore.health(120000)`; assess retained `data/external-exporter-status.json` with the repository exporter-health contract.
- Evidence: the schema-v2 operational smoke exits 1 with nine ordered blockers: provider, index events, transactions, instructions, freshness, exporter, warehouse, backup, and recovery. RPC/WebSocket provider variables and default active exporter, warehouse checkpoint/failure, backup, and recovery files are absent. Both retained indexes fail closed with `status=wrong_network`, `healthy=false`, and `reason=indexed_block_mainnet_identity_missing_or_invalid`. Retained external evidence is finalized with zero recorded failures but fails `exporter_lagging` at 406,432 slots behind, a 512-slot maximum, and 381,216,762 ms age at the trigger time.
- Affected contracts: current ingestion freshness/finality, failover, warehouse convergence, backup/recovery readiness, public health, bot readiness, and live token/holder/whale/trader/pool/price/liquidity/volume qualification.
- Expected behavior: redacted fresh canonical-mainnet provider, exporter, exact warehouse convergence, backup, and recovery evidence are available; any missing, stale, lagged, malformed, or wrong-network input fails closed.
- Actual behavior: current live qualification cannot run; retained evidence correctly fails closed and was not treated as authoritative current mainnet data.
- Acceptance criteria: provide a redacted current canonical-mainnet operational evidence bundle with exact warehouse and fresh backup/recovery qualification while retaining every fail-closed boundary.
- Validation results: repository retry/failover, operational evidence, recovery, redaction, full regression, and replay checks pass; no provider, database, or production mutation was attempted.
- Compatibility/performance impact: no contract regression observed; sustained live ingestion and sink performance remain unqualified.
- Blockers: no configured provider endpoints or fresh active exporter/warehouse/backup/recovery evidence.

- NEXT_DEV_ACTION: enforce one deterministic query-key order for HTTP and WebSocket requests and add real multi-parameter regressions proving alternate orderings fail closed while preserving authentication, quota, and response/event contracts.
