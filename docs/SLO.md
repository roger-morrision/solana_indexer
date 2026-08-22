# Production service objectives

These objectives apply only after a production mainnet deployment has passed a
seven-day burn-in. They are measured at the authenticated mTLS gateway; planned
maintenance is reported separately and is not silently removed from raw data.

| Signal | Objective | Fail-closed action |
|---|---:|---|
| Canonical feed availability | 99.9% monthly | trading-bot readiness returns unavailable |
| Persisted-state integrity | no quarantine transition | page immediately; suspend serving, writers, sink publication, retention deletion and recovery qualification while preserving source evidence |
| Complete execution snapshot | 100% of automation-ready responses | event-only, stale, or mismatched mint evidence blocks bot readiness |
| Newest finalized block age | <=120 seconds for 99.9% of minutes | page and bot responses disclose stale data |
| Consecutive exporter failures | zero during normal operation | alert; preserve the last success and publish redacted failure evidence |
| Private block stream connection | connected during normal operation | readiness fails immediately on a durable disconnect transition; rotate nodes and repair gaps over verified RPC |
| REST read latency | p99 <=500 ms monthly | alert and shed expensive requests |
| WebSocket persisted-event delivery | p99 <=2 seconds after index commit | reconnect and resume from cursor |
| Unresolved decoder dead letters | zero older than 10 minutes | affected protocol coverage becomes incomplete |
| Restore point objective | <=24 hours | block commercial launch if last verified backup is older |
| Restore time objective | <=4 hours | rehearse quarterly on an isolated host |

Quarterly recovery evidence is accepted only from `npm run validate:recovery`.
The report binds the backup manifest hash to a healthy canonical index, exact
zero-lag warehouse convergence, a healthy finalized exporter, and elapsed restore time. It is created exclusively
so a prior successful rehearsal cannot be silently overwritten.
The latest retained report is continuously revalidated through
`/api/v1/recovery` and Prometheus. All required invariants, exact elapsed RTO,
canonical timestamps and the 90-day rehearsal window must remain valid; missing,
malformed, future-dated or expired evidence triggers a critical alert.
Malformed JSON in exporter, warehouse, backup, or recovery evidence is converted
to a redacted invalid-evidence state. `/metrics` remains available with zero
health gauges, while every dependent API, gap feed, and bot gate fails closed;
the malformed bytes are never reflected in a response.
Ingestion and snapshot dead-letter errors are restricted to 512-byte redacted
diagnostics. URLs, authentication tokens, secret assignments, JWTs, private-key
blocks, and control characters never enter durable state or warehouse facts.
Exact-fingerprint failures use persisted exponential retry windows by failure
stage. Parser/registry/state upgrades and changed source bytes retry immediately,
while process restarts cannot reset or hot-loop an unchanged failure schedule.
Stats and Prometheus expose only aggregate due, deferred, legacy, next-delay, and
bounded-stage counts. They never expose filenames, fingerprints, errors, or
payload contents; due or legacy work remaining for ten minutes alerts operators.
Public HTTP failures are a trust boundary: unexpected exceptions return only
`internal_error`, `quote_unavailable`, or `execution_preparation_unavailable`.
Only controlled 4xx validation failures may include bounded detail. Optional
internal diagnostics apply the same credential, URL, control-character, and
length redaction policy as durable dead-letter evidence.

`GET /metrics` exposes Prometheus counters and gauges on the loopback indexer.
It exports a dedicated binary persisted-state quarantine signal and the count of
invalid top-level collections. Syntax-invalid JSON reports quarantine with zero
named fields, preserving the redacted diagnostic boundary. The quarantine alert
is intentionally distinct from ordinary stale/unhealthy index alerts.
Backup health is derived only from the completion status installed after every
artifact and its content-bound receipt reach self-hosted storage. Missing,
malformed, future-dated, or older-than-24-hour evidence sets the RPO gauge to
unhealthy and triggers the launch-blocking alert.
It includes active WebSocket clients plus cumulative capacity rejections,
slow-consumer evictions, and protocol-error closes so saturation and abusive
or incompatible clients are observable without logging credentials.
Shutdown closes upgraded sockets before waiting for the HTTP server drain, then
flushes durable audit work; long-lived subscribers therefore cannot defeat the
documented recovery and restart objectives.
The graceful HTTP drain has a configurable 30-second default deadline; once it
expires, remaining connections are force-closed before the audit flush so a
stalled request cannot make restart time unbounded.
It must not be publicly exposed without the mTLS gateway or a private monitoring
network. `infra/monitoring/alerts.yaml` contains baseline alerts; operators must
connect them to an approved notification system and test alert delivery.
