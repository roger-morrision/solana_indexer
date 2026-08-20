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

`npm run health:public-rpc` uses the Solana public endpoint only for genesis and
health checks. `npm run export:external -- --emergency-public --once` is the only
public-RPC backfill mode; it is forced to one cycle and at most four slots. It
must not be used as the normal ingestion lane. Use a new `inbox-mainnet` and
mainnet data/status files so private-chain evidence can never be mixed in.

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
finalized copies canonically promote or replace them. The stream persists every
notification atomically into `inbox/`, repairs bounded slot gaps with local
`getBlock`, resumes from durable status after restart, reconnects with bounded
exponential backoff, and records finalization lag, reconnects, decode errors,
repairs, and skipped slots. Keep `npm run export` available as the finalized
HTTP backfill/recovery process, but do not run both writers against the same
inbox unless operationally coordinated.

The exporter rejects HTTPS and every non-loopback address. It reads finalized blocks only from `http://127.0.0.1:8899`, writes them atomically to `inbox/`, and checkpoints its last exported slot. This is self-owned local RPC traffic, not a third-party provider.
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

Configuration:

| Variable | Default | Purpose |
|---|---:|---|
| `INDEXER_INBOX` | `inbox` | Completed block files |
| `INDEXER_DATA_FILE` | `data/index.json` | Atomic local index snapshot |
| `EXPORTER_STATUS_FILE` | `data/exporter-status.json` | Atomic durable exporter health and skipped-slot evidence |
| `ACCOUNT_SNAPSHOT_FILE` | `data/account-snapshot.json` | Atomic finalized mint/account snapshot evidence |
| `INDEXER_HOST` | `127.0.0.1` | API bind address |
| `INDEXER_PORT` | `8787` | API port |
| `INDEXER_POLL_MS` | `1000` | Inbox scan interval |
| `INDEXER_STALE_AFTER_MS` | `120000` | Maximum age before health fails |
| `INDEXER_MAX_TRANSACTIONS` | `250000` | Retention cap |
| `INDEXER_RETENTION_SECONDS` | `604800` | Indexed-time retention window (seven days) |
| `INDEXER_API_KEYS` | empty | Comma-separated API keys; mandatory for non-loopback binding |
| `INDEXER_RATE_LIMIT_PER_MINUTE` | `600` | Per-key or per-socket-address request ceiling |
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
- `GET /api/v1/candles/:pool?interval=60&limit=300` (exact direction-stable OHLCV)
- `GET /api/v1/token-account/:address` (latest observed on-chain token balance)
- `GET /api/v1/holders/:mint?limit=100` (finalized snapshot coverage when available; exclusions disclosed)
- `GET /api/v1/bot/readiness?pool=:pool` (targeted fail-closed capability gate)
- `GET /api/v1/risk/:pool` (data-quality evidence, not a rug/security oracle)
- `GET /api/v1/ingestion` (durable exporter lag and skipped-slot evidence)
- `POST /rpc` (`getIndexerHealth`, `getIndexerStats`, `getIndexedTransaction` only)
- `WS /ws?cursor=<sequence>&topic=blocks|swaps&mint=&pool=&protocol=` (filtered persisted events with replay/resume)

Frontend, AI, and paper-bot services should prefer the authenticated internal
contracts: `/internal/tokens/:mint` and its `market`, `security`, `holders`,
`trades`, `ohlcv`, `liquidity`, and `executable-depth` views;
`/internal/evidence/:mint`; `/internal/trending`; `/internal/new-pairs`;
`/internal/candidates`; `/internal/wallets/:address`; `/internal/feed/health`;
and `/internal/feed/gaps`. Evidence responses include stable schema versions,
provenance, freshness, confidence, and explicit missing fields. The program
registry is available at `/internal/registry`.

Run `npm run snapshot:accounts -- <mint> [mint...]` against the loopback mainnet
RPC to capture canonical finalized mint authorities, Token-2022 extensions, and
all SPL/Token-2022 accounts for selected mints. With no arguments it uses mints
already discovered by the index. This is intentionally bounded because
`getProgramAccounts` is expensive. Holder concentration remains unsafe for
automation until pool, burn, locker, and exchange exclusions are authoritative.
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
against canonical mainnet USDC or through wrapped SOL. Amounts and decimal
normalization remain exact rational integers. These references are suitable for
display/research only: bot safety remains false until an independent USDC depeg
reference, multi-venue TWAP, and manipulation adjustment are self-hosted.

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
promoted with `block_finalized`; a confirmed fork can never downgrade a finalized
slot. Supply the last consumed
sequence as `cursor` to replay retained events. An expired cursor produces
`resync_required`; clients must rebuild from REST. Heartbeat pings and bounded
socket buffers evict stalled consumers. When API keys are enabled, WebSocket
clients must present the key as an HTTP authorization or `X-API-Key` header.
Browser clients can request subprotocols `indexer.v1` and
`bearer.<base64url-api-key>`; the server negotiates only `indexer.v1`.

Use `topic=swaps` to receive compact block-scoped swap batches and optionally
filter them by mint, pool/curve, or protocol. The original block event sequence
is retained, so the same cursor resumes filtered and unfiltered feeds. PubSub
notifications are processed through one ordered queue before gap detection and
atomic persistence, preventing concurrent notifications from racing the durable
cursor.

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
Raydium CPMM, PumpSwap, and Pump bonding curves; sidecars without authoritative
pair fields use a visibly labeled deterministic lexical fallback. No USD value
is inferred.

The first supported decoder is Raydium CPMM mainnet program
`CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`. A validator-side decoder may
attach `dexEvents` matching Raydium's emitted `SwapEvent`, and the indexer also
decodes the canonical Anchor event directly from scoped program logs. It accepts
only events tied to successful transactions and stores every u64 as a decimal
string. Execution price is exposed as an exact raw numerator/denominator with
both mint decimals. It is not labeled as USD price. Unsupported programs fail
the whole input file instead of silently producing market data.

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
- Health returns HTTP 503 with `empty` until a block is indexed, and HTTP 503 with `stale` when the newest canonical block timestamp is old. Importing historical fixtures cannot produce a false healthy state.
- Health also fails closed with `chain_conflict` when an indexed block's previous hash disagrees with its indexed parent. `/api/stats` exposes the bounded conflict evidence.
- The bot-readiness endpoint returns HTTP 503 until canonical finalized provenance, decoded swaps, liquidity, prices, and risk signals are all available and the index is healthy.
- Pool risk currently measures data quality only. Even mature two-way history remains blocked for automated trading until mint/freeze authority, holder concentration, and manipulation evidence are indexed.
