# Backup and restore operations

Run `backup.sh` as the dedicated backup operator on the data host. Set
`INDEXER_REPO` and a dedicated absolute `BACKUP_ROOT`. The checksummed directory
is uploaded with `curl` to the loopback-only self-hosted SeaweedFS filer at
`SELF_HOSTED_ARCHIVE_URL` (default
`http://127.0.0.1:8888/terminal-dex-backups`). The script rejects non-loopback
archive endpoints. It does not use AWS, S3, hosted storage, or cloud credentials.
Quiesce every indexer writer first and set `BACKUP_WRITERS_QUIESCED=yes`; the
script refuses a potentially inconsistent cross-store backup otherwise.
The backup records exact SHA-256 fingerprints for raw inbox files and uploads a
completion receipt last. Only after that final upload succeeds is the receipt
installed under `data/`; inbox retention requires this receipt and the matching
parser checkpoint before any old raw file can be deleted.
Every uploaded object is fetched back through the same loopback filer and its
SHA-256 compared before the script advances. The script then uploads, verifies,
and installs a separate content-bound backup status that ties the backup ID to
the full manifest and archive-receipt hashes. The status boundary also verifies
that the uploaded receipt names the exact inbox
manifest artifact in the quiesced cross-store backup and has canonical matching
upload-completion evidence. This is the
only evidence accepted by API/Prometheus RPO health; creating artifacts locally
or partially uploading a backup does not report success. The installed
version-2 status embeds and digest-binds its chain, storage, backup, completion,
manifest, and receipt identities so monitoring rejects edited or legacy status.

`fetch-backup.sh <UTC-stamp>` downloads a known archive from that same loopback
filer and verifies its checksum inventory and version-4 manifest before it can
be passed to `restore.sh`. The manifest binds the backup identity, quiesced-writer
assertion, exact byte length and SHA-256 of every cross-store artifact, and the
inbox manifest archive identity. It does
not enumerate remote paths or accept arbitrary URLs.

`restore.sh` verifies every checksum and refuses to run without
`--confirm-empty-target`. It destructively replaces database tables and local
state, so run it only on an isolated recovery environment with consumers and
indexer services stopped. It additionally requires `RECOVERY_ENVIRONMENT=yes`,
a unique `RECOVERY_COMPOSE_PROJECT=terminal-dex-recovery-*`, and an existing
non-link `RECOVERY_STATE_ROOT` outside both the repository and backup. Its
`RECOVERY_TARGET_MARKER` must be the root's regular
`.terminal-dex-isolated-recovery` file containing exactly
`terminal-dex-isolated-recovery-v1`; `data/` and `inbox/` must be absent or
empty. Every destructive Compose command uses that explicit recovery-only
project and local state is extracted only under the separate root, preventing
the drill from falling back to the normal deployment or overwriting the active
index. It records the UTC restore start and prints exact recovery-path-bound
`npm run sync:warehouse` and `npm run validate:recovery` commands. After restore, keep consumers disabled,
reconcile the warehouse, resume finalized export, and exercise API/feed checks.
The recovery validator rechecks the bound backup, requires a healthy canonical
index and zero-lag exact ClickHouse/PostgreSQL/Redis content reconciliation, requires a healthy finalized
exporter observation produced after recovery started, enforces the four-hour RTO,
and exclusively creates a hash-bound report. It independently resolves the marker,
index, exporter status and warehouse checkpoint and accepts only their standard
paths under the isolated recovery root, preventing environment-path substitution;
the version-5 report embeds the bounded canonical evidence summary so monitoring
can recompute its digest and reject copied, edited, legacy, or self-asserted evidence;
an existing report is never overwritten. Perform and retain this report for each
quarterly isolated recovery rehearsal before promoting the environment. Point
`INDEXER_RECOVERY_REPORT_FILE` at the latest retained report (or archive the
prior default-path report before the next drill); API/Prometheus health rejects
missing, malformed, future-dated, or older-than-90-day qualification evidence.

For commercial metering, configure PostgreSQL through a protected `PGPASSFILE`
or equivalent `PG*` environment and run `npm run sync:commercial` on a supervised
schedule. The worker validates the full hash-only tenant registry and retained
redacted audit log before issuing one transaction; it never accepts a database
URL argument or prints credentials.
