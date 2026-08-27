import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { readBoundedFile } from "./bounded-json-file.js";

const WINDOWS_DIRECTORY_SYNC_ERRORS = new Set(["EBADF", "EINVAL", "EISDIR", "EPERM"]);
const WINDOWS_RENAME_RETRY_ERRORS = new Set(["EACCES", "EBUSY", "EPERM"]);
const WINDOWS_RENAME_ATTEMPTS = 8;
const MAX_DURABLE_REWRITE_BYTES = 64 * 1_024 * 1_024;
const pendingWrites = new Map();

function enqueue(filename, operation) {
  const prior = pendingWrites.get(filename) ?? Promise.resolve(), current = prior.catch(() => {}).then(operation);
  pendingWrites.set(filename, current);
  return current.finally(() => { if (pendingWrites.get(filename) === current) pendingWrites.delete(filename); });
}

async function syncParentDirectory(directory) {
  let handle;
  try {
    handle = await fs.open(directory, "r");
    await handle.sync();
  } catch (error) {
    if (process.platform !== "win32" || !WINDOWS_DIRECTORY_SYNC_ERRORS.has(error.code)) throw error;
  } finally {
    await handle?.close();
  }
}

async function replaceFile(temporary, filename) {
  for (let attempt = 0; ; attempt++) {
    try { await fs.rename(temporary, filename); return; }
    catch (error) {
      if (process.platform !== "win32" || !WINDOWS_RENAME_RETRY_ERRORS.has(error.code) || attempt + 1 >= WINDOWS_RENAME_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.min(5 * 2 ** attempt, 100)));
    }
  }
}

async function writeDurably(filename, data, mode) {
  const directory = path.dirname(filename), temporary = `${filename}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.mkdir(directory, { recursive: true });
  let handle;
  try {
    handle = await fs.open(temporary, "wx", mode);
    await handle.writeFile(data);
    await handle.sync();
    await handle.close();
    handle = null;
    await replaceFile(temporary, filename);
    await syncParentDirectory(directory);
  } catch (error) {
    await handle?.close().catch(() => {});
    await fs.rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
}

export function durableAtomicWrite(filename, data, { mode = 0o600 } = {}) {
  if (typeof filename !== "string" || !filename || (!Buffer.isBuffer(data) && typeof data !== "string") || !Number.isInteger(mode) || mode < 0 || mode > 0o777) return Promise.reject(new Error("invalid durable atomic write"));
  return enqueue(filename, () => writeDurably(filename, data, mode));
}

export function durableAtomicRewriteIfUnchanged(filename, expectedSha256, data, { mode = 0o600, maximumBytes = MAX_DURABLE_REWRITE_BYTES } = {}) {
  if (typeof filename !== "string" || !filename || !/^[0-9a-f]{64}$/.test(expectedSha256 ?? "") || (!Buffer.isBuffer(data) && typeof data !== "string") || !Number.isInteger(mode) || mode < 0 || mode > 0o777 || !Number.isSafeInteger(maximumBytes) || maximumBytes < 1) return Promise.reject(new Error("invalid content-bound atomic rewrite"));
  return enqueue(filename, async () => {
    const current = await readBoundedFile(filename, { maximumBytes }), actualSha256 = Buffer.isBuffer(current) ? crypto.createHash("sha256").update(current).digest("hex") : null;
    if (!Buffer.isBuffer(current)) throw new Error(`durable rewrite source is unavailable: ${current?.evidenceReadError ?? "missing"}`);
    if (actualSha256 !== expectedSha256) throw new Error("durable rewrite source changed");
    await writeDurably(filename, data, mode);
  });
}

async function writeDirect(filename, data, mode, flags) {
  const directory = path.dirname(filename); await fs.mkdir(directory, { recursive: true }); const handle = await fs.open(filename, flags, mode);
  try { await handle.writeFile(data); await handle.sync(); } finally { await handle.close(); }
  await syncParentDirectory(directory);
}

export function durableAppendFile(filename, data, { mode = 0o600 } = {}) {
  if (typeof filename !== "string" || !filename || (!Buffer.isBuffer(data) && typeof data !== "string") || !Number.isInteger(mode) || mode < 0 || mode > 0o777) return Promise.reject(new Error("invalid durable append"));
  return enqueue(filename, () => writeDirect(filename, data, mode, "a"));
}

export function durableExclusiveWrite(filename, data, { mode = 0o600 } = {}) {
  if (typeof filename !== "string" || !filename || (!Buffer.isBuffer(data) && typeof data !== "string") || !Number.isInteger(mode) || mode < 0 || mode > 0o777) return Promise.reject(new Error("invalid durable exclusive write"));
  return enqueue(filename, () => writeDirect(filename, data, mode, "wx"));
}
