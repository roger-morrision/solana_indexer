#!/usr/bin/env node
import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SHA = /^[0-9a-f]{64}$/, GIT_COMMIT = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
async function sha256(filename) { const hash = crypto.createHash("sha256"); for await (const chunk of createReadStream(filename)) hash.update(chunk); return hash.digest("hex"); }
function capture(command, args = []) { return new Promise((resolve, reject) => { const child = spawn(command, args, { shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }); let stdout = "", stderr = ""; child.stdout.on("data", (chunk) => { if (stdout.length < 4_096) stdout += chunk; }); child.stderr.on("data", (chunk) => { if (stderr.length < 4_096) stderr += chunk; }); child.on("error", reject); child.on("close", (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(`Agave version probe failed (${code}): ${stderr.trim().slice(0, 256)}`))); }); }

export function validateGeyserCompatibility(manifest, observed, now = Date.now()) {
  const fail = (reason) => ({ schemaVersion: 1, compatible: false, activationAllowed: false, reason });
  if (manifest?.schemaVersion !== 1 || manifest?.chain !== "solana-mainnet" || manifest?.status !== "qualified") return fail("compatibility_not_qualified");
  if (!manifest.agave || !manifest.plugin || !manifest.qualification || !observed || !SHA.test(manifest.agave.binarySha256 ?? "") || !SHA.test(manifest.plugin.binarySha256 ?? "") || !GIT_COMMIT.test(manifest.agave.sourceCommit ?? "") || !GIT_COMMIT.test(manifest.plugin.sourceCommit ?? "") || typeof manifest.plugin.name !== "string" || !manifest.plugin.name || typeof manifest.plugin.version !== "string" || !manifest.plugin.version) return fail("compatibility_evidence_invalid");
  if (manifest.agave.versionOutput !== observed.agaveVersionOutput || manifest.agave.binarySha256 !== observed.agaveBinarySha256 || manifest.plugin.binarySha256 !== observed.pluginBinarySha256) return fail("installed_binary_mismatch");
  const testedAt = Date.parse(manifest.qualification.testedAt ?? ""), duration = manifest.qualification.sustainedSeconds, blocks = manifest.qualification.finalizedBlocks, rss = manifest.qualification.maxRssBytes, slope = manifest.qualification.rssSlopeBytesPerHour;
  if (!Number.isFinite(testedAt) || testedAt > now || now - testedAt > 30 * 86_400_000 || !Number.isSafeInteger(duration) || duration < 86_400 || !Number.isSafeInteger(blocks) || blocks < 100_000 || !Number.isSafeInteger(rss) || rss < 1 || !Number.isFinite(slope) || slope < 0 || slope > 16 * 1024 * 1024 || typeof manifest.qualification.replayDigest !== "string" || !SHA.test(manifest.qualification.replayDigest) || typeof manifest.reviewedBy !== "string" || !manifest.reviewedBy.trim()) return fail("sustained_qualification_insufficient");
  return { schemaVersion: 1, compatible: true, activationAllowed: true, reason: null, agaveVersionOutput: observed.agaveVersionOutput, pluginVersion: manifest.plugin.version, testedAt: manifest.qualification.testedAt, sustainedSeconds: duration, finalizedBlocks: blocks, maxRssBytes: rss, rssSlopeBytesPerHour: slope, reviewedBy: manifest.reviewedBy };
}

export async function preflightGeyser({ manifestFile, agaveBinary, pluginLibrary }) {
  for (const [label, filename] of Object.entries({ manifestFile, agaveBinary, pluginLibrary })) if (!path.isAbsolute(filename ?? "")) throw new Error(`${label} must be an absolute path`);
  const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8")), [agaveVersionOutput, agaveBinarySha256, pluginBinarySha256] = await Promise.all([capture(agaveBinary, ["--version"]), sha256(agaveBinary), sha256(pluginLibrary)]), result = validateGeyserCompatibility(manifest, { agaveVersionOutput, agaveBinarySha256, pluginBinarySha256 }); if (!result.activationAllowed) throw new Error(`Yellowstone activation refused: ${result.reason}`); return result;
}

function option(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; }
async function main() { const result = await preflightGeyser({ manifestFile: option("--manifest"), agaveBinary: option("--agave"), pluginLibrary: option("--plugin") }); console.log(JSON.stringify(result)); }
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invoked.toLowerCase()) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
