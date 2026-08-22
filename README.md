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

Token balance changes are emitted only from unique, in-range account indexes with
decimal-u64 amounts and canonical SPL/Token-2022 program, mint, owner, and u8
decimal identity. Pre/post omissions are merged, but conflicting identities,
duplicate indexes, numeric coercions, and u64 overflow are discarded per account
without aborting other valid facts in the block.

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
exporter requires every configured failover provider to independently validate mainnet genesis before ingestion, refreshes that verification on a bounded five-minute TTL, and rejects every non-genesis RPC call while complete current verification is absent. It uses bounded batches, opens a provider circuit
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
must be unique and commitment-bound, and superseded sockets cannot open or deliver into
the active queue. Each open/closed transition is serialized into the shared
health contract; a disconnected or gracefully stopped stream fails readiness immediately instead of
waiting for the status freshness window. The stream persists every
notification atomically into `inbox/`, repairs bounded slot gaps with local
`getBlocks`-verified `getBlock` reads, resumes from durable status after restart, reconnects with bounded
exponential backoff, and records finalization lag, reconnects, decode errors,
repairs, skipped slots, and the exact active private-node source. Keep `npm run export` available as the finalized
HTTP backfill/recovery process, but do not run both writers against the same
inbox unless operationally coordinated.

The exporter rejects HTTPS and every non-loopback address. Every reusable local RPC client and pool rejects data calls until its endpoint set has returned one complete consistent verified genesis identity. It reads finalized blocks only from the configured private endpoints, strictly correlates each JSON-RPC version and response ID, writes blocks atomically to `inbox/`, and checkpoints its last exported slot. This is self-owned local RPC traffic, not a third-party provider.
Each exported block carries source, finalized commitment, observation time, validator tip, and export lag. Export-cycle diagnostics include the bounded skipped-slot list; skipped Solana slots are evidence, not treated as missing blocks.
Ingestion rejects malformed provenance timestamps and network identities, unsafe or regressing source tips, negative lags, and tip/lag combinations that do not exactly match the block slot. Verified producers bind every block artifact to their genesis hash. Legacy inputs may omit provenance and remain explicitly `unknown`, but missing or non-mainnet block identity fails index health and bot readiness; malformed supplied evidence is never silently downgraded.

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
ClickHouse client acknowledges the batch. It then probes ClickHouse canonical
events, the PostgreSQL ingestion checkpoint, and the Redis hot-state pointer.
It then reconciles distinct canonical event/fact identities plus PostgreSQL
token and Redis pool/token counts against compatibility state. Only exact
three-sink sequence and content agreement permits the atomic local 0600
checkpoint to advance. Legacy or sequence-only checkpoints fail health closed.
Retries are idempotent by `(chain, sequence)`, and the worker
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

`solana-indexer-commercial-sync.timer` similarly runs the idempotent tenant,
key-rotation and hourly-usage PostgreSQL synchronization every minute. The
installer never enables it automatically; operators must first validate the
tenant registry, audit file permissions, PostgreSQL credentials and one manual
`npm run sync:commercial` execution.

Configuration:

