# Terminal DEX platform coverage

This is the implementation ledger for the supplied target architecture. A row
is complete only when production code, fail-closed behavior, and regression
coverage exist. Unsupported fields are returned as missing; they are never
synthetically populated.

Holder exclusion governance uses a version-2, canonical-content SHA-256-bound
registry with explicit review and expiry timestamps. Registry expiry is
independent of block/snapshot freshness; expired, future-dated, malformed, or
hash-divergent labels fail concentration and bot safety closed.

Current route analysis includes fresh finalized exact-input Raydium CPMM/CLMM
and PumpSwap quotes. PumpSwap mirrors the official SDK's integer buy/sell and
fee rounding and binds finalized global disable/fee-mode evidence. Base-to-quote
sells can be prepared and verified through deterministic unsigned, policy-bound
local simulation, with complete legacy-SPL mint evidence and its exact slot/epoch
bound from quote through construction and simulation, then packaged in a capped,
expiring external-signer request;
external signatures and finalized landed message identity are read-only verified.
Exact-quote-input buys now use the same complete read-only execution boundary:
official volume-account construction, the same bound mint evidence, strict quote-spend simulation, capped and
expiring external-signer requests, cryptographic signature verification, and
finalized landed-message identity checks. Indexer-side signing and submission remain
unavailable; Token-2022, cashback and SOL buyback continue to fail closed.
Orca legacy-SPL quotes and their read-only execution chain now require one
complete finalized mint-evidence slot/epoch, propagate it through construction,
and pin simulation to that later context; incomplete fresh snapshots are repaired.

Meteora DLMM now contributes trusted `Swap` and `Swap2` activity to terminal,
history, candle, and evidence consumers. Publication requires the official
instruction version and complete fixed-account suffix, matching pool/user,
canonical token programs, conflict-free decimals, and valid event booleans.
Finalized DLMM pair/vault/mint/default-bitmap state and every field from every
discovered 70-bin array are now decoded, persisted, conflict checked, and
automatically repaired. Fresh finalized explicit-function snapshots now support
exact-input analysis quotes with canonical directional bin traversal, Q64
rounding, dynamic/base fee updates, input/output fee modes, limit-order fee
splits, and epoch-bound transfer fees. Official reward-mint evidence resolves
undetermined function state; missing
evidence and every execution step remain fail closed. Event-derived reserves
remain unavailable.

OpenBook V2 instant-settlement activity covers the official mainnet v1.7
`placeTakeOrder` ABI. Exact instruction layout, account roles, order bounds,
and signer-owned base/quote settlement deltas are required before a swap can
enter analytics. The settled input includes any charged fee, so atom-level fee
separation remains explicitly unavailable. OpenBook execution preparation and
orderbook snapshots remain out of scope pending a separately verified market
account implementation.

Phoenix orderbook now contributes analytical swap activity only when the exact
nine-account legacy-SPL swap ABI, immediate-or-cancel packet, one
instruction-bound audit-log fill summary, and exact trader token-account deltas
agree. Finalized full-account acquisition validates bounded bid/ask allocators
and free lists and persists every active order's exact price, sequence, trader,
quantity and expiry alongside lot/tick economics, identity, vault balances,
provenance, ordered events, and repair jobs. The shared pool endpoint exposes
exact lot-aware, expiry-filtered analytical depth quotes with ceiling taker-fee
rounding. Official nine-account IOC construction binds exact market/vault/token
identity, lot-aligned input/output limits, an aggressive terminal price, bounded
slot expiry, abort-on-self-trade policy, unsigned message identity and exact
mint-bound simulation effects. Capped expiring signer requests, Ed25519 message
verification, and finalized byte-identical landed confirmation complete the
read-only handoff. Canonical Phoenix swap validation also binds the orderbook
venue, bid/ask side, positive base/quote lot fills, bounded quote-fee lots and
the explicit unavailable atom-fee reason, so corrupted persisted facts fail
closed before REST, pricing, warehouse or bot consumption.
Signing and submission remain external.

