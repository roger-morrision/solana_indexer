#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ "${1:-}" == "--confirm-empty-target" && -n "${2:-}" ]] || { echo "Usage: restore.sh --confirm-empty-target /absolute/backup-directory" >&2; exit 2; }
source_dir="$2"; repo="${INDEXER_REPO:-/home/sol/solana-indexer}"; compose="$repo/infra/compose.yaml"
restore_started_at="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
[[ "$source_dir" == /* && "$source_dir" != "/" && -f "$source_dir/SHA256SUMS" ]] || { echo "Invalid absolute backup directory" >&2; exit 1; }
project="${RECOVERY_COMPOSE_PROJECT:-}"
state_root="${RECOVERY_STATE_ROOT:-}"
marker="${RECOVERY_TARGET_MARKER:-}"
[[ "$project" =~ ^terminal-dex-recovery-[a-z0-9][a-z0-9-]{0,47}$ ]] || { echo "RECOVERY_COMPOSE_PROJECT must name a dedicated terminal-dex-recovery-* project" >&2; exit 1; }
[[ "${RECOVERY_ENVIRONMENT:-}" == "yes" ]] || { echo "RECOVERY_ENVIRONMENT=yes is required" >&2; exit 1; }
[[ "$state_root" == /* && -d "$state_root" && ! -L "$state_root" ]] || { echo "RECOVERY_STATE_ROOT must be an existing absolute non-link directory" >&2; exit 1; }
repo="$(realpath -e "$repo")"; compose="$repo/infra/compose.yaml"; source_dir="$(realpath -e "$source_dir")"; state_root="$(realpath -e "$state_root")"
[[ "$state_root" != "/" && "$state_root" != "$repo" && "$state_root" != "$repo"/* && "$repo" != "$state_root"/* && "$state_root" != "$source_dir" && "$state_root" != "$source_dir"/* && "$source_dir" != "$state_root"/* ]] || { echo "RECOVERY_STATE_ROOT must be isolated from the repository and backup" >&2; exit 1; }
[[ "$marker" == "$state_root/.terminal-dex-isolated-recovery" && -f "$marker" && ! -L "$marker" ]] || { echo "RECOVERY_TARGET_MARKER must be the regular marker inside RECOVERY_STATE_ROOT" >&2; exit 1; }
IFS= read -r marker_content < "$marker" || true
[[ "$marker_content" == "terminal-dex-isolated-recovery-v1" ]] || { echo "Recovery target marker is invalid" >&2; exit 1; }
for target in "$state_root/data" "$state_root/inbox"; do [[ ! -e "$target" && ! -L "$target" ]] || { [[ -d "$target" && ! -L "$target" && -z "$(find "$target" -mindepth 1 -print -quit)" ]] || { echo "Recovery state data and inbox targets must be empty" >&2; exit 1; }; }; done
staging="$(mktemp -d "${TMPDIR:-/tmp}/terminal-dex-recovery.XXXXXX")"
restore_complete=no
cleanup_staging() { if [[ "$restore_complete" != yes ]]; then rm -rf -- "$staging"; fi; }
trap cleanup_staging EXIT
for artifact in SHA256SUMS manifest.json postgres.dump clickhouse-canonical_events.native clickhouse-canonical_instructions.native clickhouse-canonical_swaps.native clickhouse-canonical_balance_changes.native clickhouse-canonical_native_transfers.native clickhouse-canonical_dead_letters.native clickhouse-canonical_candles.native redis.rdb indexer-state.tar inbox-manifest.json; do cp --no-dereference --reflink=auto -- "$source_dir/$artifact" "$staging/$artifact"; done
source_dir="$staging"
compose_cmd=(docker compose --project-name "$project" -f "$compose")
(cd "$source_dir" && sha256sum --check SHA256SUMS)
node "$repo/src/backup-preflight.js" "$source_dir"
cd "$repo"
"${compose_cmd[@]}" exec -T postgres pg_restore --clean --if-exists --no-owner -U terminal_dex -d terminal_dex < "$source_dir/postgres.dump"
for table in canonical_events canonical_instructions canonical_swaps canonical_balance_changes canonical_native_transfers canonical_dead_letters canonical_candles; do "${compose_cmd[@]}" exec -T clickhouse clickhouse-client --database terminal_dex --query "TRUNCATE TABLE $table"; "${compose_cmd[@]}" exec -T clickhouse clickhouse-client --database terminal_dex --query "INSERT INTO $table FORMAT Native" < "$source_dir/clickhouse-$table.native"; done
"${compose_cmd[@]}" stop redis
"${compose_cmd[@]}" cp "$source_dir/redis.rdb" redis:/data/dump.rdb
"${compose_cmd[@]}" run --rm --no-deps --user root redis sh -c 'chown redis:redis /data/dump.rdb && chmod 600 /data/dump.rdb'
"${compose_cmd[@]}" start redis
tar --extract --file "$source_dir/indexer-state.tar" --directory "$state_root"
restore_complete=yes
echo "Restore completed into isolated state root '$state_root'. Keep consumers disabled; run npm test, then run sync:warehouse and health checks with all recovery paths below:"
echo "INDEXER_DATA_FILE='$state_root/data/index.json' INDEXER_INBOX='$state_root/inbox' EXPORTER_STATUS_FILE='$state_root/data/exporter-status.json' ACCOUNT_SNAPSHOT_FILE='$state_root/data/account-snapshot.json' INDEXER_WAREHOUSE_CHECKPOINT_FILE='$state_root/data/warehouse-checkpoint.json' npm run sync:warehouse"
echo "INDEXER_DATA_FILE='$state_root/data/index.json' INDEXER_INBOX='$state_root/inbox' EXPORTER_STATUS_FILE='$state_root/data/exporter-status.json' ACCOUNT_SNAPSHOT_FILE='$state_root/data/account-snapshot.json' INDEXER_WAREHOUSE_CHECKPOINT_FILE='$state_root/data/warehouse-checkpoint.json' npm run validate:recovery -- '$source_dir' '$restore_started_at' '/absolute/recovery-report.json'"
echo "After successful qualification, remove retained staging directory: rm -rf -- '$source_dir'"
