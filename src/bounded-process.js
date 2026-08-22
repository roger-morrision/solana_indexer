import { spawn } from "node:child_process";

function appendBounded(current, chunk, maximumBytes) {
  if (maximumBytes === 0 || Buffer.byteLength(current) >= maximumBytes) return current;
  const remaining = maximumBytes - Buffer.byteLength(current); return current + Buffer.from(chunk).subarray(0, remaining).toString("utf8");
}

export function runBoundedProcess({ command, args = [], input = null, env = process.env, timeoutMs = 300_000, killGraceMs = 5_000, stdoutBytes = 0, stderrBytes = 8_192, label = command, spawnProcess = spawn, schedule = setTimeout, cancel = clearTimeout }) {
  if (typeof command !== "string" || !command || !Array.isArray(args) || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 3_600_000 || !Number.isSafeInteger(killGraceMs) || killGraceMs < 100 || killGraceMs > 30_000 || ![stdoutBytes, stderrBytes].every((value) => Number.isSafeInteger(value) && value >= 0 && value <= 1_048_576)) throw new Error("bounded process configuration is invalid");
  return new Promise((resolve, reject) => {
    let child, stdout = "", stderr = "", settled = false, timedOut = false, timer, forceTimer;
    const finish = (error, value) => { if (settled) return; settled = true; if (timer != null) cancel(timer); if (forceTimer != null) cancel(forceTimer); error ? reject(error) : resolve(value); };
    const timeoutError = () => new Error(`${label} timed out after ${timeoutMs}ms`);
    try { child = spawnProcess(command, args, { shell: false, windowsHide: true, stdio: [input == null ? "ignore" : "pipe", stdoutBytes ? "pipe" : "ignore", "pipe"], env }); }
    catch (error) { finish(error); return; }
    child.stdout?.on("data", (chunk) => { stdout = appendBounded(stdout, chunk, stdoutBytes); }); child.stderr?.on("data", (chunk) => { stderr = appendBounded(stderr, chunk, stderrBytes); });
    child.on("error", (error) => finish(timedOut ? timeoutError() : error)); child.on("close", (code, signal) => timedOut ? finish(timeoutError()) : code === 0 ? finish(null, stdout.trim()) : finish(new Error(`${label} failed (${code ?? signal ?? "unknown"}): ${stderr.trim().slice(0, 512)}`)));
    timer = schedule(() => { timedOut = true; forceTimer = schedule(() => { try { child.kill?.("SIGKILL"); } catch {} finish(timeoutError()); }, killGraceMs); forceTimer?.unref?.(); try { child.kill?.("SIGTERM"); } catch {} }, timeoutMs); timer?.unref?.();
    if (input != null) { try { child.stdin.end(input); } catch (error) { finish(error); } }
  });
}
