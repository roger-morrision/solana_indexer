# UPSTREAM-QA Solana Indexer QC/QA

- Run: `2026-08-29T16:36:06+07:00`
- Scope: `C:\Tuan\devApps\solana_indexer`
- Revision: `6ba46a92e9350471e3251aa5f8a8b4cc66931a6c`
- Compared with QA baseline: `21015cc520875c3a9cdf91464ec7014984045e15` (2 DEV commits, 3 changed files)
- Compared with `origin/main`: 72 ahead, 0 behind before this evidence report
- Latest DEV commits: `7d46813` (query-contract path-constraint closure) and `6ba46a9` (query-contract value-catalog closure)
- Overall result: 2 PASS, 0 FAIL, 0 BLOCKED, and 0 SKIP across the complete stable DEV delta. The query-contract bootstrap schema now closes its resource-identifier path profile and exact ten-profile query-value catalog. The existing schema-only Meteora authenticity finding remains 21/22 strict outcomes because `binArrayPayloadHash` still lacks independent finalized anchoring. Independent reconciliation remains 68 PASS, 1 FAIL, and 1 BLOCKED across 70 domains; live qualification is blocked by absent fresh canonical evidence.

## Reviewed DEV delta (2/20)

### Query-contract path and value-catalog closure (2 PASS)

| Item | Route | Status | Independent evidence |
|---|---|---|---|
| `UPSTREAM-QUERY-CONTRACTS-PATH-CONSTRAINTS-SCHEMA-020` | `/api/v1/query-contracts` / `pathValueConstraints` | `PASS` | The real sole resource-identifier profile validates with exact canonical segment kind, 1–256 decoded bounds, and false slash/control flags. Independent probes reject every missing, substituted, or wrong-type nested field; unknown outer/nested fields; missing profile; and null/array/scalar/number outer or nested shapes: 26/26 negatives reject. |
| `UPSTREAM-QUERY-CONTRACTS-VALUE-CATALOG-SCHEMA-021` | `/api/v1/query-contracts` / `valueConstraints` | `PASS` | The real exact ten-profile catalog validates in published order. Independent probes reject every omitted profile, unknown profile, five non-object substitutions for every profile, and five wrong outer shapes: 66/66 negatives reject. |

- Available DEV delta: exactly two distinct committed outcomes exist after `21015cc`, in `7d46813` and `6ba46a9`. QC detected the DEV writer lock and source movement after the first validation pass, discarded mixed/stale evidence, waited for release, refreshed the complete stable delta, and reran every tier. No additional distinct DEV outcome exists.
- Verification result: 2 PASS, 0 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 18; the stable delta contains exactly two distinct outcomes, and splitting path fields, catalog names, object types, bounds, safety flags, or individual mutation assertions would be padding.
- Validation: three real outer/nested objects and all 92 independent negative mutations PASS. Strict protocol-specific schema closure remains 21/22 PASS and 1/22 FAIL; the recomputed coupled Meteora mutation remains schema-valid because its payload hash is unanchored. Focused contract 3/3 and Meteora suites 19/19 PASS (12 contract/quote and 7 execution); 79 response schemas, eleven quote references, eleven instruction references, 28 dialect keywords, 29 relationship kinds, registry digest `71e7f5b4c06d03b5f3ef129a31ee36dd21ac49562c05d27abd2355acc84de97b`, and contract digest `a4b12aa260f3d585808c3fc6c24b0a2bae3a6fc4288b58fc28f938579f2edcd6` are structurally coherent; full suite 441/441 PASS; syntax 86/86 PASS; replay invariants PASS at 5,827.42 blocks/s with 9,663,856-byte heap growth; operational health emitted all 20 ordered checks, retained nine blockers, denied production mutation, and exited 1 as designed. Format, lint, typecheck, and build are `SKIP` because the repository defines no such scripts.

## Prior reviewed DEV delta (2/20; retained)

### Query-contract outcome and canonicalization closure (2 PASS)

- Prior exact shortfall: 18; prior validation was focused contract 3/3 and Meteora 19/19, full 441/441, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Query-contract nested bootstrap closure (2 PASS)

- Prior exact shortfall: 18; prior validation was focused contract 3/3 and Meteora 19/19, full 441/441, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Contract dialect and bootstrap closure (2 PASS)

- Prior exact shortfall: 18; prior validation was focused contract 3/3 and Meteora 19/19, full 441/441, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Meteora quote-reproduction instruction evidence and proof (2 PASS)

- Prior exact shortfall: 18; prior validation was focused 19/19, full 440/440, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Meteora finalized capacity commitment and execution reproduction (1 PASS, 1 FAIL)

- Prior exact shortfall: 18; prior validation was focused 12/12, full 440/440, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Meteora per-array fee/rate-capacity closure (2 FAIL)

- Prior exact shortfall: 18; prior validation was focused 11/11, full 439/439, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Meteora per-array amount-capacity closure (2 PASS)

- Prior exact shortfall: 18; prior validation was focused 11/11, full 439/439, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### OpenBook zero-output closure and Meteora quote publication (1 PASS, 1 FAIL)

- Prior exact shortfall: 18; prior validation was focused 5/5, full 435/435, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Pump buy rounding and OpenBook lot economics (1 PASS, 1 FAIL)

- Prior exact shortfall: 18; prior validation was focused 6/6, full 434/434, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (4/20; retained)

### Pump/Phoenix relationship closure and OpenBook quote publication (2 PASS, 2 FAIL)

| Item | Route | Status | Independent evidence |
|---|---|---|---|
| `UPSTREAM-PUMP-BONDING-SELL-QUOTE-SCHEMA-001` | token `prepare-swap` / Pump sell-v2 quote | `PASS` | The real sell quote validates; all five prior economic contradictions reject; and redistributing `protocolFeeRaw/creatorFeeRaw` from `10/3` to `0/13` while preserving the total rejects because `496e33f` binds each component to `ceil(grossQuoteAmountRaw * componentBps / 10000)`. |
| `UPSTREAM-PUMP-BONDING-BUY-QUOTE-SCHEMA-001` | token `prepare-swap` / Pump buy-exact-quote-in-v2 quote | `FAIL` | For spendable input `10004` with protocol and creator rates both `1` bps, the real constructor first computes `2+2` fees, corrects the net budget from `10001` to `10000`, and returns those unchanged fees. The new schema recomputes both as `ceil(10000/10000)=1`, so it rejects the real producer body. |
| `UPSTREAM-PHOENIX-QUOTE-SCHEMA-001` | pool `prepare-swap` / Phoenix IOC quote | `PASS` | The real `quoted/0` and `partial/1` controls validate, while isolated `partial/0` and `quoted/1` contradictions reject under the two conditional patterns added by `496e33f`. |
| `UPSTREAM-OPENBOOK-V2-QUOTE-SCHEMA-001` | pool `prepare-swap` / OpenBook place-take-order quote | `FAIL` | A real buy quote (`7500` in, `7402` consumed, `98` left, `3000` out, fee `2`, base lots `3`, quote lots `74`) validates, but changing only output to `2999` or fee to `1` also validates. The published schema omits lot sizes and taker-fee rate and therefore cannot bind either constructor-derived atom. |

- Available DEV delta: exactly four distinct outcomes exist after `79b2b95`: three remediation outcomes in `496e33f` and one OpenBook schema outcome in `29cb969`. QC detected source movement under the DEV writer lock, discarded mixed-state results, waited for lock release, refreshed the complete stable two-commit delta, and reran every tier. No additional DEV outcome exists.
- Verification result: 2 PASS, 2 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 16; the stable delta contains exactly four distinct outcomes, and splitting fields, relationship descriptors, mutation probes, or assertions would be padding.
- Validation: Pump sell and Phoenix positives/isolated contradictions PASS; the real Pump buy boundary is rejected; and OpenBook output-only and fee-only contradictions are admitted. Strict protocol-specific closure is 19/22 PASS and 3/22 FAIL (ten quote schemas are referenced, one remains null, eleven instruction schemas PASS). Focused committed schema/Pump/Phoenix/OpenBook suite 7/7 PASS; 77 response schemas, ten quote references, eleven instruction references, 28 dialect keywords, 23 relationship kinds, and digest `86c4bc88fbb330b8023677fa88708788d7643208c4f59f79a6b6c0ad82ee35a7` are structurally coherent; full suite 434/434 PASS; syntax 86/86 PASS; replay invariants PASS at 6,755.34 blocks/s with 9,651,352-byte heap growth; operational health emitted all 20 ordered checks, retained nine blockers, denied production mutation, and exited 1 as designed. Format, lint, typecheck, and build are `SKIP` because the repository defines no such scripts.

## Prior reviewed DEV delta (3/20; retained)

### Pump relationship repair and Phoenix quote closure (0 PASS, 3 FAIL)

| Item | Route | Status | Independent evidence |
|---|---|---|---|
| `UPSTREAM-PUMP-BONDING-SELL-QUOTE-SCHEMA-001` | token `prepare-swap` / Pump sell-v2 quote | `FAIL` | The five relationships added by `e97ec6d` reject all 5/5 prior contradictions. A fresh isolated mutation that preserves total fee but changes `protocolFeeRaw` from `10` to `0` and `creatorFeeRaw` from `3` to `13` still satisfies the closed schema even though the constructor computes each component as `ceil(grossQuoteAmountRaw * componentBps / 10000)`. |
| `UPSTREAM-PUMP-BONDING-BUY-QUOTE-SCHEMA-001` | token `prepare-swap` / Pump buy-exact-quote-in-v2 quote | `FAIL` | The five relationships added by `e97ec6d` reject all 5/5 prior contradictions. The equivalent `10/3` to `0/13` fee redistribution remains admitted although the constructor computes each component from `netQuoteInputRaw` and its corresponding basis points. |
| `UPSTREAM-PHOENIX-QUOTE-SCHEMA-001` | pool `prepare-swap` / Phoenix IOC quote | `FAIL` | The real `quoted`, zero-left body validates and all four aggregate relations are exact. Mutating only `status` to `partial` still validates, while `quotePhoenixSnapshotExactInput` deterministically emits `quoted` iff `amountLeftRaw` is zero and `partial` otherwise. None of the four relationships references `status`. |

- Available DEV delta: exactly three distinct outcomes exist after `eac71b8`: two Pump remediation outcomes in `e97ec6d` and one Phoenix quote-schema outcome in `322aca3`. QC detected the DEV writer lock and source movement during validation, withheld mixed-state results, waited for lock release, refreshed the complete stable two-commit delta, and reran every tier. No additional DEV outcome exists.
- Verification result: 0 PASS, 3 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 17; the stable delta contains exactly three distinct outcomes, and splitting relationship descriptors, fields, mutation probes, or assertions would be padding.
- Validation: real Pump sell/buy and Phoenix quote controls PASS; the ten previously reported Pump contradictions now reject 10/10, but two component-fee/BPS contradictions and one Phoenix status/left contradiction are admitted 3/3. Strict protocol-specific closure remains 17/22 PASS and 5/22 FAIL (nine quote schemas are referenced; two remain null; eleven instruction schemas PASS). Focused committed schema/Pump/Phoenix suite 3/3 PASS; 76 response schemas, nine quote references, eleven instruction references, 28 dialect keywords, 22 relationship kinds, and digest `aa56999b6cfe3d24c25c7af20d0ce05b8f01d74c71c4587909a70838cd2d2bce` are structurally coherent; full suite 433/433 PASS; syntax 86/86 PASS; replay invariants PASS at 6,989.39 blocks/s with 9,676,144-byte heap growth; operational health emitted all 20 ordered checks, retained nine blockers, denied production mutation, and exited 1 as designed. Format, lint, typecheck, and build are `SKIP` because the repository defines no such scripts.

## Prior reviewed DEV delta (4/20; retained)

### Pump bonding-curve instruction and quote schema parity (2 PASS, 2 FAIL)

| Item | Route | Status | Independent evidence |
|---|---|---|---|
| `UPSTREAM-PUMP-BONDING-SELL-INSTRUCTION-EVIDENCE-SCHEMA-001` | token `prepare-swap` / Pump sell-v2 catalog row | `PASS` | The shared schema exactly matches all twelve real constructor keys; the valid control passes and unknown credentials, three slot inversions, zero/overflow input, minimum above quote, unsupported token mode, and system recipient all reject (9/9 negatives). |
| `UPSTREAM-PUMP-BONDING-BUY-INSTRUCTION-EVIDENCE-SCHEMA-001` | token `prepare-swap` / Pump buy-exact-quote-in-v2 catalog row | `PASS` | The buy constructor emits the same twelve-key shape and satisfies the identical finalized-slot, token-program, positive-u64, output-bound, and recipient controls; committed buy construction and full-chain tests pass. |
| `UPSTREAM-PUMP-BONDING-SELL-QUOTE-SCHEMA-001` | token `prepare-swap` / Pump sell-v2 quote | `FAIL` | The real quote validates, but all 5/5 isolated constructor contradictions also validate: inconsistent net output, altered constant-product gross output, inconsistent total fee, fee basis points above 10,000, and gross output above real quote reserves. The schema declares no relationships. |
| `UPSTREAM-PUMP-BONDING-BUY-QUOTE-SCHEMA-001` | token `prepare-swap` / Pump buy-exact-quote-in-v2 quote | `FAIL` | The real quote validates, but all 5/5 isolated constructor contradictions also validate: inconsistent net input, altered constant-product base output, inconsistent total fee, fee basis points above 10,000, and base output above real token reserves. The schema declares no relationships. |

- Available DEV delta: `0955d76` adds two distinct BA/PO-selected instruction-evidence outcomes and `240684f` adds two direction-specific quote outcomes after `13ef829`. The complete delta was exhausted. Source advanced under the DEV writer lock during validation; QC withheld the transient checks against mixed state, refreshed from `0955d76` to clean stable `240684f`, and reran every tier. No additional DEV commit or enhancement exists.
- Verification result: 2 PASS, 2 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 16; the stable delta contains exactly four distinct protocol-schema outcomes, and splitting fields, contradiction probes, schema properties, or assertions would be padding.
- Validation: the independent generated-validator harness accepts both real quote shapes and both real instruction shapes, rejects 9/9 instruction negatives, and proves all 10/10 constructor-impossible quote economics are admitted. Strict protocol-specific closure advances to 17/22 PASS and 5/22 FAIL (eight quote schemas are referenced but the two Pump bonding quote variants fail semantic parity; all eleven instruction variants PASS; three quote variants remain null). Focused committed Pump suite 5/5 PASS; 75 response schemas, 18 declared relationship kinds, 28 dialect keywords, and digest `436aa8f4e0c860ad97c6d141944cb3dca55d566b9ddf2f17e039ff64d1b6df09` are structurally coherent; full suite 433/433 PASS; syntax 86/86 PASS; replay invariants PASS at 6,655.99 blocks/s with 9,511,080-byte heap growth; operational health emitted all 20 ordered checks, retained nine blockers, denied production mutation, and exited 1 as designed. Format, lint, typecheck, and build are `SKIP` because the repository defines no such scripts.

## Prior reviewed DEV delta (3/20; retained)

- `UPSTREAM-METEORA-DLMM-INSTRUCTION-EVIDENCE-SCHEMA-001`: `PASS`; legacy route-data and fee parity closed.
- `UPSTREAM-PHOENIX-IOC-INSTRUCTION-EVIDENCE-SCHEMA-001`: `FAIL` at the prior baseline; resolved by current `fabc123`.
- `UPSTREAM-OPENBOOK-V2-INSTRUCTION-EVIDENCE-SCHEMA-001`: `FAIL` at the prior baseline; resolved by current `fabc123`.
- Prior exact shortfall: 17; prior validation was focused 17/17, full 428/428, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-METEORA-DLMM-INSTRUCTION-EVIDENCE-SCHEMA-001`: `FAIL` at the prior baseline; resolved by current `5d92788` for its two remaining route-data/legacy-fee parity directions.
- `UPSTREAM-PHOENIX-IOC-INSTRUCTION-EVIDENCE-SCHEMA-001`: `FAIL` at the prior baseline; current `5d92788` resolves all four reported side/lot/output contradictions, while fresh independent verification retains the stable finding for expiry and u64 bounds.
- Prior exact shortfall: 18; prior validation was focused 9/9, full 427/427, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (3/20; retained)

- `UPSTREAM-QA-ORCA-WHIRLPOOL-QUOTE-SCHEMA-001`: `PASS`; exact tick-derived Q64.64 and bounded fee semantics remain closed.
- `UPSTREAM-QA-RAYDIUM-AMM-V4-QUOTE-SCHEMA-001`: `PASS`; reserve ceiling and integer constant-product output remain closed.
- `UPSTREAM-METEORA-DLMM-INSTRUCTION-EVIDENCE-SCHEMA-001`: `FAIL` at the prior baseline; `ecd46e0` resolves its four reported contradictions, while the current run independently identifies two remaining parity directions under the same stable finding.
- Prior exact shortfall: 17; prior validation was focused 34/34, full 426/426, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Quote-schema constructor parity (0 PASS, 2 FAIL)

- `UPSTREAM-QA-ORCA-WHIRLPOOL-QUOTE-SCHEMA-001`: `FAIL` at the prior baseline; resolved by current `2e3aae3`.
- `UPSTREAM-QA-RAYDIUM-AMM-V4-QUOTE-SCHEMA-001`: `FAIL` at the prior baseline; resolved by current `2e3aae3`.
- Prior exact shortfall: 18; prior validation was focused 2/2, full 425/425, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Quote-schema semantic parity (2 PASS)

- `UPSTREAM-QA-RAYDIUM-CPMM-QUOTE-SCHEMA-001`: `PASS`; transfer provenance and exact output conservation are bound.
- `UPSTREAM-QA-RAYDIUM-CLMM-QUOTE-SCHEMA-001`: `PASS`; tick cardinality, input/output conservation, and fee-mode semantics are bound.
- Prior exact shortfall: 18; prior validation was focused 7/7, full 423/423, syntax 86/86, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### Quote-schema constructor parity (0 PASS, 2 FAIL)

- `UPSTREAM-QA-RAYDIUM-CPMM-QUOTE-SCHEMA-001`: `FAIL` at the prior baseline; later resolved by `297987d` plus `3dd2483`.
- `UPSTREAM-QA-RAYDIUM-CLMM-QUOTE-SCHEMA-001`: `FAIL` at the prior baseline; later resolved by `297987d`.
- Prior exact shortfall: 18; prior validation was 423/423 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (4/20; retained)

### Preparation instruction-evidence slot-order parity (4 PASS)

| Item | Route | Status | Independent evidence |
|---|---|---|---|
| `UPSTREAM-QA-RAYDIUM-AMM-V4-INSTRUCTION-EVIDENCE-SCHEMA-001` | pool `prepare-swap` / AMM v4 catalog row | `PASS` | `7c22aac` publishes `stateSlot <= openOrdersSlot <= marketSlot <= balanceSlot`. Independent ordered and all-equal controls pass; each of the three direct inversions rejects. |
| `UPSTREAM-QA-ORCA-WHIRLPOOL-INSTRUCTION-EVIDENCE-SCHEMA-001` | pool `prepare-swap` / Orca catalog row | `PASS` | `7c22aac` publishes `stateSlot <= tickArraySlot <= balanceSlot <= mintEvidenceSlot`. Independent ordered and all-equal controls pass; each of the three direct inversions rejects. |
| `UPSTREAM-QA-RAYDIUM-CPMM-INSTRUCTION-EVIDENCE-SCHEMA-001` | pool `prepare-swap` / CPMM catalog row | `PASS` | `fde5d69` publishes `stateSlot <= configSlot <= balanceSlot <= mintEvidenceSlot`. Independent ordered and all-equal controls pass; each of the three direct inversions rejects. |
| `UPSTREAM-QA-RAYDIUM-CLMM-INSTRUCTION-EVIDENCE-SCHEMA-001` | pool `prepare-swap` / CLMM catalog row | `PASS` | `fde5d69` binds balance, tick-array, and AMM-config slots at or after state plus mint evidence at or after balance. Independent ordered and all-equal controls pass; all four direct inversions reject. |

- Available DEV delta: two selected BA/PO outcomes after `b95cdaf` produce four distinct schema-contract fixes across AMM v4, Orca, CPMM, and CLMM. The complete delta was exhausted after detecting the second DEV writer turn during validation, discarding mixed-state results, refreshing from `7c22aac` to stable `fde5d69`, and rerunning every tier.
- Verification result: 4 PASS, 0 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 16; no additional distinct DEV outcome exists after the QA baseline, and splitting individual relationship descriptors, equality controls, or inversion assertions would be padding.
- Validation: published `minimumProperty` bindings 13/13, ordered positives 4/4, equality-boundary positives 4/4, and direct inversion negatives 13/13 PASS; dialect declaration, snapshot isolation, and digest recomputation PASS. Strict protocol-specific closure advances to 4/22 PASS and 18/22 FAIL (0/11 quote and seven instruction variants still null). Focused committed suite 6/6 PASS; 61 response schemas and digest `6302fd57634f5c04d8dac63c014ee3e823316ddcbb98e23c21df4cc21f491140` are structurally coherent; full suite 421/421 PASS; syntax 86/86 PASS; replay invariants PASS at 5,542.14 blocks/s with 9,284,872-byte heap growth; operational health emitted all 20 ordered checks, retained nine blockers, denied production mutation, and exited 1 as designed. Format, lint, typecheck, and build are `SKIP` because the repository defines no such scripts.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-RAYDIUM-AMM-V4-INSTRUCTION-EVIDENCE-SCHEMA-001`: `FAIL` at the time; resolved by current `7c22aac`.
- `UPSTREAM-QA-ORCA-WHIRLPOOL-INSTRUCTION-EVIDENCE-SCHEMA-001`: `FAIL` at the time; resolved by current `7c22aac`.
- Prior exact shortfall: 18; prior validation was 419/419 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-RAYDIUM-CPMM-INSTRUCTION-EVIDENCE-SCHEMA-001`: `PASS`.
- `UPSTREAM-QA-RAYDIUM-CLMM-INSTRUCTION-EVIDENCE-SCHEMA-001`: `PASS`.
- Prior exact shortfall: 18; prior validation was 417/417 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-PREPARATION-VARIANT-DISCOVERY-001`: `PASS`.
- `UPSTREAM-QA-PREPARATION-IDENTITY-BINDING-001`: `PASS`.
- Prior exact shortfall: 18; prior validation was 415/415 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-PREPARATION-OUTPUT-EFFECT-BINDING-001`: `PASS`.
- `UPSTREAM-QA-PREPARATION-INPUT-DEBIT-BINDING-001`: `PASS`.
- Prior exact shortfall: 18; prior validation was 413/413 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-PREPARATION-SIMULATION-POLICY-SCHEMA-001`: `PASS`.
- `UPSTREAM-QA-PREPARATION-INSTRUCTION-AMOUNTS-SCHEMA-001`: `PASS`.
- Prior exact shortfall: 18; prior validation was 411/411 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-PREPARATION-HANDOFF-BINDING-SCHEMA-001`: `PASS`.
- `UPSTREAM-QA-PREPARATION-TRANSACTION-BOUNDARY-SCHEMA-001`: `PASS`.
- Prior exact shortfall: 18; prior validation was 409/409 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-RESPONSE-SCHEMA-DIALECT-KIND-001`: `PASS`.
- `UPSTREAM-QA-PREPARATION-SUCCESS-NESTED-BOUNDARY-001`: `FAIL` and partially remediated through current `9acccf5`; only protocol-specific quote and instruction-evidence projections remain open.
- Prior exact shortfall: 18; prior validation was 407/407 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-EXECUTION-POLICY-SEQUENCE-001`: `PASS`.
- `UPSTREAM-QA-RESPONSE-SCHEMA-DIALECT-KIND-001`: `FAIL` at the time; resolved by current `68852bb`.
- Prior exact shortfall: 18; prior validation was 405/405 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-TOKEN-ACCOUNT-SUCCESS-SCHEMA-001`: `PASS`.
- `UPSTREAM-QA-EXECUTION-POLICY-SEQUENCE-001`: `FAIL` at the time; resolved by current `bacec1a`.
- Prior exact shortfall: 18; prior validation was 403/403 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-GAP-FEED-SUCCESS-PROJECTION-001`: `PASS`.
- `UPSTREAM-HOLDERS-SUCCESS-PARITY-001`: `PASS`.
- Prior exact shortfall: 18; prior validation was 402/402 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-FEED-HEALTH-SUCCESS-PROJECTION-001`: `PASS`.
- `UPSTREAM-QA-GAP-FEED-SUCCESS-PROJECTION-001`: `FAIL` at the time; resolved by current `92eb8cd`.
- Prior exact shortfall: 18; prior validation was 401/401 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-INGESTION-SUCCESS-PROJECTION-001`: `PASS`.
- `UPSTREAM-QA-WAREHOUSE-SUCCESS-PROJECTION-001`: `PASS`.
- Prior exact shortfall: 18; prior validation was 400/400 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-QA-INDEX-HEALTH-SUCCESS-PROJECTION-001`: `PASS`.
- `UPSTREAM-QA-INGESTION-SUCCESS-PROJECTION-001`: `FAIL` at the time; resolved by current `48626f2`.
- Prior exact shortfall: 18; prior validation was 400/400 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (3/20; retained)

