# Terminal DEX upstream handoff

# UPSTREAM-PREPARATION-HANDOFF-BINDING-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected the protocol-invariant portion of the HIGH preparation nesting defect because handoff authority and content-addressed identity can be closed safely across every supported venue before protocol-specific quote/preparation unions are modeled.
- Selected ID: `UPSTREAM-PREPARATION-HANDOFF-BINDING-SCHEMA-001` (dependency increment for `UPSTREAM-QA-PREPARATION-SUCCESS-NESTED-BOUNDARY-001`).
- Implemented contract: successful preparation discovery now reuses the complete closed external-only execution policy, closes its binding object, validates all hashes and context, and requires exact protocol/type/hash/slot equality with the nested preparation.
- Acceptance evidence: focused discovery proves nested closure, complete policy/binding requirements, credential exclusion, and six cross-object identity relationships while existing successful venue fixtures remain valid.
- Compatibility/migration/configuration: discovery hardening changes the contract digest/ETag only; runtime responses, signing/submission boundaries, persistence, ingestion, RPC/WebSocket, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material dependency completed, exact shortfall 19. Quote and protocol-specific preparation objects still require bounded discriminated schemas; live qualification remains OPERATOR-blocked.
- NEXT_WEB_ACTION: enforce the closed handoff policy and all six identity relationships when consuming either preparation route, while continuing to treat quote and protocol-specific preparation payloads as unverified.

# UPSTREAM-PREPARATION-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected swap-preparation success discovery because AI/trading-safety and commercial clients could validate preparation failures but not the successful unsigned handoff envelope.
- Selected ID: `UPSTREAM-PREPARATION-SUCCESS-SCHEMA-001`.
- Implemented contract: pool and token `prepare-swap` HTTP 200 outcomes now share a closed schema requiring successful preparation, non-automation, unsigned/unsubmitted state, the exact ordered handoff sequence, and explicit handoff, quote, and preparation evidence.
- Acceptance evidence: focused discovery verifies both route bindings, exact top-level closure, fixed safety constants, and exact unique stage ordering; existing protocol HTTP regressions continue proving real successful preparations.
- Compatibility/migration/configuration: additive discovery changes the contract digest/ETag only; runtime preparation bytes, signing/submission boundaries, persistence, ingestion, RPC/WebSocket, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Live qualification remains OPERATOR-blocked by absent fresh canonical-mainnet evidence; dialect verification remains QC-owned.
- NEXT_WEB_ACTION: regenerate both swap-preparation validators and reject any success envelope that is automation-safe, signed, submitted, or missing the exact external handoff stages.

# UPSTREAM-QA-RESPONSE-SCHEMA-DIALECT-KIND-001

- BA/PO decision: fresh 20+ reconciliation selected the HIGH dialect completeness defect because fail-closed generated clients could not accept the shared cursor schema used by all five paginated REST success routes.
- Selected ID: `UPSTREAM-QA-RESPONSE-SCHEMA-DIALECT-KIND-001`.
- Implemented contract: response-schema dialect version 1 now declares the live `kind` keyword while preserving fail-closed unknown-keyword handling and canonical cursor semantics.
- Acceptance evidence: a recursive full-registry regression enumerates schema-node keywords, deliberately excludes relationship descriptor fields, and proves that no live keyword is undeclared.
- Compatibility/migration/configuration: discovery-only correction changes the contract digest/ETag; runtime pagination bytes, cursor encoding/scope/digest, persistence, ingestion, RPC/WebSocket, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Live qualification remains OPERATOR-blocked by absent fresh canonical-mainnet evidence; refreshed verification remains QC-owned.
- NEXT_WEB_ACTION: regenerate paginated response validators against dialect version 1 and continue rejecting unknown schema keywords fail closed.

# UPSTREAM-CONTRACT-SCHEMA-DIALECT-001

- BA/PO decision: fresh 20+ reconciliation selected response-schema dialect discovery because generated commercial, replay/reorg, and AI/trading-safety clients must interpret every custom fail-closed keyword consistently, including the newly required exact execution-stage order.
- Selected ID: `UPSTREAM-CONTRACT-SCHEMA-DIALECT-001`.
- Implemented contract: `/api/v1/query-contracts` now identifies the custom response-schema dialect, version, supported keywords and relationship kinds, and requires generators to fail closed on unknown keywords.
- Acceptance evidence: focused discovery verifies the dialect identity, fail-closed policy, semantic keyword set, relationship vocabulary, and complete coverage of the execution-policy sequence rule.
- Compatibility/migration/configuration: additive discovery metadata changes the contract digest/ETag; runtime route bodies, persistence, ingestion, RPC/WebSocket behavior, database, and configuration are unchanged. Generated clients should reject unsupported dialect versions or keywords.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. QC inbox remains based on the parent revision; live qualification remains OPERATOR-blocked by absent fresh canonical-mainnet evidence.
- NEXT_WEB_ACTION: require the declared response-schema dialect and fail-closed unknown-keyword policy before regenerating or accepting any discovered response validator.

# UPSTREAM-QA-EXECUTION-POLICY-SEQUENCE-001

- BA/PO decision: fresh 20+ reconciliation selected the HIGH execution-policy sequence defect because generated AI/trading-safety and commercial clients could accept approval, submission, and finalized verification out of order or duplicated.
- Selected ID: `UPSTREAM-QA-EXECUTION-POLICY-SEQUENCE-001`.
- Implemented contract: `execution_policy_success_v1.requiredSteps` now publishes the exact unique four-stage canonical sequence while retaining its length and item-vocabulary constraints.
- Acceptance evidence: generated-style validation accepts the canonical policy and rejects reordered, reversed, duplicate, and omitted-stage variants.
- Compatibility/migration/configuration: discovery-only semantic hardening; runtime bytes, preparation, simulation, external signing/submission boundaries, persistence, RPC/WebSocket, database, and configuration are unchanged. Generated validators must enforce `exactItems` and `uniqueItems`.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Current live qualification remains OPERATOR-blocked by absent fresh canonical-mainnet evidence; independent verification remains QC-owned.
- NEXT_WEB_ACTION: regenerate the execution-policy validator with exact ordered-item and uniqueness enforcement before admitting any trading workflow.

# UPSTREAM-EXECUTION-POLICY-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected execution-policy success discovery because AI/trading-safety and commercial clients could fetch the external handoff boundary but could not generate a validator for it.
- Selected ID: `UPSTREAM-EXECUTION-POLICY-SUCCESS-SCHEMA-001`.
- Implemented contract: `/internal/execution-policy` HTTP 200 now references a closed schema fixing external-only signing/submission authority, four required handoff stages, finalized simulation/confirmation, explicit approval, and bounded identity/amount/slippage/expiry requirements.
- Acceptance evidence: the real endpoint returns the exact top-level and nested required keys, preserves `indexerSigns:false` and `indexerSubmits:false`, and matches the canonical required-step sequence.
- Compatibility/migration/configuration: additive discovery only; runtime policy bytes, preparation, simulation, signing/submission boundaries, persistence, RPC/WebSocket, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Live qualification remains OPERATOR-blocked; refreshed independent verification remains QC-owned.
- NEXT_WEB_ACTION: generate the execution-policy validator and refuse any flow that omits simulation, explicit external approval, external submission, or finalized landed-message verification.

# UPSTREAM-TOKEN-ACCOUNT-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected public token-account success discovery because wallet intelligence and safety consumers received exact balances and Token-2022 withheld evidence without a machine-readable healthy schema.
- Selected ID: `UPSTREAM-TOKEN-ACCOUNT-SUCCESS-SCHEMA-001`.
- Implemented contract: `/api/v1/token-account/{account}` HTTP 200 now references a closed schema for account/mint/owner/program identity, decimals, raw and withheld balances, canonical slot, closed state, and snapshot completeness.
- Acceptance evidence: discovery identifies the new schema and a canonical indexed account returns HTTP 200 with the exact ten required keys while injected internal provenance remains redacted.
- Compatibility/migration/configuration: additive REST discovery only; runtime response bytes, account indexing, persistence, RPC/WebSocket, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Live qualification remains OPERATOR-blocked; refreshed independent verification remains QC-owned.
- NEXT_WEB_ACTION: generate the token-account validator and keep raw balance, withheld balance, and snapshot-completeness semantics separate in wallet UI and safety logic.

# UPSTREAM-HOLDERS-SUCCESS-PARITY-001

- BA/PO decision: fresh 20+ reconciliation selected public holder success discovery because Terminal DEX holder/whale consumers received the allowlisted concentration envelope without a schema, while the equivalent internal view already exposed one.
- Selected ID: `UPSTREAM-HOLDERS-SUCCESS-PARITY-001`.
- Implemented contract: `/api/v1/holders/{mint}` HTTP 200 now references the shared closed `token_holders_success_v1` schema used by the identical internal holder projection.
- Acceptance evidence: route discovery identifies the shared schema and a finalized account-snapshot fixture returns an exact required-key match with bounded holder rows and credential redaction.
- Compatibility/migration/configuration: additive discovery parity only; runtime response bytes, holder aggregation, persistence, RPC/WebSocket, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Live qualification remains OPERATOR-blocked; refreshed independent verification remains QC-owned.
- NEXT_WEB_ACTION: regenerate the public holder validator and preserve `safeForAutomation: false` plus disclosed coverage, exclusion, withheld, freshness, and concentration evidence.

# UPSTREAM-QA-GAP-FEED-SUCCESS-PROJECTION-001

- BA/PO decision: fresh 20+ reconciliation selected the new HIGH QC failure because generated replay/reorg consumers could accept five unsafe or contradictory gap-feed success projections.
- Selected ID: `UPSTREAM-QA-GAP-FEED-SUCCESS-PROJECTION-001`.
- Implemented contract: gap-feed success discovery now enforces ingestion freshness, configured lag, cursor/tip ordering, exact lag arithmetic, unique strictly increasing skipped slots, and exact top-level/nested skipped-slot identity.
- Acceptance evidence: the canonical success fixture remains valid while generated-style stale, excessive-lag, inconsistent-progress, descending-slot, and divergent-cache variants are all rejected.
- Compatibility/migration/configuration: discovery-only semantic hardening; runtime bytes, ingestion/reorg behavior, persistence, REST/RPC/WebSocket versions, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Live qualification remains OPERATOR-blocked; refreshed independent verification remains QC-owned.
- NEXT_WEB_ACTION: regenerate the gap-feed validator and reject cache invalidation unless both healthy ingestion semantics and skipped-slot identity validate.

# UPSTREAM-GAP-FEED-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected gap-feed success discovery parity because replay/reorg and commercial consumers could discover only the unavailable body despite the healthy route carrying bounded checkpoint, skipped-slot, and correction evidence.
- Selected ID: `UPSTREAM-GAP-FEED-SUCCESS-SCHEMA-001`.
- Implemented contract: `/internal/feed/gaps` HTTP 200 now references a closed schema for the exact healthy envelope, healthy exporter projection, durable skipped slots, at most 100 public reorg corrections, and nullable public inbox checkpoint.
- Acceptance evidence: a deterministic canonical replacement fixture returns HTTP 200 whose top-level and nested keys exactly match the published schema, mirrors skipped-slot evidence, and excludes unknown persisted recovery fields.
- Compatibility/migration/configuration: additive discovery only; runtime response bytes, ingestion/reorg behavior, persistence, REST/RPC/WebSocket versions, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Live qualification remains OPERATOR-blocked; refreshed independent verification remains QC-owned.
- NEXT_WEB_ACTION: generate the gap-feed validator and use checkpoint plus reorg-correction evidence to invalidate replay caches without treating the feed as complete chain history.

# UPSTREAM-FEED-HEALTH-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected combined feed-health success parity because replay/reorg, AI safety, and commercial monitoring consumers could discover only its unavailable body.
- Selected ID: `UPSTREAM-FEED-HEALTH-SUCCESS-SCHEMA-001`.
- Implemented contract: `/internal/feed/health` HTTP 200 now references a closed schema combining healthy canonical index evidence with the complete healthy exporter projection and exact progress constraints.
- Acceptance evidence: a deterministic finalized block plus concrete healthy exporter fixture returns HTTP 200 with exact top-level and nested ingestion key parity and fixed healthy constants.
- Compatibility/migration/configuration: additive discovery only; runtime response bytes, ingestion/index policy, persistence, RPC/WebSocket, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Live qualification remains OPERATOR-blocked; refreshed independent verification remains QC-owned.
- NEXT_WEB_ACTION: generate the combined feed-health validator and require both index and exporter evidence to satisfy their closed healthy schemas.

