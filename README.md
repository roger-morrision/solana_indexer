# Self-hosted Solana indexer

A zero-dependency Node.js indexer for canonical Solana block JSON produced by infrastructure you operate. It performs **no outbound network requests** and has no hosted API, RPC, or WebSocket dependency.

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

## Self-hosted mainnet validator

The `validator/` directory contains a production-oriented, non-voting Agave RPC-node deployment kit:

- `preflight.ps1` refuses unsupported/undersized Windows hosts.
- `install-agave-ubuntu.sh` builds a pinned, reviewed Agave release from Anza's source.
- `run-mainnet-rpc.sh` binds RPC to loopback, enables transaction history and token account indexes, and keeps voting disabled.
- `agave-rpc.service` runs the node as the dedicated unprivileged `sol` user.

This host does not meet production requirements. Deploy these files to Ubuntu 24.04 bare metal with the required RAM, separate NVMe volumes, public IPv4, and bandwidth. Review the release tag and mainnet parameters before launch; do not store a voting withdrawer key on the node.

After the local node has caught up, run the loopback-only bridge and indexer in separate processes:

```powershell
npm run export
npm start
```

The exporter rejects HTTPS and every non-loopback address. It reads finalized blocks only from `http://127.0.0.1:8899`, writes them atomically to `inbox/`, and checkpoints its last exported slot. This is self-owned local RPC traffic, not a third-party provider.
Each exported block carries source, finalized commitment, observation time, validator tip, and export lag. Export-cycle diagnostics include the bounded skipped-slot list; skipped Solana slots are evidence, not treated as missing blocks.

### Minimal Docker development validator

Docker Desktop can run the isolated `solana-test-validator` setup under `validator/dev`. It is a private development chain, not mainnet, devnet, or testnet, and contains no historical production data.

```powershell
./validator/dev/start.ps1
npm run export
npm start
```

The container uses Agave `v3.1.14`, four CPUs, a 4 GB memory ceiling, bounded local logs, a disposable named ledger volume, and RPC published only on `127.0.0.1:8899`. Agave requires `io_uring`, so this one service uses Docker's unconfined seccomp profile; Linux capabilities are still fully dropped and `no-new-privileges` remains enabled. Run `stop.ps1` to stop it without losing the ledger or `reset.ps1` to remove the disposable ledger.

Configuration:

| Variable | Default | Purpose |
|---|---:|---|
| `INDEXER_INBOX` | `inbox` | Completed block files |
| `INDEXER_DATA_FILE` | `data/index.json` | Atomic local index snapshot |
| `EXPORTER_STATUS_FILE` | `data/exporter-status.json` | Atomic durable exporter health and skipped-slot evidence |
| `INDEXER_HOST` | `127.0.0.1` | API bind address |
| `INDEXER_PORT` | `8787` | API port |
| `INDEXER_POLL_MS` | `1000` | Inbox scan interval |
| `INDEXER_STALE_AFTER_MS` | `120000` | Maximum age before health fails |
| `INDEXER_MAX_TRANSACTIONS` | `250000` | Retention cap |

## API

- `GET /api/health`
- `GET /api/stats`
- `GET /api/blocks?limit=100`
- `GET /api/transactions?limit=100`
- `GET /api/transaction/:signature`
- `GET /api/account/:address?limit=100`
- `GET /api/mint/:mint?limit=100`
- `GET /api/trending?limit=50`
- `GET /api/v1/blocks?limit=100&cursor=...` (stable response envelope)
- `GET /api/v1/transactions?limit=100&cursor=...` (stable response envelope)
- `GET /api/v1/bot/readiness` (fail-closed capability gate)
- `GET /api/v1/ingestion` (durable exporter lag and skipped-slot evidence)
- `POST /rpc` (`getIndexerHealth`, `getIndexerStats`, `getIndexedTransaction` only)

All JSON responses include `X-API-Version: 1`. Transfer records expose exact
`amountRaw` string values plus nullable `decimals` and `amountUiString`; consumers
must not use binary floating-point values for balances or trading decisions.
The JSON-RPC endpoint intentionally exposes only read-only index methods; validator
or transaction-submission methods return JSON-RPC `Method not found`.

“Trending” is explicitly transfer-activity ranking from locally indexed evidence. It does not claim price, liquidity, USD volume, holder count, or swap direction. Those values cannot be derived faithfully from generic block transfer instructions alone. DEX-specific decoders can be added at the parser boundary without introducing a hosted service.

## Operational safety

- Bind defaults to loopback.
- No secrets are accepted or required.
- No outbound HTTP or WebSocket code exists.
- Writes use temporary-file plus atomic rename.
- Failed transactions are indexed but never emitted as successful transfers.
- Slot replacement removes orphaned derived records.
- Input errors are isolated per file and returned in cycle diagnostics.
- Health returns HTTP 503 with `empty` until a block is indexed, and HTTP 503 with `stale` when the newest canonical block timestamp is old. Importing historical fixtures cannot produce a false healthy state.
- Health also fails closed with `chain_conflict` when an indexed block's previous hash disagrees with its indexed parent. `/api/stats` exposes the bounded conflict evidence.
- The bot-readiness endpoint returns HTTP 503 until canonical finalized provenance, decoded swaps, liquidity, prices, and risk signals are all available and the index is healthy.
