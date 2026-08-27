# Terminal DEX upstream handoff

## UPSTREAM-BACKUP-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across backup integrity, recovery, persistence, contract parity, downstream safety, operability, observability, performance, and commercial readiness. `/api/v1/backup` ranked highest because operators could not machine-validate its bounded RPO failure family.
- Selected ID: `UPSTREAM-BACKUP-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: the route's 503 outcome now references closed `backup_unavailable_v1`, requiring availability, `healthy:false`, a bounded reason enum, age, and configured maximum age; only canonical backup identity and completion time may be added for stale or future evidence.
- Acceptance evidence: real missing, invalid, and content-bound stale status documents validate against one required/allowed field contract and retain their distinct failure reasons.
- Compatibility/migration/configuration: additive discovery only; runtime bodies, backup evidence, persistence, status, RPC, WebSocket, and configuration remain unchanged.
- Blockers/owners: live backup and recovery qualification remains blocked by absent fresh evidence—OPERATOR. The implementation shortfall is 19 because one material contract outcome was dependency-ready; splitting reasons or fields would be padding.
- NEXT_WEB_ACTION: generate a validator for `backup_unavailable_v1` and keep recovery promotion disabled for every matching response.

## UPSTREAM-DURABLE-WINDOWS-RENAME-RETRY-001

- BA/PO decision: proportional full validation reproduced Windows `EPERM` twice while atomically replacing an existing durable file under same-process contention. This is a material persistence/recovery risk and was compatible with the active operational-readiness batch.
- Selected ID: `UPSTREAM-DURABLE-WINDOWS-RENAME-RETRY-001`.
- Implemented behavior: Windows atomic replacement now retries only transient `EACCES`, `EBUSY`, and `EPERM` failures with eight bounded exponential-delay attempts. Non-Windows and non-transient failures remain immediate and fail closed; temporary-file cleanup remains in the existing finally path.
- Acceptance evidence: the 32-write concurrent durable replacement stress test must finish with the final submitted value and no temporary-file residue, and the complete suite must pass after the previously repeated failure.
- Compatibility/migration/configuration: no file format, API, persistence layout, or configuration change. Successful writes retain the same flush, close, atomic rename, and parent-directory synchronization sequence.
- Blockers/owners: none for the offline correction. Broader live storage qualification remains OPERATOR-owned.
- Downstream impact: none; this durability correction changes no downstream contract.

## UPSTREAM-WAREHOUSE-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across persistence, exact convergence, recovery, contract parity, downstream intelligence, trading safety, observability, performance, and commercial readiness. `/api/v1/warehouse` ranked highest because bot readiness requires exact warehouse convergence while its retryable 503 body remained untyped.
- Selected ID: `UPSTREAM-WAREHOUSE-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: the 503 outcome now references closed `warehouse_unavailable_v1`, requiring fail-closed availability, health, reason, sequence/lag, age, and configured limits while admitting only bounded network, sink, reconciliation, replay-history, and aggregate failure evidence.
- Acceptance evidence: real absent and malformed checkpoints produce `checkpoint_unavailable` and `checkpoint_invalid`; both contain every required field and no undeclared top-level field.
- Compatibility/migration/configuration: additive discovery only; runtime bodies, checkpoint/status files, persistence, REST status, RPC, WebSocket, and configuration remain unchanged.
- Blockers/owners: live provider and durable operational qualification remains blocked by absent fresh evidence—OPERATOR. The implementation shortfall is 18 because two material outcomes were dependency-ready; splitting failure reasons, retry attempts, or schema fields would be padding.
- NEXT_WEB_ACTION: generate a validator for `warehouse_unavailable_v1` and keep exact-convergence consumers disabled for every matching response.