| Capability | Status | Current implementation | Next dependency |
|---|---|---|---|
| Mainnet RPC | deployable, not running here | non-voting Agave unit, private loopback RPC with strict JSON-RPC version/request-ID correlation and a fail-closed genesis identity gate on every data call | production Ubuntu hosts and snapshots |
| Secondary RPC/load balancing | deployable, not running here | bounded 2-4 endpoint loopback pool, complete consistent all-node genesis verification required before data calls, primary recovery with single-probe half-open admission, shared HTTP 429/503 Retry-After parser with a nonzero 1-second floor and 1-hour ceiling, byte-bounded streaming JSON response decoding, endpoint-free circuit-state/remaining-delay telemetry, redacted failures, and per-block provider provenance | second private Agave instance plus operator activation (remote hosts require a loopback tunnel/proxy) |
| Reduced external RPC | deployable, credentials configured locally | supervised Linux units and bounded Docker Desktop profile/preflight, Helius primary, Alchemy failover, startup-validated unique providers and positive timeout/circuit settings, redacted circuit-state/remaining-delay telemetry, single-probe half-open recovery, shared HTTP 429/503 Retry-After parser with a nonzero 1-second floor and 1-hour ceiling, byte-bounded streaming JSON response decoding, strict JSON-RPC version/request-ID correlation, provider-complete bounded-TTL mainnet genesis verification required by every data call, monotonic cursor/tip checks, version-2 mainnet identity, allowlisted concrete provider provenance, typed nonnegative failure evidence and bounded ordered cursor-contained skipped-slot evidence required by health/readiness, configurable finalized-slot lag gating, `getBlocks`-verified skipped slots and fail-closed unavailable produced blocks, batch-staged inbox/status/cursor publication with safe idempotent replay from the lower durable checkpoint, shared fail-closed CLI/REST/metrics exporter health assessment; public RPC health/emergency-only | reviewed Node image digest, non-placeholder API key, healthy Docker daemon, operator start and quota monitoring |
| Confirmed/finalized streaming | complete for block PubSub | serialized stream, bounded private-node rotation, mainnet identity revalidation before every initial or reconnected subscription, bounded owned/cancellable connection/reconnect/idle timers and subscription-acknowledgement deadline, readiness only after both commitment acknowledgements, deterministic transport-error, hung-handshake and silent-stream failover, node-attributed provenance, unique commitment-bound subscription acknowledgements, stale open/message isolation, durable open/closed transition health with finalized cursor/lag evidence, parser-preserved commitment, transactionally published skipped/repair telemetry after complete `getBlocks`-verified gap repair, inbox-level finality promotion and downgrade refusal | Yellowstone parallel lane |
| Immutable instruction facts | complete in compatibility store | explicit block hashes/parent/time and unique transaction signatures are validated before publication; stable location identity, registry version, decoder version, payload hash and atomically promoted per-fact provenance span transactions/instructions/transfers/balances/events; static and loaded account arrays preserve exact indexes, malformed key arrays reject their transaction boundary, out-of-range instruction indexes discard the complete instruction without positional rebinding, and duplicate/out-of-range inner groups reject the ambiguous tree atomically | ClickHouse sink |
| Dead letters/checkpoints/reorg corrections | complete in compatibility store | file-batch rollback of canonical state and queued events, bounded redacted persisted evidence, stage-aware exponential retry for inbox and snapshot reads plus decode/apply failures bound to exact fingerprints and parser/registry/state identity, restart-safe deferral with immediate changed-evidence/decoder retry, credential-free aggregate retry API/Prometheus telemetry and due-work alerting, dry-run-first exact-fingerprint reconciliation, unreadable-evidence resolution bound to a later exact checkpoint hash, resolution/reopen lifecycle bound to processed-file or allowlisted typed snapshot checkpoints, successful snapshot retry resolution, REST health, and archive-receipt/checkpoint-gated raw inbox retention | sustained live retry qualification and compatibility-state retirement after durable sink qualification |
| Token metadata/balances/observed holders | deployable partial | exact-context finalized SPL/Token-2022 account snapshots enforce canonical mainnet genesis, mint supply/decimals and unique per-account owner/program/mint-decimal identity atomically at import, with exact u64 values and 100-address RPC batches; Token-2022 mint snapshots cross-check parsed extension inventory against bounded raw base64/TLV mint bytes and derive authorities, supply, decimals, mint-withheld amount, older/newer transfer-fee schedules and the selected active fee from raw evidence at the exact finalized epoch and slot, preserving the full u64 range and authoritative absence; Token-2022 account balances and `TransferFeeAmount` use the same bounded raw decoding boundary; reload, holder/security consumers and convergence scheduling share the complete canonical predicate, quarantine malformed legacy rows without rebuilding token accounts, and automatically repair missing mainnet identity, content hash, exact values or complete evidence; official Metaplex accounts are owner/mint-bound and expose only the stable on-chain prefix plus raw hash; optional display enrichment has an owned DNS deadline, is HTTPS/public-IP/content bounded, rejects declared oversize and interrupted response streams before normalization, remains hash-bound to that prefix and untrusted for automation, and is refreshed through deduplicated leased jobs; loaded-address-aware exact deltas require unique account indexes, decimal-u64 amounts and conflict-free canonical program/mint/owner/decimal identity before overlaying snapshots; scheduled CLIs atomically emit content-addressed artifacts and ordered snapshot events drive warehouse/Redis/WebSocket refresh; reviewed exclusion registries support owner/account categories and evidence provenance | populate authoritative pool/burn/locker/exchange registry entries and qualify periodic workers against live providers |
| Protocol swaps/lifecycle | partial | fixture-backed Raydium legacy AMM v4 and CPMM/CLMM, Orca Whirlpools, PumpSwap, Pump bonding curve and Meteora DLMM; the AMM v4 finalized acquisition boundary strictly decodes the official 752-byte `AmmInfo` and binds both legacy SPL vaults at a later shared finalized context; AMM v4 artifacts import idempotently into canonical pool state with component-wise monotonic replacement, conflict rejection, durable checkpoints, ordered replayable snapshot events, and leased missing/incomplete/stale repair jobs; exact AMM v4 `Initialize2` lifecycle decoding binds the 26-byte payload and 21-account ABI to pool authority, ordered mints/vaults, OpenBook market, LP mint, creator, nonce, open time, and positive initial deposits; exact program/discriminator/layout recognition for every currently executable swap ABI gates normalized output with protocol-specific instruction-derived pool/direction/mint/user identity and invocation cardinality, so a detached same-protocol event or one decoded event cannot mask a dropped invocation; the same cardinality gate binds recognized Raydium/Orca/Meteora/Pump/PumpSwap creation and migration instructions to every instruction-derived normalized transition field, including pool/config, ordered mints, vaults, initial amounts or price, source pool, programs, modes and bin step where present; exact directional evidence reconciles native log events with validator sidecars one-for-one without suppressing additional same-protocol swaps; persisted lifecycle facts and swap mirrors are revalidated whole-collection against successful transactions, canonical blocks, registry identity, exact transition fields and provenance before health, REST projection, Redis publication or bot readiness; Orca `PoolInitialized` establishes ordered mints/programs/decimals, tick spacing and initial sqrt price before first trade, while `Traded` logs require an exact program stack, ABI length/discriminator, matching swap instruction pool, and consistent owner/vault mint evidence; finalized Orca Whirlpool account/vault snapshots bind owner, fixed ABI, mints, vaults, liquidity, sqrt price, tick and fees at monotonic RPC contexts, and fixed/dynamic tick arrays bind exact signed initialized-tick liquidity/growth at a shared finalized context; every pool/curve snapshot preserves its component slots, requires component-wise monotonic replacement and derives a maximum-dependency `evidenceSlot` for downstream event ordering, including same-state mint-extension refreshes without permitting older core state to overwrite newer state; successful initialization, explicit curve completion, legacy/current migration, and migration-completion evidence persists canonical curve/pool identity, exact migrated amounts/fee, mints, vaults, creator, metadata and modes; pool summaries derive reorg-safe active/completed/migrated state and exact source-to-destination links with transition provenance; lifecycle changes, finality promotions and fork tombstones share the durable replayable WebSocket sequence with per-event provenance, source/destination filters, and pre-write oversized-frame/backpressure eviction; finalized Raydium CLMM PoolState/vault/TickArrayState snapshots include default and verified signed overflow bitmaps with exact initialized ticks | additional protocol registry entries/fixtures and executable CLMM route math |
| OHLCV/pricing | deployable partial | exact raw candles and exact nominal USD references through fresh finalized direct-USDC or wrapped-SOL paths, with pool TWAPs collapsed within each decoded protocol before cross-protocol aggregation; three independent protocols unlock robust median evidence, while same-protocol pool proliferation cannot; competing complete paths are deterministically ranked by robust coverage, minimum independent protocol count and hop count, preventing one weak direct pool from overriding a stronger indirect path; warehouse synchronization deterministically rebuilds only event-affected candle buckets after late arrivals, promotions and reorg replacements; a loopback-only operator-configured Pyth `PriceUpdateV2` producer accepts only fully verified, feed/program/account-bound, confidence-bounded finalized evidence and emits an exact content-addressed version-2 USDC/USD artifact whose expiry derives from publish time; the independent evidence gates robust price, volume and bot safety by configurable exact depeg deviation | operator selection of the production Pyth source account/feed and broader robust venue coverage |
| Internal evidence API | partial | authenticated evidence bundle v2 embeds token market state, exact USD reference/volume completeness, per-pool risk, snapshot-backed security/holders and explicit missing gates; related views expose trades, OHLCV, liquidity, trending, candidates, exact partial wallet performance, native/token funding and deterministic shared-funder peers, feed health/gaps | executable routes and complete production-qualified risk inputs |
| PostgreSQL/ClickHouse/Redis | durable multi-sink sync partial | reviewed-image-required Compose, secret files and loopback ports; canonical facts/dead letters reconcile idempotently, every warehouse sink write/probe, commercial sync, and leased operational command has bounded output capture, redacted diagnostics, and a terminating deadline with bounded SIGTERM-to-SIGKILL escalation; HTTP calls and WebSocket upgrades share the same local/Redis tenant quota and durable commercial metering, which strips resource identities into explicit bounded route templates, aggregates integer-safe request totals plus exact milliseconds, ignores validated anonymous rows for billing, and transactionally deletes key hashes revoked from the authoritative registry; PostgreSQL transactionally upserts metadata/candidates/security/jobs/checkpoints, snapshot jobs use skip-locked leases, recovery and bounded artifact-only execution, Redis stages versioned hot state and persisted-event fan-out, and an atomic Lua gate provides fail-closed multi-instance quotas; PostgreSQL and Redis token projections carry the same canonical metadata-search evidence as REST, preventing incomplete acquisition from becoming authoritative absence downstream; durable health requires live sequence agreement plus version-8 count and deterministic identity/content reconciliation for all replayable ClickHouse derived facts, PostgreSQL token/candidate projections, exact versioned Redis hot-token, hot-pool, and stats-sentinel values, and a ClickHouse-recomputed sequence-ordered canonical-event content chain; the sink-write boundary independently verifies every event/fact hash and batch-chain transition before any mutation; deterministic synthetic replay qualification exercises real parse/apply duplicate and reorg paths with count, heap and state-digest invariants | sustained live multi-sink reconciliation and full isolated backup/restore drill |
| Object storage | self-hosted deployable | loopback SeaweedFS master/volume/filer plus reduced-mode verified gzip raw archive, checksum/receipt-gated retention, no S3/cloud dependency | multi-host replication, encryption/retention policy and restore drill |
| Yellowstone/Geyser | blocked on compatible release, activation gated | repository Agave 3.1.14 cannot load current Yellowstone 14.2.2 built for Agave 4.1.0; version-2 preflight uses a terminating byte-bounded version probe with redacted diagnostics and bounded force-kill escalation, and binds exact installed binary hashes/version and plugin identity to reviewed source commits plus recent 24-hour/100k-block complete replay, zero-divergence PubSub reconciliation, zero-drop transport, bounded-buffer and RSS qualification evidence | operator-approved Agave 4.1 upgrade or reviewed compatible plugin pin and real sustained qualification |
| Executable routing | self-hosted partial, fail closed | Raydium CLMM/CPMM exact quotes plus PumpSwap and Pump bonding-curve execution use coherent finalized pool/curve, tick/vault, mint-owner and configuration evidence; legacy-SPL Orca Whirlpools add exact Q64.64, millionths-fee, initialized-tick quotes and official-ABI-bound unsigned legacy `swap` construction with derived oracle, three-array path validation, exact local token-effect simulation, capped expiring external approval, cryptographic signature verification and finalized landed-message identity; Meteora DLMM adds exact-input traversal across MM and direction-valid limit-order liquidity with Q64 rounding, dynamic/base fees, fee-side modes, protocol/owner splitting, epoch-bound transfer fees, reward-mint resolution, official-ABI unsigned construction, local effect-bound simulation and read-only signed/finalized verification, while missing evidence and all execution steps fail closed; authenticated Raydium CLMM/CPMM, Orca, Meteora, bidirectional PumpSwap, and bidirectional Pump bonding-curve preparation endpoints independently requote persisted finalized evidence and expose only offline unsigned artifacts; every response embeds a versioned hash-bound external-execution handoff requiring finalized local simulation, explicit bounded expiring signer approval, externally operated submission, and exact finalized landed-message verification; the indexer never signs/submits; Raydium CPMM binds official `swap_base_input` account order and discriminator into the same complete read-only execution chain; exact Token-2022 fee primitives and finalized account/pool mint snapshots cover ceiling/cap/epoch selection, inverse gross-for-net u64 math, raw-TLV-derived active fee evidence, and raw 64-byte transfer-hook authority/program identity; production Raydium CLMM/CPMM, Orca, Meteora, PumpSwap and Pump bonding-curve snapshots bind both mint accounts to a shared finalized epoch/context after all dependencies, and Token-2022 pool mints cross-check parsed identity/inventory/hook state against raw mint bytes before quote evidence is accepted; both legacy-SPL and fee-only Token-2022 Raydium CLMM/CPMM quotes bind that exact mint slot/epoch through instruction construction and simulation, while fee-only pools deduct active input/output transfer fees and carry direction-specific token programs; Pump Sell V2 now requires the complete mint evidence in its quote, instruction and simulation context and rejects Token-2022 even with internally consistent program IDs until its fee-transfer topology is verified; unsupported extensions fail closed; other supported paths use this boundary without indexer signing/submission; fresh legacy CLMM/CPMM/PumpSwap/Pump snapshots missing quote or execution evidence are automatically repaired, including mismatched finalized mint slot/epoch bindings | qualify live routes and externally operated execution |
| Security/liquidity/manipulation | partial, fail closed | finalized authority/extensions and holder evidence are assessable only when their snapshot has canonical content-hash, slot, exact supply/decimals and explicit complete account coverage; exact venue reserve coverage, 90% trader/base-notional coverage gates, count and exact base-notional concentration, repeated base amounts, single-slot bursts, concentrated round trips and reorg-safe shared direct System-transfer funder evidence; risk/readiness explicitly reports absent simulation/landed-route evidence and cannot promote analysis-only state to automation-safe | complete native/token funding history, reviewed entity/lock registries, persisted fresh locally simulated executable sell-route evidence and broader protocol-specific liquidity state |
| Smart money | evidence only | exact partial cost basis/PnL, activity profile, direct/seeded-transfer/standard/seeded/prefunded account-creation, nonce-withdrawal and Stake Program withdrawal totals, strictly validated parsed/raw SPL/Token-2022 wallet-owner funding totals per mint with fee-bearing gross/net separation, and deterministic native/per-mint token shared-funder peers; no wallet classification is inferred | complete wallet history, unsupported token instruction coverage, USD references, and validated sybil/entity clustering |

