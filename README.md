# Self-hosted Solana indexer

A zero-dependency Node.js indexer for canonical Solana block JSON produced by
infrastructure you operate. Its real-time bridge connects only to explicitly
loopback-scoped Agave HTTP/WebSocket endpoints; it has no third-party hosted
API, RPC, or WebSocket dependency.

## Architecture

```text
self-hosted validator / local ledger exporter / local Geyser writer
                         |
                    block JSON files
                         v
                inbox/ -> parser -> atomic local index
                                      |
                              REST API + dashboard
```

This repository deliberately starts at the local file boundary. Run your validator-side exporter under the validator's permissions and write completed files into `inbox/` using an atomic rename. The indexer never needs validator credentials or internet access.

## Input contract

Files may be `.json` (one block or an array) or `.ndjson` (one block per line). Each block uses Solana's parsed `getBlock`-shaped structure plus a required top-level `slot`:

```json
{
  "slot": 100,
  "blockhash": "...",
  "previousBlockhash": "...",
  "parentSlot": 99,
  "blockTime": 1700000000,
  "transactions": []
}
```

Use parsed transaction encoding in the local exporter so SPL Token and Token-2022 transfers contain `instruction.parsed`. See `test/fixtures/block.json` for a complete fixture. Files are checkpointed by name and fingerprint; changed files are safely reprocessed. A conflicting block at the same slot replaces its orphaned transactions and transfers.

## Run

Node.js 20 or newer is the only requirement.

```powershell
npm test
npm run index
npm start
```

Open `http://127.0.0.1:8787`. Continuous indexing is included in `serve`; use `npm run watch` for an ingestion-only process.

### Reduced external-mainnet mode

For Docker Desktop-sized development, the finalized HTTP exporter can use
Helius as primary and Alchemy as failover without weakening the loopback-only
self-hosted-validator path. Copy `validator/external-rpc.env.example` outside
the repository, insert private provider URLs, and load that protected environment
before running `npm run export:external`. Both private URLs are mandatory. The
exporter validates mainnet genesis, uses bounded batches, opens a provider circuit
after repeated failures, and persists only provider names—never URLs or keys.

`infra/reduced/compose.yaml` packages this lane for Docker Desktop. Set
`NODE_IMAGE` to a reviewed digest and start the default exporter service. It
publishes no port, caps indexed history at one day/50,000 transactions, uses
bounded logs, and reports health from durable exporter evidence. The API binds
only to `127.0.0.1:8787` and requires `INDEXER_API_KEYS` in the ignored
environment file before Compose will keep it running. Raw blocks are never
silently deleted. `docker compose -f infra/reduced/compose.yaml --profile tools
run --rm archive` creates verified per-file gzip copies under ignored
`archive-mainnet`, then installs the exact-fingerprint receipt. Review
`npm run retention:inbox` before separately confirming deletion.

Run `infra/reduced/start.ps1 -NodeImage '<reviewed-name>@sha256:<digest>'`
for a non-starting preflight. It validates provider hostnames without printing
URLs, the mainnet genesis pin, a non-placeholder API key, writable bind mounts,
the Docker daemon, and the Compose schema. Add `-Start` only after reviewing the
result; the automation never supplies that switch.

`npm run health:public-rpc` uses the Solana public endpoint only for genesis and
health checks. `npm run export:external -- --emergency-public --once` is the only
public-RPC backfill mode; it is forced to one cycle and at most four slots. It
must not be used as the normal ingestion lane. Use a new `inbox-mainnet` and
mainnet data/status files so private-chain evidence can never be mixed in.

For a supervised Ubuntu deployment, copy the protected environment to
`/etc/solana-indexer-external.env` with root ownership and mode `0600`, then run
`sudo bash validator/install-external-services.sh`. The installer validates the
approved provider hosts and installs separate external exporter/API units but
does not start them. After tests pass, enable `solana-indexer-external-exporter`
and `solana-indexer-external-api`. Do not enable these alongside the equivalent
local-validator API/stream units against the same files or port.

## Self-hosted mainnet validator

The `validator/` directory contains a production-oriented, non-voting Agave RPC-node deployment kit:

