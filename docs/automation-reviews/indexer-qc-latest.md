# UPSTREAM-QA Solana Indexer QC/QA

- Run: `2026-08-25T20:42:37+07:00`
- Scope: `C:\Tuan\devApps\solana_indexer`
- Revision: `8ac86aeb090fd65d6e7d88a8945d36c23f3ca071`
- Compared with QA baseline: `6c452fa` (1 commit, 3 changed files)
- Compared with `origin/main`: 6 ahead, 0 behind
- Latest DEV handoff: `UPSTREAM-PATH-PARAMETER-003`
- Overall result: the source correction passes independent empty/populated and 16-consumer path validation, but the reviewed fix remains incomplete because its committed regression covers only 2 of 16 consumers and does not assert internal-failure telemetry; live operational/provider qualification remains blocked by absent fresh evidence.

## Reviewed DEV delta (1/20)

| Item | Status | Evidence |
|---|---|---|
| `UPSTREAM-PATH-PARAMETER-003` | `FAIL` | Functional verification passes 34/34 malformed/delimiter checks plus valid-route preservation with zero diagnostics, but the committed regression exercises only token-account and transaction consumers (2/16) and does not assert the internal-failure counter or diagnostic callback required by the prior acceptance criteria. |

- Available DEV delta: exactly 1 distinct fix/enhancement after `6c452fa`; the complete delta was exhausted.
- Verification result: 0 PASS, 1 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 19 because no other distinct DEV fix or enhancement exists in the reviewed delta. No evidence was duplicated, split, padded, or reused to manufacture the count.

## Independent 21-domain reconciliation

| Domain | Status | Concrete evidence |
|---|---|---|
| Path-parameter boundary | `FAIL` | Source behavior passes 2/2 empty transaction checks, a 32/32 malformed/delimiter matrix across all 16 consumers, valid transaction preservation, and zero diagnostics; however, the committed focused test covers only 2/16 consumers and no internal-failure telemetry assertion. |
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
| Bounded performance | `PASS` | Full suite passes 347/347; syntax passes 83/83; replay completes at 3,192.98 blocks/s with 9,894,816-byte heap growth below 536,870,912 bytes. |
| Live operational qualification | `BLOCKED` | Provider variables and active exporter/warehouse/backup/recovery status files are absent; both retained indexes report `wrong_network`; retained finalized exporter evidence is 406,432 slots behind and 295,239,434 ms old. |

The contract minimum is satisfied with 21 distinct evidence domains: 19 PASS, 1 FAIL, and 1 BLOCKED. These domains use separate contracts or failure boundaries and are not cosmetic splits.

## UPSTREAM-QA-PATH-PARAMETER-003

- Severity: `FAIL (low)`
- Owner: `DEV`
- Reproduction: inspect `test/indexer.test.js` test `resource routes reject malformed or delimiter-decoding path parameters`; it checks token-account and transaction paths only. Run an independent matrix for malformed escapes and decoded delimiters across preparation, quote, evidence, token, wallet, price, volume, transaction, account, mint, holder, token-account, pool, candle, and risk consumers, while capturing `onDiagnostic`; all source paths return the controlled HTTP 400 envelope.
- Evidence: `src/server.js` now decodes the captured transaction signature before `indexedTransactions()` and collection search. Independent checks pass 2/2 with an empty transaction collection and 32/32 across all 16 consumers after applying the canonical fixture; a valid fixture transaction still returns HTTP 200 with its signature unchanged, and the diagnostic callback count remains zero. The committed test contains six requests spanning only two consumers and has no telemetry assertion.
- Affected contracts: shared REST/internal path-parameter validation, regression coverage for 16 resource consumers, internal failure metrics, diagnostic callback behavior, and client retry/error classification.
- Expected behavior: the source correction and committed regression together cover empty/populated transaction state, all 16 malformed/delimiter consumer boundaries, valid-route preservation, and unchanged internal-failure telemetry.
- Actual behavior: runtime behavior matches the controlled HTTP 400 contract, but committed regression coverage omits 14 consumers, valid-route preservation, the internal-failure counter, and the diagnostic callback assertion.
- Acceptance criteria: extend the committed test to a table-driven 16-consumer malformed/delimiter matrix; retain empty and populated transaction checks; assert a valid transaction route remains unchanged; assert both the internal-failure counter and diagnostic callback remain zero.
- Validation results: focused committed regression 1/1 PASS; independent malformed/delimiter checks 34/34 PASS; valid transaction preservation PASS; diagnostics 0 PASS; full suite 347/347 PASS; syntax 83/83 PASS; replay invariants PASS at 3,192.98 blocks/s and 9,894,816-byte heap growth.
- Compatibility impact: source behavior is compatible for valid paths and deterministically rejects malformed paths; the remaining work is regression-only.
- Performance impact: validation remains bounded to 256 decoded characters before lookup; no replay/heap/throughput regression was observed.
- Blockers: none; this is a narrowly scoped DEV regression addition.