Reviewed holder exclusions cannot establish completeness with display labels or
mistyped identities: every mint, owner and token-account selector is decoded as
a canonical 32-byte Solana base58 address before the registry is admitted.
REST/RPC stats and fixed-cardinality Prometheus gauges publish only aggregate
configured/fresh state, age/expiry, covered-mint count and entry count.

| mTLS/SLO/backup | deployable | optional mTLS gateway, Prometheus endpoint, fixed route-free latency histogram and p99 alert, alert rules covering index/export/warehouse/backup/recovery, durable audit failure and WebSocket saturation/backpressure/protocol abuse, stated SLO/RPO/RTO and checksum-gated restore; version-4 backup evidence binds canonical `solana-mainnet` identity, one backup identity, quiesced writers, exact artifact sizes/hashes and inbox archive identity, with mandatory ClickHouse artifacts for canonical events, instructions, swaps, balance changes, native transfers, dead letters and candles; version-2 completion status revalidates the full inventory plus exact uploaded-receipt/inbox-manifest hash and time relationship then embeds those identities under a monitoring-recomputed digest, while restore preflight enforces exact sink inventory, RPO age, safe tar structure and required canonical state before destructive tooling runs; restore requires a recovery-only Compose project plus a separately marked empty state root outside the repository and backup, preventing an isolated drill from overwriting active local state; version-5 post-restore qualification independently confines its marker and index/exporter/checkpoint evidence to that root, requires the exclusive report outside the state and backup evidence, embeds and digest-binds the manifest hash and chain identity to canonical index health, zero-lag version-8 identity/content warehouse reconciliation, a healthy finalized exporter observation produced inside the recovery window and elapsed RTO, and monitoring recomputes the digest before accepting it | production PKI, monitoring destination and an executed quarterly isolated recovery drill |
| Social/news/CEX context | out of scope | never presented as on-chain evidence | approved external research sources |