- `preflight.ps1` refuses unsupported/undersized Windows hosts.
- `install-agave-ubuntu.sh` builds a pinned, reviewed Agave release from Anza's source.
- `run-mainnet-rpc.sh` binds RPC to loopback, enables transaction history and token account indexes, and keeps voting disabled.
- `agave-rpc.service` runs the node as the dedicated unprivileged `sol` user.

This host does not meet production requirements. Deploy these files to Ubuntu 24.04 bare metal with the required RAM, separate NVMe volumes, public IPv4, and bandwidth. Review the release tag and mainnet parameters before launch; do not store a voting withdrawer key on the node.

After the local node has caught up, run the loopback-only bridge and indexer in separate processes:

```powershell
npm run stream
npm start
```

`stream` opens loopback-only Solana PubSub subscriptions for both `confirmed`
and `finalized` full blocks. Confirmed blocks provide the low-latency lane;
finalized copies canonically promote or replace them. Subscription acknowledgements
must be unique and commitment-bound, and superseded sockets cannot deliver into
the active queue. The stream persists every
notification atomically into `inbox/`, repairs bounded slot gaps with local
`getBlocks`-verified `getBlock` reads, resumes from durable status after restart, reconnects with bounded
exponential backoff, and records finalization lag, reconnects, decode errors,
repairs, and skipped slots. Keep `npm run export` available as the finalized
HTTP backfill/recovery process, but do not run both writers against the same
inbox unless operationally coordinated.

The exporter rejects HTTPS and every non-loopback address. It reads finalized blocks only from `http://127.0.0.1:8899`, strictly correlates each JSON-RPC version and response ID, writes blocks atomically to `inbox/`, and checkpoints its last exported slot. This is self-owned local RPC traffic, not a third-party provider.
Each exported block carries source, finalized commitment, observation time, validator tip, and export lag. Export-cycle diagnostics include the bounded skipped-slot list; skipped Solana slots are evidence, not treated as missing blocks.

### Minimal Docker development validator

Docker Desktop can run the isolated `solana-test-validator` setup under `validator/dev`. It is a private development chain, not mainnet, devnet, or testnet, and contains no historical production data.

```powershell
./validator/dev/start.ps1
$env:INDEXER_EXPECTED_GENESIS_HASH = "any" # private development chain only
npm run export
npm start
```

The container uses Agave `v3.1.14`, four CPUs, a 4 GB memory ceiling, bounded local logs, a disposable named ledger volume, and RPC published only on `127.0.0.1:8899`. Agave requires `io_uring`, so this one service uses Docker's unconfined seccomp profile; Linux capabilities are still fully dropped and `no-new-privileges` remains enabled. Run `stop.ps1` to stop it without losing the ledger or `reset.ps1` to remove the disposable ledger.

### Production service installation

On the reviewed Ubuntu mainnet host, keep the repository at
`/home/sol/solana-indexer`. Copy `agave-validator.env.example`,
`solana-indexer-stream.env.example`, and `solana-indexer.env.example` to their
matching `/etc/*.env` paths. Generate the API key outside the repository, keep
the API environment file root-readable only, and leave Agave RPC bound to
loopback. Then install, verify, and start the services:

```bash
sudo bash validator/install-indexer-services.sh
npm test
npm run verify:mainnet
sudo systemctl enable --now agave-validator
# Wait until npm run verify:mainnet reports a healthy, caught-up mainnet node.
sudo systemctl enable --now solana-indexer-stream solana-indexer-api
```

The verifier and both ingestion paths require mainnet genesis
`5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d`. They refuse a private validator,
a different cluster, or an existing inbox whose genesis was never recorded.
Use a new empty inbox/data directory when moving from development to mainnet.
Terminal DEX, AI, and bot services should connect to the authenticated indexer
REST/WebSocket endpoint, never directly to Agave. Keep the API on loopback behind
an approved TLS reverse proxy or private service network; this repository does
not provision DNS certificates or open firewall ports.

### Data services

