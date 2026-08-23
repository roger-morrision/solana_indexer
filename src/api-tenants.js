import crypto from "node:crypto";
import { parseCanonicalUtcTimestamp } from "./canonical-time.js";
import { readBoundedJsonFile } from "./bounded-json-file.js";

const HASH = /^[0-9a-f]{64}$/;
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
function iso(value) { return value == null ? null : parseCanonicalUtcTimestamp(value) == null ? false : value; }

export function compileApiTenants(document) {
  const observedAt = iso(document?.observedAt); if (document?.schemaVersion !== 1 || !Array.isArray(document.tenants) || !document.tenants.length || observedAt === false) throw new Error("invalid API tenant registry");
  const ids = new Set(), hashes = new Set(), tenants = [];
  for (const row of document.tenants) {
    if (!row || !NAME.test(row.id ?? "") || ids.has(row.id) || !["active", "suspended"].includes(row.status) || !NAME.test(row.plan ?? "") || !Number.isInteger(row.rateLimitPerMinute) || row.rateLimitPerMinute < 1 || row.rateLimitPerMinute > 100_000 || !Number.isInteger(row.retentionDays) || row.retentionDays < 1 || row.retentionDays > 3_650 || !Array.isArray(row.keys) || !row.keys.length) throw new Error("invalid API tenant row");
    const keys = row.keys.map((key) => { const activatesAt = iso(key?.activatesAt), expiresAt = iso(key?.expiresAt); if (!HASH.test(key?.hash ?? "") || hashes.has(key.hash) || activatesAt === false || expiresAt === false || (activatesAt && expiresAt && Date.parse(activatesAt) >= Date.parse(expiresAt))) throw new Error("invalid API tenant key"); hashes.add(key.hash); return { hash: key.hash, activatesAt, expiresAt }; });
    ids.add(row.id); tenants.push({ id: row.id, status: row.status, plan: row.plan, rateLimitPerMinute: row.rateLimitPerMinute, retentionDays: row.retentionDays, keys });
  }
  return { schemaVersion: 1, source: document.source ?? null, observedAt, tenants };
}

export async function loadApiTenants(filename) {
  if (!filename) return null;
  const document = await readBoundedJsonFile(filename);
  if (document?.evidenceReadError) throw new Error(`API tenant registry is unavailable: ${document.evidenceReadError}`);
  return compileApiTenants(document);
}

export function resolveApiTenant(registry, presentedKey, now = Date.now()) {
  if (!registry || !presentedKey) return null; const candidate = crypto.createHash("sha256").update(presentedKey).digest("hex");
  for (const tenant of registry.tenants) for (const key of tenant.keys) if (crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(key.hash, "hex"))) { const active = !key.activatesAt || Date.parse(key.activatesAt) <= now, unexpired = !key.expiresAt || Date.parse(key.expiresAt) > now; return tenant.status === "active" && active && unexpired ? { id: tenant.id, plan: tenant.plan, rateLimitPerMinute: tenant.rateLimitPerMinute, retentionDays: tenant.retentionDays, keyHash: key.hash } : null; }
  return null;
}
