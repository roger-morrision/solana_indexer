import { constants } from "node:fs";
import fs from "node:fs/promises";

export const MAX_OPERATIONAL_JSON_BYTES = 1_048_576;

export function decodeUtf8(content) {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(content); }
  catch { throw new SyntaxError("content is not valid UTF-8"); }
}

export async function readBoundedFile(filename, { maximumBytes = MAX_OPERATIONAL_JSON_BYTES, missing = null, allowEmpty = false } = {}) {
  if (!filename) return missing;
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1 || typeof allowEmpty !== "boolean") throw new Error("maximum file size and empty-file policy are invalid");
  let handle, observed = false;
  try {
    const before = await fs.lstat(filename);
    observed = true;
    if (!before.isFile() || before.isSymbolicLink() || !Number.isSafeInteger(before.size) || before.size < (allowEmpty ? 0 : 1) || before.size > maximumBytes) return { evidenceReadError: "invalid_file" };
    handle = await fs.open(filename, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const opened = await handle.stat();
    if (!opened.isFile() || opened.size !== before.size || opened.dev !== before.dev || opened.ino !== before.ino || opened.mtimeMs !== before.mtimeMs) return { evidenceReadError: "changed_during_read" };
    const content = Buffer.allocUnsafe(before.size);
    for (let offset = 0; offset < content.length;) { const { bytesRead } = await handle.read(content, offset, content.length - offset, offset); if (bytesRead === 0) return { evidenceReadError: "changed_during_read" }; offset += bytesRead; }
    if ((await handle.read(Buffer.allocUnsafe(1), 0, 1, before.size)).bytesRead !== 0) return { evidenceReadError: "changed_during_read" };
    const afterRead = await handle.stat();
    const after = await fs.lstat(filename);
    if (!afterRead.isFile() || afterRead.size !== before.size || afterRead.dev !== before.dev || afterRead.ino !== before.ino || afterRead.mtimeMs !== before.mtimeMs || !after.isFile() || after.isSymbolicLink() || after.size !== before.size || after.dev !== before.dev || after.ino !== before.ino || after.mtimeMs !== before.mtimeMs) return { evidenceReadError: "changed_during_read" };
    return content;
  } catch (error) {
    if (error.code === "ENOENT") return observed ? { evidenceReadError: "changed_during_read" } : missing;
    return { evidenceReadError: "read_failed" };
  } finally { await handle?.close().catch(() => {}); }
}

export async function readBoundedJsonFile(filename, options = {}) {
  const content = await readBoundedFile(filename, options);
  if (content == null || !Buffer.isBuffer(content)) return content;
  try { return JSON.parse(decodeUtf8(content)); }
  catch { return { evidenceReadError: "invalid_json" }; }
}
