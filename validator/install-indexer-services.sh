#!/usr/bin/env bash
set -euo pipefail
if [[ "$(id -u)" -ne 0 ]]; then echo "Run as root after reviewing every environment value" >&2; exit 1; fi
repo=/home/sol/solana-indexer
[[ -f "$repo/package.json" ]] || { echo "$repo is not the indexer repository" >&2; exit 1; }
[[ -f /etc/agave-validator.env ]] || { echo "Create /etc/agave-validator.env first" >&2; exit 1; }
[[ -f /etc/solana-indexer.env ]] || { echo "Copy and edit validator/solana-indexer.env.example as /etc/solana-indexer.env with mode 0600" >&2; exit 1; }
[[ -f /etc/solana-indexer-stream.env ]] || { echo "Copy validator/solana-indexer-stream.env.example as /etc/solana-indexer-stream.env with mode 0640 and group sol" >&2; exit 1; }
install -d -m 0700 -o sol -g sol "$repo/inbox" "$repo/data"
install -m 0644 "$repo/validator/agave-rpc.service" /etc/systemd/system/agave-validator.service
install -m 0644 "$repo/validator/solana-indexer-stream.service" /etc/systemd/system/solana-indexer-stream.service
install -m 0644 "$repo/validator/solana-indexer-api.service" /etc/systemd/system/solana-indexer-api.service
install -m 0644 "$repo/validator/solana-indexer-warehouse-sync.service" /etc/systemd/system/solana-indexer-warehouse-sync.service
install -m 0644 "$repo/validator/solana-indexer-warehouse-sync.timer" /etc/systemd/system/solana-indexer-warehouse-sync.timer
install -m 0644 "$repo/validator/solana-indexer-commercial-sync.service" /etc/systemd/system/solana-indexer-commercial-sync.service
install -m 0644 "$repo/validator/solana-indexer-commercial-sync.timer" /etc/systemd/system/solana-indexer-commercial-sync.timer
install -m 0644 "$repo/validator/solana-indexer-operational-worker.service" /etc/systemd/system/solana-indexer-operational-worker.service
install -m 0644 "$repo/validator/solana-indexer-operational-worker.timer" /etc/systemd/system/solana-indexer-operational-worker.timer
systemctl daemon-reload
echo "Units installed but not started. As user sol, run: cd $repo && npm test && npm run verify:mainnet"
echo "Then enable: systemctl enable --now agave-validator solana-indexer-stream solana-indexer-api"
echo "After PostgreSQL and ClickHouse health checks pass, enable: systemctl enable --now solana-indexer-warehouse-sync.timer"
echo "After PostgreSQL tenant/usage sync succeeds manually, enable: systemctl enable --now solana-indexer-commercial-sync.timer"
echo "After a snapshot job succeeds manually, enable: systemctl enable --now solana-indexer-operational-worker.timer"
