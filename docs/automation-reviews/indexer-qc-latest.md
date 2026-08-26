# UPSTREAM-QA Solana Indexer QC/QA

- Run: `2026-08-26T14:35:16+07:00`
- Scope: `C:\Tuan\devApps\solana_indexer`
- Revision: `fca03c7e6dd0f883cabc75d8aa34db7af106b34c`
- Compared with QA baseline: `d235b95` (4 commits, 5 changed files)
- Compared with `origin/main`: 1 ahead, 0 behind
- Latest DEV handoff: `UPSTREAM-PROVIDER-PREFLIGHT-001`
- Overall result: 19 of 20 operational-diagnostic enhancements pass independent verification. Commit `fca03c7` closes missing/public/mismatched local WebSocket validation, but the provider diagnostic still accepts duplicate RPC or WebSocket endpoints that the actual exporter/stream constructors reject. Live qualification remains blocked by absent fresh canonical evidence.

## Reviewed DEV delta (20/20)

| Item | Status | Evidence |
|---|---|---|
| `UPSTREAM-OPS-DIAGNOSTICS-001` | `FAIL` | Commit `fca03c7` now validates local WebSocket presence, loopback identity, and RPC/WebSocket cardinality, but `assessProviderConfiguration` still returns healthy for duplicate RPC or duplicate WebSocket endpoint lists that the actual local pool/stream constructors reject. |
| `UPSTREAM-OPS-DIAGNOSTICS-002` | `PASS` | `index_structure` is bound to `structureQuality().canonical`; isolated compile validation emits only the stable check and allowlisted reason. |
| `UPSTREAM-OPS-DIAGNOSTICS-003` | `PASS` | `index_chain` is bound to `chainQuality().canonical`; the live smoke emits the ordered dimension and full regressions retain parent/hash conflict rejection. |
| `UPSTREAM-OPS-DIAGNOSTICS-004` | `PASS` | `index_events` is bound to `eventQuality().canonical`; the current index independently reports `indexed_event_log_invalid`. |
| `UPSTREAM-OPS-DIAGNOSTICS-005` | `PASS` | `index_transactions` is bound to `indexedTransactions().available`; the current index independently reports `indexed_transaction_evidence_invalid`. |
| `UPSTREAM-OPS-DIAGNOSTICS-006` | `PASS` | `index_instructions` is bound to `instructionQuality().canonical`; the current index independently reports `indexed_instruction_evidence_invalid`. |
| `UPSTREAM-OPS-DIAGNOSTICS-007` | `PASS` | `decoder_registry` is bound to `decoderRegistryQuality().current`; the existing obsolete-registry fail-closed regression passes. |
| `UPSTREAM-OPS-DIAGNOSTICS-008` | `PASS` | `decoder_output` is bound to `decoderOutputCoverageQuality().complete`; execution and lifecycle coverage regressions pass. |
| `UPSTREAM-OPS-DIAGNOSTICS-009` | `PASS` | `indexed_swaps` is bound to `indexedSwaps().available`; corrupt and detached swap evidence remains fail closed. |
| `UPSTREAM-OPS-DIAGNOSTICS-010` | `PASS` | `program_events` is bound to `programEventQuality().canonical`; lifecycle corruption regressions pass. |
| `UPSTREAM-OPS-DIAGNOSTICS-011` | `PASS` | `derived_ledger` is bound to `derivedLedgerQuality().canonical`; consumer and warehouse divergence regressions pass. |
| `UPSTREAM-OPS-DIAGNOSTICS-012` | `PASS` | `aggregate_projections` is bound to `aggregateQuality().canonical`; divergent aggregate projections remain unavailable. |
| `UPSTREAM-OPS-DIAGNOSTICS-013` | `PASS` | `snapshot_projections` is bound to `snapshotQuality().canonical`; content-addressed holder divergence remains unavailable. |
| `UPSTREAM-OPS-DIAGNOSTICS-014` | `PASS` | `metadata_projections` is bound to `metadataQuality().canonical`; detached enrichment remains quarantined. |
| `UPSTREAM-OPS-DIAGNOSTICS-015` | `PASS` | `recovery_state` requires canonical evidence and no capacity overflow; recovery/dead-letter corruption regressions pass. |
| `UPSTREAM-OPS-DIAGNOSTICS-016` | `PASS` | `index_freshness` reuses `IndexStore.health`; current evidence reports `indexed_block_mainnet_identity_missing_or_invalid` without leaking internals. |
| `UPSTREAM-OPS-DIAGNOSTICS-017` | `PASS` | `exporter` reuses the bounded exporter assessor; absent active evidence reports `status_unavailable`. |
| `UPSTREAM-OPS-DIAGNOSTICS-018` | `PASS` | `warehouse` combines checkpoint and failure assessment; absent active evidence reports `checkpoint_unavailable`. |
| `UPSTREAM-OPS-DIAGNOSTICS-019` | `PASS` | `backup` reuses the bounded backup assessor; absent active evidence reports `backup_status_unavailable`. |
| `UPSTREAM-OPS-DIAGNOSTICS-020` | `PASS` | `recovery` reuses qualification assessment; absent active evidence reports `recovery_qualification_unavailable`. |

