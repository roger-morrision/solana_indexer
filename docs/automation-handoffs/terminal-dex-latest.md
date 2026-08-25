# Terminal DEX upstream handoff

- UPSTREAM-ID: `UPSTREAM-TOKEN-PROJECTION-002`
- Problem/evidence: REST `GET /api/v1/token-account/:address` and `GET /api/v1/holders/:mint` were coupled to the global aggregate/snapshot quality gate, so corruption in an unrelated pool snapshot made a valid mint-scoped token projection unavailable. Unlike the equivalent RPC methods, these REST routes also lacked their own mint-scoped canonical projection check.
- Consumer impact: token-account and holder pages remain available when unrelated pool evidence is unhealthy, while divergence in the requested mint's balance/snapshot projection fails closed with HTTP 503.
- Changed contracts: the two REST routes now return `{ schemaVersion: 1, available: false, reason }` with `indexed_token_account_evidence_unavailable` or `indexed_holder_evidence_unavailable` for relevant projection corruption. Successful response fields are unchanged.
- In scope: mint-scoped projection validation and isolation from unrelated aggregate evidence. Out of scope: snapshot acquisition, provider configuration, holder-exclusion governance, and RPC changes.
- Compatibility: successful payloads are unchanged; only previously over-broad 503 responses and unsafe relevant-corruption reads change. Consumers should treat the new reasons as retryable upstream evidence failures.
- Dependencies: existing canonical token-account projection verifier. Migration/config: none.
- Acceptance criteria: unrelated pool corruption does not block either route; corruption of the requested mint projection blocks both routes; unknown internal fields remain excluded; focused and full regressions pass.
- Validation: syntax and focused HTTP regression passed; full suite passed 346/346; canonical 1,000-block replay passed all invariants at 6,773.51 blocks/second with 9,648,008 bytes heap growth under the 536,870,912-byte bound.
- Blockers: live provider and production operational qualification remain externally blocked by absent redacted mainnet evidence; no live data was fabricated or queried.
- NEXT_WEB_ACTION: handle `indexed_token_account_evidence_unavailable` and `indexed_holder_evidence_unavailable` as explicit retryable upstream unavailability without rendering stale token balances or holder concentration.
