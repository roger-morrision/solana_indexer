# UPSTREAM-QA Solana Indexer QC/QA

- Run: `2026-08-27T07:36:44+07:00`
- Scope: `C:\Tuan\devApps\solana_indexer`
- Revision: `21eee0db5368a4a7e74b1bfcf720473a4d75ef2c`
- Compared with QA baseline: `1c803b4a4b39a0f3f58fc2a5fb4065c62a884c7a` (3 DEV commits, 3 changed files)
- Compared with `origin/main`: 44 ahead, 0 behind before this evidence report
- Latest DEV commits: `eb34ead` (`UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-01..24`), `877b0d9` (`UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-01..24`), and `21eee0d` (`UPSTREAM-QUOTE-UNAVAILABLE-SCHEMA-001`)
- Overall result: all 49 reviewed DEV outcomes pass. Every one of the 29 decision-quality consumers advertises one retryable JSON 503 outcome; 24 compatible routes reference and emit `basic_unavailable_v1`; pool quote independently fits `quote_unavailable_v1` across structure, decision, unsupported-protocol, and engine failures; four heterogeneous controls remain deliberately untyped. Live qualification remains blocked by absent fresh canonical evidence.

## Reviewed DEV delta (49/20)

### `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001` (24/24 PASS)

| Item | Route | Status | Independent evidence |
|---|---|---|---|
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-01` | `/internal/trending` | `PASS` | Exactly one retryable JSON 503 is published; an injected decision failure returns the exact unavailable envelope. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-02` | `/internal/new-pairs` | `PASS` | Exactly one retryable JSON 503 is published; the independent real-route decision probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-03` | `/internal/candidates` | `PASS` | Exactly one retryable JSON 503 is published; the independent real-route decision probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-04` | `/api/trending` | `PASS` | Exactly one retryable JSON 503 is published; the independent real-route decision probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-05` | `/api/v1/tokens` | `PASS` | Exactly one retryable JSON 503 is published; an injected decision failure returns the exact unavailable envelope. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-06` | `/api/v1/pools` | `PASS` | Exactly one retryable JSON 503 is published; the independent real-route decision probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-07` | `/internal/evidence/{mint}` | `PASS` | Exactly one retryable JSON 503 is published; an injected decision failure on the materialized mint route returns the exact envelope. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-08` | `/internal/tokens/{mint}` | `PASS` | Exactly one retryable JSON 503 is published; the materialized token-detail probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-09` | `/internal/tokens/{mint}/market` | `PASS` | Exactly one retryable JSON 503 is published; the materialized market probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-10` | `/internal/tokens/{mint}/security` | `PASS` | Exactly one retryable JSON 503 is published; the materialized security probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-11` | `/internal/tokens/{mint}/holders` | `PASS` | Exactly one retryable JSON 503 is published; the materialized holders probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-12` | `/internal/tokens/{mint}/trades` | `PASS` | Exactly one retryable JSON 503 is published; the materialized trades probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-13` | `/internal/tokens/{mint}/ohlcv` | `PASS` | Exactly one retryable JSON 503 is published; the materialized OHLCV probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-14` | `/internal/tokens/{mint}/liquidity` | `PASS` | Exactly one retryable JSON 503 is published; the materialized liquidity probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-15` | `/internal/wallets/{wallet}` | `PASS` | Exactly one retryable JSON 503 is published; the materialized wallet-detail probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-16` | `/internal/wallets/{wallet}/performance` | `PASS` | Exactly one retryable JSON 503 is published; the materialized performance probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-17` | `/internal/wallets/{wallet}/profile` | `PASS` | Exactly one retryable JSON 503 is published; an injected decision failure returns the exact unavailable envelope. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-18` | `/internal/wallets/{wallet}/funding` | `PASS` | Exactly one retryable JSON 503 is published; the materialized funding probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-19` | `/internal/wallets/{wallet}/funding-cluster` | `PASS` | Exactly one retryable JSON 503 is published; the materialized cluster probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-20` | `/api/account/{address}` | `PASS` | Exactly one retryable JSON 503 is published; the materialized account probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-21` | `/api/mint/{mint}` | `PASS` | Exactly one retryable JSON 503 is published; the materialized mint probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-22` | `/api/v1/risk/{pool}` | `PASS` | Exactly one retryable JSON 503 is published; an injected decision failure returns the exact unavailable envelope. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-23` | `/api/v1/pool/{pool}` | `PASS` | Exactly one retryable JSON 503 is published; the materialized pool-detail probe returns 503. |
| `UPSTREAM-DECISION-UNAVAILABLE-DISCOVERY-001-24` | `/api/v1/candles/{pool}` | `PASS` | Exactly one retryable JSON 503 is published; the materialized candle probe returns 503. |

### `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001` (24/24 PASS)

| Item | Route | Status | Independent evidence |
|---|---|---|---|
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-01` | `/internal/trending` | `PASS` | References `basic_unavailable_v1`; a structural failure returns exactly three fields and redacts injected structure names. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-02` | `/internal/new-pairs` | `PASS` | References the closed schema; the distinct structural HTTP probe matches it exactly. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-03` | `/internal/candidates` | `PASS` | References the closed schema; the distinct structural HTTP probe matches it exactly. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-04` | `/api/trending` | `PASS` | References the closed schema; the distinct structural HTTP probe matches it exactly. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-05` | `/api/v1/tokens` | `PASS` | References the closed schema; the distinct structural HTTP probe matches it exactly. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-06` | `/api/v1/pools` | `PASS` | References the closed schema; the distinct structural HTTP probe matches it exactly. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-07` | `/internal/evidence/{mint}` | `PASS` | References the closed schema; the materialized structural probe matches it without internal fields. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-08` | `/internal/tokens/{mint}` | `PASS` | References the closed schema; the materialized token-detail structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-09` | `/internal/tokens/{mint}/market` | `PASS` | References the closed schema; the materialized market structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-10` | `/internal/tokens/{mint}/security` | `PASS` | References the closed schema; the materialized security structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-11` | `/internal/tokens/{mint}/holders` | `PASS` | References the closed schema; the materialized holders structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-12` | `/internal/tokens/{mint}/trades` | `PASS` | References the closed schema; the materialized trades structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-13` | `/internal/tokens/{mint}/ohlcv` | `PASS` | References the closed schema; the materialized OHLCV structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-14` | `/internal/tokens/{mint}/liquidity` | `PASS` | References the closed schema; the materialized liquidity structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-15` | `/internal/wallets/{wallet}` | `PASS` | References the closed schema; the materialized wallet-detail structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-16` | `/internal/wallets/{wallet}/performance` | `PASS` | References the closed schema; the materialized performance structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-17` | `/internal/wallets/{wallet}/profile` | `PASS` | References the closed schema; the materialized profile structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-18` | `/internal/wallets/{wallet}/funding` | `PASS` | References the closed schema; the materialized funding structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-19` | `/internal/wallets/{wallet}/funding-cluster` | `PASS` | References the closed schema; the materialized cluster structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-20` | `/api/account/{address}` | `PASS` | References the closed schema; the materialized account structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-21` | `/api/mint/{mint}` | `PASS` | References the closed schema; the materialized mint structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-22` | `/api/v1/risk/{pool}` | `PASS` | References the closed schema; the materialized risk structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-23` | `/api/v1/pool/{pool}` | `PASS` | References the closed schema; the materialized pool-detail structural probe matches it. |
| `UPSTREAM-DECISION-UNAVAILABLE-SCHEMA-001-24` | `/api/v1/candles/{pool}` | `PASS` | References the closed schema; the materialized candle structural probe matches it. |

### `UPSTREAM-QUOTE-UNAVAILABLE-SCHEMA-001` (PASS)

| Item | Route | Status | Independent evidence |
|---|---|---|---|
| `UPSTREAM-QUOTE-UNAVAILABLE-SCHEMA-001` | `/internal/pools/{pool}/quote` | `PASS` | The sole 503 outcome references `quote_unavailable_v1`. Independent structure and decision failures match the required three-field form; unsupported protocol and forced engine failure add only constant `automationSafe:false`. All four bodies satisfy the closed union and nested snapshot mutation remains isolated. |

- Available DEV delta: exactly 49 distinct fixes/enhancements after `1c803b4`; the complete delta was exhausted.
- Verification result: 49 PASS, 0 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 0; the reviewed delta exceeds the 20-item contract by 29 without duplicate evidence or cosmetic splitting.
- Validation: independent discovery cardinality 29/29 PASS, including 24 new outcomes and five retained controls; independent decision-failure HTTP matrix 29/29 PASS; decision schema references 24/24 PASS with 32 total `basic_unavailable_v1` references; structural-envelope HTTP matrix 24/24 PASS; pool-quote schema reference and all four distinct 503 forms PASS; four remaining heterogeneous schema-null controls PASS; 119 outcome representations and 118 body-contract identities are complete and unique; digest recomputation and nested isolation PASS. Focused response/schema suite 15/15 PASS; full suite 374/374 PASS; syntax 83/83 PASS; replay invariants PASS at 5,660.99 blocks/s with 11,394,848-byte heap growth; operational health emitted all 20 ordered checks, retained nine blockers, denied production mutation, and exited 1 as designed. Format, lint, typecheck, and build are `SKIP` because the repository defines no such scripts.

## Prior reviewed DEV delta (2/20; retained)

### `UPSTREAM-CONTRACT-SNAPSHOT-ISOLATION-001` (PASS)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-CONTRACT-SNAPSHOT-ISOLATION-001` | `PASS` | Independent mutation of nested client-error, basic-unavailable, preparation-unavailable, value-constraint, and route-outcome surfaces leaves a fresh snapshot byte-structurally equal to baseline with the same digest. HTTP revalidation with the baseline ETag remains 304 and a new 200 response contains no injected fields. |

### `UPSTREAM-PREPARATION-UNAVAILABLE-SCHEMA-001` (PASS)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-PREPARATION-UNAVAILABLE-SCHEMA-001` | `PASS` | Exactly the pool and bonding-curve preparation 503 outcomes reference `preparation_unavailable_v1`. Independent structurally unhealthy POSTs to both real routes return exactly `schemaVersion:1`, `prepared:false`, `automationSafe:false`, and the non-empty reason, with no injected internal structure field; the optional `missing` array is the only extra allowed field. |

- Available DEV delta: exactly 2 distinct fixes/enhancements after `beffb98`; the complete delta was exhausted.
- Verification result: 2 PASS, 0 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 18; no additional distinct DEV outcome exists after the prior QA baseline, and splitting schema properties or route references would be padding.
- Validation: independent isolation/HTTP/schema matrix 2/2 DEV outcomes PASS; focused response/schema suite 12/12 PASS; full suite 371/371 PASS; syntax 83/83 PASS; replay invariants PASS at 5,583.68 blocks/s with 7,436,584-byte heap growth; operational health emitted all 20 ordered checks, retained nine blockers, denied production mutation, and exited 1 as designed. Format, lint, typecheck, and build are `SKIP` because the repository defines no such scripts.