- `UPSTREAM-QA-INGESTION-SUCCESS-PROJECTION-001`: `FAIL` at the time; five semantic contradictions are fixed by current `5cdd2ed`, but nullable-tip compatibility remains open.
- `UPSTREAM-QA-WAREHOUSE-SUCCESS-PROJECTION-001`: `FAIL` and unchanged.
- `UPSTREAM-QA-INDEX-HEALTH-SUCCESS-PROJECTION-001`: `FAIL` at the time; resolved by current `d19fc42`.
- Prior exact shortfall: 17; prior validation was 400/400 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

- `UPSTREAM-BACKUP-SUCCESS-SCHEMA-001`: `PASS`.
- `UPSTREAM-RECOVERY-SUCCESS-SCHEMA-001`: `PASS`.
- Prior exact shortfall: 18; prior validation was 397/397 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (3/20; retained)

- `UPSTREAM-LEGACY-BLOCKS-SCHEMA-001`: `PASS`.
- `UPSTREAM-LEGACY-TRANSACTIONS-SCHEMA-001`: `PASS`.
- `UPSTREAM-STATS-SUCCESS-SCHEMA-001`: `PASS`.
- Prior exact shortfall: 17; prior validation was 395/395 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (3/20; retained)

- `UPSTREAM-POOL-RISK-TYPES-001`: `PASS`.
- `UPSTREAM-POOL-QUOTE-SUCCESS-SCHEMA-001`: `PASS`.
- `UPSTREAM-BOT-READINESS-SUCCESS-SCHEMA-001`: `PASS`.
- Prior exact shortfall: 17; prior validation was 393/393 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (4/20; retained)

- `UPSTREAM-TRANSACTION-FEE-TYPE-001`: `PASS`.
- `UPSTREAM-REGISTRY-SCHEMA-001`: `PASS`.
- `UPSTREAM-POOL-RISK-SCHEMA-001`: `FAIL` at the time; resolved by current `UPSTREAM-POOL-RISK-TYPES-001`.
- `UPSTREAM-CANDLES-SCHEMA-001`: `PASS`.
- Prior exact shortfall: 16; prior validation was 392/392 full, 86/86 syntax, and replay PASS.

## Prior reviewed DEV delta (2/20; retained)

### `UPSTREAM-EXECUTABLE-DEPTH-UNAVAILABLE-SCHEMA-001` (PASS)

| Item | Route | Status | Independent evidence |
|---|---|---|---|
| `UPSTREAM-EXECUTABLE-DEPTH-UNAVAILABLE-SCHEMA-001` | `/internal/tokens/{mint}/executable-depth` | `PASS` | The sole 503 outcome references `executable_depth_unavailable_v1`. Independent real sell and buy failures emit the bounded side-specific raw amount plus constant fail-closed execution flags; injected structure and decision failures emit the minimal three-field envelope. All four bodies satisfy the advertised allowed/required keys, internal structure names are redacted, the six-schema snapshot digest recomputes to `2d8f0cb4e9582c7987596417a40d9ef0938bf97fd2596a64cabb824e1f113aeb`, and nested snapshot isolation remains intact. |

- Available DEV delta: exactly 1 distinct fix/enhancement after `fb715b8`; the complete delta was exhausted.
- Verification result: 1 PASS, 0 FAIL, 0 BLOCKED, 0 SKIP.
- Exact fix/enhancement shortfall: 19; no additional distinct DEV outcome exists after the prior QA baseline, and splitting buy/sell forms, schema properties, or test assertions would be padding.
- Validation: independent discovery plus sell/buy/structure/decision HTTP matrix PASS; 119 outcome representations, 118 unique body-contract identities, and six response schemas are coherent; focused response/schema suite 16/16 PASS; full suite 375/375 PASS; syntax 86/86 PASS; replay invariants PASS at 4,084.29 blocks/s with 9,910,536-byte heap growth; operational health emitted all 20 ordered checks, retained nine blockers, denied production mutation, and exited 1 as designed. Format, lint, typecheck, and build are `SKIP` because the repository defines no such scripts.

## Prior reviewed DEV delta (49/20; retained)

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

## Independent 70-domain reconciliation

| Domain | Status | Concrete evidence |
|---|---|---|
| Path-parameter boundary | `PASS` | All 27 published template routes expose exact placeholder maps; 54 combined encoded-slash/noncanonical-unreserved probes and the prior `%ZZ` plus invalid-amount reproduction now return the canonical path error before query-value admission. |
| HTTP admission discovery | `PASS` | The published 14-stage order and status/retry/header outcomes match source and independent HTTP precedence probes across authentication, base quota, canonical path, query, and method boundaries. |
| HTTP route response discovery | `PASS` | All five cursor-paginated routes now publish non-retryable JSON 400 outcomes matching independent real `invalid_cursor` responses against canonical indexed state. |
| Decision-quality unavailable discovery | `PASS` | All 29 decision consumers publish exactly one retryable JSON 503 outcome; 24 are new and five retained heterogeneous controls remain correct. All 29 distinct real HTTP decision-failure probes return the advertised status family. |
| HTTP response representation discovery | `PASS` | All 119 published outcomes include a representation profile; independent JSON, Prometheus, HTML, and empty-304 responses match declared content types and body requirements. |
| HTTP body-contract identity | `PASS` | All 118 body-bearing outcomes publish unique stable derived version-1 identities bounded to 79 characters; the sole bodyless 304 publishes a null identity and repeated unmodified snapshot digests are stable. |
| HTTP response schema registry structure | `PASS` | The registry publishes 79 schemas with stable identities and canonical registry digest `71e7f5b4c06d03b5f3ef129a31ee36dd21ac49562c05d27abd2355acc84de97b`; the full contract digest is `a4b12aa260f3d585808c3fc6c24b0a2bae3a6fc4288b58fc28f938579f2edcd6`. Independent recomputation matches. Recursive enumeration confirms all 28 live schema-node keywords and all 29 used relationship kinds are declared with no unused entries. The discovery bootstrap's dialect, admission policy, canonicalization, resource path profile, and ten-profile value catalog are closed and fail safe under mutation. |
| Static asset unavailable schema | `PASS` | `/` and `/index.html` independently publish `static_asset_unavailable_v1`; real missing-asset requests return the exact sole-field sentinel body, while extra fields and alternate sentinels are rejected. |
| Feed-health unavailable schema | `PASS` | The nested ingestion projection now requires its stable fields, bounds optional evidence, and rejects unknown credential-bearing properties while retaining real absent and malformed evidence forms. |
| Feed-health success projection | `PASS` | The real combined healthy HTTP 200 body satisfies the closed index/exporter projection. Independent top-level freshness plus nested ingestion freshness, lag, and exact-progress negatives all reject. |
| Gap-feed success projection | `PASS` | The real HTTP 200 body satisfies the bounded schema; independent generated-style validation keeps the valid boundary and rejects all 5/5 stale, excessive-lag, inconsistent-progress, descending-slot, and divergent-cache variants. |
| Paginated success schema | `PASS` | All five page envelopes declare the shared `canonical_cursor_v1` semantic; independent null, valid, short, padded, and wrong-JSON probes match runtime decode/re-encode/version/key/scope admission. |
| Discovery/trending success schemas | `PASS` | Four distinct schemas match their real top-level envelopes, stable versions/constants, window vocabulary, ISO timestamp, methodology, and array fields; 16 positive/missing/extra/invalid-constant probes pass. |
| Token intelligence success schemas | `PASS` | Seven internal/public token intelligence routes publish closed schemas. Public and internal holder routes share `token_holders_success_v1`; the real public response contains exactly its 19 required fields, preserves `safeForAutomation:false`, and excludes injected credentials. |
| Wallet intelligence success schemas | `PASS` | Real wallet detail, performance, profile, funding, and funding-cluster responses satisfy their five schemas. The corrected funding-cluster union accepts canonical `classification:null` without weakening top-level closure or `safeForAutomation:false`; all five reject missing required and unknown top-level fields. |
| Detail and valuation success schemas | `PASS` | Nine routes now publish closed success schemas. The real token-account response contains exactly its ten required identity/balance/slot/state fields, excludes injected provenance/credentials, and rejects all 5/5 independent malformed or open-projection variants. |
| Decision-support success schemas | `PASS` | Registry, risk, and candles retain compatibility. Execution policy now publishes exact ordered and unique steps; independent validation preserves the real policy and rejects reordered, reversed, duplicate, and omitted-stage variants (4/4). |
| Automation-boundary success schemas | `PASS` | Pool quote and bot readiness now publish distinct closed schemas. Independent generated-style validation accepts the exact quote success projection and the actual healthy readiness-gate projection, rejects missing and unknown fields, and rejects unsafe quote or nonempty-ready-missing variants. |
| Swap-preparation success schema | `FAIL` | Top-level, handoff/binding, preparation/transaction, simulation-policy, universal amount-effect, catalog identity, and all eleven instruction-evidence variants are closed. All eleven quote schemas are referenced and ten retain constructor parity. Meteora direction, transfer fees, global traversal sums, endpoints, array membership, decoder ranges, and internally consistent per-array capacity commitments are bound, but a schema-only consumer still admits constructor-impossible economics when the producer recomputes a commitment over an unanchored payload hash. |
| Legacy collection success schema | `PASS` | Independent HTTP 200 requests confirm `/api/blocks` and `/api/transactions` remain bare arrays and both reference `legacy_collection_success_v1`; versioned cursor envelopes remain separate. |
| Stats success schema | `PASS` | Independent healthy `/api/stats` HTTP 200 emits exactly the 24 advertised aggregate and evidence fields with canonical structure/chain projections; missing, unknown credential-bearing, and wrong count-type variants are rejected. |
| Backup success schema | `PASS` | The real healthy backup projection satisfies the closed `backup_success_v1` contract. Independent canonical, missing-required, unknown credential-bearing, unhealthy, and malformed-identity probes confirm exact availability, freshness, identity, and completion-time constraints. |
| Recovery success schema | `PASS` | The real healthy recovery projection satisfies the closed `recovery_success_v1` contract. Independent canonical, missing-required, unknown credential-bearing, unhealthy, and malformed-identity probes confirm exact availability, freshness, identity, completion-time, and duration constraints. |
| Ingestion success projection | `PASS` | Strict ordering/uniqueness, freshness, lag, cursor ceiling, and exact-difference rules retain all prior negatives. A concrete-tip real HTTP 200 validates, while absent tip evidence now returns bounded HTTP 503 `invalid_validator_tip` and the success schema requires an integer tip. |
| Warehouse success projection | `PASS` | Nested closure and sequence/difference relationships remain intact. Property-relative freshness, lag, and oldest-retained-sequence bounds accept the real zero-sequence replay boundary and reject all 3/3 independent unsafe success mutations. |
| Index-health success projection | `PASS` | Independent real HTTP validation confirms nonzero instruction/program-event counts remain numeric, resolved dead-letter history is admitted when unresolved entries are zero, and the closed schema accepts the response. A stale healthy mutation is rejected by the property-relative freshness bound. |
| Decision-quality unavailable schemas | `PASS` | The 24 compatible decision consumers reference `basic_unavailable_v1`; 24 distinct structural-failure requests emit its exact three-field body without internal field names. Four heterogeneous controls retain null schemas after pool quote was typed separately. |
| Pool-quote unavailable schema | `PASS` | `quote_unavailable_v1` is referenced only by pool quote and accepts exactly its two fail-closed forms: structure/decision failures use three required fields, while unsupported-protocol/engine failures add only constant `automationSafe:false`. |
| Executable-depth unavailable schema | `PASS` | `executable_depth_unavailable_v1` is referenced only by executable depth. Independent real sell and buy route refusals, injected structure refusal, and injected decision refusal all satisfy its required/allowed keys, preserve constant fail-closed flags, and redact internal field names. |
| Price unavailable schema | `PASS` | `price_unavailable_v1` is referenced only by price. Independent detailed nominal-reference refusal plus injected structure and decision refusals satisfy its closed top-level keys, constant unsafe flag, bounded reference identity, and redaction. |
| Volume unavailable schema | `PASS` | `volume_unavailable_v1` is referenced only by volume. Five window variants plus injected structure and decision refusals satisfy its closed top-level keys, exact zero-valued count, bounded counts/window fields, constant incomplete/unsafe flags, and redaction. |
| Bot-readiness unavailable schema | `PASS` | The two-branch `oneOf` binds version 1 to required `available:false` and version 2 to required `ready:false`. Real version-1/version-2 bodies select exactly one branch; five missing, cross-version, or contradictory sentinel bodies select none. |
| Gap-feed unavailable schema | `PASS` | Real ingestion refusal plus injected structure and recovery refusals satisfy `gap_feed_unavailable_v1`, retain mandatory `available:false`, use only advertised top-level fields, and exclude unknown recovery state. |
| Public-health unavailable schema | `PASS` | Empty and structurally invalid retained indexes emit 503 bodies satisfying `index_health_unavailable_v1`: nonempty status/reason, constant `healthy:false`, and only explicitly typed public health projection fields. |
| Ingestion unavailable schema | `PASS` | Absent exporter status and invalid provider identity emit distinct fail-closed 503 forms that pass independent required, optional, type, constant, minimum, array-item, and closed-key validation against `ingestion_unavailable_v1`. |
| Warehouse unavailable schema | `PASS` | Absent and malformed checkpoints emit `checkpoint_unavailable` and `checkpoint_invalid` 503 forms that pass independent full-property validation against `warehouse_unavailable_v1` while retaining sequence, lag, age, and configured limits. |
| Backup unavailable schema | `PASS` | Exclusive variants retain all prior cross-form controls, and the stale branch now binds `ageMs` strictly above `maximumAgeMs`; independent below/equal/above probes select 0/0/1 branches. |
| Recovery unavailable schema | `PASS` | Exclusive variants retain identity, timestamp, and duration controls, and the stale branch now binds `ageMs` strictly above `maximumAgeMs`; independent below/equal/above probes select 0/0/1 branches. |
| Stats unavailable schema | `PASS` | A malformed persisted collection emits exactly the 24 required `stats_unavailable_v1` fields, passes independent type and closed-key validation, carries explicit invalid structure/chain evidence, and excludes health-only status fields. |
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
| Windows durable replacement retry | `PASS` | Atomic rename retry is limited to Windows transient `EACCES`/`EBUSY`/`EPERM`, eight attempts, and 355 ms cumulative delay; 20 repeated 32-write stress runs preserve the final value and leave no temporary residue. |
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
| Bounded performance | `PASS` | Full suite passes 441/441; syntax passes 86/86; replay completes at 5,827.42 blocks/s with 9,663,856-byte heap growth below 536,870,912 bytes. |
| Live operational qualification | `BLOCKED` | All six supported provider variables and active exporter, warehouse checkpoint/status, backup, and recovery files are absent while one retained external exporter artifact remains. Both retained indexes fail with `indexed_block_mainnet_identity_missing_or_invalid`; retained finalized exporter evidence has zero recorded failures but is 406,432 slots behind and 651,249,758 ms old at this trigger. |

The contract minimum is satisfied with 70 distinct evidence domains: 68 PASS, 1 FAIL, and 1 BLOCKED. These domains use separate contracts or failure boundaries and are not cosmetic splits.

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