`infra/compose.yaml` defines loopback-only PostgreSQL, ClickHouse, and Redis
services with persistent volumes, secret files, health checks, and no floating
image defaults. Copy `infra/.env.example` to `infra/.env`, replace every image
with an operator-reviewed immutable digest, create the three ignored secret
files, then validate with `docker compose --env-file infra/.env -f
infra/compose.yaml config`. PostgreSQL owns metadata, jobs, checkpoints,
security/candidate state and audit records. ClickHouse owns immutable
instructions, swaps, balance history and dead letters. Redis is reserved for
hot state, locks, rankings and fan-out. The application does not claim these
stores are active until connector health and dual-write validation are added.
SeaweedFS master, volume, and filer services provide self-hosted archive storage;
only the filer is published, on loopback port 8888. No AWS/S3 account, endpoint,
or cloud credential is used.
An optional `gateway` Compose profile adds a reviewed-image-required nginx mTLS
boundary on port 8443. It requires a server certificate/private key and a client
CA in ignored secret files and rejects clients without a trusted certificate.
API keys remain required as an independent application-layer control.

`npm run sync:warehouse` replays the persisted canonical event sequence into
ClickHouse and advances the PostgreSQL ingestion checkpoint only after the
ClickHouse client acknowledges the batch. It then atomically advances a local
0600 checkpoint. Retries are idempotent by `(chain, sequence)`, and the worker
fails closed if its checkpoint falls behind the bounded replay history, moves
ahead of the index, or encounters a sequence gap. Database passwords remain in
the clients' normal environment/password-file configuration and are never
passed as command arguments. Schedule this worker only after both local data
services pass their health checks.
For every touched slot the worker waits for synchronous ClickHouse mutations to
remove prior instruction, swap, and token-balance facts, then inserts the
current canonical facts before checkpointing. This makes finality promotion and
fork replacement retry-safe instead of retaining orphaned materialized rows.
The final PostgreSQL transaction upserts validated token summaries, exact mint
authority/extension JSON, and the shared ingestion checkpoint together.
Bounded parser dead letters are fully reconciled with exact fingerprint,
attempt, resolution, and last-observed evidence before that checkpoint moves.
The installer also installs a hardened one-shot service and one-minute timer,
but does not enable either. Operators must first verify both database schemas,
client credential files, and a manual synchronization before enabling
`solana-indexer-warehouse-sync.timer`. Each acknowledged batch also stages
versioned pool/token hashes in Redis, atomically switches the current-version
pointer, and publishes only persisted canonical events. Redis authentication is
passed through the child environment, and any sink failure leaves the local
checkpoint unchanged so the complete batch is replayed idempotently.

Configuration:

