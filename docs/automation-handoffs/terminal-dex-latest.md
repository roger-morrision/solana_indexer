# Terminal DEX upstream handoff

## UPSTREAM-QUERY-CACHE-001

- BA/PO decision: a fresh 22-domain review found the machine-readable query artifact lacked a content identity and conditional retrieval contract. WEB/SDK startup checks therefore had to download and compare the full payload on every refresh and could not bind generated builders to exact discovery evidence.
- Selected IDs: `UPSTREAM-QUERY-CACHE-001-01` through `-20`, binding the representative HTTP/WebSocket discovery outcomes to one deterministic artifact identity plus strong, weak, list, wildcard, mismatch, bodyless-304, version-header, cache-policy, and ignored-query behavior.
- Implemented contract: `GET /api/v1/query-contracts` adds `contractSha256`, computed over the complete artifact excluding the digest field, and emits the same quoted value as `ETag`. Matching strong/weak/list/wildcard `If-None-Match` requests return bodyless 304 with the API version and a private five-minute cache policy; mismatches return the full contract.
- Compatibility/migration: additive response field and headers only. Existing clients remain compatible; clients may persist the digest/ETag but must not treat the private artifact as shared-cache public data.
- Validation: recomputed SHA-256 equality, deterministic repeated snapshot identity, strong/weak/list/wildcard/mismatch HTTP cases, bodyless 304, headers/cache policy, twenty representative discovery assertions, focused/full tests, replay/load, fail-closed readiness, syntax, and diff review.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: persist the query-contract ETag and use `If-None-Match` during WEB startup compatibility checks.

## UPSTREAM-WS-DISCOVERY-001

- BA/PO decision: a fresh 23-domain review and independent QC reproduction found the query discovery artifact listed global WebSocket filters but omitted topic compatibility. Generated builders could therefore create canonical requests rejected by the runtime parser.
- Selected IDs: `UPSTREAM-WS-DISCOVERY-001-01` through `-20`, covering accepted and rejected filter combinations for blocks, swaps, lifecycle, and snapshots.
- Implemented contract: `GET /api/v1/query-contracts` now publishes deterministic `topicContracts`: blocks accepts no filters; swaps accepts mint/pool/protocol; lifecycle and snapshots accept eventType/mint/pool/protocol. Cursor, acknowledgement, encoding, ordering, length, and event schemas are unchanged.
- Compatibility/migration: additive schema-version-1 fields only. Consumers should constrain generated filters by the selected topic before opening a socket; existing valid subscriptions remain valid.
- Validation: twenty discovery-to-parser parity cases, exact artifact equality, real discovery HTTP checks, focused/full tests, replay/load, fail-closed operational readiness, syntax, and diff review.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: generate topic-specific WebSocket builder types from `webSocket.topicContracts` and reject incompatible filters before connection.

## UPSTREAM-QUERY-DISCOVERY-001

- BA/PO decision: a fresh 24-domain review found the strict query boundary had no machine-readable discovery contract, forcing WEB, SDK, signing, caching, and commercial clients to duplicate route allowlists and ordering rules. Drift would reintroduce rejected requests or ambiguous identities.
- Selected IDs: `UPSTREAM-QUERY-DISCOVERY-001-01` through `-20`, covering five versioned collections, four discovery/analytics consumers, candles, quotes, depth, token views, wallet funding, volume, holders, bot readiness, RPC, and the discovery route itself; WebSocket metadata is included in the same versioned artifact.
- Implemented contract: `GET /api/v1/query-contracts` returns schema version 1, the canonicalization algorithm and guarantees, deterministic HTTP route/template parameter lists and methods, plus WebSocket parameters, topics, acknowledgement values, and filter bound. The endpoint declares an empty query contract and remains available when index evidence is unavailable.
- Compatibility/migration: additive authenticated REST endpoint only; existing payloads/events are unchanged. Consumers can generate sorted query strings from the published parameter arrays and must still validate value domains locally.
- Validation: twenty representative route assertions, WebSocket contract equality, stable ordering, real HTTP response/version header, rejected ignored query input, full tests, replay/load, fail-closed operational readiness, syntax, and diff review.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: generate shared WEB query builders from `GET /api/v1/query-contracts` and reject startup if its schema version is unsupported.

## UPSTREAM-QUERY-ORDER-001

