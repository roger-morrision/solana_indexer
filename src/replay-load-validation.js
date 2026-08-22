#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseBlock } from "./parser.js";
import { IndexStore } from "./store.js";

function canonicalJson(value) { if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function digest(value) { return crypto.createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function positiveInt(value, field, maximum) { if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new Error(`${field} must be an integer from 1 to ${maximum}`); return value; }
function replayInput(template, index, previousBlockhash, replacement = false) {
  const input = structuredClone(template), slot = template.slot + index, suffix = replacement ? `${index}-replacement` : String(index); input.slot = slot; input.parentSlot = slot - 1; input.previousBlockhash = previousBlockhash; input.blockhash = `load-block-${suffix}`; input.blockTime = template.blockTime + index;
  for (let transactionIndex = 0; transactionIndex < input.transactions.length; transactionIndex++) { const signature = `load-signature-${suffix}-${transactionIndex}`; input.transactions[transactionIndex].transaction.signatures[0] = signature; }
  for (let eventIndex = 0; eventIndex < (input.dexEvents ?? []).length; eventIndex++) input.dexEvents[eventIndex].signature = `load-signature-${suffix}-${eventIndex % input.transactions.length}`;
  return input;
}

export async function runReplayLoadValidation(template, { blocks = 10_000, duplicateEvery = 100, replaceEvery = 250, maxHeapDeltaBytes = 512 * 1024 * 1024, minimumBlocksPerSecond = 0 } = {}) {
  positiveInt(blocks, "blocks", 1_000_000); positiveInt(duplicateEvery, "duplicateEvery", 1_000_000); positiveInt(replaceEvery, "replaceEvery", 1_000_000); if (!Number.isSafeInteger(maxHeapDeltaBytes) || maxHeapDeltaBytes < 1 || !Number.isFinite(minimumBlocksPerSecond) || minimumBlocksPerSecond < 0) throw new Error("invalid replay load thresholds");
  if (!template || !Number.isSafeInteger(template.slot) || !Number.isSafeInteger(template.blockTime) || !Array.isArray(template.transactions) || !template.transactions.length) throw new Error("load template must contain a canonical block with transactions");
  const store = new IndexStore("unused", Math.max(1_000, blocks * template.transactions.length + 1), null), startedHeap = process.memoryUsage().heapUsed, started = process.hrtime.bigint(); await store.load(); let previousBlockhash = template.previousBlockhash, duplicates = 0, replacements = 0;
  for (let index = 0; index < blocks; index++) {
    const input = replayInput(template, index, previousBlockhash), parsed = parseBlock(input), result = store.apply(parsed); if (!result.inserted) throw new Error(`load block ${index} was not inserted`); previousBlockhash = input.blockhash;
    if ((index + 1) % duplicateEvery === 0) { const duplicate = store.apply(parseBlock(input)); if (duplicate.inserted || duplicate.updated) throw new Error(`load duplicate ${index} mutated canonical state`); duplicates++; }
    if ((index + 1) % replaceEvery === 0) { const replacementInput = replayInput(template, index, input.previousBlockhash, true), replacement = store.apply(parseBlock(replacementInput)); if (!replacement.inserted || replacement.reason !== "replaced") throw new Error(`load replacement ${index} did not execute reorg correction`); previousBlockhash = replacementInput.blockhash; replacements++; }
  }
  const elapsedNs = process.hrtime.bigint() - started, elapsedMs = Number(elapsedNs) / 1_000_000, blocksPerSecond = blocks / (elapsedMs / 1_000), heapDeltaBytes = process.memoryUsage().heapUsed - startedHeap, stats = store.stats();
  if (stats.blocks !== blocks || stats.transactions !== blocks * template.transactions.length || store.state.reorgCorrections.length !== Math.min(10_000, replacements) || store.state.eventSequence !== blocks + replacements) throw new Error("replay load canonical-count invariant failed");
  if (heapDeltaBytes > maxHeapDeltaBytes) throw new Error(`replay load heap delta ${heapDeltaBytes} exceeded ${maxHeapDeltaBytes}`); if (blocksPerSecond < minimumBlocksPerSecond) throw new Error(`replay load throughput ${blocksPerSecond.toFixed(2)} below ${minimumBlocksPerSecond}`);
  const stateDigest = digest({ tip: stats.tip, counts: { blocks: stats.blocks, transactions: stats.transactions, instructions: stats.instructions, transfers: stats.transfers, balanceChanges: stats.balanceChanges, swaps: stats.swaps, pools: stats.pools, reorgCorrections: stats.reorgCorrections }, blockhashes: Object.entries(store.state.blocks).sort(([left], [right]) => Number(left) - Number(right)).map(([slot, row]) => [slot, row.blockhash]), eventSequence: store.state.eventSequence });
  return { schemaVersion: 1, kind: "synthetic_replay_load_validation", blocks, duplicates, replacements, elapsedMs: Math.round(elapsedMs * 100) / 100, blocksPerSecond: Math.round(blocksPerSecond * 100) / 100, heapDeltaBytes, maxHeapDeltaBytes, minimumBlocksPerSecond, stateDigest, invariants: { canonicalCounts: true, duplicateIdempotency: true, replacementCorrections: true, boundedHeapDelta: true, throughput: true } };
}

async function main() { const fixtureFlag = process.argv.indexOf("--fixture"), blocksFlag = process.argv.indexOf("--blocks"); if (fixtureFlag < 0 || !process.argv[fixtureFlag + 1]) throw new Error("usage: replay-load-validation.js --fixture <canonical-block.json> [--blocks N]"); const filename = path.resolve(process.argv[fixtureFlag + 1]), blocks = blocksFlag >= 0 ? Number(process.argv[blocksFlag + 1]) : 10_000, template = JSON.parse(await fs.readFile(filename, "utf8")); console.log(JSON.stringify(await runReplayLoadValidation(template, { blocks })) ); }
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : ""; if (fileURLToPath(import.meta.url).toLowerCase() === invokedFile.toLowerCase()) main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