## UPSTREAM-QA-EXECUTABLE-DEPTH-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (implemented by `50d2615`)
- Owner: `DEV`
- Reproduction: inspect the 503 outcome for `/internal/tokens/{mint}/executable-depth`, then issue valid positive-u64 sell and buy requests against a fresh empty store; repeat with injected noncanonical structure and decision evidence. Validate each response against the referenced response schema's required and allowed keys.
- Evidence: discovery references only `executable_depth_unavailable_v1`. Real sell refusal contains `amountRaw`; real buy refusal contains `spendableQuoteRaw`; both include constant `available:false`, `executable:false`, `safeForAutomation:false`, and `selfHosted:true`. Structure and decision refusals contain exactly `schemaVersion`, `available`, and `reason`; the injected internal field name is absent. The schema digest independently recomputes to `2d8f0cb4e9582c7987596417a40d9ef0938bf97fd2596a64cabb824e1f113aeb`.
- Affected contracts: executable-depth discovery, generated validators, sell/buy route refusal, decision-quality and structural fail-closed gates, exact raw amount identity, automation safety, schema digest/ETag, and downstream retry classification.
- Expected behavior: every post-admission executable-depth 503 body fits one explicitly advertised closed top-level union without weakening execution flags or exposing internal structure evidence.
- Actual behavior: runtime and discovery match across the minimal structure/decision envelope and the detailed side-specific route-refusal envelope.
- Acceptance criteria: publish one route-scoped schema; require schema version 1, unavailable false, and nonempty reason; constrain optional execution flags to their fail-closed constants; admit only the sell or buy raw amount field actually emitted; preserve nullable evidence and bounded missing-evidence names; reject undeclared top-level fields. All criteria are met.
- Validation results: independent discovery plus sell/buy/structure/decision matrix PASS; focused response/schema suite 16/16 PASS; full suite 375/375 PASS; syntax 86/86 PASS; replay invariants PASS at 4,084.29 blocks/s with 9,910,536-byte heap growth; operational readiness remains safely blocked with production mutation false.
- Compatibility impact: additive discovery only; runtime payloads, statuses, endpoints, persistence, RPC, WebSocket, and configuration are unchanged. Consumers can validate both sides and must default omitted execution flags to non-executable behavior.
- Performance impact: one small static discovery schema and one route-reference check; no replay, heap, or full-suite regression observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-PRICE-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (implemented by `1b697fd`)
- Owner: `DEV`
- Reproduction: inspect the 503 outcome for `/api/v1/price/{mint}`, request a valid mint against a fresh store, then repeat with injected noncanonical structure and decision evidence. Validate each body against the referenced schema's required, allowed, type, constant-value, and minimum-length constraints.
- Evidence: discovery references only `price_unavailable_v1`. The detailed refusal contains mint, constant unsafe automation, bounded `nominal_usd_via_mainnet_usdc` reference identity, reason, and missing evidence. Structure and decision refusals contain exactly `schemaVersion`, `available`, and `reason`; the injected internal field name is absent.
- Affected contracts: price discovery, generated validators, nominal-USDC reference refusal, decision/structure gates, automation safety, schema digest/ETag, and downstream retry classification.
- Expected behavior: every post-admission price 503 body fits one advertised route-scoped closed top-level union without implying price availability or exposing internal evidence.
- Actual behavior: runtime and discovery match across the detailed reference refusal and both minimal quality refusals.
- Acceptance criteria: publish one route-scoped schema; require schema version 1, unavailable false, and nonempty reason; constrain optional automation safety false and the reference vocabulary; preserve bounded mint and missing-evidence fields; reject undeclared top-level fields. All criteria are met.
- Validation results: independent detail/structure/decision matrix PASS; focused response/schema suite 18/18 PASS; full suite 377/377 PASS; syntax 86/86 PASS; replay invariants PASS at 4,476.73 blocks/s with 9,251,392-byte heap growth.
- Compatibility/performance impact: additive discovery only with one small static schema/reference check; runtime payloads and non-HTTP contracts are unchanged, and no replay, heap, or full-suite regression was observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-VOLUME-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (implemented by `2b97af5`)
- Owner: `DEV`
- Reproduction: inspect the 503 outcome for `/api/v1/volume/{mint}`, request each published window against a fresh store lacking a robust USD reference, then repeat with injected noncanonical structure and decision evidence. Validate each body against the referenced schema.
- Evidence: discovery references only `volume_unavailable_v1`. All five window requests contain exact positive window seconds, nonnegative counts, `valuedSwaps:0`, constant incomplete/unsafe flags, a nested reference object, reason, and missing evidence. Structure and decision refusals contain exactly the minimal three fields; injected internal field names are absent. The eight-schema digest independently recomputes to `2e1c87282d1f79aec7d55a1abd6ee69b832958d7081a4b8138e58560e15df1f3`.
- Affected contracts: volume discovery, generated validators, windowed USD-volume refusal, price-reference provenance, count precision, decision/structure gates, automation safety, digest/ETag, and downstream analytics/retry behavior.
- Expected behavior: every post-admission volume 503 body fits one advertised route-scoped closed top-level union and incomplete/unvalued windows remain unusable for analytics and automation.
- Actual behavior: runtime and discovery match across every published window's detailed refusal and both minimal quality refusals.
- Acceptance criteria: publish one route-scoped schema; require schema version 1, unavailable false, and nonempty reason; constrain optional completeness/safety false and valued count zero; bound integer counts/window, mint, reference, and missing evidence; reject undeclared top-level fields. All criteria are met.
- Validation results: independent five-window detail plus structure/decision matrix PASS; focused response/schema suite 18/18 PASS; full suite 377/377 PASS; syntax 86/86 PASS; replay invariants PASS at 4,476.73 blocks/s with 9,251,392-byte heap growth.
- Compatibility/performance impact: additive discovery only with one small static schema/reference check; runtime payloads and non-HTTP contracts are unchanged, and no replay, heap, or full-suite regression was observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-BOT-READINESS-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (resolved by `8eea511`)
- Owner: `DEV`
- Reproduction: load `bot_readiness_unavailable_v1` from query discovery, validate real version-1 and version-2 refusals against every `oneOf` branch, then validate missing, cross-version, and contradictory sentinel bodies against the same branches.
- Evidence: real version-1 and version-2 runtime bodies each select exactly one branch. `{schemaVersion:1,reason:"x"}`, `{schemaVersion:2,reason:"x"}`, `{schemaVersion:1,ready:false,reason:"x"}`, `{schemaVersion:2,available:false,reason:"x"}`, and the version-1 body containing both false sentinels select zero branches. Each branch is closed and binds its schema version to the applicable constant false sentinel.
- Affected contracts: bot-readiness discovery, generated validators, schema-version branching, automation admission, dependency health gating, startup compatibility checks, and downstream handling of HTTP 503.
- Expected behavior: version 1 requires `available:false` and excludes `ready`; version 2 requires `ready:false` and excludes `available`; a body with neither sentinel or the wrong sentinel for its version is rejected before application handling.
- Actual behavior: the published exclusive union enforces the expected version-aware sentinel and rejects every independently generated invalid form.
- Acceptance criteria: publish a machine-readable exclusive union; bind version 1 to required constant `available:false` and version 2 to required constant `ready:false`; reject missing, cross-version, and contradictory sentinel combinations; retain real version-1/version-2 controls and fail-closed runtime behavior. All criteria are met.
- Validation results: real branch exclusivity 2/2 PASS; independent invalid-body rejection 5/5 PASS; focused response/schema suite 21/21 PASS; full suite 380/380 PASS; syntax 86/86 PASS; replay invariants PASS at 7,229.18 blocks/s with 9,650,936-byte heap growth.
- Compatibility/performance impact: discovery now requires `oneOf` support from generated clients and correctly rejects invalid legacy interpretations; runtime bodies are unchanged. Validation adds only a bounded two-branch check, with no replay or full-suite regression.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-INDEX-HEALTH-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (implemented by `3f2858f`)
- Owner: `DEV`
- Reproduction: inspect the 503 outcome for `/api/health`, exercise an empty store and a structurally invalid retained store, and validate both response bodies against `index_health_unavailable_v1` including closed top-level keys and public projection types.
- Evidence: discovery references only `index_health_unavailable_v1`. Both bodies contain nonempty status and reason with constant `healthy:false`; the empty-state body reports `no_indexed_blocks`, the invalid-state body reports `indexed_state_structure_invalid`, and both expose only the explicit public health projection allowlist. The 11-schema registry digest independently recomputes to `7c0cd90e989eb51022eb8849eaa27e668d91e38e8de814e7314943743be84288`.
- Affected contracts: public health discovery, generated validators, retained-index structure/freshness/finality failure projection, fail-closed client admission, schema digest/ETag, and secret-safe operational diagnostics.
- Expected versus actual behavior: every public-health 503 body requires nonempty status/reason, constant `healthy:false`, and only explicitly typed public projection fields; runtime and discovery match for both independent failure modes.
- Acceptance criteria: publish one route-scoped closed schema; require status, healthy false, and reason; bound the optional public projection; cover empty and invalid retained-state failures; preserve redaction and additive compatibility. All criteria are met.
- Validation results: independent empty/invalid-state matrix PASS; focused response/schema suite 21/21 PASS; full suite 380/380 PASS; syntax 86/86 PASS; replay invariants PASS at 7,229.18 blocks/s with 9,650,936-byte heap growth.
- Compatibility/performance impact: additive discovery with one small static schema/reference check; runtime payloads and non-HTTP contracts are unchanged, and no regression was observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-GAP-FEED-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (implemented by `959c43b`)
- Owner: `DEV`
- Reproduction: inspect the 503 outcome for `/internal/feed/gaps`, request it against missing exporter evidence, then repeat with injected noncanonical structure and recovery evidence. Validate each response against the referenced schema's required and allowed top-level fields.
- Evidence: discovery references only `gap_feed_unavailable_v1`. The ingestion refusal contains the required unavailable envelope plus bounded ingestion, durable skipped slots, reorg corrections, and checkpoint projections; structural refusal adds only the advertised field-name array; recovery refusal is the exact three-field minimum. Unknown injected recovery fields are absent.
- Affected contracts: gap-feed discovery, generated validators, exporter/gap diagnostics, recovery refusal, structural diagnostics, recovery cursor admission, schema digest/ETag, and secret-safe projections.
- Expected versus actual behavior: every gap-feed 503 body retains `schemaVersion:1`, `available:false`, a nonempty reason, and only its declared top-level evidence; runtime matches.
- Acceptance criteria: one route-scoped schema; exact required unavailable envelope; bounded optional diagnostic families; structural/recovery/ingestion real controls; unknown recovery-state redaction. All criteria are met.
- Validation results: independent ingestion/structure/recovery matrix PASS; focused response/schema suite 20/20 PASS; full suite 379/379 PASS; syntax 86/86 PASS; replay invariants PASS at 4,942.77 blocks/s with 10,194,680-byte heap growth.
- Compatibility/performance impact: additive discovery only with a small static schema/reference check; runtime and non-HTTP contracts are unchanged, and no regression was observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-INGESTION-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (implemented by `f5b68d7`)
- Owner: `DEV`
- Reproduction: inspect the 503 outcome for `/api/v1/ingestion`, request it with no exporter status, then supply a structurally complete status with an invalid provider identity. Validate every returned property against `ingestion_unavailable_v1`, including required/optional keys, types, constant values, minima, array items, and closed top-level projection.
- Evidence: discovery references only `ingestion_unavailable_v1`. The absent form validates with `available:false`, `healthy:false`, and `status_unavailable`; the invalid-provider form validates with `available:true`, `healthy:false`, `automationEligible:false`, and `invalid_source`. Both retain exact progress/limit types, explicit exporter/index projections, and no undeclared top-level provider diagnostics. The 13-schema digest independently recomputes to `da9c74924eab884d6dd7f9b982d9fba7ddabdd62e4b8b9efa2d1812f2020b816`.
- Affected contracts: ingestion discovery, generated validators, exporter availability and automation eligibility, provider identity, progress/freshness/finality limits, public index projection, bot-readiness dependency gating, schema digest/ETag, and diagnostic redaction.
- Expected versus actual behavior: every ingestion 503 body is unhealthy, preserves the distinction between absent and present-but-unsafe exporter evidence, and fits the declared closed top-level schema; runtime and discovery match.
- Acceptance criteria: publish one route-scoped schema; require health/reason/progress limits and exporter/index projections; bound optional identity/finality/progress evidence; cover absent and invalid-provider responses; reject undeclared top-level diagnostics. All criteria are met.
- Validation results: independent full-property absent/invalid matrix 2/2 PASS; focused response/schema/durability suite 5/5 PASS; full suite 382/382 PASS; syntax 86/86 PASS; replay invariants PASS at 5,176.27 blocks/s with 9,495,504-byte heap growth.
- Compatibility/performance impact: additive discovery only; runtime bodies and storage/RPC/WebSocket contracts are unchanged. One small static schema/reference check introduced no observed regression.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-WAREHOUSE-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (implemented by `77b7438`)
- Owner: `DEV`
- Reproduction: inspect the 503 outcome for `/api/v1/warehouse`, request it with no checkpoint, then with a malformed empty checkpoint. Validate every returned property against `warehouse_unavailable_v1`, including required/optional keys, types, constant values, minima, and closed top-level projection.
- Evidence: discovery references only `warehouse_unavailable_v1`. The absent and malformed forms validate as `checkpoint_unavailable` and `checkpoint_invalid`; both require `healthy:false`, availability, sequence/event-sequence, lag, age, staleness, and configured lag limits. Optional network, sink, reconciliation, replay-history, and aggregate failure families are explicitly admitted at the top level and undeclared fields are rejected.
- Affected contracts: warehouse discovery, generated validators, exact-convergence and replay-history gating, sink/reconciliation diagnostics, bot-readiness dependency gating, schema digest/ETag, and operational redaction.
- Expected versus actual behavior: every warehouse 503 body remains fail-closed and fits one declared top-level contract containing exact convergence limits; runtime and discovery match for both independent failure modes.
- Acceptance criteria: publish one route-scoped closed top-level schema; require health/reason and sequence/lag/age limits; admit only bounded operational families; cover absent and malformed checkpoints without changing runtime or persistence. All criteria are met.
- Validation results: independent full-property absent/malformed matrix 2/2 PASS; focused response/schema/durability suite 5/5 PASS; full suite 382/382 PASS; syntax 86/86 PASS; replay invariants PASS at 5,176.27 blocks/s with 9,495,504-byte heap growth.
- Compatibility/performance impact: additive discovery only; runtime bodies, checkpoint/status persistence, REST status, RPC, WebSocket, and configuration are unchanged. No regression was observed.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-DURABLE-WINDOWS-RENAME-RETRY-001

- Severity: `PASS` (implemented by `77b7438`)
- Owner: `DEV`
- Reproduction: inspect `writeDurably` replacement policy on Windows, then repeat the 32-write same-process concurrency stress test twenty times and verify the final submitted value and absence of `*.tmp` residue after every run.
- Evidence: retry is reachable only on Windows and only for `EACCES`, `EBUSY`, or `EPERM`. Eight attempts use bounded exponential delays of 5, 10, 20, 40, 80, 100, and 100 ms before the last attempt, totaling at most 355 ms. Non-Windows, non-transient, and exhausted failures rethrow; the existing `finally` path removes the temporary file. All 20 independent stress repetitions pass, covering 640 submitted replacements without residue.
- Affected contracts: durable atomic replacement, checkpoint/status persistence, same-process serialization, crash recovery, Windows antivirus/indexer contention, temporary-file cleanup, and bounded shutdown/operational readiness.
- Expected versus actual behavior: transient Windows rename interference receives a short bounded retry opportunity while all other failures remain immediate and fail closed; source and stress evidence match.
- Acceptance criteria: retry only documented transient Windows errors; keep attempt/time bounds finite; retain flush/close/rename/parent-sync order and cleanup; preserve final submission order under repeated concurrency stress. All criteria are met.
- Validation results: repeated 32-write durability stress 20/20 PASS; focused response/schema/durability suite 5/5 PASS; full suite 382/382 PASS; syntax 86/86 PASS; replay invariants PASS at 5,176.27 blocks/s with 9,495,504-byte heap growth.
- Compatibility/performance impact: no format, API, persistence-layout, or configuration change. Worst-case qualifying rename delay is bounded to 355 ms; normal writes add no delay, and replay/full-suite results remain bounded.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-STATS-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (implemented by `289efcf`)
- Owner: `DEV`
- Reproduction: inspect the 503 outcome for `/api/stats`, corrupt two persisted collection shapes, request the route, and validate every response property against `stats_unavailable_v1` including required keys, types, and closed top-level projection.
- Evidence: discovery references only `stats_unavailable_v1`. The real response is HTTP 503 with exactly 24 required fields, `structure.canonical:false`, reason `indexed_state_structure_invalid`, and `chain.invalidStateStructure:true`; it passes independent full-property validation and contains neither `status` nor `healthy` nor any undeclared top-level field. The 16-schema digest independently recomputes to `f7822a9a698c131c6b42c2c72dedf92908ee0053549ef787352b05ce6655e7ed`.
- Affected contracts: stats discovery, generated monitoring validators, quarantined counter projection, structure/chain diagnostics, schema digest/ETag, redaction, and commercial monitoring availability.
- Expected versus actual behavior: quarantined stats remain a complete redacted diagnostic projection rather than canonical health, and every runtime field fits the advertised closed schema; runtime and discovery match.
- Acceptance criteria: publish one route-scoped schema; require the complete stats/structure/chain projection; reject health-only and unknown fields; cover a real malformed persisted state. All criteria are met.
- Validation results: independent 24/24 field/type/closed-key validation PASS; focused suite 5/5 PASS; full suite 385/385 PASS; syntax 86/86 PASS; replay invariants PASS at 5,660.45 blocks/s with 9,709,752-byte heap growth.
- Compatibility/performance impact: additive discovery only; runtime, persistence, RPC, WebSocket, and configuration are unchanged. One static schema/reference check introduced no observed regression.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-BACKUP-RECOVERY-UNAVAILABLE-DISCRIMINATOR-001

- Severity: `PASS` (resolved by `b86569d`)
- Owner: `DEV`
- Reproduction: load both exclusive unions, replay the prior eight missing/cross-form bodies, then validate canonical-identity stale bodies below, equal to, and one millisecond above `maximumAgeMs`.
- Evidence: both stale variants now declare `exclusiveMinimumProperty:"maximumAgeMs"`. Independent backup and recovery probes at 999/1000/1001 against maximum 1000 select 0/0/1 branches; all prior cross-form controls and real runtime forms remain exclusive.
- Affected contracts: backup and recovery discovery, generated validators, RPO/RTO failure handling, isolated recovery promotion gates, backup identity, canonical timestamps, temporal freshness/future classification, operational health, schema digest/ETag, and downstream consumer disabling.
- Expected versus actual behavior: a stale branch requires `ageMs > maximumAgeMs` while all cross-form union rules remain; source, generated-validator probes, and runtime threshold now match.
- Acceptance criteria: add a machine-readable relative constraint binding stale `ageMs` strictly above `maximumAgeMs` in both unions; reject below/equal threshold controls; retain the prior 8/8 negatives and real exclusive-branch HTTP controls.
- Validation results: independent below/equal/above threshold matrix 6/6 PASS; focused real-route/schema suite 6/6 PASS; full suite 385/385 PASS; syntax 86/86 PASS; replay invariants PASS at 5,260.39 blocks/s.
- Compatibility impact: discovery is more precise and generated validators must support the declared sibling-property comparison; canonical runtime bodies, persistence, RPC, and WebSocket are unchanged.
- Performance impact: one bounded integer comparison per stale validation; no replay, heap, or full-suite regression observed.
- Blockers: none; the defect is closed.

## UPSTREAM-QA-STATIC-ASSET-UNAVAILABLE-SCHEMA-001

- Severity: `PASS` (implemented by `80b96f1`)
- Owner: `DEV`
- Reproduction: inspect the retryable 503 outcomes for `/` and `/index.html`, replace the configured regular asset with a directory, request both routes, and validate the response against `static_asset_unavailable_v1`.
- Evidence: both routes reference the shared closed schema but retain distinct stable body-contract identities. Each real route returns HTTP 503 with exactly `{error:"static_asset_unavailable"}`; independent validation accepts that body and rejects both an undeclared field and alternate error sentinel.
- Affected contracts: static document availability, response discovery, generated validators, content type, retry classification, contract identity, schema digest/ETag, and bounded internal-failure telemetry.
- Expected versus actual behavior: both static routes expose a machine-readable exact 503 body while successful HTML serving remains unchanged; discovery and runtime match.
- Acceptance criteria: publish one exact closed schema; reference it from both routes; validate both real failure bodies; retain distinct route contract identities and successful HTML behavior. All criteria are met.
- Validation results: independent static probes 5/5 PASS; focused real-route/schema suite 6/6 PASS; full suite 385/385 PASS; syntax 86/86 PASS; replay invariants PASS at 5,260.39 blocks/s.
- Compatibility/performance impact: additive discovery only; successful static serving, runtime body, persistence, RPC, WebSocket, and configuration are unchanged. No bounded-performance regression observed.
- Blockers: none.

