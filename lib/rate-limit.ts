type Bucket = { count: number; resetAt: number };

export function createRateLimiter(options: { windowMs: number; max: number }) {
  const buckets = new Map<string, Bucket>();

  function currentBucket(key: string, now: number): Bucket {
    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const next = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, next);
      return next;
    }
    return existing;
  }

  return {
    isBlocked(
      key: string,
      now = Date.now(),
    ): { blocked: boolean; retryAfterSec: number } {
      const existing = buckets.get(key);
      if (!existing || existing.resetAt <= now || existing.count < options.max) {
        return { blocked: false, retryAfterSec: 0 };
      }
      return {
        blocked: true,
        retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    },
    recordFailure(key: string, now = Date.now()): void {
      currentBucket(key, now).count += 1;
    },
    reset(key: string): void {
      buckets.delete(key);
    },
  };
}

export const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
});

export function requestClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "local";
}
