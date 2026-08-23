import crypto from "node:crypto";
import { isUtf8 } from "node:buffer";

function frame(opcode, payload = Buffer.alloc(0)) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  if (body.length < 126) return Buffer.concat([Buffer.from([0x80 | opcode, body.length]), body]);
  if (body.length <= 65_535) { const header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(body.length, 2); return Buffer.concat([header, body]); }
  const header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(body.length), 2); return Buffer.concat([header, body]);
}
function reject(socket, status, reason, rateLimit = null) {
  const quotaHeaders = webSocketRateLimitHeaders(rateLimit, true);
  socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\n${quotaHeaders}Content-Length: ${Buffer.byteLength(reason)}\r\n\r\n${reason}`);
}
export function webSocketRateLimitHeaders(rateLimit, includeRetryAfter = false) {
  if (!rateLimit || !Number.isInteger(rateLimit.limit) || rateLimit.limit < 1 || !Number.isInteger(rateLimit.remaining) || rateLimit.remaining < 0 || !Number.isInteger(rateLimit.retryAfterSeconds) || rateLimit.retryAfterSeconds < 1) return "";
  return `X-RateLimit-Limit: ${rateLimit.limit}\r\nX-RateLimit-Remaining: ${rateLimit.remaining}\r\n${includeRetryAfter ? `Retry-After: ${rateLimit.retryAfterSeconds}\r\n` : ""}`;
}
function close(socket, code) { const payload = Buffer.alloc(2); payload.writeUInt16BE(code); socket.end(frame(0x8, payload)); }
function closePayloadError(payload) {
  if (payload.length === 0) return null;
  if (payload.length === 1) return 1002;
  const code = payload.readUInt16BE(0), validCode = code >= 1000 && code <= 1014 && ![1004, 1005, 1006].includes(code) || code >= 3000 && code <= 4999;
  if (!validCode) return 1002;
  return isUtf8(payload.subarray(2)) ? null : 1007;
}
export function createInboundFrameParser(socket, maximumBytes = 4_096, onProtocolClose = () => {}, onText = () => 1003) {
  let buffered = Buffer.alloc(0), closed = false, fragments = null, fragmentBytes = 0;
  const protocolError = (code = 1002) => { if (!closed) { closed = true; onProtocolClose(code); close(socket, code); } };
  const text = (payload) => { if (!isUtf8(payload)) return protocolError(1007); const errorCode = onText(payload.toString()); if (errorCode) return protocolError(errorCode); };
  return (chunk) => {
    if (closed || !Buffer.isBuffer(chunk) || chunk.length === 0) return;
    buffered = Buffer.concat([buffered, chunk]);
    while (!closed && buffered.length >= 2) {
      const first = buffered[0], second = buffered[1], fin = Boolean(first & 0x80), opcode = first & 0x0f, masked = Boolean(second & 0x80); let length = second & 0x7f, offset = 2;
      if (first & 0x70 || !masked) return protocolError();
      if (length === 126) { if (buffered.length < 4) return; length = buffered.readUInt16BE(2); offset = 4; }
      else if (length === 127) { if (buffered.length < 10) return; const wide = buffered.readBigUInt64BE(2); if (wide > BigInt(Number.MAX_SAFE_INTEGER)) return protocolError(1009); length = Number(wide); offset = 10; }
      const control = opcode >= 0x8; if (length > maximumBytes || opcode === 0x0 && fragments !== null && fragmentBytes + length > maximumBytes) return protocolError(1009); if (control && (!fin || length > 125) || ![0x0, 0x1, 0x8, 0x9, 0xa].includes(opcode)) return protocolError(control ? 1002 : 1003); if (opcode === 0x0 && fragments === null || opcode === 0x1 && fragments !== null) return protocolError();
      if (buffered.length < offset + 4 + length) return;
      const mask = buffered.subarray(offset, offset + 4), payload = Buffer.from(buffered.subarray(offset + 4, offset + 4 + length)); for (let index = 0; index < payload.length; index++) payload[index] ^= mask[index % 4]; buffered = buffered.subarray(offset + 4 + length);
      if (opcode === 0x1 && fin) text(payload);
      else if (opcode === 0x1) { fragments = [payload]; fragmentBytes = payload.length; }
      else if (opcode === 0x0) { fragments.push(payload); fragmentBytes += payload.length; if (fin) { const message = Buffer.concat(fragments, fragmentBytes); fragments = null; fragmentBytes = 0; text(message); } }
      else if (opcode === 0x8) { const errorCode = closePayloadError(payload); if (errorCode) return protocolError(errorCode); closed = true; socket.end(frame(0x8, payload)); }
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
  const acknowledgements = url.searchParams.get("ack") ?? "0";
  if (!new Set(["blocks", "swaps", "lifecycle", "snapshots"]).has(topic) || !["0", "1"].includes(acknowledgements)) return null;
  return { topic, mint: url.searchParams.get("mint"), pool: url.searchParams.get("pool"), protocol: url.searchParams.get("protocol"), eventType: url.searchParams.get("eventType"), acknowledgements: acknowledgements === "1" };
}
export function validWebSocketHandshake(request) {
  const key = request.headers?.["sec-websocket-key"], connection = String(request.headers?.connection ?? "").split(",").map((value) => value.trim().toLowerCase());
  if (request.method !== "GET" || String(request.headers?.upgrade ?? "").toLowerCase() !== "websocket" || !connection.includes("upgrade") || request.headers?.["sec-websocket-version"] !== "13" || typeof key !== "string" || !/^[A-Za-z0-9+/]{22}==$/.test(key)) return false;
  try { return Buffer.from(key, "base64").length === 16 && Buffer.from(key, "base64").toString("base64") === key; } catch { return false; }
}
const SNAPSHOT_PROTOCOLS = new Map([
  ["cpmm_pool_snapshot_applied", "raydium-cpmm"], ["amm_v4_pool_snapshot_applied", "raydium-amm-v4"], ["pump_swap_pool_snapshot_applied", "pump-swap"], ["pump_bonding_curve_snapshot_applied", "pump-bonding-curve"],
  ["clmm_pool_snapshot_applied", "raydium-clmm"], ["orca_pool_snapshot_applied", "orca-whirlpool"], ["meteora_dlmm_pool_snapshot_applied", "meteora-dlmm"], ["phoenix_market_snapshot_applied", "phoenix-orderbook"],
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

export function attachWebSocket(server, store, config, authorize = () => true, { admit = async () => ({ allowed: true }), audit = () => {} } = {}) {
  const clients = new Map(), upgradeStarted = new WeakMap(), upgradeObserved = new WeakSet(); const heartbeatMs = config.webSocketHeartbeatMs ?? 30_000; const maximumBufferedBytes = config.webSocketMaxBufferedBytes ?? 1_048_576; const maximumClients = config.webSocketMaxClients ?? 1_000; const maximumOutstandingAcks = config.webSocketMaxOutstandingAcks ?? 1_024; const acknowledgementTimeoutMs = config.webSocketAcknowledgementTimeoutMs ?? 10_000; const latencyBuckets = [0.05, 0.1, 0.25, 0.5, 1, 2, 5];
  const stats = { capacityRejections: 0, recoveryRejections: 0, recoveryEvictions: 0, slowConsumerEvictions: 0, protocolCloses: 0, acknowledgementTimeouts: 0, acknowledgementCount: 0, acknowledgementLatencyMs: 0, acknowledgementLatencyBuckets: Object.fromEntries(latencyBuckets.map((le) => [le, 0])) }; Object.defineProperty(stats, "activeClients", { enumerable: true, get: () => clients.size }); Object.defineProperty(stats, "acknowledgementClients", { enumerable: true, get: () => [...clients.values()].filter((client) => client.acknowledgements).length }); server.webSocketStats = stats; const evicted = () => stats.slowConsumerEvictions++;
  const recovery = () => store.recoveryQuality();
  const recoveryAvailable = () => { const quality = recovery(); return quality.canonical && !quality.capacityExceeded; };
  const closeForRecovery = (socket) => { stats.recoveryEvictions++; socket.end(frame(0x8, Buffer.from([0x03, 0xf5]))); clients.delete(socket); };
  const deliver = (socket, client, value, availableAt = Date.now()) => { if (client.acknowledgements && Number.isSafeInteger(value.sequence) && client.outstanding.size >= maximumOutstandingAcks) { evicted(); socket.end(frame(0x8, Buffer.from([0x03, 0xf5]))); clients.delete(socket); return false; } if (!send(socket, value, maximumBufferedBytes, evicted)) { clients.delete(socket); return false; } if (client.acknowledgements && Number.isSafeInteger(value.sequence)) client.outstanding.set(value.sequence, availableAt); return true; };
  const acknowledge = (client, text) => { let value; try { value = JSON.parse(text); } catch { return 1008; } if (!client.acknowledgements || value?.schemaVersion !== 1 || value.type !== "ack" || !Number.isSafeInteger(value.sequence) || value.sequence <= client.lastAcknowledged || !client.outstanding.has(value.sequence) || Object.keys(value).sort().join(",") !== "schemaVersion,sequence,type") return 1008; const now = Date.now(); for (const [sequence, sentAt] of client.outstanding) { if (sequence > value.sequence) break; const seconds = Math.max(0, now - sentAt) / 1_000; stats.acknowledgementCount++; stats.acknowledgementLatencyMs += seconds * 1_000; for (const le of latencyBuckets) if (seconds <= le) stats.acknowledgementLatencyBuckets[le]++; client.outstanding.delete(sequence); } client.lastAcknowledged = value.sequence; return null; };
  const unsubscribe = store.subscribe((event, commit) => { const availableAt = Number.isSafeInteger(commit?.committedAt) ? commit.committedAt : Date.now(); let recoverySafe; for (const [socket, client] of clients) { if (client.filter.topic !== "blocks" && (recoverySafe ??= recoveryAvailable()) === false) { closeForRecovery(socket); continue; } const value = projectWebSocketEvent(event, client.filter); if (value) deliver(socket, client, value, availableAt); } });
  const observe = (request, statusCode, authorization = null) => { if (upgradeObserved.has(request)) return; upgradeObserved.add(request); const started = upgradeStarted.get(request), durationMs = started == null ? 0 : Number(process.hrtime.bigint() - started) / 1_000_000; upgradeStarted.delete(request); try { audit(request, statusCode, authorization, durationMs); } catch {} };
  const rejectUpgrade = (request, socket, status, reason, authorization = null, rateLimit = null) => { observe(request, Number(status.slice(0, 3)), authorization); reject(socket, status, reason, rateLimit); };
  server.on("upgrade", (request, socket) => { upgradeStarted.set(request, process.hrtime.bigint()); void (async () => {
    const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname !== "/ws") return rejectUpgrade(request, socket, "404 Not Found", "not_found");
    const filter = subscription(url); if (!filter) return rejectUpgrade(request, socket, "400 Bad Request", "invalid_topic");
    const authorization = await authorize(request); if (!authorization || authorization?.authorized === false) return rejectUpgrade(request, socket, authorization?.status ?? "401 Unauthorized", authorization?.reason ?? "unauthorized", authorization);
    let admission; try { admission = await admit(request, authorization); } catch { admission = { allowed: false, status: "503 Service Unavailable", reason: "quota_unavailable" }; } if (!admission?.allowed) return rejectUpgrade(request, socket, admission?.status ?? "503 Service Unavailable", admission?.reason ?? "quota_unavailable", authorization, admission?.rateLimit);
    if (!store.structureQuality().canonical) return rejectUpgrade(request, socket, "503 Service Unavailable", "index_state_unavailable", authorization);
    if (filter.topic !== "blocks") { const quality = recovery(); if (!quality.canonical || quality.capacityExceeded) { stats.recoveryRejections++; return rejectUpgrade(request, socket, "503 Service Unavailable", quality.reason ?? "indexed_recovery_evidence_invalid", authorization); } }
    if (clients.size >= maximumClients) { stats.capacityRejections++; return rejectUpgrade(request, socket, "503 Service Unavailable", "websocket_capacity_exceeded", authorization); }
    const key = request.headers["sec-websocket-key"];
    if (!validWebSocketHandshake(request)) return rejectUpgrade(request, socket, "400 Bad Request", "invalid_websocket_handshake", authorization);
    const cursorText = url.searchParams.get("cursor") ?? String(store.state.eventSequence); const cursor = Number(cursorText);
    if (!Number.isSafeInteger(cursor) || cursor < 0) return rejectUpgrade(request, socket, "400 Bad Request", "invalid_cursor", authorization);
    const accept = crypto.createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
    const protocols = String(request.headers["sec-websocket-protocol"] ?? "").split(",").map((value) => value.trim());
    const selectedProtocol = protocols.includes("indexer.v1") ? "Sec-WebSocket-Protocol: indexer.v1\r\n" : "";
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n${selectedProtocol}${webSocketRateLimitHeaders(admission.rateLimit)}\r\n`); observe(request, 101, authorization); const client = { filter, acknowledgements: filter.acknowledgements, outstanding: new Map(), lastAcknowledged: cursor }; clients.set(socket, client);
    const replay = store.replayEvents(cursor);
    if (replay.evidenceInvalid || replay.cursorTooOld || replay.cursorAhead) { const delivered = send(socket, { type: "resync_required", reason: replay.evidenceInvalid ? "retained_event_evidence_invalid" : replay.cursorTooOld ? "cursor_before_retained_history" : "cursor_ahead_of_server", requestedCursor: cursor, oldestCursor: replay.oldestCursor, latestCursor: replay.latestCursor }, maximumBufferedBytes, evicted); clients.delete(socket); if (delivered) socket.end(frame(0x8, Buffer.from([0x03, 0xf0]))); }
    else if (!send(socket, { type: "ready", cursor, latestCursor: replay.latestCursor, subscription: filter, acknowledgement: filter.acknowledgements ? { schemaVersion: 1, type: "ack", cumulative: true, timeoutMs: acknowledgementTimeoutMs, maximumOutstanding: maximumOutstandingAcks } : null }, maximumBufferedBytes, evicted)) clients.delete(socket);
    else for (const event of replay.events) { const value = projectWebSocketEvent(event, filter); if (value && !deliver(socket, client, value)) break; }
    socket.on("data", createInboundFrameParser(socket, config.webSocketMaxInboundBytes ?? 4_096, () => stats.protocolCloses++, (text) => acknowledge(client, text)));
    socket.on("close", () => clients.delete(socket)); socket.on("error", () => clients.delete(socket));
  })().catch(() => { if (!socket.destroyed) { if (upgradeObserved.has(request)) socket.destroy(); else rejectUpgrade(request, socket, "503 Service Unavailable", "upgrade_unavailable"); } }); });
  const timer = setInterval(() => { let recoverySafe; for (const [socket, client] of clients) { if (client.filter.topic !== "blocks" && (recoverySafe ??= recoveryAvailable()) === false) closeForRecovery(socket); else if (socket.destroyed || socket.writableLength > maximumBufferedBytes) { if (!socket.destroyed) stats.slowConsumerEvictions++; socket.destroy(); clients.delete(socket); } else socket.write(frame(0x9)); } }, heartbeatMs); timer.unref();
  const acknowledgementTimer = setInterval(() => { const now = Date.now(); for (const [socket, client] of clients) { const oldest = client.outstanding.values().next().value; if (oldest != null && now - oldest > acknowledgementTimeoutMs) { stats.acknowledgementTimeouts++; evicted(); socket.end(frame(0x8, Buffer.from([0x03, 0xf5]))); clients.delete(socket); } } }, Math.min(1_000, acknowledgementTimeoutMs)); acknowledgementTimer.unref();
  let stopped = false; const closeClients = () => { if (stopped) return; stopped = true; clearInterval(timer); clearInterval(acknowledgementTimer); unsubscribe(); const payload = Buffer.alloc(2); payload.writeUInt16BE(1001); for (const socket of clients.keys()) { if (!socket.destroyed) { socket.end(frame(0x8, payload)); socket.destroySoon?.(); } } clients.clear(); }; server.closeWebSocketClients = closeClients; server.on("close", closeClients);
  return server;
}
