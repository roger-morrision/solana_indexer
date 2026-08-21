#!/usr/bin/env bash
set -euo pipefail
umask 077
repo="${INDEXER_REPO:-/home/sol/solana-indexer}"
backup_root="${BACKUP_ROOT:-/var/backups/terminal-dex}"
compose="$repo/infra/compose.yaml"
[[ -f "$compose" && -f "$repo/package.json" ]] || { echo "INDEXER_REPO is not a deployed indexer" >&2; exit 1; }
[[ "$backup_root" == /* && "$backup_root" != "/" ]] || { echo "BACKUP_ROOT must be a dedicated absolute directory" >&2; exit 1; }
[[ "${BACKUP_WRITERS_QUIESCED:-}" == "yes" ]] || { echo "Stop/quiesce indexer writers and set BACKUP_WRITERS_QUIESCED=yes" >&2; exit 1; }
stamp="$(date -u +%Y%m%dT%H%M%SZ)"; target="$backup_root/$stamp"; install -d -m 0700 "$target"
cd "$repo"
docker compose -f "$compose" exec -T postgres pg_dump -U terminal_dex -d terminal_dex --format=custom --no-owner > "$target/postgres.dump"
for table in instructions swaps balance_changes dead_letters; do docker compose -f "$compose" exec -T clickhouse clickhouse-client --database terminal_dex --query "SELECT * FROM $table FORMAT Native" > "$target/clickhouse-$table.native"; done
docker compose -f "$compose" exec -T redis sh -c 'redis-cli -a "$(cat /run/secrets/redis_password)" --no-auth-warning SAVE >/dev/null'
docker compose -f "$compose" cp redis:/data/dump.rdb "$target/redis.rdb" >/dev/null
tar --create --file "$target/indexer-state.tar" --ignore-failed-read data/index.json data/exporter-status.json data/account-snapshot.json inbox
node src/archive-receipt.js manifest inbox "$target/inbox-manifest.json" "$stamp"
(cd "$target" && sha256sum postgres.dump clickhouse-*.native redis.rdb indexer-state.tar inbox-manifest.json > SHA256SUMS)
printf '{"schemaVersion":1,"createdAt":"%s","chain":"solana","scope":"postgres-clickhouse-redis-indexer-state"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$target/manifest.json"
(cd "$target" && sha256sum manifest.json >> SHA256SUMS)
archive_url="${SELF_HOSTED_ARCHIVE_URL:-http://127.0.0.1:8888/terminal-dex-backups}"
[[ "$archive_url" =~ ^http://(127\.0\.0\.1|localhost|\[::1\])(:[0-9]+)?/ ]] || { echo "SELF_HOSTED_ARCHIVE_URL must be loopback HTTP" >&2; exit 1; }
for file in "$target"/postgres.dump "$target"/clickhouse-*.native "$target"/redis.rdb "$target"/indexer-state.tar "$target"/inbox-manifest.json "$target"/manifest.json "$target"/SHA256SUMS; do curl --fail --silent --show-error --retry 3 --retry-all-errors --connect-timeout 5 --max-time 300 --create-dirs --upload-file "$file" "${archive_url%/}/$stamp/$(basename "$file")"; done
node src/archive-receipt.js complete "$target/inbox-manifest.json" "$target/inbox-archive-receipt.json"
curl --fail --silent --show-error --retry 3 --retry-all-errors --connect-timeout 5 --max-time 300 --upload-file "$target/inbox-archive-receipt.json" "${archive_url%/}/$stamp/inbox-archive-receipt.json"
install -m 0600 "$target/inbox-archive-receipt.json" data/inbox-archive-receipt.json
echo "$target"