| Variable | Default | Purpose |
|---|---:|---|
| `INDEXER_INBOX` | `inbox` | Completed block files |
| `INDEXER_DATA_FILE` | `data/index.json` | Atomic local index snapshot |
| `INDEXER_WAREHOUSE_CHECKPOINT_FILE` | `data/warehouse-checkpoint.json` | Atomic checkpoint advanced only after ClickHouse and PostgreSQL acknowledge canonical events |
| `INDEXER_WAREHOUSE_STALE_AFTER_MS` | `300000` | Maximum successful warehouse checkpoint age before health fails closed |
| `INDEXER_MAX_WAREHOUSE_LAG_EVENTS` | `1000` | Maximum canonical-event lag before warehouse health fails closed |
| `CLICKHOUSE_PASSWORD_FILE` | unset | Protected ClickHouse password file read into the client subprocess environment without command-line exposure |
| `REDIS_PASSWORD_FILE` | unset | Protected Redis password file read into `redis-cli` subprocess environment without command-line exposure |
| `INDEXER_REDIS_HOT_TTL_SECONDS` | `86400` | Retention for versioned Redis pool/token hot-state hashes |
| `INDEXER_REDIS_HOT_MAX_BYTES` | `16777216` | Hard byte cap for one staged Redis hot-state/fan-out transaction |
| `INDEXER_DISTRIBUTED_QUOTA` | `false` | Use atomic Redis fixed-window admission; configured admission failures return 503 instead of falling back locally |
| `INDEXER_REDIS_HOST` | `127.0.0.1` | Loopback-only Redis quota endpoint |
| `INDEXER_REDIS_PORT` | `6379` | Redis quota endpoint port |
| `INDEXER_REDIS_QUOTA_TIMEOUT_MS` | `250` | Bounded Redis quota admission timeout |
| `EXPORTER_STATUS_FILE` | `data/exporter-status.json` | Atomic durable exporter health and skipped-slot evidence |
| `ACCOUNT_SNAPSHOT_FILE` | `data/account-snapshot.json` | Atomic mint/holder evidence requiring one exact finalized RPC context and canonical token-program identities |
| `HOLDER_EXCLUSIONS_FILE` | unset | Optional reviewed mainnet exclusion registry; concentration remains unassessable unless coverage for the mint is complete and fresh |
| `CLMM_POOL_SNAPSHOT_FILE` | `data/clmm-pool-snapshot.json` | Atomic finalized Raydium CLMM pool/vault evidence |
| `CLMM_TICK_ARRAYS_JSON` | unset | Optional JSON map of requested Raydium CLMM pool addresses to unique tick-array addresses; captures pool-bound finalized headers only and does not enable routing |
| `CLMM_BITMAP_EXTENSIONS_JSON` | unset | Optional JSON map of Raydium CLMM pool addresses to unique overflow bitmap-extension addresses; captures pool-bound finalized raw segments without claiming executable coverage |
| `INDEXER_HOST` | `127.0.0.1` | API bind address |
| `INDEXER_PORT` | `8787` | API port |
| `INDEXER_POLL_MS` | `1000` | Inbox scan interval |
| `INDEXER_STALE_AFTER_MS` | `120000` | Maximum age before health fails |
| `INDEXER_MAX_EXPORT_LAG_SLOTS` | `512` | Maximum finalized exporter lag before ingestion fails closed |
| `INDEXER_MAX_TRANSACTIONS` | `250000` | Retention cap |
| `INDEXER_RETENTION_SECONDS` | `604800` | Indexed-time retention window (seven days) |
| `INDEXER_API_KEYS` | empty | Comma-separated API keys; mandatory for non-loopback binding |
| `INDEXER_RATE_LIMIT_PER_MINUTE` | `600` | Per-key or per-socket-address request ceiling |
| `INDEXER_AUDIT_LOG_FILE` | unset | Append-only redacted JSONL API audit sink; mandatory for non-loopback binding |
| `INDEXER_AUDIT_RETENTION_DAYS` | `30` | Default validated audit retention; tenant plans may override it |
| `INDEXER_API_TENANTS_FILE` | unset | Reviewed hash-only tenant/key registry with rotation windows and plan quotas |
| `INDEXER_WS_HEARTBEAT_MS` | `30000` | WebSocket ping interval |
| `INDEXER_WS_MAX_BUFFERED_BYTES` | `1048576` | Slow-consumer eviction threshold |
| `LOCAL_VALIDATOR_WS` | `ws://127.0.0.1:8900` | Loopback-only Agave PubSub endpoint |
| `LOCAL_VALIDATOR_RPC` | `http://127.0.0.1:8899` | Loopback-only gap-repair RPC endpoint |
| `INDEXER_STREAM_RECONNECT_MIN_MS` | `500` | Initial reconnect backoff |
| `INDEXER_STREAM_RECONNECT_MAX_MS` | `30000` | Maximum reconnect backoff |

## API

- `GET /api/health`
- `GET /metrics` (Prometheus format; keep private or behind mTLS)
- `GET /api/stats`
- `GET /api/blocks?limit=100`
- `GET /api/transactions?limit=100`
- `GET /api/transaction/:signature`
- `GET /api/account/:address?limit=100`
- `GET /api/mint/:mint?limit=100`
- `GET /api/trending?window=5m|1h|6h|24h|all&limit=50`
- `GET /api/v1/blocks?limit=100&cursor=...` (stable response envelope)
- `GET /api/v1/transactions?limit=100&cursor=...` (stable response envelope)
- `GET /api/v1/swaps?mint=&pool=&protocol=&limit=100&cursor=...` (verified decoded swaps)
- `GET /api/v1/pool/:pool` (exact reserve and execution-price evidence)
- `GET /api/v1/price/:mint` (exact nominal USD reference via fresh finalized USDC paths)
- `GET /api/v1/volume/:mint?window=5m|1h|6h|24h` (exact finalized notional; requires a robust reference)
- `GET /api/v1/candles/:pool?interval=60&limit=300` (exact direction-stable OHLCV)
- `GET /api/v1/token-account/:address` (latest observed on-chain token balance)
- `GET /api/v1/holders/:mint?limit=100` (finalized snapshot coverage when available; exclusions disclosed)
- `GET /api/v1/bot/readiness?pool=:pool` (targeted fail-closed capability gate)
- `GET /api/v1/risk/:pool` (data-quality evidence, not a rug/security oracle)
- `GET /api/v1/ingestion` (durable exporter lag and skipped-slot evidence; malformed cursor/lag/tip progress fails closed)
- `GET /api/v1/warehouse` (durable sink checkpoint age, event lag and retained-replay coverage; unavailable/corrupt/ahead checkpoints fail closed)
- `POST /rpc` (`getIndexerHealth`, `getIndexerStats`, `getIndexedTransaction` only)
- `WS /ws?cursor=<sequence>&topic=blocks|swaps|lifecycle&mint=&pool=&protocol=&eventType=` (filtered persisted events with replay/resume)

