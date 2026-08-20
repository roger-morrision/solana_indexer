# Backup and restore operations

Run `backup.sh` as the dedicated backup operator on the data host. Set
`INDEXER_REPO` and a dedicated absolute `BACKUP_ROOT`. Setting `BACKUP_S3_URI`
uploads the checksummed directory through the installed AWS CLI to an approved
S3-compatible destination; credentials, endpoints, retention, object lock, and
encryption policy remain operator-owned. `BACKUP_S3_SSE` optionally selects the
server-side encryption mode. No credentials belong in this repository.
Quiesce every indexer writer first and set `BACKUP_WRITERS_QUIESCED=yes`; the
script refuses a potentially inconsistent cross-store backup otherwise.

`restore.sh` verifies every checksum and refuses to run without
`--confirm-empty-target`. It destructively replaces database tables and local
state, so run it only on an isolated recovery environment with consumers and
indexer services stopped. After restore, reconcile finalized slots against the
local Agave node and exercise API/feed checks before promoting the environment.
Perform and record a quarterly recovery rehearsal against the documented RTO.
