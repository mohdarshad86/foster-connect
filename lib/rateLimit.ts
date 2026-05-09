/**
 * Lightweight in-memory IP-based rate limiter.
 *
 * Phase 1: single-process only. In production with multiple serverless
 * instances each has its own counter, but 5 req/hr/IP per instance is
 * acceptable for phase 1 (Story 13).
 *
 * Replace with a Redis-backed solution before going to high traffic.
 */

interface Bucket {
  count:   number
  resetAt: number // Unix ms timestamp
}

const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function createRateLimiter(maxHits: number) {
  const buckets = new Map<string, Bucket>()
  return function isLimited(ip: string): boolean {
    const now = Date.now()
    const bucket = buckets.get(ip)
    if (!bucket || now > bucket.resetAt) {
      buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
      return false
    }
    if (bucket.count >= maxHits) return true
    bucket.count++
    return false
  }
}

/** 5 req/hr — public application submissions (POST /api/applications) */
export const isRateLimited = createRateLimiter(5)

/** 10 req/hr — application status lookups (GET /api/application-status) */
export const isStatusLookupLimited = createRateLimiter(10)
