export async function shutdownIndexer({ server = null, oracleWatcher, stopWatching, timeoutMs = server?.shutdownTimeoutMs ?? 30_000 }) {
  oracleWatcher?.stop();
  stopWatching?.();
  if (!server) return { forced: false };
  server.closeWebSocketClients?.();
  let forced = false;
  await new Promise((resolve, reject) => {
    let settled = false; const finish = (error) => { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : resolve(); }, timer = setTimeout(() => { forced = true; if (typeof server.closeAllConnections !== "function") return finish(new Error(`HTTP shutdown exceeded ${timeoutMs}ms and cannot force-close connections`)); server.closeAllConnections(); }, timeoutMs);
    server.close(finish);
    server.closeIdleConnections?.();
  });
  await server.auditSink?.flush();
  return { forced };
}
