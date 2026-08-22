import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const WINDOWS_DIRECTORY_SYNC_ERRORS = new Set(["EBADF", "EINVAL", "EISDIR", "EPERM"]);
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
    await fs.rename(temporary, filename);
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