Dead-letter compatibility storage is additionally capacity-safe: resolved history is
evicted first at the 10,000-row bound, while all-unresolved saturation records a durable
aggregate overflow checkpoint and fails index/bot readiness closed instead of silently
discarding the oldest unresolved identity. Metrics and alerting expose only the aggregate
dropped count. Raw retention, reconciliation, warehouse publication, and gap feeds all
refuse overflowed state; controlled replay into replacement state is required to clear it.
Every decision-bearing HTTP projection, analysis quote, and unsigned preparation route
shares the same recovery gate, preventing incomplete recovery state from bypassing bot
readiness through a lower-level endpoint.
Decision-bearing GET projections and unsigned preparations also share every canonical
derived, aggregate, lifecycle, snapshot, and metadata gate before reading route evidence.
Derived WebSocket subscriptions are rejected or evicted under the same condition, while
the independently validated raw block stream remains available for recovery consumers.

For every retained canonical slot, the latest canonical-block replay envelope is
content-reconciled against both the complete lifecycle ledger and the complete swap
ledger. A valid but detached replay copy therefore fails health, warehouse export,
and WebSocket replay instead of presenting a second market history to consumers.
Both ledgers also require the active slot-qualified program registration, exact
current registry and decoder versions, protocol identity, amount/fee/decimal bounds,
and recognized payload-hash semantics; stale or invented decoder identities fail closed.
Fork-replacement tombstones are content-reconciled with the latest retained predecessor
for that slot, and ordinary index/finality envelopes are forbidden from carrying retractions.
Latest retained account, metadata, and pool snapshot replay descriptors are likewise
content-reconciled with their canonical projections after exact field-set validation.
Recovery evidence preserves ordered multi-replacement chains per slot, rejects duplicate
or broken links, and reconciles every fully retained fork transition with replay history.