# UPSTREAM-QA-WAREHOUSE-SUCCESS-PROJECTION-001

- BA/PO decision: fresh 20+ reconciliation selected the remaining HIGH warehouse QC failure because generated clients could accept healthy evidence that runtime classifies stale, excessively lagged, or behind retained replay history.
- Selected ID: `UPSTREAM-QA-WAREHOUSE-SUCCESS-PROJECTION-001`.
- Implemented contract: healthy warehouse discovery now requires `ageMs <= staleAfterMs`, `lagEvents <= maxLagEvents`, and `sequence >= oldestSequence - 1` in addition to exact sink/reconciliation convergence.
- Acceptance evidence: focused generated-style checks retain the valid boundary and reject stale, excessive-lag, and replay-history-lost variants.
- Compatibility/migration/configuration: discovery-only semantic hardening; runtime responses, warehouse sinks, persistence, RPC/WebSocket, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Live qualification remains OPERATOR-blocked; refreshed independent verification remains QC-owned.
- NEXT_WEB_ACTION: regenerate the warehouse validator with property-relative freshness, lag, and oldest-retained-sequence bounds.

# UPSTREAM-QA-INGESTION-VALIDATOR-TIP-001

- BA/PO decision: fresh 20+ reconciliation selected refreshed HIGH QC evidence because a runtime-healthy nullable tip could not satisfy the newly published exact progress relationships.
- Selected ID: `UPSTREAM-QA-INGESTION-VALIDATOR-TIP-001` (completion dependency for `UPSTREAM-QA-INGESTION-SUCCESS-PROJECTION-001`).
- Implemented contract: healthy ingestion now requires a concrete nonnegative `localValidatorTip`; missing tip evidence fails closed as `invalid_validator_tip`, preserving exact cursor/lag arithmetic.
- Acceptance evidence: focused discovery requires integer tip evidence, the canonical concrete-tip HTTP form remains 200, and the formerly healthy nullable-tip form now returns bounded 503 evidence.
- Compatibility/migration/configuration: intentional fail-closed runtime tightening plus discovery alignment; no persistence, provider, RPC, WebSocket, database, or configuration migration.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Warehouse semantic hardening remains DEV-ready; live qualification remains OPERATOR-blocked.
- NEXT_WEB_ACTION: treat `invalid_validator_tip` as retryable unavailable evidence and regenerate the ingestion validator with a required integer validator tip.

# UPSTREAM-QA-INGESTION-SUCCESS-PROJECTION-001

- BA/PO decision: fresh 20+ reconciliation selected the remaining HIGH ingestion QC failure because generated clients could accept stale, lagged, contradictory, or noncanonical healthy exporter progress.
- Selected ID: `UPSTREAM-QA-INGESTION-SUCCESS-PROJECTION-001`.
- Implemented contract: healthy ingestion now requires strictly increasing unique skipped slots, `ageMs <= staleAfterMs`, `lagSlots <= maxLagSlots`, `cursor <= localValidatorTip`, and exact lag arithmetic.
- Acceptance evidence: focused discovery checks every published keyword/relationship and rejects duplicate, out-of-order, stale, excessive-lag, and cursor/tip contradictions while retaining the valid control.
- Compatibility/migration/configuration: discovery-only semantic hardening; runtime responses, exporter behavior, persistence, RPC/WebSocket, database, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Warehouse semantic hardening remains DEV-ready; live qualification remains OPERATOR-blocked.
- NEXT_WEB_ACTION: regenerate the ingestion validator with property-relative bounds, strict skipped-slot ordering, and exact cursor-to-tip lag arithmetic.

# UPSTREAM-QA-INDEX-HEALTH-SUCCESS-PROJECTION-001

- BA/PO decision: fresh 20+ reconciliation selected the new independent HIGH QC failure because a real healthy response did not satisfy its advertised schema and generated clients could accept stale healthy evidence.
- Selected ID: `UPSTREAM-QA-INDEX-HEALTH-SUCCESS-PROJECTION-001`.
- Implemented contract: `/api/health` preserves numeric instruction/program-event aggregates, permits resolved dead-letter history while requiring zero unresolved entries, and publishes `ageMs <= staleAfterMs`.
- Acceptance evidence: the canonical finalized fixture now includes resolved history and proves HTTP 200, numeric counts, exact schema keys, zero unresolved entries, and the freshness bound.
- Compatibility/migration/configuration: corrective discovery and projection change only; no persistence, provider, RPC method, WebSocket, database, or configuration migration.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Ingestion/warehouse semantic hardening remains DEV-ready; live qualification remains OPERATOR-blocked.
- NEXT_WEB_ACTION: regenerate the public-health validator and require its property-relative freshness bound before accepting healthy evidence.

# UPSTREAM-INDEX-HEALTH-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected healthy public index status because every discovery, intelligence, replay, AI safety, and commercial journey depends on this primary availability gate.
- Selected ID: `UPSTREAM-INDEX-HEALTH-SUCCESS-SCHEMA-001`.
- Implemented contract: `/api/health` success now binds a closed schema for finalized freshness, canonical chain identity, complete aggregate counts, zero unresolved dead letters, bounded retry/exclusion telemetry, and ingestion provenance.
- Acceptance evidence: focused discovery verifies healthy constants and nested closure; a current finalized block HTTP fixture proves exact response-key parity, canonical chain evidence, and finalized ingestion.
- Compatibility/migration/configuration: additive discovery only; health calculation, response body, persistence, RPC/WebSocket, readiness policy, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Feed-health success discovery remains; live qualification is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: generate the public health validator and fail closed unless every nested chain, retry, exclusion, and ingestion field validates.

# UPSTREAM-OPERATIONAL-SCHEMA-HARDENING-001

- BA/PO decision: fresh 20+ reconciliation prioritized two independent QC failures because permissive nested operational schemas could let generated clients accept credential-bearing, safety-contradictory, or nonconverged evidence.
- Selected IDs: `UPSTREAM-QA-INGESTION-SUCCESS-PROJECTION-001`, `UPSTREAM-QA-WAREHOUSE-SUCCESS-PROJECTION-001`.
- Implemented contracts: ingestion now closes exporter/index projections, types skipped slots, mirrors exporter fields, and binds automation eligibility to source; warehouse now closes sinks/reconciliation, fixes zero invalid-preimage counts, and publishes sequence/lag convergence relationships.
- Acceptance evidence: focused regressions assert nested closure, item typing, fixed values, mirror/conditional rules, sink equality, and lag arithmetic; existing healthy HTTP fixtures retain exact parity.
- Compatibility/migration/configuration: discovery hardening only; runtime responses, source policy, warehouse writes, persistence, RPC/WebSocket, and configuration are unchanged. Generated validators must implement the published relationship rules.
- Shortfall/blockers: 20+ findings reconciled, two material corrections completed, exact shortfall 18. Public health/feed success discovery remains; live qualification is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: regenerate ingestion and warehouse validators with nested closure plus mirror, conditional-value, equality, and difference relationship enforcement.

# UPSTREAM-WAREHOUSE-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected healthy warehouse convergence because AI safety, replay/reorg, recovery, and commercial monitoring clients could validate only warehouse failures.
- Selected ID: `UPSTREAM-WAREHOUSE-SUCCESS-SCHEMA-001`.
- Implemented contract: `/api/v1/warehouse` success now binds a closed schema for mainnet identity, sequence convergence, replay retention, freshness, sink checkpoints, and content reconciliation.
- Acceptance evidence: focused discovery verifies healthy/mainnet/replay constants; the existing exact-convergence HTTP fixture proves exact response-key parity while retaining credential redaction.
- Compatibility/migration/configuration: additive discovery only; warehouse calculation, sink writes, reconciliation, response body, persistence, RPC/WebSocket, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Healthy health/feed schemas remain; live qualification is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: generate the warehouse success validator and require exact sink/reconciliation convergence before enabling decision consumers.

# UPSTREAM-INGESTION-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected healthy ingestion evidence because discovery, replay/reorg, AI safety, and commercial monitoring clients could validate only exporter failures.
- Selected ID: `UPSTREAM-INGESTION-SUCCESS-SCHEMA-001`.
- Implemented contract: `/api/v1/ingestion` success now binds a closed schema for finalized mainnet exporter identity, canonical source, progress, freshness, failure-free state, durable skipped slots, exporter evidence, and index projection.
- Acceptance evidence: focused discovery verifies healthy/version/finality/failure constants and bounded source values; the live durable exporter fixture proves exact top-level response parity.
- Compatibility/migration/configuration: additive discovery only; exporter assessment, response body, source eligibility, persistence, RPC/WebSocket, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Other healthy operational schemas remain; live qualification is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: generate the ingestion success validator and preserve `automationEligible:false` for healthy public-RPC evidence.

# UPSTREAM-RECOVERY-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected healthy recovery qualification because replay/reorg consumers and operators could validate only unavailable, future, and stale outcomes.
- Selected ID: `UPSTREAM-RECOVERY-SUCCESS-SCHEMA-001`.
- Implemented contract: `/api/v1/recovery` success now binds a closed schema requiring healthy availability, null reason, bounded age, canonical backup identity, millisecond UTC completion, and nonnegative recovery duration.
- Acceptance evidence: focused discovery verifies constants, duration, identity, and time rules; the quarterly content-bound qualification fixture proves the live healthy response has exactly the advertised keys.
- Compatibility/migration/configuration: additive discovery only; qualification calculation, response body, recovery authority, persistence, RPC/WebSocket, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Other healthy operational schemas remain; live qualification is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: generate the recovery success validator and enable consumers only when every advertised healthy qualification field validates.

# UPSTREAM-BACKUP-SUCCESS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected healthy backup evidence because recovery operators and commercial monitoring clients could validate only unavailable, future, and stale variants.
- Selected ID: `UPSTREAM-BACKUP-SUCCESS-SCHEMA-001`.
- Implemented contract: `/api/v1/backup` success now binds a closed schema requiring availability, health, null failure reason, nonnegative age, configured maximum age, canonical backup ID, and millisecond UTC completion time.
- Acceptance evidence: focused discovery verifies constants and identity/time patterns; the existing content-bound backup fixture now proves the live healthy body has exactly the advertised keys.
- Compatibility/migration/configuration: additive discovery only; backup creation, assessment, response body, storage, recovery authority, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Other healthy operational schemas remain; live qualification is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: generate the backup success validator and reject evidence whose ID, completion timestamp, or freshness bounds do not satisfy this contract.

# UPSTREAM-STATS-SUCCESS-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ product opportunities and selected the healthy stats response because operational dashboards and commercial RPC clients could discover only its quarantined variant.
- Selected ID: `UPSTREAM-STATS-SUCCESS-SCHEMA-001`.
- Implemented contract: `/api/stats` success now binds a closed `stats_success_v1` schema covering all canonical counts, retry/exclusion telemetry, ingestion provenance, structure, and chain evidence.
- Acceptance evidence: focused HTTP regression compares the live healthy response keys to the schema and verifies canonical structure and chain evidence.
- Compatibility/migration/configuration: additive discovery only; stats calculation, response body, persistence, authentication, RPC/WebSocket, and configuration are unchanged.
- Shortfall/blockers: 20+ findings reconciled, one material outcome completed, exact shortfall 19. Remaining healthy operational schemas need independent fixtures; live qualification is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: generate the stats success validator and treat noncanonical structure or chain evidence as unavailable rather than usable telemetry.

# UPSTREAM-LEGACY-COLLECTION-SCHEMAS-001