| Variable | Default | Purpose |
|---|---:|---|
| `INDEXER_INBOX` | `inbox` | Completed block files |
| `INDEXER_DATA_FILE` | `data/index.json` | Atomic local index snapshot |
| `INDEXER_WAREHOUSE_CHECKPOINT_FILE` | `data/warehouse-checkpoint.json` | Atomic version-2 mainnet/genesis-bound checkpoint advanced only after ClickHouse, PostgreSQL, and Redis reconcile canonical state |
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
| `INDEXER_OPERATIONAL_JOB_LEASE_SECONDS` | `300` | PostgreSQL snapshot-job lease duration |
| `INDEXER_OPERATIONAL_JOB_MAX_ATTEMPTS` | `5` | Terminal failure threshold for snapshot jobs |
| `INDEXER_OPERATIONAL_JOB_BACKOFF_SECONDS` | `30` | Initial exponential snapshot-job retry delay |
| `EXPORTER_STATUS_FILE` | `data/exporter-status.json` | Atomic durable exporter health and skipped-slot evidence |
| `ACCOUNT_SNAPSHOT_FILE` | `data/account-snapshot.json` | Atomic mint/holder evidence requiring one exact finalized RPC context and canonical token-program identities |
| `HOLDER_EXCLUSIONS_FILE` | unset | Optional reviewed mainnet exclusion registry; concentration remains unassessable unless coverage for the mint is complete and fresh |
| `CLMM_POOL_SNAPSHOT_FILE` | `data/clmm-pool-snapshot.json` | Atomic finalized Raydium CLMM pool/vault evidence |
| `ORCA_POOL_SNAPSHOT_FILE` | `data/orca-pool-snapshot.json` | Atomic finalized Orca Whirlpool state/vault evidence |
| `METEORA_DLMM_POOL_SNAPSHOT_FILE` | `data/meteora-dlmm-pool-snapshot.json` | Atomic finalized Meteora DLMM pair, vault, and complete bin-array evidence |
| `CLMM_TICK_ARRAYS_JSON` | unset | Legacy compatibility input for library callers; the production snapshot command discovers every pool-bound Raydium tick array and bitmap extension at one finalized program-account context and fails if bitmap coverage is incomplete |
| `CLMM_BITMAP_EXTENSIONS_JSON` | unset | Optional JSON map of Raydium CLMM pool addresses to unique overflow bitmap-extension addresses; captures pool-bound finalized raw segments without claiming executable coverage |
| `INDEXER_HOST` | `127.0.0.1` | API bind address |
| `INDEXER_PORT` | `8787` | API port |
| `INDEXER_POLL_MS` | `1000` | Inbox scan interval |
| `INDEXER_STALE_AFTER_MS` | `120000` | Maximum age before health fails |
| `INDEXER_MAX_EXPORT_LAG_SLOTS` | `512` | Maximum finalized exporter lag before ingestion fails closed |
| `INDEXER_BACKUP_STATUS_FILE` | `data/backup-status.json` | Content-bound evidence installed only after a complete self-hosted backup upload |
| `INDEXER_BACKUP_MAXIMUM_AGE_SECONDS` | `86400` | Maximum completed-backup age before the RPO health contract fails |
| `INDEXER_RECOVERY_REPORT_FILE` | `data/recovery-report.json` | Latest exclusively created isolated recovery qualification selected for monitoring |
| `INDEXER_RECOVERY_MAXIMUM_AGE_SECONDS` | `7776000` | Maximum qualification age (90 days) before the quarterly rehearsal contract fails |
| `INDEXER_MAX_TRANSACTIONS` | `250000` | Retention cap |
| `INDEXER_RETENTION_SECONDS` | `604800` | Indexed-time retention window (seven days) |
| `USD_DEPEG_REFERENCE_FILE` | unset | Reviewed, expiring exact-rational finalized independent on-chain USDC/USD evidence |
| `USDC_ORACLE_RELOAD_MS` | `5000` | Fail-closed live reload interval for refreshed USDC/USD evidence |
| `USDC_MAX_DEVIATION_BASIS_POINTS` | `200` | Maximum accepted independent USDC/USD deviation before automation fails closed |
| `INDEXER_API_KEYS` | empty | Comma-separated API keys; mandatory for non-loopback binding |
| `INDEXER_RATE_LIMIT_PER_MINUTE` | `600` | Per-key or per-socket-address request ceiling |
| `INDEXER_AUDIT_LOG_FILE` | unset | Append-only redacted JSONL API audit sink; mandatory for non-loopback binding |
| `INDEXER_AUDIT_RETENTION_DAYS` | `30` | Default validated audit retention; tenant plans may override it |
| `INDEXER_API_TENANTS_FILE` | unset | Reviewed hash-only tenant/key registry with rotation windows and plan quotas |
| `INDEXER_WS_HEARTBEAT_MS` | `30000` | WebSocket ping interval |
| `INDEXER_WS_MAX_BUFFERED_BYTES` | `1048576` | Slow-consumer eviction threshold |
| `LOCAL_VALIDATOR_WS` | `ws://127.0.0.1:8900` | Loopback-only Agave PubSub endpoint |
| `LOCAL_VALIDATOR_WSS` | unset | Comma-separated 2-4 unique loopback PubSub endpoints. Overrides `LOCAL_VALIDATOR_WS` and requires the same number of verified `LOCAL_VALIDATOR_RPCS`. |
| `LOCAL_VALIDATOR_RPC` | `http://127.0.0.1:8899` | Loopback-only gap-repair RPC endpoint |
| `LOCAL_VALIDATOR_RPCS` | unset | Comma-separated 2-4 unique loopback Agave RPC endpoints. Overrides `LOCAL_VALIDATOR_RPC`; every node must pass the configured genesis check before failover is enabled. |
| `LOCAL_RPC_FAILURE_THRESHOLD` | `3` | Consecutive private-node failures before its circuit opens |
| `LOCAL_RPC_COOLDOWN_MS` | `30000` | Private-node circuit cooldown; bounded `Retry-After` takes precedence for HTTP 429 and 503 |
| `INDEXER_STREAM_RECONNECT_MIN_MS` | `500` | Initial reconnect backoff |
| `INDEXER_STREAM_RECONNECT_MAX_MS` | `30000` | Maximum reconnect backoff |

Explicit bounded integer settings, including exporter batch/poll and local-validator circuit controls, and the replay qualifier's `--blocks` argument must use canonical unsigned base-10 notation and remain within their documented bounds; invalid values stop startup instead of being clamped or replaced by defaults. `INDEXER_DISTRIBUTED_QUOTA`, when set, must be exactly `true` or `false`.

Snapshot CLIs accept `--artifact-only`. In this mode they atomically replace
their configured snapshot artifact without rewriting `index.json`; the
serialized inbox cycle validates and imports each artifact fingerprint exactly
once. Scheduled workers must use this mode to avoid cross-process lost updates.
Every snapshot artifact uses the shared crash-durable publication boundary
before the serialized indexer can observe it. Backup preflight evidence, inbox
manifests/archive receipts, verified compressed inbox copies, and confirmed
audit-retention replacements use the same boundary.
Append-only commercial audit records are serialized and synchronized before
their write is acknowledged internally, while recovery qualification reports
retain exclusive-create semantics and synchronize both contents and directory
metadata before they can authorize consumer activation.
SIGINT/SIGTERM shutdown stops index and oracle watchers, closes idle HTTP
connections, drains active requests, and flushes the durable audit queue before
the process exits; drain or flush failures produce a nonzero exit.
Imported pool and curve rows preserve every component slot and also expose an
`evidenceSlot` equal to the newest dependency context. Replacement requires
component-wise monotonic slots and snapshot WebSocket events use the effective
slot, so a newer mint/config/tick refresh advances without allowing older pool
or vault evidence to win merely because one auxiliary dependency is newer.