- BA/PO decision: a fresh 27-domain review and independent QC reproduction found the canonical-encoding boundary still accepted semantically identical multi-parameter requests in different orders. That left cache, signature, audit, and replay identity ambiguous across HTTP and WebSocket consumers.
- Selected IDs: `UPSTREAM-QUERY-ORDER-001-01` through `-20`, covering trending/candidate windows, block/transaction/token/pool/swap pagination, quote/depth/candle inputs, and eight WebSocket cursor/topic/filter/ack combinations.
- Implemented contract: the shared boundary now compares requests with the stable key-sorted `URLSearchParams` serialization. Alternate order fails after authentication and quota admission; canonical order preserves existing response, event, persistence, and replay schemas.
- Compatibility/migration: clients with multi-parameter requests must sort decoded query names using the platform `URLSearchParams.sort()` order before serialization. Values and schemas are unchanged; this deliberately closes multiple wire identities for one semantic request.
- Validation: twenty alternate-order cases, canonical controls, real HTTP and WebSocket integration, focused/full tests, replay/load, fail-closed operational readiness, syntax, and complete diff review.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: sort query parameter names before serializing any multi-parameter HTTP or WebSocket request.

## UPSTREAM-QUERY-ENCODING-001

- BA/PO decision: fresh 23-domain review found HTTP and WebSocket query values were interpreted after decoding without requiring one canonical wire spelling. Percent-encoded unreserved characters, lowercase escapes, and alternate space encodings could therefore produce identical behavior under different cache, signature, audit, and replay identities.
- Selected IDs: `UPSTREAM-QUERY-ENCODING-001-01` through `-20`, covering pagination, token/pool/protocol/status filters, trending/candle windows, quote inputs, token depth, wallet limits, HTTP diagnostics, and WebSocket cursor/topic/filter/ack contracts.
- Implemented contract: one shared boundary requires the raw query string to equal the platform's canonical `URLSearchParams` serialization. Noncanonical HTTP requests fail after authentication/base quota admission with redacted HTTP 400; noncanonical WebSocket subscriptions fail after authorization/quota admission with `invalid_subscription`.
- Compatibility/migration: ordinary documented ASCII query strings remain unchanged. Clients must stop percent-encoding unreserved characters, using lowercase escape variants, or using noncanonical space encodings. Payload, replay, persistence, RPC, and event schemas are unchanged.
- Validation: twenty noncanonical contract cases, canonical controls, real HTTP wiring, WebSocket parser integration, focused quota/query tests, full suite, replay/load, fail-closed health, syntax, and diff checks.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: serialize HTTP and WebSocket query strings with one standards-based URLSearchParams encoder before request signing or caching.

## UPSTREAM-QUERY-PARITY-001

- BA/PO decision: fresh QC found four internal token projections still admitted an ignored `limit`, and independent WebSocket review found the upgrade query used first-value semantics, accepted unknown/unbounded filters, and admitted filters incompatible with their topic. These ambiguities affect cache identity, replay selection, authorization accounting, and consumer correctness.
- Selected IDs: `UPSTREAM-QUERY-PARITY-001-01` through `-23`: four exact token-view parameter corrections plus nineteen independently verified WebSocket duplicate-key, unknown-key, bounded-filter, topic-domain, topic-enum, and acknowledgement-enum outcomes.
- Implemented contract: token market/security/liquidity reject `limit`; executable-depth admits only `side` and `amountRaw`. WebSocket upgrades admit only one each of `cursor`, `topic`, `mint`, `pool`, `protocol`, `eventType`, and `ack`; filters are nonempty, control-free, and at most 64 characters; block subscriptions reject all filters and swap subscriptions reject `eventType`. Invalid subscriptions are rejected only after authorization and quota admission.
- Compatibility/migration: valid documented token and WebSocket requests are unchanged. Clients must remove ignored token limits, duplicate/unknown WebSocket keys, oversized filters, and topic-incompatible filters. Ready/replay/event shapes are unchanged.
- Validation: four token regression cases with five valid controls; nineteen invalid WebSocket cases with three valid controls; focused HTTP/WebSocket/quota checks; full suite; replay/load; fail-closed health; syntax and diff checks.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: align WEB WebSocket builders with the strict topic-specific filter contract and remove ignored token-view limits.

## UPSTREAM-HTTP-EMPTY-QUERY-001

- BA/PO decision: fresh 23-domain review found 22 recognized diagnostic, detail, preparation, RPC, and static contracts still ignored all query input. This could conceal client mistakes and split cache/signature identities even though the route semantics have no query dimension.
- Selected IDs: `UPSTREAM-HTTP-EMPTY-QUERY-001-01` through `-22`: RPC, metrics, health, stats, ingestion, warehouse, backup, recovery, registry, feed health/gaps, execution policy, pool/token preparation, evidence, price, transaction detail, token-account detail, pool detail, risk, root, and index document.
- Implemented contract: every selected route now declares an explicit empty query-key set. Any query name fails after authentication/base quota admission with the shared redacted HTTP 400 contract. Query-free requests remain unchanged.
- Compatibility/migration: clients must remove ignored query strings from these routes. Successful payloads, POST bodies, persistence, JSON-RPC dispatch, and WebSocket events are unchanged.
- Validation: 22-route rejection matrix, six query-free controls, real HTTP health wiring, focused query/quota checks, full suite, replay/load, fail-closed health, syntax, and diff checks.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: remove query strings from WEB calls to contracts documented as query-free.

