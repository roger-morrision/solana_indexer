import fs from "node:fs";
import path from "node:path";

export function isInvokedFile(invoked, moduleFile, realpath = fs.realpathSync.native) {
  if (!invoked || !moduleFile) return false;
  try { return realpath(path.resolve(invoked)).toLowerCase() === realpath(path.resolve(moduleFile)).toLowerCase(); }
  catch { return path.resolve(invoked).toLowerCase() === path.resolve(moduleFile).toLowerCase(); }
}
