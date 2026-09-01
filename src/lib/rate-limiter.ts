/**
 * In-memory sliding window rate limiter for brute-force protection and API rate limiting.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 600000); // 10 mins
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 300000);
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = store.get(key) || { timestamps: [] };

  // Filter timestamps within window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetInMs = Math.max(0, windowMs - (now - oldestTimestamp));
    return {
      success: false,
      remaining: 0,
      resetInMs,
    };
  }

  return {
    success: true,
    remaining: maxRequests - record.timestamps.length,
    resetInMs: windowMs,
  };
}

export function recordAttempt(key: string): void {
  const now = Date.now();
  const record = store.get(key) || { timestamps: [] };
  record.timestamps.push(now);
  store.set(key, record);
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
