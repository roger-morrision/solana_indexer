# UPSTREAM-QA Solana Indexer QC/QA

- Run: `2026-08-25T16:42:12+07:00`
- Scope: `C:\Tuan\devApps\solana_indexer`
- Revision: `f9abf0f594fbfa6989cea38209826c467f670d4e`
- Compared with: `origin/main` (0 ahead, 0 behind)
- Latest DEV handoff: `UPSTREAM-HEALTH-ENVELOPE-001`
- Overall result: code and fixture verification passed; operational/provider qualification blocked by absent evidence.

## UPSTREAM-QA-HEALTH-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run `node --test --test-name-pattern="index health exposes only stable REST, RPC, and feed evidence" test/indexer.test.js`, then `node --test`.
- Evidence: the focused regression passed 1/1 and the full suite passed 346/346 at revision `f9abf0f`; injected unknown `providerCredential` fields did not escape through REST `GET /api/health`, JSON-RPC `getIndexerHealth`, or `GET /internal/feed/health`.
- Affected contracts: REST health, JSON-RPC health, internal feed health, nested structure/chain/quality projections, diagnostic redaction.
- Expected behavior: established aggregate and quality fields remain compatible; unknown store or diagnostic fields are omitted; unhealthy state continues to fail closed with stable status semantics.
- Actual behavior: matches expected behavior in focused and full regression coverage.
- Acceptance criteria: explicit projection allowlists at every changed endpoint; no unknown-field disclosure; existing status and documented fields preserved; full regression suite green.
- Validation results: JavaScript syntax passed; fixture replay passed canonical counts, duplicate idempotency, bounded reorg correction, bounded heap growth, and throughput invariants.
- Compatibility impact: additive hardening only; no observed removal of established response fields.
- Performance impact: 1,000-block replay completed at 3,286.36 blocks/second with 9,785,688 bytes heap growth, below the 536,870,912-byte bound.
- Blockers: none for the committed health projection contract.

## UPSTREAM-QA-OPS-001

- Severity: `BLOCKED`
- Owner: `DEV`
- Reproduction: inspect provider/status configuration by presence only, then load `data/index.json` through `IndexStore` and evaluate `health(120000)`.
- Evidence: RPC/WebSocket provider variables and exporter, warehouse, backup, and recovery status files were absent. The local 5,311,696-byte index was structurally canonical but returned `status=wrong_network`, `healthy=false`, and `reason=indexed_block_mainnet_identity_missing_or_invalid` at tip 1617.
- Affected contracts: ingestion freshness/finality, provider failover, warehouse convergence, backup/recovery readiness, public health, bot readiness, live token/holder/whale/trader/pool/price/liquidity/volume qualification.
- Expected behavior: current canonical mainnet provider and durable operational evidence are available for live qualification, and any missing or wrong-network evidence fails consumers closed.
- Actual behavior: live qualification could not run; the available local evidence correctly failed closed and was not treated as authoritative mainnet data.
- Acceptance criteria: provide redacted current mainnet exporter evidence plus exact warehouse convergence and fresh backup/recovery evidence; retain fail-closed behavior for missing, stale, malformed, lagged, or wrong-network inputs.
- Validation results: provider Retry-After parsing is bounded to 1,000-3,600,000 ms and related retry/failover tests passed; no live provider, database, or production mutation was attempted.
- Compatibility impact: none observed; this is an evidence-availability blocker, not a contract regression.
- Performance impact: live sustained ingestion and sink performance remain unqualified.
- Blockers: no configured provider endpoints; no exporter/warehouse/backup/recovery status evidence; local index is not canonical mainnet evidence.

- NEXT_DEV_ACTION: provide a redacted, fresh canonical-mainnet operational evidence bundle for live ingestion, convergence, recovery, and contract qualification.