- BA/PO decision: a fresh 20+ opportunity reconciliation selected the two legacy collection contracts because compatibility clients could discover that JSON was returned but not that the successful body remains a bare array rather than the cursor-v1 envelope.
- Selected IDs: `UPSTREAM-LEGACY-BLOCKS-SCHEMA-001`, `UPSTREAM-LEGACY-TRANSACTIONS-SCHEMA-001`.
- Implemented contracts: `/api/blocks` and `/api/transactions` now publish `legacy_collection_success_v1` with an array body shape; versioned collection schemas are unchanged.
- Acceptance evidence: focused discovery asserts the schema and both route bindings; full, replay, and operational validation are recorded by the automation report.
- Compatibility/migration/configuration: additive discovery only; legacy response bodies, persistence, configuration, RPC, and WebSocket behavior are unchanged.
- Shortfall/blockers: 20+ findings reconciled, two material outcomes completed, exact shortfall 18. Healthy operational fixtures remain separate; live qualification is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: keep parsing these two compatibility endpoints as bare arrays and prefer versioned endpoints when cursor metadata is required.

# UPSTREAM-AUTOMATION-BOUNDARY-SCHEMAS-001

- BA/PO decision: fresh 20+ reconciliation selected quote and bot-readiness success discovery because AI trading consumers must distinguish analysis availability from complete operational readiness.
- Selected IDs: `UPSTREAM-POOL-QUOTE-SUCCESS-SCHEMA-001`, `UPSTREAM-BOT-READINESS-SUCCESS-SCHEMA-001`.
- Implemented contracts: successful pool quotes remain explicitly analysis-only (`automationSafe:false`, simulation required, no submission); successful bot readiness requires schema v2, `ready:true`, null reason, empty missing list, target pool, market evidence, and healthy dependency projections.
- Acceptance evidence: focused discovery binds both routes and verifies the safety/readiness constants and empty-missing constraint.
- Compatibility/migration/configuration: additive discovery only; no quote, readiness, execution, persistence, RPC/WebSocket, or configuration change.
- Shortfall/blockers: 20+ findings reconciled, two material outcomes completed, exact shortfall 18. Remaining operational successes need healthy fixtures; live qualification is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: generate both validators and never treat an available quote as authorization to simulate, sign, submit, or trade.

# UPSTREAM-POOL-RISK-TYPES-001

- BA/PO decision: fresh 20+ reconciliation selected the independent QC failure because the published pool-risk validator rejected its canonical success response.
- Selected ID: `UPSTREAM-POOL-RISK-TYPES-001`.
- Implemented contract: `directions` now advertises a nonnegative integer count and `latestBlockTime` an ISO date-time string or null, matching runtime evidence.
- Compatibility: schema-only correction; no runtime, persistence, configuration, RPC, or WebSocket change.
- Validation: focused schema regression plus full/replay/operational gates; automation remains explicitly unsafe.
- Shortfall/blockers: one material outcome completed; exact shortfall 19. Healthy operational fixtures remain separate; live evidence is OPERATOR-blocked; protocol expansion needs authoritative ABI/fixtures.
- NEXT_WEB_ACTION: regenerate the pool-risk validator for integer directions and ISO-or-null latest block time.

# UPSTREAM-DECISION-SUPPORT-SCHEMAS-001

- BA/PO decision: fresh 20+ opportunity reconciliation selected registry, pool-risk, and candle success contracts for decoder compatibility, AI trading safety, and chart consumers. All three are stable, offline-verifiable projections.
- Selected IDs: `UPSTREAM-REGISTRY-SCHEMA-001`, `UPSTREAM-POOL-RISK-SCHEMA-001`, `UPSTREAM-CANDLES-SCHEMA-001`.
- Implemented contracts: the three 200 outcomes now bind distinct closed schemas. Registry requires a versioned program catalog; pool risk requires every top-level quality, liquidity, execution, security, holder, and manipulation family while preserving `safeForAutomation:false`; candles require exact interval, rejection, price-unit, and data fields.
- Acceptance evidence: focused discovery binds all three routes, closes unknown fields, declares every required key, and verifies the registry collection plus risk automation constant.
- Compatibility/migration/configuration: additive discovery only; runtime responses, risk/candle calculations, registry contents, persistence, RPC/WebSocket, and configuration remain unchanged.
- Shortfall/blockers: 20+ findings reconciled, three material outcomes completed, exact 20-task shortfall 17. Retained quote/readiness/operational success variants require healthy fixtures; live qualification is OPERATOR-blocked; protocol expansion requires authoritative ABI and canonical fixtures.
- NEXT_WEB_ACTION: generate the registry, pool-risk, and candle validators and never infer automation safety from an assessable risk payload.

# UPSTREAM-TRANSACTION-FEE-TYPE-001

- BA/PO decision: fresh 20+ opportunity reconciliation selected the independent QC failure because generated transaction clients would reject every canonical success body before retained enhancements could add value.
- Selected ID: `UPSTREAM-TRANSACTION-FEE-TYPE-001`.
- Implemented contract: `transaction_detail_success_v1.feeLamports` now advertises the runtime's exact nonnegative integer instead of an incompatible string.
- Acceptance evidence: focused discovery asserts the complete integer/minimum rule and the independent QC fixture establishes the canonical runtime value.
- Compatibility/migration/configuration: schema correction only; runtime response, accounting, persistence, endpoint status, RPC/WebSocket, and configuration remain unchanged. Clients generated from `791a3b4` must regenerate.
- Shortfall/blockers: 20+ findings reconciled, one material correction completed, exact 20-task shortfall 19. Retained success contracts require healthy/variant fixtures; live qualification is OPERATOR-blocked; protocol expansion requires authoritative ABI and canonical fixtures.
- NEXT_WEB_ACTION: regenerate the transaction-detail validator and parse `feeLamports` as an exact nonnegative JSON integer.

# UPSTREAM-DETAIL-VALUATION-SCHEMAS-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities and selected eight offline-safe detail/valuation outcomes serving token research, account intelligence, pool inspection, transaction provenance, pricing, and volume consumers.
- Selected IDs: `UPSTREAM-EVIDENCE-SCHEMA-001`, `UPSTREAM-INTERNAL-TOKEN-DETAIL-SCHEMA-001`, `UPSTREAM-PUBLIC-MINT-DETAIL-SCHEMA-001`, `UPSTREAM-ACCOUNT-SCHEMA-001`, `UPSTREAM-POOL-DETAIL-SCHEMA-001`, `UPSTREAM-TRANSACTION-SCHEMA-001`, `UPSTREAM-PRICE-SUCCESS-SCHEMA-001`, `UPSTREAM-VOLUME-SUCCESS-SCHEMA-001`.
- Implemented contracts: eight 200 outcomes now bind closed success schemas. Internal/public token detail share one projection schema; public account reuses the wallet-detail schema; evidence fixes schema v2 and advisory safety; price and volume require `available:true` while preserving bounded optional valuation evidence.
- Acceptance evidence: focused discovery binds every route, verifies closed top-level fields, and checks evidence version plus price/volume success constants.
- Compatibility/migration/configuration: additive discovery only; runtime bodies, calculations, persistence, endpoint status, RPC/WebSocket, and configuration remain unchanged.
- BA/PO matrix: eight selected IDs delivered; retained `UPSTREAM-BOT-READINESS-SUCCESS-SCHEMA-001`, `UPSTREAM-POOL-QUOTE-SUCCESS-SCHEMA-001`, `UPSTREAM-REGISTRY-SCHEMA-001`, `UPSTREAM-FEED-SUCCESS-SCHEMA-001`, `UPSTREAM-HEALTH-SUCCESS-SCHEMA-001`, `UPSTREAM-STATS-SUCCESS-SCHEMA-001`, `UPSTREAM-INGESTION-SUCCESS-SCHEMA-001`, `UPSTREAM-WAREHOUSE-SUCCESS-SCHEMA-001`, `UPSTREAM-BACKUP-SUCCESS-SCHEMA-001`, `UPSTREAM-RECOVERY-SUCCESS-SCHEMA-001`; blocked `UPSTREAM-LIVE-QUALIFICATION-001` and `UPSTREAM-PROTOCOL-COVERAGE-001`.
- Shortfall/blockers: eight material outcomes completed; exact 20-task shortfall is 12. Ten retained status/union contracts require separate healthy-evidence fixtures; live qualification is OPERATOR-blocked; protocol expansion requires authoritative ABI and canonical fixtures.
- NEXT_WEB_ACTION: generate the detail, evidence, account, pool, transaction, price, and volume validators and accept only the advertised success variants.

# UPSTREAM-WALLET-CLUSTER-NULLABILITY-001

- BA/PO decision: fresh 20+ opportunity reconciliation selected the independent QC failure over retained enhancements because the published funding-cluster validator rejected the canonical evidence-only response.
- Selected ID: `UPSTREAM-WALLET-CLUSTER-NULLABILITY-001`.
- Implemented contract: `wallet_funding_cluster_success_v1.classification` now accepts either a nonempty classification string or null. Null continues to mean no supported classification; it does not imply smart-money or automation eligibility.
- Acceptance evidence: focused regression proves the canonical empty/evidence-only store emits null and the schema advertises the exact string-or-null union.
- Compatibility/migration/configuration: additive schema correction only; runtime body, endpoint status, persistence, RPC/WebSocket, and configuration remain unchanged. Regenerate validators built from `0c936dd`.
- Shortfall/blockers: 20+ findings reconciled, one material correction completed, exact 20-task shortfall 19. Remaining success contracts require separate nested/variant fixtures; live qualification is OPERATOR-blocked; protocol expansion requires authoritative ABI and canonical fixtures.
- NEXT_WEB_ACTION: regenerate the wallet funding-cluster validator so null classification is accepted while automation remains disabled.

# UPSTREAM-WALLET-INTELLIGENCE-SCHEMAS-001

- BA/PO decision: fresh inspection reconciled 20+ current contract, recovery, performance, provider, and protocol opportunities. Five wallet-intelligence success envelopes ranked highest for trader intelligence, AI analysis, and commercial clients because they were stable runtime projections but undiscoverable to generated clients.
- Selected IDs: `UPSTREAM-WALLET-DETAIL-SCHEMA-001`, `UPSTREAM-WALLET-PERFORMANCE-SCHEMA-001`, `UPSTREAM-WALLET-PROFILE-SCHEMA-001`, `UPSTREAM-WALLET-FUNDING-SCHEMA-001`, `UPSTREAM-WALLET-CLUSTER-SCHEMA-001`.
- Implemented contracts: distinct closed schemas now cover wallet activity detail, PnL/performance, profile classification, native/token funding, and shared-funder clusters. Every analytical envelope explicitly preserves `safeForAutomation:false`; profiles additionally preserve `smartMoney:false` rather than asserting unsupported classification.
- Acceptance evidence: focused discovery binds all five routes to distinct schemas, verifies every admitted key is declared, closes additional properties, and checks fail-closed automation constants.
- Compatibility/migration/configuration: additive discovery only; runtime payloads, classification, persistence, endpoint status, RPC/WebSocket, and configuration remain unchanged.
- BA/PO matrix: five selected IDs delivered; retained `UPSTREAM-TOKEN-DETAIL-SCHEMA-001`, `UPSTREAM-EVIDENCE-SCHEMA-001`, `UPSTREAM-POOL-QUOTE-SCHEMA-001`, `UPSTREAM-PRICE-SUCCESS-SCHEMA-001`, `UPSTREAM-VOLUME-SUCCESS-SCHEMA-001`, `UPSTREAM-BOT-READINESS-SUCCESS-SCHEMA-001`, `UPSTREAM-POOL-DETAIL-SCHEMA-001`, `UPSTREAM-ACCOUNT-SCHEMA-001`, `UPSTREAM-MINT-SCHEMA-001`, `UPSTREAM-TRANSACTION-SCHEMA-001`, `UPSTREAM-REGISTRY-SCHEMA-001`, `UPSTREAM-FEED-SUCCESS-SCHEMA-001`, `UPSTREAM-WS-SNAPSHOT-SCHEMA-001`; blocked `UPSTREAM-LIVE-QUALIFICATION-001` and `UPSTREAM-PROTOCOL-COVERAGE-001`.
- Shortfall/blockers: five material outcomes completed; exact 20-task shortfall is 15. Thirteen retained outcomes require separate nested/variant fixture design; live qualification is blocked on OPERATOR evidence; protocol expansion is blocked on authoritative ABI and canonical fixtures. No schema field or assertion is counted separately.
- NEXT_WEB_ACTION: generate the five wallet-intelligence validators and keep all analytics advisory-only while `safeForAutomation` is false.

