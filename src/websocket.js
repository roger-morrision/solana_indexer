import crypto from "node:crypto";
import { isUtf8 } from "node:buffer";

function frame(opcode, payload = Buffer.alloc(0)) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  if (body.length < 126) return Buffer.concat([Buffer.from([0x80 | opcode, body.length]), body]);
  if (body.length <= 65_535) { const header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(body.length, 2); return Buffer.concat([header, body]); }
  const header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(body.length), 2); return Buffer.concat([header, body]);
}
function reject(socket, status, reason) { socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: ${Buffer.byteLength(reason)}\r\n\r\n${reason}`); }
function close(socket, code) { const payload = Buffer.alloc(2); payload.writeUInt16BE(code); socket.end(frame(0x8, payload)); }
function closePayloadError(payload) {
  if (payload.length === 0) return null;
  if (payload.length === 1) return 1002;
  const code = payload.readUInt16BE(0), validCode = code >= 1000 && code <= 1014 && ![1004, 1005, 1006].includes(code) || code >= 3000 && code <= 4999;
  if (!validCode) return 1002;
  return isUtf8(payload.subarray(2)) ? null : 1007;
}
export function createInboundFrameParser(socket, maximumBytes = 4_096, onProtocolClose = () => {}) {
  let buffered = Buffer.alloc(0), closed = false;
  const protocolError = (code = 1002) => { if (!closed) { closed = true; onProtocolClose(code); close(socket, code); } };
  return (chunk) => {
    if (closed || !Buffer.isBuffer(chunk) || chunk.length === 0) return;
    buffered = Buffer.concat([buffered, chunk]);
    while (!closed && buffered.length >= 2) {
      const first = buffered[0], second = buffered[1], fin = Boolean(first & 0x80), opcode = first & 0x0f, masked = Boolean(second & 0x80); let length = second & 0x7f, offset = 2;
      if (first & 0x70 || !masked) return protocolError();
      if (length === 126) { if (buffered.length < 4) return; length = buffered.readUInt16BE(2); offset = 4; }
      else if (length === 127) { if (buffered.length < 10) return; const wide = buffered.readBigUInt64BE(2); if (wide > BigInt(Number.MAX_SAFE_INTEGER)) return protocolError(1009); length = Number(wide); offset = 10; }
      const control = opcode >= 0x8; if (length > maximumBytes) return protocolError(1009); if (control && (!fin || length > 125) || ![0x8, 0x9, 0xa].includes(opcode)) return protocolError(control ? 1002 : 1003);
      if (buffered.length < offset + 4 + length) return;
      const mask = buffered.subarray(offset, offset + 4), payload = Buffer.from(buffered.subarray(offset + 4, offset + 4 + length)); for (let index = 0; index < payload.length; index++) payload[index] ^= mask[index % 4]; buffered = buffered.subarray(offset + 4 + length);
      if (opcode === 0x8) { const errorCode = closePayloadError(payload); if (errorCode) return protocolError(errorCode); closed = true; socket.end(frame(0x8, payload)); }
      else if (opcode === 0x9) socket.write(frame(0x0a, payload));
    }
  };
}
function send(socket, value, maximumBufferedBytes, onEviction = () => {}) {
  if (socket.destroyed) return false;
  const message = frame(0x1, JSON.stringify(value));
  if (message.length > maximumBufferedBytes || socket.writableLength + message.length > maximumBufferedBytes) { onEviction(); socket.end(frame(0x8, Buffer.from([0x03, 0xf5]))); return false; }
  socket.write(message); return true;
}
function subscription(url) {
  const topic = url.searchParams.get("topic") ?? "blocks";
  if (!new Set(["blocks", "swaps", "lifecycle", "snapshots"]).has(topic)) return null;
  return { topic, mint: url.searchParams.get("mint"), pool: url.searchParams.get("pool"), protocol: url.searchParams.get("protocol"), eventType: url.searchParams.get("eventType") };
}
export function validWebSocketHandshake(request) {
  const key = request.headers?.["sec-websocket-key"], connection = String(request.headers?.connection ?? "").split(",").map((value) => value.trim().toLowerCase());
  if (request.method !== "GET" || String(request.headers?.upgrade ?? "").toLowerCase() !== "websocket" || !connection.includes("upgrade") || request.headers?.["sec-websocket-version"] !== "13" || typeof key !== "string" || !/^[A-Za-z0-9+/]{22}==$/.test(key)) return false;
  try { return Buffer.from(key, "base64").length === 16 && Buffer.from(key, "base64").toString("base64") === key; } catch { return false; }
}
const SNAPSHOT_PROTOCOLS = new Map([
  ["cpmm_pool_snapshot_applied", "raydium-cpmm"], ["pump_swap_pool_snapshot_applied", "pump-swap"], ["pump_bonding_curve_snapshot_applied", "pump-bonding-curve"],
  ["clmm_pool_snapshot_applied", "raydium-clmm"], ["orca_pool_snapshot_applied", "orca-whirlpool"], ["meteora_dlmm_pool_snapshot_applied", "meteora-dlmm"],
]);
const MINT_SNAPSHOT_TYPES = new Set(["account_snapshot_applied", "offchain_metadata_snapshot_applied"]);
export function projectWebSocketEvent(event, filter) {
  if (filter.topic === "blocks") return event.type.startsWith("block_") ? event : null;
  if (filter.topic === "snapshots") {
    if (filter.eventType && event.type !== filter.eventType) return null;
    if (MINT_SNAPSHOT_TYPES.has(event.type)) { if (filter.pool || filter.protocol) return null; const mints = (event.mints ?? []).filter((row) => !filter.mint || row.mint === filter.mint); return mints.length ? { ...event, mints } : null; }
    const protocol = SNAPSHOT_PROTOCOLS.get(event.type); if (!protocol || filter.mint || filter.protocol && filter.protocol !== protocol) return null; const pools = (event.pools ?? []).filter((row) => !filter.pool || row.pool === filter.pool); return pools.length ? { ...event, protocol, pools } : null;
  }
  if (filter.topic === "lifecycle") {
    const lifecycleEvents = (event.lifecycleEvents ?? []).filter((item) => (!filter.mint || item.tokenMint0 === filter.mint || item.tokenMint1 === filter.mint) && (!filter.pool || item.pool === filter.pool || item.sourcePool === filter.pool) && (!filter.protocol || item.protocol === filter.protocol || item.destinationProtocol === filter.protocol) && (!filter.eventType || item.type === filter.eventType));
    const revertedLifecycleEvents = (event.revertedLifecycleEvents ?? []).filter((item) => (!filter.mint || item.tokenMint0 === filter.mint || item.tokenMint1 === filter.mint) && (!filter.pool || item.pool === filter.pool || item.sourcePool === filter.pool) && (!filter.protocol || item.protocol === filter.protocol || item.destinationProtocol === filter.protocol) && (!filter.eventType || item.type === filter.eventType));
    return lifecycleEvents.length || revertedLifecycleEvents.length ? { type: "lifecycle", sequence: event.sequence, slot: event.slot, blockhash: event.blockhash, blockTime: event.blockTime, provenance: event.provenance, lifecycleEvents, revertedLifecycleEvents } : null;
  }
  const swaps = (event.swaps ?? []).filter((swap) => (!filter.mint || swap.inputMint === filter.mint || swap.outputMint === filter.mint) && (!filter.pool || swap.pool === filter.pool) && (!filter.protocol || swap.protocol === filter.protocol));
  const revertedSwaps = (event.revertedSwaps ?? []).filter((swap) => (!filter.mint || swap.inputMint === filter.mint || swap.outputMint === filter.mint) && (!filter.pool || swap.pool === filter.pool) && (!filter.protocol || swap.protocol === filter.protocol));
  return swaps.length || revertedSwaps.length ? { type: "swaps", sequence: event.sequence, slot: event.slot, blockhash: event.blockhash, blockTime: event.blockTime, provenance: event.provenance, swaps, revertedSwaps } : null;
}

export function attachWebSocket(server, store, config, authorize = () => true) {
  const clients = new Map(); const heartbeatMs = config.webSocketHeartbeatMs ?? 30_000; const maximumBufferedBytes = config.webSocketMaxBufferedBytes ?? 1_048_576; const maximumClients = config.webSocketMaxClients ?? 1_000;
  const stats = { capacityRejections: 0, slowConsumerEvictions: 0, protocolCloses: 0 }; Object.defineProperty(stats, "activeClients", { enumerable: true, get: () => clients.size }); server.webSocketStats = stats; const evicted = () => stats.slowConsumerEvictions++;
  const unsubscribe = store.subscribe((event) => { for (const [socket, filter] of clients) { const value = projectWebSocketEvent(event, filter); if (value && !send(socket, value, maximumBufferedBytes, evicted)) clients.delete(socket); } });
  server.on("upgrade", (request, socket) => {
    const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname !== "/ws") return reject(socket, "404 Not Found", "not_found");
    const filter = subscription(url); if (!filter) return reject(socket, "400 Bad Request", "invalid_topic");
    if (!authorize(request)) return reject(socket, "401 Unauthorized", "unauthorized");
    if (clients.size >= maximumClients) { stats.capacityRejections++; return reject(socket, "503 Service Unavailable", "websocket_capacity_exceeded"); }
    const key = request.headers["sec-websocket-key"];
    if (!validWebSocketHandshake(request)) return reject(socket, "400 Bad Request", "invalid_websocket_handshake");
    const cursorText = url.searchParams.get("cursor") ?? String(store.state.eventSequence); const cursor = Number(cursorText);
    if (!Number.isSafeInteger(cursor) || cursor < 0) return reject(socket, "400 Bad Request", "invalid_cursor");
    const accept = crypto.createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
    const protocols = String(request.headers["sec-websocket-protocol"] ?? "").split(",").map((value) => value.trim());
    const selectedProtocol = protocols.includes("indexer.v1") ? "Sec-WebSocket-Protocol: indexer.v1\r\n" : "";
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n${selectedProtocol}\r\n`); clients.set(socket, filter);
    const replay = store.replayEvents(cursor);
    if (replay.evidenceInvalid || replay.cursorTooOld || replay.cursorAhead) { const delivered = send(socket, { type: "resync_required", reason: replay.evidenceInvalid ? "retained_event_evidence_invalid" : replay.cursorTooOld ? "cursor_before_retained_history" : "cursor_ahead_of_server", requestedCursor: cursor, oldestCursor: replay.oldestCursor, latestCursor: replay.latestCursor }, maximumBufferedBytes, evicted); clients.delete(socket); if (delivered) socket.end(frame(0x8, Buffer.from([0x03, 0xf0]))); }
    else if (!send(socket, { type: "ready", cursor, latestCursor: replay.latestCursor, subscription: filter }, maximumBufferedBytes, evicted)) clients.delete(socket);
    else for (const event of replay.events) { const value = projectWebSocketEvent(event, filter); if (value && !send(socket, value, maximumBufferedBytes, evicted)) { clients.delete(socket); break; } }
    socket.on("data", createInboundFrameParser(socket, config.webSocketMaxInboundBytes ?? 4_096, () => stats.protocolCloses++));
    socket.on("close", () => clients.delete(socket)); socket.on("error", () => clients.delete(socket));
  });
  const timer = setInterval(() => { for (const socket of clients.keys()) { if (socket.destroyed || socket.writableLength > maximumBufferedBytes) { if (!socket.destroyed) stats.slowConsumerEvictions++; socket.destroy(); clients.delete(socket); } else socket.write(frame(0x9)); } }, heartbeatMs); timer.unref();
  let stopped = false; const closeClients = () => { if (stopped) return; stopped = true; clearInterval(timer); unsubscribe(); const payload = Buffer.alloc(2); payload.writeUInt16BE(1001); for (const socket of clients.keys()) { if (!socket.destroyed) { socket.end(frame(0x8, payload)); socket.destroySoon?.(); } } clients.clear(); }; server.closeWebSocketClients = closeClients; server.on("close", closeClients);
  return server;
}