## UPSTREAM-QA-FEED-HEALTH-UNAVAILABLE-PROJECTION-001

- Severity: `PASS` (resolved by `2241f55`)
- Owner: `DEV`
- Reproduction: obtain a real absent-exporter `/internal/feed/health` 503 body, recursively validate `ingestion`, then add `providerCredential:"must-not-pass"` and repeat.
- Evidence: `ingestion` now requires ten stable fields, explicitly lists six bounded optionals, sets `additionalProperties:false`, and types every nested property. The real response validates, while the credential-bearing body is rejected.
- Affected contracts: feed-health discovery, nested ingestion projection, generated monitoring validators, provider telemetry redaction, fail-closed live-feed disabling, schema digest/ETag, and commercial consumer safety.
- Expected versus actual behavior: the schema constrains `ingestion` to the exact bounded redacted projection and rejects unknown credential/provider identity material; discovery and runtime now match.
- Acceptance criteria: publish a closed nested ingestion schema or exact referenced projection; require its stable fields/types/constants; reject unknown nested fields and a credential-bearing negative; retain real absent/malformed positive forms and top-level closure.
- Validation results: independent real positive and nested credential negative 2/2 PASS; focused schema suite 5/5 PASS; full suite 388/388, syntax 86/86, and replay invariants PASS.
- Compatibility/performance impact: discovery now rejects previously admitted noncanonical nested bodies; canonical runtime, persistence, RPC, WebSocket, and configuration are unchanged. Validation is a bounded fixed-field check.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-PAGINATED-SUCCESS-CURSOR-SCHEMA-001

- Severity: `PASS` (resolved by `2241f55`)
- Owner: `DEV`
- Reproduction: apply the declared `canonical_cursor_v1` semantic to null, a valid exact cursor, `A`, a padded cursor, and base64url-encoded wrong-shape JSON; compare with all five route controls.
- Evidence: `nextCursor` now declares the same stable semantic kind as request discovery. Independent decode/re-encode plus exact `{key,scope,version}` validation accepts terminal null and a valid cursor, rejects all three noncanonical forms, and matches the existing five-route HTTP 400 controls.
- Affected contracts: all five REST pagination envelopes, generated validators, canonical cursor identity, collection/filter scope, retry classification, cache continuity, page mixing prevention, schema digest/ETag, and downstream catalog/event consumption.
- Expected versus actual behavior: every non-null advertised cursor uses the canonical version-1 semantic required by runtime; discovery and admission now match.
- Acceptance criteria: add a machine-readable canonical cursor constraint/profile covering re-encoding, version, exact keys, bounded key/scope, and null terminal form; reject `A` plus noncanonical pad-bit/padded/malformed JSON controls; retain real cursors for all five routes and route-specific scope rejection.
- Validation results: independent semantic matrix 5/5 PASS; route runtime controls 5/5 PASS; focused schema suite 5/5 PASS; full suite 388/388, syntax 86/86, and replay invariants PASS.
- Compatibility/performance impact: discovery is consistent with the existing runtime boundary; canonical responses and pagination are unchanged. Validation remains bounded to 1,024 characters.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-DISCOVERY-SUCCESS-SCHEMAS-001

- Severity: `PASS` (implemented by `8183a14`)
- Owner: `DEV`
- Reproduction: request `/internal/trending`, `/internal/new-pairs`, `/internal/candidates`, and `/api/trending` from canonical fixture state; validate each advertised schema, then test missing required, unknown top-level, and invalid version/constant/date-time variants.
- Evidence: each 200 outcome references its distinct closed schema and each real response satisfies required keys, types, arrays, version/score/methodology constants, window vocabulary, and timestamp format. All twelve negative bodies are rejected.
- Affected contracts: internal discovery, new-pair launch feed, candidate evidence ranking, public trending, generated validators, schema digest/ETag, commercial clients, and stable top-level projections.
- Expected versus actual behavior: each route advertises its real distinct top-level envelope without inventing nested item completeness; source, handoff scope, and runtime match.
- Acceptance criteria: distinct route references; exact top-level required/allowed fields; stable version and vocabulary constants; valid public timestamp; reject missing, extra, and invalid-constant bodies. All criteria are met.
- Validation results: independent route matrix 16/16 PASS; focused response/schema suite 5/5 PASS; full suite 388/388 PASS; syntax 86/86 PASS; replay invariants PASS at 1,465.47 blocks/s.
- Compatibility/performance impact: additive discovery precision only; ranking, runtime payloads, persistence, RPC, WebSocket, and configuration are unchanged. No bounded heap/full-suite regression observed.
- Blockers: none.

## UPSTREAM-QA-TOKEN-INTELLIGENCE-SUCCESS-SCHEMAS-001

- Severity: `PASS` (implemented by `3c7ea14`)
- Owner: `DEV`
- Reproduction: request the canonical fixture's token market, security, holders, trades, OHLCV, and liquidity routes; validate each 200 body against the referenced discovery schema, then remove one required field and add one unknown top-level field.
- Evidence: all six real responses return HTTP 200 and satisfy their distinct closed schemas. All six missing-required variants and all six unknown-field variants are rejected. The routes retain explicit provenance, freshness, completeness, finality, and integer/string precision fields where advertised.
- Affected contracts: token market, security, holder, trade, candle, and liquidity REST responses; generated clients; response-schema registry; snapshot digest/ETag; downstream evidence admission.
- Expected versus actual behavior: all six advertised schemas describe the canonical runtime responses without broadening fail-closed evidence or inventing nested completeness; expected and actual behavior match.
- Acceptance criteria: distinct route references, real-response acceptance, required-field rejection, unknown-field rejection, stable constants/types, and no runtime payload mutation. All criteria are met.
- Validation results: independent route positives 6/6 PASS; missing-required negatives 6/6 PASS; unknown-field negatives 6/6 PASS; focused suite 5/5 PASS; full suite 390/390 PASS; syntax 86/86 PASS; replay invariants PASS at 2,522.79 blocks/s.
- Compatibility/performance impact: additive discovery precision only; canonical response bodies, persistence, RPC, WebSocket, and configuration are unchanged. No bounded performance regression was observed.
- Blockers: none.

## UPSTREAM-QA-WALLET-FUNDING-CLUSTER-CLASSIFICATION-SCHEMA-001

- Severity: `PASS` (resolved by `6dee59f`)
- Owner: `DEV`
- Reproduction: request `/internal/wallets/wallet-address/funding-cluster` from the canonical fixture and validate its HTTP 200 body against `wallet_funding_cluster_success_v1` from `/internal/contracts/http-responses`.
- Evidence: the real route returns HTTP 200 with `classification:null`, reflecting unavailable classification evidence, and the corrected property declares `type:["string","null"]` with the nonempty-string constraint retained. Independent real-route validation accepts null while missing-required and unknown-field variants remain rejected.
- Affected contracts: wallet funding-cluster REST success response, generated validators and clients, response-schema registry, snapshot digest/ETag, commercial consumers, and fail-closed classification evidence.
- Expected versus actual behavior: canonical evidence-only null classification is admitted without asserting smart-money status or automation eligibility; expected and actual behavior now match.
- Acceptance criteria: permit canonical null without weakening top-level closure; retain `safeForAutomation:false` and missing-evidence semantics; reject missing/unknown fields. All criteria are met.
- Validation results: real wallet-cluster positive 1/1 PASS; missing-required negative 1/1 PASS; unknown-field negative 1/1 PASS; focused metadata suite PASS; full suite 391/391 PASS; syntax 86/86 PASS; replay invariants PASS.
- Compatibility/performance impact: additive validator compatibility only; runtime, persistence, RPC, WebSocket, provider, and database behavior are unchanged. Validation remains bounded.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-TRANSACTION-DETAIL-FEE-LAMPORTS-SCHEMA-001

- Severity: `PASS` (resolved by `9cc4ba1`)
- Owner: `DEV`
- Reproduction: request `/api/transaction/signature-1` from the canonical finalized fixture and validate the HTTP 200 body against `transaction_detail_success_v1` from the response-schema registry.
- Evidence: the real response contains `feeLamports:5000` as an exact JSON integer, and the corrected schema declares `type:"integer", minimum:0`; independent real-route validation now accepts the canonical body while missing-required and unknown-field variants remain rejected.
- Affected contracts: transaction-detail REST success response, exact fee representation, generated validators and clients, schema registry, snapshot digest/ETag, provenance consumers, and commercial transaction inspection.
- Expected versus actual behavior: discovery advertises the longstanding canonical nonnegative-integer representation; expected and actual behavior now match.
- Acceptance criteria: require an exact nonnegative integer; validate canonical `signature-1`; retain required/closed-field and provenance checks. All criteria are met.
- Validation results: transaction real positive 1/1 PASS; missing-required negative 1/1 PASS; unknown-field negative 1/1 PASS; focused suite PASS; full suite 392/392 PASS; syntax 86/86 PASS; replay invariants PASS.
- Compatibility/performance impact: additive validator compatibility with the existing response; no persistence, RPC, WebSocket, provider, database, or runtime payload change occurred.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-POOL-RISK-SUCCESS-SCHEMA-001

- Severity: `PASS` (resolved by `1a3add5`)
- Owner: `DEV`
- Reproduction: request `/api/v1/risk/pool-address` from the canonical finalized fixture and validate the HTTP 200 body against `pool_risk_success_v1` from the response-schema registry.
- Evidence: the canonical response emits a nonnegative integer direction count and ISO-or-null latest activity time. The corrected schema advertises those exact types; independent generated-style validation accepts the canonical form, rejects the former array/integer form, and retains missing-required, unknown-field, and `safeForAutomation:false` controls.
- Affected contracts: pool-risk REST success response, trading decision support, generated validators and clients, risk/freshness interpretation, schema registry, snapshot digest/ETag, and commercial/AI consumers.
- Expected versus actual behavior: discovery advertises the canonical nonnegative direction count and ISO-or-null latest activity time while retaining `safeForAutomation:false`; expected and actual now match.
- Acceptance criteria: require `directions` as a nonnegative integer; require `latestBlockTime` as ISO-string-or-null; retain all required fields, top-level closure, and `safeForAutomation:false`; validate the canonical projection and incompatible legacy forms. All criteria are met.
- Validation results: positive 1/1 PASS; missing-required 1/1 PASS; unknown-field 1/1 PASS; former incompatible form rejected 1/1 PASS; focused discovery suite 4/4 PASS; full suite 393/393 PASS; syntax 86/86 PASS; replay invariants PASS at 4,081.89 blocks/s.
- Compatibility/performance impact: metadata-only correction makes generated clients accept the established runtime response without changing risk calculation, persistence, RPC, WebSocket, provider, or database behavior. Validation remains bounded.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-AUTOMATION-BOUNDARY-SUCCESS-SCHEMAS-001

- Severity: `PASS` (implemented by `a8b271c`)
- Owner: `DEV`
- Reproduction: inspect the 200 outcomes for `/internal/pools/{pool}/quote` and `/api/v1/bot/readiness`; validate the exact quote projection and `gateBotReadiness` healthy-dependency projection, then remove one required field, add an unknown credential field, enable quote automation, or retain a missing readiness dependency.
- Evidence: quote binds `available:true`, `automationSafe:false`, unsigned construction, mandatory simulation, no submission, required next steps, blockers, and quote evidence. Readiness binds schema v2, `ready:true`, null reason, nonempty target pool, empty missing list, health/capability/risk/USD evidence, and dependencies. All six negative forms are rejected; real quote HTTP 200 fixtures remain green.
- Affected contracts: generated quote/readiness validators, AI analysis admission, bot execution gating, response-schema registry, discovery digest/ETag, and downstream commercial automation clients.
- Expected versus actual behavior: an available quote remains analysis-only and cannot authorize simulation, signing, submission, or trading; only a fully ready market with healthy exact dependencies selects the readiness success schema. Expected and actual match.
- Acceptance criteria: distinct closed schema references; fail-closed quote constants; readiness v2/ready/null-reason/empty-missing constraints; accept canonical success projections; reject missing, unknown, unsafe, and incompletely ready variants. All criteria are met.
- Validation results: positive 2/2 PASS; missing-required 2/2 PASS; unknown-field 2/2 PASS; semantic negatives 2/2 PASS; focused discovery suite 4/4 PASS; full suite 393/393 PASS; syntax 86/86 PASS; replay invariants PASS.
- Compatibility/performance impact: additive discovery only; runtime quote/readiness, execution, persistence, RPC, WebSocket, configuration, provider, and database behavior are unchanged. The fixed top-level checks are bounded.
- Blockers: healthy operational evidence is absent for live readiness qualification, tracked separately as `UPSTREAM-QA-OPS-001`; offline schema compatibility is complete.

## UPSTREAM-QA-LEGACY-COLLECTION-SUCCESS-SCHEMA-001

- Severity: `PASS` (implemented by `1c37155`)
- Owner: `DEV`
- Reproduction: request `/api/blocks` and `/api/transactions` from an empty canonical in-memory store and compare each HTTP 200 body with the success schema published by `/api/v1/query-contracts`.
- Evidence: both real responses are JSON arrays with zero elements, both 200 outcomes reference `legacy_collection_success_v1`, and the shared schema is exactly `{type:"array"}`. The versioned collection routes retain their distinct cursor-v1 envelope.
- Affected contracts: legacy block and transaction compatibility endpoints, generated response decoders, versioned-migration guidance, schema registry, digest/ETag identity, and commercial consumers.
- Expected versus actual behavior: legacy clients must parse a bare array and must not infer `data` or `nextCursor`; expected and actual match.
- Acceptance criteria: bind both and only both compatibility successes to the array schema; verify real 200 bodies; retain versioned pagination contracts and runtime bytes. All criteria are met.
- Validation results: real HTTP positives 2/2 PASS; focused response/schema suite 6/6 PASS; full suite 395/395 PASS; syntax 86/86 PASS; replay invariants PASS at 3,991.29 blocks/s.
- Compatibility/performance impact: additive discovery clarifies the existing wire shape without changing runtime, persistence, RPC, WebSocket, configuration, provider, or database behavior. Array validation is bounded by the existing response size.
- Blockers: none.

## UPSTREAM-QA-STATS-SUCCESS-SCHEMA-001

- Severity: `PASS` (implemented by `d4b0200`)
- Owner: `DEV`
- Reproduction: request `/api/stats` from a canonical healthy empty store; validate the HTTP 200 body against `stats_success_v1`, then delete `tip`, add `providerCredential`, or change `blocks` to a string.
- Evidence: the real response contains exactly the 24 required fields, every field has an advertised property, all non-null counts are nonnegative integers, and structure/chain evidence is canonical. Missing-required, unknown credential-bearing, and wrong count-type variants are rejected.
- Affected contracts: public operational statistics, dashboard and RPC-adjacent consumers, retry/dead-letter and holder-exclusion telemetry, ingestion provenance, schema registry, digest/ETag identity, and redaction.
- Expected versus actual behavior: a healthy stats response exposes only the stable aggregate projection and cannot be confused with its quarantined 503 schema; expected and actual match.
- Acceptance criteria: exact closed required field set; nonnegative count types; nullable tip/updated time; bounded object evidence; real-route positive and missing/unknown/type negatives; unchanged runtime bytes. All criteria are met.
- Validation results: real HTTP positive 1/1 PASS; missing-required 1/1 PASS; unknown-field 1/1 PASS; wrong-type 1/1 PASS; focused suite 6/6 PASS; full suite 395/395 PASS; syntax 86/86 PASS; replay invariants PASS.
- Compatibility/performance impact: additive discovery only; stats calculation, persistence, authentication, RPC, WebSocket, configuration, provider, and database behavior are unchanged. Fixed-field validation is bounded.
- Blockers: none.

## UPSTREAM-QA-BACKUP-SUCCESS-SCHEMA-001

- Severity: `PASS` (implemented by `51fc58f`)
- Owner: `DEV`
- Reproduction: produce a healthy backup assessment from canonical offline status evidence; validate the projection against `backup_success_v1`, then delete a required field, add `providerCredential`, set `healthy:false`, or replace `backupId` with a malformed identity.
- Evidence: the actual healthy projection contains exactly the seven advertised fields and selects the route's published schema. Independent validation accepts the canonical body and rejects every missing-required, unknown credential-bearing, unhealthy, and malformed-identity variant.
- Affected contracts: `GET /api/v1/backup` HTTP 200 discovery, backup availability/freshness qualification, backup identity and completion time, body-contract identity, schema registry digest/ETag, and redaction.
- Expected versus actual behavior: a healthy backup success response must be closed, content-bound, fresh, and distinguishable from every unavailable form; expected and actual match.
- Acceptance criteria: bind the route success to a distinct closed schema; require `available:true`, `healthy:true`, `reason:null`, bounded freshness values, canonical backup identity, and millisecond UTC completion time; reject missing, unknown, unhealthy, and malformed variants. All criteria are met.
- Validation results: canonical positive 1/1 PASS; missing-required 1/1 PASS; unknown-field 1/1 PASS; unhealthy 1/1 PASS; malformed identity 1/1 PASS; focused suite 7/7 PASS; full suite 397/397 PASS; syntax 86/86 PASS; replay invariants PASS at 3,195.57 blocks/s.
- Compatibility/performance impact: additive discovery only; backup execution, persistence, provider, database, REST bytes, RPC, and WebSocket behavior are unchanged. Fixed-field validation is bounded.
- Blockers: none.

## UPSTREAM-QA-RECOVERY-SUCCESS-SCHEMA-001

- Severity: `PASS` (implemented by `4ec05db`)
- Owner: `DEV`
- Reproduction: produce a healthy recovery assessment from canonical offline qualification evidence; validate the projection against `recovery_success_v1`, then delete a required field, add `providerCredential`, set `healthy:false`, or replace `backupId` with a malformed identity.
- Evidence: the actual healthy projection contains exactly the eight advertised fields, including nonnegative `durationMs`, and selects the route's published schema. Independent validation accepts the canonical body and rejects every missing-required, unknown credential-bearing, unhealthy, and malformed-identity variant.
- Affected contracts: `GET /api/v1/recovery` HTTP 200 discovery, recovery availability/freshness qualification, backup identity, completion time and duration, body-contract identity, schema registry digest/ETag, and redaction.
- Expected versus actual behavior: a healthy recovery success response must be closed, content-bound, fresh, and distinguishable from every unavailable form; expected and actual match.
- Acceptance criteria: bind the route success to a distinct closed schema; require `available:true`, `healthy:true`, `reason:null`, bounded freshness and duration values, canonical backup identity, and millisecond UTC completion time; reject missing, unknown, unhealthy, and malformed variants. All criteria are met.
- Validation results: canonical positive 1/1 PASS; missing-required 1/1 PASS; unknown-field 1/1 PASS; unhealthy 1/1 PASS; malformed identity 1/1 PASS; focused suite 7/7 PASS; full suite 397/397 PASS; syntax 86/86 PASS; replay invariants PASS at 3,195.57 blocks/s.
- Compatibility/performance impact: additive discovery only; recovery execution, persistence, provider, database, REST bytes, RPC, and WebSocket behavior are unchanged. Fixed-field validation is bounded.
- Blockers: none.

## UPSTREAM-QA-INGESTION-SUCCESS-PROJECTION-001