## UPSTREAM-HTTP-QUERY-ALLOWLIST-001

- BA/PO decision: fresh QC passed all prior 50 outcomes, while independent request-boundary review found recognized routes silently ignored unknown query names. Misspelled pagination, filter, quote, analytics, and readiness inputs could therefore appear successful and create divergent client/cache/signature identities.
- Selected IDs: `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-01` through `-22`, covering internal trending, new pairs, candidates, pool quotes, token trades/OHLCV/executable depth, wallet funding; versioned blocks, transactions, swaps, tokens, pools, volume, readiness, holders and candles; plus legacy blocks, transactions, trending, account and mint views.
- Implemented contract: those 22 route families now admit only their documented query keys after authentication and base quota admission. Unsupported names fail with stable HTTP 400 `bad_request`; names and values are not echoed. Routes without a selected query contract retain their existing behavior.
- Compatibility/migration: documented parameters and successful response schemas are unchanged. Clients must correct misspelled or undocumented query keys that were previously ignored. No persistence, JSON-RPC method, or WebSocket event changed.
- Validation: 22-route rejection matrix, four valid multi-parameter controls, real HTTP wiring, quota-order regression, full suite, replay/load, fail-closed health, syntax, and diff checks.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: remove any undocumented query keys identified by WEB request-contract tests.

## UPSTREAM-HTTP-QUERY-CARDINALITY-001

- BA/PO decision: a fresh 23-domain review found query parameter pollution remained accepted across consumer and operator routes because `URLSearchParams.get` silently selected the first duplicate. Ambiguous pagination, filtering, quoting, analytics, and bot inputs ranked above externally blocked protocol expansion because the complete boundary is offline-verifiable and affects signed/cached request identity.
- Selected IDs: `UPSTREAM-HTTP-QUERY-CARDINALITY-001-01` through `-20`, covering trending limit/window, new pairs, candidates limit/window, quote amount/mint/tick, token trades/ohlcv/depth side/depth amount, wallet funding, block cursor, transaction limit, swap mint/protocol, token cursor, pool status, and candle interval.
- Implemented contract: every HTTP route now rejects any repeated query parameter name after authentication and base quota admission but before method/body/route processing, with stable HTTP 400 `bad_request`; values and parameter names are not echoed. Twenty representative independent route contracts and one valid multi-parameter control are regression-covered.
- Compatibility/migration: requests containing each parameter at most once are unchanged. Clients, caches, and request signers must stop emitting duplicate query keys. No response-success schema, persistence, RPC method, or WebSocket event changed.
- Validation: focused 20-route query-cardinality matrix, full suite, replay/load, fail-closed operational health, syntax, and diff checks.
- Blockers/owners: fresh live qualification evidence—OPERATOR; additional protocol selection and authoritative fixtures—BA/PO.
- NEXT_WEB_ACTION: ensure WEB request builders serialize each query parameter no more than once.

## UPSTREAM-CLI-ENTRYPOINT-007

- BA/PO decision: independent review reconciled 22 product domains, then fresh QC reproduction proved 30 remaining direct operator CLIs could silently return success when invoked through a filesystem alias. This was the highest-value dependency-ready batch because it affects health, recovery, retention, workers, synchronization, exporters, streams, and authoritative snapshots while remaining fully offline-verifiable.
- Implemented contract: all 30 legacy CLIs now use the shared canonical real-path identity guard. Imported modules remain side-effect free; direct canonical and aliased commands execute; resolution failure retains deterministic lexical comparison. An inventory regression rejects any reintroduction of the two legacy lexical guard forms.
- Compatibility/migration: no arguments, environment variables, output schemas, persistence, REST, RPC, or WebSocket contracts changed. No migration or configuration is required.
- Validation: per-file inventory regression, representative aliased health execution, syntax checks for every migrated module, focused CLI tests, full suite, replay/load, operational health smoke, and complete diff review.
- Blockers/owners: fresh live qualification evidence remains unavailable—OPERATOR; additional protocol selection and authoritative fixtures remain—BA/PO.
- NEXT_WEB_ACTION: no WEB code change; operator automation may safely invoke all indexed CLI commands through canonical or aliased workspace paths.