`npm run work:operational` atomically claims at most one PostgreSQL snapshot job
with `FOR UPDATE SKIP LOCKED`, recovers expired leases, validates the job type
and canonical address, and dispatches the matching CLI in artifact-only mode.
This includes mint-keyed Pump bonding-curve snapshot repairs, deduplicated per
mint and refreshed when their finalized account evidence becomes stale.
Active work renews its guarded lease every one-third of the lease duration;
renewal and completion refuse expired or reassigned ownership. Failures are
redacted, exponentially delayed and capped by the configured attempt limit.
The hardened one-hour-bounded service and timer are installed but never enabled
automatically.

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
- `GET /api/v1/blocks?limit=100&cursor=...` (stable scope-bound response envelope)
- `GET /api/v1/transactions?limit=100&cursor=...` (stable scope-bound response envelope)
- `GET /api/v1/swaps?mint=&pool=&protocol=&limit=100&cursor=...` (verified decoded swaps; cursors bind the exact filter scope)
- `GET /api/v1/tokens?limit=100&cursor=...` (compact canonical token catalog)
- `GET /api/v1/pools?protocol=&mint=&status=&limit=100&cursor=...` (compact lifecycle-aware pool catalog; `status` is `active`, `completed`, `migrated`, or `unknown`)
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
- `POST /rpc` (`getIndexerHealth`, `getIndexerStats`, `getIndexedBlock`, `getIndexedBlocks`, and `getIndexedTransaction` only; bounded batches of 100 calls, charged per logical call)
- `WS /ws?cursor=<sequence>&topic=blocks|swaps|lifecycle|snapshots&mint=&pool=&protocol=&eventType=` (filtered persisted events with replay/resume; account/off-chain metadata and every supported finalized pool/curve snapshot family use the isolated `snapshots` topic with strict filter-domain isolation)

REST `limit` parameters are strict base-10 integers from 1 through 500;
malformed, fractional, zero, negative, or oversized values return `400` rather
than being silently coerced.

Frontend, AI, and paper-bot services should prefer the authenticated internal
contracts: `/internal/tokens/:mint` and its `market`, `security`, `holders`,
`trades`, `ohlcv`, `liquidity`, and `executable-depth` views;
`/internal/evidence/:mint`; `/internal/trending`; `/internal/new-pairs`;
`/internal/candidates`; `/internal/wallets/:address` and its `performance`, `profile`, `funding`, and `funding-cluster` views; `/internal/pools/:address/quote` and the authenticated Raydium CLMM/CPMM, Orca, Meteora, and PumpSwap `POST /internal/pools/:address/prepare-swap`;
`/internal/feed/health`;
and `/internal/feed/gaps`. Evidence bundle v2 includes exact USD-reference and
USD-volume completeness plus per-pool risk outputs alongside stable schema
versions, provenance, freshness, confidence, and explicit missing fields. The program
registry is available at `/internal/registry`.

`GET /internal/tokens/:mint/executable-depth?side=<buy|sell>&amountRaw=<raw-units>`
provides an exact Pump bonding-curve quote only when the latest decoded
curve event is finalized and fresh and a coherent account snapshot proves zero
cashback/buyback rates. It applies the constant-product sell formula to finalized
curve reserves, or Pump's exact-spend buy formula when `side=buy`, and rounds
protocol and creator fees upward independently. `side` defaults to `sell` for
backward compatibility; other values return `400`.
The result is deliberately `executable: false` and `safeForAutomation: false`.
Authenticated `POST /internal/tokens/:mint/prepare-swap` accepts the same side,
independently obtains the current fail-closed route quote, and returns only an
unsigned Pump V2 simulation artifact. Pool preparation likewise independently
requotes persisted finalized evidence. Both contracts require explicit user and
token accounts, bounds, recent blockhash and pre-balances; neither signs nor
submits transactions.
`GET /internal/execution-policy` publishes the versioned external handoff
contract. Each preparation response embeds a hash-bound copy covering the
preparation, unsigned message and transaction identities, finalized simulation,
explicit signer approval, expiry/amount/slippage limits, external submission,
and finalized landed-message verification.
It returns a deterministic unsigned simulation preparation plus explicit next
steps; it never calls simulation, signs, or submits, and request bodies are
bounded to 512 KiB.
Fresh finalized curve, mint-owner, Global, and FeeConfig evidence now feeds an
exact unsigned Sell V2 and Buy Exact Quote In V2 builders with hash-bound local simulation preparation;
the quote, instruction, and simulation all bind the same finalized mint-evidence
slot and epoch. Legacy SPL routes fail closed when this evidence is absent, and
Pump Token-2022 routes remain unavailable until exact fee-transfer semantics are
verified rather than relying on the mint program ID alone.
bounded external signer approval, cryptographic signature verification, and
identical finalized landed-message confirmation are available and remain required.
The indexer never signs or submits. Other venues and fee modes return
an explicit unavailable response rather than an estimate.