## Prior reviewed DEV delta (21/20; retained)

### `UPSTREAM-HTTP-VALUE-PARITY-001` (20/20 PASS)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-HTTP-VALUE-PARITY-001-01` | `PASS` | Minimum documented candle interval `60` is admitted. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-02` | `PASS` | Maximum documented candle interval `86400` is admitted. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-03` | `PASS` | Decimal alias `60.0` is rejected before state evaluation. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-04` | `PASS` | Exponent alias `6e1` is rejected before state evaluation. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-05` | `PASS` | Leading-zero interval alias `060` is rejected. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-06` | `PASS` | Minimum-valid bot pool filter is admitted. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-07` | `PASS` | Maximum-valid 64-code-unit bot pool filter is admitted. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-08` | `PASS` | Empty bot pool filter is rejected before readiness evaluation. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-09` | `PASS` | Control-bearing bot pool filter is rejected before readiness evaluation. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-10` | `PASS` | Oversized bot pool filter is rejected before readiness evaluation. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-11` | `PASS` | Minimum limit `1` is admitted. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-12` | `PASS` | Maximum limit `500` is admitted. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-13` | `PASS` | Zero limit is rejected. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-14` | `PASS` | Over-maximum limit `501` is rejected. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-15` | `PASS` | Decimal limit alias `1.0` is rejected. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-16` | `PASS` | Minimum published trending window is admitted. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-17` | `PASS` | Published all-time window is admitted. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-18` | `PASS` | Case-variant unpublished window is rejected. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-19` | `PASS` | Published executable-depth side `buy` is admitted with required amount. |
| `UPSTREAM-HTTP-VALUE-PARITY-001-20` | `PASS` | Unpublished executable-depth side is rejected. |

### `UPSTREAM-HTTP-REQUIREMENT-DISCOVERY-001` (FAIL)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-HTTP-REQUIREMENT-DISCOVERY-001` | `FAIL` | All 54 route partitions are deterministic, but missing required quote/depth inputs return 503 instead of 400 when injected decision-state quality is noncanonical, contradicting the handoff's pre-state rejection guarantee. |

- Available DEV delta: exactly 21 distinct fixes/enhancements after `678c33f`; the complete delta was exhausted.
- Verification result: 20 PASS, 1 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 0; the reviewed delta exceeds the 20-item contract by 1 without duplicating or cosmetically splitting evidence.

## Prior reviewed DEV delta (40/20; retained)

### `UPSTREAM-WS-FILTER-CONSTRAINTS-001` (20/20 PASS)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-01` | `PASS` | Minimum-valid `eventType` is advertised and admitted. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-02` | `PASS` | Maximum-valid `eventType` is advertised and admitted. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-03` | `PASS` | Empty `eventType` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-04` | `PASS` | Control-bearing `eventType` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-05` | `PASS` | Oversized `eventType` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-06` | `PASS` | Minimum-valid `mint` is advertised and admitted. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-07` | `PASS` | Maximum-valid `mint` is advertised and admitted. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-08` | `PASS` | Empty `mint` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-09` | `PASS` | Control-bearing `mint` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-10` | `PASS` | Oversized `mint` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-11` | `PASS` | Minimum-valid `pool` is advertised and admitted. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-12` | `PASS` | Maximum-valid `pool` is advertised and admitted. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-13` | `PASS` | Empty `pool` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-14` | `PASS` | Control-bearing `pool` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-15` | `PASS` | Oversized `pool` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-16` | `PASS` | Minimum-valid `protocol` is advertised and admitted. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-17` | `PASS` | Maximum-valid `protocol` is advertised and admitted. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-18` | `PASS` | Empty `protocol` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-19` | `PASS` | Control-bearing `protocol` is advertised as invalid and rejected. |
| `UPSTREAM-WS-FILTER-CONSTRAINTS-001-20` | `PASS` | Oversized `protocol` is advertised as invalid and rejected. |

### `UPSTREAM-HTTP-VALUE-DISCOVERY-001` (18 PASS, 2 FAIL)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-01` | `PASS` | Versioned blocks resolve cursor and limit profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-02` | `PASS` | Versioned transactions resolve cursor and limit profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-03` | `PASS` | Versioned swaps resolve cursor, limit, mint, pool, and protocol profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-04` | `PASS` | Versioned tokens resolve cursor and limit profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-05` | `PASS` | Versioned pools resolve cursor, limit, mint, protocol, and status profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-06` | `PASS` | Internal trending resolves limit and window profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-07` | `PASS` | Internal candidates resolve limit and window profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-08` | `PASS` | Internal new-pairs resolves the limit profile. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-09` | `PASS` | Legacy trending resolves limit and window profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-10` | `FAIL` | Candles publish an exact string enum, but runtime numeric coercion also accepts canonical `60.0` and `6e1`. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-11` | `PASS` | Pool quote resolves amount, mint, and tick profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-12` | `PASS` | Executable depth resolves amount and side profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-13` | `PASS` | Token OHLCV resolves interval and limit profiles. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-14` | `PASS` | Internal holders resolve the limit profile. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-15` | `PASS` | Wallet funding resolves the limit profile. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-16` | `PASS` | Versioned volume resolves the window profile. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-17` | `PASS` | Versioned holders resolve the limit profile. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-18` | `FAIL` | Bot readiness publishes `collectionFilter`, but empty, control-bearing, and 65-code-unit pool values pass route validation and reach runtime unbounded. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-19` | `PASS` | Query discovery correctly publishes an empty parameter profile map. |
| `UPSTREAM-HTTP-VALUE-DISCOVERY-001-20` | `PASS` | RPC correctly publishes an empty parameter profile map. |

- Available DEV delta: exactly 40 distinct fixes/enhancements after `078c343`; the complete delta was exhausted.
- Verification result: 38 PASS, 2 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 0; the reviewed delta exceeds the 20-item contract by 20 without duplicating or cosmetically splitting evidence.

## Prior reviewed DEV delta (40/20; retained)

### `UPSTREAM-WS-DISCOVERY-001` (20/20 PASS)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-WS-DISCOVERY-001-01` | `PASS` | Blocks without filters are advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-02` | `PASS` | Block `mint` is absent from the topic contract and rejected. |
| `UPSTREAM-WS-DISCOVERY-001-03` | `PASS` | Block `pool` is absent and rejected. |
| `UPSTREAM-WS-DISCOVERY-001-04` | `PASS` | Block `protocol` is absent and rejected. |
| `UPSTREAM-WS-DISCOVERY-001-05` | `PASS` | Block `eventType` is absent and rejected. |
| `UPSTREAM-WS-DISCOVERY-001-06` | `PASS` | Swaps without filters are advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-07` | `PASS` | Swap `mint` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-08` | `PASS` | Swap `pool` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-09` | `PASS` | Swap `protocol` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-10` | `PASS` | Swap `eventType` is absent and rejected. |
| `UPSTREAM-WS-DISCOVERY-001-11` | `PASS` | Lifecycle without filters is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-12` | `PASS` | Lifecycle `eventType` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-13` | `PASS` | Lifecycle `mint` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-14` | `PASS` | Lifecycle `pool` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-15` | `PASS` | Lifecycle `protocol` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-16` | `PASS` | Snapshots without filters are advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-17` | `PASS` | Snapshot `eventType` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-18` | `PASS` | Snapshot `mint` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-19` | `PASS` | Snapshot `pool` is advertised and admitted. |
| `UPSTREAM-WS-DISCOVERY-001-20` | `PASS` | Snapshot `protocol` is advertised and admitted. |

### `UPSTREAM-QUERY-CACHE-001` (20/20 PASS)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-QUERY-CACHE-001-01` | `PASS` | `contractSha256` is canonical lowercase SHA-256. |
| `UPSTREAM-QUERY-CACHE-001-02` | `PASS` | Independent digest recomputation over the artifact excluding the digest matches. |
| `UPSTREAM-QUERY-CACHE-001-03` | `PASS` | Repeated snapshots return the same digest. |
| `UPSTREAM-QUERY-CACHE-001-04` | `PASS` | Strong `ETag` equals the quoted contract digest. |
| `UPSTREAM-QUERY-CACHE-001-05` | `PASS` | Matching strong validator returns 304. |
| `UPSTREAM-QUERY-CACHE-001-06` | `PASS` | Matching weak validator returns 304. |
| `UPSTREAM-QUERY-CACHE-001-07` | `PASS` | Matching validator in a list returns 304. |
| `UPSTREAM-QUERY-CACHE-001-08` | `PASS` | Wildcard validator returns 304 for the existing resource. |
| `UPSTREAM-QUERY-CACHE-001-09` | `PASS` | Mismatched validator returns the full 200 representation. |
| `UPSTREAM-QUERY-CACHE-001-10` | `PASS` | Every 304 response is bodyless. |
| `UPSTREAM-QUERY-CACHE-001-11` | `PASS` | Every 304 retains the current ETag. |
| `UPSTREAM-QUERY-CACHE-001-12` | `PASS` | Every 304 retains API version 1. |
| `UPSTREAM-QUERY-CACHE-001-13` | `PASS` | Every 304 publishes the private five-minute cache policy. |
| `UPSTREAM-QUERY-CACHE-001-14` | `PASS` | Full 200 response publishes the same private cache policy. |
| `UPSTREAM-QUERY-CACHE-001-15` | `PASS` | Full 200 response retains API version 1. |
| `UPSTREAM-QUERY-CACHE-001-16` | `PASS` | Query input on the discovery route still fails with 400. |
| `UPSTREAM-QUERY-CACHE-001-17` | `PASS` | Wrong method still fails with 405. |
| `UPSTREAM-QUERY-CACHE-001-18` | `PASS` | Authentication precedes wildcard cache validation and returns 401. |
| `UPSTREAM-QUERY-CACHE-001-19` | `PASS` | Base quota precedes cache validation and returns 429 after one admitted request. |
| `UPSTREAM-QUERY-CACHE-001-20` | `PASS` | Full cached representation preserves the complete HTTP/WebSocket discovery artifact. |

- Available DEV delta: exactly 40 distinct fixes/enhancements after `81d6a61`; the complete delta was exhausted.
- Verification result: 40 PASS, 0 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 0; the reviewed delta exceeds the 20-item contract by 20 without duplicating or cosmetically splitting evidence.

## Prior reviewed DEV delta (40/20; retained)