Multi-sink repair also runs when the canonical event batch is empty, rebuilding
PostgreSQL projections, canonical dead letters, and expired or lost versioned
Redis hot state before reconciliation.
The complete Redis delete/repopulate, stats, TTL, publication, and
current-version pointer transition is atomic even when repairing the already
advertised sequence.
PostgreSQL token projections and warehouse checkpoints share the canonical
`solana-mainnet` identity used by reconciliation.
Live sink convergence rejects a PostgreSQL checkpoint unless its chain and
genesis hash match canonical mainnet in addition to its event sequence.
Redis hot-state stats and reconciliation independently require that same
canonical chain and genesis identity.
ClickHouse convergence queries scope every canonical fact and digest input to
`solana-mainnet`, preventing foreign-chain rows from satisfying readiness.
Reorg repair mutations apply the same chain predicate before deleting any
slot-scoped instruction, swap, balance-change, or native-transfer facts.

Meteora execution detail: legacy-SPL quotes confined to the finalized default
bitmap now have official-ABI-bound unsigned `swap`/`swap2` construction and
local simulation with exact instruction policy and token-effect bounds.
Fee-only Token-2022 routes bind their two token programs, Memo, finalized fee
evidence, and an empty transfer-hook slice vector. Transfer-hook routes with
fully resolved static, PDA, account-data, or pubkey-data metadata bind
direction-specific transfer accounts, gross amounts, and hash-bound finalized
source-account bytes, append validation/program accounts, encode ordered
X/Y slices, and place them before bin arrays. Capped expiring external
approval, Ed25519 verification, and finalized landed-message identity complete
the read-only execution chain. Pool-bound finalized bitmap-extension evidence
also admits initialized arrays outside the default range. Other extensions fail
closed; transfer-hook mints retain finalized hook-program,
executable-account and canonical validation-PDA raw/hash evidence, with strict
Execute TLV meta-count, privilege and static-address decoding. Internal and
prior-account-selected external PDAs resolve literal, instruction-data,
account-key, and account-data seeds in order; pubkey-data forms resolve from
instruction or account bytes. Missing, stale, oversized, or corrupt evidence
fails closed and simulation uses the newest bound evidence slot.
The indexer never signs or submits and automation remains disabled.
All REST and internal execution surfaces now use stable non-leaking failure
envelopes. Redacted callback diagnostics preserve operator visibility without
making provider URLs, credentials, filesystem details, or exception text part
of a commercial consumer contract.
Fixed-cardinality Prometheus counters and an increase alert make each protected
failure family observable even when no diagnostic callback is configured.