- Severity: `PASS` (resolved by `48626f2`)
- Owner: `DEV`
- Reproduction: write otherwise canonical healthy exporter status without `localValidatorTip`, request `/api/v1/ingestion`, and validate the HTTP 200 body against `ingestion_success_v1` while enforcing every published property-relative and difference rule.
- Evidence: `48626f2` requires a concrete nonnegative validator tip before exporter health can succeed and changes the success schema tip type to integer. Independent real-route validation accepts the concrete-tip HTTP 200 body and rejects absent tip evidence with bounded HTTP 503 `invalid_validator_tip`; the exact cursor/lag relationships remain satisfiable.
- Affected contracts: `/api/v1/ingestion` HTTP 200 discovery, generated client validators, exporter provenance/finality/freshness, durable gap evidence, public-RPC automation safety, body-contract digest/ETag, and secret redaction guarantees.
- Expected versus actual behavior: every healthy response carries a concrete tip and validates exact cursor/lag arithmetic; missing tip evidence fails closed as retryable unavailable evidence. Expected and actual now match.
- Acceptance criteria: require a concrete tip or conditionalize arithmetic; retain all prior semantic negatives; cover concrete-tip success and missing-tip failure. The concrete-tip policy satisfies all criteria.
- Validation results: prior semantic negatives retained; concrete-tip real HTTP/schema positive 1/1 PASS; missing-tip HTTP 503/reason 1/1 PASS; focused committed suite 5/5 PASS; full suite 400/400 PASS; syntax 86/86 PASS; replay invariants PASS at 6,884.29 blocks/s.
- Compatibility/performance impact: intentional fail-closed tightening converts an under-specified former success to retryable unavailable evidence; no persistence, provider, RPC, WebSocket, database, or configuration migration is required.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-WAREHOUSE-SUCCESS-PROJECTION-001

- Severity: `PASS` (resolved by `1109a8a`)
- Owner: `DEV`
- Reproduction: obtain a real healthy `/api/v1/warehouse` HTTP 200 body and validate it against `warehouse_success_v1`; then advertise stale age, lag beyond `maxLagEvents`, or a checkpoint behind retained replay history while retaining `healthy:true` and `replayHistoryLost:false`.
- Evidence: `1109a8a` adds property-relative age and lag maxima plus `sequence >= oldestSequence - 1`. The real empty-event replay boundary returns HTTP 200 with sequence zero and oldest sequence one and validates. Independent stale, excessive-lag, and below-retained-history mutations each fail generated-style validation, including a replay-loss mutation that keeps the success sentinel false to isolate the relative bound.
- Affected contracts: `/api/v1/warehouse` HTTP 200 discovery, generated client validators, replay/reorg retention, ClickHouse/PostgreSQL/Redis convergence, reconciliation identities/content digests, body-contract digest/ETag, and secret redaction guarantees.
- Expected versus actual behavior: the advertised success schema accepts only fresh, within-limit, replay-retained, sequence-consistent sink convergence. Expected and actual now match.
- Acceptance criteria: bind all three relative limits; preserve equality/difference rules and the real response; add positive and all three negative regressions. All criteria are met.
- Validation results: real replay-boundary HTTP/schema positive 1/1 PASS; stale negative 1/1 PASS; excessive-lag negative 1/1 PASS; replay-history negative 1/1 PASS; focused committed suite 5/5 PASS; full suite 400/400 PASS; syntax 86/86 PASS; replay invariants PASS at 6,884.29 blocks/s.
- Compatibility/performance impact: relationship-only hardening makes generated consumers reject evidence runtime already classifies unhealthy; no response-byte, persistence, sink, RPC, WebSocket, configuration, or database migration is required.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-INDEX-HEALTH-SUCCESS-PROJECTION-001

- Severity: `PASS` (resolved by `d19fc42`)
- Owner: `DEV`
- Reproduction: apply the canonical block fixture, retain one exactly resolved dead letter, force health time to one second after the block, request `/api/health`, and validate the real HTTP 200 body against `index_health_success_v1`; also validate a schema-shaped body whose `ageMs` exceeds `staleAfterMs` while `healthy:true` remains set.
- Evidence: `publicHealth` no longer overwrites aggregate instruction/program-event counts, `deadLetters` is a nonnegative integer while `unresolvedDeadLetters` remains fixed at zero, and `ageMs` declares its `staleAfterMs` maximum. The real resolved-history body returns HTTP 200, preserves both count types, emits `deadLetters:1`, validates against the closed schema, and a stale healthy mutation is rejected.
- Affected contracts: `/api/health` HTTP 200 bytes and discovery, JSON-RPC/feed health projections sharing `publicHealth`, generated validators, aggregate counts, retry/recovery history, freshness gating, body-contract digest/ETag, dashboards, readiness, and commercial monitoring clients.
- Expected versus actual behavior: every real healthy response satisfies its advertised schema; aggregate fields remain numeric, resolved history is compatible when unresolved count is zero, and stale healthy evidence fails. Expected and actual now match.
- Acceptance criteria: preserve numeric counts; permit resolved history; retain zero unresolved entries; bind freshness; cover the real resolved-history response and stale negative. All criteria are met.
- Validation results: real resolved-history HTTP status 1/1 PASS; real body/schema compatibility 1/1 PASS; numeric instruction/program-event types 2/2 PASS; resolved-history compatibility 1/1 PASS; stale healthy rejection 1/1 PASS; focused committed suite 3/3 PASS; full suite 400/400 PASS; syntax 86/86 PASS; replay invariants PASS at 6,573.39 blocks/s.
- Compatibility/performance impact: the correction restores documented aggregate types and permits legitimate resolved history; generated clients must regenerate for digest `9444f76189ecaa9b48b8facd523ca52a12cb0767ffc33588e28e96ad00eac0c4`. No persistence, provider, sink, RPC-method, WebSocket, configuration, or database migration is required.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-FEED-HEALTH-SUCCESS-PROJECTION-001

- Severity: `PASS` (implemented by `f10dc83`)
- Owner: `DEV`
- Reproduction: apply the canonical finalized block fixture, provide concrete healthy exporter status, request `/internal/feed/health`, and validate the HTTP 200 body against `feed_health_success_v1`; then mutate top-level age or nested ingestion age, lag, and cursor arithmetic.
- Evidence: the real response contains exactly the advertised healthy index fields plus the complete exporter projection and passes independent generated-style validation. The top-level freshness mutation and all three nested ingestion mutations reject because the schema reuses the hardened success properties and exact difference relationship.
- Affected contracts: combined feed-health HTTP 200 discovery, index/exporter readiness, generated monitoring clients, freshness/finality/progress gating, schema digest/ETag, and commercial/AI safety consumers.
- Expected versus actual behavior: a combined healthy response is usable only when both canonical index and exporter evidence satisfy their complete success contracts. Expected and actual match.
- Acceptance criteria: bind the 200 outcome to a closed schema; preserve real response parity; require healthy constants; enforce top-level and nested freshness plus exact exporter progress; reject unknown fields. All criteria are met.
- Validation results: real HTTP/schema positive 1/1 PASS; top-level freshness negative 1/1 PASS; nested freshness, lag, and cursor-progress negatives 3/3 PASS; focused committed suite 6/6 PASS; full suite 401/401 PASS; syntax 86/86 PASS; replay invariants PASS at 6,446.32 blocks/s.
- Compatibility/performance impact: additive discovery only; runtime response bytes, index/exporter policy, persistence, RPC, WebSocket, provider, and database behavior are unchanged. Fixed-field validation is bounded.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-GAP-FEED-SUCCESS-PROJECTION-001

- Severity: `PASS` (implemented by `92eb8cd`; previously `HIGH`)
- Owner: `DEV`
- Reproduction: request `/internal/feed/gaps` from canonical replacement state with healthy exporter status and validate the real HTTP 200 body against `gap_feed_success_v1`; then independently inject stale age, excessive lag, inconsistent cursor/tip/lag, descending skipped slots, or top-level/nested skipped-slot divergence while retaining success sentinels.
- Evidence: the real body, bounded public checkpoint, and reorg-correction projection validate and remain credential-redacted. The nested ingestion schema now publishes freshness/lag/tip property bounds, exact lag arithmetic, unique strictly increasing skipped slots, and an exact top-level/nested skipped-slot mirror. Independent generated-style validation rejects all 5/5 unsafe variants.
- Affected contracts: gap-feed HTTP 200 discovery, generated replay/reorg clients, exporter freshness/finality/progress, durable skipped-slot identity, replay-cache invalidation, schema digest/ETag, and downstream commercial monitoring safety.
- Expected behavior: gap-feed success must reuse the complete healthy ingestion semantics and prove that its top-level skipped-slot list exactly mirrors the exporter projection before clients use checkpoint or correction evidence.
- Actual behavior: expected and actual now match; unsafe or contradictory success projections fail validation.
- Acceptance criteria: reuse or reference every hardened ingestion success property/relationship except route-only exporter/index wrappers; bind top-level `durableSkippedSlots` exactly to `ingestion.durableSkippedSlots`; preserve the real body and bounded correction/checkpoint schemas; add one positive plus all five generated-validator negatives.
- Validation results: real HTTP/schema positive 1/1 PASS; credential-redaction control PASS; stale, lag, progress, ordering, and mirror negatives 5/5 PASS; focused committed suite 5/5 PASS; full suite 402/402 PASS; syntax 86/86 PASS; replay invariants PASS at 6,550.52 blocks/s.
- Compatibility/performance impact: discovery hardening makes generated clients reject states runtime already refuses and prevents cache invalidation from contradictory gap evidence; runtime bytes, persistence, provider, RPC, WebSocket, database, and configuration are unchanged. Validation remains bounded by existing 10,000-slot and 100-correction limits.
- Blockers: none; the finding is closed.

## UPSTREAM-HOLDERS-SUCCESS-PARITY-001

- Severity: `PASS` (implemented by `c859ac6`)
- Owner: `DEV`
- Reproduction: inspect the HTTP 200 outcomes for `/api/v1/holders/{mint}` and `/internal/tokens/{mint}/holders`, then request the public route from a finalized account snapshot with an injected unknown credential-bearing store field.
- Evidence: both routes reference the shared closed `token_holders_success_v1` schema. The public response contains exactly all 19 required keys, one bounded holder row for the selected page, explicit coverage/exclusion/withheld/freshness/concentration evidence, `safeForAutomation:false`, and no injected credential fields.
- Affected contracts: public holder/whale REST discovery, generated validators, pagination, concentration safety, exclusion and withheld evidence, freshness, schema digest/ETag, and downstream Terminal DEX consumers.
- Expected versus actual behavior: the byte-identical public and internal holder projections should share one closed schema without weakening automation gates. Expected and actual match.
- Acceptance criteria: reference `token_holders_success_v1` from the public 200 outcome; retain internal parity, exact required keys, bounded holder rows, `safeForAutomation:false`, and credential redaction; add route and real-response regressions. All criteria are met.
- Validation results: route-to-schema mappings 2/2 PASS; 19-field schema boundary PASS; finalized public response exact-key, bounded-row, safety, and redaction controls PASS; focused committed suite 5/5 PASS; full suite 402/402 PASS; syntax 86/86 PASS; replay invariants PASS at 6,550.52 blocks/s.
- Compatibility/performance impact: additive discovery only; runtime response bytes, holder aggregation, persistence, RPC, WebSocket, provider, database, and configuration are unchanged. Shared fixed-schema validation is bounded.
- Blockers: none; the finding is closed.

## UPSTREAM-TOKEN-ACCOUNT-SUCCESS-SCHEMA-001

- Severity: `PASS` (implemented by `7ad97ab`)
- Owner: `DEV`
- Reproduction: inspect `/api/v1/token-account/{account}` HTTP 200 discovery, request a canonical indexed account while injecting unrelated pool corruption and unknown credential/provenance fields, then validate malformed and open-projection mutations.
- Evidence: the route references closed `token_account_success_v1`. The real response contains exactly ten required account/mint/owner/program, decimals, raw/withheld balance, slot, closed-state, and snapshot-completeness fields and excludes injected internals. Invalid decimal raw text, decimals above 255, negative slot, unknown credential, and missing completeness evidence all reject (5/5).
- Affected contracts: public token-account REST discovery, wallet and holder safety consumers, raw/withheld balance precision, canonical slot/state evidence, snapshot completeness, schema digest/ETag, and secret redaction.
- Expected versus actual behavior: the public success projection should be exact, closed, precision-safe, and isolated from unrelated corruption while relevant mint divergence fails closed. Expected and actual match.
- Acceptance criteria: bind the 200 outcome to a closed schema; preserve exact ten-field runtime compatibility; bound decimals, raw integers, and slot; admit explicit nullable owner/withheld evidence; reject missing/unknown/malformed projections; preserve relevant corruption 503 and redaction. All criteria are met.
- Validation results: real HTTP/schema positive 1/1 PASS; malformed/open-projection negatives 5/5 PASS; relevant corruption fail-closed control PASS; focused committed suite 4/4 PASS; full suite 403/403 PASS; syntax 86/86 PASS; replay invariants PASS at 7,002.57 blocks/s.
- Compatibility/performance impact: additive discovery only; runtime bytes, account indexing, persistence, RPC, WebSocket, provider, database, and configuration are unchanged. Fixed-field validation is bounded.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-EXECUTION-POLICY-SEQUENCE-001

- Severity: `PASS` (implemented by `bacec1a`; previously `HIGH`)
- Owner: `DEV`
- Reproduction: request `/internal/execution-policy`, validate the real body against `execution_policy_success_v1`, then replace `requiredSteps` with four allowed values in a reordered sequence, reverse order, or four duplicate `local_simulation` entries.
- Evidence: the canonical endpoint body validates and its nested non-authorizing constants remain exact. `requiredSteps` now publishes `uniqueItems:true` plus the exact canonical sequence in `exactItems`. Independent generated-style validation rejects reordered, reversed, duplicate, and omitted-stage variants (4/4).
- Affected contracts: external execution handoff discovery, generated trading-safety validators, local simulation ordering, external signer approval, externally operated submission, finalized landed-message verification, quote required-next-step consumers, schema digest/ETag, and automation authorization boundaries.
- Expected behavior: success discovery must require the canonical four-stage sequence exactly once and in order: local simulation, external signer approval, externally operated submission, then finalized landed-message verification.
- Actual behavior: expected and actual now match; schema-derived consumers can admit only the runtime's canonical sequence.
- Acceptance criteria: encode exact positional sequence semantics or an equivalent fixed tuple; require uniqueness; retain length four and current constants; preserve the real endpoint; add positive plus reordered, reversed, duplicate, and omitted-stage generated-validator regressions.
- Validation results: real HTTP/schema positive 1/1 PASS; nested exact-key/non-authorizing controls PASS; reordered, reversed, duplicate, and omitted-stage negatives 4/4 PASS; focused committed suite 3/3 PASS; full suite 405/405 PASS; syntax 86/86 PASS; replay invariants PASS at 6,312.83 blocks/s.
- Compatibility/performance impact: discovery hardening rejects policies runtime never emits and prevents unsafe client workflow admission. Runtime bytes, signing/submission behavior, persistence, provider, RPC, WebSocket, database, and configuration are unchanged; four-position validation is constant-time.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-RESPONSE-SCHEMA-DIALECT-KIND-001

- Severity: `PASS` (resolved by `68852bb`; previously `HIGH`)
- Owner: `DEV`
- Reproduction: inspect `bodySchemaDialect.keywords` from `/api/v1/query-contracts`, recursively enumerate actual schema-node keywords, and compare the fail-closed dialect with `paginated_collection_v1.properties.nextCursor`.
- Evidence: dialect identity/version and unknown-keyword policy remain explicit. `68852bb` adds and sorts `kind`; independent recursive enumeration finds exactly 25 used and 25 declared schema-node keywords, distinguishes relationship descriptors from schema nodes, and retains `paginated_collection_v1.properties.nextCursor.kind="canonical_cursor_v1"`.
- Affected contracts: query-contract discovery, all five cursor-paginated block/transaction/swap/token/pool success schemas, canonical cursor scope/digest semantics, generated commercial/replay/AI clients, schema digest/ETag, and fail-closed unknown-keyword behavior.
- Expected versus actual behavior: the published dialect enumerates every live schema-node keyword, including cursor semantic `kind`, and keeps unknown future keywords fail closed; expected and actual now match.
- Acceptance criteria: add `kind` to dialect version 1 or remove/replace the keyword in every schema; add a recursive full-registry keyword-coverage regression that distinguishes relationship descriptor fields from schema-node keywords; preserve fail-closed unknown-keyword policy and canonical cursor semantics.
- Validation results: independent 25/25 keyword coverage PASS; focused committed dialect/preparation suite 3/3 PASS; full suite 407/407 PASS; syntax 86/86 PASS; replay invariants PASS at 3,774.32 blocks/s.
- Compatibility/performance impact: discovery-only correction changes digest/ETag and lets generators safely accept the existing paginated schema. Runtime pagination bytes, persistence, provider, RPC, WebSocket, database, and configuration need no migration; registry enumeration is bounded.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-PREPARATION-HANDOFF-BINDING-SCHEMA-001

- Severity: `PASS` (implemented by `5aefae5`)
- Owner: `DEV`
- Reproduction: inspect `preparation_success_v1.properties.executionHandoff`, validate its complete policy and binding projections, then independently mutate each related preparation protocol, type, hash, transaction hash, or minimum context slot.
- Evidence: the handoff is a detached closed clone of `execution_policy_success_v1` with all ten policy fields plus required `binding`. Binding is closed and requires protocol, preparation type, preparation hash, message hash, unsigned transaction hash, and minimum context slot. Credential injection is excluded, one canonical relationship control passes, and all 6/6 isolated mismatches fail.
- Affected contracts: both preparation success routes, external-only authority policy, protocol/type identity, content-addressed preparation and unsigned-message evidence, context-slot binding, generated trading-safety validators, and schema digest/ETag.
- Expected versus actual behavior: successful preparation discovery must prove that its external-only handoff names the same preparation and unsigned transaction without admitting unknown authority or credential fields; expected and actual now match for this scoped dependency.
- Acceptance criteria: reuse the complete closed execution policy; close binding; require bounded protocol/type/hash/slot fields; bind all six identities exactly; reject credential and mismatch mutations; preserve all real venue responses. All criteria are met.
- Validation results: handoff required fields 11/11 PASS; binding required fields 6/6 PASS; closure and credential exclusion PASS; relationship control 1/1 PASS; cross-object mismatch negatives 6/6 PASS; focused committed suite 3/3 PASS; full suite 408/408 PASS; syntax 86/86 PASS; replay invariants PASS at 4,789.77 blocks/s.
- Compatibility/performance impact: discovery-only hardening changes digest/ETag while runtime response bytes, signing/submission behavior, persistence, provider, RPC, WebSocket, database, and configuration remain unchanged. Six bounded equality checks add negligible consumer cost.
- Blockers: none; this scoped dependency is closed. The parent quote/preparation projection finding remains open and deduplicated separately.

## UPSTREAM-QA-PREPARATION-TRANSACTION-BOUNDARY-SCHEMA-001

- Severity: `PASS` (implemented by `8dde519`)
- Owner: `DEV`
- Reproduction: inspect `preparation_success_v1.properties.preparation` and its nested `transaction`; validate their exact field sets and constants, then attempt unknown credential fields and authorizing signed/submitted state.
- Evidence: preparation is closed with nine required fields and requires schema version 1, a simulation type, nonempty protocol, finalized commitment, nonnegative context slot, transaction, instruction evidence, simulation policy, and a 64-character lowercase hash. Transaction is closed with nine required fields, legacy message version, nonempty serialized bytes and instruction policies, three bounded identity/count fields, and constant `signed:false` / `submitted:false`. Credential fields are not admitted.
- Affected contracts: both preparation success routes, protocol/type/finality identity, unsigned legacy transaction bytes and hashes, instruction-policy presence, generated safety validators, signing/submission boundary, and schema digest/ETag.
- Expected versus actual behavior: generated clients must reject undeclared preparation/transaction fields and any signed, submitted, non-finalized, or non-legacy success artifact; expected and actual now match for this scoped boundary.
- Acceptance criteria: close both envelopes; require exact stable fields; bind versions, finality, hashes, positive signature count, legacy message form, nonempty instruction policies, and unsigned/unsubmitted constants; reject credentials and authorization state; preserve real venue responses. All criteria are met.
- Validation results: preparation required fields 9/9 PASS; transaction required fields 9/9 PASS; closure, credential exclusion, finalized/legacy constants, and signed/submitted false PASS; focused committed suite 4/4 PASS; full suite 409/409 PASS; syntax 86/86 PASS; replay invariants PASS at 5,541.58 blocks/s.
- Compatibility/performance impact: discovery-only precision changes digest/ETag; runtime bytes, signing/submission behavior, persistence, provider, RPC, WebSocket, database, and configuration are unchanged. Fixed-field validation is bounded.
- Blockers: none; this scoped dependency is closed. Venue-specific quote and instruction-evidence unions remain in the parent finding.