### `UPSTREAM-QUERY-PARITY-001` (23/23 PASS)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-QUERY-PARITY-001-01` | `PASS` | Token market rejects ignored `limit`. |
| `UPSTREAM-QUERY-PARITY-001-02` | `PASS` | Token security rejects ignored `limit`. |
| `UPSTREAM-QUERY-PARITY-001-03` | `PASS` | Token liquidity rejects ignored `limit`. |
| `UPSTREAM-QUERY-PARITY-001-04` | `PASS` | Token executable depth rejects ignored `limit` while retaining `side` and `amountRaw`. |
| `UPSTREAM-QUERY-PARITY-001-05` | `PASS` | Duplicate WebSocket `cursor` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-06` | `PASS` | Duplicate WebSocket `topic` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-07` | `PASS` | Duplicate WebSocket `mint` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-08` | `PASS` | Duplicate WebSocket `pool` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-09` | `PASS` | Duplicate WebSocket `protocol` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-10` | `PASS` | Duplicate WebSocket `eventType` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-11` | `PASS` | Duplicate WebSocket `ack` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-12` | `PASS` | Unknown WebSocket query names are rejected. |
| `UPSTREAM-QUERY-PARITY-001-13` | `PASS` | Oversized `mint` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-14` | `PASS` | Empty `pool` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-15` | `PASS` | Control-bearing `protocol` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-16` | `PASS` | Empty lifecycle `eventType` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-17` | `PASS` | Block-topic `mint` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-18` | `PASS` | Block-topic `pool` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-19` | `PASS` | Block-topic `protocol` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-20` | `PASS` | Block-topic `eventType` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-21` | `PASS` | Swap-topic `eventType` is rejected. |
| `UPSTREAM-QUERY-PARITY-001-22` | `PASS` | Unknown topic values are rejected. |
| `UPSTREAM-QUERY-PARITY-001-23` | `PASS` | Unsupported acknowledgement values are rejected after admission. |

### `UPSTREAM-QUERY-ENCODING-001` (19 PASS, 1 FAIL)

| Item | Status | Independent evidence |
|---|---|---|
| `UPSTREAM-QUERY-ENCODING-001-01` | `FAIL` | Noncanonical pagination escapes are rejected, but two valid parameter orders with identical decoded semantics are both accepted, contradicting the declared single wire/cache/signature identity. |
| `UPSTREAM-QUERY-ENCODING-001-02` | `PASS` | Token `mint` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-03` | `PASS` | Pool filter percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-04` | `PASS` | Protocol filter percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-05` | `PASS` | Status filter percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-06` | `PASS` | Trending window percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-07` | `PASS` | Candle interval percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-08` | `PASS` | Quote `amountRaw` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-09` | `PASS` | Quote `inputMint` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-10` | `PASS` | Token-depth `side` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-11` | `PASS` | Wallet `limit` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-12` | `PASS` | Diagnostic `pool` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-13` | `PASS` | WebSocket `cursor` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-14` | `PASS` | WebSocket `topic` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-15` | `PASS` | WebSocket `mint` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-16` | `PASS` | WebSocket `pool` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-17` | `PASS` | WebSocket `protocol` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-18` | `PASS` | WebSocket `eventType` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-19` | `PASS` | WebSocket `ack` percent-encoding variant is rejected. |
| `UPSTREAM-QUERY-ENCODING-001-20` | `PASS` | Shared HTTP/WebSocket canonical-escape boundary preserves ordinary documented ASCII controls. |

- Available DEV delta: exactly 43 distinct fixes/enhancements after `b0c99ec`; the complete delta was exhausted.
- Verification result: 42 PASS, 1 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 0; the reviewed delta exceeds the 20-item contract by 23 without duplicating or cosmetically splitting evidence.

## Prior reviewed DEV delta (44/20; retained)

### `UPSTREAM-HTTP-QUERY-ALLOWLIST-001` (21 PASS, 1 FAIL)

| Item | Status | Independent HTTP/source evidence |
|---|---|---|
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-01` | `PASS` | Internal trending rejects unsupported `widnow` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-02` | `PASS` | New pairs rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-03` | `PASS` | Candidates rejects unsupported `score` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-04` | `PASS` | Pool quote rejects unsupported `amount` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-05` | `PASS` | Token trades rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-06` | `PASS` | Token OHLCV rejects unsupported `bucket` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-07` | `FAIL` | Executable depth rejects unsupported `direction`, but independently accepts undocumented and response-irrelevant `limit`; the token regex grants `limit` to every subview. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-08` | `PASS` | Wallet funding rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-09` | `PASS` | Versioned blocks rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-10` | `PASS` | Versioned transactions rejects unsupported `after` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-11` | `PASS` | Versioned swaps rejects unsupported `venue` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-12` | `PASS` | Versioned tokens rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-13` | `PASS` | Versioned pools rejects unsupported `state` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-14` | `PASS` | Volume rejects unsupported `period` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-15` | `PASS` | Bot readiness rejects unsupported `address` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-16` | `PASS` | Holders rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-17` | `PASS` | Candles rejects unsupported `window` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-18` | `PASS` | Legacy blocks rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-19` | `PASS` | Legacy transactions rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-20` | `PASS` | Legacy trending rejects unsupported `period` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-21` | `PASS` | Legacy account rejects unsupported `page` with redacted HTTP 400. |
| `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-22` | `PASS` | Legacy mint rejects unsupported `page` with redacted HTTP 400. |

### `UPSTREAM-HTTP-EMPTY-QUERY-001` (22/22 PASS)

| Item | Status | Independent HTTP evidence |
|---|---|---|
| `UPSTREAM-HTTP-EMPTY-QUERY-001-01` | `PASS` | RPC rejects `debug` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-02` | `PASS` | Metrics rejects `format` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-03` | `PASS` | Health rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-04` | `PASS` | Stats rejects `details` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-05` | `PASS` | Ingestion rejects `refresh` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-06` | `PASS` | Warehouse rejects `refresh` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-07` | `PASS` | Backup rejects `refresh` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-08` | `PASS` | Recovery rejects `refresh` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-09` | `PASS` | Registry rejects `version` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-10` | `PASS` | Feed health rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-11` | `PASS` | Feed gaps rejects `limit` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-12` | `PASS` | Execution policy rejects `version` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-13` | `PASS` | Pool preparation rejects `dryRun` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-14` | `PASS` | Token preparation rejects `dryRun` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-15` | `PASS` | Evidence rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-16` | `PASS` | Price rejects `currency` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-17` | `PASS` | Transaction detail rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-18` | `PASS` | Token-account detail rejects `slot` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-19` | `PASS` | Pool detail rejects `verbose` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-20` | `PASS` | Risk rejects `model` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-21` | `PASS` | Root document rejects `preview` with redacted HTTP 400. |
| `UPSTREAM-HTTP-EMPTY-QUERY-001-22` | `PASS` | Index document rejects `preview` with redacted HTTP 400. |

- Available DEV delta: exactly 44 distinct fixes/enhancements after `6885ff0`; the complete delta was exhausted.
- Verification result: 43 PASS, 1 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 0; the reviewed delta exceeds the 20-item contract by 24 without duplicating or cosmetically splitting evidence.

## Prior reviewed DEV delta (50/20; retained)

### `UPSTREAM-CLI-ENTRYPOINT-007` (30/30 PASS)

| Item | Status | Evidence |
|---|---|---|
| `UPSTREAM-CLI-ENTRYPOINT-007-01` | `PASS` | `account-snapshot.js` imports and gates `main()` with `isInvokedFile`; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-02` | `PASS` | `amm-v4-pool-snapshot.js` uses the shared identity guard; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-03` | `PASS` | `api-audit-retention.js` uses the shared identity guard without changing dry-run semantics. |
| `UPSTREAM-CLI-ENTRYPOINT-007-04` | `PASS` | `archive-receipt.js` uses the shared identity guard; its exclusive receipt contract remains covered. |
| `UPSTREAM-CLI-ENTRYPOINT-007-05` | `PASS` | `backfill-qualification.js` uses the shared guard; immutable non-promoting qualification tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-06` | `PASS` | Aliased `backup-preflight.js` executes and returns usage failure with exit 1 rather than silent success. |
| `UPSTREAM-CLI-ENTRYPOINT-007-07` | `PASS` | `backup-status.js` uses the shared identity guard; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-08` | `PASS` | `clmm-pool-snapshot.js` uses the shared identity guard; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-09` | `PASS` | `cpmm-pool-snapshot.js` uses the shared identity guard; syntax and inventory checks pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-10` | `PASS` | Aliased `dead-letter-reconcile.js` executes its dry run, emits evidence, and exits 0. |
| `UPSTREAM-CLI-ENTRYPOINT-007-11` | `PASS` | Aliased `exporter-health.js` now emits the 216-character fail-closed result and exits 1. |
| `UPSTREAM-CLI-ENTRYPOINT-007-12` | `PASS` | `external-rpc.js` uses the shared identity guard; provider failover/redaction tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-13` | `PASS` | `geyser-abi-preflight.js` uses the shared guard; bounded probe and qualification tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-14` | `PASS` | `inbox-archive.js` uses the shared identity guard; verified archive tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-15` | `PASS` | Aliased `inbox-retention.js` executes its dry run, emits evidence, and exits 0 without deletion. |
| `UPSTREAM-CLI-ENTRYPOINT-007-16` | `PASS` | `local-validator-exporter.js` uses the shared guard; exporter provenance/gap tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-17` | `PASS` | `local-validator-stream.js` uses the shared guard; reconnect/replay/gap tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-18` | `PASS` | `meteora-dlmm-pool-snapshot.js` uses the shared identity guard; syntax and snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-19` | `PASS` | `offchain-metadata-snapshot.js` uses the shared guard; bounded metadata acquisition tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-20` | `PASS` | `openbook-market-snapshot.js` uses the shared identity guard; market snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-21` | `PASS` | `operational-job-worker.js` uses the shared guard; lease/retry tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-22` | `PASS` | `orca-pool-snapshot.js` uses the shared identity guard; Whirlpool snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-23` | `PASS` | `phoenix-market-snapshot.js` uses the shared identity guard; order-book snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-24` | `PASS` | `postgres-commercial-sync.js` uses the shared guard; deterministic upsert tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-25` | `PASS` | `pump-bonding-curve-snapshot.js` uses the shared identity guard; curve snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-26` | `PASS` | `pump-swap-pool-snapshot.js` uses the shared identity guard; PumpSwap snapshot tests pass. |
| `UPSTREAM-CLI-ENTRYPOINT-007-27` | `PASS` | Aliased `recovery-qualification.js` executes and returns usage failure with exit 1. |
| `UPSTREAM-CLI-ENTRYPOINT-007-28` | `PASS` | Aliased `reduced-preflight.js` executes, emits its missing-digest failure, and exits 1. |
| `UPSTREAM-CLI-ENTRYPOINT-007-29` | `PASS` | Aliased `usdc-oracle-snapshot.js` executes, emits its missing-source failure, and exits 1. |
| `UPSTREAM-CLI-ENTRYPOINT-007-30` | `PASS` | `warehouse-sync.js` uses the shared guard; ordered retry-safe convergence tests pass. |

### `UPSTREAM-HTTP-QUERY-CARDINALITY-001` (20/20 PASS)