## UPSTREAM-INGESTION-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across ingestion, finality, recovery, contract parity, data completeness, downstream intelligence, trading safety, observability, performance, and commercial readiness. `/api/v1/ingestion` ranked highest because operators and bot-readiness consumers depend on its bounded redacted exporter evidence, while discovery left the retryable 503 body untyped.
- Selected ID: `UPSTREAM-INGESTION-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: the route's 503 outcome now references closed `ingestion_unavailable_v1`, requiring the fail-closed health/reason/progress limits plus bounded exporter and index projections. Unknown top-level provider diagnostics remain forbidden.
- Acceptance evidence: a real absent status requires `available:false`, `healthy:false`, and `status_unavailable`; malformed provider identity requires `available:true`, `healthy:false`, `automationEligible:false`, and `invalid_source`. Both runtime bodies satisfy the required and allowed key sets.
- Compatibility/migration/configuration: additive discovery only; runtime body, status, exporter files, persistence, RPC, WebSocket, and configuration remain unchanged. Consumers may replace ad hoc 503 parsing with the published schema.
- Blockers/owners: live provider and durable operational qualification remains blocked by absent fresh evidence—OPERATOR. The implementation shortfall is 19 because one material contract outcome was dependency-ready in this coherent batch; field/assertion splitting would be padding.
- NEXT_WEB_ACTION: generate a closed validator for `ingestion_unavailable_v1` and keep exporter-dependent views unavailable until the response is healthy.

## UPSTREAM-BOT-READINESS-DISCRIMINATOR-001

- BA/PO decision: a fresh 20+ opportunity reconciliation retained bot-readiness contract correctness as the highest-value dependency-ready offline-safe item. Independent QC proved the flat schema accepted four impossible version/sentinel combinations, allowing generated safety clients to misclassify an unavailable response.
- Selected ID: `UPSTREAM-BOT-READINESS-DISCRIMINATOR-001`.
- Implemented contract: `bot_readiness_unavailable_v1` is now an exclusive two-branch union. Version 1 requires `available:false` and admits only its exact structural refusal; version 2 requires `ready:false` and admits only bounded readiness/dependency evidence. Cross-version sentinels are forbidden.
- Acceptance evidence: real version-1 structural and version-2 dependency refusals each match exactly one branch; version 1 or 2 without its sentinel and both cross-version sentinel forms are rejected.
- Compatibility/migration/configuration: discovery is corrected without changing runtime bodies, route status, persistence, RPC, WebSocket, or configuration. Schema consumers must support `oneOf` and select the branch by `schemaVersion`.
- Blockers/owners: live provider and durable operational qualification remains blocked by absent fresh evidence—OPERATOR. The implementation shortfall is 19 because this coherent corrective batch contains one material behavior change; splitting four negative assertions or schema members would be padding.
- NEXT_WEB_ACTION: regenerate the bot-readiness validator with exclusive union support and deny automation unless exactly one version branch validates.

## UPSTREAM-INDEX-HEALTH-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across authoritative data, finality, recovery, replay, provider resilience, downstream discovery and intelligence, trading safety, observability, performance, contract parity, and protocol coverage. Public index-health failure discovery ranked highest because operators and commercial clients could not validate its stable redacted 503 projection.
- Selected ID: `UPSTREAM-INDEX-HEALTH-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: `/api/health` now references closed `index_health_unavailable_v1`, requiring non-empty status/reason plus `healthy:false`, and permitting only the stable network, aggregate, ingestion, structure, chain, and quality sections projected by the public handler.
- Acceptance evidence: discovery references the schema; a real empty-index response validates the base failure; a malformed persisted collection validates the structural-evidence form and remains confined to declared fields.
- Compatibility/migration/configuration: additive discovery only; runtime payloads, endpoint, status, persistence, RPC, WebSocket, and configuration remain unchanged. The internal feed health route remains separately untyped because it adds exporter evidence.
- Blockers/owners: live provider and durable operational qualification remains blocked by absent fresh evidence—OPERATOR. Internal feed health, stats, ingestion, warehouse, backup, and recovery schemas remain BA/PO candidates.
- NEXT_WEB_ACTION: generate a closed validator for `index_health_unavailable_v1` and reject undeclared diagnostic fields before surfacing health state.

## UPSTREAM-GAP-FEED-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across indexing correctness, recovery, replay, provider resilience, downstream discovery, price/volume, holder and wallet intelligence, trading safety, observability, performance, contract parity, and protocol coverage. Gap-feed failure discovery was the highest-value dependency-ready offline-safe diagnostic gap because recovery clients could not validate its bounded 503 family.
- Selected ID: `UPSTREAM-GAP-FEED-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: `/internal/feed/gaps` now references closed `gap_feed_unavailable_v1`, requiring the version-1 unavailable envelope and permitting only bounded structural fields or exporter/reorg/checkpoint evidence.
- Acceptance evidence: discovery references the schema; a real unavailable feed validates the admitted top-level fields; an injected recovery refusal validates the minimal exact envelope.
- Compatibility/migration/configuration: additive discovery only; runtime payloads, status, ingestion, persistence, RPC, WebSocket, and configuration remain unchanged. Consumers must not infer gap completeness from absent optional diagnostic evidence.
- Blockers/owners: live provider and durable operational qualification remains blocked by absent fresh evidence—OPERATOR. Health, stats, ingestion, warehouse, backup, and recovery response schemas remain BA/PO candidates.
- NEXT_WEB_ACTION: generate a closed validator for `gap_feed_unavailable_v1` and require a successful feed before advancing recovery cursors.

## UPSTREAM-BOT-READINESS-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across discovery, price/volume, holder and wallet intelligence, trading safety, contract parity, recovery, replay, provider resilience, observability, performance, and protocol coverage. Bot-readiness was the highest-value dependency-ready offline-safe gap because automated consumers could identify 503 but not validate its fail-closed evidence union.
- Selected ID: `UPSTREAM-BOT-READINESS-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: `/api/v1/bot/readiness` now references closed `bot_readiness_unavailable_v1`. It explicitly permits version-1 quality refusals with `available:false` and version-2 readiness refusals with `ready:false`, bounded market evidence, and ingestion/warehouse dependencies; a non-empty reason is always required.
- Acceptance evidence: discovery references the schema; a real dependency-blocked response validates version 2 and its target/ingestion/warehouse missing gates; an injected structural failure validates the minimal version-1 form without leaking internal field names.
- Compatibility/migration/configuration: additive discovery only; runtime payloads, statuses, persistence, RPC, WebSocket, and configuration remain unchanged. Consumers must branch on schema version and must never infer readiness from omitted optional evidence.
- Blockers/owners: live provider and durable operational qualification remains blocked by absent fresh evidence—OPERATOR. Health and diagnostic unavailable schemas remain BA/PO candidates.
- NEXT_WEB_ACTION: generate a version-aware closed validator for `bot_readiness_unavailable_v1` and deny automation for every matching response.