## UPSTREAM-QA-HEALTH-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run the health projection regression and the full suite.
- Evidence: injected unknown store and diagnostic fields remain excluded from REST `GET /api/health`, JSON-RPC `getIndexerHealth`, and `GET /internal/feed/health`; established status/quality fields remain compatible.
- Affected contracts: REST, JSON-RPC, internal feed health, nested structure/chain/quality projections, and diagnostic redaction.
- Expected versus actual: explicit allowlists omit unknown fields and unhealthy state fails closed; actual behavior matches.
- Acceptance criteria: explicit projection allowlists at every health endpoint, stable documented fields/status, and green regression/replay checks.
- Validation results: full suite 347/347, syntax 83/83, and all replay invariants PASS.
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
- Validation results: full suite 347/347, syntax 83/83, and all replay invariants PASS.
- Compatibility/performance impact: successful payloads remain unchanged and checks remain mint-scoped.
- Blockers: none.

## UPSTREAM-QA-OPS-001

- Severity: `BLOCKED`
- Owner: `DEV`
- Reproduction: inspect provider/status configuration by presence only; load `data/index.json` and `data/mainnet-index.json` through `IndexStore.health(120000)`; assess retained `data/external-exporter-status.json` with the repository exporter-health contract.
- Evidence: RPC/WebSocket provider variables and default active exporter, warehouse checkpoint/failure, backup, and recovery files are absent. Both retained indexes fail closed with `status=wrong_network`, `healthy=false`, and `reason=indexed_block_mainnet_identity_missing_or_invalid`. Retained external evidence is finalized with zero recorded failures but fails `exporter_lagging` at 406,432 slots behind, a 512-slot maximum, and 295,239,434 ms age.
- Affected contracts: current ingestion freshness/finality, failover, warehouse convergence, backup/recovery readiness, public health, bot readiness, and live token/holder/whale/trader/pool/price/liquidity/volume qualification.
- Expected behavior: redacted fresh canonical-mainnet provider, exporter, exact warehouse convergence, backup, and recovery evidence are available; any missing, stale, lagged, malformed, or wrong-network input fails closed.
- Actual behavior: current live qualification cannot run; retained evidence correctly fails closed and was not treated as authoritative current mainnet data.
- Acceptance criteria: provide a redacted current canonical-mainnet operational evidence bundle with exact warehouse and fresh backup/recovery qualification while retaining every fail-closed boundary.
- Validation results: repository retry/failover, operational evidence, recovery, redaction, full regression, and replay checks pass; no provider, database, or production mutation was attempted.
- Compatibility/performance impact: no contract regression observed; sustained live ingestion and sink performance remain unqualified.
- Blockers: no configured provider endpoints or fresh active exporter/warehouse/backup/recovery evidence.

- NEXT_DEV_ACTION: complete `UPSTREAM-QA-PATH-PARAMETER-003` with the committed 16-consumer table-driven regression, valid-route preservation, and zero internal-failure telemetry assertions; then provide the still-required redacted fresh canonical-mainnet operational evidence bundle.