| Item | Status | Independent HTTP evidence |
|---|---|---|
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-01` | `PASS` | Duplicate trending `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-02` | `PASS` | Duplicate trending `window` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-03` | `PASS` | Duplicate new-pairs `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-04` | `PASS` | Duplicate candidates `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-05` | `PASS` | Duplicate candidates `window` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-06` | `PASS` | Duplicate quote `amountRaw` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-07` | `PASS` | Duplicate quote `inputMint` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-08` | `PASS` | Duplicate quote `limitTick` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-09` | `PASS` | Duplicate token-trades `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-10` | `PASS` | Duplicate OHLCV `interval` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-11` | `PASS` | Duplicate depth `side` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-12` | `PASS` | Duplicate depth `amountRaw` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-13` | `PASS` | Duplicate wallet-funding `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-14` | `PASS` | Duplicate block `cursor` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-15` | `PASS` | Duplicate transaction `limit` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-16` | `PASS` | Duplicate swap `mint` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-17` | `PASS` | Duplicate swap `protocol` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-18` | `PASS` | Duplicate token `cursor` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-19` | `PASS` | Duplicate pool `status` returns redacted HTTP 400 `bad_request`. |
| `UPSTREAM-HTTP-QUERY-CARDINALITY-001-20` | `PASS` | Duplicate candle `interval` returns redacted HTTP 400 `bad_request`. |

- Prior available DEV delta: exactly 50 distinct fixes/enhancements after `07316ee`; that historical delta was exhausted.
- Prior verification result: 50 PASS, 0 FAIL, 0 BLOCKED, 0 SKIP.
- Prior fix/enhancement shortfall: 0; the historical delta exceeded the 20-item contract by 30 without duplicating or cosmetically splitting evidence.

## Independent 39-domain reconciliation

| Domain | Status | Concrete evidence |
|---|---|---|
| Path-parameter boundary | `PASS` | All 27 published template routes expose exact placeholder maps; 54 combined encoded-slash/noncanonical-unreserved probes and the prior `%ZZ` plus invalid-amount reproduction now return the canonical path error before query-value admission. |
| HTTP admission discovery | `PASS` | The published 14-stage order and status/retry/header outcomes match source and independent HTTP precedence probes across authentication, base quota, canonical path, query, and method boundaries. |
| HTTP route response discovery | `PASS` | All five cursor-paginated routes now publish non-retryable JSON 400 outcomes matching independent real `invalid_cursor` responses against canonical indexed state. |
| Decision-quality unavailable discovery | `PASS` | All 29 decision consumers publish exactly one retryable JSON 503 outcome; 24 are new and five retained heterogeneous controls remain correct. All 29 distinct real HTTP decision-failure probes return the advertised status family. |
| HTTP response representation discovery | `PASS` | All 119 published outcomes include a representation profile; independent JSON, Prometheus, HTML, and empty-304 responses match declared content types and body requirements. |
| HTTP body-contract identity | `PASS` | All 118 body-bearing outcomes publish unique stable derived version-1 identities bounded to 79 characters; the sole bodyless 304 publishes a null identity and repeated unmodified snapshot digests are stable. |
| HTTP response body schemas | `PASS` | The closed error, unavailable, and preparation schemas match their exact route references and representative runtime bodies. Independent nested mutation cannot affect later snapshots, digest, ETag, or published discovery. |
| Decision-quality unavailable schemas | `PASS` | The 24 compatible decision consumers reference `basic_unavailable_v1`; 24 distinct structural-failure requests emit its exact three-field body without internal field names. Four heterogeneous controls retain null schemas after pool quote was typed separately. |
| Pool-quote unavailable schema | `PASS` | `quote_unavailable_v1` is referenced only by pool quote and accepts exactly its two fail-closed forms: structure/decision failures use three required fields, while unsupported-protocol/engine failures add only constant `automationSafe:false`. |
| Token/account/supply authority | `PASS` | Full suite passes indexed token balance, Token-2022 funding, complete finalized account snapshot, token-account projection, and token-supply contracts. |
| Holder and whale concentration | `PASS` | `indexed token holders aggregate owners with versioned canonical evidence` and authoritative-exclusion concentration tests pass. |
| Trader and wallet analytics | `PASS` | Exact wallet cost basis/PnL, funding, funding-cluster, profile, and partial-coverage tests pass. |
| Pool identity and quote evidence | `PASS` | Finalized Raydium, Orca, Meteora, Pump/PumpSwap, Phoenix, and OpenBook snapshot/quote tests pass with exact venue dependencies. |
| Price and depeg reference | `PASS` | Independent USDC reference, Pyth evidence, expiry, depeg bound, and nominal USD path tests pass. |
| Liquidity and risk | `PASS` | Exact pool reserve/depth evidence and mature two-way finalized bot-readiness/risk gates pass. |
| Volume and candles | `PASS` | Exact rolling USD volume and direction-stable integer OHLCV tests pass without floating point. |
| Provenance, freshness, and finality | `PASS` | Malformed provenance, wrong-network, stale/future evidence, finality promotion, and finalized downgrade tests all fail closed as designed. |
| REST schemas and pagination | `PASS` | Stable cursor scope/digest, filtering, explicit projections, invalid-cursor rejection, and compact catalogs pass; the path defect is tracked separately. |
| Read-only JSON-RPC | `PASS` | Indexed method allowlist, parameter bounds, cursor isolation, malformed/oversized envelope, and invalid-evidence tests pass. |
| WebSocket contracts and replay | `PASS` | Ordered persisted replay, resume, snapshot isolation, corruption rejection, acknowledgement, timeout, capacity, and backpressure tests pass. |
| Numeric precision | `PASS` | Raw integer fields use exact string/UInt64/UInt256 or numerator/denominator contracts; Token-2022 epoch fee and Q64/lot/bin math tests pass. |
| Replay, reorg, and idempotency | `PASS` | 1,000-block replay preserves canonical counts, duplicate idempotency, replacement correction, heap, and throughput invariants. |
| Retry, failover, and `Retry-After` | `PASS` | Local/external provider rotation, half-open probes, wrong-network rejection, bounded 1,000-3,600,000 ms retry hints, and credential-safe failover tests pass. |
| Gap, backfill, and recovery logic | `PASS` | Atomic bounded gap repair, produced-slot refusal, immutable non-promoting backfill, and detached recovery-evidence rejection tests pass. |
| Persistence and atomic recovery | `PASS` | Durable concurrent writes/appends, snapshot batch validation-before-mutation, fingerprint replacement, quarantine, and exact checkpoint tests pass. |
| Warehouse and schema compatibility | `PASS` | Ordered retry-safe dual-sink checkpointing, canonical event/content hashes, PostgreSQL projection preimages, Redis hot-state bounds, and ClickHouse UInt256 raw amounts pass repository tests. |
| Fail-closed redaction | `PASS` | Explicit public projection allowlists, dead-letter/diagnostic credential redaction, bounded operational JSON, malformed evidence, and secret-file tests pass. |
| Operational readiness diagnostics | `PASS` | The schema-v2 report contains all twenty ordered redacted dimensions; local provider validation rejects missing, public, cardinality-mismatched, canonically duplicate, credential-bearing, path-bearing, query-bearing, and fragment-bearing topologies while accepting a distinct loopback pair set. Canonical real-path entrypoint comparison preserves CLI execution through workspace aliases. |
| CLI entrypoint execution | `PASS` | All 32 direct operator CLI consumers use the shared real-path guard and zero legacy lexical guards remain. Seven representative aliased commands execute with nonempty output and correct exit behavior. |
| HTTP query cardinality | `PASS` | Twenty independent duplicate-key route requests return the stable redacted HTTP 400 contract; a valid four-parameter control remains accepted by the validator. |
| HTTP query allowlists | `PASS` | The exact token-subview correction rejects all four previously ignored `limit` inputs; the 4/4 token correction matrix and 19/19 WebSocket parity matrix pass. |
| Empty-query HTTP contracts | `PASS` | Twenty-two independent real HTTP requests reject query input with the stable redacted HTTP 400 contract; six query-free controls remain accepted by the validator. |
| Canonical query identity | `PASS` | All twenty alternate-order cases fail the shared sorted encoding boundary; canonical controls, HTTP wiring, WebSocket parsing, authentication, and quota ordering remain compatible. |
| Machine-readable query discovery | `PASS` | All twenty topic/filter compatibility cases match the deterministic per-topic artifact and runtime parser; the prior hidden compatibility rules are now published. |
| WebSocket filter-value discovery | `PASS` | The deterministic artifact now publishes names, optionality, minimum 1, maximum 64 UTF-16 code units, and forbidden controls; all twenty generated-builder/runtime parity cases pass. |
| HTTP query value discovery | `PASS` | The positive-u64 profile exactly advertises minimum 1, maximum 18446744073709551615, and 20-character bound; all five independent zero/minimum/maximum/overflow/overlength cases match shared admission. |
| HTTP parameter requirement discovery | `PASS` | Missing quote amount/mint and depth amount return 400 under injected unhealthy decision state, while valid u64-max advances to the expected 503 gate; all 54 partitions remain deterministic. |
| Bounded performance | `PASS` | Full suite passes 374/374; syntax passes 83/83; replay completes at 5,660.99 blocks/s with 11,394,848-byte heap growth below 536,870,912 bytes. |
| Live operational qualification | `BLOCKED` | Provider variables and active exporter/warehouse/backup/recovery status files are absent; both retained indexes report `wrong_network`; retained finalized exporter evidence is 406,432 slots behind and 420,887,513 ms old at the trigger time. |

The contract minimum is satisfied with 39 distinct evidence domains: 38 PASS, 0 FAIL, and 1 BLOCKED. These domains use separate contracts or failure boundaries and are not cosmetic splits.

## UPSTREAM-QA-PATH-PARAMETER-003

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run `test/indexer.test.js` test `resource routes reject malformed or delimiter-decoding path parameters`; it exercises malformed escapes and decoded delimiters for preparation, quote, evidence, token, wallet, price, volume, transaction, account, mint, holder, token-account, pool, candle, and risk consumers, with empty/populated transaction state and a valid transaction control.
- Evidence: the committed test passes 32/32 consumer-matrix checks, retains 4/4 empty-state token-account/transaction checks and 2/2 populated transaction checks, preserves `signature-1` with HTTP 200, captures zero diagnostics, and observes `terminal_dex_internal_failures_total{operation="http_internal_error"} 0`.
- Affected contracts: shared REST/internal path-parameter validation, regression coverage for 16 resource consumers, internal failure metrics, diagnostic callback behavior, and client retry/error classification.
- Expected behavior: the source correction and committed regression together cover empty/populated transaction state, all 16 malformed/delimiter consumer boundaries, valid-route preservation, and unchanged internal-failure telemetry.
- Actual behavior: the committed regression now matches the expected controlled HTTP 400 and telemetry contracts across the complete scoped matrix.
- Acceptance criteria: committed table-driven 16-consumer malformed/delimiter matrix; retained empty and populated transaction checks; preserved valid transaction route; zero internal-failure counter and diagnostic callbacks. All criteria are met.
- Validation results: focused committed regression 1/1 PASS; malformed/delimiter matrix 32/32 PASS plus retained empty/populated transaction checks; valid transaction preservation PASS; diagnostics 0 PASS; internal-failure metric 0 PASS; full suite 348/348 PASS; syntax 84/84 PASS; replay invariants PASS at 7,547.45 blocks/s and 8,902,232-byte heap growth.
- Compatibility impact: source behavior is compatible for valid paths and deterministically rejects malformed paths; the regression enhancement changes no runtime or consumer contract.
- Performance impact: validation remains bounded to 256 decoded characters before lookup; no replay/heap/throughput regression was observed.
- Blockers: none; the prior regression gap is closed.