Run `npm run snapshot:accounts -- <mint> [mint...]` against the loopback mainnet
RPC to capture canonical finalized mint authorities, Token-2022 extensions, and
all SPL/Token-2022 accounts for selected mints. The same exact finalized context
queries the official Metaplex Token Metadata program by its embedded mint field;
when present, the index validates owner and mint identity and decodes only the
stable on-chain name, symbol, URI, seller fee, and update-authority prefix. It
does not fetch or trust the URI's off-chain JSON during canonical snapshots. An
optional enrichment boundary separately enforces HTTPS, DNS-pinned public IPs,
no redirects, strict size/type/schema limits, and content hashes; its normalized
display fields remain explicitly untrusted and unsafe for automation. Imported
enrichment artifacts must bind the exact current Metaplex payload hash and are
projected separately into PostgreSQL metadata. The warehouse scheduler creates
deduplicated, leased `offchain_metadata_snapshot` jobs for missing or 24-hour
stale HTTPS enrichment; the operational worker emits the bounded artifact with
retry/backoff, and the normal importer revalidates its canonical hash binding.
With no arguments the account snapshot command uses mints
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
signals plus native and per-mint token funding-graph coverage, but never labels a
wallet “smart money” without complete history, USD references, reviewed entity
labels, and sybil evidence.
`/internal/wallets/:address/funding` reports exact lamport totals and
counterparties from successful explicit System Program `Transfer`,
`TransferWithSeed`, `CreateAccount`, `CreateAccountWithSeed`,
`CreateAccountAllowPrefund` (positive funding only), and `WithdrawNonceAccount`
instructions, plus Stake Program `Withdraw` instructions, in retained canonical
blocks. Account-creation facts preserve
exact allocated space, owner program, and optional base/seed. The view is
augmented with exact per-mint SPL/Token-2022 funding totals when parsed or exact
raw `Transfer`/`TransferChecked` instructions can be bound to source and
destination wallet owners through matching
transaction token-balance evidence. It also decodes the exact Token-2022
`TransferCheckedWithFee` wire format: sender
totals use the gross amount while recipient and cluster totals use the net
amount after the instruction-declared fee. Fee values are never inferred.
Static and versioned loaded account-key arrays preserve their original index
positions. A malformed key array rejects the transaction boundary, and an
instruction with an invalid program or account index is omitted in full, so a
missing key can never shift a later address into a transfer, balance, or
protocol account role. Inner-instruction groups must reference one unique valid
outer instruction and contain an instruction array; ambiguous trees reject the
block instead of producing consumer-specific interpretations. Transaction
signature vectors contain only non-empty strings, and fees are accepted only as
non-negative safe integers; neither field is coerced into canonical state.
Blocks require explicit non-empty current/parent hashes, a preceding safe parent
slot, a null or non-negative safe timestamp, and unique primary transaction
signatures before any fact is published.
Parsed transfer facts require an exact canonical token-program ID, decimal-u64
amount, non-empty mint identity, u8 decimals, and consistency with any
transaction token-balance mint/decimal evidence; conflicts are discarded.
Pre/post balance metadata is merged field-by-field: omitted post fields retain
validated pre-state identity, while conflicting mint, decimals, owner, or token
program invalidates that account's binding. Wallet owners are exposed only when
the balance evidence program exactly matches the transfer program.
The view is deliberately partial and
non-automation-safe: it does not infer funding from
balance deltas and does not claim coverage of zero-lamport allocation-only
prefund creation, unsupported token extensions/instructions, or history before
retention. `CreateAccountAllowPrefund` evidence can appear only after its
cluster feature is active and a transaction succeeds.
`/internal/wallets/:address/funding-cluster` deterministically lists other
retained-history recipients funded by the wallet's direct native-transfer
funders and, separately per mint, owner-bound SPL/Token-2022 funders. Token raw
amounts are never aggregated across mints. It exposes evidence—not a sybil
label—and keeps `classification: null`,
`complete: false`, and `safeForAutomation: false` until complete native/token
history and reviewed entity labels exist.

Production objectives and alert rules are documented in `docs/SLO.md`.
`npm run validate:replay-load` executes the checked-in 1,000-block canonical
replay workload, including duplicate idempotency, fork replacement, bounded
heap growth, state-digest, and throughput invariants. The script supplies its
fixture and workload size explicitly so the repository-defined validation
command is runnable without undocumented arguments.
`ops/backup.sh` creates checksummed PostgreSQL, ClickHouse, Redis, local index,
and inbox archives and uploads them to the loopback SeaweedFS filer. Only after
the complete archive and inbox receipt are uploaded and read-back SHA-256
verified does it create, upload, verify, and
install `data/backup-status.json`, binding the backup ID and hashes of both the
backup manifest and archive receipt. `/api/v1/backup` and Prometheus expose its
freshness without exposing the archive endpoint.
`ops/fetch-backup.sh` retrieves and verifies a known archive without enumerating
storage. `ops/restore.sh` verifies checksums and requires the explicit
`npm run validate:backup -- /absolute/backup-directory` preflight. The preflight
requires the complete fixed sink inventory, a version-3 `solana-mainnet`
manifest binding the
quiesced-writer assertion and exact byte length/SHA-256 of every artifact, an
inbox manifest bound to the same backup identity, a backup inside the 24-hour RPO,
safe tar headers, and both canonical index and exporter status members; it never
authorizes or performs a restore. `ops/restore.sh` repeats it before mutation and requires the explicit
`--confirm-empty-target` flag because it replaces database and local state. After
an isolated restore, `npm run validate:recovery` exclusively writes a report only
when the same backup manifest hash, canonical index health, zero-lag exact
warehouse convergence, healthy finalized exporter evidence, and the four-hour RTO all validate.
Point `INDEXER_RECOVERY_REPORT_FILE` at the latest retained report; `/api/v1/recovery`
and Prometheus validate its full qualification shape, exact duration, invariants,
and quarterly age without exposing sink credentials or report contents.
Malformed operational evidence never takes `/metrics` down or echoes its source
bytes: exporter, warehouse, backup, recovery, feed-health and gap contracts all
return redacted unhealthy evidence until an atomic valid replacement appears.
Dead-letter exception text is likewise normalized and capped before persistence;
provider URLs, credentials, token-shaped values, and private keys are never part
of the durable dead-letter or warehouse contract.
Dead-letter attempts also carry a bounded stage-aware retry schedule. Unchanged
bytes survive restarts without hot-looping, while changed evidence or a changed
parser/registry/state identity is eligible immediately.
`/api/stats` and `/metrics` report aggregate retry eligibility and bounded stage
counts without exposing dead-letter filenames, hashes, errors, or payloads.