- Available DEV delta: 20 distinct diagnostic enhancements plus the provider correction across commits `dbd4d28`, `7da3b81`, `190343f`, and `fca03c7`; the complete stable-ID delta was exhausted.
- Verification result: 19 PASS, 1 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 0. Each stable DEV item maps to a distinct readiness dimension and underlying quality boundary.

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
| Operational readiness diagnostics | `FAIL` | The schema-v2 report contains all twenty ordered redacted dimensions and now validates local WebSocket topology, but the local `provider` check still accepts duplicate RPC or WebSocket endpoints that runtime constructors reject. |
| Bounded performance | `PASS` | Full suite passes 348/348; syntax passes 84/84; replay completes at 7,015.27 blocks/s with 9,915,024-byte heap growth below 536,870,912 bytes. |
| Live operational qualification | `BLOCKED` | Provider variables and active exporter/warehouse/backup/recovery status files are absent; both retained indexes report `wrong_network`; retained finalized exporter evidence is 406,432 slots behind and 384,799,508 ms old. |

The contract minimum is satisfied with 22 distinct evidence domains: 20 PASS, 1 FAIL, and 1 BLOCKED. These domains use separate contracts or failure boundaries and are not cosmetic splits.

## UPSTREAM-QA-PATH-PARAMETER-003

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run `test/indexer.test.js` test `resource routes reject malformed or delimiter-decoding path parameters`; it exercises malformed escapes and decoded delimiters for preparation, quote, evidence, token, wallet, price, volume, transaction, account, mint, holder, token-account, pool, candle, and risk consumers, with empty/populated transaction state and a valid transaction control.
- Evidence: the committed test passes 32/32 consumer-matrix checks, retains 4/4 empty-state token-account/transaction checks and 2/2 populated transaction checks, preserves `signature-1` with HTTP 200, captures zero diagnostics, and observes `terminal_dex_internal_failures_total{operation="http_internal_error"} 0`.
- Affected contracts: shared REST/internal path-parameter validation, regression coverage for 16 resource consumers, internal failure metrics, diagnostic callback behavior, and client retry/error classification.
- Expected behavior: the source correction and committed regression together cover empty/populated transaction state, all 16 malformed/delimiter consumer boundaries, valid-route preservation, and unchanged internal-failure telemetry.
- Actual behavior: the committed regression now matches the expected controlled HTTP 400 and telemetry contracts across the complete scoped matrix.
- Acceptance criteria: committed table-driven 16-consumer malformed/delimiter matrix; retained empty and populated transaction checks; preserved valid transaction route; zero internal-failure counter and diagnostic callbacks. All criteria are met.
- Validation results: focused committed regression 1/1 PASS; malformed/delimiter matrix 32/32 PASS plus retained empty/populated transaction checks; valid transaction preservation PASS; diagnostics 0 PASS; internal-failure metric 0 PASS; full suite 348/348 PASS; syntax 84/84 PASS; replay invariants PASS at 7,015.27 blocks/s and 9,915,024-byte heap growth.
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

