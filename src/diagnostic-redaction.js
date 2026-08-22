const SECRET_ASSIGNMENT = /\b(api[_-]?key|authorization|password|passwd|secret|token|private[_-]?key|seed(?:[_-]?phrase)?)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|\S+)/gi;
const BEARER_CREDENTIAL = /\bbearer\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT_CREDENTIAL = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const URL = /https?:\/\/[^\s"'<>]+/gi;
const PRIVATE_KEY_BLOCK = /-----BEGIN [^-\r\n]*PRIVATE KEY-----[\s\S]*?-----END [^-\r\n]*PRIVATE KEY-----/gi;

export function redactDiagnostic(value, fallback = "diagnostic unavailable", maximumLength = 512) {
  if (!Number.isSafeInteger(maximumLength) || maximumLength < 32 || maximumLength > 16_384) throw new Error("invalid diagnostic maximum length");
  const text = String(value?.message ?? value?.name ?? value ?? fallback)
    .replace(PRIVATE_KEY_BLOCK, "[redacted-private-key]")
    .replace(URL, "[redacted-url]")
    .replace(BEARER_CREDENTIAL, "Bearer [redacted]")
    .replace(JWT_CREDENTIAL, "[redacted-token]")
    .replace(SECRET_ASSIGNMENT, (_, name) => `${name}=[redacted]`)
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text || fallback).slice(0, maximumLength);
}
