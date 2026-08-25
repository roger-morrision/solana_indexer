# UPSTREAM-QA Solana Indexer QC/QA

- Run: `2026-08-25T17:43:30+07:00`
- Scope: `C:\Tuan\devApps\solana_indexer`
- Revision: `631747af9ed79c9a389feaa3021f6252a72031b6`
- Compared with: `origin/main` (2 ahead, 0 behind)
- Latest DEV handoff: `UPSTREAM-TOKEN-PROJECTION-002`
- Overall result: changed token projection contracts and full regression verification passed; operational/provider qualification remains blocked by absent fresh evidence.

## UPSTREAM-QA-HEALTH-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run `node --test --test-name-pattern="index health exposes only stable REST, RPC, and feed evidence" test/indexer.test.js`, then `node --test`.
- Evidence: the focused regression passed 1/1 at the original reviewed revision and the full suite passed 346/346 at revision `631747a`; injected unknown `providerCredential` fields did not escape through REST `GET /api/health`, JSON-RPC `getIndexerHealth`, or `GET /internal/feed/health`.
- Affected contracts: REST health, JSON-RPC health, internal feed health, nested structure/chain/quality projections, diagnostic redaction.
- Expected behavior: established aggregate and quality fields remain compatible; unknown store or diagnostic fields are omitted; unhealthy state continues to fail closed with stable status semantics.
- Actual behavior: matches expected behavior in focused and full regression coverage.
- Acceptance criteria: explicit projection allowlists at every changed endpoint; no unknown-field disclosure; existing status and documented fields preserved; full regression suite green.
- Validation results: JavaScript syntax passed; fixture replay passed canonical counts, duplicate idempotency, bounded reorg correction, bounded heap growth, and throughput invariants.
- Compatibility impact: additive hardening only; no observed removal of established response fields.
- Performance impact: 1,000-block replay completed at 4,409.53 blocks/second with 9,774,616 bytes heap growth, below the 536,870,912-byte bound.
- Blockers: none for the committed health projection contract.

## UPSTREAM-QA-TOKEN-PROJECTION-002

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run `node --test --test-name-pattern="indexes loaded-address token balance changes|snapshot readiness and consumers reject content-addressed holder divergence" test/indexer.test.js`, then start an in-memory server with one canonical mint snapshot, corrupt an unrelated pool snapshot, and query `GET /api/v1/holders/:mint` plus `GET /api/v1/token-account/:address`; next diverge that mint's token-account balance and repeat the queries.
- Evidence: the focused regressions passed 2/2. Independent HTTP verification returned 200 for both routes despite unrelated pool corruption, then returned HTTP 503 with `indexed_holder_evidence_unavailable` and `indexed_token_account_evidence_unavailable` after relevant mint projection divergence. The full suite passed 346/346 and all 83 JavaScript files passed syntax checks.
- Affected contracts: REST holder and token-account detail projections, mint-scoped canonical balance/snapshot evidence, failure envelopes, explicit field projection and secret redaction.
- Expected behavior: unrelated pool corruption does not make valid mint-scoped token evidence unavailable; corruption of the requested mint fails both routes closed; successful payloads remain unchanged and unknown internal fields never escape.
- Actual behavior: matches expected behavior in committed regressions and independent route-level verification.
- Acceptance criteria: both REST routes are isolated from unrelated aggregate/snapshot evidence; both reject relevant token-account or holder-snapshot divergence with stable retryable reasons; established successful projections and redaction remain compatible; full regression and replay checks pass.
- Validation results: focused tests passed 2/2; full tests passed 346/346; syntax passed for 83/83 JavaScript files; the 1,000-block replay preserved canonical counts, duplicate idempotency, bounded reorg correction, heap, and throughput invariants.
- Compatibility impact: successful response shapes are unchanged; two explicit HTTP 503 reasons replace unsafe reads or over-broad global failures for the affected routes.
- Performance impact: route checks remain mint-scoped; the 1,000-block replay completed at 4,409.53 blocks/second with 9,774,616 bytes heap growth under the 536,870,912-byte bound.
- Blockers: none for `UPSTREAM-TOKEN-PROJECTION-002`.

## UPSTREAM-QA-OPS-001

- Severity: `BLOCKED`
- Owner: `DEV`
- Reproduction: inspect provider/status configuration by presence only, then load `data/index.json` through `IndexStore` and evaluate `health(120000)`.
- Evidence: RPC/WebSocket provider variables and the active exporter, warehouse, backup, and recovery status files were absent. A retained external exporter document was valid mainnet/finalized evidence but was 406,432 slots behind and more than three days old, so it failed closed as `exporter_lagging` and could not qualify current operations. The unchanged local 5,311,696-byte index retained canonical aggregate/snapshot projections but returned `status=wrong_network`, `healthy=false`, and `reason=indexed_block_mainnet_identity_missing_or_invalid`.
- Affected contracts: ingestion freshness/finality, provider failover, warehouse convergence, backup/recovery readiness, public health, bot readiness, live token/holder/whale/trader/pool/price/liquidity/volume qualification.
- Expected behavior: current canonical mainnet provider and durable operational evidence are available for live qualification, and any missing or wrong-network evidence fails consumers closed.
- Actual behavior: live qualification could not run; the available local evidence correctly failed closed and was not treated as authoritative mainnet data.
- Acceptance criteria: provide redacted current mainnet exporter evidence plus exact warehouse convergence and fresh backup/recovery evidence; retain fail-closed behavior for missing, stale, malformed, lagged, or wrong-network inputs.
- Validation results: provider Retry-After parsing is bounded to 1,000-3,600,000 ms and related retry/failover tests passed; no live provider, database, or production mutation was attempted.
- Compatibility impact: none observed; this is an evidence-availability blocker, not a contract regression.
- Performance impact: live sustained ingestion and sink performance remain unqualified.
- Blockers: no configured provider endpoints; no fresh active exporter/warehouse/backup/recovery status evidence; retained external exporter evidence is stale and 406,432 slots behind; local index is not canonical mainnet evidence.

- NEXT_DEV_ACTION: provide a redacted, fresh canonical-mainnet operational evidence bundle for live ingestion, convergence, recovery, and contract qualification.