## UPSTREAM-QA-PATH-PARAMETER-004

- Severity: `PASS` (resolved by `cb0a425`)
- Owner: `DEV`
- Reproduction: request `/internal/pools/%ZZ/quote?amountRaw=0&inputMint=m` using canonical query ordering and compare the response with the handoff guarantee that malformed canonical-path errors retain precedence.
- Evidence: the prior reproduction now returns HTTP 400 detail `path parameter must use canonical percent encoding`. Independent discovery-driven probes confirm exact placeholder maps for all 27 template routes and canonical path precedence for all 54 encoded-slash/noncanonical-unreserved combinations with a simultaneous unsupported query.
- Affected contracts: path canonicalization, HTTP error precedence, audit/retry classification, route-catalog consolidation, and malformed request observability.
- Expected behavior: malformed path identity is rejected before query-value or required-parameter interpretation, consistently with the explicit compatibility guarantee.
- Actual behavior: recognized template segments are decoded after authentication/base quota and unique-name admission, then before query allowlist/value, method, required-input, body, or state evaluation; runtime and the published admission contract agree.
- Acceptance criteria: validate/decode recognized template path parameters before value and required-query checks; add combined malformed-path plus invalid-value/unsupported-key cases for quote and depth; preserve authentication, quota, method, and redacted 400 behavior. All criteria are met.
- Validation results: independent path matrix 54/54 PASS plus prior reproduction PASS; admission precedence probes PASS; focused 9/9 PASS; full suite 363/363 PASS; syntax 83/83 PASS; replay PASS at 5,901.82 blocks/s.
- Compatibility impact: noncanonical path aliases now fail deterministically at the documented path boundary; canonical paths and response/RPC/WebSocket schemas remain compatible.
- Performance impact: one bounded decode/re-encode check per template placeholder; replay throughput and heap remain within contract.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-ADMISSION-DISCOVERY-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: load `GET /api/v1/query-contracts`, inspect `httpAdmission`, and issue overlapping malformed-path requests across unauthenticated, authenticated wrong-method/unsupported-query, canonical wrong-method, and exhausted-quota states.
- Evidence: the artifact publishes 14 ordered stages with deterministic status, retry, `Allow`, and `Retry-After` semantics. Independent HTTP results are 401 before path without credentials, 400 canonical-path detail before method/query with credentials, 405 plus `Allow: GET` for a canonical wrong method, and 429 plus `Retry-After` before malformed-path handling after quota exhaustion.
- Affected contracts: generated HTTP clients, retry classification, authentication/quota precedence, canonical request identity, method handling, body/state gates, discovery digest, and ETag identity.
- Expected versus actual: machine-readable admission metadata must match runtime gate order and retry/header behavior; actual metadata and observed runtime agree.
- Acceptance criteria: publish every pre-route gate in execution order; publish stable status/retry/header semantics; bind metadata into the discovery digest; independently verify representative overlapping failures. All criteria are met.
- Validation results: 14/14 ordered stages inspected; four independent precedence outcomes PASS; focused 9/9 PASS; full suite 363/363 PASS; syntax 83/83 PASS; replay PASS.
- Compatibility/performance impact: additive discovery metadata changes the artifact digest/ETag but not runtime endpoint schemas; bounded static metadata adds no observed replay or request-path regression.
- Blockers: none.

## UPSTREAM-QA-HTTP-RESPONSE-DISCOVERY-002

- Severity: `PASS` (resolved by `1b38246`)
- Owner: `DEV`
- Reproduction: start the API with canonical structure/decision evidence and available empty indexed collections; send `cursor=x` to `/api/v1/blocks`, `/api/v1/transactions`, `/api/v1/swaps`, `/api/v1/tokens`, and `/api/v1/pools`; compare each response status with that route's published `responseOutcomes`.
- Evidence: all five requests pass admission because `x` satisfies the published cursor character/length profile, then fail route-level cursor decoding with HTTP 400 `invalid_cursor`. Each route now publishes one matching non-retryable JSON 400 `route_client_error` outcome with a stable body-contract identity.
- Affected contracts: generated post-admission response classifiers, retry policy, cursor pagination, discovery digest/ETag identity, and the claim that all route-emitted status families are machine-readable.
- Expected behavior: every stable route-level outcome emitted after the published admission stages appears once in that route's ordered `responseOutcomes`, with 400 classified non-retryable.
- Actual behavior: the five observed HTTP 400 outcomes and published classifier entries agree on status, retryability, and JSON representation.
- Acceptance criteria: publish non-retryable `route_client_error` status 400 for all five cursor-paginated routes; add discovery-driven real HTTP parity tests using syntactically admitted but undecodable cursors; retain unique ordered statuses, admission semantics, representations, digest/ETag coverage, and existing success/unavailable behavior. All criteria are met.
- Validation results: independent invalid-cursor parity matrix 5/5 PASS; focused cursor/response suite 13/13 PASS; full suite 367/367 PASS; syntax 83/83 PASS; replay PASS at 4,860.14 blocks/s.
- Compatibility impact: additive metadata correction only; runtime already returns stable HTTP 400 and existing response bytes need not change.
- Performance impact: five static outcome entries and bounded parity checks; no performance regression observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-BODY-CONTRACT-IDENTITY-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: enumerate all response outcomes from two independently generated query-contract snapshots; derive the expected route/outcome/version identity for every body-bearing entry, check uniqueness and length bounds, and inspect the bodyless 304 identity.
- Evidence: all 118 body-bearing entries match their deterministic `solana-indexer.http.&lt;route&gt;.&lt;outcome&gt;.v1` identity, all 118 identities are unique, maximum length is 79 characters, repeated unmodified snapshots have the same digest, and `/api/v1/query-contracts` status 304 alone has `bodyContract: null`.
- Affected contracts: generated response validators, compatibility caches, route/outcome schema identity, discovery digest/ETag, JSON/Prometheus/HTML parser selection, and bodyless completion handling.
- Expected versus actual: every body-bearing outcome must carry one stable versioned identity and every bodyless outcome must explicitly carry no identity; actual discovery matches.
- Acceptance criteria: publish unique bounded route/outcome/version identities for all body-bearing outcomes; publish null only for bodyless outcomes; preserve representation/status parity and deterministic digest coverage. All criteria are met.
- Validation results: derived identity matrix 118/118 PASS; uniqueness 118/118 PASS; one bodyless 304 PASS; focused response/schema suite 15/15 PASS; full suite 374/374 PASS; syntax and replay PASS.
- Compatibility/performance impact: additive discovery metadata changes the digest/ETag without changing runtime bytes; bounded string generation adds no observed replay or API regression.
- Blockers: none.

## UPSTREAM-QA-DECISION-UNAVAILABLE-DISCOVERY-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: enumerate the 29 runtime paths gated by `decisionStateQuality`, materialize every template with canonical path and required query values, inject noncanonical derived-ledger evidence, and compare each real response with its published post-admission outcomes.
- Evidence: all 29 routes publish exactly one retryable JSON `unavailable` status 503. Each distinct real HTTP probe returns 503 with `{schemaVersion:1, available:false, reason:"indexed_decision_evidence_invalid"}`; the 24 new entries are `UPSTREAM-QA-DECISION-UNAVAILABLE-DISCOVERY-001-01..24`, and the five pre-existing quote, depth, price, volume, and readiness controls remain unique.
- Affected contracts: generated HTTP response classifiers, decision-evidence retry policy, discovery digest/ETag, token/pool catalogs, holder/trader/wallet intelligence, evidence, risk, price/volume, quote/depth, candles, and bot-readiness clients.
- Expected versus actual: every recognized decision consumer advertises its shared fail-closed decision-quality response once, with retryable status 503; published and observed results match for all 29 routes.
- Acceptance criteria: add the omitted 24 outcomes without duplicating the five existing outcomes; retain one ordered status entry per route; bind additions into snapshot digest and body identity; verify all consumers through real injected decision failure. All criteria are met.
- Validation results: 24/24 new discovery items PASS; complete decision set 29/29 and real HTTP matrix 29/29 PASS; focused suite 15/15 and full suite 374/374 PASS; syntax, digest recomputation, identity uniqueness, and replay PASS.
- Compatibility impact: additive discovery changes the query-contract digest/ETag; runtime failure bytes are unchanged by this discovery batch, and generated clients can now classify these 503s as retryable.
- Performance impact: 24 bounded static outcome entries; no request, replay, heap, or suite regression observed.
- Blockers: none.

## UPSTREAM-QA-DECISION-UNAVAILABLE-SCHEMA-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: enumerate the 24 decision routes claimed compatible with `basic_unavailable_v1`, inject noncanonical structure evidence containing a private field name, issue one canonical real request per route, and check the heterogeneous decision consumers against their deliberately separate schema handling.
- Evidence: all 24 outcomes reference the closed three-field schema and all 24 distinct structural HTTP responses match it exactly without the injected internal field name. Depth, price, volume, and readiness remain null because later 503 bodies are heterogeneous; pool quote is now independently covered by `quote_unavailable_v1`. Total basic-schema coverage is 32 unique routes after retaining the earlier eight exact envelopes.
- Affected contracts: response-schema discovery, generated validators, structure and decision fail-closed parity, secret/diagnostic redaction, retry handling, and the 24 discovery, catalog, evidence, token, wallet, account, mint, risk, pool, and candle consumers.
- Expected versus actual: only structurally identical decision-quality bodies reference `basic_unavailable_v1`; both structure and decision gates emit the exact closed envelope for those routes, while heterogeneous routes remain untyped. Actual behavior matches.
- Acceptance criteria: assign exactly 24 new basic-schema references; keep incompatible consumers outside that schema; emit no undocumented `fields`; preserve success, 4xx, RPC, WebSocket, persistence, and configuration contracts; keep snapshot isolation and identity uniqueness. All criteria are met.
- Validation results: schema assignments 24/24 PASS; structural HTTP matrix 24/24 PASS; four remaining null controls and the separately typed quote control PASS; total schema-reference distribution is 32 basic, 9 client-error, 6 not-found, 2 preparation, 1 quote, and 69 null across 119 outcomes; nested isolation and digest recomputation PASS; focused 15/15 and full 374/374 PASS; syntax and replay PASS.
- Compatibility impact: the undocumented `fields` member is removed from structural 503 bodies on these 24 routes; consumers can migrate to the closed schema. Other response bodies and non-HTTP contracts are unchanged.
- Performance impact: one bounded route classifier plus static schema references; replay remains 5,660.99 blocks/s with 11,394,848-byte heap growth below the 536,870,912-byte ceiling.
- Blockers: none.