Frontend, AI, and paper-bot services should prefer the authenticated internal
contracts: `/internal/tokens/:mint` and its `market`, `security`, `holders`,
`trades`, `ohlcv`, `liquidity`, and `executable-depth` views;
`/internal/evidence/:mint`; `/internal/trending`; `/internal/new-pairs`;
`/internal/candidates`; `/internal/wallets/:address`; `/internal/feed/health`;
and `/internal/feed/gaps`. Evidence responses include stable schema versions,
provenance, freshness, confidence, and explicit missing fields. The program
registry is available at `/internal/registry`.

`GET /internal/tokens/:mint/executable-depth?amountRaw=<raw-token-units>`
provides an exact Pump bonding-curve sell quote only when the latest decoded
curve event is finalized and fresh and its observed cashback/buyback fee rates
are zero. It applies the constant-product sell formula to the event's post-trade
virtual reserves and rounds protocol and creator fees upward independently.
The result is deliberately `executable: false` and `safeForAutomation: false`
until a fresh account decoder, transaction builder, local simulation, and
landed-transaction confirmation are present. Other venues and fee modes return
an explicit unavailable response rather than an estimate.

Run `npm run snapshot:accounts -- <mint> [mint...]` against the loopback mainnet
RPC to capture canonical finalized mint authorities, Token-2022 extensions, and
all SPL/Token-2022 accounts for selected mints. With no arguments it uses mints
already discovered by the index. This is intentionally bounded because
`getProgramAccounts` is expensive. Holder concentration remains unsafe for
automation until pool, burn, locker, and exchange exclusions are authoritative.
Set `HOLDER_EXCLUSIONS_FILE` to a reviewed JSON registry with
`schemaVersion: 1`, `chain: "solana"`, the pinned mainnet `genesisHash`, an
ISO `observedAt`, a non-empty `source`, unique `completeMints`, and `entries`.
Each entry identifies one `mint`, exactly one `owner` or `tokenAccount`, a
`category` (`burn`, `exchange`, `locker`, `pool`, `protocol`, or `vault`), and
an `evidenceSource`. Invalid, incomplete, stale, or future-dated registries do
not unlock concentration or bot safety. Applied exclusion provenance and totals
are shared by holder, token-security, and pool-risk projections so consumers do
not receive contradictory completeness claims.
`/internal/tokens/:mint/security` reports snapshot-backed authority/extension
findings. `/internal/wallets/:address/performance` reports exact rational cost
basis/PnL only for decoded swaps carrying an explicit user address. The
`/internal/wallets/:address/profile` contract exposes evidence-backed activity
signals but never labels a wallet “smart money” without complete history, USD
references, funding-graph, and sybil evidence.

Production objectives and alert rules are documented in `docs/SLO.md`.
`ops/backup.sh` creates checksummed PostgreSQL, ClickHouse, Redis, local index,
and inbox archives and uploads them to the loopback SeaweedFS filer.
`ops/fetch-backup.sh` retrieves and verifies a known archive without enumerating
storage. `ops/restore.sh` verifies checksums and requires the explicit
`--confirm-empty-target` flag because it replaces database and local state.

Nominal USD references are computed locally from fresh finalized swaps directly
against canonical mainnet USDC or through wrapped SOL. Each venue is
time-weighted over its retained fresh observations. An edge with at least three
independent venues uses their exact rational median so one venue outlier cannot
dominate; thinner edges use the mean and retain explicit manipulation-coverage
missing signals. Paths with fewer than two venues also retain a
`multi_venue_twap` missing signal. Amounts and decimal normalization remain
exact rational integers. These references are suitable for display/research
only: bot safety remains false until an independent USDC depeg reference and
manipulation adjustment are self-hosted.