Nominal USD references are computed locally from fresh finalized swaps directly
against canonical mainnet USDC or through wrapped SOL. Each venue is
time-weighted over its retained fresh observations and pools within one decoded
protocol are collapsed into one protocol-level rate. An edge with at least three
independent decoded protocols uses their exact rational median so extra pools on
one protocol cannot manufacture independence; thinner edges use the mean and retain explicit manipulation-coverage
missing signals. When direct-USDC and wrapped-SOL paths both exist, complete
paths are ranked deterministically by robust median coverage, minimum independent
protocol count, and hop count, so one weak direct pool cannot override stronger
indirect evidence. Paths with fewer than two venues also retain a
`multi_venue_twap` missing signal. Amounts and decimal normalization remain
exact rational integers. These references are suitable for display/research
only unless `USD_DEPEG_REFERENCE_FILE` supplies fresh finalized evidence from an
independent on-chain oracle. `npm run snapshot:usdc-oracle` can produce that
artifact from an operator-selected Pyth Solana Receiver `PriceUpdateV2` account
through the loopback validator. It requires `USDC_ORACLE_SOURCE_PROGRAM`,
`USDC_ORACLE_SOURCE_ACCOUNT`, and the reviewed 32-byte
`USDC_ORACLE_FEED_ID`; partially verified updates are rejected. The version-2
contract pins mainnet identity, source program/account/context slot, feed ID,
fully verified status, posted slot, publish time, confidence, raw account hash,
exact positive rational price, observation and publish-time-derived expiry.
Missing, malformed, future, expired, non-finalized, or over-limit
evidence fails bot readiness closed. Long-running serve/watch processes reload
the artifact every five seconds by default and clear previously loaded evidence
when a replacement is missing or malformed. The hardened disabled-by-default
`solana-indexer-usdc-oracle.timer` refreshes it every 30 seconds after an
operator reviews source identities and verifies a one-shot refresh. Robust three-venue price paths plus healthy
depeg evidence can unlock the price/volume component only; all other bot gates
still apply. Event-derived reserves may support liquidity analysis, but bot
readiness additionally requires a complete finalized pool snapshot whose two
mint accounts share a dependency-bound slot and epoch, whose protocol-specific
tick/config/global dependencies are complete, and whose token extensions match
an implemented execution path; absent, mismatched, or unsupported execution
evidence is reported as `execution_snapshot_incomplete`. Malformed persisted
execution fields fail closed with the same blocker instead of failing the risk
or bot-readiness request. The
repository does not synthesize or silently substitute this oracle evidence.

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
Audit rows carry bounded `quotaUnits`; legacy rows default to one unit, while RPC
batches are enforced and aggregated by logical call count without duplicating HTTP duration.
WebSocket clients receive `ready`, then ordered `block_indexed` or
`block_replaced` events after atomic index persistence. Confirmed blocks are
preserved as provisional evidence and promoted with `block_finalized` when the
matching finalized inbox record arrives; a confirmed fork can never downgrade a
finalized slot. Promotion atomically upgrades provenance on transactions,
instructions, transfers, token-balance changes, token-account projections,
swaps, and program events. Supply the last consumed
sequence as `cursor` to replay retained events. An expired cursor produces
`resync_required`; a cursor ahead of the server does the same. Both responses
carry explicit reasons plus retained/latest boundaries and terminate the socket
with policy-close code 1008, so clients cannot mix an invalid resume state with
live updates and must rebuild from REST. Heartbeat pings and bounded
socket buffers reject any single oversized frame and evict stalled consumers
before the next write would exceed the cap. Inbound control frames are parsed
across TCP boundaries, must be masked and protocol-valid, and are bounded by
`INDEXER_WS_MAX_INBOUND_BYTES` (default 4096); unsupported data frames and
malformed or oversized frames close with standard 1003, 1002, or 1009 codes.
Close frames require an allowed status code and a valid UTF-8 reason; invalid
codes or text terminate with 1002 or 1007 instead of being echoed.
`INDEXER_WS_MAX_CLIENTS` bounds admitted sockets globally (default 1000);
additional authenticated upgrades receive `503 websocket_capacity_exceeded`
until an existing socket closes. `/metrics` reports active clients, capacity
rejections, slow-consumer evictions, and protocol closes without client keys.
Graceful process shutdown stops subscriptions and closes upgraded sockets with
going-away code 1001 before draining HTTP and flushing the durable audit sink,
so a connected subscriber cannot indefinitely hold shutdown open.
HTTP drain time is bounded by `INDEXER_SHUTDOWN_TIMEOUT_MS` (default 30000);
after that deadline remaining connections are force-closed and audit work is
still flushed before process exit.

RPC JSON bodies are capped by `INDEXER_RPC_MAX_BODY_BYTES` (default 65536)
and execution-preparation bodies by `INDEXER_EXECUTION_MAX_BODY_BYTES`
(default 524288). Oversized declared or streamed payloads fail with a stable
HTTP 413 `payload_too_large` response before JSON dispatch.
Controlled request-validation failures retain bounded, stable detail. Unexpected
HTTP, quote, and execution-preparation exceptions expose only versioned reason
codes; their exception text is available solely through the optional redacted
internal diagnostic callback and is never reflected to API consumers.
The HTTP upgrade requires GET, canonical RFC 6455 Upgrade/Connection/version
headers, and an exactly 16-byte canonical Base64 nonce.
When API keys are enabled, WebSocket
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
Pool summaries normalize these events into `lifecycleState`: created and
migrated destination pools are `active`, completed curves are `completed`, and
source curves become `migrated` with the exact destination pool/protocol link.
The transition slot/index and commitment are rebuilt from canonical events, so
fork replacement removes stale source and destination state together.

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
Raydium CPMM/CLMM, Orca Whirlpools, Meteora DLMM, PumpSwap, and Pump bonding curves; sidecars without authoritative
pair fields use a visibly labeled deterministic lexical fallback. No USD value
is inferred.

