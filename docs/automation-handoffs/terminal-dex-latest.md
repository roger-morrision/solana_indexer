# Terminal DEX upstream handoff

- UPSTREAM-ID: `UPSTREAM-PATH-PARAMETER-003`
- Problem/evidence: QC found the transaction resource route decoded its captured signature inside `Array.find`. An empty canonical transaction collection never invoked validation and returned 404 for malformed input, while a populated collection returned 400 for the same path.
- Consumer impact: malformed transaction links now receive the same stable HTTP 400 contract regardless of indexed state. Valid resource paths and successful response fields are unchanged.
- Changed contracts: resource routes reject malformed percent encoding, decoded `/`, control characters, empty identities, and decoded identities longer than 256 characters with `{ error: "bad_request", detail: "path parameter must use canonical percent encoding" }`.
- In scope: validate the captured transaction signature exactly once before collection lookup and cover both empty and populated state. Out of scope: query filters and Solana base58 identity policy.
- Compatibility: additive validation of inputs that were malformed or ambiguous. Migration/config: none.
- Acceptance criteria: empty and populated transaction collections return deterministic HTTP 400 for malformed escapes and encoded delimiters; valid resource routes preserve behavior; syntax, focused/full regressions, and replay/load pass.
- 20/20 reconciliation: 2 distinct evidence-backed items were reconciled: `UPSTREAM-QA-PATH-PARAMETER-003` was fixed and `UPSTREAM-QA-OPS-001` remains externally blocked. Finding shortfall: 18 because QC's independent 21-domain review supplied no other failing dependency-ready item. Fix shortfall: 19; item 1 is blocked by absent current canonical-mainnet provider/exporter/warehouse/backup/recovery evidence, and items 2-19 were not created because padding, duplicate splitting, speculative fixes, and fabricated evidence are forbidden.
- Validation: syntax and focused empty/populated malformed-path regression passed; full suite passed 347/347; canonical 1,000-block replay passed all invariants at 3,305.97 blocks/second with 9,650,248 bytes heap growth under the 536,870,912-byte bound.
- Blockers: live operational qualification needs redacted, fresh canonical-mainnet evidence and cannot be manufactured by this repository run.
- NEXT_WEB_ACTION: treat the new malformed-path HTTP 400 as a terminal client-input error; do not retry it as upstream availability failure.
