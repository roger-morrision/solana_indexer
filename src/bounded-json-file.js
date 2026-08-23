import fs from "node:fs/promises";

export const MAX_OPERATIONAL_JSON_BYTES = 1_048_576;

export async function readBoundedFile(filename, { maximumBytes = MAX_OPERATIONAL_JSON_BYTES, missing = null } = {}) {
  if (!filename) return missing;
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) throw new Error("maximum file size must be a positive safe integer");
  try {
    const before = await fs.lstat(filename);
    if (!before.isFile() || before.isSymbolicLink() || !Number.isSafeInteger(before.size) || before.size < 1 || before.size > maximumBytes) return { evidenceReadError: "invalid_file" };
    const content = await fs.readFile(filename);
    if (content.length !== before.size) return { evidenceReadError: "changed_during_read" };
    const after = await fs.lstat(filename);
    if (!after.isFile() || after.isSymbolicLink() || after.size !== before.size || after.dev !== before.dev || after.ino !== before.ino || after.mtimeMs !== before.mtimeMs) return { evidenceReadError: "changed_during_read" };
    return content;
  } catch (error) {
    if (error.code === "ENOENT") return missing;
    return { evidenceReadError: "read_failed" };
  }
}

export async function readBoundedJsonFile(filename, options = {}) {
  const content = await readBoundedFile(filename, options);
  if (content == null || !Buffer.isBuffer(content)) return content;
  try { return JSON.parse(content.toString("utf8")); }
  catch { return { evidenceReadError: "invalid_json" }; }
}