- Severity: `FAIL` (`HIGH`)
- Owner: `DEV`
- Reproduction: call `assessProviderConfiguration` with two identical loopback values in `LOCAL_VALIDATOR_RPCS` and two distinct loopback values in `LOCAL_VALIDATOR_WSS`; then repeat with distinct RPC values and duplicate WebSocket values.
- Evidence: both unusable configurations return `{ available: true, healthy: true, reason: null, mode: "local_validator" }`. `LocalValidatorPool` and `LocalValidatorStream` explicitly reject duplicate endpoint sets, but the preflight performs no uniqueness check. Commit `fca03c7` independently passes missing WebSocket, public WebSocket, cardinality mismatch, valid single-pair, and external failover cases.
- Affected contracts: `npm run health:operational`, `upstream_operational_readiness` schema v2 `provider` check, aggregate `ready`, local polling/streaming qualification, operator incident response, and any QC/automation gate consuming the report.
- Expected behavior: local provider readiness is healthy only when the selected RPC and WebSocket endpoint sets are both canonical loopback URLs, unique, within supported bounds, and cardinality-compatible.
- Actual behavior: presence, loopback validation, and cardinality now work, but duplicate endpoint sets are ignored, so the provider dimension can remain falsely healthy when runtime startup rejects the topology.
- Acceptance criteria: reject duplicate effective RPC and WebSocket endpoint sets with stable redacted `provider_configuration_invalid`; add focused duplicate-RPC and duplicate-WebSocket regressions; preserve the new missing/public/mismatched/valid topology coverage, external Helius/Alchemy behavior, and secret redaction.
- Validation results: independent duplicate-RPC and duplicate-WebSocket reproductions FAIL; the focused committed readiness test PASS does not exercise duplicates; full suite 348/348 PASS; syntax 84/84 PASS; replay invariants PASS. The green suite confirms the remaining regression-coverage gap rather than correctness of endpoint uniqueness.
- Compatibility impact: correcting the check intentionally changes false-positive local `provider.healthy=true` results to a stable blocked result; no REST/RPC/WebSocket payload change is required.
- Performance impact: bounded parsing of at most four configured RPC and WebSocket endpoints; negligible relative to state/evidence loading.
- Blockers: none; all required validation helpers and stream cardinality rules already exist in the repository.

## UPSTREAM-QA-OPS-001

- Severity: `BLOCKED`
- Owner: `DEV`
- Reproduction: run `npm run health:operational`; load `data/index.json` and `data/mainnet-index.json` through `IndexStore.health(120000)`; assess retained `data/external-exporter-status.json` with the repository exporter-health contract.
- Evidence: the schema-v2 operational smoke exits 1 with nine ordered blockers: provider, index events, transactions, instructions, freshness, exporter, warehouse, backup, and recovery. RPC/WebSocket provider variables and default active exporter, warehouse checkpoint/failure, backup, and recovery files are absent. Both retained indexes fail closed with `status=wrong_network`, `healthy=false`, and `reason=indexed_block_mainnet_identity_missing_or_invalid`. Retained external evidence is finalized with zero recorded failures but fails `exporter_lagging` at 406,432 slots behind, a 512-slot maximum, and 384,799,508 ms age.
- Affected contracts: current ingestion freshness/finality, failover, warehouse convergence, backup/recovery readiness, public health, bot readiness, and live token/holder/whale/trader/pool/price/liquidity/volume qualification.
- Expected behavior: redacted fresh canonical-mainnet provider, exporter, exact warehouse convergence, backup, and recovery evidence are available; any missing, stale, lagged, malformed, or wrong-network input fails closed.
- Actual behavior: current live qualification cannot run; retained evidence correctly fails closed and was not treated as authoritative current mainnet data.
- Acceptance criteria: provide a redacted current canonical-mainnet operational evidence bundle with exact warehouse and fresh backup/recovery qualification while retaining every fail-closed boundary.
- Validation results: repository retry/failover, operational evidence, recovery, redaction, full regression, and replay checks pass; no provider, database, or production mutation was attempted.
- Compatibility/performance impact: no contract regression observed; sustained live ingestion and sink performance remain unqualified.
- Blockers: no configured provider endpoints or fresh active exporter/warehouse/backup/recovery evidence.

- NEXT_DEV_ACTION: finish `UPSTREAM-QA-OPS-PROVIDER-002` by rejecting duplicate local RPC and WebSocket endpoint sets in `assessProviderConfiguration`, with focused fail-closed and redaction regressions.
