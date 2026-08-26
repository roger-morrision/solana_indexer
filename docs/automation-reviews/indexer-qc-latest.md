# UPSTREAM-QA Solana Indexer QC/QA

- Run: `2026-08-26T16:37:14+07:00`
- Scope: `C:\Tuan\devApps\solana_indexer`
- Revision: `a6eb293ab2e7f31599bc96542b7c757958643d15`
- Compared with QA baseline: `c76cfa2` (3 commits, 5 changed files)
- Compared with `origin/main`: 5 ahead, 0 behind
- Latest DEV handoffs: `UPSTREAM-PROVIDER-PREFLIGHT-003`, `UPSTREAM-PROVIDER-URL-004`, and `UPSTREAM-CLI-ENTRYPOINT-005`
- Overall result: all three available readiness/provider changes pass independent verification. Canonically equivalent local provider identities and credential/path/query/fragment-bearing local URLs now fail closed, and aliased readiness invocation executes instead of silently succeeding. Live qualification remains blocked by absent fresh canonical evidence.

## Reviewed DEV delta (3/20)

| Item | Status | Evidence |
|---|---|---|
| `UPSTREAM-PROVIDER-PREFLIGHT-003` | `PASS` | Commit `7e78632` compares the canonical URLs returned by the RPC and WebSocket validators. Independent mixed-case/default-port/trailing-slash controls reject two effective `localhost` identities as `provider_configuration_invalid`, while a distinct IPv4/IPv6 two-pair topology remains healthy. |
| `UPSTREAM-PROVIDER-URL-004` | `PASS` | Commit `e8fb4c7` rejects userinfo, non-root paths, queries, and fragments for both local RPC and WebSocket endpoints. The committed focused matrix passes, and eight independent authority cases are rejected without disclosing their values. Root loopback URLs remain compatible. |
| `UPSTREAM-CLI-ENTRYPOINT-005` | `PASS` | Commit `a6eb293` compares canonical real paths for the invoked and module files, retaining a deterministic lexical fallback when resolution fails. The injected alias-identity regression passes; direct health smoke emits schema v2 and the expected blocked exit 1 instead of silent success. |

- Available DEV delta: exactly 3 distinct fixes after `c76cfa2`; the complete delta was exhausted.
- Verification result: 3 PASS, 0 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 17 because no other distinct DEV outcome exists after the prior QA commit. No evidence was duplicated or split to manufacture the count.

## Independent 22-domain reconciliation

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
| Bounded performance | `PASS` | Full suite passes 348/348; syntax passes 84/84; replay completes at 7,547.45 blocks/s with 8,902,232-byte heap growth below 536,870,912 bytes. |
| Live operational qualification | `BLOCKED` | Provider variables and active exporter/warehouse/backup/recovery status files are absent; both retained indexes report `wrong_network`; retained finalized exporter evidence is 406,432 slots behind and 366,917,519 ms old at the trigger time. |

The contract minimum is satisfied with 22 distinct evidence domains: 21 PASS, 0 FAIL, and 1 BLOCKED. These domains use separate contracts or failure boundaries and are not cosmetic splits.

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

## UPSTREAM-QA-OPS-001

- Severity: `BLOCKED`
- Owner: `DEV`
- Reproduction: run `npm run health:operational`; load `data/index.json` and `data/mainnet-index.json` through `IndexStore.health(120000)`; assess retained `data/external-exporter-status.json` with the repository exporter-health contract.
- Evidence: the schema-v2 operational smoke exits 1 with nine ordered blockers: provider, index events, transactions, instructions, freshness, exporter, warehouse, backup, and recovery. RPC/WebSocket provider variables and default active exporter, warehouse checkpoint/failure, backup, and recovery files are absent. Both retained indexes fail closed with `status=wrong_network`, `healthy=false`, and `reason=indexed_block_mainnet_identity_missing_or_invalid`. Retained external evidence is finalized with zero recorded failures but fails `exporter_lagging` at 406,432 slots behind, a 512-slot maximum, and 366,917,519 ms age at the trigger time.
- Affected contracts: current ingestion freshness/finality, failover, warehouse convergence, backup/recovery readiness, public health, bot readiness, and live token/holder/whale/trader/pool/price/liquidity/volume qualification.
- Expected behavior: redacted fresh canonical-mainnet provider, exporter, exact warehouse convergence, backup, and recovery evidence are available; any missing, stale, lagged, malformed, or wrong-network input fails closed.
- Actual behavior: current live qualification cannot run; retained evidence correctly fails closed and was not treated as authoritative current mainnet data.
- Acceptance criteria: provide a redacted current canonical-mainnet operational evidence bundle with exact warehouse and fresh backup/recovery qualification while retaining every fail-closed boundary.
- Validation results: repository retry/failover, operational evidence, recovery, redaction, full regression, and replay checks pass; no provider, database, or production mutation was attempted.
- Compatibility/performance impact: no contract regression observed; sustained live ingestion and sink performance remain unqualified.
- Blockers: no configured provider endpoints or fresh active exporter/warehouse/backup/recovery evidence.

- NEXT_DEV_ACTION: provide the redacted current canonical-mainnet provider, exporter, exact warehouse-convergence, backup, and recovery evidence bundle required to qualify live operation.
