#!/usr/bin/env node
import process from "node:process";
import { loadConfig } from "./config.js";
import { indexInbox, watchInbox } from "./indexer.js";
import { createServer } from "./server.js";
import { IndexStore } from "./store.js";

const config = loadConfig(); const store = new IndexStore(config.dataFile, config.maxTransactions); const command = process.argv[2] || "serve";
await store.load();
if (command === "index") { console.log(JSON.stringify(await indexInbox(config, store), null, 2)); }
else if (command === "status") { console.log(JSON.stringify(store.stats(), null, 2)); }
else if (["serve", "watch"].includes(command)) {
  const stopWatching = watchInbox(config, store, (result) => { if (result.blocks || result.errors?.length) console.log(JSON.stringify({ event: "index_cycle", ...result })); });
  let server;
  if (command === "serve") server = createServer(config, store).listen(config.port, config.host, () => console.log(`Solana indexer listening on http://${config.host}:${config.port}`));
  const shutdown = () => { stopWatching(); server?.close(() => process.exit(0)); if (!server) process.exit(0); };
  process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown);
} else { console.error("Usage: node src/cli.js <serve|watch|index|status>"); process.exitCode = 2; }
