# Terminal DEX upstream handoff

- UPSTREAM-ID: `UPSTREAM-PATH-PARAMETER-004`
- Problem/evidence: QC independently verified all 16 resource-path consumers but found committed regression coverage exercised only token-account and transaction routes and did not prove controlled rejections leave diagnostic telemetry unchanged.
- Consumer impact: every resource-path consumer now has regression evidence for the same deterministic malformed-identity contract. Runtime endpoints, events, successful response fields, and status codes are unchanged.
- Changed contracts: none. The test locks the existing HTTP 400 `{ error: "bad_request", detail: "path parameter must use canonical percent encoding" }` response across all 16 consumers and proves it is not an internal failure.
- In scope: a method-aware malformed-escape/encoded-delimiter matrix for 14 GET and 2 POST resource routes, empty/populated transaction state, a valid transaction control, diagnostic callback assertions, and the `http_internal_error` counter. Out of scope: query filters and Solana base58 identity policy.
- Compatibility: no runtime or consumer contract change. Migration/config: none.
- Acceptance criteria: all 16 consumers return deterministic HTTP 400 for both malformed escapes and encoded delimiters; empty/populated transaction checks remain; a valid transaction remains HTTP 200; diagnostic callback count and `http_internal_error` remain zero; syntax, focused/full regressions, and replay/load pass.
- 20/20 reconciliation: 21 distinct QC-reviewed domains were reconciled: 19 retained PASS, `UPSTREAM-QA-PATH-PARAMETER-003` is closed by this regression enhancement, and `UPSTREAM-QA-OPS-001` remains externally BLOCKED. Fix shortfall: 19 because only one evidence-backed dependency-ready change existed; no duplicate splitting, speculative changes, or fabricated findings were introduced.
- Validation: syntax and the focused 32-case path matrix passed; full suite passed 347/347; canonical 1,000-block replay passed every invariant at 3,076.36 blocks/second with 9,524,304 bytes heap growth under the 536,870,912-byte bound.
- Blockers: live operational qualification needs redacted, fresh canonical-mainnet evidence and cannot be manufactured by this repository run.
- NEXT_WEB_ACTION: no migration required; continue treating malformed-path HTTP 400 responses as terminal client-input errors rather than upstream availability failures.
