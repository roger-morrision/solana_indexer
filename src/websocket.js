import crypto from "node:crypto";

function frame(opcode, payload = Buffer.alloc(0)) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  if (body.length < 126) return Buffer.concat([Buffer.from([0x80 | opcode, body.length]), body]);
  if (body.length <= 65_535) { const header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(body.length, 2); return Buffer.concat([header, body]); }
  const header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(body.length), 2); return Buffer.concat([header, body]);
}
function reject(socket, status, reason) { socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: ${Buffer.byteLength(reason)}\r\n\r\n${reason}`); }
function send(socket, value, maximumBufferedBytes) {
  if (socket.destroyed) return false;
  const message = frame(0x1, JSON.stringify(value));
  if (message.length > maximumBufferedBytes || socket.writableLength + message.length > maximumBufferedBytes) { socket.end(frame(0x8, Buffer.from([0x03, 0xf5]))); return false; }
  socket.write(message); return true;
}
function subscription(url) {
  const topic = url.searchParams.get("topic") ?? "blocks";
  if (!new Set(["blocks", "swaps", "lifecycle", "snapshots"]).has(topic)) return null;
  return { topic, mint: url.searchParams.get("mint"), pool: url.searchParams.get("pool"), protocol: url.searchParams.get("protocol"), eventType: url.searchParams.get("eventType") };
}
function project(event, filter) {
  if (filter.topic === "blocks") return event.type.startsWith("block_") ? event : null;
  if (filter.topic === "snapshots") { if (event.type === "account_snapshot_applied") { const mints = (event.mints ?? []).filter((row) => !filter.mint || row.mint === filter.mint); return mints.length ? { ...event, mints } : null; } if (event.type === "clmm_pool_snapshot_applied") { const pools = (event.pools ?? []).filter((row) => !filter.pool || row.pool === filter.pool); return pools.length ? { ...event, pools } : null; } return null; }
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
  const clients = new Map(); const heartbeatMs = config.webSocketHeartbeatMs ?? 30_000; const maximumBufferedBytes = config.webSocketMaxBufferedBytes ?? 1_048_576;
  const unsubscribe = store.subscribe((event) => { for (const [socket, filter] of clients) { const value = project(event, filter); if (value && !send(socket, value, maximumBufferedBytes)) clients.delete(socket); } });
  server.on("upgrade", (request, socket) => {
    const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname !== "/ws") return reject(socket, "404 Not Found", "not_found");
    const filter = subscription(url); if (!filter) return reject(socket, "400 Bad Request", "invalid_topic");
    if (!authorize(request)) return reject(socket, "401 Unauthorized", "unauthorized");
    const key = request.headers["sec-websocket-key"];
    if (request.headers["sec-websocket-version"] !== "13" || typeof key !== "string") return reject(socket, "400 Bad Request", "invalid_websocket_handshake");
    const cursorText = url.searchParams.get("cursor") ?? String(store.state.eventSequence); const cursor = Number(cursorText);
    if (!Number.isSafeInteger(cursor) || cursor < 0) return reject(socket, "400 Bad Request", "invalid_cursor");
    const accept = crypto.createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
    const protocols = String(request.headers["sec-websocket-protocol"] ?? "").split(",").map((value) => value.trim());
    const selectedProtocol = protocols.includes("indexer.v1") ? "Sec-WebSocket-Protocol: indexer.v1\r\n" : "";
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n${selectedProtocol}\r\n`); clients.set(socket, filter);
    const replay = store.replayEvents(cursor);
    if (replay.cursorTooOld) { if (!send(socket, { type: "resync_required", requestedCursor: cursor, latestCursor: replay.latestCursor }, maximumBufferedBytes)) clients.delete(socket); }
    else if (!send(socket, { type: "ready", cursor, latestCursor: replay.latestCursor, subscription: filter }, maximumBufferedBytes)) clients.delete(socket);
    else for (const event of replay.events) { const value = project(event, filter); if (value && !send(socket, value, maximumBufferedBytes)) { clients.delete(socket); break; } }
    socket.on("data", (chunk) => {
      const opcode = chunk[0] & 0x0f;
      if (opcode === 0x8) socket.end(frame(0x8));
      else if (opcode === 0x9) socket.write(frame(0x0a, Buffer.alloc(0)));
    });
    socket.on("close", () => clients.delete(socket)); socket.on("error", () => clients.delete(socket));
  });
  const timer = setInterval(() => { for (const socket of clients.keys()) { if (socket.destroyed || socket.writableLength > maximumBufferedBytes) { socket.destroy(); clients.delete(socket); } else socket.write(frame(0x9)); } }, heartbeatMs); timer.unref();
  server.on("close", () => { clearInterval(timer); unsubscribe(); for (const socket of clients.keys()) socket.destroy(); clients.clear(); });
  return server;
}
