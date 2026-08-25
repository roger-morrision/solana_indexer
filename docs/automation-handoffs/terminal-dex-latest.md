# Terminal DEX upstream handoff

- UPSTREAM-ID: `UPSTREAM-HEALTH-ENVELOPE-001`
- Changed contracts: `GET /api/health`, JSON-RPC `getIndexerHealth`, and `GET /internal/feed/health` now project an explicit stable allowlist for aggregate and nested quality evidence.
- Compatibility: additive behavior only; all established response fields and status semantics are preserved. Unknown store or diagnostic fields are no longer forwarded.
- Migration/config: none.
- Validation: focused health regressions passed; full suite passed 346/346; canonical 1,000-block replay passed at 6,593.42 blocks/second.
- Blockers: no WEB analyst handoff was available during this run; hosted provider variables were not configured, so live provider status could not be sampled.
- NEXT_WEB_ACTION: consume the existing health fields unchanged; optionally add a consumer assertion that unknown upstream diagnostics are ignored.
