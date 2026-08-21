import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parseBlock, parseInput } from "./parser.js";

function fingerprint(content) { return crypto.createHash("sha256").update(content).digest("hex"); }

export async function indexInbox(config, store) {
  await store.load(); await fs.mkdir(config.inbox, { recursive: true });
  const names = (await fs.readdir(config.inbox)).filter((name) => /\.(?:json|ndjson)$/i.test(name)).sort((a, b) => { const left = Number(a.match(/^(\d+)/)?.[1]), right = Number(b.match(/^(\d+)/)?.[1]); return Number.isSafeInteger(left) && Number.isSafeInteger(right) && left !== right ? left - right : a.localeCompare(b); });
  const result = { files: 0, blocks: 0, transactions: 0, transfers: 0, balanceChanges: 0, swaps: 0, skippedFiles: 0, resolvedDeadLetters: 0, errors: [] };
  for (const name of names) {
    const filename = path.join(config.inbox, name); let hash = null;
    try {
      const content = await fs.readFile(filename);
      hash = fingerprint(content);
      if (store.hasFile(name, hash)) { result.resolvedDeadLetters += store.resolveDeadLetters(name, hash); result.skippedFiles++; continue; }
      const inputs = parseInput(content.toString("utf8"), name);
      for (const input of inputs) {
        const block = parseBlock(input); const applied = store.apply(block);
        if (applied.inserted) { result.blocks++; result.transactions += block.transactions.length; result.transfers += block.transfers.length; result.balanceChanges += block.balanceChanges.length; result.swaps += block.swaps.length; }
      }
      result.resolvedDeadLetters += store.markFile(name, hash); result.files++;
    } catch (error) { store.recordDeadLetter(name, hash, error.message); result.errors.push({ file: name, error: error.message }); }
  }
  if (result.files || result.blocks || result.resolvedDeadLetters || result.errors.length) await store.save();
  return result;
}

export function watchInbox(config, store, onCycle = () => {}) {
  let stopped = false, running = false;
  const cycle = async () => { if (running || stopped) return; running = true; try { onCycle(await indexInbox(config, store)); } catch (error) { onCycle({ errors: [{ error: error.message }] }); } finally { running = false; } };
  void cycle(); const timer = setInterval(cycle, config.pollMs);
  return () => { stopped = true; clearInterval(timer); };
}
