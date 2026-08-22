export function parseCanonicalUtcTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}

export function canonicalUnixSecondsToMilliseconds(value) {
  if (!Number.isSafeInteger(value) || value < 0) return null;
  const milliseconds = value * 1_000;
  if (!Number.isSafeInteger(milliseconds)) return null;
  return Number.isFinite(new Date(milliseconds).getTime()) ? milliseconds : null;
}
