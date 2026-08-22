export const MIN_RETRY_AFTER_MS = 1_000;
export const MAX_RETRY_AFTER_MS = 3_600_000;

export function parseRetryAfterMs(value, now = Date.now()) {
  if (typeof value !== "string" || !Number.isFinite(now)) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (/^\d+$/.test(normalized)) {
    if (normalized.length > 4) return MAX_RETRY_AFTER_MS;
    return Math.min(MAX_RETRY_AFTER_MS, Math.max(MIN_RETRY_AFTER_MS, Number(normalized) * 1_000));
  }
  const date = Date.parse(normalized);
  if (!Number.isFinite(date)) return null;
  return Math.min(MAX_RETRY_AFTER_MS, Math.max(MIN_RETRY_AFTER_MS, Math.trunc(date - now)));
}
