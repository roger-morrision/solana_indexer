const DEFAULT_MAX_RPC_RESPONSE_BYTES = 67_108_864;

function declaredLength(response, maximumBytes) {
  const value = response?.headers?.get?.("content-length");
  if (value == null) return;
  if (!/^(0|[1-9]\d*)$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error("RPC response content-length is invalid");
  if (Number(value) > maximumBytes) throw new Error("RPC response exceeds byte limit");
}

export async function readBoundedRpcJson(response, maximumBytes = DEFAULT_MAX_RPC_RESPONSE_BYTES) {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1_024 || maximumBytes > 268_435_456) throw new Error("RPC response byte limit must be an integer from 1024 through 268435456");
  declaredLength(response, maximumBytes);
  let bytes;
  if (response?.body?.getReader) {
    const reader = response.body.getReader(), chunks = []; let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        if (!(value instanceof Uint8Array)) throw new Error("RPC response stream chunk is invalid");
        length += value.byteLength; if (length > maximumBytes) { await reader.cancel(); throw new Error("RPC response exceeds byte limit"); } chunks.push(value);
      }
    } finally { reader.releaseLock?.(); }
    bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), length);
  } else if (typeof response?.arrayBuffer === "function") {
    bytes = Buffer.from(await response.arrayBuffer()); if (bytes.length > maximumBytes) throw new Error("RPC response exceeds byte limit");
  } else if (typeof response?.text === "function") {
    const text = await response.text(); bytes = Buffer.from(text); if (bytes.length > maximumBytes) throw new Error("RPC response exceeds byte limit");
  } else if (typeof response?.json === "function") {
    // Test doubles may expose only json(); real Fetch responses always take a
    // byte-bounded branch above.
    return response.json();
  } else throw new Error("RPC response body is unavailable");
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch { throw new Error("RPC response JSON is invalid"); }
}

export { DEFAULT_MAX_RPC_RESPONSE_BYTES };
