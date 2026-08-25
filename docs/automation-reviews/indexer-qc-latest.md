# UPSTREAM-QA Solana Indexer QC/QA

- Run: `2026-08-25T19:43:36+07:00`
- Scope: `C:\Tuan\devApps\solana_indexer`
- Revision: `93e1259d4eee42dd6a6b5f8bb677d1a8111cbeff`
- Compared with QA baseline: `b444cf6` (1 commit, 3 changed files)
- Compared with `origin/main`: 4 ahead, 0 behind
- Latest DEV handoff: `UPSTREAM-PATH-PARAMETER-003`
- Overall result: the full regression and replay suites pass, but the reviewed path-parameter fix fails its deterministic HTTP 400 contract on an empty transaction collection; live operational/provider qualification remains blocked by absent fresh evidence.

## Reviewed DEV delta (1/20)

| Item | Status | Evidence |
|---|---|---|
| `UPSTREAM-PATH-PARAMETER-003` | `FAIL` | The committed focused regression passes for token-account paths, but independent route verification returns 404 for `GET /api/transaction/%ZZ` when the canonical transaction collection is empty and 400 for the same path after one transaction is indexed. |

- Available DEV delta: exactly 1 distinct fix/enhancement after `b444cf6`; the complete delta was exhausted.
- Verification result: 0 PASS, 1 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 19 because no other distinct DEV fix or enhancement exists in the reviewed delta. No evidence was duplicated, split, padded, or reused to manufacture the count.

## Independent 21-domain reconciliation

| Domain | Status | Concrete evidence |
|---|---|---|
| Path-parameter boundary | `FAIL` | Focused test passes 1/1, but independent empty-versus-populated transaction-route reproduction exposes state-dependent 404/400 behavior. |
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
| Bounded performance | `PASS` | Full suite passes 347/347; syntax passes 83/83; replay completes at 3,355.75 blocks/s with 9,802,168-byte heap growth below 536,870,912 bytes. |
| Live operational qualification | `BLOCKED` | Provider variables and active exporter/warehouse/backup/recovery status files are absent; both retained indexes report `wrong_network`; retained finalized exporter evidence is 406,432 slots behind and 291,623,930 ms old. |

The contract minimum is satisfied with 21 distinct evidence domains: 19 PASS, 1 FAIL, and 1 BLOCKED. These domains use separate contracts or failure boundaries and are not cosmetic splits.

## UPSTREAM-QA-PATH-PARAMETER-003

- Severity: `FAIL (medium)`
- Owner: `DEV`
- Reproduction: start `createServer({}, new IndexStore("unused"))` after `load()` and request `GET /api/transaction/%ZZ`; observe HTTP 404 `{ "error": "not_found" }`. Apply the canonical block fixture so `indexedTransactions().data` is non-empty and repeat; observe the intended HTTP 400 `{ "error": "bad_request", "detail": "path parameter must use canonical percent encoding" }`.
- Evidence: `src/server.js` decodes the path inside `view.data.find(...)`, so an empty collection never evaluates `decodePathParameter`. The committed regression checks only malformed and delimiter-decoding token-account routes. Independent healthy route-matrix verification returned the expected 400 envelope for the other 15 resource consumers and zero `http_internal_error` diagnostics.
- Affected contracts: REST `GET /api/transaction/:signature`, shared path-parameter validation, client retry/error classification, and route-level regression coverage.
- Expected behavior: every matched malformed resource path receives the same deterministic HTTP 400 controlled-validation envelope before collection lookup, regardless of indexed state.
- Actual behavior: the transaction route returns HTTP 404 while empty and HTTP 400 while populated for the identical malformed path.
- Acceptance criteria: decode and validate the captured transaction signature exactly once before searching; add empty and populated transaction-route regressions plus a shared 16-consumer malformed/delimiter matrix; preserve valid route responses; assert the internal failure counter and diagnostic callback remain unchanged.
- Validation results: focused committed regression 1/1 PASS; independent 16-consumer route matrix 15 PASS and 1 FAIL on the empty transaction collection; populated transaction reproduction PASS; full suite 347/347 PASS; syntax 83/83 PASS; replay invariants PASS.
- Compatibility impact: valid successful payloads remain unchanged; malformed transaction links change from state-dependent 404/400 to the documented terminal 400.
- Performance impact: decode/validation moves before a linear transaction lookup and is bounded to 256 decoded characters; no negative replay signal was observed.
- Blockers: none; this is a narrowly scoped DEV correction and regression addition.

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
- Evidence: RPC/WebSocket provider variables and default active exporter, warehouse checkpoint/failure, backup, and recovery files are absent. Both retained indexes fail closed with `status=wrong_network`, `healthy=false`, and `reason=indexed_block_mainnet_identity_missing_or_invalid`. Retained external evidence is finalized with zero recorded failures but fails `exporter_lagging` at 406,432 slots behind, a 512-slot maximum, and 291,623,930 ms age.
- Affected contracts: current ingestion freshness/finality, failover, warehouse convergence, backup/recovery readiness, public health, bot readiness, and live token/holder/whale/trader/pool/price/liquidity/volume qualification.
- Expected behavior: redacted fresh canonical-mainnet provider, exporter, exact warehouse convergence, backup, and recovery evidence are available; any missing, stale, lagged, malformed, or wrong-network input fails closed.
- Actual behavior: current live qualification cannot run; retained evidence correctly fails closed and was not treated as authoritative current mainnet data.
- Acceptance criteria: provide a redacted current canonical-mainnet operational evidence bundle with exact warehouse and fresh backup/recovery qualification while retaining every fail-closed boundary.
- Validation results: repository retry/failover, operational evidence, recovery, redaction, full regression, and replay checks pass; no provider, database, or production mutation was attempted.
- Compatibility/performance impact: no contract regression observed; sustained live ingestion and sink performance remain unqualified.
- Blockers: no configured provider endpoints or fresh active exporter/warehouse/backup/recovery evidence.

- NEXT_DEV_ACTION: fix `UPSTREAM-QA-PATH-PARAMETER-003` by validating the transaction path before collection search and add empty/populated plus 16-consumer route-matrix regressions; then provide the still-required redacted fresh canonical-mainnet operational evidence bundle.
