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
const MAX_HITS   = 5

const buckets = new Map<string, Bucket>()

/**
 * Returns true if the request should be blocked (limit exceeded).
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || now > bucket.resetAt) {
    // New window
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  if (bucket.count >= MAX_HITS) {
    return true
  }

  bucket.count++
  return false
}