Metadata absence now has explicit provenance: every newly acquired account
snapshot attests completion of its exact-slot Metaplex program search. Legacy
snapshots without that attestation remain readable for balance consumers but
are reported as incomplete metadata coverage and queued for snapshot repair.
The read-only indexed metadata RPC now exposes canonical presence or authoritative
absence with finalized slot, observation time, source hash, and search-completion
evidence; legacy or corrupt evidence fails closed.
Token catalog and detail responses carry the same metadata-evidence projection,
preventing Terminal pages from rendering missing acquisition as verified absence.
Block-list and address-signature RPC cursors are projection-versioned; any
indexed-history mutation invalidates continuation before mixed-snapshot rows can
be returned.
The REST block, transaction, and filtered swap lists use the same projection
binding, completing mixed-snapshot protection across every mutable v1 collection.

AMM v4 coverage update: finalized snapshots bind the exact legacy 3,228-byte OpenBook `OpenOrders` and 388-byte `MarketState` accounts, validate market/authority/flags, queues, books, market vaults, lot sizes, derived vault signer, and free/total balances, preserve every component slot, and publish exact vault-plus-orders-minus-pending-PnL reserves. The internal quote contract provides deterministic exact-input analysis using the pool's rational swap fee and explicit ceiling/output-floor rounding. The exact 17-account legacy `SwapBaseIn` route now has hash-bound unsigned transaction construction and local simulation policies binding the complete market route, exact input debit, bounded output credit, finalized component slots, message identity, and tamper rejection. Capped expiring external approval, cryptographic signature verification, and finalized byte-identical landed-message confirmation complete the read-only chain. The indexer still never signs or submits, so automation continues to fail closed until an external authority satisfies every gate.
