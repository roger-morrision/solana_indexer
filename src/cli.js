#!/usr/bin/env node
import process from "node:process";
import { loadConfig } from "./config.js";
import { indexInbox, watchInbox } from "./indexer.js";
import { createServer } from "./server.js";
import { IndexStore } from "./store.js";
import { loadHolderExclusions } from "./holder-exclusions.js";
import { loadApiTenants } from "./api-tenants.js";
import { createRedisQuotaAdmitter } from "./redis-quota.js";
import { loadUsdDepegReference, watchUsdDepegReference } from "./usd-depeg-reference.js";
import { shutdownIndexer } from "./graceful-shutdown.js";
import { readSecretFile } from "./secret-file.js";

const config = loadConfig(), holderExclusions = await loadHolderExclusions(config.holderExclusionsFile), usdDepegReference = await loadUsdDepegReference(config.usdDepegReferenceFile), apiTenants = await loadApiTenants(config.apiTenantsFile); config.apiTenants = apiTenants; if (config.distributedQuotaEnabled) { if (!config.redisPasswordFile) throw new Error("REDIS_PASSWORD_FILE is required for distributed quota admission"); const password = await readSecretFile(config.redisPasswordFile, "REDIS_PASSWORD_FILE"); config.quotaAdmitter = createRedisQuotaAdmitter({ host: config.redisHost, port: config.redisPort, password, timeoutMs: config.redisQuotaTimeoutMs }); } const store = new IndexStore(config.dataFile, config.maxTransactions, config.retentionSeconds, holderExclusions, usdDepegReference, config.usdcMaxDeviationBasisPoints, config.maxStateFileBytes); const command = process.argv[2] || "serve";
await store.load();
if (command === "index") { console.log(JSON.stringify(await indexInbox(config, store), null, 2)); }
else if (command === "status") { console.log(JSON.stringify({ ...store.stats(), structure: store.structureQuality(), health: store.health(config.staleAfterMs) }, null, 2)); }
else if (["serve", "watch"].includes(command)) {
  const oracleWatcher = watchUsdDepegReference(config.usdDepegReferenceFile, (reference) => { store.usdDepegReference = reference; }, config.usdcOracleReloadMs, { onError: (error) => console.error(JSON.stringify({ event: "usdc_oracle_reload_failed", error: error.message })) });
  const stopWatching = watchInbox(config, store, (result) => { if (result.blocks || result.errors?.length) console.log(JSON.stringify({ event: "index_cycle", ...result })); });
  let server;
  if (command === "serve") server = createServer(config, store).listen(config.port, config.host, () => console.log(`Solana indexer listening on http://${config.host}:${config.port}`));
  let shuttingDown = false;
  const shutdown = async () => { if (shuttingDown) return; shuttingDown = true; try { await shutdownIndexer({ server, oracleWatcher, stopWatching }); process.exit(0); } catch (error) { console.error(JSON.stringify({ event: "shutdown_failed", error: error.message })); process.exit(1); } };
  process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown);
} else { console.error("Usage: node src/cli.js <serve|watch|index|status>"); process.exitCode = 2; }