## UPSTREAM-QA-PREPARATION-SIMULATION-POLICY-SCHEMA-001

- Severity: `PASS` (implemented by `9acccf5`)
- Owner: `DEV`
- Reproduction: inspect `preparation_success_v1.properties.preparation.properties.simulationPolicy` and the transaction instruction policies; validate a real venue preparation, then inject unknown credential fields, duplicate or divergent allowed/required program sets, malformed instruction/account rules, a non-two expectation set, or transaction/simulation instruction-policy mismatch.
- Evidence: the shared simulation policy is closed with four required fields. Allowed and required program IDs are bounded, nonempty, unique, and equality-bound. Instruction policies, account metas, and mint-bound raw-delta expectations are recursively closed; exactly two expectations are required. Transaction instruction policies must equal the simulation-policy list. Independent canonical controls pass while the isolated program-set and transaction-policy mismatches reject. The only still-open nested objects are protocol-specific `quote` and `instructionEvidence`.
- Affected contracts: both preparation success routes, generated trading-safety validators, program allow/require identity, instruction and account authorization evidence, token-effect bounds, unsigned transaction linkage, secret redaction, schema digest/ETag, and downstream AI/commercial admission.
- Expected versus actual behavior: successful preparation discovery must admit only bounded, closed, non-authorizing simulation policy evidence whose program sets and unsigned transaction policies agree and whose two token effects are mint-bound. Expected and actual match for this shared policy boundary.
- Acceptance criteria: close the simulation policy and every nested rule; require bounded unique nonempty program sets and exact equality; require closed instruction/account structures; require exactly two closed effect expectations; equality-bind transaction instruction policies; reject credentials, duplicates, malformed fields, and cross-object mismatches; preserve all real venue bodies. All criteria are met.
- Validation results: required fields 4/4 PASS; program-list equality control and mismatch rejection 1/1 each PASS; instruction policy, account-meta, and expectation closure PASS; exact expectation cardinality 2 PASS; transaction-policy equality control and mismatch rejection 1/1 each PASS; focused committed suite 5/5 PASS; full suite 411/411 PASS; syntax 86/86 PASS; replay invariants PASS at 5,765.79 blocks/s with 9,538,080-byte heap growth; response registry remains coherent at 57 schemas, 119 outcomes, 118 body identities, and 25/25 dialect keywords with digest `46c0f8294e0688b762fe08e5f6f37fea279f37063a8cfb926ef9a934c8f03a3e`.
- Compatibility/performance impact: discovery-only hardening changes digest/ETag and intentionally makes generated consumers reject under-specified or divergent policies. Runtime response bytes, signing/submission behavior, persistence, provider, RPC, WebSocket, database, and configuration are unchanged. Validation is bounded by 64 program IDs, the existing instruction envelope, and exactly two effect expectations.
- Blockers: none; this scoped dependency is closed. The deduplicated parent remains open only for protocol-specific quote and instruction-evidence projections.

## UPSTREAM-QA-PREPARATION-INSTRUCTION-AMOUNTS-SCHEMA-001

- Severity: `PASS` (implemented by `60739b0`)
- Owner: `DEV`
- Reproduction: inspect `preparation_success_v1.properties.preparation.properties.instructionEvidence`; validate its required properties, then apply each published amount pattern to minimum and u64-maximum positive controls plus empty, zero, leading-zero, negative, explicitly positive, fractional, exponent, and non-numeric variants.
- Evidence: instruction evidence requires exactly the named `amountInRaw`, `quotedOutputRaw`, and `minimumOutputRaw` properties in its declared projection. Each uses canonical positive decimal pattern `^[1-9][0-9]*$`; both controls pass and all eight invalid representations reject. Every current constructor already emits positive values, so the committed real-route suite remains green. The object deliberately remains open and still accepts an otherwise valid credential-bearing or wrong-program venue payload; that residual issue remains deduplicated under the parent HIGH finding.
- Affected contracts: both preparation success routes, generated signer-limit validators, input/quoted/minimum-output raw precision, instruction evidence discovery, schema digest/ETag, redaction admission, and downstream AI/commercial preparation display.
- Expected versus actual behavior: all preparations must publish positive canonical decimal strings for the three signer-critical raw amounts without claiming protocol-specific venue closure. Expected and actual match for this scoped increment.
- Acceptance criteria: require the three universal amounts; use positive canonical decimal syntax; reject absent, empty, zero, leading-zero, signed, fractional, exponent, and non-numeric forms; preserve every current venue body; retain the venue-closure defect explicitly. All scoped criteria are met.
- Validation results: required amount fields 3/3 PASS; declared properties 3/3 PASS; positive controls 2/2 PASS; invalid representations 8/8 reject; unknown credential-field admission independently reproduced and retained as parent evidence; focused committed suite 5/5 PASS; full suite 411/411 PASS; syntax 86/86 PASS; replay invariants PASS at 5,765.79 blocks/s with 9,538,080-byte heap growth; registry digest independently recomputes to `46c0f8294e0688b762fe08e5f6f37fea279f37063a8cfb926ef9a934c8f03a3e`.
- Compatibility/performance impact: additive discovery tightening changes digest/ETag and makes generated consumers reject invalid amount syntax while preserving runtime bytes, signing/submission behavior, persistence, provider, RPC, WebSocket, database, and configuration. Three fixed regex checks are bounded by existing response-size limits.
- Blockers: none for the amount increment; protocol-specific closure remains the parent finding.

## UPSTREAM-QA-PREPARATION-OUTPUT-EFFECT-BINDING-001

- Severity: `PASS` (implemented by `8f1e533`)
- Owner: `DEV`
- Reproduction: inspect the final two equality relationships before the input-debit relationship in `preparation_success_v1`; resolve their dotted paths through a canonical two-expectation preparation, then independently alter only signer-facing `minimumOutputRaw` or `quotedOutputRaw`.
- Evidence: the published relationships bind `instructionEvidence.minimumOutputRaw` to `accountExpectations[1].minDeltaRaw` and `instructionEvidence.quotedOutputRaw` to `accountExpectations[1].maxDeltaRaw`. A canonical 850..900 output range satisfies both. Independent 851-minimum and 901-quoted mutations each violate exactly one binding. All committed venue preparations remain compatible.
- Affected contracts: both preparation success routes, signer-facing minimum/quoted output, exact local-simulation output effects, generated validator relationship resolution including numeric array segments, schema digest/ETag, and downstream signing-limit display.
- Expected versus actual behavior: the unsigned instruction's minimum and quoted output values must equal the second token account expectation's approved delta range. Expected and actual match.
- Acceptance criteria: publish both equality relationships; resolve the fixed second expectation unambiguously; preserve canonical bodies; reject isolated minimum and quoted-output contradictions. All criteria are met.
- Validation results: relationship descriptors 2/2 PASS; dotted array-index resolution PASS; equality control 1/1 PASS; minimum mismatch 1/1 reject; quoted mismatch 1/1 reject; focused committed suite 8/8 PASS; full suite 413/413 PASS; syntax 86/86 PASS; replay invariants PASS at 6,165.76 blocks/s with 9,941,792-byte heap growth; registry digest independently recomputes to `170ff0441f74fa0118d0cceaa789f1191b891b5a969de93bf5e2327e0badcd14`.
- Compatibility/performance impact: discovery-only relationships change digest/ETag and intentionally reject contradictory generated-client evidence. Runtime bytes, signing/submission behavior, persistence, provider, RPC, WebSocket, database, and configuration are unchanged. Two fixed dotted-path comparisons are constant-bounded.
- Blockers: none; output-effect binding is closed.

## UPSTREAM-QA-PREPARATION-INPUT-DEBIT-BINDING-001

- Severity: `PASS` (implemented by `b4e5c48`)
- Owner: `DEV`
- Reproduction: inspect `bodySchemaDialect.relationshipKinds` and the final `preparation_success_v1` relationship; validate canonical positive input `1000` against first expectation minimum debit `-1000`, then mutate either value and test positive, negative-zero, leading-zero, off-by-one-low, and off-by-one-high debit forms.
- Evidence: the fail-closed dialect declares `decimal_negation`; the final relationship binds `instructionEvidence.amountInRaw` to `accountExpectations[0].minDeltaRaw`. The canonical additive inverses pass. One positive-side mismatch and all five wrong/noncanonical debit forms reject under independent canonical-decimal negation evaluation. The deliberately looser first `maxDeltaRaw` used by partial-fill venues is not falsely equality-bound.
- Affected contracts: both preparation success routes, signer-facing input amount, first token-account minimum debit, partial-fill maximum debit semantics, generated relationship validators, schema digest/ETag, and downstream signer-limit admission.
- Expected versus actual behavior: the positive instruction input and first minimum account delta must be canonical decimal additive inverses without constraining the independently defined maximum debit. Expected and actual match.
- Acceptance criteria: declare fail-closed `decimal_negation`; publish exact positive/negative paths; accept canonical inverses; reject mismatched, unsigned-negative, negative-zero, leading-zero, and off-by-one forms; preserve partial-fill maximum semantics and all current venues. All criteria are met.
- Validation results: dialect relationship kind 1/1 PASS; descriptor 1/1 PASS; canonical control 1/1 PASS; positive-side mismatch 1/1 reject; wrong/noncanonical debit forms 5/5 reject; focused committed suite 8/8 PASS; full suite 413/413 PASS; syntax 86/86 PASS; replay invariants PASS at 6,165.76 blocks/s with 9,941,792-byte heap growth; 25/25 schema keywords and 5/5 relationship kinds remain declared.
- Compatibility/performance impact: generated validators must refresh and fail closed until `decimal_negation` is supported; response bytes and runtime execution are unchanged. One canonical decimal comparison is bounded by existing response-size limits; no persistence, provider, RPC, WebSocket, database, or configuration migration is required.
- Blockers: none; input-debit binding is closed.

## UPSTREAM-QA-PREPARATION-VARIANT-DISCOVERY-001

- Severity: `PASS` (implemented by `4bf1c46`)
- Owner: `DEV`
- Reproduction: enumerate every `const prepared` type/protocol tuple in the nine venue execution modules; compare the sorted result with `/api/v1/query-contracts.preparationVariants`; verify type uniqueness, route-family assignment, and detached snapshot behavior.
- Evidence: independent source enumeration finds eleven constructors and the published catalog matches all 11/11 exact type/protocol tuples. Types are unique and sorted; nine variants are `pool`, the two Pump bonding-curve variants are `token`, and mutating one returned catalog does not affect a fresh snapshot.
- Affected contracts: query-contract discovery, both preparation route families, generated validator dispatch, venue/protocol identity, schema digest/ETag, and downstream AI/commercial preparation routing.
- Expected versus actual behavior: consumers need a deterministic bounded catalog covering every live preparation constructor without inventing venue schemas. Expected and actual match for exact identity and route-family discovery.
- Acceptance criteria: enumerate every constructor exactly once; publish nonempty type/protocol identities; sort deterministically; distinguish pool from token routes; preserve snapshot isolation and runtime response compatibility. All scoped criteria are met.
- Validation results: constructor/catalog parity 11/11 PASS; unique identities 11/11 PASS; sorted order PASS; route families 9 pool and 2 token PASS; detached mutation control PASS; focused committed suite 9/9 PASS; full suite 415/415 PASS; syntax 86/86 PASS; replay PASS at 6,190.30 blocks/s with 9,758,288-byte heap growth; digest independently recomputes to `e01971cd8e584488476038c426ee3a20e64a9d05f574b6a18ec62e07007ecfb3`.
- Compatibility/performance impact: additive discovery metadata changes digest/ETag but not preparation bodies, signing/submission behavior, persistence, provider, RPC, WebSocket, database, or configuration. Eleven constant-size rows are bounded.
- Blockers: none for catalog discovery; protocol-specific schema closure remains deduplicated under the parent finding.

## UPSTREAM-QA-PREPARATION-IDENTITY-BINDING-001

- Severity: `PASS` (implemented by `3ede5d1`)
- Owner: `DEV`
- Reproduction: resolve the published `catalog_membership` relationship from `preparation_success_v1` to `preparationVariants`; test every constructor tuple, then test an unknown tuple, an empty tuple, and a known type paired with the wrong protocol.
- Evidence: the fail-closed dialect declares `catalog_membership` and the relationship binds `preparation.type` plus `preparation.protocol` to one catalog row. All 11/11 live tuples match; unknown, empty, and cross-protocol identities reject 3/3. Route family remains discovery metadata and is not falsely claimed as a response field.
- Affected contracts: both preparation success routes, generated relationship validators, venue/protocol identity, execution-handoff compatibility, schema digest/ETag, and downstream signer admission.
- Expected versus actual behavior: a success body must use one exact known type/protocol tuple; unknown or mismatched identities must fail closed. Expected and actual match.
- Acceptance criteria: declare the relationship kind; reference a bounded published catalog; bind both identity properties; admit every current constructor; reject unknown, empty, and mismatched tuples; preserve current runtime bodies. All criteria are met.
- Validation results: dialect kind PASS; descriptor PASS; catalog resolution PASS; positives 11/11 PASS; independent negatives 3/3 reject; focused committed suite 9/9 PASS; full suite 415/415 PASS; syntax 86/86 PASS; replay PASS at 6,190.30 blocks/s with 9,758,288-byte heap growth; 25/25 keywords and 6/6 relationship kinds remain declared.
- Compatibility/performance impact: generated validators must refresh and implement `catalog_membership` fail closed before accepting the new digest. Current constructor bodies are compatible; one lookup over eleven constant catalog rows is bounded, with no persistence, provider, RPC, WebSocket, database, or configuration migration.
- Blockers: none for identity membership; exact quote and instruction-evidence variants remain the parent finding.

## UPSTREAM-QA-RAYDIUM-CPMM-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS` (implemented by `c01e2ca`, ordering completed by `fde5d69`)
- Owner: `DEV`
- Reproduction: resolve the CPMM catalog row's `instructionEvidenceSchema`; construct one legacy-SPL and one finalized Token-2022 fee-aware CPMM instruction through the real builder; validate exact keys and types, then remove every required field and inject credential, fee-mode, raw-number, and wrong-type variants.
- Evidence: `raydium_cpmm_instruction_evidence_v1` is closed and requires exactly thirteen fields. Both real constructor forms validate. All field/value negatives reject, and `fde5d69` now matches constructor provenance with `stateSlot <= configSlot <= balanceSlot <= mintEvidenceSlot`; ordered and equality controls pass while all three direct inversions reject.
- Affected contracts: Raydium CPMM pool preparation discovery, catalog dispatch, finalized component slots and epoch, Token-2022 fee evidence, signer-critical amounts, direction, redaction, schema digest/ETag, and downstream generated validators.
- Expected versus actual behavior: the CPMM catalog identity must dispatch to its complete emitted instruction-evidence shape and reject missing, unknown, credential-bearing, unsupported-fee, noncanonical-raw, or wrong-type content. Expected and actual match.
- Acceptance criteria: exact closed schema; real legacy and Token-2022 positives; canonical nonnegative fees and positive amounts; bounded known fee mode; exact finalized slot order with equality boundaries; missing/unknown/type and each direct inversion negative; detached snapshots. All scoped criteria are met.
- Validation results: prior field/value matrix remains PASS; ordering descriptors 3/3, ordered/equality positives 2/2, and direct inversions 3/3 PASS; snapshot isolation PASS; focused suite 6/6 PASS; full suite 421/421 PASS; syntax 86/86 PASS; replay PASS at 5,542.14 blocks/s with 9,284,872-byte heap growth; digest `6302fd57634f5c04d8dac63c014ee3e823316ddcbb98e23c21df4cc21f491140` independently recomputes.
- Compatibility/performance impact: additive catalog/schema discovery changes digest/ETag but preserves current CPMM bodies, signing/submission behavior, persistence, providers, RPC, WebSocket, database, and configuration. Thirteen closed scalar checks are constant-bounded.
- Blockers: none for CPMM instruction evidence; its quote and the other catalog variants remain in the parent finding.

## UPSTREAM-QA-RAYDIUM-CLMM-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS` (implemented by `fee14ca`, ordering completed by `fde5d69`)
- Owner: `DEV`
- Reproduction: resolve the CLMM catalog row's `instructionEvidenceSchema`; construct real finalized CLMM swap-v2 evidence with two tick arrays; validate exact keys and recursive array rules, then remove each field and inject credential, empty/duplicate/empty-address tick paths, zero price limit, and fractional tick variants.
- Evidence: `raydium_clmm_instruction_evidence_v1` is closed and requires exactly seventeen fields. Real constructor and prior field/path negatives pass. `fde5d69` now requires balance, tick-array, and AMM-config evidence at or after state and mint evidence at or after balance, matching the real constructor; ordered and all-equal controls pass and all four direct inversions reject.
- Affected contracts: Raydium CLMM pool preparation discovery, catalog dispatch, finalized state/balance/tick/config/mint evidence, Token-2022 fees, signer-critical amounts, tick/price limits, traversal identity, redaction, schema digest/ETag, and downstream generated validators.
- Expected versus actual behavior: the CLMM catalog identity must dispatch to the complete emitted instruction evidence, including a bounded unique nonempty tick path, and reject missing, unknown, credential-bearing, empty/duplicate, invalid-price, or wrong-type content. Expected and actual match.
- Acceptance criteria: exact closed schema; real constructor positive; one-to-64 unique nonempty tick arrays; positive Q64 price limit; signed tick; canonical amounts and fee modes; exact constructor slot relationships with equality boundaries; exhaustive missing, unsafe, and direct-inversion negatives; detached snapshots. All criteria are met.
- Validation results: prior field/path matrix remains PASS; ordering descriptors 4/4, ordered/equality positives 2/2, and direct inversions 4/4 PASS; snapshot isolation PASS; focused suite 6/6 PASS; full suite 421/421 PASS; syntax 86/86 PASS; replay PASS at 5,542.14 blocks/s with 9,284,872-byte heap growth.
- Compatibility/performance impact: additive catalog/schema discovery changes digest/ETag but preserves current CLMM bodies and all runtime/persistence/provider interfaces. Recursive validation is bounded to 64 short catalog-address entries and the existing preparation envelope limit.
- Blockers: none for CLMM instruction evidence; its quote and the other catalog variants remain in the parent finding.

## UPSTREAM-QA-RAYDIUM-AMM-V4-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS` (implemented by `7c22aac`)
- Owner: `DEV`
- Reproduction: resolve the AMM v4 catalog row and `raydium_amm_v4_instruction_evidence_v1`; validate real constructor evidence, then submit the schema-valid mutation `stateSlot=502`, `openOrdersSlot=501`, `marketSlot=500`, `balanceSlot=499` through both the schema and `buildRaydiumAmmV4SwapBaseInputInstruction`.
- Evidence: the prior field/value controls remain closed. `7c22aac` publishes `stateSlot <= openOrdersSlot <= marketSlot <= balanceSlot` with three `minimumProperty` bindings. Independent ordered and all-equal controls pass; every direct inversion rejects.
- Affected contracts: AMM v4 pool preparation discovery, finalized state/OpenBook market/balance provenance, reserve reconstruction, signer-critical amounts, generated fail-closed validators, schema digest/ETag, and downstream signing admission.
- Expected versus actual behavior: discovery must reject component snapshots that are temporally impossible for the real constructor; expected and actual now match.
- Acceptance criteria: publish exact cross-property constraints for `stateSlot <= openOrdersSlot <= marketSlot <= balanceSlot`; preserve equality boundaries; add a positive ordered/equal control and one negative for each inversion; retain all existing closure, reserve-mode, raw-value, credential, and constructor tests. All criteria are met.
- Validation results: prior exact-shape matrix remains PASS; ordering descriptors 3/3, ordered/equality positives 2/2, and direct inversions 3/3 PASS; focused suite 6/6, full 421/421, syntax 86/86, and replay invariants PASS.
- Compatibility/performance impact: discovery-only hardening changes digest/ETag and causes clients to reject evidence already rejected at runtime. Four bounded integer comparisons are negligible; runtime bytes, persistence, providers, RPC, WebSocket, database, and configuration remain unchanged.
- Blockers: none; this scoped defect is closed.

