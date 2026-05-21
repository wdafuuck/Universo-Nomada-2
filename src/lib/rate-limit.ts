/**
 * Tiny in-memory sliding-window rate limiter. Good enough for a single-tenant
 * single-instance deploy. If we go horizontal, swap for Upstash/Redis.
 */
const buckets = new Map<string, number[]>();

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Periodic GC so the map doesn't grow unbounded.
  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    for (const [k, hits] of buckets) {
      const fresh = hits.filter((t) => t > cutoff);
      if (fresh.length === 0) buckets.delete(k);
      else buckets.set(k, fresh);
    }
    lastSweep = now;
  }

  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    const oldest = hits[0];
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    return { ok: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true };
}