## UPSTREAM-VOLUME-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across trending, token/pool detail, holder and wallet intelligence, pricing, volume, trading safety, contract parity, recovery, replay, provider resilience, observability, performance, and protocol coverage. Volume failure discovery was the highest-value dependency-ready offline-safe gap because its bounded 503 union remained untyped for downstream analytics clients.
- Selected ID: `UPSTREAM-VOLUME-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: `/api/v1/volume/{mint}` now references closed `volume_unavailable_v1`, requiring the minimal fail-closed availability envelope and permitting only its bounded window, count, completeness, reference, and missing-evidence fields.
- Acceptance evidence: discovery references the schema; a real five-minute missing-reference response validates the detailed form and exact zero-valued count; an injected structural failure validates the minimal form while excluding internal field names.
- Compatibility/migration/configuration: additive discovery only; runtime payloads, endpoint, status, persistence, RPC, WebSocket, and configuration remain unchanged. Consumers must treat incomplete or unvalued windows as unavailable.
- Blockers/owners: live provider and durable operational qualification remains blocked by absent fresh evidence—OPERATOR. Bot-readiness and diagnostic unavailable schemas remain BA/PO candidates.
- NEXT_WEB_ACTION: generate a closed validator for `volume_unavailable_v1` and keep unavailable windows out of volume, trending, and automation decisions.

## UPSTREAM-PRICE-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across downstream discovery, pricing, volume, trading safety, contract parity, provider resilience, recovery, replay, observability, performance, and protocol coverage. Price failure discovery was the highest-value dependency-ready offline-safe gap because consumers could not validate the route's fail-closed 503 family despite its bounded runtime union.
- Selected ID: `UPSTREAM-PRICE-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: `/api/v1/price/{mint}` now references closed `price_unavailable_v1`, requiring `schemaVersion:1`, `available:false`, and non-empty `reason`, with bounded optional mint, constant unsafe flag, nominal-USDC reference identity, and missing-evidence list.
- Acceptance evidence: discovery references the schema; a real missing-path response validates its detailed form; an injected structural failure validates the minimal form and excludes internal field names.
- Compatibility/migration/configuration: additive discovery only; runtime payloads, endpoint, status, storage, RPC, WebSocket, and configuration remain unchanged. Consumers must not infer price availability from any optional field.
- Blockers/owners: live provider and durable operational qualification remains blocked by absent fresh evidence—OPERATOR. Volume and bot-readiness unavailable schemas remain BA/PO candidates.
- NEXT_WEB_ACTION: generate a closed validator for `price_unavailable_v1` and keep every matching response unavailable for pricing and automation.

## UPSTREAM-EXECUTABLE-DEPTH-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current product areas across contract parity, index integrity, recovery, provider resilience, replay, observability, performance, protocol coverage, and downstream journeys. Executable-depth was the highest-value dependency-ready offline-safe gap: its 503 discovery outcome remained untyped even though structural, decision-quality, buy, and sell failures form one bounded closed union.
- Selected ID: `UPSTREAM-EXECUTABLE-DEPTH-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: `/internal/tokens/{mint}/executable-depth` now references `executable_depth_unavailable_v1`. The schema requires `schemaVersion:1`, `available:false`, and a non-empty `reason`; it closes the union over fail-closed route fields including constant execution/safety flags, side-specific exact raw amount, mint, missing evidence names, and nullable evidence details.
- Acceptance evidence: discovery references the schema; a real unsupported/unobserved sell route validates the detailed form; an injected structural failure validates the minimal form and excludes internal field names.
- Compatibility/migration/configuration: additive discovery only; no runtime body, endpoint, status, storage, RPC, WebSocket, or configuration change. Consumers may validate both buy and sell failures without treating omitted side-specific fields as positive evidence.
- Blockers/owners: fresh live provider, exporter, warehouse, backup, and recovery qualification remains blocked by absent operator evidence—OPERATOR. Price, volume, and bot-readiness unavailable schemas remain BA/PO candidates.
- NEXT_WEB_ACTION: generate a closed validator for `executable_depth_unavailable_v1` and continue treating every matching response as non-executable.

## UPSTREAM-QUOTE-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh reconciliation of 24+ product areas and all pool-quote 503 branches found one exact closed union: quality failures require the three-field availability envelope, while unsupported protocols and quote-engine failures add only `automationSafe:false`.
- Selected ID: `UPSTREAM-QUOTE-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: `/internal/pools/{pool}/quote` now references `quote_unavailable_v1`, requiring `schemaVersion:1`, `available:false`, and non-empty `reason`, with only optional constant `automationSafe:false`. This covers structural, decision-quality, unsupported-protocol, and quote-engine refusal without weakening execution safety.
- Acceptance evidence: discovery references the schema; real injected decision failure satisfies its required and allowed fields; existing analysis-only engine-failure regression proves the optional automation-safety form remains fail closed.
- Compatibility/migration/configuration: additive discovery only; no runtime payload, endpoint, status, configuration, storage, RPC, or WebSocket change.
- Blockers/owners: live qualification remains blocked by absent fresh operational/provider evidence—OPERATOR. Executable-depth, price, volume, and bot-readiness unavailable schemas—BA/PO.
- NEXT_WEB_ACTION: validate pool-quote 503 bodies through `quote_unavailable_v1` and keep `automationSafe` defaulted to false when omitted.

## UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh review of the 24 newly advertised decision-quality outcomes proved each route has exactly one runtime 503 family after excluding five heterogeneous quote/pricing/readiness routes. Their earlier structural-quality refusal was the only shape mismatch and unnecessarily exposed internal invalid-field names.
- Selected compatible batch: `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-01` through `-24`, matching the 24 discovery, catalog, evidence, token, wallet, account, mint, risk, pool, and candle routes delivered in the preceding discovery batch.
- Implemented contract: all 24 outcomes now reference closed `basic_unavailable_v1`. Structural and decision-quality gates both emit exactly `{schemaVersion:1, available:false, reason:string}` for these consumers. A shared path classifier prevents discovery/runtime drift, and internal structural field names are no longer returned on these routes. Pool quote, executable depth, price, volume, and bot readiness remain explicitly untyped because their later 503 payloads are heterogeneous.
- Acceptance evidence: discovery verifies 24 schema references and five deliberate null controls; real structurally invalid requests across discovery, token security, wallet funding, and pool detail return the exact three-field envelope without injected internal evidence.
- Compatibility/migration/configuration: additive schema discovery plus removal of the undocumented `fields` property from structural 503 bodies on these 24 routes. Consumers can replace ad hoc validation with `basic_unavailable_v1`; no endpoint, status, success body, persistence, RPC, WebSocket, or configuration migration is required.
- Blockers/owners: live canonical-mainnet qualification remains blocked by absent fresh provider and durable operational evidence—OPERATOR. Heterogeneous quote, price, volume, readiness, health, and diagnostic schemas—BA/PO.
- NEXT_WEB_ACTION: validate the 24 decision-quality unavailable outcomes through `basic_unavailable_v1` and stop reading the removed undocumented `fields` member.

## UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001

- BA/PO decision: a fresh 24-outcome route audit found that the shared decision-quality gate can return fail-closed 503 responses before 24 consumer handlers, yet discovery advertised success only. This was the highest-value dependency-ready gap because generated clients could incorrectly treat data-quality refusal as an undocumented transport failure across discovery, intelligence, and catalog journeys.
- Selected compatible batch: `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-01` through `-24`, covering internal trending, new pairs, candidates, public trending, token/pool catalogs, evidence, seven token views, five wallet views, account detail, mint detail, risk, pool detail, and candles. Five already-correct decision consumers—pool quote, executable depth, price, volume, and bot readiness—remain in the same invariant set and were regression-checked but not counted as new outcomes.
- Implemented contract: all 29 decision-quality consumers now advertise a retryable 503 `unavailable` outcome. The 24 newly corrected outcomes retain `bodySchema:null` because later route-specific bodies are not yet proven structurally identical; no schema is fabricated.
- Acceptance evidence: discovery proves all 29 routes carry exactly one retryable unavailable outcome, while real injected decision-evidence failure requests verify representative discovery, evidence, wallet, catalog, and risk routes return the documented 503 envelope.
- Compatibility/migration/configuration: additive discovery only; runtime status, payload, endpoint, RPC, WebSocket, persistence, and configuration behavior is unchanged. Consumers should handle the newly advertised 503 outcomes with bounded retry and fail closed until the route returns fresh canonical evidence.
- Blockers/owners: live canonical-mainnet qualification remains blocked by absent fresh provider and durable operational evidence—OPERATOR. Structural schemas for heterogeneous success and diagnostic responses—BA/PO.
- NEXT_WEB_ACTION: regenerate HTTP clients so every newly advertised decision-quality 503 is handled as retryable unavailable rather than an unknown response.

