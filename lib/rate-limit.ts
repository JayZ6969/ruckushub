import { NextRequest } from 'next/server'

// Simple in-memory rate limiting (for production, use Redis)
const attempts = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}

export function rateLimit(config: RateLimitConfig) {
  const { maxAttempts, windowMs, blockDurationMs } = config

  return (identifier: string): { success: boolean; resetTime?: number } => {
    const now = Date.now()
    const userAttempts = attempts.get(identifier)

    // Clean up expired entries
    if (userAttempts && now > userAttempts.resetTime) {
      attempts.delete(identifier)
    }

    const currentAttempts = attempts.get(identifier)

    if (!currentAttempts) {
      // First attempt
      attempts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      })
      return { success: true }
    }

    if (currentAttempts.count >= maxAttempts) {
      // Rate limit exceeded
      const blockedUntil = currentAttempts.resetTime + blockDurationMs
      return { 
        success: false, 
        resetTime: blockedUntil 
      }
    }

    // Increment attempts
    attempts.set(identifier, {
      count: currentAttempts.count + 1,
      resetTime: currentAttempts.resetTime
    })

    return { success: true }
  }
}

// Get client IP address
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0] : real

  return ip || 'anonymous'
}

// Auth rate limiter - 5 attempts per 15 minutes, block for 30 minutes
export const authRateLimit = rateLimit({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000 // 30 minutes
})
