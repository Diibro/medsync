import "server-only";

// In-memory, per-instance rate limiting — fine for this single-instance deployment, but resets on
// restart and doesn't share state across instances. Swap for a Redis-backed limiter (e.g. Upstash)
// before running more than one instance. See docs/PROGRESS.md M11 notes.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, opts: { max: number; windowMs: number }): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= opts.max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