# UPSTREAM-TOKEN-INTELLIGENCE-SCHEMAS-001

- BA/PO decision: fresh inspection reconciled 20+ gaps across the remaining 42 untyped successes, recovery, performance, protocol coverage, and live qualification. Six token-intelligence envelopes ranked highest because token detail consumers need stable market, security, holder, trade, candle, and liquidity boundaries and all six are offline-safe and compatibility-only.
- Selected IDs: `UPSTREAM-TOKEN-MARKET-SCHEMA-001`, `UPSTREAM-TOKEN-SECURITY-SCHEMA-001`, `UPSTREAM-HOLDER-SCHEMA-001`, `UPSTREAM-TRADE-SCHEMA-001`, `UPSTREAM-OHLCV-SCHEMA-001`, `UPSTREAM-LIQUIDITY-SCHEMA-001`.
- Implemented contracts: six distinct closed 200 schemas now cover the exact top-level projections. Security and holders explicitly advertise `safeForAutomation:false`; trades, OHLCV, and liquidity retain schema-v1 collection envelopes; market requires its price, volume, pool, risk, and latest-swap evidence families.
- Acceptance evidence: focused discovery verifies each route binds its own schema, closes additional properties, has disjoint required/optional fields, and defines every admitted field.
- Compatibility/migration/configuration: additive query-contract metadata only; runtime bodies, evidence, ranking, persistence, REST status, RPC/WebSocket, and configuration are unchanged.
- BA/PO matrix: six selected IDs delivered; retained `UPSTREAM-TOKEN-DETAIL-SCHEMA-001`, `UPSTREAM-EVIDENCE-SCHEMA-001`, `UPSTREAM-WALLET-DETAIL-SCHEMA-001`, `UPSTREAM-WALLET-PERFORMANCE-SCHEMA-001`, `UPSTREAM-WALLET-PROFILE-SCHEMA-001`, `UPSTREAM-WALLET-FUNDING-SCHEMA-001`, `UPSTREAM-WALLET-CLUSTER-SCHEMA-001`, `UPSTREAM-POOL-QUOTE-SCHEMA-001`, `UPSTREAM-PRICE-SUCCESS-SCHEMA-001`, `UPSTREAM-VOLUME-SUCCESS-SCHEMA-001`, `UPSTREAM-BOT-READINESS-SUCCESS-SCHEMA-001`, `UPSTREAM-WS-SNAPSHOT-SCHEMA-001`; blocked `UPSTREAM-LIVE-QUALIFICATION-001` (OPERATOR evidence) and `UPSTREAM-PROTOCOL-COVERAGE-001` (authoritative ABI/fixtures).
- Shortfall/blockers: six material outcomes completed; exact 20-task shortfall is 14. Twelve retained contracts require separate variant/item-schema fixture design; live qualification and protocol expansion have the explicit external blockers above. No fields, assertions, or documentation were counted separately.
- NEXT_WEB_ACTION: generate the six token-intelligence validators and continue treating security and holder payloads as non-automation-safe.

# UPSTREAM-DISCOVERY-SUCCESS-SCHEMAS-001

- BA/PO decision: fresh inspection of the 46 untyped JSON success outcomes and retained recovery/performance queue selected the four discovery/trending envelopes. They directly serve discovery, pool launch, evidence ranking, and public-commercial consumers; all are offline-verifiable and share a compatibility-only query-contract release boundary.
- Selected IDs: `UPSTREAM-INTERNAL-TRENDING-SCHEMA-001`, `UPSTREAM-NEW-PAIRS-SCHEMA-001`, `UPSTREAM-CANDIDATES-SCHEMA-001`, `UPSTREAM-PUBLIC-TRENDING-SCHEMA-001`.
- Implemented contracts: the four 200 outcomes now reference distinct closed schemas preserving their real envelopes. Internal trending fixes schema version, window vocabulary, `activity-v1`, and token array; new pairs fixes schema version and data array; candidates fixes schema version, `activity-v1`, and evidence array; public trending fixes ISO timestamp, window vocabulary, honest methodology, and token array.
- Acceptance evidence: each real route returns HTTP 200, contains every required field and no undeclared top-level field, and satisfies every advertised constant enum. Discovery binds each route to its distinct schema.
- Compatibility/migration/configuration: additive discovery precision only. Runtime payloads, ranking, evidence, persistence, REST status, RPC/WebSocket, and configuration remain unchanged; generated clients should add the four validators.
- BA/PO opportunity matrix (20 reconciled): `UPSTREAM-INTERNAL-TRENDING-SCHEMA-001` delivered/P0; `UPSTREAM-NEW-PAIRS-SCHEMA-001` delivered/P0; `UPSTREAM-CANDIDATES-SCHEMA-001` delivered/P0; `UPSTREAM-PUBLIC-TRENDING-SCHEMA-001` delivered/P0; `UPSTREAM-TOKEN-DETAIL-SCHEMA-001` retained/P1; `UPSTREAM-TOKEN-MARKET-SCHEMA-001` retained/P1; `UPSTREAM-TOKEN-SECURITY-SCHEMA-001` retained/P1; `UPSTREAM-HOLDER-SCHEMA-001` retained/P1; `UPSTREAM-TRADE-SCHEMA-001` retained/P1; `UPSTREAM-OHLCV-SCHEMA-001` retained/P1; `UPSTREAM-LIQUIDITY-SCHEMA-001` retained/P1; `UPSTREAM-DEPTH-SCHEMA-001` retained/P1; `UPSTREAM-WALLET-DETAIL-SCHEMA-001` retained/P1; `UPSTREAM-WALLET-PERFORMANCE-SCHEMA-001` retained/P1; `UPSTREAM-WALLET-PROFILE-SCHEMA-001` retained/P1; `UPSTREAM-WALLET-FUNDING-SCHEMA-001` retained/P1; `UPSTREAM-WALLET-CLUSTER-SCHEMA-001` retained/P1; `UPSTREAM-POOL-QUOTE-SCHEMA-001` retained/P1; `UPSTREAM-LIVE-QUALIFICATION-001` blocked/P0; `UPSTREAM-PROTOCOL-COVERAGE-001` blocked/P2.
- Shortfall/blockers: four material outcomes completed; exact 20-task shortfall is 16. Items 5-18 require separate nested item-schema design and fixture acceptance and were not split into this top-level-envelope batch; item 19 requires fresh operator-owned provider/warehouse/backup/recovery evidence; item 20 requires an authoritative selected protocol ABI and canonical fixtures. Green tests and elapsed time are not claimed as blockers.
- NEXT_WEB_ACTION: generate and enforce the four discovery/trending success validators while preserving each route's distinct envelope.

# UPSTREAM-FEED-PAGE-SCHEMA-CLOSURE-001

- BA/PO decision: fresh inspection reconciled 46 remaining untyped success outcomes plus the broader correctness/recovery queue. Independent QC elevated six active schema defects: one nested feed-health redaction gap and five page-cursor semantic gaps.
- Selected IDs: `UPSTREAM-FEED-HEALTH-NESTED-SCHEMA-001`, `UPSTREAM-BLOCKS-PAGE-CURSOR-SCHEMA-001`, `UPSTREAM-TRANSACTIONS-PAGE-CURSOR-SCHEMA-001`, `UPSTREAM-SWAPS-PAGE-CURSOR-SCHEMA-001`, `UPSTREAM-TOKENS-PAGE-CURSOR-SCHEMA-001`, `UPSTREAM-POOLS-PAGE-CURSOR-SCHEMA-001`.
- Implemented contracts: feed health now closes its nested ingestion projection to the exact redacted exporter fields; paginated `nextCursor` now declares the same `canonical_cursor_v1` semantic kind enforced by request admission.
- Acceptance evidence: the real feed response satisfies nested required/allowed fields while `providerCredential` is undeclared; each of the five routes independently rejects `cursor=A` with HTTP 400 while retaining valid terminal null cursors.
- Compatibility/migration/configuration: additive contract precision only; runtime bodies, cursor encoding, pagination/filter scope, endpoint status, persistence, RPC/WebSocket, and configuration remain unchanged.
- Blockers/owners: live operational qualification remains blocked by absent provider and canonical environment evidence—OPERATOR. Exact implementation shortfall is 14 because six independently reviewed contract outcomes were dependency-ready; splitting nested properties or cursor characters would be padding.
- NEXT_WEB_ACTION: enforce the closed feed ingestion projection and canonical cursor decoder in generated clients before consuming these six contracts.

# UPSTREAM-PAGINATED-SUCCESS-SCHEMAS-001

- BA/PO decision: fresh inspection reconciled 51 untyped JSON success outcomes in addition to the retained recovery, correctness, performance, and operability queue. The five cursor-paginated event/catalog routes ranked highest as one dependency-ready batch because commercial clients already rely on their stable shared envelope.
- Selected IDs: `UPSTREAM-BLOCKS-PAGE-SCHEMA-001`, `UPSTREAM-TRANSACTIONS-PAGE-SCHEMA-001`, `UPSTREAM-SWAPS-PAGE-SCHEMA-001`, `UPSTREAM-TOKENS-PAGE-SCHEMA-001`, `UPSTREAM-POOLS-PAGE-SCHEMA-001`.
- Implemented contracts: all five 200 outcomes now reference closed `paginated_collection_v1`, requiring only an array `data` and canonical base64url-or-null `nextCursor` bounded to 1,024 characters.
- Acceptance evidence: each real empty collection route returns 200 and exactly the two required fields with an array and null terminal cursor; discovery independently binds all five routes to the shared schema.
- Compatibility/migration/configuration: additive discovery only; runtime bodies, cursor encoding/scope, filters, REST status, RPC/WebSocket, persistence, and configuration remain unchanged.
- Blockers/owners: live operational qualification remains blocked by absent provider and canonical environment evidence—OPERATOR. Exact implementation shortfall is 15 because five independently consumable success contracts were compatible; splitting collection fields or cursor cases would be padding.
- NEXT_WEB_ACTION: generate one `paginated_collection_v1` envelope validator and retain route-specific item validators for blocks, transactions, swaps, tokens, and pools.

