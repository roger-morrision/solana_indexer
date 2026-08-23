#!/usr/bin/env node
import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runBoundedProcess } from "./bounded-process.js";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { redactDiagnostic } from "./diagnostic-redaction.js";
import { readBoundedJsonFile } from "./bounded-json-file.js";

const SHA = /^[0-9a-f]{64}$/, GIT_COMMIT = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/, SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/, REVIEWER = /^[A-Za-z0-9][A-Za-z0-9._@-]{2,127}$/;
async function sha256(filename) {
  const before = await fs.lstat(filename);
  if (!before.isFile() || before.isSymbolicLink() || !Number.isSafeInteger(before.size) || before.size < 1 || before.size > 1_073_741_824) throw new Error("activation binary must be a regular file of at most one GiB");
  const hash = crypto.createHash("sha256"); for await (const chunk of createReadStream(filename)) hash.update(chunk);
  const after = await fs.lstat(filename);
  if (!after.isFile() || after.isSymbolicLink() || after.size !== before.size || after.dev !== before.dev || after.ino !== before.ino || after.mtimeMs !== before.mtimeMs) throw new Error("activation binary changed during hashing");
  return hash.digest("hex");
}

export async function runAgaveVersionProbe(command, spawnProcess = spawn, processOptions = {}) {
  try { return await runBoundedProcess({ command, args: ["--version"], spawnProcess, timeoutMs: 10_000, stdoutBytes: 4_096, stderrBytes: 4_096, label: "Agave version probe", ...processOptions }); }
  catch (error) { throw new Error(redactDiagnostic(error, "Agave version probe failed")); }
}

export function validateGeyserCompatibility(manifest, observed, now = Date.now()) {
  const fail = (reason) => ({ schemaVersion: 2, compatible: false, activationAllowed: false, reason });
  if (manifest?.schemaVersion !== 2 || manifest?.chain !== "solana-mainnet" || manifest?.status !== "qualified") return fail("compatibility_not_qualified");
  if (!manifest.agave || !manifest.plugin || !manifest.qualification || !observed || !SHA.test(manifest.agave.binarySha256 ?? "") || !SHA.test(manifest.plugin.binarySha256 ?? "") || !GIT_COMMIT.test(manifest.agave.sourceCommit ?? "") || !GIT_COMMIT.test(manifest.plugin.sourceCommit ?? "") || typeof manifest.agave.versionOutput !== "string" || !/^agave-validator [ -~]{1,128}$/.test(manifest.agave.versionOutput) || manifest.plugin.name !== "yellowstone-grpc-geyser" || !SEMVER.test(manifest.plugin.version ?? "") || !REVIEWER.test(manifest.reviewedBy ?? "")) return fail("compatibility_evidence_invalid");
  if (manifest.agave.versionOutput !== observed.agaveVersionOutput || manifest.agave.binarySha256 !== observed.agaveBinarySha256 || manifest.plugin.binarySha256 !== observed.pluginBinarySha256) return fail("installed_binary_mismatch");
  const testedAt = parseCanonicalUtcTimestamp(manifest.qualification.testedAt), duration = manifest.qualification.sustainedSeconds, blocks = manifest.qualification.finalizedBlocks, rss = manifest.qualification.maxRssBytes, slope = manifest.qualification.rssSlopeBytesPerHour, replay = manifest.qualification.replay, reconciliation = manifest.qualification.reconciliation, transport = manifest.qualification.transport;
  if (testedAt == null || testedAt > now || now - testedAt > 30 * 86_400_000 || !Number.isSafeInteger(duration) || duration < 86_400 || !Number.isSafeInteger(blocks) || blocks < 100_000 || !Number.isSafeInteger(rss) || rss < 1 || !Number.isFinite(slope) || slope < 0 || slope > 16 * 1024 * 1024 || replay?.schemaVersion !== 1 || !SHA.test(replay.digest ?? "") || replay.canonicalCounts !== true || replay.duplicateIdempotency !== true || replay.replacementCorrections !== true || replay.boundedHeapDelta !== true || replay.throughput !== true || reconciliation?.schemaVersion !== 1 || reconciliation.comparedFinalizedBlocks !== blocks || reconciliation.mismatchedBlocks !== 0 || reconciliation.missingGeyserBlocks !== 0 || reconciliation.missingPubsubBlocks !== 0 || transport?.schemaVersion !== 1 || transport.droppedUpdates !== 0 || !Number.isSafeInteger(transport.reconnects) || transport.reconnects < 0 || !Number.isSafeInteger(transport.maxBufferedUpdates) || transport.maxBufferedUpdates < 1 || transport.maxBufferedUpdates > 100_000) return fail("sustained_qualification_insufficient");
  return { schemaVersion: 2, compatible: true, activationAllowed: true, reason: null, agaveVersionOutput: observed.agaveVersionOutput, pluginVersion: manifest.plugin.version, testedAt: manifest.qualification.testedAt, sustainedSeconds: duration, finalizedBlocks: blocks, maxRssBytes: rss, rssSlopeBytesPerHour: slope, comparedFinalizedBlocks: reconciliation.comparedFinalizedBlocks, reconnects: transport.reconnects, maxBufferedUpdates: transport.maxBufferedUpdates, reviewedBy: manifest.reviewedBy };
}

export async function preflightGeyser({ manifestFile, agaveBinary, pluginLibrary, versionProbe = runAgaveVersionProbe }) {
  for (const [label, filename] of Object.entries({ manifestFile, agaveBinary, pluginLibrary })) if (!path.isAbsolute(filename ?? "")) throw new Error(`${label} must be an absolute path`);
  const manifest = await readBoundedJsonFile(manifestFile); if (manifest?.evidenceReadError || manifest == null) throw new Error("Yellowstone activation manifest is unavailable");
  const [agaveBinarySha256, pluginBinarySha256] = await Promise.all([sha256(agaveBinary), sha256(pluginLibrary)]), agaveVersionOutput = await versionProbe(agaveBinary), result = validateGeyserCompatibility(manifest, { agaveVersionOutput, agaveBinarySha256, pluginBinarySha256 }); if (!result.activationAllowed) throw new Error(`Yellowstone activation refused: ${result.reason}`); return result;
}

function option(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; }
async function main() { const result = await preflightGeyser({ manifestFile: option("--manifest"), agaveBinary: option("--agave"), pluginLibrary: option("--plugin") }); console.log(JSON.stringify(result)); }
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invoked.toLowerCase()) main().catch((error) => { console.error(redactDiagnostic(error, "Yellowstone preflight failed")); process.exitCode = 1; });
