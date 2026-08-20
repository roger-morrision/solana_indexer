#!/usr/bin/env node
import process from "node:process";
import { LocalValidatorClient, MAINNET_GENESIS_HASH } from "./local-validator-exporter.js";

const client = new LocalValidatorClient(process.env.LOCAL_VALIDATOR_RPC || "http://127.0.0.1:8899");
const expectedGenesisHash = process.env.INDEXER_EXPECTED_GENESIS_HASH || MAINNET_GENESIS_HASH;
const genesisHash = await client.assertGenesis(expectedGenesisHash);
const [health, finalizedSlot, version] = await Promise.all([client.call("getHealth"), client.call("getSlot", [{ commitment: "finalized" }]), client.call("getVersion")]);
if (health !== "ok") throw new Error(`validator health is ${JSON.stringify(health)}`);
console.log(JSON.stringify({ network: expectedGenesisHash === MAINNET_GENESIS_HASH ? "mainnet-beta" : "explicit-override", genesisHash, health, finalizedSlot, version }, null, 2));
