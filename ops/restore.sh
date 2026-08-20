#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ "${1:-}" == "--confirm-empty-target" && -n "${2:-}" ]] || { echo "Usage: restore.sh --confirm-empty-target /absolute/backup-directory" >&2; exit 2; }
source_dir="$2"; repo="${INDEXER_REPO:-/home/sol/solana-indexer}"; compose="$repo/infra/compose.yaml"
[[ "$source_dir" == /* && "$source_dir" != "/" && -f "$source_dir/SHA256SUMS" ]] || { echo "Invalid absolute backup directory" >&2; exit 1; }
(cd "$source_dir" && sha256sum --check SHA256SUMS)
cd "$repo"
docker compose -f "$compose" exec -T postgres pg_restore --clean --if-exists --no-owner -U terminal_dex -d terminal_dex < "$source_dir/postgres.dump"
for table in instructions swaps balance_changes dead_letters; do docker compose -f "$compose" exec -T clickhouse clickhouse-client --database terminal_dex --query "TRUNCATE TABLE $table"; docker compose -f "$compose" exec -T clickhouse clickhouse-client --database terminal_dex --query "INSERT INTO $table FORMAT Native" < "$source_dir/clickhouse-$table.native"; done
docker compose -f "$compose" stop redis
docker compose -f "$compose" cp "$source_dir/redis.rdb" redis:/data/dump.rdb
docker compose -f "$compose" run --rm --no-deps --user root redis sh -c 'chown redis:redis /data/dump.rdb && chmod 600 /data/dump.rdb'
docker compose -f "$compose" start redis
tar --extract --file "$source_dir/indexer-state.tar" --directory "$repo"
echo "Restore completed. Run npm test, npm run status, health checks, and reconciliation before enabling consumers."