### 30-finding and implementation ledger

| ID | Evidence-backed material outcome |
|---|---|
| `UPSTREAM-CLI-ENTRYPOINT-007-01` | Account snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-02` | Raydium AMM v4 pool snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-03` | API audit retention now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-04` | Archive receipt completion now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-05` | Backfill qualification now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-06` | Backup preflight now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-07` | Backup status assessment now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-08` | Raydium CLMM snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-09` | Raydium CPMM snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-10` | Dead-letter reconciliation now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-11` | Exporter health diagnostics now execute through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-12` | External RPC exporter/health commands now execute through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-13` | Geyser ABI preflight now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-14` | Inbox archive now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-15` | Inbox retention now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-16` | Local validator exporter now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-17` | Local validator stream now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-18` | Meteora DLMM snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-19` | Off-chain metadata snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-20` | OpenBook market snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-21` | Operational job worker now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-22` | Orca pool snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-23` | Phoenix market snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-24` | Commercial Postgres synchronization now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-25` | Pump bonding-curve snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-26` | PumpSwap pool snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-27` | Recovery qualification now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-28` | Reduced operational preflight now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-29` | USDC oracle snapshot acquisition now executes through aliases. |
| `UPSTREAM-CLI-ENTRYPOINT-007-30` | Warehouse synchronization now executes through aliases. |

## UPSTREAM-CLI-ENTRYPOINT-006

- BA/PO decision: fresh source inspection found replay/load retained the alias-sensitive lexical entrypoint check, allowing a required performance validation to silently no-op under sandbox aliases.
- Implemented contract: one shared canonical real-path helper now gates readiness and replay/load CLIs; imported modules remain side-effect free and resolution failure retains deterministic lexical comparison.
- Compatibility/migration: no command arguments, output schemas, or consumer contracts changed.
- Validation: injected alias/direct/import identity regression, focused readiness, full suite, alias-safe replay/load, and health smoke.
- Blockers/owners: live qualification evidence—OPERATOR; remaining CLI migrations and protocol fixtures—BA/PO.
- NEXT_WEB_ACTION: no WEB change; replay/load validation now executes through workspace aliases.

## UPSTREAM-CLI-ENTRYPOINT-005

- BA/PO decision: a fresh sandbox-alias run demonstrated that readiness could silently skip its CLI body because entrypoint detection compared lexical paths rather than file identity.
- Implemented contract: operational readiness compares canonical real paths, with a deterministic lexical fallback only when resolution fails; aliased invocation now emits evidence and returns the correct blocked exit code.
- Compatibility/migration: no schema/configuration change. Direct and imported-module behavior remains unchanged.
- Validation: injected alias identity regression, focused readiness tests, full suite, canonical-path health smoke, and replay/load.
- Blockers/owners: live qualification evidence—OPERATOR; additional protocol ABI selection/fixtures—BA/PO.
- NEXT_WEB_ACTION: no WEB change; operator automation may invoke readiness through a workspace alias without a silent success.

## UPSTREAM-PROVIDER-URL-004

- BA/PO decision: across 22 reviewed domains, local endpoint authority hardening ranked highest because validator URLs accepted embedded credentials and ambiguous path/query/fragment variants.
- Implemented contract: RPC and WebSocket validators now require credential-free loopback root URLs with no query or fragment; runtime clients and operational readiness share this boundary.
- Compatibility/migration: remove userinfo, path, query, and fragment components from local validator URLs. No downstream response/event change.
- Validation: focused RPC/WS authority matrix, full regression, replay/load, and fail-closed operational health.
- Blockers/owners: live qualification evidence—OPERATOR; additional protocol ABI selection/fixtures—BA/PO.
- NEXT_WEB_ACTION: no WEB change; local validator configuration must use credential-free root URLs.

## UPSTREAM-PROVIDER-PREFLIGHT-003

- BA/PO decision: among 22 reconciled domains, canonical provider identity ranked highest because raw-string uniqueness allowed equivalent URL spellings to masquerade as failover diversity.
- Implemented contract: validated RPC and WebSocket URLs are canonicalized before duplicate detection; equivalent trailing-slash forms now fail closed.
- Compatibility/migration: additive local configuration validation; use genuinely distinct canonical endpoint URLs. No consumer API/event change.
- Validation: focused canonical duplicate controls, full regression, replay/load, and fail-closed health smoke.
- Blockers/owners: live evidence—OPERATOR; additional protocol selection and authoritative fixtures—BA/PO.
- NEXT_WEB_ACTION: no WEB change; local endpoint lists must contain unique canonical URLs.

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
