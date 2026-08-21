#!/usr/bin/env bash
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run as root after reviewing the protected environment" >&2; exit 1; }
repo=/home/sol/solana-indexer
environment=/etc/solana-indexer-external.env
[[ -f "$repo/package.json" && -f "$repo/src/external-rpc.js" ]] || { echo "$repo is not the indexer repository" >&2; exit 1; }
[[ -f "$environment" ]] || { echo "Copy validator/external-rpc.env.example to $environment" >&2; exit 1; }
[[ "$(stat -c '%a' "$environment")" == 600 ]] || { echo "$environment must have mode 0600" >&2; exit 1; }
grep -q '^HELIUS_RPC_URL=https://mainnet.helius-rpc.com/' "$environment" || { echo "Missing approved Helius mainnet URL" >&2; exit 1; }
grep -q '^ALCHEMY_RPC_URL=https://solana-mainnet.g.alchemy.com/' "$environment" || { echo "Missing approved Alchemy mainnet URL" >&2; exit 1; }
install -d -m 0700 -o sol -g sol "$repo/inbox-mainnet" "$repo/data"
install -m 0644 "$repo/validator/solana-indexer-external-exporter.service" /etc/systemd/system/
install -m 0644 "$repo/validator/solana-indexer-external-api.service" /etc/systemd/system/
systemctl daemon-reload
echo "Units installed but not started. Run tests, then enable solana-indexer-external-exporter and solana-indexer-external-api."
