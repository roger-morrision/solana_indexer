import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parseBlock, parseInput } from "./parser.js";

async function fingerprint(filename) {
  const stat = await fs.stat(filename);
  return crypto.createHash("sha256").update(`${stat.size}:${stat.mtimeMs}`).digest("hex");
}

export async function indexInbox(config, store) {
  await store.load(); await fs.mkdir(config.inbox, { recursive: true });
  const names = (await fs.readdir(config.inbox)).filter((name) => /\.(?:json|ndjson)$/i.test(name)).sort();
  const result = { files: 0, blocks: 0, transactions: 0, transfers: 0, skippedFiles: 0, errors: [] };
  for (const name of names) {
    const filename = path.join(config.inbox, name);
    try {
      const hash = await fingerprint(filename);
      if (store.hasFile(name, hash)) { result.skippedFiles++; continue; }
      const inputs = parseInput(await fs.readFile(filename, "utf8"), name);
      for (const input of inputs) {
        const block = parseBlock(input); const applied = store.apply(block);
        if (applied.inserted) { result.blocks++; result.transactions += block.transactions.length; result.transfers += block.transfers.length; }
      }
      store.markFile(name, hash); result.files++;
    } catch (error) { result.errors.push({ file: name, error: error.message }); }
  }
  if (result.files || result.blocks) await store.save();
  return result;
}

export function watchInbox(config, store, onCycle = () => {}) {
  let stopped = false, running = false;
  const cycle = async () => { if (running || stopped) return; running = true; try { onCycle(await indexInbox(config, store)); } catch (error) { onCycle({ errors: [{ error: error.message }] }); } finally { running = false; } };
  void cycle(); const timer = setInterval(cycle, config.pollMs);
  return () => { stopped = true; clearInterval(timer); };
}