## UPSTREAM-QA-QUOTE-UNAVAILABLE-SCHEMA-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: inspect the pool-quote 503 schema reference, then independently force structural-quality refusal, decision-quality refusal, an unsupported pool program, and a recognized CPMM program with incomplete engine evidence.
- Evidence: the sole pool-quote 503 outcome references `quote_unavailable_v1`. Structure and decision failures return exactly `{schemaVersion:1, available:false, reason}`; unsupported protocol and quote-engine failure add only `automationSafe:false`. All four bodies satisfy the required/optional/closed-field rules, and mutation of the returned quote schema cannot alter a fresh snapshot.
- Affected contracts: authenticated pool quote, generated unavailable validators, analysis-only automation safety, retry classification, contract digest/ETag, structure/decision gates, and quote-engine failure handling.
- Expected versus actual: one closed schema must cover every pool-quote 503 without making `automationSafe` optionality unsafe; the observed four failure families fit exactly and any present automation flag is fixed false.
- Acceptance criteria: reference the schema only from pool quote; require version/available/reason; allow only optional constant-false automation safety; cover structure, decision, unsupported protocol, and engine failure; preserve runtime bytes and non-quote contracts. All criteria are met.
- Validation results: reference cardinality 1/1 PASS; four independent runtime families 4/4 PASS; closed-field and nested-isolation checks PASS; focused 15/15 and full 374/374 PASS; syntax and replay PASS.
- Compatibility impact: additive discovery only; existing clients and runtime response bodies are unchanged, while generated clients can validate both quote failure forms.
- Performance impact: one bounded static schema and route membership check; no regression observed.
- Blockers: none.

## UPSTREAM-QA-HTTP-SCHEMA-SNAPSHOT-001

- Severity: `PASS` (resolved by `bc1de1d`)
- Owner: `DEV`
- Reproduction: obtain a snapshot from exported `queryContractSnapshot()`, mutate a nested array in `responseBodySchemas.route_client_error_v1` or `basic_unavailable_v1`, then obtain another snapshot and conditionally fetch `/api/v1/query-contracts` with the pre-mutation ETag.
- Evidence: independent mutations across three nested response schemas, a value constraint, and a route representation remain isolated to the caller-owned result. The next snapshot is deep-equal to baseline with digest `7a3104d4684f46e6f65112cdc9e856d5fbcd4a3c045b330149bbaa28dcc181f0`; the original HTTP ETag still revalidates to 304 and a fresh public 200 payload excludes injected fields.
- Affected contracts: deterministic discovery, schema fail-closed behavior, error/unavailable validators, contract digest, cache identity, ETag revalidation, and in-process callers of the exported snapshot API.
- Expected behavior: a returned snapshot cannot mutate module state or any later snapshot; nested schema objects and arrays are detached or recursively immutable, and the public digest/ETag changes only when authoritative contract source changes.
- Actual behavior: `queryContractSnapshot()` hashes and returns a structured clone of the complete assembled contract; caller mutation does not escape that snapshot.
- Acceptance criteria: deep-clone the complete schema registry into every snapshot or recursively freeze the authoritative registry before exposure; prove nested mutations for error, unavailable, and preparation schemas cannot alter later snapshots, digest, ETag, or HTTP payload; retain exact route-reference and real-body parity.
- Validation results: independent nested isolation and ETag controls PASS; focused response/schema suite 12/12 PASS; full suite 371/371 PASS; syntax 83/83 PASS; replay PASS at 5,583.68 blocks/s.
- Compatibility impact: runtime response bodies need not change; the fix restores stable discovery and may make mutation attempts throw or affect only the caller-owned copy.
- Performance impact: four small bounded schemas plus the existing bounded discovery artifact are cloned per snapshot; full/replay checks show no bounded-performance regression.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-PREPARATION-UNAVAILABLE-SCHEMA-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: inspect all response-schema references, then inject noncanonical structure evidence containing an internal field name and POST JSON to both pool and bonding-curve preparation routes.
- Evidence: exactly two published 503 outcomes reference `preparation_unavailable_v1`. Both real routes return the exact required four-field fail-closed body and omit injected `fields`; the schema is closed, fixes both boolean values to false, requires a non-empty reason, and permits only an optional non-empty-string `missing` array.
- Affected contracts: pool and bonding-curve preparation 503 discovery, generated validators, structural-admission redaction, bot retry classification, and non-signable/non-submittable failure handling.
- Expected versus actual: every post-admission 503 on either preparation route must fit one closed preparation-specific envelope; observed structural failures and published route references match that contract.
- Acceptance criteria: assign the schema only to both preparation routes; require version/prepared/automationSafe/reason; allow only optional missing; normalize structural failure without exposing internal fields; preserve success, 400, and 404 behavior. All criteria are met.
- Validation results: independent reference cardinality 2/2 PASS; pool and token structural-envelope probes 2/2 PASS; focused suite 12/12 PASS; full suite 371/371 PASS; syntax and replay PASS.
- Compatibility impact: preparation structural 503 bodies intentionally migrate from generic `available:false` to preparation-specific `prepared:false, automationSafe:false`; other outcomes and routes are unchanged.
- Performance impact: one bounded static schema and a constant route-family branch; no suite or replay regression observed.
- Blockers: none.

## UPSTREAM-QA-HTTP-REPRESENTATION-DISCOVERY-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: inspect all published outcome entries, then compare declared body kind, exact content type, and body-required flag with real query-contract JSON, Prometheus metrics, static HTML, and cached 304 responses.
- Evidence: all 119 current published outcome entries carry complete representation objects. Real JSON, Prometheus, and HTML responses use the exact declared content types with nonempty bodies; query-contract 304 has no content type and an empty body as declared.
- Affected contracts: generated response parser selection, content negotiation assumptions, cached discovery handling, artifact digest, and ETag identity.
- Expected versus actual: every published outcome must select a deterministic parser or explicitly declare an empty body; actual published entries and representative runtime responses agree.
- Acceptance criteria: attach representation metadata to every published outcome; distinguish JSON, Prometheus text, HTML, and empty bodies; bind it into the digest; verify real response headers and body presence. All criteria are met.
- Validation results: 119/119 published entries structurally complete; four representation families match real HTTP; focused response/schema suite 15/15 PASS; full suite 374/374 PASS; syntax and replay PASS.
- Compatibility/performance impact: additive metadata changes the discovery digest/ETag only; runtime representations are unchanged and no bounded-performance regression was observed.
- Blockers: none.

## UPSTREAM-QA-HEALTH-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run the health projection regression and the full suite.
- Evidence: injected unknown store and diagnostic fields remain excluded from REST `GET /api/health`, JSON-RPC `getIndexerHealth`, and `GET /internal/feed/health`; established status/quality fields remain compatible.
- Affected contracts: REST, JSON-RPC, internal feed health, nested structure/chain/quality projections, and diagnostic redaction.
- Expected versus actual: explicit allowlists omit unknown fields and unhealthy state fails closed; actual behavior matches.
- Acceptance criteria: explicit projection allowlists at every health endpoint, stable documented fields/status, and green regression/replay checks.
- Validation results: full suite 348/348, syntax 84/84, and all replay invariants PASS.
- Compatibility/performance impact: additive hardening only; no established field removal or bounded-performance regression observed.
- Blockers: none.

## UPSTREAM-QA-TOKEN-PROJECTION-002

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: run the token balance/holder divergence regressions; independently corrupt an unrelated pool, then the requested mint projection, while querying holder and token-account REST routes.
- Evidence: unrelated pool corruption does not block valid mint-scoped responses; relevant mint divergence returns `indexed_holder_evidence_unavailable` and `indexed_token_account_evidence_unavailable`. Full token/account/holder regressions remain green.
- Affected contracts: REST holder/token-account projections, mint-scoped balance/snapshot evidence, explicit fields, and failure envelopes.
- Expected versus actual: unrelated aggregate evidence is isolated while relevant corruption fails closed; actual behavior matches.
- Acceptance criteria: mint-scoped isolation, stable explicit 503 reasons, unchanged successful shapes, and no unknown-field disclosure.
- Validation results: full suite 348/348, syntax 84/84, and all replay invariants PASS.
- Compatibility/performance impact: successful payloads remain unchanged and checks remain mint-scoped.
- Blockers: none.

## UPSTREAM-QA-OPS-PROVIDER-002

- Severity: `PASS` (resolved by `a5d60f6`, hardened by `7e78632` and `e8fb4c7`)
- Owner: `DEV`
- Reproduction: call `assessProviderConfiguration` with canonically equivalent loopback identities such as `http://LOCALHOST:80` and `http://localhost/`; directly validate RPC and WebSocket URLs containing userinfo, a non-root path, a query, or a fragment.
- Evidence: canonically equivalent RPC or WebSocket identities return `{ available: true, healthy: false, reason: "provider_configuration_invalid", mode: null }`. All eight independent authority cases throw the redacted `credential-free root URL` error, while a distinct IPv4/IPv6 two-pair topology returns healthy local-validator mode. Three focused committed regressions pass.
- Affected contracts: `npm run health:operational`, `upstream_operational_readiness` schema v2 `provider` check, aggregate `ready`, local polling/streaming qualification, operator incident response, and any QC/automation gate consuming the report.
- Expected behavior: local provider readiness is healthy only when RPC and WebSocket endpoint sets contain unique canonical credential-free loopback root URLs, remain within supported bounds, and are cardinality-compatible.
- Actual behavior: raw and canonical duplicate identities plus credential/path/query/fragment-bearing endpoints fail closed consistently with runtime constructors; valid distinct endpoint sets and external provider behavior remain available.
- Acceptance criteria: reject raw and canonical duplicate effective RPC/WebSocket endpoint sets; reject userinfo, non-root paths, queries, and fragments with a stable redacted reason; preserve root loopback, missing/public/mismatched/valid topology, external Helius/Alchemy, and secret-redaction behavior. All criteria are met.
- Validation results: independent canonical-duplicate, eight-case authority, and valid IPv4/IPv6 controls PASS; focused committed provider regressions 3/3 PASS; full suite 348/348 PASS; syntax 84/84 PASS; replay invariants PASS at 7,547.45 blocks/s with 8,902,232-byte heap growth.
- Compatibility impact: false-positive local `provider.healthy=true` results now fail closed; operators using credentials or non-root URL components must move those values out of local validator URLs. No REST/RPC/WebSocket payload changed.
- Performance impact: bounded parsing of at most four configured RPC and WebSocket endpoints; negligible relative to state/evidence loading.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-CLI-ENTRYPOINT-003

