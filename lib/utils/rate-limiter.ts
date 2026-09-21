import { RateLimitError } from './errors'

interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * Simple in-memory rate limiter
 *
 * IMPORTANT LIMITATION: This implementation uses a JavaScript Map stored in memory.
 * In multi-instance deployments, rate limits are PER-INSTANCE, not global.
 * Attackers can distribute requests across instances to bypass rate limits.
 *
 * For production deployments with multiple instances, implement a distributed
 * rate limiter using Redis or a similar distributed cache.
 */
const rateLimitStore = new Map<string, RateLimitEntry>()

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute default
): void {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return
  }

  if (entry.count >= maxRequests) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000)
    throw new RateLimitError(
      `Too many requests. Try again in ${resetIn} seconds.`
    )
  }

  // Increment count
  entry.count++
  rateLimitStore.set(identifier, entry)
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute
