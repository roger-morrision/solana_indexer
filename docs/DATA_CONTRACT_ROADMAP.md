# Data contract and roadmap

This matrix describes verified capabilities, not aspirational marketing claims.

Pool-risk execution contracts distinguish durable `venueQualified` snapshot
capability from fresh per-order evidence. They expose the bound venue evidence
slot but always require a new local simulation, signer-policy approval, and
landed-message verification through `new_order_execution_required`; prior venue
or transaction history cannot unlock a future order.

Operational snapshot workers bind every claimed PostgreSQL job type and exact
deduplication key to its validated pool or mint target before starting a child
process. Attempt counters must be positive safe integers, and each claim must
carry its job-type-specific reason, canonical UTC scheduling timestamp, and
nullable nonnegative safe-integer source slot, so malformed or cross-target
repair rows fail before provider access.

The read-only JSON-RPC surface includes address-bound, stable-cursor retained
transaction history through `getIndexedSignaturesForAddress`. Results expose
finalized compact outcomes plus explicit partial retained-history coverage;
cursors cannot cross addresses, and the method does not impersonate validator
history completeness.

Direct token-account lookup and owner inventory are available through the
fail-closed `getIndexedTokenAccount` and `getIndexedTokenAccountsByOwner` RPC
methods. Owner inventory uses owner/mint-bound cursors,
keeps exact raw balances separate from snapshot-backed Token-2022 withheld
amounts, discloses per-account snapshot completeness, and never claims global
wallet completeness from the tracked mint set. Its canonical projection check
is scoped to the selected mints: relevant account or snapshot-hash corruption
fails closed without coupling wallet availability to unrelated pool snapshots.
Explicit mint filters validate that mint even for an empty owner result, so
corrupt relevant snapshot evidence cannot masquerade as an empty healthy page.
The `getIndexedTokenSupply` RPC method exposes only exact raw supply from the
same canonical finalized mint/account snapshot, separately discloses
Token-2022 mint-withheld fees, and fails closed when a tracked mint lacks that
complete evidence.
The mint-bound, stable-cursor `getIndexedTokenLargestAccounts` RPC view orders
positive accounts by exact raw balance and address, preserves owner/program and
withheld-fee evidence, and is available only from the same complete finalized
snapshot. Owner and largest-account cursors bind a digest of their exact ordered
projection; largest-account cursors additionally bind the snapshot slot, so a
replacement cannot silently mix pages from different account states.
The `getIndexedTokenHolders` RPC view provides exact owner aggregation from the
canonical account projection and carries snapshot freshness, Token-2022
withheld funds, reviewed exclusion evidence, concentration assessability, and
explicit missing gates. Its cursor binds the ordered owners, snapshot identity,
and exclusion governance state; it never claims automation safety.

Persisted instructions for registered swap programs must carry the current
registry version, protocol identity, and decoder version. Health and bot
readiness fail closed with `indexed_decoder_registry_stale` when old indexed
facts survive a decoder upgrade, making a verified replay/backfill mandatory
instead of silently treating legacy coverage as current.

Decoder-output coverage additionally binds every successful, exactly recognized
swap instruction to a normalized swap fact with the same transaction and protocol-specific
pool, direction, mint and user identity fields available in that instruction ABI.
The current scope covers the execution ABIs for Raydium CPMM/CLMM, Orca
Whirlpools, PumpSwap, Pump bonding curve, and Meteora DLMM. Recognition requires
the exact program, discriminator, and instruction layout (including bounded,
unique Meteora `Swap2` remaining-account slices), and preserves invocation cardinality when one
transaction contains multiple identical same-protocol swaps. A detached event with only the
same protocol can no longer hide dropped decoder output. The capability is explicit as
`completeDecoderOutput`; health and bot readiness fail closed with
`indexed_decoder_output_incomplete` when retained instruction output is missing.
The protocol enumeration expands only with discriminator-backed instruction tests.
The same gate covers instruction-backed lifecycle output for Raydium CPMM/CLMM
pool creation, Orca legacy/v2/adaptive pool creation, Meteora DLMM legacy/current pair creation, PumpSwap pool creation, and Pump bonding-curve creation plus
legacy/current migrations. Exact output-type cardinality and every instruction-derived
normalized transition field (including pool/config, ordered mints, vaults, initial amounts
or price, source pool, programs, modes and bin step where the ABI exposes them) must match
the normalized lifecycle fact, so an unrelated or partially misbound same-type transition
cannot mask loss. Pump `create_v2` recognition shares the decoder's complete 13-character
symbol boundary. Pump completion remains a log-event
contract because its normalized evidence is
not derived from a corresponding retained instruction ABI.
Persisted and replay-embedded lifecycle transitions independently enforce the complete
protocol/type-specific normalized shape before health, warehouse, Redis, REST, or WebSocket
publication. Required configuration, vault, program, mode, amount, migration, and metadata
fields cannot disappear after decoding. CLMM and Whirlpool initial square-root prices retain
their full unsigned 128-bit domain; they are not narrowed to u64 during persistence checks.
For every retained canonical block slot, the latest replay envelope's complete lifecycle
and swap multisets must equal the canonical `programEvents` and `swaps` ledgers byte-for-byte
after canonical serialization. Finality promotion and fork replacement select the latest matching blockhash;
expired slots outside compatibility-state retention are not incorrectly resurrected. This
prevents independently valid but divergent REST/warehouse and WebSocket market histories.

Reviewed holder exclusions use a version-2 canonical-content hash and explicit
expiry. Their governance lifetime is independent of market-data freshness, while
both future review evidence and expired labels fail every concentration/risk gate
closed. The hash and expiry are disclosed with applied exclusion totals.

REST and RPC pagination cursors are opaque, canonical Base64URL version-1
objects with exact key/scope fields. Missing, extra, noncanonical, cross-filter,
cross-collection, and cross-protocol scopes fail with stable invalid-parameter
contracts instead of restarting or drifting pagination. Mutable token and pool
catalogs additionally bind the exact ordered projection digest, invalidating
continuation after insertions, removals, metadata refreshes, lifecycle
transitions, or snapshot-field changes.

Holder exclusion registries now bind every mint, owner and token-account
selector to a canonical 32-byte Solana base58 address before their reviewed
completeness can affect concentration, security or bot-safety projections.
Credential-free stats and fixed-cardinality Prometheus gauges expose registry
configuration, freshness, age/expiry, complete-mint count and entry count without
leaking selectors, evidence labels or hashes.

| Consumer | Required data | Current source | Normalized contract | Freshness / safety | Exposure | Coverage |
|---|---|---|---|---|---|---|
| Terminal DEX activity | provisional and canonical blocks, transactions, transfers and swaps | local Agave confirmed/finalized PubSub plus HTTP gap repair; reduced mode uses Helius/Alchemy finalized polling | exact slots, hashes, signatures, per-fact provider provenance and parser-preserved confirmed/finalized commitment, per-transaction event index/swap ID, string base-unit amounts | every configured local/external failover node independently passes mainnet genesis verification before any data call (external evidence refreshes on a bounded TTL), correlated JSON-RPC responses, commitment-bound unique PubSub subscriptions, stale-socket isolation, provider failover, bounded Retry-After circuits, atomic multi-record inbox application and all-fact finalized promotion, downgrade refusal, source deduplication, exact static/loaded account-index preservation with malformed-key and out-of-range-instruction rejection, non-coercing signature/fee validation, stale/conflict health | REST/RPC/WebSocket | stream subscription integrity, local/provider response-correlation, failover/rate-limit, inbox batch atomicity/finality, transaction/account-index integrity, gap, retention, multi-event pagination and decoder tests |
| Trending page | rolling token activity rank | successful SPL transfers and verified Raydium CPMM/CLMM, Orca Whirlpools, Meteora DLMM, Phoenix/OpenBook V2 orderbook, PumpSwap and Pump bonding-curve trades | 5m/1h/6h/24h swap, buy/sell, unique-trader and transfer counts; future-dated activity excluded | no USD volume or holder claim; Meteora, Phoenix, and OpenBook event activity is not execution-liquidity evidence | `GET /api/trending` | window boundary, future-clock-skew exclusion, deterministic ranking and protocol decoder tests |
| Token page | token identity, metadata, transfer, authority, extension and holder history | successful SPL/Token-2022 instructions, conflict-free program-bound transaction balances, finalized bounded account snapshots, official Metaplex Token Metadata accounts and operator-reviewed exclusion registries | token account, owner, mint, exact raw amount, Token-2022 account/mint withheld amounts, decimals, authority, extension, on-chain name/symbol/URI/update authority/raw hash, snapshot slot, excluded amount/category/evidence source | mainnet-genesis-pinned, RPC-limit-aware batches sharing one exact context, canonical token-program/mint/account/metadata identity validated, every token account bound to the mint's exact token program and decimals, pre/post balance metadata merged without last-write-wins identity loss and conflicts rejected, off-chain URI content never trusted, batch-atomic, monotonic and freshness-gated holder/security snapshots; aggregate base balances plus exact Token-2022 account/mint withheld amounts cannot exceed canonical mint supply; Token-2022 mint authority, supply, decimals, withheld amount and transfer-fee schedules are decoded from bounded raw base64/TLV bytes, preserve complete u64 values, and must agree with the parsed extension inventory at the same finalized context; persisted/reloaded Token-2022 evidence revalidates that inventory, exact slot/epoch, normalized fee schedule and selected active fee; transfer-fee mints require exactly one raw TLV `TransferFeeAmount` per Token-2022 account, disclose withheld totals separately and never attribute protocol-withheld funds to the account owner; concentration remains unassessable unless exclusion coverage is explicitly complete and fresh; malformed, duplicate, precision-unsafe or mixed-context accounts fail closed | cursor-paginated token catalog, mint, token-account, holders and internal security REST | parser, balance evidence conflict/program binding, metadata layout/owner/mint identity, versioned-address, catalog pagination, snapshot context/identity/program/decimal/replacement/genesis/time/supply-conservation/withheld-fee-coverage/raw-mint/atomicity/freshness, exclusion registry/security/holder and reorg tests |
| Wallet/AI analysis | decoded trading performance and native/token funding evidence | swaps carrying an explicit decoded user; successful explicit System Program `Transfer`, `TransferWithSeed`, `CreateAccount`, `CreateAccountWithSeed`, positive-lamport `CreateAccountAllowPrefund`, and `WithdrawNonceAccount` instructions; successful Stake Program `Withdraw`; strictly validated parsed and exact raw SPL/Token-2022 `Transfer`/`TransferChecked`, plus raw Token-2022 `TransferCheckedWithFee`, bound to wallet owners by transaction token balances | exact rational remaining quantity, average cost, realized and mark-to-market unrealized PnL per base/quote pair; exact lamport totals, per-mint token totals with fee-bearing gross debit/net credit separation, funding kind, program identity, allocation/owner/base/seed, counterparties, instruction provenance and deterministic shared-direct native and per-mint token funder peers; profile v2 embeds graph coverage signals | parsed facts with noncanonical program identity, non-u64 amounts, absent mint/decimals, or conflicting transaction balance evidence are discarded; partial retained-history coverage is explicit; balance deltas, zero-lamport allocation-only prefund creation, unrecognized token instructions and entity labels are never inferred; token units never mix across mints or with lamports/USD; no sybil/smart-money classification; never automation-safe | `/internal/wallets/:address/performance`, `/internal/wallets/:address/profile`, `/internal/wallets/:address/funding`, `/internal/wallets/:address/funding-cluster` | exact buy/sell cost-basis, parsed/raw direct/seeded transfer/account creation/nonce/stake withdrawal, parsed/raw SPL/Token-2022 owner binding, fee gross/net accounting, per-mint totals and shared funders, profile missing-field consistency, raw prefund creation, wrong-program/mint/decimal/length/fee/optional-custodian/malformed/zero/failed-transaction, reorg, REST and warehouse regression tests |
| AI analysis | immutable traceable evidence | canonical index instructions, transfers, balances, swaps, holder observations, exact USD reference/volume projections and pool-risk rules | evidence bundle v2 with stable event IDs, instruction locations, registry/decoder versions, payload hashes, freshness, provenance, USD completeness, per-pool risk outputs and explicit missing fields | incomplete reference, volume, holder, security, route or pool-risk evidence always returns insufficient confidence and blocks automation | `/internal/evidence/:mint` and token views | evidence v2, USD-volume/risk embedding, registry, auth and missing-field contract tests |
| AI trading bot | execution decision inputs | Raydium CPMM/CLMM, Orca Whirlpools, PumpSwap and Pump bonding-curve evidence | protocol-oriented base/quote identity, exact execution-price ratio, exact OHLCV, venue type, directional reserves where emitted, monotonic `(slot,eventIndex)` latest pool state, CLMM sqrt price and protocol-specific state including finalized Raydium/Orca initialized ticks and snapshot-bound static-fee quote contracts, targeted risk, durable ingestion health and verified warehouse convergence | explicit venue, healthy index/exporter/warehouse, automation-eligible private/local ingestion provenance, 20+ unique finalized observations, two-way flow and freshness, robust multi-protocol pricing and fresh finalized independent on-chain USDC/USD evidence within a bounded depeg threshold; emergency public-RPC backfill can restore data health but never unlocks automation; multiple pools on one protocol count as one independence domain; future observations, incomplete tick/config evidence, unavailable dependency evidence, event-reserve staleness, expired snapshots, dynamic fees, fee-on-output and Orca Token-2022 pools fail closed; all supported venue quotes and unsigned preparations remain non-automation-safe and require local simulation plus external signer policy; submission is out of scope | swaps, pools/curves, candles, risk, readiness v2; `/internal/pools/:address/quote`, authenticated `POST /internal/pools/:address/prepare-swap`, and Pump curve `POST /internal/tokens/:mint/prepare-swap` | decoder, official tick/rounding vectors, tick-array identity/layout/coverage, exact tick traversal, snapshot quote gates, construction/simulation/signature/finalized-message chain and HTTP fail-closed contract, direction-reversal/future-rejection candle, out-of-order pool projection, reserve/snapshot freshness, depeg-contract/deviation, dependency-health, risk and readiness tests |
| Commercial clients | stable versioned API and read-only RPC | local index plus reviewed hash-only tenant registry | JSON, `X-API-Version: 1`, additive collection/filter-scope-bound cursor envelopes for blocks, transactions, swaps, compact tokens and filtered compact pools, with legacy unscoped cursor migration; JSON-RPC 2.0 with indexed block lookup; bounded batches charged by logical call count | tenant plans, rotation overlap, transactionally reconciled key revocation, weighted atomic Redis multi-instance fixed-window quotas, redacted audit identity, explicit resource-identity-free bounded route templates and unmatched buckets, integer-safe request totals, exact millisecond aggregation and idempotent PostgreSQL hourly usage sync; configured distributed admission fails closed | REST/RPC; public bind requires keys/tenants and audit | HTTP/RPC pagination and batching, cross-scope cursor/filter validation, compact catalog validation, RPC validation, auth, rotation/revocation, local/distributed weighted quota, audit route normalization, retention and usage-sync tests |
| Streaming clients | persisted block, swap and lifecycle events | local canonical index | monotonic block sequence, cursor replay, token/pool/protocol/event-type filters, per-event finality provenance, filtered reorg tombstones, resync signal | authenticated upgrades share weighted local/Redis tenant quota admission, bounded retry headers and durable redacted usage metering; serialized ingestion, persistence-before-broadcast, explicit finality promotion and fork retraction, heartbeat, pre-write aggregate buffer admission, single-frame size rejection and slow-consumer eviction | `WS /ws` | quota/audit/retry admission, end-to-end replay, oversized-frame/backpressure, filtered-topic, finality and reorg-retraction tests |

## Dependency-ordered roadmap

1. ~~Add deterministic REST contract tests, validation errors, stable cursor pagination, and response envelopes without breaking legacy routes.~~ Completed for block, transaction, swap, compact token and lifecycle-filtered compact pool lists, including strict 1-500 integer limits and collection/filter-bound, projection-versioned cursor validation that rejects continuation after insertions, removals, reorgs, or projected-field changes.
2. ~~Persist explicit ingestion provenance, finalized commitment, exporter lag, skipped-slot evidence, and bounded data-quality telemetry.~~ Completed with atomic exporter status, per-block provider and verified-genesis attribution, canonical supplied block-provenance validation, mainnet-bound index health/readiness, one shared fail-closed CLI/REST/metrics assessment requiring version-2 mainnet identity and exact cursor/tip/lag consistency, configurable finalized-slot lag gating, `getBlocks`-verified skipped slots, fail-closed unavailable produced blocks, a bounded 10,000-slot history, redacted durable failure-attempt evidence that preserves the last successful checkpoint, bounded non-link inbox directory enumeration before ingestion or verified-network attachment, and stable non-link regular-file acquisition with a startup-validated byte ceiling for every inbox batch and snapshot artifact.
   Verified backfills now replay only from a canonical real source directory into a distinct new candidate index, require canonical distinct output/report/active-index paths outside the source inbox with existing parents, bind the complete successfully processed inbox inventory and output hash in an exclusively created version-2 qualification report, and require finalized mainnet identity, current decoder registry, complete recognized decoder output, and canonical core projections. Every source name and processed content fingerprint is reread immediately before qualification, so additions, removals, renames, or replacements fail completeness. The complete canonical report evidence is SHA-256 digest-bound and reassessed so legacy or edited reports fail closed. A failed report install removes only the unchanged content-matching candidate created by that run and preserves concurrent replacements. The command cannot mutate the source inbox, overwrite the active index, or authorize promotion.
3. Decode supported DEX swaps and pool lifecycle events behind protocol-specific fixtures; never infer swaps from generic transfers. Raydium legacy AMM v4 swaps, Raydium CPMM/CLMM, Orca Whirlpools, PumpSwap and Pump bonding-curve trades plus Raydium AMM v4/CPMM/CLMM, Orca and PumpSwap pool initialization are covered alongside Pump `create_v2`, legacy/current migration instructions, and explicit curve/migration completion events. Every recognized instruction-backed creation or migration now requires a same-transaction normalized event of the exact protocol/type, with cardinality preserved when a transaction repeats a transition. Raydium CLMM `create_pool` binds its exact instruction payload, ordered mint pair, canonical token/system/rent programs, config, pool, vault, observation and bitmap accounts, initial Q64.64 price and open time. Native log events and validator sidecars reconcile by a directional pool/mint/amount evidence multiset: an exact sidecar counterpart replaces one decoded event, while additional same-protocol swaps in the transaction remain visible. Mint decimals and CLMM token-account identities merge pre/post evidence conflict-aware; a differing mint, decimal, or explicitly noncanonical token program removes that evidence instead of accepting the last row. Orca initialization establishes its ordered mint/program/decimal identity and initial price; swap publication requires matching instruction-account and token-balance evidence; finalized fixed-layout Whirlpool/vault snapshots add canonical liquidity, price, tick, fee, vault token-program/decimal identity and fixed/dynamic tick-array state through the same leased job pipeline. Legacy snapshots without complete tick-array or vault identity evidence are automatically rescheduled. Migrations canonically link the source curve to its PumpSwap pool, exact migrated amounts, fee, mints and vaults; canonical pool summaries derive active/completed/migrated status, source/destination links and transition provenance identically during live apply and reorg rebuild. Finalized Raydium CLMM PoolState/vault/TickArrayState snapshots include default and signed overflow bitmap verification and exact initialized ticks. Finalized Raydium CPMM PoolState/AmmConfig/vault, PumpSwap Pool/vault/config, and Pump BondingCurve/mint-owner/Global/FeeConfig snapshots validate canonical identity and exact read barriers, import idempotently into canonical pool state, emit replayable events, and use the leased missing/stale repair pipeline. Pump Sell V2 now spans exact unsigned construction, hash-bound simulation, bounded external approval, signature verification, and identical finalized landed-message confirmation without indexer signing or submission. The AMM v4 finalized acquisition boundary now decodes the official fixed 752-byte `AmmInfo`, validates enum/decimal and rational-fee state, then binds both legacy SPL vaults, mint/decimal identities, common authority, monotonic finalized RPC contexts, exact OpenBook `OpenOrders` and `MarketState`, reconciled reserves, unsigned construction, simulation, external approval, signature verification, and finalized landed-message confirmation. Durable artifact ingestion, canonical monotonic persistence and reload validation, same-context conflict rejection, checkpointing, ordered WebSocket replay, and leased missing/incomplete/stale repair scheduling are complete. Additional protocols remain. AMM v4 `Initialize2` lifecycle publication binds the exact 26-byte payload and 21-account ABI to its authority, OpenBook market, ordered mints/vaults, LP mint, creator, nonce, open time and positive initial deposits. AMM v4 swap publication requires the official 17-account swap ABI, an instruction-bound exact 57-byte `ray_log`, canonical token-account mint evidence, and matching instruction/log bounds. Its program log omits the trade-fee amount, so `tradeFeeRaw` is explicitly null with `feeEvidence=unavailable_in_program_log` rather than fabricated.
   Phoenix audit summaries retain exact quote-fee lots as immutable event evidence. Stable REST, token/pool, trade, and AI evidence views resolve those lots to quote atoms only when a finalized same-market header at or after the swap supplies the exact quote lot size; the additive resolution identifies its denomination, lot size, and evidence slot while preserving the raw null `tradeFeeRaw` contract. Phoenix and OpenBook order-book snapshots now qualify as complete execution-state evidence only with monotonic finalized account contexts, full decoded depth, exact positive lot sizes, legacy token-program vault identity, and canonical raw balances; this improves liquidity/risk assessment without satisfying the independent simulation, signer-policy, or landed-route gates.
4. Normalize token metadata, pool identity, reserves, liquidity, price and volume with exact decimal arithmetic and source timestamps. Finalized canonical Metaplex metadata prefixes, protocol-oriented identity and lifecycle state, reserves, execution ratios, raw OHLCV and exact per-venue time-weighted nominal USD references through finalized USDC paths are complete; off-chain metadata remains explicitly untrusted. Its HTTPS acquisition pins DNS results, rejects redirects and all private, reserved, translation, mapped and transition address ranges, owns DNS/request deadlines and enforces byte limits. Pools are first aggregated within their decoded protocol, then edges with three or more independent protocols use an exact median so duplicated same-protocol pools cannot satisfy independence. Competing complete paths are deterministically ranked by robustness, minimum protocol coverage and hop count so weaker direct evidence cannot eclipse a robust wrapped-SOL path. Exact rolling USD notional becomes automation-safe only with fresh finalized independent on-chain USDC/USD evidence inside the configured deviation bound. Late arrivals, finality promotions and reorg replacements rebuild their affected durable ClickHouse candle buckets from canonical swaps. The repository now produces the independent artifact from an operator-selected Pyth Solana Receiver account through loopback finalized RPC, requiring full verification, exact feed/program/account identity, bounded confidence, context/posted-slot ordering, publish-time freshness and a raw account hash. A hardened disabled-by-default 30-second timer refreshes it, while long-running consumers reload every five seconds and clear invalid replacements rather than retaining stale last-good evidence. Production source-account/feed selection and broader venue coverage remain.
   Optional off-chain token JSON now has a separate HTTPS-only, DNS-pinned public-address, no-redirect, byte/content/schema-bounded and content-addressed normalization boundary; imported artifacts bind the exact current Metaplex payload hash, advance an idempotent event, and project separately to PostgreSQL without overriding canonical identity or becoming automation-safe. Missing or 24-hour stale enrichments now flow through deduplicated PostgreSQL jobs, skip-locked leases, bounded retries and artifact-only production before canonical revalidation.
5. ~~Add replayable WebSocket subscriptions with monotonic sequence IDs, resume cursors, heartbeats, bounded queues and slow-consumer eviction.~~ Completed for canonical blocks plus mint/pool/protocol-filtered swap, lifecycle and snapshot topics, including account, untrusted off-chain metadata, Raydium CPMM/CLMM, PumpSwap, Pump bonding-curve, Orca and Meteora updates with strict mint/pool/protocol/event-type filter-domain isolation. Atomic pre-write buffer admission, a configurable global client ceiling, and oversized-frame eviction apply during replay and live delivery; active clients, capacity rejections, slow-consumer evictions and protocol closes are exported as credential-free Prometheus telemetry. Graceful shutdown stops subscriptions and closes upgraded sockets before a deadline-bounded HTTP drain and durable audit flush, preventing subscribers or stalled requests from holding restart/recovery open indefinitely. Resume cursors before retained history or ahead of the server receive reasoned retained/latest `resync_required` boundaries and policy-close code 1008, preventing invalid clients from mixing live events into a state that must be rebuilt. The upgrade validates the complete RFC 6455 method/header/version/key boundary. Bounded inbound framing survives TCP fragmentation/coalescing, requires masked protocol-valid control frames, validates close codes and UTF-8 reasons, echoes valid close and ping payloads, and rejects malformed, oversized or unsupported client frames with standard close codes. Snapshot imports are content-addressed, reject conflicts at the same complete evidence context, preserve each dependency slot, require component-wise monotonic replacement, and emit at the maximum dependency `evidenceSlot` so same-state mint/config/tick refreshes advance without allowing an older core snapshot to overwrite newer state.
   Inbound WebSocket text acknowledgements support RFC 6455 continuation frames and interleaved control frames while enforcing one aggregate message ceiling; detached continuations, nested data messages, invalid UTF-8 and cumulative overflow close with explicit protocol codes.
6. ~~Add API keys, tenant quotas, audit logs, usage metering, retention tiers and documented SLOs before any commercial exposure.~~ Completed with hash-only tenant/key registries, activation/expiry rotation overlap, per-plan quotas/retention declarations, public-bind guard, configurable pre-dispatch RPC/execution body ceilings with stable 413 responses, startup-validated header/request/keep-alive/socket-request lifecycle bounds, stable bounded non-link root asset delivery with an explicit unavailable contract, Prometheus signals, alert rules, initial SLO/RPO/RTO, a redacted append-only audit sink, dry-run-first tenant-aware audit retention requiring an exact reviewed content digest and explicit writer quiescence before a serialized durable rewrite; retention reads only stable, non-link regular-file snapshots bounded to 64 MiB and 250,000 records per cycle. Every protected request consumes its base quota before method or body processing; GET-only REST/diagnostic routes and POST-only RPC/execution routes return a stable 405 contract for every other method rather than ignoring request bodies. Valid RPC batches atomically consume their remaining logical-call weight, while oversized batches consume the maximum supported weight before returning the stable invalid-request envelope. JSON body routes require an explicit `application/json` media type with optional UTF-8 charset, reject content encodings before acquisition, and use fatal UTF-8 decoding before parsing, preventing ambiguous decoding, compressed-body expansion, and replacement-character normalization of identity-bearing fields. The validated idempotent PostgreSQL tenant/key/hourly-usage synchronization worker applies the same limits, alongside fail-closed atomic Redis multi-instance quota admission and a hardened operator-gated one-minute synchronization timer.
7. Add trading-bot input schemas and hard gates for freshness, finality, liquidity, confidence, manipulation risk and incomplete coverage. Target-pool freshness/finality/history/two-way-flow gates, snapshot-backed authority/Token-2022 findings, fresh mint-complete holder-exclusion evidence, and exact base-notional/trader/repetition/slot-burst/round-trip manipulation signals shared by risk/readiness projections are complete. Risk and bot-readiness contracts also carry an explicit execution-evidence object and remain fail closed with `executable_route_unverified`; analytical snapshot completeness can never substitute for a fresh local simulation receipt and verified landed route. Protocol-specific Raydium and Orca Q64.64 exact-input quote cores traverse initialized ticks, apply signed liquidity-net crossings, preserve integer rounding and report unconsumed input at price limits. Raydium CLMM requires complete tick/config/bitmap evidence and rejects dynamic and fee-on-output pools. Orca uses its official distinct tick constants and millionths fee rounding, requires complete finalized pool/vault/tick-array evidence, and exposes its complete read-only legacy-SPL construction boundary through authenticated quote and preparation contracts. Production snapshots automatically acquire every pool-bound tick array and canonical configuration behind finalized read barriers. Raydium CPMM and PumpSwap exact-input engines derive spendable reserves and mirror official integer fee behavior from coherent finalized snapshots; unknown protocols fail closed. Raydium CLMM/CPMM quote, readiness and unsigned-construction gates require the persisted status field to remain a canonical unsigned byte and reject values that JavaScript bitwise operators would otherwise coerce. Token-2022 transfer-fee primitives exactly select the active older/newer epoch schedule, ceiling-round and cap forward fees, invert a required net amount, and reject u64 overflow. Account and production pool/curve snapshots require the Token-2022 extension inventory; both account and pool acquisition now cross-check parsed identity/inventory against a second exact-context raw mint batch and derive the complete-u64 fee schedules, authoritative absence and active fee from bounded raw TLV evidence at the finalized epoch/slot. Raydium CLMM and CPMM fee-only routes deduct the active input fee before AMM math and output fee afterward, reject all other extensions, and carry mint slot/epoch evidence through unsigned construction and local simulation. A separate local-only simulation boundary accepts only unsigned packet-sized transactions, pins mainnet/context evidence, enables recent-blockhash replacement without signature verification, fails on program errors or malformed responses, and returns hash-bound receipts without submission. Its legacy/v0 message inspector binds the signature header, static accounts, instruction indexes and required program allowlist; unresolved address-table lookups fail closed. Optional post-simulation token effects are decoded only from canonical token-program accounts, bound to the expected mint/address order, and checked against exact signed delta ranges. A read-only landed verifier requires successful finalized status at or after the simulation slot and byte-for-byte message-hash identity between the signed landed transaction and unsigned simulation receipt; it never submits. Quotes remain non-executable until local simulation and signer policy are separately approved.
   The unsigned simulation boundary also supports an ordered instruction policy that binds exact program IDs, account addresses, signer/writable roles and payload bytes before RPC simulation. A deterministic legacy-message constructor merges privileges, produces only zero-signature packet-sized transactions, and self-verifies the resulting compiled instructions against the policy. Raydium CLMM `swap_v2` construction binds the official account layout/discriminator, exact-input threshold and price limit to direction-specific vaults/mints and the finalized tick-array path. Its preparation artifact packages the unsigned transaction with the finalized minimum context, exact instruction policy and mint-bound input/output effect ranges required by local simulation; the executor verifies returned hashes, slot, program and effects before emitting a typed receipt. The external-signer handoff is content-addressed and enforces an allowed payer, raw-input/slippage caps, simulation recency and short slot expiry without signing or submission; returned bytes must preserve the approved message and pass every required Ed25519 signature before becoming an unsubmitted signed artifact.
   Finalized landed verification binds both the exact simulated message and the queried first transaction signature; its Raydium wrapper revalidates every preparation/simulation/request/signed-artifact hash and emits a content-addressed read-only confirmation chain.
   Pump Sell V2 and Buy Exact Quote In V2 quotes, construction and simulation now bind the same complete finalized mint-extension slot and epoch in addition to curve/Global/FeeConfig state. The buy contract uses the official exact-spend fee and invariant rounding, the 27-account ABI, global/user volume accumulators, bounded external approval, signed-message verification, and finalized landed-message confirmation. The internal executable-depth route exposes `side=buy|sell` while defaulting to sell for compatibility. Quote, readiness and unsigned construction require canonical cashback-boolean and buyback-basis-point evidence and reject active cashback or buyback modes; missing evidence and Token-2022 program IDs fail closed until exact fee-transfer semantics are verified.
   PumpSwap snapshot evidence also derives and decodes the official Pump Fees `FeeConfig` PDA, rejects wrong owners, malformed discriminators, unordered tiers and trailing bytes, and reads it at a finalized context no earlier than pool, vault and mint evidence.
   Exact-input PumpSwap quote analysis implements the official SDK's quote-input buy and base-input sell integer paths, including effective virtual reserves, fee-tier selection, individual ceiling-rounded fees, the buy-side one-unit invariant adjustment, real-vault sell coverage and fresh coherent snapshot gates. Quotes require complete finalized legacy-SPL mint evidence and carry its exact slot and epoch into both instruction constructors and the minimum simulation context. Token-2022 remains fail-closed pending verified multi-transfer fee semantics.
   PumpSwap `GlobalConfig` is also PDA-derived and exact-layout decoded at the shared finalized barrier, including protocol, reserved and buyback fee-recipient sets plus creator/whitelist/boost authorities required for deterministic route-account policy. Quote, readiness and both unsigned-construction paths enforce the same strict route-policy contract requiring canonical flag, boolean and basis-point types; buy/sell disable bits are enforced per direction, while active cashback and SOL buyback modes fail closed pending separately verified accounting. Token-2022 mint evidence decodes the transfer-hook authority and program ID from the exact 64-byte raw mint extension, requires parsed state agreement, and binds the resulting canonical hook program, executable program account, and optional `extra-account-metas` validation PDA raw bytes/content hash at the same finalized slot. The official Execute TLV discriminator, exact 35-byte meta records, count, privileges and static addresses are decoded with bounded input. Literal, Execute-instruction-data, prior-account-key, account-data and pubkey-data forms resolve in list order. Meteora DLMM `swap2` binds those metas to each direction-specific transfer, appends the validation/program accounts in official order, encodes matching X/Y slices, and places them before bin arrays. Data-derived forms require canonical hash-bound finalized source-account evidence at or after the mint-evidence slot; a bounded dependency loop discovers prior-meta dependencies and refetches the complete discovered set at one monotonic finalized context. Missing, stale, oversized, or corrupt evidence fails closed and raises the simulation minimum context to the newest evidence slot.
   PumpSwap base-to-quote sells now have an official-ABI-bound unsigned instruction constructor and hash-bound local simulation contract. It validates coherent finalized pool/config evidence, direction-specific protocol or reserved fee-recipient membership, buyback-recipient membership, every derived ATA/PDA, exact input/minimum-output bytes, packet limits, the preparation/message/program identity, minimum finalized context, and mint-bound simulation deltas before producing a content-addressed receipt. Its external-signer request binds that receipt and message to a unique allowed payer, exact input cap, ceiling-rounded slippage cap, simulation age and short slot expiry; returned bytes must preserve the message and carry every required Ed25519 signature. Read-only landed verification additionally requires successful finalized status, the first signature identity, and byte-identical fetched message content across the complete content-addressed chain. Quote-to-base buys now have the same complete read-only boundary around an official-ABI-bound `buy_exact_quote_in` constructor: independently derived global/user volume accumulators, exact spendable-quote and minimum-base bounds, volume tracking, canonical remaining accounts, mint-bound input-budget/output-effect checks, capped expiring signer policy, cryptographic external-signature verification, and content-addressed finalized landed-message verification. Neither path signs nor submits. Cashback remains fail-closed.
   Phoenix finalized orderbook depth now feeds exact bidirectional lot-aware quotes. Its official nine-account `Swap` construction emits a price-capped immediate-or-cancel packet with explicit lot-aligned minimum fill, abort-on-self-trade behavior, bounded slot expiry, deterministic unsigned legacy message identity, and mint-bound local-simulation effect ranges. Capped expiring external approvals, Ed25519 signed-message verification, and finalized byte-identical landed confirmation complete the read-only chain. The authenticated preparation endpoint always requotes persisted state; the indexer never signs or submits.
   Persisted Phoenix swaps additionally require canonical orderbook venue and side, positive base/quote lot fills, quote-fee lots no greater than total quote lots, and the explicit absence of an atom-denominated fee without market lot-size evidence. Invalid rows are rejected before REST, pricing, warehouse, or bot projection.
8. ~~Add real-time confirmed/finalized ingestion with reconnects, durable resume, bounded gap repair, finality promotion, rollback safety, and operational telemetry.~~ Completed using a bounded rotating set of private Agave block PubSub/RPC pairs that revalidate mainnet identity before every initial or reconnected subscription, with startup-validated reconnect timing, owned/cancellable backoff timers, a startup-bounded UTF-8 PubSub message ceiling and typed JSON-RPC acknowledgement/notification contract that rotate away from oversized, binary, malformed, crossed, or unknown-subscription sources, strict 512-slot repair ranges, 1-256-block exporter batches, node-specific provenance and failover-backed HTTP gap repair/backfill. Byte-bounded HTTP RPC responses use fatal UTF-8 decoding before JSON parsing so malformed provider bytes cannot be normalized into identity-bearing strings. Gap repair stages skipped-slot and repaired-block telemetry until every produced slot in the range is available, so a partial RPC failure cannot publish progress ahead of its durable cursor. Export polling and PubSub startup validate all prior skipped-slot evidence before network/inbox/cursor mutation and reject evidence ahead of their respective durable progress boundary, preventing corrupt status from causing partial-cycle advancement; PubSub also requires typed nonnegative confirmed/finalized resume slots and exact cursor/finalized consistency instead of silently discarding corrupt history. Health correctly bounds finalized exporter gaps by cursor and confirmed stream gaps by observed tip.
9. Migrate immutable facts to ClickHouse, metadata/jobs/audit state to PostgreSQL, hot state/fan-out to Redis, and raw archives/dead letters to self-hosted SeaweedFS. Deployment and checksum-gated archive upload/fetch/restore contracts exist. Backup manifest v4 binds canonical `solana-mainnet` identity and one backup identity, the required quiesced-writer assertion, and exact byte length/SHA-256 evidence for every cross-store artifact, including canonical ClickHouse events, instructions, swaps, balance changes, native transfers, dead letters and candles; completion status accepts its manifest and archive receipt only through stable non-link regular-file snapshots bounded to 16 MiB before content digests enter readiness evidence. Fetch includes the inbox manifest and reruns the same fail-closed preflight, which also binds its archive identity before restore can run. Post-restore qualification v5 resolves and confines the marker, index, exporter status and warehouse checkpoint to the isolated recovery root, requires the exclusive report outside both that root and the backup evidence, then binds the manifest hash to canonical index health, zero-lag version-8 identity/content multi-sink reconciliation, a healthy finalized exporter observation produced inside the recovery window and the four-hour RTO, and exclusively creates a promotion report so prior success cannot be overwritten or contaminate its inputs. A retry-safe worker replays canonical events, reconciles canonical instructions, swaps, token balance changes, explicit native transfers and dead letters, transactionally upserts metadata, candidates, security snapshots, snapshot jobs and checkpoints, then stages versioned Redis hot state and publishes persisted events. Snapshot jobs use atomic PostgreSQL skip-locked leases, guarded periodic renewal, expired-owner rejection, recovery, bounded redacted retries and artifact-only dispatch into serialized index ingestion. Repair qualification requires persisted mainnet-genesis/content-hash provenance and exact maximum-dependency evidence slots, and reports that independently derived slot on repair jobs, binds every repair target to its persisted pool/mint identity and rejects malformed fresh off-chain metadata schema/URI/trust/hash evidence, malformed Pump/PumpSwap Global route policy or quote-mint-specific ordered fee-tier evidence, incomplete PumpSwap pool/LP/vault/canonical-authority state, foreign PumpSwap program/config identities, incomplete or noncanonical Pump curve reserve/supply/creator/mode/program/config/hash evidence, out-of-byte-range Raydium status evidence, foreign CLMM program/config/tick-array ownership, invalid mint/vault/economic/dynamic-fee state, raw bitmap/index divergence or malformed initialized-tick liquidity/growth evidence, foreign or economically impossible CPMM configuration including missing mint/vault/open-time identity, and partial Orca commitment/slot/config/vault/protocol-fee or initialized-tick liquidity/growth evidence, scheduling canonical snapshot reacquisition while retaining valid-but-unsupported modes as complete evidence. Checkpoint persistence and public health reject reconciliation event counts that diverge from their sequence. The public health contract rejects local-only checkpoints and requires live ClickHouse/PostgreSQL/Redis sequence agreement plus version-8 exact content-count, canonical-event content-chain, and deterministic identity-digest reconciliation for canonical identities, the current PostgreSQL token and activity candidate sets, and hot projections plus a live versioned Redis stats sentinel whose embedded sequence, pool count, and token count match canonical expected state. Source-derived SHA-256 hashes cover every replayable ClickHouse instruction, swap, token-balance change, native transfer and dead-letter row and every PostgreSQL token/candidate row; Redis hashes every exact hot-token, hot-pool, and stats-sentinel value. Canonical-event rows carry source-derived SHA-256 hashes. Reconciliation version 8 advances the prior checkpoint sequence-ordered SHA-256 chain and independently recomputes the whole chain from ClickHouse `FINAL` rows, so bounded compatibility retention no longer prevents whole-history payload verification. Pre-version-8 checkpoints require a full replay to establish the chain seed. The sink-write boundary recomputes every supplied event/fact content hash and the complete batch chain transition before launching any database process, preventing a forged internal batch from causing partial warehouse mutation. Redis also owns atomic multi-instance API quota counters. Sustained production reconciliation and an executed isolated destructive recovery drill must finish before JSON compatibility state can retire.
10. Add Yellowstone/Geyser as the primary bounded ingestion gateway with the current block PubSub path retained for reconciliation and backfill. Activation now requires a bounded regular-file version-2 exact plugin/binary/source contract, fixed-memory handle-bound stable non-link binary hashes, plus recent 24-hour/100k-finalized-block qualification with complete replay invariants, zero Geyser/PubSub divergence or missing blocks, zero dropped updates, bounded buffering and bounded RSS slope. Qualification status, structure, recency and sustained invariants are rejected before installed binaries are read or executed, and both binaries must rehash identically after version probing. This is blocked until the validator/plugin ABI is aligned: current Yellowstone 14.2.2 targets Agave 4.1.0 while this deployment pins Agave 3.1.14; either upgrade Agave or qualify a compatible Yellowstone 11.x release with real sustained evidence.

Meteora DLMM `Swap`/`Swap2` event coverage is now bound to the official
instruction version and complete account suffix, reports exact consumed input
for partial fills. Finalized pair, vault, mint, bitmap, and complete bin-array
snapshots are now available with monotonic conflict detection and automated
repair. Fresh finalized snapshots with explicit function mode now expose
analysis-only exact-input quotes using canonical bin and limit-order traversal,
Q64 rounding, dynamic/base fee updates, fee-side modes, protocol/owner splits,
and epoch-bound transfer fees. Undetermined function mode is resolved from both
finalized reward mints exactly as the official SDK. Legacy-SPL routes whose
quoted arrays fit the finalized default bitmap now support official-ABI-bound
unsigned `swap` construction and hash/policy/token-effect-bound local
simulation. Fee-only Token-2022 pools use `swap2`, direction-specific token
programs, Memo, and a canonically empty remaining-account slice vector. Hooks
whose finalized metadata is statically or PDA resolvable use ordered X/Y account
slices; source-account-derived forms and other Token-2022 extensions remain fail
closed. Finalized bitmap
extension PDAs now cover and authorize initialized arrays outside the default
range for quoting and construction. Hash-bound, capped, expiring requests can be externally signed and
cryptographically verified, and landed transactions require finalized
byte-identical message evidence; the indexer still never signs or submits and
automation remains disabled.
The authenticated Meteora preparation contract requotes canonical persisted
state on every request and exposes its deterministic unsigned simulation
artifact through `POST /internal/pools/:address/prepare-swap`. Caller-provided
account identities, bounds, pre-balances, blockhash, and optional transfer-hook
source evidence pass through the same construction gates; the endpoint performs
no simulation, signing, or submission.

Raydium AMM v4 now crosses the same unsigned construction boundary: its
base-input preparation requotes canonical persisted pool, OpenOrders,
MarketState, and vault evidence, emits the exact 17-account instruction, and
binds a finalized-slot local-simulation policy to the preparation hash. External
signer requests now enforce payer allowlists, input and slippage caps, fresh
simulation evidence, and short slot expiry; returned signatures and finalized
landed messages are verified across one content-addressed chain. The indexer
never signs or submits, and automation remains disabled.

   Trading-bot readiness requires exact zero-event-lag warehouse convergence. The operator-facing warehouse health contract retains its configurable bounded-lag tolerance for monitoring and display consumers, but a checkpoint that is merely within that tolerance is explicitly marked `exactlyConverged: false` and cannot unlock automation. Exporter, warehouse, repair-only projection clocks, Redis hot-state status, block-provenance, Geyser-qualification, account, pool, curve, metadata, independent oracle and holder-exclusion freshness gates accept only canonical UTC timestamps with explicit millisecond precision, rejecting locale-dependent, timezone-implicit, normalized-overflow and alternate-offset evidence. Persisted holder, security, price, liquidity and risk consumers revalidate that boundary after reload, so corrupt or legacy timestamps cannot regain freshness merely because their original ingestion path is no longer present. Index health, capabilities, retention, warehouse event/fact serialization and pool-risk freshness likewise require exact nonnegative integer block seconds whose millisecond conversion is both safe and representable by the runtime date model; coercible strings and overflow fail closed. Persisted block-map keys must exactly match their safe-integer row slots, with nonempty hashes and a strictly earlier nonnegative parent, before health, `canonicalBlocks`, or any REST/RPC block view can pass; block APIs return an explicit unavailable contract instead of coercing malformed persisted keys. Warehouse projection clocks additionally reject corrupt, negative, coercible-string, or millisecond-overflowing persisted block times instead of silently skipping them. Every snapshot-backed quote entry point enforces the same snapshot-time contract so direct callers cannot bypass ingestion validation. Tenant-key activation, audit retention, self-hosted archive deletion authorization, dead-letter facts, security projections and commercial usage aggregation use the identical canonical-time boundary; security expirations must strictly follow observation time.