## UPSTREAM-QA-ORCA-WHIRLPOOL-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS` (implemented by `7c22aac`)
- Owner: `DEV`
- Reproduction: resolve the Orca catalog row and `orca_whirlpool_instruction_evidence_v1`; validate real constructor evidence, then submit the schema-valid mutation `stateSlot=102`, `tickArraySlot=100`, `balanceSlot=101`, `mintEvidenceSlot=99` through both the schema and `buildOrcaWhirlpoolSwapInstruction`.
- Evidence: the prior exact shape and three-array controls remain closed. `7c22aac` publishes `stateSlot <= tickArraySlot <= balanceSlot <= mintEvidenceSlot` with three `minimumProperty` bindings. Independent ordered and all-equal controls pass; every direct inversion rejects.
- Affected contracts: Orca Whirlpool pool preparation discovery, finalized state/tick-array/balance/mint provenance, three-array traversal, oracle identity, signer-critical price and amount limits, generated fail-closed validators, schema digest/ETag, and signing admission.
- Expected versus actual behavior: discovery must reject impossible temporal ordering that real Orca construction refuses; expected and actual now match.
- Acceptance criteria: publish exact cross-property constraints for `stateSlot <= tickArraySlot <= balanceSlot <= mintEvidenceSlot`; preserve equality boundaries; add a positive ordered/equal control and one negative for each inversion; retain exact three-unique-array, oracle, closure, credential, and real-constructor tests. All criteria are met.
- Validation results: prior exact-shape matrix remains PASS; ordering descriptors 3/3, ordered/equality positives 2/2, and direct inversions 3/3 PASS; focused suite 6/6, full 421/421, syntax 86/86, and replay invariants PASS.
- Compatibility/performance impact: discovery-only hardening changes digest/ETag and aligns clients with existing runtime rejection. Four bounded integer comparisons are negligible; runtime, storage, provider, RPC, WebSocket, database, and configuration behavior remain unchanged.
- Blockers: none; this scoped defect is closed.

## UPSTREAM-QA-RAYDIUM-CPMM-QUOTE-SCHEMA-001

- Severity: `PASS` (implemented by `297987d` and `3dd2483`; previously `HIGH`)
- Owner: `DEV`
- Reproduction: resolve the CPMM catalog row's `quoteSchema`, validate real legacy-SPL and finalized Token-2022 quote shapes, then independently mutate fee mode, transfer-fee amounts, mint-evidence slot, epoch, gross/net output, and component-slot order while retaining all advertised keys and scalar constraints.
- Evidence: `297987d` adds six conditional relationships, so real legacy and Token-2022 controls validate while all 4/4 prior transfer-evidence contradictions reject. `3dd2483` adds the exact decimal-sum binding `grossOutputRaw = amountOutRaw + outputTransferFeeRaw`; its committed fee-bearing and legacy positives pass and the isolated `grossOutputRaw:"10"`, `amountOutRaw:"7"`, `outputTransferFeeRaw:"2"` mismatch rejects.
- Affected contracts: Raydium CPMM quote and preparation discovery, legacy versus Token-2022 fee provenance, finalized mint slot/epoch, gross/net quoted output, generated fail-closed validators, schema digest/ETag, and downstream quote presentation or signing admission.
- Expected versus actual behavior: generated validators accept only the scoped tuples the real quote constructor can emit. Fee/provenance and output-fee conservation now match.
- Acceptance criteria: bind `transferFeeMode:none` to zero transfer fees plus null mint slot/epoch; bind finalized mode to concrete nonnegative mint slot/epoch; bind `grossOutputRaw - amountOutRaw = outputTransferFeeRaw`; preserve both real constructor forms, exact missing gates, slot ordering, closure, redaction, and all current runtime bytes; add a negative for every contradiction.
- Validation results: real-shape controls 2/2 PASS; prior transfer-evidence contradictions reject 4/4 PASS; isolated output-netting contradiction rejects 1/1 PASS; focused committed suite 7/7 PASS; full suite 423/423 PASS; syntax 86/86 PASS; replay PASS at 8,095.49 blocks/s with 9,625,800-byte heap growth; health retains its designed nine blockers.
- Compatibility/performance impact: discovery-only semantic hardening changes digest/ETag and makes generated clients reject states runtime cannot emit. A bounded set of scalar/nullable comparisons and decimal differences is constant-time; runtime bodies, persistence, providers, RPC, WebSocket, database, and configuration remain unchanged.
- Blockers: none; the CPMM quote finding is closed.

## UPSTREAM-QA-RAYDIUM-CLMM-QUOTE-SCHEMA-001

- Severity: `PASS` (implemented by `297987d`; previously `HIGH`)
- Owner: `DEV`
- Reproduction: resolve the CLMM catalog row's `quoteSchema`, validate an exact fully consumed finalized quote, then change crossed-tick cardinality, gross input, gross output, or transfer-fee mode independently. Finally evaluate the committed positive fixture against the constructor equation `amountSpecifiedRaw - inputTransferFeeRaw = amountInRaw + feeAmountRaw + amountUnconsumedRaw`.
- Evidence: `297987d` declares `array_length` and `decimal_sum`, binds tick count to the crossed-index list, binds gross input to transfer fee plus consumed input plus AMM fee plus remainder, binds gross output to net output plus transfer fee, and binds `none` mode to zero transfer fees. The committed positive is corrected to `1000 = 5 + 993 + 2 + 0`; all 4/4 prior isolated contradictions reject under the published rules.
- Affected contracts: Raydium CLMM quote and preparation discovery, exact-input and output-fee conservation, bounded tick traversal identity, Token-2022 provenance, finalized component slots, generated trading-safety validators, schema digest/ETag, quote presentation, and signing admission.
- Expected versus actual behavior: the advertised exact closed schema rejects the scoped inconsistent signer amounts, output fees, tick-path cardinality, and fee provenance. Expected and actual now match.
- Acceptance criteria: bind crossed-tick count exactly to list length; enforce `specified - inputTransferFee = amountIn + feeAmount + unconsumed`; enforce `grossOutput - amountOut = outputTransferFee`; bind `none` mode to zero transfer fees and finalized mode to valid finalized fee evidence; replace the impossible committed positive with a real-constructor output; preserve constants, closure, redaction, slot ordering, and runtime bytes; add isolated negatives for every relationship.
- Validation results: canonical semantic control PASS; prior constructor contradictions reject 4/4 PASS; corrected committed fixture conservation PASS; credential/wrong-protocol/unsafe-status, closure, and four slot inversions remain PASS; focused committed suite 7/7 PASS; full suite 423/423 PASS; syntax 86/86 PASS; replay PASS at 8,095.49 blocks/s.
- Compatibility/performance impact: discovery-only hardening changes digest/ETag and aligns generated validation with existing constructor/execution rejection. Tick count comparison is bounded by the existing 2,048-item maximum and scalar decimal arithmetic is bounded by response-size limits; runtime, persistence, provider, RPC, WebSocket, database, and configuration behavior remain unchanged.
- Blockers: none; the CLMM quote finding is closed.

## UPSTREAM-QA-ORCA-WHIRLPOOL-QUOTE-SCHEMA-001

- Severity: `PASS` (resolved by `2e3aae3`)
- Owner: `DEV`
- Reproduction: resolve the Orca catalog row's `quoteSchema`; validate a real fully consumed finalized quote; then independently set `limitTick` below `-443636`, set `sqrtPriceLimitX64` to a positive value not derived from `limitTick`, or set `feeRateMillionths` to `1000000` while retaining every advertised key, relationship, constant, and slot order.
- Evidence: `2e3aae3` adds the exact Orca tick range, caps the canonical decimal fee string at six digits below one million, and publishes `orca_sqrt_price_at_tick`. Independent generated validation accepts the real control and rejects all 3/3 prior contradictions. Boundary/value semantics match `orcaSqrtPriceX64AtTick` and the real execution guard.
- Affected contracts: Orca Whirlpool quote/preparation discovery, finalized tick traversal, static fee evidence, unsigned swap price limits, generated trading-safety validators, schema digest/ETag, quote presentation, and signing admission.
- Expected versus actual behavior: an exact Orca quote schema must reject any price-limit or fee tuple the real constructor/execution path rejects. Expected and actual now match.
- Acceptance criteria: bound `limitTick` to the Orca range; bind `sqrtPriceLimitX64` exactly to the tick-derived Q64.64 value; require `feeRateMillionths < 1000000`; preserve real constructor bodies, exact-input/tick-count relationships, slot ordering, closure, and redaction; add one isolated negative for each contradiction.
- Validation results: real control 1/1 PASS; exact key/constant/redaction controls PASS; amount and tick relationships 2/2 PASS; slot inversions reject 3/3 PASS; tick/price/fee contradictions reject 3/3 PASS; focused committed/constructor suite 34/34 PASS; full suite 426/426 PASS; syntax 86/86 PASS; replay PASS at 6,694.68 blocks/s with 9,427,152-byte heap growth.
- Compatibility/performance impact: discovery-only semantic hardening changes digest/ETag and generated validators but need not alter runtime bodies, persistence, provider/RPC/WebSocket behavior, database, or configuration. Bounds and one deterministic tick-price relationship are response-size bounded.
- Blockers: none; the finding is closed.

## UPSTREAM-QA-RAYDIUM-AMM-V4-QUOTE-SCHEMA-001

- Severity: `PASS` (resolved by `2e3aae3`)
- Owner: `DEV`
- Reproduction: resolve the AMM v4 catalog row's `quoteSchema`; construct a real quote for input `1000`, fee `3`, input reserve `10000`, and output reserve `20000`; then replace only `amountOutRaw` with `20000` while retaining exact keys, constants, fee bound, reserve provenance, missing gates, and component-slot order.
- Evidence: `2e3aae3` publishes `amountOutRaw < outputReserveRaw` plus `constant_product_exact_input`. Independent generated validation accepts constructor output `1813` and rejects both reserve-ceiling output `20000` and isolated equation mismatch `1812` for the same input, fee, and reserves.
- Affected contracts: Raydium AMM v4 quote/preparation discovery, OpenBook-backed reserve reconstruction, swap-fee and constant-product output provenance, generated trading-safety validators, schema digest/ETag, price presentation, and signing admission.
- Expected versus actual behavior: an exact reserve-backed quote schema must bind the quoted output to the constructor's integer constant-product result. Expected and actual now match.
- Acceptance criteria: require `amountOutRaw < outputReserveRaw` and bind it exactly to the integer constant-product equation using `amountInRaw`, `swapFeeRaw`, `inputReserveRaw`, and `outputReserveRaw`; preserve the real constructor body, fee bound, slot ordering, reserve provenance, missing gates, closure, and redaction; add isolated reserve-ceiling and equation-mismatch negatives.
- Validation results: real constructor control 1/1 PASS; exact key/constant/reserve/redaction controls PASS; fee-bound and missing-gate controls PASS; slot inversions reject 3/3 PASS; reserve ceiling and equation mismatch reject 2/2 PASS; focused committed/constructor suite 34/34 PASS; full suite 426/426 PASS; syntax 86/86 PASS; replay PASS at 6,694.68 blocks/s with 9,427,152-byte heap growth.
- Compatibility/performance impact: discovery-only semantic hardening changes digest/ETag and generated validators while preserving runtime response bytes, persistence, providers, RPC/WebSocket, database, and configuration. Integer arithmetic remains bounded by the existing response/raw-amount limits.
- Blockers: none; the finding is closed.

## UPSTREAM-METEORA-DLMM-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS` (resolved by `5d92788`)
- Owner: `DEV`
- Reproduction: construct a real legacy SPL swap with optional finalized transfer-hook route data, then validate its evidence; independently mutate either legacy transfer fee from zero to one while retaining every other field.
- Evidence: `5d92788` narrows legacy emptiness to remaining-account slices, preserves the finalized route-data summary and source-slot binding that the constructor emits, and conditionally requires both legacy fees to equal zero. The real route-data control now validates; both isolated nonzero-fee mutations reject; the four prior bitmap/hook/version/uniqueness contradictions remain rejected.
- Affected contracts: Meteora DLMM preparation discovery, finalized bin-array/bitmap identity, Token-2022 transfer-hook source evidence, remaining-account slice encoding, unsigned message policy, generated trading-safety validators, schema digest/ETag, and signing admission.
- Expected versus actual behavior: an exact instruction-evidence schema accepts every real constructor output and rejects constructor-impossible legacy fee/slice states. Expected and actual now match for every reported Meteora relationship.
- Acceptance criteria: admit exact optional finalized route summaries for legacy construction; require empty legacy slices and zero legacy SPL fees; retain bitmap pairing, hook-row bounds, slice uniqueness, real Token-2022 controls, and isolated negatives. All criteria are met.
- Validation results: real legacy route-data control PASS; nonzero legacy fee negatives 2/2 reject; four prior contradictions remain rejected; focused Meteora/Phoenix suite 9/9 PASS; full suite 427/427 PASS; syntax 86/86 PASS; replay PASS at 5,949.65 blocks/s with 9,618,064-byte heap growth.
- Compatibility/performance impact: discovery-only semantic hardening changes digest/ETag and generated validators but need not alter runtime bodies, persistence, provider/RPC/WebSocket behavior, database, or configuration. Relationships are bounded by the existing 512 hook-summary and two-slice maxima.
- Blockers: none; the finding is closed.

## UPSTREAM-PHOENIX-IOC-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS` (resolved by `fabc123`)
- Owner: `DEV`
- Reproduction: construct a real Phoenix bid with `lastValidSlot = quoteCurrentSlot + 150`, then validate it and exact u64 maximum price evidence; independently test `+151` expiry and `2^64` price through both the published schema and direct constructor.
- Evidence: `fabc123` adds `maximumProperty` plus `maximumOffset:150` to expiry and `maximumRaw:18446744073709551615` to every constructor-u64 evidence field. The real ceiling control and exact u64 maximum validate; both overflow mutations reject in the schema and constructor; all prior side/lot/output contradictions remain rejected.
- Affected contracts: Phoenix IOC preparation discovery, finalized market/slot evidence, side-specific lot encoding, minimum-fill safety, unsigned transaction policy, generated trading-safety validators, schema digest/ETag, and signing admission.
- Expected versus actual behavior: an exact Phoenix instruction-evidence schema accepts real boundary outputs and rejects constructor-impossible expiry and u64 values. Expected and actual now match for every reported Phoenix direction.
- Acceptance criteria: bind `lastValidSlot <= quoteCurrentSlot + 150`; cap all constructor-u64 evidence fields; preserve exact keys, slot order, side-specific lot rules, output ordering, and real bid/ask controls; add ceiling, maximum, and overflow tests. All criteria are met.
- Validation results: real maximum-expiry control PASS; exact u64 maximum PASS; `+151` expiry and `2^64` price reject in both schema and constructor; prior side/lot/output negatives remain closed; independent combined harness 22 probes; focused suite 29/29 PASS; full suite 430/430 PASS; syntax 86/86 PASS; replay PASS at 8,890.62 blocks/s with 9,373,776-byte heap growth.
- Compatibility/performance impact: discovery-only semantic hardening changes digest/ETag and generated validators while preserving runtime bodies, persistence, providers, RPC/WebSocket, database, and configuration. Relative-slot and bounded decimal checks remain constant-time over the bounded response envelope.
- Blockers: none; the finding is closed.

## UPSTREAM-OPENBOOK-V2-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS` (resolved by `fabc123`)
- Owner: `DEV`
- Reproduction: validate the exact `prepareOpenBookPlaceTakeOrderSimulation` instruction evidence, then independently test current-slot inversion, `minimumOutputRaw > quotedOutputRaw`, signed-i64 maximum/overflow, and u64 overflow through the published schema and direct constructor where applicable.
- Evidence: `fabc123` adds the real `minimumOutputRaw`, binds it below quoted output, orders current slot after balance, caps amount fields at u64, and caps encoded lot fields at signed i64. The exact preparation body and signed-i64 maximum validate; every inversion or overflow probe rejects as the constructor does.
- Affected contracts: OpenBook V2 preparation discovery, real preparation-body compatibility, finalized market/book/oracle/balance/current-slot evidence, IOC price/lot encoding, minimum-output safety, generated trading-safety validators, schema digest/ETag, and signing admission.
- Expected versus actual behavior: the catalog schema accepts the exact preparation evidence and rejects constructor-impossible slot, output, signed-lot, and amount bounds. Expected and actual now match for every reported OpenBook direction.
- Acceptance criteria: include and bind positive canonical minimum output; order current and balance slots; cap signed lots and u64 amounts; preserve exact closure, vocabulary, input conservation, and real preparations; add equality, maximum, inversion, and overflow tests. All criteria are met.
- Validation results: exact real preparation PASS; current-slot and minimum-output inversions reject; signed-i64 maximum PASS and overflow rejects in schema/constructor; u64 overflow rejects; independent combined harness 22 probes; focused suite 29/29 PASS; full suite 430/430 PASS; syntax 86/86 PASS; replay PASS at 8,890.62 blocks/s with 9,373,776-byte heap growth.
- Compatibility/performance impact: adding the omitted real field repairs compatibility but changes digest/ETag and generated validators; runtime bodies, persistence, providers, RPC/WebSocket, database, and configuration need not change. Slot and bounded decimal checks are constant-time over the bounded preparation envelope.
- Blockers: none; the finding is closed.

## UPSTREAM-PUMP-SWAP-SELL-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS` (resolved by `f2c8a2a`)
- Owner: `DEV`
- Reproduction: construct real PumpSwap sell evidence and validate it against `pump_swap_sell_instruction_evidence_v1`. Retain every valid field but replace only `protocolFeeRecipient` with the system program, or `buybackFeeRecipient` with the malformed value `x`; compare schema admission with `buildPumpSwapSellInstruction`.
- Evidence: `f2c8a2a` replaces both recipient rules with declared `solana-public-key` format, canonical base58 alphabet/length, and `notValues` exclusion for the system program. Canonical constructor identities validate; system, one-character, invalid-alphabet, and pattern-only invalid 32/44-character controls reject.
- Affected contracts: PumpSwap sell preparation discovery, finalized GlobalConfig fee-recipient authority, instruction account derivation, generated trading-safety validators, schema digest/ETag, simulation, and signing admission.
- Expected versus actual behavior: generated validation rejects fee-recipient identities that the real sell constructor cannot encode or authorize as non-system Solana public keys. Expected and actual now match.
- Acceptance criteria: require canonical Solana public-key encoding for both recipient fields and exclude the system program; retain exact sell keys without `trackVolume`, slot/amount/output bounds, real constructor controls, and isolated malformed/system-recipient negatives.
- Validation results: all recipient controls PASS within the independent 38-probe harness; real finalized PumpSwap snapshot/quote/constructor regression PASS; focused suite 4/4 PASS; full suite 432/432 PASS; syntax 86/86 PASS; replay PASS at 6,318.58 blocks/s with 9,869,480-byte heap growth.
- Compatibility/performance impact: discovery-only recipient-domain hardening changes digest/ETag and generated validators while preserving runtime bodies, persistence, RPC/WebSocket, database, and configuration. Public-key syntax and one excluded identity are constant-time bounded checks.
- Blockers: none; the finding is closed.

## UPSTREAM-PUMP-SWAP-BUY-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS` (resolved by `f2c8a2a`)
- Owner: `DEV`
- Reproduction: construct real PumpSwap buy-exact-quote-in evidence and validate it against `pump_swap_buy_instruction_evidence_v1`. Retain every valid field including `trackVolume:true` but replace either fee recipient with the system program or malformed value `x`; compare schema admission with `buildPumpSwapBuyExactQuoteInInstruction`.
- Evidence: `f2c8a2a` applies the same declared `solana-public-key`, canonical base58 alphabet/length, and explicit system-program exclusion to both buy recipient fields without weakening `trackVolume:true`, closure, slots, amounts, or output ordering.
- Affected contracts: PumpSwap buy preparation discovery, finalized GlobalConfig fee-recipient authority, volume-accumulator instruction identity, generated trading-safety validators, schema digest/ETag, simulation, and signing admission.
- Expected versus actual behavior: generated validation rejects fee-recipient identities the real buy constructor cannot encode or authorize as non-system Solana public keys. Expected and actual now match while direction-specific volume tracking remains closed.
- Acceptance criteria: require canonical Solana public-key encoding for both recipient fields and exclude the system program; retain exact buy keys, `trackVolume:true`, slot/amount/output bounds, real constructor controls, and isolated malformed/system-recipient negatives.
- Validation results: all recipient controls PASS within the independent 38-probe harness; direction-specific committed regressions and finalized PumpSwap snapshot/quote/constructor regression PASS; focused suite 4/4 PASS; full suite 432/432 PASS; syntax 86/86 PASS; replay PASS at 6,318.58 blocks/s with 9,869,480-byte heap growth.
- Compatibility/performance impact: discovery-only recipient-domain hardening changes digest/ETag and generated validators while preserving runtime bodies, persistence, RPC/WebSocket, database, and configuration. Public-key syntax and one excluded identity are constant-time bounded checks.
- Blockers: none; the finding is closed.

