import fs from "node:fs/promises";

export const MAX_OPERATIONAL_JSON_BYTES = 1_048_576;

export async function readBoundedJsonFile(filename, { maximumBytes = MAX_OPERATIONAL_JSON_BYTES, missing = null } = {}) {
  if (!filename) return missing;
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) throw new Error("maximum JSON file size must be a positive safe integer");
  try {
    const before = await fs.lstat(filename);
    if (!before.isFile() || before.isSymbolicLink() || !Number.isSafeInteger(before.size) || before.size < 1 || before.size > maximumBytes) return { evidenceReadError: "invalid_file" };
    const content = await fs.readFile(filename);
    if (content.length !== before.size) return { evidenceReadError: "changed_during_read" };
    const after = await fs.lstat(filename);
    if (!after.isFile() || after.isSymbolicLink() || after.size !== before.size || after.dev !== before.dev || after.ino !== before.ino || after.mtimeMs !== before.mtimeMs) return { evidenceReadError: "changed_during_read" };
    return JSON.parse(content.toString("utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return missing;
    return { evidenceReadError: error instanceof SyntaxError ? "invalid_json" : "read_failed" };
  }
}