Phase 9 warehouse batches preserve explicitly untrusted off-chain metadata events without promoting them to canonical chain evidence: only the metadata snapshot event type accepts the `offchain_untrusted` commitment and its exact source identity, while every other event remains restricted to confirmed/finalized provenance. Zero-event synchronization cycles still reconcile canonical dead letters, PostgreSQL projections/jobs/checkpoints and versioned Redis hot state, so TTL expiry or partial sink loss self-heals without waiting for unrelated chain activity. Redis rebuilds atomically cover deletion, complete hash population, stats/TTL updates, event publication and the current-version pointer, including same-sequence repair. PostgreSQL token projections and warehouse checkpoints now use the same canonical `solana-mainnet` chain identity as reconciliation. PostgreSQL token JSON and versioned Redis hot-token rows also carry the canonical metadata-search evidence projection used by REST/RPC, including nullable presence for unattested legacy searches and explicit authoritative absence only after complete finalized acquisition.

Retained WebSocket replay is revalidated after reload before any ready/event
frame is emitted: sequences must be contiguous through the persisted high-water
mark, clocks must be representable, event types recognized, canonical block
events mainnet-bound, finalized snapshot sources exact, and off-chain metadata
explicitly untrusted. Invalid retained evidence receives `resync_required` and
policy close instead of being broadcast.

Embedded swap and lifecycle batches now share that replay boundary. Exact stable
identity, amounts, mint direction, registry/decoder binding, payload hash,
provenance and outer slot/time must hold; reorg tombstones additionally bind the
replacement blockhash. Declared batch counts must equal their retained arrays,
so a valid outer envelope cannot conceal corrupt market facts during resume. When
the replaced block envelope remains in replay retention, the replacement must retract
its complete swap and lifecycle multisets byte-for-byte after adding only the canonical
replacement hash. Non-replacement event types cannot carry retraction payloads.
Canonical swap rows and every replay copy now require an active program-registry
entry at the fact slot, the exact current registry version, its protocol and decoder
version, bounded decimals, exact positive u64 amounts, fee bounds, and a recognized
payload-hash kind. Merely positive version numbers or nonempty program labels cannot
promote stale or unregistered decoder output into API, warehouse, or bot evidence.
Snapshot replay descriptors use exact type-specific field sets and the latest retained
descriptor for each mint or pool must match the canonical holder, off-chain metadata,
or pool snapshot projection byte-for-byte. Rehashing a divergent descriptor therefore
cannot create an alternative WebSocket or warehouse snapshot history.
Snapshot replay descriptors are likewise nonempty, identity-unique, type-checked,
and bound to the exact SHA-256 suffix in their outer snapshot blockhash. Pool
dependency slots must remain ordered beneath the emitted maximum evidence slot,
preventing detached mint/pool refresh claims from surviving persistence.
Reorg recovery records form unique, timestamp-monotonic replacement chains per slot;
each link must consume the preceding canonical blockhash, the chain tail must equal
current canonical state, and every fully retained replay transition must have its
matching correction. Multiple legitimate replacements therefore remain auditable.

Persisted transaction maps are likewise revalidated as complete collections
before REST/RPC delivery or readiness: map keys must equal row signatures and
every transaction must bind a canonical parent block with exact slot, time,
provenance, execution-status, fee, payer, account and log-count evidence.
Malformed collections return an explicit unavailable contract rather than
leaking partially trusted rows.

Persisted instruction facts are revalidated against their canonical parent
transaction and block before readiness or warehouse export. Stable event
identity, location indexes, registry/decoder versions, payload hash, structured
payload shape and exact provenance must all agree across the relationship;
duplicate or detached instruction identities fail the complete collection.

Persisted swaps now use the same whole-collection boundary before readiness,
commercial REST delivery, or warehouse export. Stable swap/event identity,
successful parent transaction, canonical pair/direction, positive exact u64
amounts, decimals, decoder provenance and payload hashes are mandatory; one
malformed or duplicate swap makes the view explicitly unavailable.

Persisted protocol lifecycle events and their swap-event mirrors are likewise
revalidated as a complete relationship-bound collection. Lifecycle identities,
successful parent transactions, canonical blocks, registered program/protocol/type,
decoder versions, exact amounts, mint pairs, transition endpoints and provenance
must agree; swap mirrors must correspond one-for-one with canonical swaps. Health,
bot readiness, lifecycle REST views, candidate projection and Redis hot-state
publication fail closed on detached, duplicate, malformed or divergent evidence.

The derived wallet ledger (SPL/Token-2022 transfers, native funding transfers,
and token balance changes) is validated as one relationship-bound collection.
Facts must bind a successful canonical parent transaction, exact instruction
location where applicable, u64-safe raw amounts, fee/net conservation, stable
identity, decoder payload hash and exact provenance. Health, bot readiness and
warehouse export fail closed on any detached, duplicate or inconsistent fact.

Persisted account, token-account, mint-activity and pool-activity projections
are recomputed from canonical facts and snapshots before readiness or warehouse
projection. Exact counters, latest locations/times, balances, provenance and
execution-price fields must agree, while independently validated snapshot and
lifecycle enrichment remains intact. Divergence fails closed instead of serving
stale or fork-contaminated aggregates.

Persisted finalized holder and pool snapshots also retain their content-addressed
source hash, canonical mainnet/finality envelope, maximum dependency evidence
slot and exact binding into mint/pool projections. Health, bot readiness,
snapshot-backed REST consumers and Redis hot-state publication fail closed when
those bindings diverge. PostgreSQL repair-job projection remains available so a
quarantined snapshot can still be replaced through the governed worker.

Canonical Metaplex projections are revalidated after persistence for exact mint
and program identity, bounded decoded fields, fee bounds and raw account hash.
Optional off-chain display records must retain their HTTPS source binding,
canonical observation time, normalized JSON media/size envelope, bounded fields,
content hash and explicit untrusted/non-automation flags. Divergence blocks
health, bot readiness, snapshot-backed REST and Redis publication. PostgreSQL
omits and marks quarantined metadata while still exporting its governed repair
job, so invalid display content cannot escape or prevent recovery.

Persisted recovery evidence is revalidated as one collection before health,
bot readiness, or gap API delivery. Parser-v2 file identities retain exact
SHA-256 fingerprints; the inbox high-water mark binds one of those identities;
dead letters require stable identity, canonical ordered observation/resolution
times, bounded errors, and resolution backed by the exact processed-file or typed
snapshot-artifact checkpoint fingerprint. Snapshot checkpoints have allowlisted types,
canonical source/application timestamps, and valid source slots; successful retries
resolve matching snapshot dead letters. Reorg corrections retain ordered replacement
chains ending at the currently canonical slot. Repair and reconciliation
commands remain outside this serving gate so quarantined state can be corrected.
Dead-letter diagnostics cross one shared bounded redaction boundary before they
enter compatibility state, cycle results, backups, or warehouse facts. Provider
URLs, bearer/JWT credentials, secret assignments, private-key blocks, control
characters, and oversized exception text are removed; legacy canonical rows are
redacted in memory on load and durably replaced on the next successful save.
Unchanged failures no longer execute on every watch poll. Canonical retry evidence
binds the exact file fingerprint, failure stage, parser/registry/state identity,
attempt count, policy version, and next eligible UTC instant. Read failures use a
short bounded backoff for both inbox and snapshot artifacts, decoder failures use a longer bounded backoff, and state or
snapshot application failures use an intermediate schedule. Changed bytes or a
new decoder identity bypass the old schedule immediately; restart preserves it.
Unreadable evidence retains its stable `unreadable` identity and can be resolved only
when a later stable read is durably installed under an exact SHA-256 checkpoint recorded
as `resolutionFingerprint`; snapshot read failures therefore stop hot-looping without
becoming permanently unresolved after repair.
Credential-free API and Prometheus projections expose only due/deferred/legacy
counts, the next delay, and six bounded stage labels. No file identity, hash,
error, or source payload crosses that telemetry boundary; a ten-minute due-work
alert detects a stopped or wedged index loop.
The 10,000-row evidence bound evicts resolved history first. If unresolved evidence
alone exhausts the bound, no unresolved row is silently displaced: a durable monotonic
overflow checkpoint records the omitted count, index health and automation readiness
fail closed with `dead_letter_capacity_exceeded`, and Prometheus exposes only the
aggregate dropped total. Clearing that condition requires an operator-controlled replay
or replacement of the compatibility state because omitted identities cannot be inferred.
The same durable overflow marker refuses raw-inbox retention, dead-letter reconciliation,
warehouse fact publication, and gap-feed availability; none may claim complete evidence
after an identity was omitted.
Recovery canonicality is also a shared decision-consumer prerequisite. Trending,
candidate, evidence, wallet, token, holder, pool, price, volume, candle, risk, quote,
bot-readiness, and unsigned-preparation HTTP surfaces return 503 before evaluating or
constructing decision inputs when recovery evidence is invalid or capacity-exceeded.
All decision-bearing GET and unsigned-preparation surfaces additionally require canonical
derived ledgers, aggregates, program lifecycle events, execution snapshots, and metadata
projections, preventing a lower-level quote or construction route from bypassing corruption.
Derived WebSocket topics apply the same rule at upgrade, replay, and live-delivery time;
existing derived subscriptions close with retry-later semantics if recovery evidence
becomes unsafe. The raw canonical-block topic remains independently available.

The root compatibility-state collection shape is checked before any health,
capability, bot-readiness, statistics, metrics, RPC-status, feed-health, or
warehouse-health traversal. Corrupt map/array types now produce explicit null
counts and `indexed_state_structure_invalid` availability instead of throwing
inside observability precisely when operators need diagnostic access.
Startup performs that check before compatibility migrations iterate persisted
collections. Structurally invalid or syntactically invalid JSON enters a
read-only quarantine with only a reason and invalid field names exposed;
ingestion mutations and durable saves are rejected, and the original file is
never repaired or overwritten implicitly. Health remains available with
`indexed_state_structure_invalid` or `indexed_state_json_invalid` so recovery
can operate from preserved source evidence. REST data and preparation routes,
read-only data RPC methods, and WebSocket upgrades share the same admission
gate; only redacted health/statistics/metrics and independent ingestion,
warehouse, registry, and execution-policy diagnostics remain available.
Inbox and snapshot-artifact writers check quarantine before filesystem or
checkpoint mutation. The watch loop reports one typed suspended cycle and
cancels further polling instead of misclassifying corruption as a payload dead
letter or repeatedly attempting an impossible save.
Warehouse publication validates quarantine before reading sink credentials or
compiling any deletion/upsert transaction, preventing an empty diagnostic shell
from replacing valid ClickHouse, PostgreSQL, or Redis projections. Dead-letter
reconciliation shares the same guard, and CLI status includes structure and
health evidence for offline recovery workflows.
Every account and supported-pool snapshot command applies one shared policy
before discovery or RPC acquisition: automatic discovery and any run that would
mutate local index state are blocked while quarantined. An explicit target with
`--artifact-only` remains available to acquire independently validated recovery
evidence without reading identities from, or writing to, the corrupt index.
Canonical compatibility state is loaded only from a stable non-link regular-file
snapshot under a startup-validated byte ceiling; unsafe or oversized state is
quarantined before JSON parsing and is never overwritten by recovery workflows.
Raw inbox retention validates the complete persisted recovery graph before it
uses any checkpoint as deletion authorization; detached checkpoints, malformed
dead-letter lifecycle evidence, or invalid reorg corrections block the entire
run before a file is removed. State, archive-receipt and canonical inbox inputs
must be bounded stable non-link regular files, and an eligible file is read and
content-hash checked again immediately before confirmed deletion. Isolated recovery qualification also stops at the
quarantine boundary before reading downstream sink evidence or creating a
consumer-enablement report, so an empty diagnostic shell cannot qualify.
Credential-free Prometheus telemetry distinguishes quarantine from ordinary
freshness failures and reports only the invalid top-level collection count; a
dedicated critical alert pages while all dependent operations remain suspended.

The same retained-event predicate is part of index health, the
`replayableEvents` capability and trading-bot readiness, preventing REST health,
warehouse synchronization and WebSocket replay from disagreeing about whether
durable event evidence is safe to consume.

Phase 9 backup manifest and preflight evidence are version 4 and bind canonical
`solana-mainnet` identity; wrong-network and legacy generic-chain artifacts fail
closed before restore qualification. Manifest creation refuses to assert
`writersQuiesced` unless the library caller explicitly supplies true evidence;
the CLI derives that evidence only from `BACKUP_WRITERS_QUIESCED=yes`. Checksum
and JSON control files are regular-file and size bounded, then content-checked
again after hashing so raced evidence cannot qualify. Tar members use canonical
bounded paths and types, a bounded count, and an all-zero terminator tail so a
concatenated archive cannot hide extraction payloads after qualified state.
Every archived inbox member is independently hashed and its exact name/hash set
must match the bound inbox manifest, rejecting omitted, extra, or changed replay
inputs. Restore tar members are additionally restricted to the three declared
canonical state files, optional directory entries, and canonical inbox files,
so a checksummed archive cannot overwrite application or operator tooling. The
tar is rehashed after inventory inspection. The restore workflow validates and
consumes a private, fixed-inventory staged copy, closing the source-directory
check/use interval, and extracts local state only into a separately marked empty
root outside the repository and backup. Failed restores clean staging;
successful restores retain the evidence through recovery qualification.
Backup production explicitly emits USTAR and never suppresses read failures, so
the producer cannot qualify a host-format-dependent or knowingly partial tar.
The shared inbox archive boundary rejects links, non-files, oversized payloads,
non-USTAR names, malformed hashes, identities, timestamps, and control files
before producing a manifest or installing a completion receipt.
Compressed inbox archives are processed one bounded file at a time; reported
source bytes are accumulated during that verified pass rather than rereading
the entire inbox concurrently. Archives are staged privately and published by
one atomic directory rename; failed attempts remove their validated staging
directory and cannot leave a partial final archive that blocks an identity-safe retry.
HTTP health, readiness, metrics, backup, recovery qualification, exporter health,
and warehouse publication use one bounded regular-file snapshot reader for
operational evidence. Persisted index state, ingestion batches, snapshot artifacts,
backup/archive manifests, audit logs, and checksum inventories share fatal UTF-8
decoding before structured parsing. Link, size, read, replacement, malformed UTF-8, and JSON failures become
explicit unavailable evidence rather than unbounded allocation or an uncaught
serving failure; publication rejects invalid prior checkpoints before sink I/O.
Polling and streaming ingestion apply the same boundary to durable resume status
before network verification, cursor advancement, or inbox mutation.
Hash-only tenant authorization and reviewed holder-exclusion registries also
cross this boundary before changing access or automation-risk decisions, as does
the independent USD/depeg artifact before affecting automation confidence.
Live PostgreSQL warehouse convergence also requires the persisted checkpoint's
canonical chain and mainnet genesis hash, not sequence agreement alone.
The atomic local warehouse receipt is version 2 and independently carries the
same canonical chain and genesis hash; health, bot readiness, and recovery
qualification reject copied, legacy, or wrong-network receipts.
Destructive restore tooling requires a recovery-only Compose project name plus
an operator-installed isolated-target marker before checksum validation or any
database command. Every PostgreSQL, ClickHouse, and Redis restore operation is
addressed through that explicit project, so a drill cannot silently reuse the
normal deployment's Compose identity.
Successful backup publication now read-back verifies every self-hosted object
and installs a canonical status only after the full upload completes. It binds the backup identity to SHA-256
digests of the version-4 manifest and uploaded inbox receipt; a versioned health
endpoint, RPO gauges, and critical alert reject missing, malformed, future, or
older-than-24-hour evidence without disclosing storage locations.
Completion additionally requires the full quiesced artifact inventory and exact
receipt-to-inbox-manifest hash identity with matching canonical upload times.
Its installed version-2 status embeds those identities under a recomputed
evidence digest, preventing altered or legacy evidence from reporting healthy.
The latest isolated recovery report has a separate version-5 canonical assessment and
90-day expiry contract. API/Prometheus expose only its backup identity, age and
duration; missing, malformed, future-dated, invariant-incomplete or expired
reports trigger a critical alert while exclusive report creation remains intact.
The report embeds a bounded backup/index/warehouse/exporter evidence summary;
assessment validates its canonical fields and recomputes its digest, preventing
self-asserted invariant flags or an opaque hash from qualifying a rehearsal.
Diagnostic evidence readers isolate syntax-invalid exporter, warehouse, backup,
and recovery JSON as redacted invalid evidence instead of throwing through the
monitoring path. Metrics remain scrapeable with unhealthy gauges, and feed/gap
contracts now require assessed healthy exporter evidence rather than treating
any parsed or truthy payload as availability.
Canonical index, validator exporter/stream, inbox, cursor/status, and warehouse
receipt publication now share one collision-resistant durable-write boundary:
same-path writes serialize, file contents are synchronized before rename, and
parent-directory metadata is synchronized on production filesystems.
Finalized account/pool/oracle/metadata snapshots, backup preflight evidence,
inbox manifests and archive receipts, verified compressed inbox archives, and
confirmed audit-retention replacements use that same durability boundary.
Audit retention also requires an exact reviewed source digest and explicit
writer quiescence, then rechecks that digest inside the serialized rewrite so
concurrent or changed evidence aborts without deletion. Append-only API audit
records preserve submission order and synchronize each record, while recovery qualification reports preserve exclusive creation and
are synchronized before their consumer-enablement evidence is returned.
Commercial HTTP contracts expose stable codes rather than exception text for
unexpected server, quote, or preparation failures. Controlled validation detail
remains bounded; optional operator diagnostics reuse the shared redaction policy.
Four fixed operation labels provide counter and alert coverage without exposing
exception, request, tenant, provider, or credential data as metric dimensions.
Graceful API shutdown stops producers, drains HTTP requests, closes idle
connections, and flushes pending durable audit records before successful exit.
Versioned Redis hot-state stats carry the same chain and genesis identity, and
content reconciliation rejects missing or mismatched cache identity.
ClickHouse sequence, fact-count, and identity-digest probes are explicitly
scoped to canonical `solana-mainnet` rows.
Synchronous reorg materialization also scopes every slot deletion to that chain,
so repair cannot erase another network's rows in a shared cluster.

## Known limits

The current index is an offline local prototype. It is not yet a SolanaTracker-equivalent service, an RPC replacement, a price oracle, or a safe trading signal. Generic parsed transfer activity cannot faithfully supply pool liquidity, USD price/volume, holders, trader PnL, swaps, or risk scores.

