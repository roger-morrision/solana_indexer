# Terminal DEX upstream handoff

## UPSTREAM-PROVIDER-PREFLIGHT-002

- BA/PO decision: the ranked 22-domain review selected provider identity uniqueness because duplicate endpoint strings falsely represent failover redundancy and can concentrate both logical nodes on one connection.
- Implemented contract: local readiness rejects duplicate RPC identities and duplicate WebSocket identities after trimming, while retaining the 1-4 endpoint, loopback, and cardinality rules.
- Compatibility/migration: additive fail-closed validation; operators must remove duplicate list entries. No downstream API/event change.
- Validation: focused duplicate-RPC and duplicate-WebSocket regressions plus full suite.
- Blockers/owners: live provider and operational evidence remain externally blocked/OPERATOR; broader protocols remain blocked on authoritative ABI fixtures/BA-PO.
- NEXT_WEB_ACTION: no WEB change; treat duplicate local endpoints as invalid operator configuration.

## UPSTREAM-PROVIDER-PREFLIGHT-001

- BA/PO decision: fresh QC evidence identified a production-significant false-positive in the local streaming readiness gate. This outranked speculative protocol work because it could incorrectly report an unusable provider topology healthy.
- Implemented contract: local mode now requires one to four explicit loopback RPC endpoints, the same number of explicit loopback WebSocket endpoints, and validates both schemes/hosts before reporting healthy. Missing WebSockets, public WebSockets, and cardinality mismatch fail closed as `provider_configuration_invalid`; external failover behavior is unchanged.
- Compatibility/migration: operators using local mode must configure matching `LOCAL_VALIDATOR_RPC(S)` and `LOCAL_VALIDATOR_WS(S)` values. No REST/RPC/WebSocket consumer payload changed.
- Validation: syntax, focused provider matrix, and full 348-test regression passed.
- 20/20 accounting: one new evidence-backed defect was available and delivered. Items 2-20 are blocked from honest implementation because the remaining roadmap entry, “Additional protocols remain,” supplies no selected protocol, authoritative ABI, account layout, or canonical fixture; treating variants of this provider fix as nineteen tasks would be padding.
- NEXT_WEB_ACTION: no WEB change; local operators must provide matching loopback RPC/WebSocket endpoint lists.

## BA/PO decision

- Batch: `UPSTREAM-OPS-DIAGNOSTICS-001` through `UPSTREAM-OPS-DIAGNOSTICS-020`.
- Evidence: schema-v1 readiness collapsed every retained-index failure into one `index` check although `IndexStore` exposes independent canonical quality boundaries. Operators could not distinguish structure, chain, event, transaction, instruction, decoder, projection, recovery, or freshness failure without unrelated internals.
- Selection: this twenty-check batch ranked highest for qualification, incident response, offline verification, compatibility containment, and low migration risk. It contacts no provider and mutates no production state.
- Scope: expand only the local `health:operational` contract and regression evidence. REST, RPC, WebSocket, warehouse, and persisted-index contracts remain unchanged.

## 20-finding and implementation ledger

| ID | Evidence-backed need and implemented outcome | Acceptance evidence |
|---|---|---|
| `UPSTREAM-OPS-DIAGNOSTICS-001` | Independent redacted provider gate: ordered `provider`. | Absent, partial, invalid local, valid loopback and allowlisted failover cases. |
| `UPSTREAM-OPS-DIAGNOSTICS-002` | State structure corruption was hidden: added `index_structure`. | `structureQuality().canonical`. |
| `UPSTREAM-OPS-DIAGNOSTICS-003` | Parent/hash conflict was hidden: added `index_chain`. | `chainQuality().canonical`. |
| `UPSTREAM-OPS-DIAGNOSTICS-004` | Event-log corruption was hidden: added `index_events`. | `eventQuality().canonical`. |
| `UPSTREAM-OPS-DIAGNOSTICS-005` | Transaction corruption was hidden: added `index_transactions`. | `indexedTransactions().available`. |
| `UPSTREAM-OPS-DIAGNOSTICS-006` | Instruction corruption was hidden: added `index_instructions`. | `instructionQuality().canonical`. |
| `UPSTREAM-OPS-DIAGNOSTICS-007` | Decoder registry drift lacked a gate: added `decoder_registry`. | `decoderRegistryQuality().current`. |
| `UPSTREAM-OPS-DIAGNOSTICS-008` | Decoder coverage lacked a gate: added `decoder_output`. | `decoderOutputCoverageQuality().complete`. |
| `UPSTREAM-OPS-DIAGNOSTICS-009` | Swap-log corruption lacked a gate: added `indexed_swaps`. | `indexedSwaps().available`. |
| `UPSTREAM-OPS-DIAGNOSTICS-010` | Lifecycle event corruption lacked a gate: added `program_events`. | `programEventQuality().canonical`. |
| `UPSTREAM-OPS-DIAGNOSTICS-011` | Derived ledger corruption lacked a gate: added `derived_ledger`. | `derivedLedgerQuality().canonical`. |
| `UPSTREAM-OPS-DIAGNOSTICS-012` | Aggregate corruption lacked a gate: added `aggregate_projections`. | `aggregateQuality().canonical`. |
| `UPSTREAM-OPS-DIAGNOSTICS-013` | Snapshot corruption lacked a gate: added `snapshot_projections`. | `snapshotQuality().canonical`. |
| `UPSTREAM-OPS-DIAGNOSTICS-014` | Metadata corruption lacked a gate: added `metadata_projections`. | `metadataQuality().canonical`. |
| `UPSTREAM-OPS-DIAGNOSTICS-015` | Recovery overflow lacked a gate: added `recovery_state`. | Canonical recovery with no capacity overflow. |
| `UPSTREAM-OPS-DIAGNOSTICS-016` | Freshness/mainnet identity needed separation: added `index_freshness`. | Existing fail-closed `health()` reason. |
| `UPSTREAM-OPS-DIAGNOSTICS-017` | Exporter evidence remains independently actionable: retained `exporter`. | Bounded exporter assessor. |
| `UPSTREAM-OPS-DIAGNOSTICS-018` | Warehouse convergence remains independently actionable: retained `warehouse`. | Checkpoint/failure assessors. |
| `UPSTREAM-OPS-DIAGNOSTICS-019` | Backup freshness remains independently actionable: retained `backup`. | Bounded backup assessor. |
| `UPSTREAM-OPS-DIAGNOSTICS-020` | Recovery qualification remains independently actionable: retained `recovery`. | Bounded recovery assessor. |

## Contract and compatibility

- Changed command: `npm run health:operational` emits `upstream_operational_readiness` schema v2 with exactly twenty stable ordered checks and blocker entries.
- Compatibility: intentional local-tool schema bump from v1 to v2; no REST/RPC/WebSocket/event change. Operators parsing v1 check names must accept the v2 catalog.
- Migration/configuration: no new configuration. Endpoint values and unknown reason text remain redacted; unknown reasons collapse to `<check>_evidence_invalid`.
- Validation: source syntax and focused v2 order/redaction passed; full regression passed 348/348; current-evidence smoke returned schema v2 with twenty checks and failed closed; canonical 1,000-block replay/load completed successfully.
- Blockers: provider configuration and fresh canonical operational evidence remain unavailable; the tool diagnoses but cannot manufacture them.
- NEXT_WEB_ACTION: no WEB code change; treat schema v2 as operator/QC evidence and enable consumers only when `ready` is true.
