import fs from "node:fs/promises";

export async function readBoundedDirectoryNames(directory, { maximumEntries = 100_000, missing = [] } = {}) {
  if (!Number.isSafeInteger(maximumEntries) || maximumEntries < 1 || maximumEntries > 1_000_000) throw new Error("directory entry limit must be an integer from 1 through 1000000");
  let before;
  try { before = await fs.lstat(directory); }
  catch (error) { if (error.code === "ENOENT") return missing; throw error; }
  if (!before.isDirectory() || before.isSymbolicLink()) throw new Error("directory source must be a non-link directory");
  let handle;
  try {
    handle = await fs.opendir(directory); const names = [];
    while (true) {
      const entry = await handle.read(); if (entry == null) break;
      if (names.length >= maximumEntries) throw new Error(`directory exceeds ${maximumEntries} entries`);
      names.push(entry.name);
    }
    const after = await fs.lstat(directory);
    if (!after.isDirectory() || after.isSymbolicLink() || after.dev !== before.dev || after.ino !== before.ino) throw new Error("directory source changed during enumeration");
    return names;
  } finally { await handle?.close().catch(() => {}); }
}
