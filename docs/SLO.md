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
| REST read latency | p99 <=500 ms monthly | route-free fixed-bucket histogram alerts after a sustained five-minute-window breach; shed expensive requests |
| WebSocket persisted-event delivery | acknowledgement-enabled client p99 <=2 seconds after durable index commit | alert on the fixed-bucket commit-to-ack histogram; reconnect and resume from cursor |
| WebSocket admission/backpressure | no capacity rejection or slow-consumer eviction during normal operation | alert on any sustained five-minute increase; scale or isolate slow consumers |
| WebSocket protocol errors | <=100 closes per five minutes | alert on sustained abuse or client incompatibility while preserving bounded parser limits |
| Durable API audit | zero write failures | protected routes fail closed immediately and page operators |
| Unresolved decoder dead letters | zero older than 10 minutes | affected protocol coverage becomes incomplete |
| Dead-letter evidence overflow | zero | index health and automation readiness fail closed; replay into replacement compatibility state before promotion |
| Restore point objective | <=24 hours | block commercial launch if last verified backup is older |
| Restore time objective | <=4 hours | rehearse quarterly on an isolated host |

Quarterly recovery evidence is accepted only from `npm run validate:recovery`.
The validator resolves the recovery root, marker, backup and repository and accepts
only the standard index, exporter-status and warehouse-checkpoint files beneath the
marked isolated root; deployment-state or symlink substitution fails closed. Its
exclusive report must be written through an existing canonical parent outside both
the recovery state and backup evidence. Qualification uses only those resolved
backup, index, exporter-status, warehouse-checkpoint and report paths afterward.
The version-5 report embeds and digest-binds the backup manifest hash to a healthy canonical index, exact
zero-lag warehouse convergence, a healthy finalized exporter observation produced
inside the recovery window, and elapsed restore time. It is created exclusively
so a prior successful rehearsal cannot be silently overwritten.
The latest retained report is continuously revalidated through
`/api/v1/recovery` and Prometheus. All required invariants, exact elapsed RTO,
canonical timestamps and the 90-day rehearsal window must remain valid; missing,
malformed, future-dated or expired evidence triggers a critical alert.
Monitoring validates the bounded embedded fields and recomputes the evidence
digest; invariant booleans or a syntactically valid hash alone cannot qualify.
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
Fixed-label `terminal_dex_internal_failures_total` counters cover generic HTTP,
pool quote, pool preparation, and curve preparation failures. Any increase over
five minutes alerts operators without placing diagnostic content in telemetry.
Audit-sink failure, WebSocket capacity rejection and slow-consumer counters alert
on any sustained five-minute increase. Protocol-error closes use a bounded
five-minute threshold so malformed-client floods are visible without embedding
client identity or frame contents in monitoring.
WebSocket delivery latency is measured only for clients that opt into the
versioned cumulative `ack=1` contract. Live delivery starts at the durable commit
notification (before projection and socket fan-out); replay starts when retained
evidence becomes available to the connection. The timer ends
when the server receives the corresponding application acknowledgement;
enqueue time is never substituted for delivery. Outstanding acknowledgements are
bounded by count and time, with timeouts separately alerted and no client labels.
GET latency for `/api/` and `/internal/` reads is exported as a fixed route-free
Prometheus histogram, allowing the 500 ms p99 objective to be evaluated without
mixing metrics/static traffic or write preparation into the read SLO and without
tenant, URL, or query labels.
HTTP header receipt, complete-request receipt, idle keep-alive lifetime, and
requests per socket are independently startup-validated and bounded. These
connection controls protect latency and audit capacity from slow or indefinitely
reused connections; payload byte ceilings remain a separate pre-dispatch gate.

`GET /metrics` exposes Prometheus counters and gauges on the loopback indexer.
It exports a dedicated binary persisted-state quarantine signal and the count of
invalid top-level collections. Syntax-invalid JSON reports quarantine with zero
named fields, preserving the redacted diagnostic boundary. The quarantine alert
is intentionally distinct from ordinary stale/unhealthy index alerts.
Backup health is derived only from the completion status installed after every
artifact and its content-bound receipt reach self-hosted storage. Missing,
malformed, future-dated, or older-than-24-hour evidence sets the RPO gauge to
unhealthy and triggers the launch-blocking alert.
It includes active and acknowledgement-enabled WebSocket clients plus cumulative
capacity rejections, slow-consumer evictions, protocol-error closes,
acknowledgement timeouts, and the delivery histogram so saturation and abusive
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
