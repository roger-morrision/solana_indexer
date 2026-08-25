# Terminal DEX upstream handoff

- UPSTREAM-ID: `UPSTREAM-PATH-PARAMETER-003`
- Problem/evidence: all 16 resource-route path consumers called `decodeURIComponent` directly. Malformed percent escapes raised an unexpected exception and returned HTTP 500; encoded `/` delimiters could become ambiguous resource identities after routing.
- Consumer impact: malformed resource links now receive a stable HTTP 400 contract instead of an internal-error response. Valid resource paths and successful response fields are unchanged.
- Changed contracts: resource routes reject malformed percent encoding, decoded `/`, control characters, empty identities, and decoded identities longer than 256 characters with `{ error: "bad_request", detail: "path parameter must use canonical percent encoding" }`.
- In scope: one shared path-parameter boundary used by preparation, quote, evidence, token, wallet, price, volume, transaction, account, mint, holder, token-account, pool, candle, and risk routes. Out of scope: query filters and Solana base58 identity policy.
- Compatibility: additive validation of inputs that were malformed or ambiguous. Migration/config: none.
- Acceptance criteria: malformed escapes and encoded delimiters return deterministic HTTP 400; unexpected-error diagnostics are not incremented; valid resource routes preserve behavior; syntax, focused/full regressions, and replay/load pass.
- 20/20 reconciliation: 2 distinct evidence-backed items were reconciled: `UPSTREAM-QA-OPS-001` remains externally blocked, and `UPSTREAM-PATH-PARAMETER-003` was completed. Finding shortfall: 18 because no additional distinct issue had sufficient fresh evidence after the scoped route/roadmap audit. Fix shortfall: 19; item 1 is blocked by absent current canonical-mainnet provider/exporter/warehouse/backup/recovery evidence, and items 2-19 were not created because padding, duplicate splitting, speculative fixes, and fabricated evidence are forbidden.
- Validation: syntax and focused malformed-path regression passed; full suite passed 347/347; canonical 1,000-block replay passed all invariants at 6,052.17 blocks/second with 9,412,944 bytes heap growth under the 536,870,912-byte bound.
- Blockers: live operational qualification needs redacted, fresh canonical-mainnet evidence and cannot be manufactured by this repository run.
- NEXT_WEB_ACTION: treat the new malformed-path HTTP 400 as a terminal client-input error; do not retry it as upstream availability failure.