# UPSTREAM-FEED-HEALTH-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across ingestion, finality, recovery, observability, contract parity, downstream safety, performance, and commercial readiness. With independent QC green on the prior batch, `/internal/feed/health` ranked highest because it was the sole remaining retryable route without a published response schema.
- Selected ID: `UPSTREAM-FEED-HEALTH-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: the combined index/exporter 503 now references closed `feed_health_unavailable_v1`, requiring the redacted index health/stats projection and nested ingestion status while admitting only the bounded optional quality evidence emitted for richer index failures.
- Acceptance evidence: real empty-index/absent-exporter and malformed-index/absent-exporter responses both contain every required field, no undeclared top-level field, and remain explicitly unhealthy.
- Compatibility/migration/configuration: additive discovery only; runtime bodies, ingestion evidence, endpoint status, REST/RPC/WebSocket behavior, persistence, and configuration remain unchanged.
- Blockers/owners: live operational qualification remains blocked by absent provider and canonical environment evidence—OPERATOR. Exact implementation shortfall is 19 because one material response contract was dependency-ready; splitting nested fields or failure causes would be padding.
- NEXT_WEB_ACTION: generate `feed_health_unavailable_v1` and block live-feed consumers whenever a matching response is received.

# UPSTREAM-STATIC-ASSET-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across contract parity, recovery, observability, provider resilience, performance, commercial readiness, and downstream journeys. The `/` and `/index.html` failure contracts ranked highest among dependency-ready offline-safe items because both return a bounded JSON 503 while discovery exposed no schema.
- Selected IDs: `UPSTREAM-ROOT-ASSET-UNAVAILABLE-SCHEMA-001`, `UPSTREAM-INDEX-ASSET-UNAVAILABLE-SCHEMA-001`.
- Implemented contracts: both retryable outcomes now reference closed `static_asset_unavailable_v1`, requiring only the constant `static_asset_unavailable` error sentinel.
- Acceptance evidence: replacing the configured asset with a directory makes both real routes return 503; each body contains its sole required field, no undeclared field, and the advertised constant.
- Compatibility/migration/configuration: additive discovery only; successful HTML responses, failure bodies, asset limits, configuration, REST status, RPC, WebSocket, and persistence remain unchanged.
- Blockers/owners: live operational qualification remains blocked by absent provider and canonical environment evidence—OPERATOR. Exact implementation shortfall is 18 because two independently consumable route outcomes were dependency-ready; splitting one shared schema or assertions would be padding.
- NEXT_WEB_ACTION: generate one shared `static_asset_unavailable_v1` validator and use it for both root document routes.

# UPSTREAM-BACKUP-RECOVERY-STALE-THRESHOLD-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across recovery, contract parity, data correctness, finality, operability, performance, downstream safety, and commercial readiness. Independent QC elevated `UPSTREAM-BACKUP-STALE-THRESHOLD-001` and `UPSTREAM-RECOVERY-STALE-THRESHOLD-001` because each stale schema admitted evidence the runtime still considers fresh.
- Selected IDs: `UPSTREAM-BACKUP-STALE-THRESHOLD-001`, `UPSTREAM-RECOVERY-STALE-THRESHOLD-001`.
- Implemented contracts: both stale variants now declare `ageMs` as strictly greater than the sibling `maximumAgeMs` using the discoverable `exclusiveMinimumProperty` relation. The runtime boundary remains healthy at equality and stale only above it.
- Acceptance evidence: real stale bodies still select exactly one union branch; synthetic bodies at the configured maximum age now select none for both backup and recovery.
- Compatibility/migration/configuration: additive contract precision only. Generated validators must implement the declared sibling-property comparison; runtime responses, persistence, configuration, REST status, RPC, and WebSocket remain unchanged.
- Blockers/owners: live backup/recovery qualification remains blocked by absent fresh isolated evidence—OPERATOR. Exact implementation shortfall is 18 because two distinct threshold contracts were dependency-ready; splitting boundaries or examples would be padding.
- NEXT_WEB_ACTION: regenerate both failure-union validators with `exclusiveMinimumProperty` support and reject stale responses whose age is not above the advertised maximum.

# UPSTREAM-STATS-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across data completeness, contract parity, finality/reorg, provider resilience, recovery, observability, performance, developer experience, and commercial readiness. `/api/stats` ranked highest among dependency-ready offline-safe items because commercial monitoring clients could discover its retryable 503 but not validate the quarantined-state body.
- Selected ID: `UPSTREAM-STATS-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: the `/api/stats` 503 outcome now references closed `stats_unavailable_v1`, requiring the complete redacted stats projection plus structure and chain evidence while rejecting health-only and unknown top-level fields.
- Acceptance evidence: a real malformed persisted collection shape returns 503, exposes `structure.canonical:false` and `chain.invalidStateStructure:true`, contains every required field, no undeclared field, and no misleading health status fields.
- Compatibility/migration/configuration: additive query-contract discovery only; runtime body, endpoint, REST status, RPC result, WebSocket, persistence, and configuration remain unchanged.
- Blockers/owners: live operational qualification remains blocked by absent provider and canonical environment evidence—OPERATOR. Exact implementation shortfall is 19 because one material contract outcome was dependency-ready; splitting counters or nested fields would be padding.
- NEXT_WEB_ACTION: generate a validator for `stats_unavailable_v1` and treat every matching response as quarantined monitoring data rather than canonical index health.

# UPSTREAM-BACKUP-RECOVERY-FAILURE-UNIONS-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across discovery, token/pool intelligence, holders/whales, trading safety, finality/reorg, provider resilience, recovery, observability, performance, and commercial contracts. Independent QC elevated `UPSTREAM-BACKUP-UNAVAILABLE-UNION-001` and `UPSTREAM-RECOVERY-UNAVAILABLE-UNION-001` above the retained stats-schema gap because both published flat schemas accepted impossible fail-open availability/reason/identity combinations.
- Selected IDs: `UPSTREAM-BACKUP-UNAVAILABLE-UNION-001`, `UPSTREAM-RECOVERY-UNAVAILABLE-UNION-001`.
- Implemented contracts: both 503 schemas are now closed three-variant unions. Missing/invalid evidence requires `available:false`, null age, and no identity; future evidence requires `available:true`, negative age, canonical backup identity and timestamp; stale evidence requires `available:true`, nonnegative age, canonical identity and timestamp. Recovery temporal variants additionally require nonnegative duration.
- Acceptance evidence: real missing, invalid, and stale HTTP bodies match exactly one variant; eight impossible availability/identity/timestamp combinations match none. Runtime response bodies and status codes are unchanged.
- Compatibility/migration/configuration: additive discovery precision only. Generated validators must regenerate against the union shape; no persistence, evidence, endpoint, RPC, WebSocket, or configuration migration.
- Blockers/owners: live backup/recovery qualification remains blocked by absent fresh isolated operational evidence—OPERATOR. Exact implementation shortfall is 18 because two material QC-backed outcomes form this coherent offline-safe batch; splitting variants, fields, or assertions would be padding.
- NEXT_WEB_ACTION: regenerate backup and recovery 503 validators and keep promotion disabled unless exactly one union variant matches.

## UPSTREAM-RECOVERY-UNAVAILABLE-SCHEMA-001

- BA/PO decision: fresh inspection reconciled 20+ current opportunities across recovery qualification, backup integrity, exact convergence, finality, contract parity, trading safety, operability, observability, performance, and commercial readiness. `/api/v1/recovery` ranked highest because promotion consumers could not machine-validate its bounded fail-closed 503 family.
- Selected ID: `UPSTREAM-RECOVERY-UNAVAILABLE-SCHEMA-001`.
- Implemented contract: the route's 503 outcome now references closed `recovery_unavailable_v1`, requiring availability, `healthy:false`, bounded qualification reason, age, and configured maximum age; canonical stale/future reports may additionally expose only backup ID, completion time, and duration.
- Acceptance evidence: real missing and invalid report responses validate the required/allowed field contract; the schema explicitly enumerates the two canonical temporal failures and their three identity fields.
- Compatibility/migration/configuration: additive discovery only; runtime bodies, isolated recovery reports, persistence, REST status, RPC, WebSocket, and configuration remain unchanged.
- Blockers/owners: live isolated recovery qualification remains blocked by absent fresh evidence—OPERATOR. The implementation shortfall is 19 because one material outcome was dependency-ready; splitting reasons or identity fields would be padding.
- NEXT_WEB_ACTION: generate a validator for `recovery_unavailable_v1` and keep consumer promotion disabled for every matching response.

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
# UPSTREAM-PREPARATION-TRANSACTION-BOUNDARY-SCHEMA-001

- BA/PO decision: close the dependency-ready unsigned preparation and transaction authorization boundary before attempting venue-specific quote and instruction-evidence unions. This directly prevents published validators from accepting injected top-level credentials or contradictory nested signed/submitted state while preserving every current preparation route.
- Selected ID: `UPSTREAM-PREPARATION-TRANSACTION-BOUNDARY-SCHEMA-001`.
- Contract: `preparation_success_v1.preparation` now has an exact nine-field envelope; its unsigned legacy transaction has an exact nine-field envelope, fixed schema/message versions, hash shapes, nonempty instruction policy evidence, and constant `signed: false` / `submitted: false`.
- Compatibility/migration/configuration: additive schema precision only; successful response bodies and configuration are unchanged. Consumers that generated permissive validators should regenerate them from `/api/v1/query-contracts`.
- Validation: focused response-contract regression, full suite, syntax, replay, and fail-closed health checks.
- Remaining boundary: protocol-specific `quote`, `instructionEvidence`, and `simulationPolicy` projections require explicit venue unions and remain non-automation-safe.
- NEXT_WEB_ACTION: reject preparation responses whose preparation or transaction contains undeclared fields, authorizing state, a non-legacy message version, or a non-finalized commitment.
# UPSTREAM-PREPARATION-SIMULATION-POLICY-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected the shared simulation-policy boundary because all supported preparation venues emit the same four safety fields and two exact token-effect expectations, while venue-specific instruction evidence and quotes require separate unions.
- Selected ID: `UPSTREAM-PREPARATION-SIMULATION-POLICY-SCHEMA-001`.
- Contract: `preparation_success_v1.preparation.simulationPolicy` is closed; program allow/require lists are nonempty, unique, and equal; instruction policies, account metas, and exactly two mint-bound raw-balance expectations are closed; transaction and simulation instruction policies must be identical.
- Compatibility/migration/configuration: response bodies and configuration are unchanged; generated contract validators should be refreshed. The change only rejects undeclared or contradictory safety evidence.
- Validation: focused schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: protocol-specific quote and instructionEvidence objects remain open and non-automation-safe pending explicit venue unions.
- NEXT_WEB_ACTION: enforce the closed simulation policy, equality rules, and exact two-account effect bounds before showing a prepared swap as locally simulatable.
# UPSTREAM-PREPARATION-INSTRUCTION-AMOUNTS-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation found that all supported instruction-evidence families share three signer-critical raw amounts, while their venue identity and nested reserve/hook evidence differ enough that a closed union requires a larger protocol-by-protocol increment.
- Selected ID: `UPSTREAM-PREPARATION-INSTRUCTION-AMOUNTS-SCHEMA-001`.
- Contract: preparation `instructionEvidence` must publish positive canonical decimal strings for `amountInRaw`, `quotedOutputRaw`, and `minimumOutputRaw`; venue-specific fields remain intentionally open until explicit unions are complete.
- Compatibility/migration/configuration: all current constructors already emit these fields and require positive amounts; no response, configuration, or persistence migration is required. Generated validators should refresh.
- Validation: focused schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: credential exclusion and exact venue evidence closure still require protocol-specific instructionEvidence and quote unions.
- NEXT_WEB_ACTION: require all three positive raw instruction amounts before displaying signer limits, and continue treating venue-specific evidence as unverified until its protocol union is published.
# UPSTREAM-PREPARATION-OUTPUT-EFFECT-BINDING-001

- BA/PO decision: fresh 20+ reconciliation selected the universal output-effect invariant because every supported preparation constructs exactly two account expectations and the second expectation is the quoted output account; leaving signer-facing amounts detached from simulation bounds permits contradictory generated-client evidence.
- Selected ID: `UPSTREAM-PREPARATION-OUTPUT-EFFECT-BINDING-001`.
- Contract: `preparation_success_v1` now requires `instructionEvidence.minimumOutputRaw` to equal the output account expectation `minDeltaRaw`, and `quotedOutputRaw` to equal its `maxDeltaRaw`.
- Compatibility/migration/configuration: current constructors already emit these identities; no response, persistence, or configuration migration is required. Generated validators should refresh.
- Validation: focused schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: input debit requires a signed transform rather than equality, and exact quote/instructionEvidence closure still requires protocol unions.
- NEXT_WEB_ACTION: reject prepared swaps when signer-facing minimum or quoted output differs from the bound output-account simulation delta range.
# UPSTREAM-PREPARATION-INPUT-DEBIT-BINDING-001

- BA/PO decision: fresh 20+ reconciliation selected the remaining universal amount invariant: every current venue binds the positive input amount to the first account expectation's exact minimum debit, while partial-fill venues intentionally use a looser maximum debit.
- Selected ID: `UPSTREAM-PREPARATION-INPUT-DEBIT-BINDING-001`.
- Contract: the response-schema dialect now declares `decimal_negation`; `preparation_success_v1` uses it to require `instructionEvidence.amountInRaw` and `simulationPolicy.accountExpectations.0.minDeltaRaw` to be canonical decimal additive inverses.
- Compatibility/migration/configuration: response bodies and configuration are unchanged. Contract validators must add fail-closed support for `decimal_negation` before accepting the refreshed snapshot.
- Validation: focused dialect/schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: exact quote and venue-specific instructionEvidence closure still require explicit protocol unions.
- NEXT_WEB_ACTION: implement canonical-decimal negation validation and reject a preparation when its signer-facing input amount does not match the bound minimum debit.
# UPSTREAM-PREPARATION-VARIANT-DISCOVERY-001