- Severity: `PASS` (resolved by `a6eb293`)
- Owner: `DEV`
- Reproduction: invoke `src/operational-readiness.js` through a workspace alias whose lexical path differs from the module file path but resolves to the same file; the prior lexical comparison could skip `main()` and return a silent success.
- Evidence: `isInvokedFile` now compares canonical real paths and falls back to deterministic resolved lexical paths only when file resolution fails. The injected same-file alias control returns true, a different-file control and empty invocation return false, and direct health smoke emits schema v2 with nine redacted blockers and exit 1.
- Affected contracts: scheduled `health:operational` execution, sandbox/workspace aliases, user-visible automation evidence, process exit status, and fail-closed readiness reporting.
- Expected behavior: every direct invocation of the readiness module executes `main()`, emits one bounded schema-v2 report, and exits nonzero when readiness is blocked, independent of equivalent workspace aliases.
- Actual behavior: canonical file identity selects direct invocation correctly while imported-module behavior and deterministic failure fallback remain unchanged.
- Acceptance criteria: compare file identity through canonical real paths; retain a deterministic non-throwing fallback; cover alias, different-file, and empty-invocation cases; demonstrate emitted fail-closed health evidence and nonzero blocked exit. All criteria are met.
- Validation results: focused readiness/provider regressions 3/3 PASS; direct health smoke emits twenty ordered checks, nine blockers, and exit 1; full suite 348/348 PASS; syntax 84/84 PASS; replay invariants PASS at 7,547.45 blocks/s with 8,902,232-byte heap growth; HEAD remained `a6eb293` and the DEV lock remained absent throughout the stable validation pass.
- Compatibility impact: no schema, configuration, REST, RPC, or WebSocket contract changed; direct aliased invocations that previously returned no evidence now correctly execute and can return blocked status.
- Performance impact: one bounded pair of filesystem real-path resolutions at CLI startup only; no replay/heap/throughput regression observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-CLI-ENTRYPOINT-004

- Severity: `PASS` (resolved by `c5e7495`)
- Owner: `DEV`
- Reproduction: create a filesystem junction to the repository and invoke `src/exporter-health.js` through that alias. Compare it with canonical-path invocation, then enumerate direct CLI guards that still compare `fileURLToPath(import.meta.url)` and `process.argv[1]` lexically.
- Evidence: source enumeration now finds zero legacy lexical guards and 32 direct consumers of `isInvokedFile`. Through a real junction, exporter health emits its 216-character fail-closed report and exits 1; backup and recovery usage gates, reduced preflight, and oracle snapshot emit nonempty failures with exit 1; inbox retention and dead-letter reconciliation emit nonempty dry-run results and exit 0.
- Affected contracts: scheduled job execution, health and qualification evidence, backup/recovery safety gates, ingestion/exporter activation, warehouse convergence, retention/reconciliation, all snapshot producers, automation exit status, and visible per-run reporting under workspace aliases.
- Expected behavior: every supported direct CLI executes exactly once through canonical or aliased workspace paths, imported modules remain side-effect free, and blocked commands emit their documented evidence with a nonzero exit.
- Actual behavior: all thirty previously affected CLIs now use the shared real-path guard; aliased commands execute instead of silently returning success, while direct and imported-module behavior remains stable.
- Acceptance criteria: migrate all 30 enumerated legacy direct-entrypoint guards to the shared helper; add a table-driven inventory regression proving no legacy lexical guard remains; exercise representative health, recovery/preflight, worker/sync, exporter/stream, retention/reconciliation, and snapshot commands through a real or injected alias; preserve direct and import behavior, output schemas, redaction, and blocked exit codes.
- Validation results: 30/30 migrated CLI outcomes PASS; inventory regression PASS with zero legacy guards; seven representative real-junction executions PASS; focused CLI inventory PASS; full suite 350/350 PASS; syntax 85/85 PASS; replay PASS at 5,196.11 blocks/s with 9,387,632-byte heap growth; stable HEAD `70279c1` and no DEV lock before or after validation.
- Compatibility impact: fixing the remaining guards changes only incorrectly silent aliased direct invocations; canonical direct invocation, imported-module behavior, command arguments, output schemas, and consumers must remain stable.
- Performance impact: at most one bounded real-path comparison at each CLI startup; no steady-state ingestion, API, persistence, or replay cost is expected.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-QUERY-CARDINALITY-001

- Severity: `PASS` (implemented by `70279c1`)
- Owner: `DEV`
- Reproduction: send each documented consumer/operator route a repeated query key, including pagination, windowing, quote, filtering, depth, wallet, token, pool, swap, and candle parameters; retain a valid request with four distinct keys as the compatibility control.
- Evidence: all twenty independent real HTTP requests return status 400 with `{ error: "bad_request", detail: "query parameters must appear at most once" }`; no key names or values are echoed. The distinct-key validator control does not throw.
- Affected contracts: REST/internal pagination and filtering, trending/candidate windows, quote and depth inputs, wallet history bounds, token/pool/swap catalogs, candle intervals, cache/signature identity, authentication/quota ordering, and client error classification.
- Expected behavior: repeated query names fail closed after authentication/base quota admission and before route parsing, while distinct names preserve existing successful or route-specific behavior.
- Actual behavior: a single bounded query-name pass rejects every duplicate consistently; response-success schemas, persistence, JSON-RPC, and WebSocket contracts are unchanged.
- Acceptance criteria: cover all twenty selected parameter boundaries with HTTP 400; use one stable redacted envelope; preserve a valid multi-parameter control; retain authentication/quota order and established route behavior. All criteria are met.
- Validation results: independent real HTTP matrix 20/20 PASS; focused CLI/query regressions 2/2 PASS; full suite 350/350 PASS; syntax 85/85 PASS; replay PASS at 5,196.11 blocks/s with 9,387,632-byte heap growth; operational health retains the expected nine blockers and production authorization false.
- Compatibility impact: only ambiguous repeated query names are rejected; clients must serialize each key at most once. Successful response schemas and non-HTTP contracts are unchanged.
- Performance impact: one linear pass over bounded request query names before routing; no replay, heap, ingestion, persistence, or API regression observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-QUERY-ALLOWLIST-002

- Severity: `PASS` (resolved by `f81cae3`)
- Owner: `DEV`
- Reproduction: call `validateAllowedQueryParameters` with `limit=1` on `/internal/tokens/:mint/market`, `/security`, `/liquidity`, and `/executable-depth`; compare the route implementation and documented executable-depth contract.
- Evidence: all four formerly ignored `limit` inputs now throw `BAD_REQUEST`. Market, security, and liquidity admit no query keys; executable depth admits only `side` and `amountRaw`; five documented token controls remain accepted.
- Affected contracts: authenticated token market/security/liquidity views, executable-depth bot input, cache and request-signature identity, client typo detection, fail-closed query semantics, and `UPSTREAM-HTTP-QUERY-ALLOWLIST-001-07`.
- Expected behavior: allowlists are view-specific: token/base, holders, trades, and OHLCV admit their used `limit`; OHLCV additionally admits `interval`; executable depth admits only `side` and `amountRaw`; market, security, and liquidity admit no query keys.
- Actual behavior: the token allowlist is now derived from the exact subview and matches the documented inputs.
- Acceptance criteria: derive the allowed set from the exact token subview; reject `limit` with stable redacted HTTP 400 on market, security, liquidity, and executable depth; add real HTTP regressions for all four; preserve valid base/holders/trades/OHLCV limits, OHLCV interval, depth side/amountRaw, authentication/quota order, and response schemas.
- Validation results: all 4 token corrections and all 19 WebSocket parity outcomes PASS; focused query/WebSocket regressions 7/7 PASS; full suite 355/355 PASS; syntax 86/86 PASS; replay PASS at 2,803.99 blocks/s with 9,768,512-byte heap growth.
- Compatibility impact: fixing the defect rejects only ignored token-subview keys; documented token limits and executable-depth inputs remain compatible.
- Performance impact: view-specific constant allowlists remain bounded to the number of query keys; no steady-state ingestion, persistence, or replay impact is expected.
- Blockers: none; the prior finding is closed.

## UPSTREAM-QA-QUERY-ENCODING-001

- Severity: `PASS` (resolved by `d21107d`)
- Owner: `DEV`
- Reproduction: call `hasCanonicalQueryEncoding` for `/api/v1/pools?limit=10&protocol=x` and `/api/v1/pools?protocol=x&limit=10`; compare the decoded parameter entries after sorting.
- Evidence: the boundary copies and sorts `URLSearchParams` before serialization. All twenty alternate-order HTTP/WebSocket cases now return false, while canonical controls are admitted and the prior two-order reproduction accepts only the sorted spelling.
- Affected contracts: REST and WebSocket request identity, cache keys, request signing, audit correlation, replay selection, client serialization guidance, and `UPSTREAM-QUERY-ENCODING-001-01`.
- Expected behavior: when the handoff promises one canonical wire spelling for semantically identical query input, the boundary admits only one deterministic parameter ordering in addition to canonical percent encoding.
- Actual behavior: one stable key-sorted spelling is enforced after authentication/quota admission for HTTP and WebSocket requests.
- Acceptance criteria: define a deterministic query-key order, reject or normalize alternate orders before signing/caching, apply the same rule to HTTP and WebSocket inputs, add multi-parameter real HTTP and WebSocket regressions, and preserve authentication/quota order plus established response/event schemas.
- Validation results: independent alternate-order matrix 20/20 PASS; focused query/WebSocket regressions 8/8 PASS; full suite 357/357 PASS; syntax 86/86 PASS; replay PASS at 5,388.77 blocks/s with 9,379,464-byte heap growth.
- Compatibility impact: clients using noncanonical parameter order must migrate to the documented deterministic encoder; decoded parameter values and response/event schemas remain unchanged.
- Performance impact: bounded comparison or sorting over the already bounded query-key set; no ingestion, persistence, or replay change is expected.
- Blockers: none; the prior finding is closed.

## UPSTREAM-QA-QUERY-DISCOVERY-001

- Severity: `PASS` (resolved by `efd6b5d`)
- Owner: `DEV`
- Reproduction: load `GET /api/v1/query-contracts`, generate a sorted subscription from its published global WebSocket parameter list, and try `/ws?mint=m&topic=blocks` or `/ws?eventType=e&topic=swaps`.
- Evidence: `topicContracts` now publishes blocks with no filters, swaps with mint/pool/protocol, and lifecycle/snapshots with eventType/mint/pool/protocol. All twenty discovery-to-parser combinations match independently.
- Affected contracts: WebSocket builder generation, SDK startup compatibility, cache/signature identity, subscription error handling, schema-version gating, and the stated drift-prevention purpose of `UPSTREAM-QUERY-DISCOVERY-001`.
- Expected behavior: the machine-readable artifact describes every rule required to construct an admissible subscription, including the allowed filter names per topic and any topic-specific exclusions.
- Actual behavior: the topic-to-filter compatibility map now matches runtime admission for all four topics.
- Acceptance criteria: publish a deterministic per-topic filter map for blocks, swaps, lifecycle, and snapshots; preserve global bounds and acknowledgement values; add real generated-builder regressions for valid and invalid topic/filter combinations; version the schema if compatibility requires it.
- Validation results: independent topic compatibility matrix 20/20 PASS; focused query/discovery/WebSocket suite 6/6 PASS; full suite 357/357 PASS; syntax 86/86 PASS; replay PASS at 3,905.30 blocks/s with 9,903,768-byte heap growth.
- Compatibility impact: additive metadata is sufficient if schema version 1 remains extensible; otherwise publish schema version 2 and require clients to reject unsupported versions. Existing WebSocket runtime behavior and events need not change.
- Performance impact: four bounded topic entries with small parameter arrays; negligible response and validation cost.
- Blockers: none; the prior finding is closed.

## UPSTREAM-QA-WS-DISCOVERY-002