Meteora DLMM mainnet `Swap` and `Swap2` events are decoded only when the
transaction also carries the matching official instruction version, pool/user,
ordered mint accounts, canonical token programs, program self-account, and
conflict-free mint decimals. Partial `Swap2` input is reported as
`amount_in - amount_left`; bin IDs, direction, fees, and fee-side flags remain
exact. DLMM event logs do not provide spendable bin liquidity. Run
`npm run snapshot:meteora-dlmm-pools -- <POOL_ADDRESS...>` to acquire an exact
finalized pair, vault, mint, bitmap, and complete 70-bin-per-array snapshot.
Snapshots are persisted and automatically repaired when missing, partial, or
stale. `GET /internal/pools/:address/quote` now provides exact-input,
analysis-only quotes for fresh finalized pools whose function mode is explicit.
The quote traverses MM, processed-order, and open-order liquidity in canonical
bin order; applies Q64 rounding, dynamic/base fees, fee-on-input/output modes,
protocol/limit-order splits, and finalized Token-2022 transfer fees. The two
official reward mints resolve `Undetermined` pools exactly: only pools with both
reward mints unset receive limit-order behavior. Missing reward evidence fails
closed. Transaction construction, simulation, signing, submission, and bot
execution remain unavailable.

The Raydium CPMM mainnet program
`CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`. A validator-side decoder may
attach `dexEvents` matching Raydium's emitted `SwapEvent`, and the indexer also
decodes the canonical Anchor event directly from scoped program logs. It accepts
only events tied to successful transactions and stores every u64 as a decimal
string. Execution price is exposed as an exact raw numerator/denominator with
both mint decimals. It is not labeled as USD price. Unsupported programs fail
the whole input file instead of silently producing market data.
The read-only CPMM snapshot boundary decodes the official packed PoolState and
AmmConfig layouts, advances finalized read barriers from pool state through fee
config to both vaults, and binds vault mint, token-program, and decimal identity.
Run `npm run snapshot:cpmm-pools -- <POOL_ADDRESS...>` against the loopback
mainnet validator; missing or stale discovered pools are also scheduled through
the leased operational worker and imported content-addressedly by index cycles.
Its exact-input quote subtracts accrued protocol, fund, and creator fees from
spendable reserves and mirrors ceiling-rounded fee-on-input/output behavior.
Account snapshots capture Token-2022 mint-extension transfer-fee schedules and
select the active fee at the exact finalized epoch/slot. The shared exact fee primitive implements
the program's ceiling-rounded basis-point fee, maximum cap, older/newer epoch
selection, and inverse gross-for-net calculation with u64 overflow checks.
Raydium CLMM/CPMM, Orca Whirlpool, PumpSwap, and Pump bonding-curve production snapshots now bind the relevant
token-program owners and both execution mint accounts to one finalized epoch/context at
or after all pool, tick,
configuration, and vault reads. Fee-only Raydium CLMM and CPMM Token-2022 quotes deduct the active
input fee before traversal and the active output fee afterward, then carry the
mint-evidence slot and epoch into unsigned simulation. Meteora DLMM `swap2`
also resolves finalized transfer-hook static, PDA, account-data, and pubkey-data
metadata against the direction-specific source, vault, authority, gross transfer
amount, and hash-bound source-account bytes, then encodes X/Y slices ahead of
bin arrays. Missing, stale, oversized, or hash-mismatched source bytes and every
other unimplemented extension fail closed; simulation advances its minimum
context to the newest bound source-account slot. The resolver can discover
data-derived dependencies incrementally and refetch the complete discovered set
at one monotonic finalized context before construction. The internal pool quote
endpoint advertises Meteora's offline unsigned construction and read-only
confirmation boundary while retaining mandatory simulation, external approval,
and out-of-scope submission blockers; it never labels a quote automation-safe.
Legacy-SPL Raydium CLMM and CPMM quotes require and propagate that same complete
finalized mint slot/epoch binding; execution construction rejects a quote whose
mint evidence differs from the selected pool snapshot, and warehouse repair
keeps incomplete snapshots out of the trusted quote surface.

The shared quote endpoint dispatches only snapshots whose canonical program ID
matches an implemented quote engine. Raydium CPMM/CLMM, PumpSwap, and legacy-SPL
Orca Whirlpools have exact-input analysis quotes. Orca quotes require complete
finalized pool/vault/tick-array evidence plus an explicit directional tick limit,
use the program's Q64.64 tick and millionths fee rounding, and expose
`executionBoundary: "analysis_only_quote"`; Token-2022 Orca pools and unknown
programs fail closed. The execution library can bind a fully consumed legacy-SPL
quote to the official legacy `swap` discriminator/account order, three contiguous
finalized tick arrays, the derived oracle PDA, an unsigned legacy transaction,
and exact input/output token-effect simulation policy. A content-addressed,
capped, expiring external-signer request then verifies every required Ed25519
signature and read-only finalized landed-message identity. The API still does
not return an executable route, and the indexer never signs or submits Orca
transactions.