## Decoder sources

- Solana's official System Program contract defines `Transfer` as moving lamports from a signing funding account to a writable recipient and `TransferWithSeed` as moving lamports from a derived address with an explicit signing base, ASCII seed, and owner; `CreateAccount`, `CreateAccountWithSeed`, and feature-gated `CreateAccountAllowPrefund` fund new accounts while preserving allocation/owner and optional base/seed; `WithdrawNonceAccount` moves an exact amount from a nonce account to its recipient. Raw enum layouts are accepted only at exact discriminants, field boundaries, account counts, and lengths (including bounded 32-byte bincode seeds). Only successful instructions are indexed, and zero-lamport prefund creation is excluded from funding edges.

- Raydium's official CPMM repository identifies the mainnet program as `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`; its packed `PoolState`, Anchor `AmmConfig`, `vault_amount_without_fee`, fee helpers, constant-product calculator, and `swap_base_input` account order are authoritative for snapshot offsets, accrued-fee reserve deductions, fee rounding, exact-input output math, and event identity. Each normalized `SwapEvent` is consumed one-to-one by an instruction context with the same pool and ordered input/output mints.
- Raydium's official `SwapEvent` definition is the authoritative field order for the Anchor log decoder: pool, pre-swap vault amounts, input/output amounts and fees, direction, mints, trade fee, and creator fee.
- Raydium's official CLMM program declares mainnet program `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`; its 221-byte Anchor `SwapEvent` defines pool, sender, token accounts, amounts/transfer fees, direction, post-swap sqrt price, liquidity, tick and trade fees. Each event is consumed one-to-one only when the matching official `swap_v2` instruction agrees on sender, pool, direction-resolved vaults, ordered mints, and canonical token/memo programs. It does not emit vault reserves, which remain explicitly unavailable. Direct logs and validator sidecars share strict u64/u128/i32/boolean validation.
- The same official CLMM `create_pool` instruction defines the ordered config/pool/mint/vault/observation/bitmap/token-program accounts and exact `sqrt_price_x64`/`open_time` payload used by lifecycle ingestion.
- Orca's official Whirlpools program declares mainnet program `whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc`; exact `initialize_pool`, `initialize_pool_v2`, and `initialize_pool_with_adaptive_fee` payloads gate `PoolInitialized`, which defines ordered pool/config/mints, tick spacing, token programs, decimals and initial sqrt price. `Traded` defines pool, direction, pre/post sqrt price, exact input/output and transfer fees, LP fee and protocol fee. `Traded` omits mint, decimals, user and reserves, so those identities are accepted only from the matching official swap account order plus consistent transaction token-balance evidence; reserves remain explicitly unavailable.
- Meteora's official DLMM IDL version 0.12.0 defines mainnet program `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`, the `Swap`/`Swap2` and `initialize_lb_pair`/`initialize_lb_pair2` instruction discriminators, fixed account suffixes, exact legacy/v2 swap events, and the exact `LbPairCreate` pool/mint/bin-step event layout used by the decoders. Pool lifecycle output is accepted only when its pool, ordered mints, and bin step bind to one matching initialize instruction context. `Swap2` may leave input unconsumed, so only `amount_in - amount_left` is indexed as input.
- Meteora's official DLMM `LbPair`, `RewardInfo`, and `BinArray` layouts define the finalized snapshot decoder: exact pair/vault/token/reward-mint/bitmap fields, 70 complete 144-byte bins per array, pool-bound program-account filtering, and one monotonic finalized context. Its official TypeScript `fee.ts`, `bin.ts`, and `lbPair.ts` helpers plus Rust `quote.rs` define the implemented Q64 input/output rounding, volatility-reference updates, base/variable fee ceilings, fee-side modes, reward-mint resolution of undetermined pools, MM/processed/open-order traversal, direction filtering, and protocol/order-owner fee splits.
- Solana's official Token Extension Program transfer-fee contract defines a 10,000 basis-point denominator, ceiling-rounded fees capped by `maximum_fee`, older/newer schedules selected by epoch, destination-account withholding, and fee updates delayed by two epochs. Route integration requires the complete finalized mint extension and epoch, not only a Token-2022 program ID.
- Pump.fun's official PumpSwap IDL is authoritative for the `BuyEvent`, `SellEvent`, and `create_pool` instruction layouts and program `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`. Swap events are accepted only when consumed one-to-one by a direction-matched, exact-length buy/sell instruction with the canonical fixed program-account suffix; malformed booleans and reusable weak account prefixes fail closed.
- The same official PumpSwap IDL defines the current 261-byte Anchor `Pool` account used for finalized identity, mode, LP-supply, virtual-reserve, and vault snapshot decoding.
- Pump.fun's official fee-program documentation defines the PumpSwap-bound `FeeConfig` PDA and its flat, market-cap and stable fee-tier layout used by the finalized snapshot decoder.
- Pump.fun's official `@pump-fun/pump-swap-sdk` 1.19.0 source is authoritative for the exact-input buy/sell constant-product operations, effective quote reserve, fee ceiling, and buy-side rounding adjustment.
- Pump.fun's official Pump IDL and coin-creation documentation are authoritative for the current 115-byte serialized `BondingCurve` prefix (including its zero-padded extended allocation), 1,045-byte `Global` account, PDA seeds, `TradeEvent`, `create_v2`, `migrate`, and `migrate_v2` layouts, optional quote accounts, and program `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`. Each trade event must consume one direction-, mint-, quote-, user-, and curve-bound exact V2 instruction context with the canonical token/ATA/fee/system/program suffix; ambiguous reuse and malformed event booleans fail closed.

AMM v4 OpenBook reserve reconciliation and exact-input analysis quoting are complete: the exact legacy 3,228-byte OpenOrders and 388-byte MarketState layouts, market/authority/flags, queues, books, market vaults, lot sizes, derived vault signer, balances, and finalized component slots are checked before publishing vault-plus-orders-minus-pending-PnL reserves; quotes use the on-chain pool's rational swap fee with ceiling rounding and constant-product output flooring. Its exact 17-account base-input route now spans unsigned construction, hash-bound local simulation, capped and expiring external approval, Ed25519 signature verification, and byte-identical finalized landed-message confirmation without indexer signing or submission.

Account snapshot metadata coverage is now provenance-qualified. New production
artifacts and replay events record successful exact-finalized-context Metaplex
search completion even when no metadata account exists. Legacy snapshots remain
balance-readable, but cannot establish authoritative metadata absence and are
scheduled for reacquisition with `metadata_search_incomplete` evidence.
The read-only `getIndexedTokenMetadata` JSON-RPC contract exposes this boundary
directly: canonical metadata and optional untrusted enrichment are returned only
with content-bound finalized search provenance, and a successful empty search is
reported as authoritative absence rather than being conflated with missing data.
Token catalog and detail REST contracts reuse the identical content-bound
coverage projection, including nullable presence for legacy unattested rows.

Read-only block and address-signature RPC pagination now binds each continuation
cursor to a deterministic digest of the complete ordered result projection.
Insertions, retention changes, or reorg replacements invalidate prior cursors
instead of allowing a response to mix rows from different index snapshots.

OpenBook V2 market evidence now decodes the official fixed 848-byte `Market`,
both fixed 90,952-byte `BookSide` accounts, and both token vaults behind
monotonic finalized barriers. Allocator/free-list consistency, reachable
crit-bit nodes, exact leaf counts, fixed-price and oracle-pegged order fields,
authority, ordered mints/programs, bid/ask/event-heap addresses, decimals, lot
sizes, expiry, fee policy, deposits, accrued fees and volumes persist
idempotently with replayable snapshot events and leased repair jobs. Fixed-price
depth is authoritative. Exact optional oracle A/B identities, raw IEEE-754
confidence-filter bits, and signed maximum-staleness-slot policy are retained.
Referenced accounts are captured behind a monotonic finalized oracle barrier,
classified by the official provider rules, and content hashed. The exact
OpenBook `StubOracle` layout is decoded but marked automation-unsafe because its
authority can mutate it. The pinned Pyth SDK v0.10.1 legacy PriceAccount layout
now retains exact header/used-size identity, exponent, publisher/status,
aggregate-versus-previous selection, signed price, confidence, publish time,
and update slot without altering the raw evidence. The canonical Raydium CLMM
PoolState decoder supplies OpenBook-compatible Q64.64 square and mint-decimal
evidence. Pinned Switchboard V2 aggregators validate exact packed identity,
round/sliding selection, minimum results, decimal scales, standard deviation,
and round-open slot. Legacy Switchboard V1 parse-optimized accounts validate
their exact type/SBF layout and expose OpenBook's floating result,
maximum-minus-minimum deviation, and round-open slot. Validated
Pyth/CLMM/Switchboard V1/V2 and mixed-provider snapshots expose
`oraclePolicy.oraclePriceLots` and project each oracle-pegged leaf with
`priceLots`, `oraclePegState`, and `executable` after exact confidence, freshness,
dual-oracle composition, decimal, lot-size, signed-overflow, and peg-limit gates.
Other legacy Switchboard account forms and mutable stub providers remain explicitly unpriced and
non-executable pending provider-specific validation.
