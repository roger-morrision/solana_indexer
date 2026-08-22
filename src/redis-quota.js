import crypto from "node:crypto";
import net from "node:net";

const SCRIPT = "local count=redis.call('INCR',KEYS[1]); if count==1 then redis.call('PEXPIRE',KEYS[1],ARGV[2]) end; local ttl=redis.call('PTTL',KEYS[1]); return {count,ttl}";

function resp(parts) { const chunks = [Buffer.from(`*${parts.length}\r\n`)]; for (const part of parts) { const value = Buffer.from(String(part)); chunks.push(Buffer.from(`$${value.length}\r\n`), value, Buffer.from("\r\n")); } return Buffer.concat(chunks); }

function parseOne(buffer, offset = 0) {
  if (offset >= buffer.length) return null; const end = buffer.indexOf("\r\n", offset); if (end < 0) return null; const type = String.fromCharCode(buffer[offset]), header = buffer.subarray(offset + 1, end).toString(), next = end + 2;
  if (type === "+") return { value: header, next }; if (type === "-") throw new Error(`Redis quota error: ${header.slice(0, 160)}`); if (type === ":") { const value = Number(header); if (!Number.isSafeInteger(value)) throw new Error("invalid Redis quota integer"); return { value, next }; }
  if (type === "$") { const length = Number(header); if (!Number.isInteger(length) || length < -1) throw new Error("invalid Redis quota bulk length"); if (length === -1) return { value: null, next }; if (buffer.length < next + length + 2) return null; if (buffer[next + length] !== 13 || buffer[next + length + 1] !== 10) throw new Error("invalid Redis quota bulk terminator"); return { value: buffer.subarray(next, next + length).toString(), next: next + length + 2 }; }
  if (type === "*") { const length = Number(header); if (!Number.isInteger(length) || length < 0) throw new Error("invalid Redis quota array length"); const value = []; let cursor = next; for (let index = 0; index < length; index++) { const item = parseOne(buffer, cursor); if (!item) return null; value.push(item.value); cursor = item.next; } return { value, next: cursor }; }
  throw new Error("invalid Redis quota response");
}

export function compileRedisQuotaRequest(identity, window, windowMs, password = null) {
  if (typeof identity !== "string" || !identity || !Number.isSafeInteger(window) || window < 0 || !Number.isInteger(windowMs) || windowMs < 1_000 || (password != null && (typeof password !== "string" || !password))) throw new Error("invalid Redis quota request");
  const identityHash = crypto.createHash("sha256").update(identity).digest("hex"), key = `terminal_dex:quota:${window}:${identityHash}`, commands = []; if (password) commands.push(resp(["AUTH", password])); commands.push(resp(["EVAL", SCRIPT, 1, key, window, windowMs])); return { payload: Buffer.concat(commands), expectedReplies: commands.length, identityHash };
}

export function createRedisQuotaAdmitter({ host = "127.0.0.1", port = 6379, password = null, timeoutMs = 250 } = {}, connect = net.createConnection) {
  if (!(["127.0.0.1", "::1", "localhost"].includes(host)) || !Number.isInteger(port) || port < 1 || port > 65_535 || !Number.isInteger(timeoutMs) || timeoutMs < 10 || timeoutMs > 5_000) throw new Error("Redis quota endpoint must be bounded and loopback-only");
  return (identity, limit, now = Date.now()) => new Promise((resolve, reject) => {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100_000 || !Number.isFinite(now) || now < 0) return reject(new Error("invalid Redis quota admission"));
    const windowMs = 60_000, window = Math.floor(now / windowMs), request = compileRedisQuotaRequest(identity, window, windowMs, password); let buffer = Buffer.alloc(0), replies = 0, settled = false;
    const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); socket.destroy(); error ? reject(error) : resolve(value); };
    const socket = connect({ host, port }); const timer = setTimeout(() => finish(new Error("Redis quota timeout")), timeoutMs); timer.unref?.();
    socket.once("error", (error) => finish(error)); socket.once("connect", () => { try { socket.write(request.payload); } catch (error) { finish(error); } }); socket.on("data", (chunk) => { try { buffer = Buffer.concat([buffer, chunk]); if (buffer.length > 4_096) throw new Error("Redis quota response exceeds limit"); let parsed; while ((parsed = parseOne(buffer))) { buffer = buffer.subarray(parsed.next); replies++; if (replies === request.expectedReplies) { const value = parsed.value; if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isSafeInteger) || value[0] < 1 || value[1] < 0 || value[1] > windowMs) throw new Error("invalid Redis quota admission response"); return finish(null, { count: value[0], remaining: Math.max(0, limit - value[0]), retryAfterSeconds: Math.max(1, Math.ceil(value[1] / 1_000)), window }); } } } catch (error) { finish(error); } });
  });
}