All JSON responses include `X-API-Version: 1`. Transfer records expose exact
`amountRaw` string values plus nullable `decimals` and `amountUiString`; consumers
must not use binary floating-point values for balances or trading decisions.
The JSON-RPC endpoint intentionally exposes only read-only index methods; validator
or transaction-submission methods return JSON-RPC `Method not found`.
Each decoded swap has a deterministic `swapId` of `<signature>:<eventIndex>`.
This preserves legitimate multi-hop/multi-event transactions while giving REST
cursors and downstream consumers a stable deduplication key. When a trusted
validator-side `dexEvents` sidecar covers a transaction and protocol, the local
log decoder does not emit the same protocol events a second time.
When API keys are configured, all `/api/*` and `/rpc` calls require `X-API-Key`
or `Authorization: Bearer`. Keys are compared as SHA-256 digests and are never
returned or logged. Public binding is refused unless at least one key is configured.
WebSocket clients receive `ready`, then ordered `block_indexed` or
`block_replaced` events after atomic index persistence. Confirmed blocks are
preserved as provisional evidence and promoted with `block_finalized` when the
matching finalized inbox record arrives; a confirmed fork can never downgrade a
finalized slot. Promotion atomically upgrades provenance on transactions,
instructions, transfers, token-balance changes, token-account projections,
swaps, and program events. Supply the last consumed
sequence as `cursor` to replay retained events. An expired cursor produces
`resync_required`; clients must rebuild from REST. Heartbeat pings and bounded
socket buffers reject any single oversized frame and evict stalled consumers
before the next write would exceed the cap. When API keys are enabled, WebSocket
clients must present the key as an HTTP authorization or `X-API-Key` header.
Browser clients can request subprotocols `indexer.v1` and
`bearer.<base64url-api-key>`; the server negotiates only `indexer.v1`.

Use `topic=swaps` to receive compact block-scoped swap batches and optionally
filter them by mint, pool/curve, or protocol. The original block event sequence
is retained, so the same cursor resumes filtered and unfiltered feeds. PubSub
notifications are processed through one ordered queue before gap detection and
atomic persistence, preventing concurrent notifications from racing the durable
cursor.

Use `topic=lifecycle` to receive compact pool/curve creation, completion, and
migration batches. Filters accept mint, source or destination pool, source or
destination protocol, and exact `eventType`, while retaining the same durable
block cursor used by the other topics. Lifecycle records carry provenance on
both their initial observation and later finality-promotion event, allowing
consumers to replace provisional state deterministically. Fork replacements
emit filtered `revertedSwaps` and `revertedLifecycleEvents` tombstones carrying
the canonical replacement blockhash; consumers must remove those event IDs.

“Trending” defaults to a rolling one-hour window and ranks verified DEX swap
count, decoded unique traders, then locally indexed transfer count. It exposes
buy/sell activity and contributing protocols. It does not claim USD volume,
holder count, or risk. Those values cannot
be derived faithfully from generic block transfer instructions alone.

Transaction `preTokenBalances` and `postTokenBalances` are normalized into exact
balance changes, including accounts loaded through versioned address lookup
tables. The holder endpoint aggregates latest observed positive balances by
owner, but returns `coverage: "observed_changes_only"`, `complete: false`, and
`safeForAutomation: false`. A canonical account snapshot/backfill is required
before holder concentration can unlock trading-bot decisions.

Pool candles support 60, 300, 900, 3600, 14400, and 86400-second intervals.
Prices remain exact `quote_raw/base_raw` fractions and volumes remain separate
base/quote raw integer strings. Protocol events provide pair orientation for
Raydium CPMM/CLMM, PumpSwap, and Pump bonding curves; sidecars without authoritative
pair fields use a visibly labeled deterministic lexical fallback. No USD value
is inferred.

The Raydium CPMM mainnet program
`CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`. A validator-side decoder may
attach `dexEvents` matching Raydium's emitted `SwapEvent`, and the indexer also
decodes the canonical Anchor event directly from scoped program logs. It accepts
only events tied to successful transactions and stores every u64 as a decimal
string. Execution price is exposed as an exact raw numerator/denominator with
both mint decimals. It is not labeled as USD price. Unsupported programs fail
the whole input file instead of silently producing market data.

