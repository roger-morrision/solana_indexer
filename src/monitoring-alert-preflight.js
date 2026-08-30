#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { runBoundedProcess } from "./bounded-process.js";
import { redactDiagnostic } from "./diagnostic-redaction.js";
import { isInvokedFile } from "./invoked-file.js";

export async function runPromtool(ruleFile, command = "promtool") {
  return runBoundedProcess({ command, args: ["check", "rules", ruleFile], timeoutMs: 30_000, stdoutBytes: 8_192, stderrBytes: 8_192, label: "Prometheus alert rule preflight" });
}

export async function preflightMonitoringAlerts({ ruleFile, probe = runPromtool } = {}) {
  if (!path.isAbsolute(ruleFile ?? "")) throw new Error("monitoring alert rule file must be absolute");
  const stat = await fs.lstat(ruleFile);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 1 || stat.size > 1_048_576) throw new Error("monitoring alert rule file must be a bounded regular file");
  try {
    await probe(ruleFile);
    return { schemaVersion: 1, kind: "monitoring_alert_preflight", status: "pass", checked: true, reason: null };
  } catch (error) {
    if (error?.code === "ENOENT") return { schemaVersion: 1, kind: "monitoring_alert_preflight", status: "skip", checked: false, reason: "promtool_unavailable" };
    throw new Error(`Prometheus alert rule preflight failed: ${redactDiagnostic(error)}`);
  }
}

async function main() {
  const index = process.argv.indexOf("--rules"), ruleFile = index >= 0 ? process.argv[index + 1] : null;
  console.log(JSON.stringify(await preflightMonitoringAlerts({ ruleFile: path.resolve(ruleFile ?? "") })));
}
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (isInvokedFile(invoked, fileURLToPath(import.meta.url))) main().catch((error) => { console.error(redactDiagnostic(error, "Monitoring alert preflight failed")); process.exitCode = 1; });