- BA/PO decision: fresh 20+ reconciliation selected preparation-variant discovery because clients currently see one shared success schema but cannot enumerate the exact live type/protocol identities needed to route generated validators and venue-specific safety handling.
- Selected ID: `UPSTREAM-PREPARATION-VARIANT-DISCOVERY-001`.
- Contract: `/api/v1/query-contracts` now publishes eleven unique, sorted preparation variants with exact `type`, `protocol`, and `routeFamily` (`pool` or `token`) identities covering every current constructor.
- Compatibility/migration/configuration: additive discovery metadata only; response bodies, persistence, and configuration are unchanged. Consumers may adopt the catalog before protocol-specific schemas are available.
- Validation: focused discovery/schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: each catalog identity still needs exact quote and instructionEvidence schemas before the shared success schema can use a closed union.
- NEXT_WEB_ACTION: dispatch preparation validation by the published type/protocol/route-family tuple and reject identities absent from the catalog.
# UPSTREAM-PREPARATION-IDENTITY-BINDING-001

- BA/PO decision: fresh 20+ reconciliation selected preparation identity binding because the published catalog was additive but the shared success schema still admitted unknown types and mismatched type/protocol pairs, weakening generated trading-safety validation.
- Selected ID: `UPSTREAM-PREPARATION-IDENTITY-BINDING-001`.
- Contract: `preparation_success_v1` now declares a fail-closed `catalog_membership` relationship binding `preparation.type` and `preparation.protocol` to one exact tuple in `preparationVariants`; the response-schema dialect explicitly publishes the new relationship kind.
- Compatibility/migration/configuration: all eleven current constructors already emit cataloged tuples, so runtime bodies, persistence, and configuration are unchanged. Generated validators must implement `catalog_membership` before accepting the refreshed contract.
- Validation: focused identity/dialect regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: exact quote and venue-specific instructionEvidence shapes still require closed per-variant schemas.
- NEXT_WEB_ACTION: enforce catalog_membership by resolving the declared catalog and rejecting unknown or mismatched preparation type/protocol tuples.
# UPSTREAM-RAYDIUM-CPMM-INSTRUCTION-EVIDENCE-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation and current HIGH QC evidence selected the first protocol-specific closure slice: Raydium CPMM has a compact, deterministic instruction-evidence object and supports Token-2022 transfer-fee evidence needed by trading-safety consumers.
- Selected ID: `UPSTREAM-RAYDIUM-CPMM-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- Contract: the CPMM catalog row references closed `raydium_cpmm_instruction_evidence_v1`, requiring its exact pool, ordered evidence slots, epoch, bounded fee mode, canonical fee/amount strings, and direction. The other ten catalog rows explicitly publish `null` until closed schemas exist.
- Compatibility/migration/configuration: the live CPMM constructor already emits the exact shape; response bodies, persistence, and configuration are unchanged. Discovery clients may enforce this schema immediately and must retain fail-closed handling for null-schema variants.
- Validation: real-shape positive, credential-field rejection, invalid fee-mode rejection, focused discovery/schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: CPMM quote closure and the other ten instruction-evidence variants remain open.
- NEXT_WEB_ACTION: validate Raydium CPMM instructionEvidence against its catalog-referenced closed schema and reject every unknown field or unsupported transfer-fee mode.
# UPSTREAM-RAYDIUM-CLMM-INSTRUCTION-EVIDENCE-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected Raydium CLMM as the next protocol-specific closure because signer safety depends on bounded unique tick-array traversal and an exact square-root price limit in addition to the CPMM-style amount and transfer-fee evidence.
- Selected ID: `UPSTREAM-RAYDIUM-CLMM-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- Contract: the CLMM catalog row references closed `raydium_clmm_instruction_evidence_v1`, requiring the exact pool, finalized component slots, epoch, fee evidence, amounts, signed limit tick, positive Q64 price limit, direction, and one-to-64 unique nonempty tick-array addresses.
- Compatibility/migration/configuration: the live CLMM constructor already emits this exact shape; runtime bodies, persistence, and configuration are unchanged. Catalog coverage increases from one to two of eleven variants.
- Validation: exact-key and tick-array rules, credential-field rejection, focused discovery/schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: CLMM quote closure and nine instruction-evidence variants remain open.
- NEXT_WEB_ACTION: validate Raydium CLMM instructionEvidence against its catalog-referenced schema and reject unknown fields, missing or duplicate tick arrays, and invalid price-limit evidence.
# UPSTREAM-RAYDIUM-AMM-V4-INSTRUCTION-EVIDENCE-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation and refreshed QC selected Raydium AMM v4 instruction evidence because its reserve provenance is safety-critical and the exact constructor shape is dependency-ready for offline closure.
- Selected ID: `UPSTREAM-RAYDIUM-AMM-V4-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- Contract: the AMM v4 catalog row references closed `raydium_amm_v4_instruction_evidence_v1`, requiring exact pool/component slots, positive signer amounts, direction, and the sole authoritative `vault_plus_open_orders_total_minus_pending_pnl` reserve-evidence mode.
- Compatibility/migration/configuration: the current AMM v4 constructor already emits this exact shape; runtime bodies, persistence, and configuration are unchanged. Catalog instruction-evidence coverage increases from two to three of eleven variants.
- Validation: exact-key and reserve-mode assertions, credential-field rejection, focused discovery/schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: AMM v4 quote closure and eight instruction-evidence variants remain open.
- NEXT_WEB_ACTION: validate Raydium AMM v4 instructionEvidence against its catalog schema and reject unknown fields or reserve provenance other than vault-plus-open-orders-minus-pending-PnL.
# UPSTREAM-ORCA-WHIRLPOOL-INSTRUCTION-EVIDENCE-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected Orca Whirlpool instruction evidence because signer safety depends on its exact three-array traversal window, derived oracle identity, and Q64 price limit, all available from deterministic offline constructor evidence.
- Selected ID: `UPSTREAM-ORCA-WHIRLPOOL-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- Contract: the Orca catalog row references closed `orca_whirlpool_instruction_evidence_v1`, requiring exact pool/finalized slots, epoch, positive amounts, signed limit tick, positive Q64 price limit, direction, exactly three unique nonempty tick-array addresses, and a nonempty derived oracle address.
- Compatibility/migration/configuration: the current Orca constructor already emits this exact shape; runtime bodies, persistence, and configuration are unchanged. Catalog instruction-evidence coverage increases from three to four of eleven variants.
- Validation: exact keys, three-array constraints, credential-field rejection, focused discovery/schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: Orca quote closure and seven instruction-evidence variants remain open.
- NEXT_WEB_ACTION: validate Orca Whirlpool instructionEvidence against its catalog schema and reject unknown fields, any tick path other than three unique arrays, or missing oracle evidence.
# UPSTREAM-PREPARATION-SLOT-ORDER-BINDING-001

- BA/PO decision: fresh 20+ reconciliation selected the new HIGH QC slot-order failures ahead of another protocol schema because generated validators could accept impossible AMM v4 or Orca finalized provenance that both runtime constructors reject.
- Selected ID: `UPSTREAM-PREPARATION-SLOT-ORDER-BINDING-001`.
- Contract: AMM v4 now requires `stateSlot <= openOrdersSlot <= marketSlot <= balanceSlot`; Orca requires `stateSlot <= tickArraySlot <= balanceSlot <= mintEvidenceSlot`, using the existing fail-closed `minimumProperty` dialect keyword.
- Compatibility/migration/configuration: current constructors already enforce and emit these orders; runtime bodies, persistence, and configuration are unchanged. Generated validators must refresh the discovery digest.
- Validation: equality-boundary positives, inversion negatives, focused schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: quote schemas and seven instruction-evidence variants remain open.
- NEXT_WEB_ACTION: enforce the published slot-order minimumProperty constraints before accepting AMM v4 or Orca preparation evidence.
# UPSTREAM-RAYDIUM-SLOT-ORDER-BINDING-002

- BA/PO decision: fresh 20+ reconciliation selected the remaining dependency-ready Raydium provenance parity gap because CPMM and CLMM constructors reject stale component evidence that their published closed schemas could still admit.
- Selected ID: `UPSTREAM-RAYDIUM-SLOT-ORDER-BINDING-002`.
- Contract: CPMM now requires `stateSlot <= configSlot <= balanceSlot <= mintEvidenceSlot`; CLMM requires state no newer than balance, tick-array, or AMM-config evidence and `balanceSlot <= mintEvidenceSlot`.
- Compatibility/migration/configuration: current constructors already enforce and emit these relations; response bodies, persistence, and configuration are unchanged. Generated validators must refresh the discovery digest.
- Validation: equality-boundary positives, every direct inversion negative, focused schema regression, full suite, syntax, replay/load, operational health, and diff review.
- Remaining boundary: all quote schemas and seven instruction-evidence variants remain open.
- NEXT_WEB_ACTION: enforce the published CPMM and CLMM minimumProperty slot constraints before accepting preparation evidence.
# UPSTREAM-RAYDIUM-CPMM-QUOTE-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected the first exact quote schema because Raydium CPMM quote provenance and signer-critical bounds are compact, already emitted deterministically, and directly consumed by pool preparation.
- Selected ID: `UPSTREAM-RAYDIUM-CPMM-QUOTE-SCHEMA-001`.
- Contract: the CPMM preparation catalog now references closed `raydium_cpmm_quote_v1`, covering exact identity/status/safety flags, mints, raw amounts and fees, nullable legacy mint evidence, finalized slot ordering, observation time, and the exact three missing execution gates.
- Compatibility/migration/configuration: additive discovery metadata only; current quote bodies, persistence, and configuration are unchanged. Generated validators should refresh and keep null-schema variants fail closed.
- Validation: exact keys, credential and wrong-protocol rejection, both slot inversions, exact missing gates, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: ten quote schemas and seven instruction-evidence schemas remain open.
- NEXT_WEB_ACTION: validate Raydium CPMM quotes against the catalog-referenced closed schema before presenting amounts or preparing a swap.
# UPSTREAM-RAYDIUM-CLMM-QUOTE-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected Raydium CLMM quote closure because its bounded tick traversal, price limit, static and transfer fees, and finalized component slots directly control preparation and signer safety.
- Selected ID: `UPSTREAM-RAYDIUM-CLMM-QUOTE-SCHEMA-001`.
- Contract: the CLMM catalog row references closed `raydium_clmm_quote_v1`, requiring exact quoted/fully-consumed/finalized identities, positive signer amounts and price/liquidity evidence, bounded unique crossed ticks, static fee mode, transfer-fee mode, and constructor-equivalent slot ordering.
- Compatibility/migration/configuration: additive discovery metadata only; current quote bodies, persistence, and configuration are unchanged. Generated validators should refresh and keep null-schema variants fail closed.
- Validation: exact keys, credential/wrong-protocol/unsafe-status rejection, all four slot inversions, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: nine quote schemas and seven instruction-evidence schemas remain open.
- NEXT_WEB_ACTION: validate Raydium CLMM quotes against the catalog schema before presenting tick traversal, price limits, or preparing a swap.
# UPSTREAM-QUOTE-SEMANTIC-PARITY-001

- BA/PO decision: fresh 20+ reconciliation selected new HIGH QC evidence ahead of another venue: the referenced CPMM and CLMM quote schemas admitted provenance, fee, amount-conservation, output-netting, and tick-cardinality tuples their constructors cannot emit.
- Selected ID: `UPSTREAM-QUOTE-SEMANTIC-PARITY-001`.
- Contract: the fail-closed dialect adds `conditional_type`, `array_length`, and canonical `decimal_sum`; CPMM binds fee mode to fees and nullable/finalized mint evidence, while CLMM binds tick count, exact-input conservation, gross/net output, and no-fee mode.
- Compatibility/migration/configuration: runtime quote bodies, persistence, and configuration are unchanged. Generated validators must implement the three new relationship kinds before accepting the refreshed digest.
- Validation: corrected real-constructor arithmetic positive, relationship descriptors, isolated contradiction negatives, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: nine quote schemas and seven instruction-evidence schemas remain open.
- NEXT_WEB_ACTION: implement conditional_type, array_length, and canonical decimal_sum fail closed before trusting CPMM or CLMM quote evidence.
# UPSTREAM-CPMM-OUTPUT-CONSERVATION-001

