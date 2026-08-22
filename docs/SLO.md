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
| REST read latency | p99 <=500 ms monthly | alert and shed expensive requests |
| WebSocket persisted-event delivery | p99 <=2 seconds after index commit | reconnect and resume from cursor |
| Unresolved decoder dead letters | zero older than 10 minutes | affected protocol coverage becomes incomplete |
| Restore point objective | <=24 hours | block commercial launch if last verified backup is older |
| Restore time objective | <=4 hours | rehearse quarterly on an isolated host |

`GET /metrics` exposes Prometheus counters and gauges on the loopback indexer.
It must not be publicly exposed without the mTLS gateway or a private monitoring
network. `infra/monitoring/alerts.yaml` contains baseline alerts; operators must
connect them to an approved notification system and test alert delivery.
