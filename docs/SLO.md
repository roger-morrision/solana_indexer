# Production service objectives

These objectives apply only after a production mainnet deployment has passed a
seven-day burn-in. They are measured at the authenticated mTLS gateway; planned
maintenance is reported separately and is not silently removed from raw data.

| Signal | Objective | Fail-closed action |
|---|---:|---|
| Canonical feed availability | 99.9% monthly | trading-bot readiness returns unavailable |
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

`GET /metrics` exposes Prometheus counters and gauges on the loopback indexer.
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
