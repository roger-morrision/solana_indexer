#!/usr/bin/env bash
set -euo pipefail
: "${IDENTITY_KEYPAIR:?Set IDENTITY_KEYPAIR}"
: "${LEDGER_DIR:?Set LEDGER_DIR to dedicated NVMe mount}"
: "${ACCOUNTS_DIR:?Set ACCOUNTS_DIR to dedicated NVMe mount}"
: "${SNAPSHOTS_DIR:?Set SNAPSHOTS_DIR to dedicated NVMe mount}"
for dir in "$LEDGER_DIR" "$ACCOUNTS_DIR" "$SNAPSHOTS_DIR"; do [[ -d "$dir" && -w "$dir" ]] || { echo "$dir must exist and be writable" >&2; exit 1; }; done
exec "$HOME/bin/agave-validator" \
  --identity "$IDENTITY_KEYPAIR" \
  --entrypoint entrypoint.mainnet-beta.solana.com:8001 \
  --entrypoint entrypoint2.mainnet-beta.solana.com:8001 \
  --entrypoint entrypoint3.mainnet-beta.solana.com:8001 \
  --expected-genesis-hash 5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2dG \
  --ledger "$LEDGER_DIR" \
  --accounts "$ACCOUNTS_DIR" \
  --snapshots "$SNAPSHOTS_DIR" \
  --rpc-bind-address 127.0.0.1 \
  --rpc-port 8899 \
  --private-rpc \
  --full-rpc-api \
  --no-voting \
  --enable-rpc-transaction-history \
  --rpc-pubsub-enable-block-subscription \
  --enable-cpi-and-log-storage \
  --account-index program-id \
  --account-index spl-token-mint \
  --account-index spl-token-owner \
  --dynamic-port-range 8000-8030 \
  --limit-ledger-size 500000000 \
  --log "$HOME/agave-validator.log"