Raydium CLMM program `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`
`SwapEvent` logs are decoded with exact u64/u128 values, token-account-to-mint
resolution, transfer fees, post-swap sqrt price, liquidity, and tick. The event
does not contain vault reserves, so those fields remain `null` with
`reserveTiming: "unavailable"`; liquidity and routing safety must not treat the
CLMM liquidity scalar as spendable token reserves.
Validator-provided CLMM sidecars pass the same strict contract: u128 bounds,
i32 tick, boolean direction, u64 fees, required user identity, and explicitly
unavailable event reserves are validated before any market record is accepted.
The official `create_pool` instruction also produces replayable lifecycle
evidence only when its exact payload, ordered mint pair, canonical token/system/rent
programs, pool/vault/observation/bitmap accounts, initial Q64.64 price, and open
time validate. Registry contract version 9 advertises this `pool_created` support.
Run `npm run snapshot:clmm-pools -- <POOL_ADDRESS...>` against the loopback
mainnet validator to capture the official PoolState header and both parsed token
vault balances. The production command discovers all pool-bound TickArrayState
accounts and the optional overflow bitmap extension with finalized filtered
program-account reads, rejects mixed contexts, foreign/duplicate arrays, and any
bitmap-to-account coverage gap, then advances the vault read barrier beyond that
evidence. State and balance context slots are retained separately and stale
snapshots cannot replace newer evidence. Snapshots remain unsafe for route
execution when dynamic AMM fees, fee-on-output AMM modes, incomplete mint
evidence, or unsupported Token-2022 extensions are present. Eligible fee-only
routes use the existing construction, effect-verification, external-signature,
and landed-confirmation boundary without indexer signing or submission.
The transaction-simulation boundary is deliberately separate: it accepts only
unsigned packet-sized base64 transactions, only through a loopback validator,
uses `simulateTransaction` with a finalized minimum context and replacement
blockhash, and emits a hash-bound receipt. Requested token-account effects are
mint-bound and must fall inside explicit signed raw-balance delta ranges. It never
signs or submits a transaction.
Before simulation, an optional message policy validates the required-signature
header, bounded static accounts and instructions, every compiled index, and a
required program allowlist. Version-0 address-table lookups fail closed until the
loaded addresses can be resolved independently.
An optional instruction policy additionally binds every instruction in order to
its exact program, account addresses, signer/writable roles, and payload bytes.
The deterministic legacy-message constructor merges duplicate account privileges,
orders static keys by Solana header class, enforces the packet limit, emits only
zero signature placeholders, and verifies its own output against that policy.
Raydium CLMM `swap_v2` manifests use the official account order and Anchor
discriminator, exact-input bounds, direction-specific vaults/mints, and only the
finalized snapshot tick arrays covering the quoted price-limit path.
A single preparation artifact now binds that manifest to its unsigned message,
minimum finalized context slot, program policy, and exact mint/account-specific
input debit plus bounded output credit expected from local simulation.
The prepared-simulation executor accepts only that artifact, delegates to the
loopback RPC boundary, and verifies receipt hashes, context, program identity,
and token effects before emitting a protocol-typed receipt.
A separate external-signer request gate requires an allowed fee payer, raw-input
and ceiling-rounded slippage caps, a recent matching simulation, and a short slot
expiry. It emits a content-addressed approval request but never signs or submits.
Returned signed bytes are accepted only when the complete serialized message is
unchanged and every required Ed25519 signature verifies against its message key;
the resulting signed artifact remains content-addressed and unsubmitted.
Read-only finalized confirmation revalidates and links the preparation, simulation,
signing request, signed artifact, landed signature, message, and slots into one
content-addressed audit record.
Finalized confirmation is also read-only: the landed signed transaction must be
successful at or after the simulation slot, and its serialized message hash must
match the unsigned simulation receipt exactly. Its first serialized signature
must also equal the RPC signature being confirmed. Signature bytes are intentionally
excluded from that comparison; transaction submission remains out of scope.
Liquidity risk reports snapshot age and fails closed with
`liquidity_state_stale` once the configured freshness threshold is exceeded.
Future-dated block, exporter, market, and pool-snapshot timestamps are treated
as clock-skew failures rather than being clamped to zero age.

Orca Whirlpools use the same fail-closed separation between event and account
evidence. `npm run snapshot:orca-pools -- <POOL_ADDRESS...>` decodes the official
fixed Whirlpool layout, verifies its program owner, and reads both embedded vaults
at a finalized context no older than the pool state. Each vault is bound to its
embedded mint, canonical SPL or Token-2022 owner, raw balance, and exact decimals;
legacy snapshots missing those identities or complete finalized mint evidence are
automatically repaired. It discovers official fixed
and dynamic tick arrays, requires one exact tick-array context per pool, validates
owner/discriminator/pool/start alignment and dynamic bitmap encoding, and retains
each initialized tick's exact signed liquidity plus fee/reward growth. Mint
mismatches, mixed order, duplicate targets, malformed layouts, and regressing or
conflicting snapshots are rejected before canonical state changes. Legacy-SPL
analysis quotes, unsigned construction, and local simulation bind the same mint
evidence slot and epoch; simulation cannot execute against an earlier context.
Token-2022 remains fail-closed.

PumpSwap program `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA` is also
supported. Its official Anchor `BuyEvent` and `SellEvent` logs normalize into
the same swap contract with `protocol: "pump-swap"`, explicit buy/sell side,
directional mints, exact amounts and fees, and reserves marked
`reserveTiming: "after"`. Pump.fun bonding-curve `TradeEvent` logs are decoded
separately as `protocol: "pump-bonding-curve"` with their curve address, quote
mint/amount, user and creator, fee components, real/virtual reserves, and
mayhem-mode evidence. Reported curve reserves use `reserveTiming: "reported"`;
they are never mislabeled as PumpSwap AMM reserves.

