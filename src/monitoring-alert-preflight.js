#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { runBoundedProcess } from "./bounded-process.js";
import { redactDiagnostic } from "./diagnostic-redaction.js";
import { isInvokedFile } from "./invoked-file.js";

export async function runPromtool(ruleFile, ruleTestFile, command = "promtool") {
  await runBoundedProcess({ command, args: ["check", "rules", ruleFile], timeoutMs: 30_000, stdoutBytes: 8_192, stderrBytes: 8_192, label: "Prometheus alert rule syntax preflight" });
  return runBoundedProcess({ command, args: ["test", "rules", ruleTestFile], timeoutMs: 30_000, stdoutBytes: 8_192, stderrBytes: 8_192, label: "Prometheus alert rule evaluation preflight" });
}

export async function preflightMonitoringAlerts({ ruleFile, ruleTestFile, probe = runPromtool } = {}) {
  for (const [label, filename] of Object.entries({ ruleFile, ruleTestFile })) {
    if (!path.isAbsolute(filename ?? "")) throw new Error(`${label} must be absolute`);
    const stat = await fs.lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 1 || stat.size > 1_048_576) throw new Error(`${label} must be a bounded regular file`);
  }
  try {
    await probe(ruleFile, ruleTestFile);
    return { schemaVersion: 1, kind: "monitoring_alert_preflight", status: "pass", checked: true, checks: ["syntax", "evaluation"], reason: null };
  } catch (error) {
    if (error?.code === "ENOENT") return { schemaVersion: 1, kind: "monitoring_alert_preflight", status: "skip", checked: false, reason: "promtool_unavailable" };
    throw new Error(`Prometheus alert rule preflight failed: ${redactDiagnostic(error)}`);
  }
}

async function main() {
  const ruleIndex = process.argv.indexOf("--rules"), testIndex = process.argv.indexOf("--tests"), ruleFile = ruleIndex >= 0 ? process.argv[ruleIndex + 1] : null, ruleTestFile = testIndex >= 0 ? process.argv[testIndex + 1] : null;
  console.log(JSON.stringify(await preflightMonitoringAlerts({ ruleFile: path.resolve(ruleFile ?? ""), ruleTestFile: path.resolve(ruleTestFile ?? "") })));
}
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (isInvokedFile(invoked, fileURLToPath(import.meta.url))) main().catch((error) => { console.error(redactDiagnostic(error, "Monitoring alert preflight failed")); process.exitCode = 1; });
