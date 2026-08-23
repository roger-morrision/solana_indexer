import { readBoundedFile } from "./bounded-json-file.js";

export const MAX_SECRET_FILE_BYTES = 4_096;

export async function readSecretFile(filename, label = "secret", { maximumBytes = MAX_SECRET_FILE_BYTES } = {}) {
  if (!filename) throw new Error(`${label} file is required`);
  const content = await readBoundedFile(filename, { maximumBytes, missing: null });
  if (content == null) throw new Error(`${label} file is unavailable`);
  if (!Buffer.isBuffer(content)) throw new Error(`${label} file is unsafe: ${content.evidenceReadError}`);
  const value = content.toString("utf8").trim();
  if (!value) throw new Error(`${label} file is empty`);
  if (value.includes("\0") || /[\r\n]/.test(value)) throw new Error(`${label} file must contain one credential`);
  return value;
}
