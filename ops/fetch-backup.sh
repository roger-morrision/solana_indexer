#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ -n "${1:-}" && "$1" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || { echo "Usage: fetch-backup.sh YYYYMMDDTHHMMSSZ" >&2; exit 2; }
stamp="$1"; archive_url="${SELF_HOSTED_ARCHIVE_URL:-http://127.0.0.1:8888/terminal-dex-backups}"; backup_root="${BACKUP_ROOT:-/var/backups/terminal-dex}"
[[ "$archive_url" =~ ^http://(127\.0\.0\.1|localhost|\[::1\])(:[0-9]+)?/ ]] || { echo "SELF_HOSTED_ARCHIVE_URL must be loopback HTTP" >&2; exit 1; }
[[ "$backup_root" == /* && "$backup_root" != "/" ]] || { echo "BACKUP_ROOT must be a dedicated absolute directory" >&2; exit 1; }
target="$backup_root/$stamp"; install -d -m 0700 "$target"
files=(postgres.dump clickhouse-canonical_events.native clickhouse-canonical_instructions.native clickhouse-canonical_swaps.native clickhouse-canonical_balance_changes.native clickhouse-canonical_native_transfers.native clickhouse-canonical_dead_letters.native clickhouse-canonical_candles.native redis.rdb indexer-state.tar inbox-manifest.json manifest.json SHA256SUMS)
for file in "${files[@]}"; do curl --fail --silent --show-error --retry 3 --retry-all-errors --connect-timeout 5 --max-time 300 --output "$target/$file" "${archive_url%/}/$stamp/$file"; done
(cd "$target" && sha256sum --check SHA256SUMS)
node "${INDEXER_REPO:-/home/sol/solana-indexer}/src/backup-preflight.js" --expect-id "$target" "$stamp"
echo "$target"