## UPSTREAM-PREPARATION-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh reconciliation across 24 product and operational areas retained preparation failure discovery as the highest-value offline-safe contract gap. Inspection found its two routes advertised one 503 outcome while structural admission emitted an incompatible generic availability envelope, preventing any honest closed schema.
- Selected ID: `UPSTREAM-PREPARATION-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: both pool and bonding-curve `POST .../prepare-swap` unavailable outcomes now reference closed `preparation_unavailable_v1`. It requires `schemaVersion:1`, `prepared:false`, `automationSafe:false`, and a non-empty `reason`; `missing` is the only optional field and is a string array. Structural admission now preserves this preparation-specific fail-closed envelope and does not expose internal structure field names.
- Acceptance evidence: discovery assigns the schema only to both preparation routes; a real structurally unhealthy pool-preparation request returns the exact four-field body, excludes injected internal field evidence, and satisfies all required/allowed-key constraints.
- Compatibility/migration/configuration: additive discovery plus normalization of preparation-route structural 503 bodies from generic `available:false` to `prepared:false, automationSafe:false`. Successful, 400, and 404 responses are unchanged. Consumers should branch on `prepared`, not `available`, for every preparation 503. No configuration or storage migration is required.
- Blockers/owners: live canonical-mainnet qualification remains blocked by absent fresh provider, exporter, warehouse, backup, and recovery evidence—OPERATOR. Remaining heterogeneous HTTP success/unavailable schemas—BA/PO.
- NEXT_WEB_ACTION: validate preparation 503 bodies through `preparation_unavailable_v1` and treat every `prepared:false` response as non-signable and non-submittable.

## UPSTREAM-CONTRACT-SNAPSHOT-ISOLATION-001

- BA/PO decision: a fresh 24-area review of discovery/trending, token and pool detail, holder/whale and wallet intelligence, replay/reorg, API/RPC/WebSocket parity, provenance/freshness, recovery, provider resilience, performance, operability, security, and commercial-readiness evidence ranked the new QC mutation proof above the retained preparation-envelope enhancement. A caller could mutate either published response schema and thereby alter later snapshots, hashes, ETags, and HTTP discovery without a source revision.
- Selected ID: `UPSTREAM-CONTRACT-SNAPSHOT-ISOLATION-001`; this resolves both QC failures against `route_client_error_v1` and `basic_unavailable_v1` as one shared-root-cause increment.
- Implemented contract: `queryContractSnapshot()` now returns and hashes a detached structured clone of the complete contract. Mutating a returned response schema, value constraint, route outcome, or nested representation cannot poison module registries or later snapshots.
- Acceptance evidence: a regression mutates four independently nested surfaces in one returned snapshot, then proves a fresh snapshot is byte-structurally equal to the baseline with the canonical digest and original constraints intact.
- Compatibility/migration/configuration: no endpoint, field, status, schema ID, runtime payload, configuration, RPC, or WebSocket change; deterministic discovery is restored without consumer migration.
- Blockers/owners: live canonical-mainnet qualification remains blocked by absent operator-provided fresh provider and durable-state evidence—OPERATOR. Preparation unavailable-body schema remains the next offline-safe contract gap—BA/PO.
- NEXT_WEB_ACTION: remove any defensive deep clone around query-contract discovery after consuming a revision containing `UPSTREAM-CONTRACT-SNAPSHOT-ISOLATION-001`.

## UPSTREAM-HTTP-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh review found unavailable bodies span several incompatible shapes, so a universal schema would be unsafe. Eight retained-data routes share one exact fail-closed envelope and form the highest-value dependency-ready structural batch.
- Selected ID: `UPSTREAM-HTTP-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: discovery now publishes closed `basic_unavailable_v1` for the exact `{schemaVersion:1, available:false, reason:string}` envelope used by v1 blocks/transactions/swaps, legacy blocks/transactions, transaction detail, holders, and token-account detail. Only those eight outcomes reference it; heterogeneous health, stats, quote, preparation, pricing, operational, and static failures remain explicitly `bodySchema:null`.
- Compatibility/migration: additive discovery only; runtime responses, statuses, headers, endpoints, RPC, and WebSocket behavior are unchanged. Consumers may validate the eight referenced failures and must not assume the schema applies to untyped unavailable outcomes.
- Validation: all eight exact-envelope routes reference the schema, four heterogeneous controls do not, and a real HTTP blocks response with an injected unavailable canonical view contains exactly the three required fields with canonical constant values.
- Blockers/owners: live canonical-mainnet qualification evidence—OPERATOR; remaining heterogeneous success/unavailable schemas and additional-protocol fixtures—BA/PO.
- NEXT_WEB_ACTION: generate `basic_unavailable_v1` validation only for outcomes that reference it, preserving route-specific handling for every `bodySchema:null` unavailable response.

## UPSTREAM-HTTP-ERROR-SCHEMA-DISCOVERY-001

- BA/PO decision: fresh QC passed cursor and body-identity discovery, leaving structural validation as the highest-value offline-safe response-contract gap. Generated clients could identify error payload families but still had to hard-code their required fields and bounded error vocabulary.
- Selected ID: `UPSTREAM-HTTP-ERROR-SCHEMA-DISCOVERY-001`.
- Implemented contract: query discovery now publishes closed `route_client_error_v1` and `not_found_v1` object schemas with required/optional fields, string constraints, and bounded error values. Applicable outcomes reference them through `representation.bodySchema`; success, unavailable, non-JSON, and bodyless outcomes explicitly publish `null` until independently defined.
- Compatibility/migration: additive discovery only; runtime payloads, statuses, headers, endpoints, RPC, and WebSocket behavior are unchanged. Consumers may validate referenced schemas and must fail closed on an unknown schema ID or an undeclared field/value.
- Validation: malformed cursor, missing transaction, and missing quote-pool responses satisfy the published closed schemas; route references cover cursor and quote client errors plus transaction and pool not-found outcomes.
- Blockers/owners: live canonical-mainnet qualification evidence—OPERATOR; success/unavailable structural schemas and authoritative additional-protocol fixtures—BA/PO.
- NEXT_WEB_ACTION: generate closed validators for `route_client_error_v1` and `not_found_v1`, rejecting undeclared fields and error values before application handling.

## UPSTREAM-HTTP-BODY-CONTRACT-IDENTITY-001

- BA/PO decision: a fresh 24-area review confirmed the cursor discovery defect is corrected at HEAD and ranked versioned response-body identity as the next offline-safe commercial contract gap. Status and representation discovery selected transport handling but could not bind generated validators or compatibility caches to a particular route/outcome payload family.
- Selected ID: `UPSTREAM-HTTP-BODY-CONTRACT-IDENTITY-001`.
- Implemented contract: every body-bearing response outcome now publishes a unique stable `representation.bodyContract` identity derived from its route template, outcome family, and version. Bodyless 304 explicitly publishes `null`, preventing consumers from expecting a schema where no payload exists. The query-contract digest and ETag bind all identities.
- Compatibility/migration: additive discovery only; response bytes, headers, status codes, endpoints, RPC, and WebSocket contracts remain unchanged. Consumers may key generated validators and compatibility caches by `bodyContract`; an unknown identity must fail closed rather than being treated as a known payload.
- Validation: every body-bearing outcome across all 54 routes has a unique bounded version-1 identity matching its route and outcome; the sole bodyless 304 has no identity. Existing JSON, Prometheus, HTML, cursor, caching, and status parity checks remain mandatory.
- Blockers/owners: live canonical-mainnet qualification evidence—OPERATOR; structural JSON Schema publication and authoritative additional-protocol fixtures—BA/PO.
- NEXT_WEB_ACTION: bind each generated response validator and cache entry to `representation.bodyContract`, rejecting unknown or changed identities until the client contract is regenerated.