- BA/PO decision: fresh 20+ reconciliation retained the HIGH quote-parity repair ahead of a new venue because refreshed acceptance evidence identified one remaining CPMM invariant: gross output must equal net output plus the output transfer fee.
- Selected ID: `UPSTREAM-CPMM-OUTPUT-CONSERVATION-001`.
- Contract: `raydium_cpmm_quote_v1` now applies canonical `decimal_sum` to bind `grossOutputRaw` to `amountOutRaw + outputTransferFeeRaw`, alongside its fee-mode and finalized-evidence relationships.
- Compatibility/migration/configuration: current legacy and Token-2022 quote constructors already emit this identity; runtime bodies, persistence, and configuration are unchanged. Generated validators must refresh.
- Validation: legacy and fee-bearing positives, isolated gross/net mismatch negative, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: nine quote schemas and seven instruction-evidence schemas remain open.
- NEXT_WEB_ACTION: enforce CPMM gross-output conservation together with fee-mode provenance before displaying or preparing the quote.
# UPSTREAM-ORCA-WHIRLPOOL-QUOTE-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation and green CPMM/CLMM QC selected Orca Whirlpool as the next exact quote closure because finalized tick traversal, price limits, and amount conservation directly govern preparation and signer safety.
- Selected ID: `UPSTREAM-ORCA-WHIRLPOOL-QUOTE-SCHEMA-001`.
- Contract: the Orca catalog row references closed `orca_whirlpool_quote_v1`, requiring exact safe/finalized identity, positive raw amounts and price/liquidity evidence, bounded unique tick traversal, static fee mode, three-stage finalized slot ordering, tick cardinality, and exact-input conservation.
- Compatibility/migration/configuration: additive discovery metadata only; current quote bodies, persistence, and configuration are unchanged. Generated validators should refresh and keep null-schema variants fail closed.
- Validation: exact keys, credential/wrong-protocol/unsafe-status rejection, semantic mismatches, all slot inversions, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: eight quote schemas and seven instruction-evidence schemas remain open.
- NEXT_WEB_ACTION: validate Orca quotes against the catalog schema before presenting tick traversal, price limits, or preparing a swap.
# UPSTREAM-RAYDIUM-AMM-V4-QUOTE-SCHEMA-001

- BA/PO decision: fresh 20+ reconciliation selected AMM v4 quote closure because reserve reconstruction and OpenBook-backed finalized provenance directly control price presentation and preparation safety.
- Selected ID: `UPSTREAM-RAYDIUM-AMM-V4-QUOTE-SCHEMA-001`.
- Contract: the AMM v4 catalog row references closed `raydium_amm_v4_quote_v1`, requiring exact safe identity, positive amount/reserve evidence, authoritative vault-plus-open-orders-minus-pending-PnL provenance, ordered component slots, bounded swap fee below input, and exact missing gates.
- Compatibility/migration/configuration: additive discovery metadata only; current quote bodies, persistence, and configuration are unchanged. Generated validators must add `decimal_less_than` and refresh.
- Validation: exact keys, credential/wrong-protocol/reserve-mode rejection, fee-bound and slot inversions, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: seven quote schemas and seven instruction-evidence schemas remain open.
- NEXT_WEB_ACTION: validate AMM v4 quotes against the catalog schema before presenting reconstructed reserves or preparing a swap.
# UPSTREAM-QUOTE-CONSTRUCTOR-PARITY-002

- BA/PO decision: the fresh 22-opportunity reconciliation selected two deterministic HIGH quote defects ahead of another venue because generated clients could admit Orca price-limit/fee tuples and AMM v4 reserve outputs that their constructors reject.
- Selected IDs: `UPSTREAM-QA-ORCA-WHIRLPOOL-QUOTE-SCHEMA-001`, `UPSTREAM-QA-RAYDIUM-AMM-V4-QUOTE-SCHEMA-001`, and delivery increment `UPSTREAM-QUOTE-CONSTRUCTOR-PARITY-002`.
- Contract: the fail-closed dialect adds `orca_sqrt_price_at_tick` and `constant_product_exact_input`; Orca binds its bounded tick to the exact Q64.64 price and caps millionth fees below the denominator, while AMM v4 binds output below reserve and to its integer constant-product equation.
- Compatibility/migration/configuration: runtime quote bytes, persistence, providers, RPC/WebSocket, database, and configuration are unchanged. Generated validators must implement both relationship kinds and refresh the discovery digest before accepting these quotes.
- Validation: real-constructor positives, three isolated Orca contradictions, two isolated AMM output contradictions, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: seven quote schemas and seven instruction-evidence schemas remain null; operational qualification remains fail closed pending operator evidence.
- NEXT_WEB_ACTION: implement both new fail-closed relationship kinds and reject any Orca or AMM v4 quote that violates the published constructor equations.
# UPSTREAM-METEORA-DLMM-INSTRUCTION-EVIDENCE-SCHEMA-001

- BA/PO decision: fresh 22-opportunity reconciliation selected Meteora DLMM instruction evidence because finalized bin-array/bitmap provenance, Token-2022 transfer-hook account summaries, and swap/swap2 remaining-account slices are signer-critical and fully available from deterministic offline constructors.
- Selected ID: `UPSTREAM-METEORA-DLMM-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- Contract: the Meteora catalog row references closed `meteora_dlmm_instruction_evidence_v1`, covering exact swap version, ordered component and optional bitmap/hook slots, raw fee/amount bounds, bounded unique bin arrays, closed finalized hook summaries, bounded transfer-hook slices, optional bitmap/host accounts, and event authority.
- Compatibility/migration/configuration: additive discovery metadata only; current runtime bodies, persistence, providers, RPC/WebSocket, database, and configuration are unchanged. Instruction-evidence coverage increases from four to five of eleven variants; generated clients must refresh the digest.
- Validation: exact keys, nested closure, credential/wrong-version rejection, slot inversions, slice vocabulary, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: seven quote schemas and six instruction-evidence schemas remain null; operational qualification remains fail closed pending operator evidence.
- NEXT_WEB_ACTION: validate Meteora instructionEvidence against its catalog schema and reject unknown nested fields, unsupported versions or slices, and any finalized slot inversion.
# UPSTREAM-METEORA-DLMM-EVIDENCE-PARITY-002

- BA/PO decision: fresh QC exposed four deterministic HIGH constructor contradictions in the newly referenced Meteora schema, so the 22-opportunity reconciliation selected semantic parity ahead of Phoenix expansion.
- Selected IDs: `UPSTREAM-METEORA-DLMM-INSTRUCTION-EVIDENCE-SCHEMA-001` and delivery increment `UPSTREAM-METEORA-DLMM-EVIDENCE-PARITY-002`.
- Contract: the fail-closed dialect adds nullable-pair, bounded array-slot aggregation, conditional array emptiness, and unique-by relationships. Meteora now pairs bitmap address/slot, binds every hook row to finalized mint evidence and its maximum slot, forces legacy swap hook evidence empty, and permits at most one X and one Y slice.
- Compatibility/migration/configuration: current constructor evidence already satisfies these invariants; runtime bytes, persistence, providers, RPC/WebSocket, database, and configuration are unchanged. Generated validators must implement the four relationship kinds and refresh the digest.
- Validation: real swap2 control, four isolated constructor contradictions, existing closure and slot inversions, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: seven quote schemas and six instruction-evidence schemas remain null; operational qualification remains fail closed pending operator evidence.
- NEXT_WEB_ACTION: enforce Meteora bitmap pairing, hook-slot aggregation, legacy-swap emptiness, and slice-axis uniqueness before accepting preparation evidence.
# UPSTREAM-PHOENIX-IOC-INSTRUCTION-EVIDENCE-SCHEMA-001

- BA/PO decision: after the Meteora HIGH defect was repaired, the fresh 22-opportunity reconciliation selected Phoenix IOC instruction evidence because side-specific lot encoding, finalized market slots, and bounded expiry directly govern unsigned order safety and are deterministic offline.
- Selected ID: `UPSTREAM-PHOENIX-IOC-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- Contract: the Phoenix catalog row references closed `phoenix_ioc_instruction_evidence_v1`, requiring exact market identity, `stateSlot <= balanceSlot <= quoteCurrentSlot < lastValidSlot`, bid/ask vocabulary, positive signer amounts and price/base lots, bounded decimal lot fields, and constructor-equivalent side-specific zero fields.
- Compatibility/migration/configuration: additive discovery metadata only; runtime bodies, persistence, providers, RPC/WebSocket, database, and configuration are unchanged. Instruction-evidence coverage increases from five to six of eleven variants; generated clients must refresh the digest.
- Validation: exact keys, credential/wrong-side rejection, slot/expiry inversions, bid and ask conditional-zero contradictions, focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: seven quote schemas and five instruction-evidence schemas remain null; operational qualification remains fail closed pending operator evidence.
- NEXT_WEB_ACTION: validate Phoenix instructionEvidence against its catalog schema and reject unknown fields, invalid slot/expiry ordering, or side-inconsistent IOC lot values.

## UPSTREAM OpenBook V2 instruction-evidence contract parity

- Selected ID: `UPSTREAM-OPENBOOK-V2-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- BA/PO decision: OpenBook preparation already emits deterministic IOC constructor evidence, while its catalog advertised a null instruction-evidence schema. Publishing the exact closed shape is the highest-value dependency-ready increment because commercial and safety consumers can now reject unknown fields and inconsistent consumed-input evidence before signing.
- Contract: `openbook_place_take_order_simulation.instructionEvidenceSchema` is now `openbook_v2_instruction_evidence_v1`; the schema closes all 15 constructor fields, bounds side/order type/match limit, and requires consumed input not to exceed requested input.
- Compatibility: additive catalog metadata only; REST payloads, RPC/WebSocket behavior, persistence, configuration, migrations, and execution fail-closed behavior are unchanged.
- Validation: focused catalog regression, full offline suite, syntax, replay/load, and operational readiness are recorded in the heartbeat report.
- NEXT_WEB_ACTION: validate OpenBook V2 instructionEvidence against its catalog schema and reject unknown fields, unsupported side/order type/match limit, or consumed input above requested input.

## UPSTREAM Phoenix and OpenBook constructor-bound parity

- Selected IDs: `UPSTREAM-PHOENIX-IOC-INSTRUCTION-EVIDENCE-SCHEMA-001`, `UPSTREAM-OPENBOOK-V2-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- BA/PO decision: fresh 22-opportunity reconciliation selected the two dependency-ready HIGH QC failures because generated signing clients could admit constructor-impossible expiry, slot, and integer evidence, while OpenBook rejected its real preparation body.
- Contracts: Phoenix now publishes its 150-slot expiry ceiling and u64 field bounds. OpenBook now includes the real `minimumOutputRaw`, binds minimum output to quoted output, orders current slot after balance evidence, caps amount fields at u64, and caps encoded lot fields at signed i64.
- Compatibility/migration/configuration: discovery-only correction; runtime bodies, persistence, provider/RPC/WebSocket behavior, migrations, and configuration are unchanged. Generated clients must refresh for the schema digest.
- NEXT_WEB_ACTION: regenerate Phoenix and OpenBook preparation validators with maximumOffset and maximumRaw support, then reject evidence outside the published constructor bounds before signing.

## UPSTREAM PumpSwap instruction-evidence contract closure

