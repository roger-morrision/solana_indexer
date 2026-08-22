export async function shutdownIndexer({ server = null, oracleWatcher, stopWatching }) {
  oracleWatcher?.stop();
  stopWatching?.();
  if (!server) return;
  server.closeWebSocketClients?.();
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeIdleConnections?.();
  });
  await server.auditSink?.flush();
}
