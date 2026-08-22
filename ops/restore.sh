#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ "${1:-}" == "--confirm-empty-target" && -n "${2:-}" ]] || { echo "Usage: restore.sh --confirm-empty-target /absolute/backup-directory" >&2; exit 2; }
source_dir="$2"; repo="${INDEXER_REPO:-/home/sol/solana-indexer}"; compose="$repo/infra/compose.yaml"
restore_started_at="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
[[ "$source_dir" == /* && "$source_dir" != "/" && -f "$source_dir/SHA256SUMS" ]] || { echo "Invalid absolute backup directory" >&2; exit 1; }
project="${RECOVERY_COMPOSE_PROJECT:-}"
marker="${RECOVERY_TARGET_MARKER:-}"
[[ "$project" =~ ^terminal-dex-recovery-[a-z0-9][a-z0-9-]{0,47}$ ]] || { echo "RECOVERY_COMPOSE_PROJECT must name a dedicated terminal-dex-recovery-* project" >&2; exit 1; }
[[ "${RECOVERY_ENVIRONMENT:-}" == "yes" ]] || { echo "RECOVERY_ENVIRONMENT=yes is required" >&2; exit 1; }
[[ "$marker" == /* && -f "$marker" && "$marker" != "$source_dir"/* ]] || { echo "RECOVERY_TARGET_MARKER must be an absolute file outside the backup" >&2; exit 1; }
IFS= read -r marker_content < "$marker" || true
[[ "$marker_content" == "terminal-dex-isolated-recovery-v1" ]] || { echo "Recovery target marker is invalid" >&2; exit 1; }
compose_cmd=(docker compose --project-name "$project" -f "$compose")
(cd "$source_dir" && sha256sum --check SHA256SUMS)
node "$repo/src/backup-preflight.js" "$source_dir"
cd "$repo"
"${compose_cmd[@]}" exec -T postgres pg_restore --clean --if-exists --no-owner -U terminal_dex -d terminal_dex < "$source_dir/postgres.dump"
for table in instructions swaps balance_changes dead_letters; do "${compose_cmd[@]}" exec -T clickhouse clickhouse-client --database terminal_dex --query "TRUNCATE TABLE $table"; "${compose_cmd[@]}" exec -T clickhouse clickhouse-client --database terminal_dex --query "INSERT INTO $table FORMAT Native" < "$source_dir/clickhouse-$table.native"; done
"${compose_cmd[@]}" stop redis
"${compose_cmd[@]}" cp "$source_dir/redis.rdb" redis:/data/dump.rdb
"${compose_cmd[@]}" run --rm --no-deps --user root redis sh -c 'chown redis:redis /data/dump.rdb && chmod 600 /data/dump.rdb'
"${compose_cmd[@]}" start redis
tar --extract --file "$source_dir/indexer-state.tar" --directory "$repo"
echo "Restore completed. Keep consumers disabled; run npm test, npm run sync:warehouse, health checks, then:"
echo "npm run validate:recovery -- '$source_dir' '$restore_started_at' '/absolute/recovery-report.json'"