Raydium CLMM program `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`
`SwapEvent` logs are decoded with exact u64/u128 values, token-account-to-mint
resolution, transfer fees, post-swap sqrt price, liquidity, and tick. The event
does not contain vault reserves, so those fields remain `null` with
`reserveTiming: "unavailable"`; liquidity and routing safety must not treat the
CLMM liquidity scalar as spendable token reserves.
Validator-provided CLMM sidecars pass the same strict contract: u128 bounds,
i32 tick, boolean direction, u64 fees, required user identity, and explicitly
unavailable event reserves are validated before any market record is accepted.
Run `npm run snapshot:clmm-pools -- <POOL_ADDRESS...>` against the loopback
mainnet validator to capture the official PoolState header and both parsed token
vault balances. State and balance context slots are retained separately, stale
snapshots cannot replace newer evidence, and snapshots remain unsafe for route
execution until tick arrays and local simulation are available.
Liquidity risk reports snapshot age and fails closed with
`liquidity_state_stale` once the configured freshness threshold is exceeded.
Future-dated block, exporter, market, and pool-snapshot timestamps are treated
as clock-skew failures rather than being clamped to zero age.

PumpSwap program `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA` is also
supported. Its official Anchor `BuyEvent` and `SellEvent` logs normalize into
the same swap contract with `protocol: "pump-swap"`, explicit buy/sell side,
directional mints, exact amounts and fees, and reserves marked
`reserveTiming: "after"`. Pump.fun bonding-curve `TradeEvent` logs are decoded
separately as `protocol: "pump-bonding-curve"` with their curve address, quote
mint/amount, user and creator, fee components, real/virtual reserves, and
mayhem-mode evidence. Reported curve reserves use `reserveTiming: "reported"`;
they are never mislabeled as PumpSwap AMM reserves.

## Operational safety

- Bind defaults to loopback.
- No secrets are accepted or required.
- Validator HTTP and WebSocket clients reject non-loopback endpoints; no
  third-party provider traffic is permitted by this build.
- Writes use temporary-file plus atomic rename.
- Failed transactions are indexed but never emitted as successful transfers.
- Slot replacement removes orphaned derived records.
- Input errors are isolated per file and returned in cycle diagnostics.
- Multi-record inbox files are batch-atomic: every record is parsed before mutation, and a later apply failure rolls back canonical state, cycle counters, and queued WebSocket events before durable dead-lettering.
- Dead letters remain as audit evidence but are marked resolved when the exact file fingerprint later receives a successful parser-v2 checkpoint; a repeated failure reopens the record.
- `npm run reconcile:dead-letters` previews historical dead letters eligible for exact-checkpoint reconciliation. Use `-- --confirm` only after reviewing the IDs; the command never retries or rewrites raw events.
- Health returns HTTP 503 with `empty` until a block is indexed, and HTTP 503 with `stale` when the newest canonical block timestamp is old. Importing historical fixtures cannot produce a false healthy state.
- `npm run retention:inbox` previews old raw inbox files eligible for deletion. It only selects parser-v2 checkpointed files whose current SHA-256 matches both the checkpoint and the last successfully uploaded self-hosted archive receipt, and excludes unresolved dead letters. `ops/backup.sh` installs that receipt only after the manifest and archive uploads succeed. Rerun with `-- --confirm-delete`; deletion is never implicit.
- `npm run retention:audit` validates every JSONL audit record and previews tenant-aware expiration. Rerun with `-- --confirm-delete` only after review; the retained log is replaced atomically and malformed input blocks all deletion.
- `npm run sync:commercial` validates the complete retained audit log, aggregates tenant usage by UTC hour/route/status class, and transactionally upserts the reviewed hash-only registry and usage into PostgreSQL. It invokes `psql` with fixed arguments and inherited `PG*`/`.pgpass` configuration so credentials never appear in process arguments or output.
- Health also fails closed with `chain_conflict` when an indexed block's previous hash disagrees with its indexed parent. `/api/stats` exposes the bounded conflict evidence.
- The bot-readiness endpoint returns HTTP 503 until canonical finalized provenance, decoded swaps, liquidity, prices, and risk signals are all available and the index is healthy.
- Pool risk currently measures data quality only. Even mature two-way history remains blocked for automated trading until mint/freeze authority, holder concentration, and manipulation evidence are indexed.