The bonding-curve snapshot boundary independently derives each current
`["bonding-curve", mint]` PDA and the singleton `["global"]` PDA, rejects wrong
owners, discriminators, lengths, flags and fee bounds, and advances a finalized
read barrier from curve state to Global configuration. It persists the current
115-byte `BondingCurve` serialized prefix (including the current 150-byte
zero-padded allocation) for reserves/completion/creator/mode/quote-mint and
the current 1,045-byte `Global` authority, fee-recipient, migration, mode and
quote-mint policy contract plus the Pump-program-keyed Fees `FeeConfig` without
relying on trade logs. Imported snapshots bind analysis-only sell quotes to
fresh finalized reserves, completion state and market-cap fee tiers; SOL/default
quote identity is normalized explicitly and unsupported cashback/buyback modes
fail closed. Run
`npm run snapshot:pump-bonding-curves -- <MINT_ADDRESS...>` against the loopback
mainnet validator.

The PumpSwap snapshot decoder additionally binds the official Anchor `Pool`
account discriminator and 261-byte field layout, including pool index, creator,
ordered mints/vaults, LP supply, coin creator, mayhem/cashback flags, and signed
virtual quote reserves. Both parsed vault identities and exact balances are read
at a finalized context no earlier than the pool state. The official Pump Fees
`FeeConfig` and PumpSwap `GlobalConfig` PDAs are independently derived,
owner/discriminator validated, decoded at their exact current layouts, and read
at a third finalized context no earlier than the vault and mint evidence.
Validated artifacts import content-addressedly into canonical `pump-swap`
constant-product pool state, reject conflicting evidence at the same finalized
slot, and emit the shared replayable warehouse/WebSocket sequence.
Run `npm run snapshot:pump-swap-pools -- <POOL_ADDRESS...>` against the loopback
validator. Missing or stale canonical PumpSwap pools are scheduled through the
same leased, bounded-retry artifact-only operational worker.
The fee foundation implements the official exact market-cap formula and
canonical/noncanonical tier selection with strict ascending thresholds and
basis-point bounds. Snapshots persist the flat, market-cap and stable fee tiers
with the exact configuration slot. Exact-input buy and sell quotes mirror the
official SDK's integer constant-product operations, one-unit buy adjustment,
and separately ceiling-rounded LP/protocol/creator fees. They require a fresh
coherent finalized snapshot plus complete finalized evidence for both canonical
SPL Token mint accounts. The quote carries that mint slot and epoch through the
official-ABI-bound buy/sell instruction and pins local simulation to the later
mint-evidence context. Token-2022 remains fail-closed until its multi-transfer
fee topology is verified. Direction-specific GlobalConfig
disable flags block quotes, as do active cashback and SOL buyback fee modes
until their exact on-chain accounting is locally verified.
Canonical identity is now independently derived from the official
`["pool-authority", baseMint]` Pump-program PDA and verified against Pump's
published example. Base-mint supply is fetched alongside both vault accounts at
the same finalized context, and snapshots reject nonpositive effective quote
reserves after applying the signed virtual-reserve adjustment.

## Operational safety

Yellowstone/Geyser activation is fail-closed. `npm run validate:geyser-abi --
--manifest /absolute/reviewed.json --agave /absolute/agave-validator --plugin
/absolute/libyellowstone_grpc_geyser.so` hashes the installed binaries, checks
the exact Agave version output, and requires a reviewed qualification recorded
within 30 days with at least 24 hours, 100,000 finalized blocks, a replay digest,
and bounded RSS slope. The checked-in example remains `blocked`; it is not an
approval to load the currently incompatible plugin.

Run `npm run validate:replay-load -- --blocks 10000`
for an explicitly synthetic, non-production replay drill through the real parser and
canonical store. It injects deterministic duplicates and same-slot replacements,
checks canonical counts, bounded correction retention and heap growth, and emits a
stable state digest plus measured throughput. The result is qualification evidence,
not live market data, and is never ingested by production commands.

- Bind defaults to loopback.
- No secrets are accepted or required.
- Validator HTTP and WebSocket clients reject non-loopback endpoints; no
  third-party provider traffic is permitted by this build.
- Canonical index, exporter/stream, inbox, cursor/status, and warehouse-receipt writes use collision-resistant temporary files, flush file contents before atomic rename, and synchronize parent-directory metadata on production filesystems. Same-process writes to one path are serialized while unrelated paths remain concurrent.
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
- The version-2 bot-readiness endpoint returns HTTP 503 until canonical finalized provenance, decoded swaps, liquidity, prices, and risk signals are all available, the index is healthy, durable exporter evidence is fresh, and the verified ClickHouse/PostgreSQL/Redis warehouse receipt is exactly converged at zero event lag. The operator warehouse endpoint may remain healthy within its configured bounded-lag tolerance, but that tolerance never unlocks automation.
- Pool risk contract `multi-signal-risk-v2` combines data quality, finalized liquidity, mint/freeze authority, complete holder exclusions, and manipulation evidence. Manipulation assessment requires at least 20 swaps plus 90% decoded-trader and canonical base-notional coverage, then fails automation closed on dominant count/notional, repeated base amounts, single-slot bursts, or concentrated round trips. Transaction construction, local simulation, and landed confirmation remain mandatory before execution.
