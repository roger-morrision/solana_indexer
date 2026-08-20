#!/usr/bin/env bash
set -euo pipefail
container_ip="$(hostname -i | awk '{print $1}')"
exec solana-test-validator \
  --ledger /ledger \
  --bind-address "$container_ip" \
  --rpc-port 8899 \
  --limit-ledger-size 10000 \
  --rpc-pubsub-notification-threads 0 \
  --quiet