## UPSTREAM-HTTP-CURSOR-OUTCOME-001

- BA/PO decision: fresh QC independently reproduced a response-discovery completeness defect on every cursor-paginated collection. This concrete generated-client retry/classification mismatch outranked schema-identity enhancement and externally blocked live qualification.
- Selected ID: `UPSTREAM-HTTP-CURSOR-OUTCOME-001`.
- Implemented contract: `/api/v1/blocks`, `/api/v1/transactions`, `/api/v1/swaps`, `/api/v1/tokens`, and `/api/v1/pools` now advertise their post-admission non-retryable JSON 400 outcome for malformed, stale, crossed-scope, or otherwise invalid cursors.
- Compatibility/migration: discovery-only correction; runtime cursor validation, status codes, bodies, pagination, RPC, and WebSocket behavior are unchanged. Consumers should classify advertised cursor 400 responses as terminal request failures and obtain a fresh collection cursor.
- Validation: all five routes advertise the same bounded client-error representation and independently return HTTP 400 `invalid_cursor` for a malformed cursor against a canonical in-memory index.
- Blockers/owners: live canonical-mainnet qualification evidence—OPERATOR; authoritative fixtures for additional protocol coverage—BA/PO.
- NEXT_WEB_ACTION: regenerate the five paginated route classifiers and replace invalid cursors with a fresh first-page request rather than retrying the rejected cursor.

## UPSTREAM-HTTP-REPRESENTATION-DISCOVERY-001

- BA/PO decision: a fresh 24-area review ranked response representation discovery above credential-blocked live qualification and fixture-blocked protocol expansion. Route status/retry metadata was available, but generated clients still had to guess whether successful or cached outcomes contained JSON, Prometheus text, HTML, or no body.
- Selected ID: `UPSTREAM-HTTP-REPRESENTATION-DISCOVERY-001`.
- Implemented contract: every published `responseOutcomes` entry now includes `representation.bodyKind`, exact `contentType`, and `bodyRequired`. JSON is explicit across API outcomes, metrics advertises Prometheus text, static index routes advertise HTML, and query-contract 304 advertises an empty body with no content type. The discovery digest and ETag bind the new metadata.
- Compatibility/migration: additive discovery only; runtime status codes, response bytes, content types, endpoints, RPC, and WebSocket contracts are unchanged. Consumers can select parsers before reading a response and must not attempt JSON parsing for metrics, HTML, or 304.
- Validation: all 54 routes retain unique ordered statuses; contract profiles match real JSON health, Prometheus metrics, HTML root, and bodyless 304 responses.
- Blockers/owners: live canonical-mainnet qualification evidence—OPERATOR; authoritative fixtures for additional protocol coverage—BA/PO.
- NEXT_WEB_ACTION: select response parsers from `responseOutcomes[].representation` and treat `bodyRequired: false` as a valid bodyless completion rather than a transport failure.

## UPSTREAM-HTTP-RESPONSE-DISCOVERY-001

- BA/PO decision: a fresh 24-area review retained more than 20 concrete opportunities and ranked generated-client response classification highest among dependency-ready offline-safe work. Admission failures were discoverable, but route success, cache, client-error, absence, and availability outcomes still required hard-coded consumer knowledge.
- Selected ID: `UPSTREAM-HTTP-RESPONSE-DISCOVERY-001`.
- Implemented contract: every one of the 54 entries from `GET /api/v1/query-contracts` now publishes ordered `responseOutcomes`. Each outcome includes its stable name, HTTP status, and retryability; route-specific 304, 400, 404, and 503 families are included only where the handler can emit them after admission. The contract digest and ETag cover this metadata.
- Compatibility/migration: additive discovery only; runtime status codes, bodies, endpoints, RPC, and WebSocket schemas are unchanged. Generated consumers may replace endpoint-specific status tables with this contract while continuing to apply the earlier `httpAdmission` outcomes first.
- Validation: all 54 routes publish one unique-status ordered outcome list beginning with non-retryable 200. Discovery caching publishes 304; quote publishes 400/404/503; transaction detail publishes 404/503; health publishes 503; a deterministic trending route publishes only 200.
- Blockers/owners: live canonical-mainnet qualification evidence—OPERATOR; authoritative fixtures for additional protocol coverage—BA/PO.
- NEXT_WEB_ACTION: generate post-admission response classifiers from each route's `responseOutcomes`, treating only advertised `retryable: true` outcomes as candidates for retry.

## UPSTREAM-HTTP-ADMISSION-DISCOVERY-001