- Severity: `PASS` (resolved by `2e17f41`)
- Owner: `DEV`
- Reproduction: generate minimum-valid, maximum-valid, empty, control-bearing, and oversized values for each published `eventType`, `mint`, `pool`, and `protocol` filter, then compare metadata-derived admission with `parseWebSocketSubscription`.
- Evidence: `webSocket.filterConstraints` now publishes all four names, optionality, minimum length 1, maximum length 64 UTF-16 code units, and forbidden control characters. All twenty independent generated-builder/runtime outcomes agree.
- Affected contracts: generated WebSocket builders, SDK validation, startup schema gating, retry/error classification, cache/signature identity, and the drift-prevention purpose of query discovery.
- Expected behavior: the discovery artifact publishes every generic filter-value boundary needed to decide whether a generated subscription is admissible before connection.
- Actual behavior: generated validation now matches runtime admission across the complete selected boundary.
- Acceptance criteria: publish minimum filter length 1 and an explicit control-character exclusion or equivalent character policy; apply it to every topic filter; add generated-builder parity cases for empty, control-bearing, maximum-length, and over-maximum values; preserve current runtime/event behavior and version deliberately if required. All criteria are met.
- Validation results: independent filter-value matrix 20/20 PASS; focused suite 7/7 PASS; full suite 357/357 PASS; syntax 86/86 PASS; replay PASS at 5,649.10 blocks/s with 9,562,808-byte heap growth.
- Compatibility impact: discovery replaces the prior maximum-only convenience field with the complete bounded object; runtime subscription and event behavior remain unchanged.
- Performance impact: four names and four scalar policies add only bounded metadata; no replay, heap, or throughput regression was observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-VALUE-DISCOVERY-001

- Severity: `PASS` (resolved by `6f71c6a`)
- Owner: `DEV`
- Reproduction: generate the documented minimum/maximum candle intervals plus `60.0`, `6e1`, and `060`, then compare published metadata, the shared query-value validator, and real pre-state HTTP responses.
- Evidence: the interval profile is now an exact enum with leading zeros forbidden. The two documented values are admitted while all three aliases are rejected; `60.0` and `6e1` return HTTP 400 before state evaluation.
- Affected contracts: generated HTTP validators/builders, candle/OHLCV query identity, cache and signature keys, startup compatibility checks, and retry/error classification.
- Expected behavior: the published interval value domain decides runtime admission exactly.
- Actual behavior: raw interval spelling is validated against the advertised enum before route state or numeric conversion.
- Acceptance criteria: either validate raw interval strings against the published enum before numeric conversion or publish an exact grammar covering every accepted spelling; add generated-validator/runtime parity regressions for decimal and exponent spellings; keep established documented values compatible. All criteria are met.
- Validation results: independent selected value matrix 20/20 PASS, including 5/5 interval boundaries; focused suite 4/4 PASS; full suite 359/359 PASS; syntax 86/86 PASS; replay PASS at 4,478.81 blocks/s.
- Compatibility impact: undocumented numeric aliases now fail with stable HTTP 400; documented candle interval values and response schemas remain compatible.
- Performance impact: one bounded enum lookup before route evaluation; no replay, heap, or throughput regression was observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-VALUE-DISCOVERY-002

- Severity: `PASS` (resolved by `6f71c6a`)
- Owner: `DEV`
- Reproduction: pass minimum-valid, maximum-valid, empty, control-bearing, and 65-code-unit pool values through generated validation and real bot-readiness HTTP admission.
- Evidence: valid 1- and 64-code-unit values are admitted; empty, control-bearing, and oversized values throw `BAD_REQUEST` and return HTTP 400 before readiness evaluation. The route also uses the shared `optionalFilter` boundary.
- Affected contracts: bot-readiness gating, generated HTTP validators/builders, client error classification, cache/signature identity, and automation input safety.
- Expected behavior: a route advertising `collectionFilter` enforces nonempty, at-most-64 UTF-16-code-unit, control-free values before business logic.
- Actual behavior: metadata-generated admission and runtime now agree across the complete selected filter boundary.
- Acceptance criteria: apply the shared collection-filter validation to bot-readiness `pool` before calling the store; add real HTTP parity regressions for empty, control-bearing, 64-code-unit, and oversized values; retain absent-pool and valid-pool behavior. All criteria are met.
- Validation results: independent selected value matrix 20/20 PASS, including 5/5 bot pool boundaries; focused suite 4/4 PASS; full suite 359/359 PASS; syntax 86/86 PASS; replay PASS at 4,478.81 blocks/s.
- Compatibility impact: invalid pool filters now fail with stable HTTP 400; valid and absent pool requests remain compatible.
- Performance impact: one bounded length/control check before readiness evaluation; no performance regression observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-VALUE-DISCOVERY-003

- Severity: `PASS` (resolved by `32f86d2`)
- Owner: `DEV`
- Reproduction: generate zero, one, u64 maximum, maximum plus one, and overlength executable-depth amounts from the published profile, then compare shared admission and real unhealthy-state HTTP behavior.
- Evidence: metadata now publishes `positive_u64_decimal_string`, minimum 1, maximum 18446744073709551615, and maximum length 20. The two valid boundaries are admitted and all three invalid boundaries are rejected before state access.
- Affected contracts: generated quote/depth validators, amount precision and overflow safety, pre-state error classification, cache/signature identity, and the claim that published value profiles match runtime.
- Expected behavior: `amountRaw` metadata and shared admission publish and enforce the positive-u64 boundary used by quote execution.
- Actual behavior: generated validation and runtime share the exact positive-u64 boundary before decision-state evaluation.
- Acceptance criteria: publish minimum 1 and maximum `18446744073709551615` or an equivalent exact positive-u64 contract; enforce it before decision-state evaluation on every query consumer; add zero, one, u64-max, and u64-max-plus-one generated-validator and real HTTP regressions. All criteria are met.
- Validation results: independent amount matrix 5/5 PASS; injected unhealthy HTTP controls return 400 for zero/overflow and 503 for valid maximum; focused 7/7 and full 361/361 pass; syntax 86/86 and replay pass.
- Compatibility impact: values already unusable for quotes now receive early stable 400; valid positive-u64 values and success schemas remain unchanged.
- Performance impact: bounded length/BigInt comparison before state access; no replay, heap, or throughput regression observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-REQUIREMENT-DISCOVERY-001

- Severity: `PASS` (resolved by `32f86d2`)
- Owner: `DEV`
- Reproduction: inject noncanonical `derivedLedgerQuality` into an otherwise structurally valid store, then omit quote amount, quote mint, and executable-depth amount; retain a valid u64-max depth request as the state-gate control.
- Evidence: all three missing-input requests return stable redacted HTTP 400 before state access; the valid request returns the injected HTTP 503. Required inputs resolve from the same template-keyed catalog published to clients.
- Affected contracts: generated required/optional HTTP builders, deterministic client-error classification, retry behavior, quote/depth safety, and the handoff's pre-state rejection guarantee.
- Expected behavior: missing advertised required parameters return stable redacted HTTP 400 after authentication/quota admission but before index or decision-state evaluation.
- Actual behavior: required-query admission now precedes decision state while retaining authentication, quota, and method ordering.
- Acceptance criteria: enforce route-specific required query parameters before structure/decision-state gates; cover quote and executable-depth under injected noncanonical structure-compatible decision state; preserve authentication, quota, method, and valid-request ordering. All criteria are met.
- Validation results: missing quote amount/mint and depth amount 3/3 PASS; valid maximum state-gate control PASS; all 54 route partitions and route-catalog parity checks PASS; focused 7/7 and full 361/361 pass.
- Compatibility impact: malformed requests under unhealthy state now receive client-error 400; valid requests and response-success schemas remain unchanged.
- Performance impact: bounded route/name checks before state evaluation; no performance regression observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-HTTP-EMPTY-QUERY-001

- Severity: `PASS` (implemented by `ca78cd3`)
- Owner: `DEV`
- Reproduction: send a query key to each of the twenty-two declared query-free RPC, diagnostic, preparation, detail, and static routes; retain six query-free paths as validator controls.
- Evidence: all twenty-two independent real HTTP requests return the stable redacted HTTP 400 unsupported-query contract; the six query-free validator controls remain admitted.
- Affected contracts: RPC, metrics, health/stats, ingestion/warehouse/backup/recovery, registry/feed/execution-policy diagnostics, pool/token preparation, evidence, price, transaction/token-account/pool/risk detail, and root/index documents.
- Expected versus actual: routes with no query dimension reject every query name after authentication/base quota admission while query-free requests retain established behavior; actual behavior matches.
- Acceptance criteria: 22 rejection cases, six no-query controls, stable redacted 400, unchanged POST bodies and success schemas, authentication and quota ordering. All criteria are met.
- Validation results: independent HTTP matrix 22/22 PASS; authentication/quota order PASS; focused query regressions 3/3 PASS; full suite 352/352 PASS; syntax 85/85 PASS; replay and operational-health checks PASS as designed.
- Compatibility/performance impact: clients must remove ignored query strings; one bounded query-name pass adds no observed replay or API regression.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-OPS-001

- Severity: `BLOCKED`
- Owner: `DEV`
- Reproduction: run `npm run health:operational`; load `data/index.json` and `data/mainnet-index.json` through `IndexStore.health(120000)`; assess retained `data/external-exporter-status.json` with the repository exporter-health contract.
- Evidence: the schema-v2 operational smoke exits 1 with nine ordered blockers: provider, index events, transactions, instructions, freshness, exporter, warehouse, backup, and recovery. RPC/WebSocket provider variables and default active exporter, warehouse checkpoint/failure, backup, and recovery files are absent. Both retained indexes fail closed with `status=wrong_network`, `healthy=false`, and `reason=indexed_block_mainnet_identity_missing_or_invalid`. Retained external evidence is finalized with zero recorded failures but fails `exporter_lagging` at 406,432 slots behind, a 512-slot maximum, and 413,655,693 ms age at the trigger time.
- Affected contracts: current ingestion freshness/finality, failover, warehouse convergence, backup/recovery readiness, public health, bot readiness, and live token/holder/whale/trader/pool/price/liquidity/volume qualification.
- Expected behavior: redacted fresh canonical-mainnet provider, exporter, exact warehouse convergence, backup, and recovery evidence are available; any missing, stale, lagged, malformed, or wrong-network input fails closed.
- Actual behavior: current live qualification cannot run; retained evidence correctly fails closed and was not treated as authoritative current mainnet data.
- Acceptance criteria: provide a redacted current canonical-mainnet operational evidence bundle with exact warehouse and fresh backup/recovery qualification while retaining every fail-closed boundary.
- Validation results: repository retry/failover, operational evidence, recovery, redaction, full regression, and replay checks pass; no provider, database, or production mutation was attempted.
- Compatibility/performance impact: no contract regression observed; sustained live ingestion and sink performance remain unqualified.
- Blockers: no configured provider endpoints or fresh active exporter/warehouse/backup/recovery evidence.

- NEXT_DEV_ACTION: conduct a fresh BA/PO-ranked audit of executable-depth, price, volume, bot-readiness, health, and diagnostic 503 bodies, select one structurally compatible dependency-ready family, and add closed discovery/runtime schema parity without merging incompatible envelopes.