## UPSTREAM-PUMP-SWAP-SELL-QUOTE-SCHEMA-001

- Severity: `PASS` (delivered by `6b8acb8`)
- Owner: `DEV`
- Reproduction: obtain the sell catalog row and validate a finalized `base_to_quote` PumpSwap quote against its referenced schema; independently mutate direction, add a credential field, invert config/balance slots, set a positive amount to zero or above u64, and reorder the exact missing execution gates.
- Evidence: `6b8acb8` publishes and references `pump_swap_sell_quote_v1`, closing all 28 real fields with constant protocol/status/safety/direction identity, positive bounded amounts and reserves, bounded fees, ordered evidence slots, timestamp, and exact execution gates. The valid control passes and all six isolated negative classes reject.
- Affected contracts: PumpSwap sell quote discovery, finalized reserve/fee provenance, preparation admission, AI/commercial validation, secret redaction, schema digest/ETag, and non-authorizing execution boundaries.
- Expected versus actual behavior: generated clients can validate the exact sell quote and reject cross-direction, open, stale-order, impossible amount, or unsafe execution-gate forms. Expected and actual match.
- Acceptance criteria: closed direction-specific schema; positive u64 amount/reserve bounds; zero-admitting fee bounds; state/balance/config/mint ordering; exact safety constants and missing gates; real constructor-derived quote control plus isolated negatives. All criteria are met.
- Validation results: independent sell quote matrix 7/7 PASS inside the 38-probe harness; committed direction-specific and finalized snapshot/quote regressions PASS; focused 4/4, full 432/432, syntax 86/86, and replay PASS.
- Compatibility/performance impact: additive discovery metadata changes digest/ETag and generated validators without changing runtime quote bytes, persistence, RPC/WebSocket, database, or configuration. Validation is bounded by a fixed 28-field envelope.
- Blockers: none.

## UPSTREAM-PUMP-SWAP-BUY-QUOTE-SCHEMA-001

- Severity: `PASS` (delivered by `6b8acb8`)
- Owner: `DEV`
- Reproduction: obtain the buy-exact-quote-in catalog row and apply the same real-control and six isolated negatives to its referenced `quote_to_base` schema.
- Evidence: `6b8acb8` publishes and references distinct `pump_swap_buy_quote_v1`; the exact direction differs while all provenance, amount, reserve, fee, slot, timestamp, safety, and missing-gate constraints remain closed. The valid control passes and every negative rejects.
- Affected contracts: PumpSwap buy quote discovery, finalized reserve/fee provenance, preparation admission, AI/commercial validation, secret redaction, schema digest/ETag, and non-authorizing execution boundaries.
- Expected versus actual behavior: generated clients can validate the exact buy quote without admitting a sell quote or an open, malformed, impossible, or execution-ready mutation. Expected and actual match.
- Acceptance criteria: distinct exact direction plus the complete sell-equivalent bounded closure and real constructor-derived quote controls. All criteria are met.
- Validation results: independent buy quote matrix 7/7 PASS inside the 38-probe harness; committed direction-specific and finalized snapshot/quote regressions PASS; focused 4/4, full 432/432, syntax 86/86, and replay PASS.
- Compatibility/performance impact: additive discovery metadata only; fixed-envelope validation is bounded and replay remains above 6,300 blocks/s with bounded heap growth.
- Blockers: none.

## UPSTREAM-PUMP-BONDING-SELL-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: resolve the sell-v2 catalog row, compare its referenced schema with `buildPumpSellV2Instruction().evidence`, then apply unknown-field, slot inversion, zero/overflow raw amount, minimum-above-quote, unsupported token-mode, and system-recipient mutations.
- Evidence: all twelve constructor keys exactly equal the closed required/property sets. The real control validates and 9/9 independent negative mutations reject; the committed sell construction/simulation test passes.
- Affected contracts: token `prepare-swap`, Pump sell-v2 instruction evidence, finalized curve/mint/config provenance, token-program mode, raw bounds, fee-recipient identity, schema digest/ETag, and generated signing admission.
- Expected versus actual behavior: generated validators must accept the exact real constructor evidence and reject constructor-impossible or credential-bearing forms. Expected and actual match.
- Acceptance criteria: exact closed key parity, ordered slots, supported token modes, positive u64 fields, minimum output not above quote, canonical non-system fee recipients, and focused constructor regression. All criteria are met.
- Validation results: independent positive 1/1 and negative 9/9 PASS; focused Pump suite 5/5, full 433/433, syntax 86/86, and replay PASS.
- Compatibility/performance impact: additive discovery metadata only; fixed-size validation is bounded and runtime transaction bytes are unchanged.
- Blockers: none.

## UPSTREAM-PUMP-BONDING-BUY-INSTRUCTION-EVIDENCE-SCHEMA-001

- Severity: `PASS`
- Owner: `DEV`
- Reproduction: resolve the buy-exact-quote-in-v2 catalog row, compare its referenced schema with `buildPumpBuyExactQuoteInV2Instruction().evidence`, and run the shared mutation matrix plus committed buy construction and immutable-chain tests.
- Evidence: the buy constructor emits the same exact twelve-key evidence shape as sell. The shared finalized-slot, token-program, positive-u64, output-bound, redaction, and non-system recipient controls all apply; focused buy construction and chain tests pass.
- Affected contracts: token `prepare-swap`, Pump buy-exact-quote-in-v2 instruction evidence, finalized curve/mint/config provenance, token-program mode, quote budget/output bounds, recipient identity, schema digest/ETag, and generated signing admission.
- Expected versus actual behavior: the catalog must select a closed schema matching the exact buy constructor and fail closed on impossible evidence. Expected and actual match.
- Acceptance criteria: exact key parity with the real buy constructor plus every shared negative boundary and focused buy regressions. All criteria are met.
- Validation results: producer key parity PASS, shared independent negative matrix 9/9 PASS, focused Pump suite 5/5, full 433/433, syntax 86/86, and replay PASS.
- Compatibility/performance impact: additive discovery metadata only; bounded fixed-envelope validation and no runtime/persistence change.
- Blockers: none.

## UPSTREAM-PUMP-BONDING-SELL-QUOTE-SCHEMA-001

- Severity: `PASS` (delivered by `496e33f`)
- Owner: `DEV`
- Reproduction: validate the real `sellRouteQuote` body and the five prior economic negatives against `pump_bonding_curve_sell_quote_v1`; then preserve `totalFeeRaw=13` while changing only `protocolFeeRaw` from `10` to `0` and `creatorFeeRaw` from `3` to `13`, leaving their basis points at `100` and `25`.
- Evidence: `496e33f` retains the five bounded relationships and adds exact ceiling-fee relationships for all three sell components. The real positive passes, all 5/5 prior contradictions reject, and the isolated component redistribution now rejects because every raw fee is bound to `ceil(grossQuoteAmountRaw * correspondingBasisPoints / 10000)`.
- Affected contracts: token quote and preparation discovery, launch-token displayed price/output, fee disclosure, liquidity bounds, generated AI/trading-safety validators, schema digest/ETag, and pre-signing admission.
- Expected versus actual behavior: generated validation rejects economics the real sell constructor cannot emit. Expected and actual now match.
- Acceptance criteria: retain the five economic relationships; bind every fee component to its exact constructor rounding formula and corresponding basis points; preserve real legacy and transfer-neutral Token-2022 controls; add real positive and isolated component/BPS negatives. All criteria are met.
- Validation results: real positive 1/1 PASS; prior negatives 5/5 reject; component-fee/BPS negative 1/1 rejects. Focused committed suite 7/7, full 434/434, syntax 86/86, and replay PASS.
- Compatibility/performance impact: discovery-only hardening changes digest/ETag while preserving valid runtime bodies. Fixed-count integer relationships are bounded.
- Blockers: none; this finding is closed.

## UPSTREAM-PUMP-BONDING-BUY-QUOTE-SCHEMA-001

- Severity: `PASS` (delivered by `13a55a0`)
- Owner: `DEV`
- Reproduction: call `buyRouteQuote` with spendable input `10004`, protocol fee `1` bps, creator fee `1` bps, and sufficient finalized curve liquidity; validate the returned body against `pump_bonding_curve_buy_quote_v1`.
- Evidence: `13a55a0` recomputes both component fees after correcting the net budget. The real boundary now returns net `10000`, fees `1+1`, total `2`, and satisfies all seven relationships. Independent inputs `9990..10020` are 31/31 available and schema-compatible; an isolated component contradiction rejects.
- Affected contracts: token quote and preparation discovery, launch-token input budget/output, fee disclosure, token-liquidity bounds, generated AI/trading-safety validators, schema digest/ETag, and pre-signing admission.
- Expected versus actual behavior: every real constructor body satisfies its advertised schema while constructor-impossible fee components reject. Expected and actual now match.
- Acceptance criteria: use one exact post-correction fee basis; retain the five economic relationships; cover the `10004` at `1/1` bps boundary, adjacent inputs, ordinary controls, and isolated component negatives. All criteria are met.
- Validation results: boundary 1/1 PASS; adjacent inputs 31/31 PASS; isolated component negative rejects; focused committed suite 6/6, full 434/434, syntax 86/86, and replay PASS.
- Compatibility/performance impact: fee atoms can decrease on rare correction boundaries and leave at most two unspent budget atoms in the verified range; the route is max-input bounded and validation remains fixed-count.
- Blockers: none; this finding is closed.

## UPSTREAM-PHOENIX-QUOTE-SCHEMA-001

- Severity: `PASS` (delivered by `496e33f`)
- Owner: `DEV`
- Reproduction: validate real `quoted/0` and `partial/1` Phoenix bodies, then isolate `partial/0` and `quoted/1` status/remaining-input contradictions without changing any aggregate or provenance field.
- Evidence: `496e33f` adds two conditional patterns matching `quotePhoenixSnapshotExactInput`: `quoted` requires zero left and `partial` requires positive left. Both real controls validate and both isolated contradictions reject.
- Affected contracts: Phoenix quote/preparation discovery, exact IOC fill completeness, generated AI/trading-safety validators, schema digest/ETag, partial-fill display, and pre-signing admission.
- Expected versus actual behavior: `quoted` implies zero remaining input and `partial` implies positive remaining input. Expected and actual now match.
- Acceptance criteria: enforce the exact two-way invariant; retain closed bounded levels, aggregate sums, slot ordering, execution boundaries, both real controls, and isolated status/left negatives. All criteria are met.
- Validation results: real controls 2/2 PASS; isolated status/left negatives 2/2 reject; focused committed suite 7/7, full 434/434, syntax 86/86, and replay PASS.
- Compatibility/performance impact: additive discovery hardening changes digest/ETag and generated validators without changing valid runtime quote bytes. Validation is constant-time beyond the already bounded level aggregation.
- Blockers: none; this finding is closed.

## UPSTREAM-METEORA-DLMM-QUOTE-SCHEMA-001

- Severity: `FAIL` / `HIGH`
- Owner: `DEV`
- Reproduction: generate a real X-to-Y quote crossing bins 70 and 69 in arrays 1 and 0. Change one row's trading fee and fee capacity together, then recompute `capacityCommitment` with the published `sha256-json-array-v1` algorithm while preserving top-level aggregates and every other field. Apply every published `meteora_dlmm_quote_v1` relationship.
- Evidence: `9c477e8` adds the complete row tuple, `binArrayPayloadHash`, and a SHA-256 digest. A real row verifies and a mutation retaining the old digest rejects. Recomputing the digest after mutation verifies successfully because the payload hash is an untrusted response field rather than an independently anchored finalized snapshot identity. `d9fcd1a` closes unsigned construction with exact server-side reproduction, `a5583fe` exposes that result as required closed instruction evidence, and `97befe5` proves the verified label with a real quote-engine result, but schema-only quote consumers still receive only self-consistency evidence.
- Affected contracts: Meteora quote/preparation discovery, legacy and Token-2022 transfer-fee safety, trading/protocol fee display, bin-path provenance, generated AI/trading validators, schema digest/ETag, and pre-signing admission.
- Expected versus actual behavior: the advertised schema must admit every real producer body and reject per-array economics the finalized producer cannot emit. A digest over mutable response fields is insufficient unless at least one input is authenticated or independently bound to finalized source evidence.
- Acceptance criteria: retain all completed direction, transfer-fee, range, global aggregate, path, capacity, collect-fee-on-output, and execution-gate controls; bind each payload hash to immutable finalized snapshot evidence or a trusted producer signature; retain the real positive plus preserved-digest and recomputed-digest negatives.
- Validation results: real and preserved-digest controls PASS; execution-time reproduction, required evidence labeling, real-producer verification proof, complete dialect declaration, bootstrap schema, nested dialect closure, admission-order closure, admission-outcome closure, canonicalization closure, path-profile closure, and value-catalog closure PASS; schema-only recomputed coupled mutation FAIL because it is admitted. Focused contract 3/3 and Meteora suites 19/19 PASS; full 441/441 PASS; syntax 86/86 PASS; replay PASS at 5,827.42 blocks/s with 9,663,856-byte heap growth.
- Compatibility/performance impact: the additive quote fields and expanded relationship change digest/ETag and generated validators. A bounded content commitment or finalized row-local proof must remain within the existing 13,312-row cap; no replay or full-suite regression is observed.
- Blockers: none; deterministic offline reproduction.

## UPSTREAM-OPENBOOK-V2-QUOTE-SCHEMA-001

- Severity: `PASS` (delivered by `7d8fb92`)
- Owner: `DEV`
- Reproduction: sweep one-base-lot asks from `takerFeeMillionths=989990` through the inclusive `1000000` decoder maximum and compare producer availability with the exact ceiling-rounded output; retain ordinary bid/ask and isolated lot-economics contradictions.
- Evidence: `7d8fb92` changes the producer boundary from `output < 0n` to `output <= 0n`. Independent sweep accepts all 11 positive-output fee values through `990000` and rejects all 10,000 zero-output values from `990001` through `1000000`, with no mismatch. Ordinary bid/ask plus the adjacent output-1 control satisfy every relationship, and all six isolated contradictions reject.
- Affected contracts: OpenBook quote/preparation discovery, displayed fill/output and fee economics, exact-input dust, generated AI/trading-safety validators, schema digest/ETag, and pre-signing admission.
- Expected versus actual behavior: every emitted quote has positive output and satisfies the advertised lot economics; mathematically zero-output depth fails closed. Expected and actual now match.
- Acceptance criteria: retain the lot-economics relationship and ordinary bid/ask negatives; reject the exact maximum and complete zero-output interval; preserve the adjacent positive-output boundary. All criteria are met.
- Validation results: fee sweep 10,011/10,011 PASS; real controls 3/3 PASS; isolated contradictions 6/6 reject; focused committed suite 5/5, full 435/435, syntax 86/86, and replay PASS.
- Compatibility/performance impact: zero-output asks now return quote-unavailable instead of an unusable analysis quote; positive quotes and bounded integer arithmetic are unchanged.
- Blockers: none; this finding is closed.

## UPSTREAM-QA-PREPARATION-SUCCESS-NESTED-BOUNDARY-001

- Severity: `FAIL` / `HIGH`
- Owner: `DEV`
- Reproduction: inspect `preparation_success_v1` from `/api/v1/query-contracts`; validate its closed top-level, handoff, binding, preparation, transaction, simulation-policy, universal instruction-amount, and input/output effect relationships, then apply the published rules to protocol-specific `quote` or `preparation.instructionEvidence` objects containing unknown credentials, unsafe quote state, or wrong program evidence.
- Evidence: prior increments close handoff, transaction, policy, universal amounts, all three input/output effect bindings, catalog discovery, and type/protocol membership. All eleven instruction-evidence variants and all eleven quote schemas are referenced. Ten quote schemas match their constructors. Meteora publishes direction, transfer fees, aggregate traversal, decoder ranges, per-array capacities, a self-consistency digest, exact execution reproduction, and explicit verified/unattested instruction evidence; the quote digest's payload-hash input remains unanchored and recomputable for schema-only consumers.
- Affected contracts: pool and token preparation success discovery, generated trading-safety validators, execution-handoff binding and preparation hash, quote identity/provenance, unsigned transaction evidence, signer/submission boundaries, secret redaction, schema digest/ETag, and downstream AI/commercial admission.
- Expected behavior: preparation success discovery must explicitly project and close venue-specific quote and instruction-evidence variants so empty, unknown, credential-bearing, wrong-program, or unsafe content fails closed.
- Actual behavior: external authority, cataloged preparation identity, preparation, transaction, shared simulation policy, universal raw amounts, all three signer-to-effect relationships, all eleven instruction-evidence variants, and ten quote variants are verifiable. Meteora remains semantically underbound at row-local traversal economics, leaving one variant outcome unsafe.
- Acceptance criteria: define closed bounded discriminated variants for `quote` and `instructionEvidence`; reject empty, unknown credential-bearing, wrong-program, unsafe-quote, and cross-object mismatches; retain all real venue bodies and every completed handoff/preparation/transaction/simulation-policy boundary.
- Validation results: prior closed boundaries, Meteora execution reproduction, instruction-evidence labeling, real-producer verification proof, complete dialect declaration, bootstrap schema, nested dialect closure, admission-order closure, admission-outcome closure, canonicalization closure, path-profile closure, and value-catalog closure PASS; strict protocol-specific schema closure remains 21/22 PASS and 1/22 FAIL (ten quote plus all eleven instruction variants PASS; Meteora finalized-content discovery parity fails). Focused contract 3/3 and Meteora suites 19/19 PASS; full suite 441/441 PASS; syntax 86/86 PASS; replay PASS at 5,827.42 blocks/s with 9,663,856-byte heap growth.
- Compatibility impact: this is a discovery hardening requirement; runtime bytes may remain unchanged, but generated clients must regenerate after the schema digest changes. Protocol-specific unions must cover every currently emitted venue without weakening unknown-field rejection.
- Performance impact: bounded nested validation is proportional to the already bounded preparation envelope; no replay or full-suite regression is currently observed.
- Blockers: none; the defect is deterministic and offline reproducible.

## UPSTREAM-QA-OPS-001

- Severity: `BLOCKED`
- Owner: `DEV`
- Reproduction: run `npm run health:operational`; load `data/index.json` and `data/mainnet-index.json` through `IndexStore.health(120000)`; assess retained `data/external-exporter-status.json` with the repository exporter-health contract.
- Evidence: the schema-v2 operational smoke exits 1 with nine ordered blockers: provider, index events, transactions, instructions, freshness, exporter, warehouse, backup, and recovery. No supported provider environment variable is configured. Both retained indexes continue to lack canonical mainnet identity and fail the freshness gate. The retained external exporter evidence is finalized with zero consecutive failures but is 406,432 slots behind and 651,249,758 ms old at this trigger, so it is not active evidence.
- Affected contracts: current ingestion freshness/finality, failover, warehouse convergence, backup/recovery readiness, public health, bot readiness, and live token/holder/whale/trader/pool/price/liquidity/volume qualification.
- Expected behavior: redacted fresh canonical-mainnet provider, exporter, exact warehouse convergence, backup, and recovery evidence are available; any missing, stale, lagged, malformed, or wrong-network input fails closed.
- Actual behavior: current live qualification cannot run; retained evidence correctly fails closed and was not treated as authoritative current mainnet data.
- Acceptance criteria: provide a redacted current canonical-mainnet operational evidence bundle with exact warehouse and fresh backup/recovery qualification while retaining every fail-closed boundary.
- Validation results: repository retry/failover, operational evidence, recovery, redaction, full regression, and replay checks pass; no provider, database, or production mutation was attempted.
- Compatibility/performance impact: no contract regression observed; sustained live ingestion and sink performance remain unqualified.
- Blockers: no configured provider endpoints or fresh active exporter/warehouse/backup/recovery evidence.

- NEXT_DEV_ACTION: bind each Meteora `binArrayPayloadHash` to independently verifiable immutable finalized snapshot evidence or a trusted producer signature so a recomputed commitment over constructor-impossible economics rejects, retaining every completed direction, transfer-fee, aggregate, range, capacity, and execution-safety control.