- Selected IDs: `UPSTREAM-PUMP-SWAP-SELL-INSTRUCTION-EVIDENCE-SCHEMA-001`, `UPSTREAM-PUMP-SWAP-BUY-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- BA/PO decision: fresh 22-opportunity reconciliation selected the two dependency-ready PumpSwap variants because their null catalog schemas prevented generated trading-safety and commercial clients from validating finalized state/config/mint provenance, u64 execution bounds, fee-recipient identity, and buy-only volume tracking.
- Contracts: sell and buy-exact-quote-in now dispatch separate closed schemas; both bind four-stage slot ordering, positive u64 amounts, minimum output ordering, and fee-recipient fields, while buy additionally requires `trackVolume:true`.
- Compatibility/migration/configuration: additive discovery metadata only; runtime bodies, persistence, RPC/WebSocket behavior, migrations, and configuration remain unchanged.
- NEXT_WEB_ACTION: regenerate PumpSwap preparation validators and require the exact direction-specific instructionEvidence schema before simulation or signing.

## UPSTREAM PumpSwap recipient-domain parity

- Selected IDs: `UPSTREAM-PUMP-SWAP-SELL-INSTRUCTION-EVIDENCE-SCHEMA-001`, `UPSTREAM-PUMP-SWAP-BUY-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- BA/PO decision: fresh 22-opportunity reconciliation selected the deterministic HIGH recipient-domain failures because both generated schemas admitted system-program or malformed identities that the real PumpSwap constructors reject before account derivation.
- Contracts: both PumpSwap instruction-evidence schemas now require canonical Solana public-key formatting, canonical base58 alphabet/length, and explicitly exclude the system program for protocol and buyback fee recipients.
- Compatibility/migration/configuration: discovery-only fail-closed hardening; valid runtime bodies, persistence, RPC/WebSocket behavior, migrations, and configuration remain unchanged.
- NEXT_WEB_ACTION: regenerate PumpSwap validators with solana-public-key and notValues support, rejecting malformed or system fee recipients before simulation or signing.

## UPSTREAM PumpSwap quote contract closure

- Selected IDs: `UPSTREAM-PUMP-SWAP-SELL-QUOTE-SCHEMA-001`, `UPSTREAM-PUMP-SWAP-BUY-QUOTE-SCHEMA-001`.
- BA/PO decision: fresh 22-opportunity reconciliation selected direction-specific PumpSwap quote closure because discovery, token/pool detail, AI safety, and commercial clients could not validate finalized reserve/fee provenance before preparation.
- Contracts: sell and buy catalog rows now dispatch separate closed schemas requiring exact direction and safety identity, positive bounded amounts/reserves, bounded fee components, four-stage finalized slot ordering, mint epoch, observation time, and exact missing execution gates.
- Compatibility/migration/configuration: additive discovery metadata only; runtime quote bodies, persistence, RPC/WebSocket behavior, migrations, and configuration are unchanged.
- NEXT_WEB_ACTION: regenerate PumpSwap quote validators and require the direction-specific closed schema before displaying prices or preparing swaps.

## UPSTREAM Pump bonding-curve instruction-evidence closure

- Selected IDs: `UPSTREAM-PUMP-BONDING-SELL-INSTRUCTION-EVIDENCE-SCHEMA-001`, `UPSTREAM-PUMP-BONDING-BUY-INSTRUCTION-EVIDENCE-SCHEMA-001`.
- BA/PO decision: fresh 22-opportunity reconciliation selected the two remaining token-route instruction variants because launch-token safety consumers lacked closed finalized curve, mint, config, token-program, amount, and fee-recipient evidence.
- Contracts: both sell-v2 and buy-exact-quote-in-v2 catalog rows now reference one exact closed constructor schema with ordered finalized slots, supported token-program modes, positive u64 bounds, minimum-output ordering, and non-system Solana fee recipients.
- Compatibility/migration/configuration: additive discovery metadata only; runtime bodies, persistence, RPC/WebSocket behavior, migrations, and configuration remain unchanged.
- NEXT_WEB_ACTION: regenerate Pump bonding-curve preparation validators and require the closed instructionEvidence schema before simulation or signing.
# UPSTREAM-INSTRUCTION-EVIDENCE-PARITY-003

- BA/PO decision: fresh QC found two remaining HIGH constructor-parity defects in referenced Meteora and Phoenix schemas, so the 22-opportunity reconciliation selected their coherent semantic repair ahead of OpenBook expansion.
- Selected IDs: `UPSTREAM-METEORA-DLMM-INSTRUCTION-EVIDENCE-SCHEMA-001`, `UPSTREAM-PHOENIX-IOC-INSTRUCTION-EVIDENCE-SCHEMA-001`, and delivery increment `UPSTREAM-INSTRUCTION-EVIDENCE-PARITY-003`.
- Contract: legacy Meteora now admits optional finalized route summaries while requiring empty slices and zero SPL fees. Phoenix adds conditional positive bid/ask lot requirements and `minimumOutputRaw <= quotedOutputRaw` while retaining constructor-required opposite-side zeros.
- Compatibility/migration/configuration: both constructors already emit these states; runtime bytes, persistence, providers, RPC/WebSocket, database, and configuration are unchanged. Generated validators must refresh and implement conditional-pattern plus decimal-less-than-or-equal relationships.
- Validation: real legacy-route, Token-2022, Phoenix bid/ask controls; two Meteora and three Phoenix isolated contradictions; focused/full regression, syntax, replay/load, operational health, and diff review.
- Remaining boundary: seven quote schemas and five instruction-evidence schemas remain null; operational qualification remains fail closed pending operator evidence.
- NEXT_WEB_ACTION: enforce the repaired Meteora legacy-route/fee rules and Phoenix side-positive/output-bound rules before accepting preparation evidence.

## UPSTREAM Pump bonding-curve quote contract closure

- Selected IDs: `UPSTREAM-PUMP-BONDING-SELL-QUOTE-SCHEMA-001`, `UPSTREAM-PUMP-BONDING-BUY-QUOTE-SCHEMA-001`.
- BA/PO decision: fresh 22-opportunity reconciliation selected both launch-token quote variants because their null catalog schemas prevented discovery, detail, AI-safety, and commercial clients from validating finalized curve, fee-tier, reserve, token-program, and execution-gate evidence.
- Contracts: sell-v2 and buy-exact-quote-in-v2 now reference separate closed schemas matching their exact amount, fee, formula, reserve, finalized slot, mint epoch, token-program, hash, freshness, and missing-gate shapes.
- Compatibility/migration/configuration: additive discovery metadata only; runtime quote bodies, persistence, RPC/WebSocket behavior, migrations, and configuration are unchanged. Generated validators must refresh the schema digest.
- NEXT_WEB_ACTION: regenerate Pump bonding-curve quote validators and require the direction-specific closed schema before displaying launch-token prices or preparing a swap.

## UPSTREAM Pump bonding-curve quote semantic parity

- Selected IDs: `UPSTREAM-PUMP-BONDING-SELL-QUOTE-SCHEMA-001`, `UPSTREAM-PUMP-BONDING-BUY-QUOTE-SCHEMA-001`, and delivery increment `UPSTREAM-PUMP-BONDING-QUOTE-PARITY-002`.
- BA/PO decision: fresh QC reproduced ten HIGH constructor-impossible economic mutations against the newly published schemas, so semantic repair outranked expansion to another venue.
- Contracts: sell now binds fee sum, net/gross conservation, aggregate basis-point ceiling, real-quote reserve ceiling, and its exact constant-product output. Buy binds fee sum, input-budget ceiling, aggregate basis-point ceiling, real-token reserve ceiling, and its offset-aware exact constant-product output.
- Compatibility/migration/configuration: valid runtime bodies, persistence, providers, RPC/WebSocket behavior, migrations, and configuration are unchanged. Generated validators must implement the three added bounded relationship kinds and refresh the schema digest.
- NEXT_WEB_ACTION: enforce Pump bonding fee, conservation, reserve, and exact constant-product relationships before displaying a quote or admitting preparation.

## UPSTREAM Phoenix quote contract closure

- Selected ID: `UPSTREAM-PHOENIX-QUOTE-SCHEMA-001`.
- BA/PO decision: fresh 22-opportunity reconciliation selected Phoenix because its finalized full-depth quote and bounded level evidence are dependency-ready, while a null catalog schema prevented discovery, AI-safety, and commercial clients from validating them.
- Contract: `phoenix_immediate_or_cancel_simulation` now references a closed quote schema with exact safety identity, u64 amounts, ordered finalized/current slots, bounded closed levels, input conservation, and level-to-aggregate input/output/fee sums.
- Compatibility/migration/configuration: additive discovery metadata only; runtime quote bodies, persistence, providers, RPC/WebSocket behavior, migrations, and configuration are unchanged. Generated validators must implement `array_decimal_sum` and refresh the schema digest.
- NEXT_WEB_ACTION: validate Phoenix quotes against the catalog schema and reject unknown levels or any aggregate that differs from its finalized depth rows.

## UPSTREAM Pump fee and Phoenix status semantic parity

- Selected IDs: `UPSTREAM-PUMP-BONDING-FEE-PARITY-003`, `UPSTREAM-PHOENIX-STATUS-PARITY-002`.
- BA/PO decision: fresh QC reproduced three HIGH constructor-impossible bodies in already referenced schemas, so semantic repair outranked OpenBook expansion.
- Contracts: every Pump fee component is now bound to its exact ceiling-rounded basis-point calculation; Phoenix now binds `quoted` to zero remaining input and `partial` to positive remaining input.
- Compatibility/migration/configuration: valid runtime bodies and configuration are unchanged. Generated validators must implement `decimal_ceiling_fee`, retain `conditional_pattern`, and refresh the schema digest.
- NEXT_WEB_ACTION: reject Pump fee-component/BPS contradictions and Phoenix status/remaining-input contradictions before displaying or preparing a route.

## UPSTREAM OpenBook V2 quote contract closure

- Selected ID: `UPSTREAM-OPENBOOK-V2-QUOTE-SCHEMA-001`.
- BA/PO decision: fresh 22-opportunity reconciliation selected OpenBook because its fixed and validated oracle-pegged depth quote is dependency-ready and was the highest-value remaining null commercial/trading-safety schema.
- Contract: the OpenBook preparation variant now references a closed quote schema with exact side/status/safety identity, u64 amounts and lot totals, ordered state/book/oracle/balance/current slots, bounded closed fixed/oracle-pegged levels, input conservation, lot aggregation, and status/remaining-input binding.
- Compatibility/migration/configuration: additive discovery metadata only; runtime bodies, persistence, provider/RPC/WebSocket behavior, migrations, and configuration remain unchanged. Generated validators must refresh the schema digest.
- NEXT_WEB_ACTION: validate OpenBook quotes against the catalog schema and reject unknown depth rows, slot inversions, lot-total mismatches, or inconsistent fill status before preparation.

## UPSTREAM Pump buy rounding parity

- Selected ID: `UPSTREAM-PUMP-BUY-ROUNDING-PARITY-004`.
- BA/PO decision: fresh QC reproduced a real HIGH schema rejection at the post-budget-correction boundary; repairing a valid producer/schema incompatibility outranked adding the final null schema.
- Contract: Pump buy now recomputes protocol and creator fees after correcting net quote input, so returned components remain exact ceiling-rounded functions of the published final net basis.
- Compatibility/migration/configuration: rare rounding-boundary fee atoms can decrease after correction; ordinary quotes, persistence, RPC/WebSocket behavior, migrations, and configuration are unchanged.
- NEXT_WEB_ACTION: require Pump buy component fees to validate against the published final net quote input before displaying or preparing the route.

## UPSTREAM OpenBook lot-economics parity

- Selected ID: `UPSTREAM-OPENBOOK-V2-QUOTE-PARITY-002`.
- BA/PO decision: fresh inspection retained 22 evidence-backed opportunities; the deterministic OpenBook output/fee acceptance gap was the highest-value dependency-ready trading-safety increment after Pump buy parity closed.
- Contract: OpenBook quotes now publish the finalized base/quote lot sizes and taker-fee millionths used by the constructor, with one fail-closed relationship binding bid/ask consumed input, output, and ceiling-rounded fee to aggregate lots.
- Compatibility/migration/configuration: additive quote fields and schema-dialect relationship change the contract digest/ETag; generated validators must refresh. Persistence, RPC/WebSocket, migrations, providers, and configuration are unchanged.
- NEXT_WEB_ACTION: validate OpenBook lot economics through `openbook_lot_economics` and reject output, consumed-input, fee, lot-size, or taker-rate contradictions before displaying or preparing the quote.