- BA/PO decision: fresh review found authentication, quota, canonicalization, path, query, method, body, state, and route gates were individually tested but their precedence and retry semantics were not machine-readable. Generated clients could therefore misclassify deterministic 4xx errors or retry the wrong boundary.
- Selected ID: `UPSTREAM-HTTP-ADMISSION-DISCOVERY-001`.
- Implemented contract: `GET /api/v1/query-contracts` now publishes the ordered HTTP admission stages and stable status/retry/header semantics for every pre-route gate. The artifact digest and ETag cover this metadata.
- Compatibility/migration: additive discovery only; runtime request ordering and all response, RPC, and WebSocket schemas are unchanged. Consumers should retry only advertised retryable quota/state failures and honor `Retry-After` where declared.
- Validation: unauthenticated malformed paths resolve to 401; authenticated malformed paths beat simultaneous wrong-method/unsupported-query inputs with 400; canonical wrong methods return 405 plus `Allow`; exhausted quota returns 429 plus `Retry-After` before malformed-path processing.
- Blockers/owners: live canonical-mainnet qualification evidence—OPERATOR; additional protocol ABI fixtures—BA/PO.
- NEXT_WEB_ACTION: generate retry classification from `httpAdmission.outcomes` and stop retrying deterministic authentication, canonicalization, path, query, method, required-input, and body failures.

## UPSTREAM-HTTP-PATH-IDENTITY-001

- BA/PO decision: fresh QC and source evidence found malformed template identities were decoded after query admission, so an invalid amount or unsupported key could mask the canonical path error. Path constraints were also absent from discovery despite 27 resource templates.
- Selected ID: `UPSTREAM-HTTP-PATH-IDENTITY-001`.
- Implemented contract: every route now publishes `pathParameters` plus a shared canonical percent-encoded segment profile: decoded length 1..256, no slash/control characters, and exactly one canonical wire spelling. Recognized template paths are decoded after authentication/quota and unique-query admission but before query allowlist/value checks, methods, or decision state.
- Compatibility/migration: noncanonical escapes such as an encoded unreserved character are newly rejected; ordinary canonical resource paths and all response/RPC/WebSocket schemas remain unchanged. Generated clients should encode each path segment exactly once.
- Validation: all declared path maps match template placeholders; every template route rejects encoded slash and noncanonical unreserved escapes before a simultaneous unsupported query key; existing malformed-path controls remain green.
- Blockers/owners: live canonical-mainnet qualification evidence—OPERATOR; additional protocol ABI fixtures—BA/PO.
- NEXT_WEB_ACTION: generate path-segment encoders from `pathParameters` and `pathValueConstraints`, rejecting double encoding and encoded unreserved aliases locally.

## UPSTREAM-HTTP-ROUTE-PARITY-001

- BA/PO decision: a fresh 24-area review found runtime query admission duplicated the 54-route discovery catalog across eleven hand-maintained path branches. That architectural drift already produced prior token-subview and required-parameter defects, making consolidation the highest-value offline-safe increment.
- Selected ID: `UPSTREAM-HTTP-ROUTE-PARITY-001`.
- Implemented contract: exact and template HTTP routes now resolve through the same catalog used by `GET /api/v1/query-contracts`. Allowed values and required-parameter lookup consume that resolved contract, eliminating the duplicate route allowlist implementation while retaining existing authentication, quota, method, canonical-path, and decision-state ordering.
- Compatibility/migration: no endpoint, parameter, response, RPC, or WebSocket behavior changes are intended; no configuration or data migration is required.
- Validation: every published route is materialized with all documented parameters and must pass shared admission, then independently reject an added unsupported key. Existing route-specific, malformed-path, required-input, and value-boundary regressions remain mandatory.
- Blockers/owners: live canonical-mainnet qualification evidence—OPERATOR; additional protocol selection and authoritative ABI fixtures—BA/PO.
- NEXT_WEB_ACTION: no WEB behavior change; continue generating request builders from the discovery artifact, which now shares its route source with runtime admission.

## UPSTREAM-HTTP-ADMISSION-PARITY-001

- BA/PO decision: fresh source and QC evidence ranked malformed trading-input classification above credential-blocked live qualification. Published `amountRaw` accepted zero and overflow values, while missing required quote/depth inputs could be masked by unhealthy decision state.
- Selected IDs: `UPSTREAM-HTTP-ADMISSION-PARITY-001-A` and `UPSTREAM-HTTP-ADMISSION-PARITY-001-B`.
- Implemented contract: `amountRaw` is now an exact positive-u64 decimal-string profile (`1..18446744073709551615`, maximum 20 characters). Shared query admission enforces the profile, and route-specific required parameters are checked after authentication/quota/method admission but before decision-state access. Canonical path errors retain precedence.
- Compatibility/migration: zero, overflow, and missing mandatory trading inputs now return stable HTTP 400 even when index decision evidence is unhealthy. Valid positive-u64 requests, authentication, quotas, methods, successful responses, RPC, and WebSocket contracts are unchanged.
- Validation: generated-profile boundaries cover zero, one, u64 maximum, maximum plus one, and overlength input; real unhealthy-state probes cover missing quote amount/mint, missing depth amount, zero/overflow rejection, and valid-maximum progression to the expected fail-closed 503 state gate.
- Blockers/owners: live canonical-mainnet provider/exporter/warehouse/backup/recovery evidence—OPERATOR; additional protocol ABI fixtures—BA/PO.
- NEXT_WEB_ACTION: enforce the published positive-u64 amount profile locally and classify missing, zero, and overflow trading inputs as non-retryable client errors.

## UPSTREAM-HTTP-REQUIREMENT-DISCOVERY-001

