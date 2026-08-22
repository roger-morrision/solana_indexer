import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export class ApiAuditSink {
  constructor(filename) { this.filename = filename; this.pending = Promise.resolve(); this.failures = 0; }
  record(entry) {
    if (!this.filename) return;
    const line = `${JSON.stringify({ schemaVersion: 1, ...entry })}\n`;
    this.pending = this.pending.then(async () => { await fs.mkdir(path.dirname(this.filename), { recursive: true }); await fs.appendFile(this.filename, line, { encoding: "utf8", mode: 0o600 }); }).catch(() => { this.failures++; });
  }
  async flush() { await this.pending; }
}

export function auditIdentity(apiKey, remoteAddress) {
  const scope = apiKey ? `key:${apiKey}` : `local:${remoteAddress ?? "unknown"}`;
  return crypto.createHash("sha256").update(scope).digest("hex");
}