- BA/PO decision: a fresh 24-area review selected query requirement discovery over credential-blocked live qualification and ABI-blocked protocol expansion. The existing artifact exposed names and value profiles but could not distinguish mandatory quote/depth inputs, defaulted options, or the protocol-dependent CLMM/Whirlpool tick boundary.
- Selected ID: `UPSTREAM-HTTP-REQUIREMENT-DISCOVERY-001`, covering the route partition invariant, quote/depth required inputs, limit/window/interval/side defaults, conditional tick semantics, deterministic digest coverage, and pre-state rejection evidence.
- Implemented contract: every HTTP route now publishes deterministic `requiredParameters`, `optionalParameters`, `parameterDefaults`, and `conditionalRequirements`. Pool quotes require `amountRaw` and `inputMint`; executable depth requires `amountRaw`; `limitTick` is declared conditional for Raydium CLMM and Orca Whirlpool programs. Existing route handlers reject missing mandatory inputs before index state evaluation.
- Compatibility/migration: response and event schemas are unchanged. Generated clients should consume the additive fields; requests already valid at runtime remain valid. Missing mandatory inputs retain their existing HTTP 400 behavior.
- Validation: all declared routes must partition names exactly once; defaults must belong only to optional inputs; quote, depth, and trending profiles have exact assertions; real missing-input HTTP probes run before state access.
- Blockers/owners: current mainnet operational evidence—OPERATOR; additional protocol selection plus authoritative ABI fixtures—BA/PO.
- NEXT_WEB_ACTION: generate required and optional HTTP builder arguments from the new route metadata and conditionally require `limitTick` for Raydium CLMM and Orca Whirlpool quotes.

## UPSTREAM-HTTP-VALUE-PARITY-001

- BA/PO decision: a fresh 24-domain review and independent QC found two discovery/runtime mismatches: candle intervals accepted numeric-coercion aliases omitted by the enum, and bot-readiness pool filters bypassed advertised bounds.
- Selected IDs: `UPSTREAM-HTTP-VALUE-PARITY-001-01` through `-20`, covering valid/invalid interval, pool, limit, window, and depth-side boundaries plus pre-state HTTP rejection.
- Implemented contract: the shared allowlist boundary now enforces published value profiles before route state evaluation. Candle intervals require exact advertised strings; bot readiness uses the bounded collection-filter path. Invalid values return redacted HTTP 400 before unavailable index evidence can mask client errors.
- Compatibility/migration: `interval=60.0`, `interval=6e1`, leading-zero interval aliases, and invalid bot pool filters are newly rejected; documented values and response/event schemas are unchanged.
- Validation: twenty direct profile cases, five real pre-state HTTP regressions, exact discovery metadata/digest coverage, focused/full tests, replay/load, fail-closed readiness, syntax, and diff review.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: remove numeric coercion from candle builders and apply the published collection-filter validator to bot-readiness pool inputs.

## UPSTREAM-HTTP-VALUE-DISCOVERY-001

- BA/PO decision: a fresh 25-domain review found HTTP discovery exposed parameter names but not accepted value domains. Generated builders could still send invalid limits, windows, intervals, cursors, quote inputs, sides, statuses, or collection filters.
- Selected IDs: `UPSTREAM-HTTP-VALUE-DISCOVERY-001-01` through `-20`, mapping five versioned collections, four discovery/analytics routes, candles, quotes, depth, token views, wallet funding, volume, holders, bot readiness, discovery, and RPC to reusable value profiles.
- Implemented contract: `GET /api/v1/query-contracts` now publishes deterministic `valueConstraints` and per-route `parameterConstraints`. Profiles describe exact numeric/string patterns, bounds, defaults, enums, cursor encoding/scope binding, filter length/control rules, and quote/depth inputs; the artifact digest and ETag cover the additions.
- Compatibility/migration: additive schema-version-1 metadata only. Existing requests are unchanged; clients can resolve each parameter name through its route profile before serialization.
- Validation: twenty route/profile mappings, exact limit/window/interval/side/status definitions, digest/ETag coverage, focused/full tests, replay/load, fail-closed readiness, syntax, and diff review.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: generate HTTP parameter validators from each route's `parameterConstraints` and fail startup on unknown profiles.

## UPSTREAM-WS-FILTER-CONSTRAINTS-001

- BA/PO decision: a fresh 21-domain review and independent QC reproduction found WebSocket discovery exposed only a maximum filter length. Generated builders could still emit empty or control-bearing canonical filters rejected by runtime.
- Selected IDs: `UPSTREAM-WS-FILTER-CONSTRAINTS-001-01` through `-20`: minimum-valid, maximum-valid, empty, control-bearing, and oversized cases for eventType, mint, pool, and protocol.
- Implemented contract: `GET /api/v1/query-contracts` replaces the ambiguous maximum-only field with `filterConstraints`, declaring the four filter names, optionality, 1..64 UTF-16-code-unit length, and forbidden control characters. Runtime behavior and WebSocket event shapes are unchanged.
- Compatibility/migration: additive/detail-refining schema-version-1 metadata. Consumers using the removed `maximumFilterLength` convenience field must read `filterConstraints.maximumLength`; no valid subscription changes.
- Validation: twenty generated-builder/runtime parity cases, exact discovery artifact equality and digest coverage, focused/full tests, replay/load, fail-closed readiness, syntax, and diff review.
- Blockers/owners: fresh live qualification evidence—OPERATOR; authoritative fixtures for additional protocols—BA/PO.
- NEXT_WEB_ACTION: validate all generated WebSocket filter values against `filterConstraints` before connection.

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
