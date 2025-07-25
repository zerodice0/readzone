/**
 * Email Verification Security Utilities
 * Comprehensive security measures for email verification endpoints
 */

import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// Security configuration
export const EMAIL_VERIFICATION_SECURITY = {
  // Rate limiting (per IP)
  MAX_REQUESTS_PER_IP_PER_HOUR: 10,
  MAX_REQUESTS_PER_IP_PER_DAY: 30,
  
  // Rate limiting (per email)
  MAX_REQUESTS_PER_EMAIL_PER_HOUR: 3,
  MAX_REQUESTS_PER_EMAIL_PER_DAY: 10,
  
  // Timing attack prevention
  CONSTANT_TIME_DELAY_MS: 1000,
  
  // Token generation
  TOKEN_LENGTH_BYTES: 32,
  TOKEN_ENTROPY_BITS: 256,
  
  // Request validation
  MAX_PAYLOAD_SIZE: 512, // bytes
  ALLOWED_CONTENT_TYPES: ['application/json'],
  
  // Suspicious activity detection
  SUSPICIOUS_REQUEST_THRESHOLD: 20,
  IP_BLOCK_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const

// In-memory store for rate limiting (in production, use Redis)
interface RateLimitEntry {
  count: number
  firstRequest: number
  lastRequest: number
  isBlocked?: boolean
  blockUntil?: number
}

const ipRateLimit = new Map<string, RateLimitEntry>()
const emailRateLimit = new Map<string, RateLimitEntry>()
const suspiciousIPs = new Set<string>()

/**
 * Generate cryptographically secure token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(EMAIL_VERIFICATION_SECURITY.TOKEN_LENGTH_BYTES).toString('hex')
}

/**
 * Extract client IP address with proper header handling
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers in order of reliability
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  // Handle X-Forwarded-For header (can contain multiple IPs)
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim())
    return ips[0] // First IP is the original client
  }
  
  // Fallback to other headers
  return cfConnectingIP || realIP || '127.0.0.1'
}

/**
 * Validate request headers and content type
 */
export function validateRequestSecurity(request: NextRequest): {
  success: boolean
  error?: {
    code: string
    message: string
    statusCode: number
  }
} {
  // Check content type
  const contentType = request.headers.get('content-type')
  if (!contentType || !EMAIL_VERIFICATION_SECURITY.ALLOWED_CONTENT_TYPES.some(type => contentType.includes(type))) {
    return {
      success: false,
      error: {
        code: 'INVALID_CONTENT_TYPE',
        message: 'Invalid content type',
        statusCode: 400
      }
    }
  }
  
  // Check content length
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > EMAIL_VERIFICATION_SECURITY.MAX_PAYLOAD_SIZE) {
    return {
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large',
        statusCode: 413
      }
    }
  }
  
  // Check for suspicious headers
  const userAgent = request.headers.get('user-agent')
  if (!userAgent || userAgent.length < 10) {
    logger.warn('Suspicious request - missing or invalid user agent', {
      userAgent,
      ip: getClientIP(request)
    })
  }
  
  return { success: true }
}

/**
 * Check IP-based rate limiting
 */
export function checkIPRateLimit(ip: string): {
  allowed: boolean
  error?: {
    code: string
    message: string
    statusCode: number
    retryAfter?: number
  }
} {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * oneHour
  
  // Check if IP is blocked
  if (suspiciousIPs.has(ip)) {
    return {
      allowed: false,
      error: {
        code: 'IP_BLOCKED',
        message: 'IP address blocked due to suspicious activity',
        statusCode: 429,
        retryAfter: 86400 // 24 hours
      }
    }
  }
  
  const entry = ipRateLimit.get(ip)
  
  if (!entry) {
    // First request from this IP
    ipRateLimit.set(ip, {
      count: 1,
      firstRequest: now,
      lastRequest: now
    })
    return { allowed: true }
  }
  
  // Check if we need to reset counters
  const hoursSinceFirst = (now - entry.firstRequest) / oneHour
  const daysSinceFirst = (now - entry.firstRequest) / oneDay
  
  if (daysSinceFirst >= 1) {
    // Reset daily counter
    ipRateLimit.set(ip, {
      count: 1,
      firstRequest: now,
      lastRequest: now
    })
    return { allowed: true }
  }
  
  // Check hourly limit
  if (hoursSinceFirst < 1 && entry.count >= EMAIL_VERIFICATION_SECURITY.MAX_REQUESTS_PER_IP_PER_HOUR) {
    const retryAfter = Math.ceil((oneHour - (now - entry.firstRequest)) / 1000)
    
    return {
      allowed: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP address',
        statusCode: 429,
        retryAfter
      }
    }
  }
  
  // Check daily limit
  if (entry.count >= EMAIL_VERIFICATION_SECURITY.MAX_REQUESTS_PER_IP_PER_DAY) {
    const retryAfter = Math.ceil((oneDay - (now - entry.firstRequest)) / 1000)
    
    // Mark IP as suspicious if hitting daily limit frequently
    if (entry.count > EMAIL_VERIFICATION_SECURITY.SUSPICIOUS_REQUEST_THRESHOLD) {
      suspiciousIPs.add(ip)
      logger.warn('IP marked as suspicious due to excessive requests', { ip, count: entry.count })
    }
    
    return {
      allowed: false,
      error: {
        code: 'DAILY_LIMIT_EXCEEDED',
        message: 'Daily request limit exceeded',
        statusCode: 429,
        retryAfter
      }
    }
  }
  
  // Update counter
  entry.count++
  entry.lastRequest = now
  ipRateLimit.set(ip, entry)
  
  return { allowed: true }
}

/**
 * Check email-based rate limiting
 */
export function checkEmailRateLimit(email: string): {
  allowed: boolean
  error?: {
    code: string
    message: string
    statusCode: number
    retryAfter?: number
  }
} {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * oneHour
  
  const entry = emailRateLimit.get(email)
  
  if (!entry) {
    // First request for this email
    emailRateLimit.set(email, {
      count: 1,
      firstRequest: now,
      lastRequest: now
    })
    return { allowed: true }
  }
  
  // Check if we need to reset counters
  const hoursSinceFirst = (now - entry.firstRequest) / oneHour
  const daysSinceFirst = (now - entry.firstRequest) / oneDay
  
  if (daysSinceFirst >= 1) {
    // Reset daily counter
    emailRateLimit.set(email, {
      count: 1,
      firstRequest: now,
      lastRequest: now
    })
    return { allowed: true }
  }
  
  // Check hourly limit
  if (hoursSinceFirst < 1 && entry.count >= EMAIL_VERIFICATION_SECURITY.MAX_REQUESTS_PER_EMAIL_PER_HOUR) {
    const retryAfter = Math.ceil((oneHour - (now - entry.firstRequest)) / 1000)
    
    return {
      allowed: false,
      error: {
        code: 'EMAIL_RATE_LIMIT_EXCEEDED',
        message: '이 이메일 주소로 너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
        statusCode: 429,
        retryAfter
      }
    }
  }
  
  // Check daily limit
  if (entry.count >= EMAIL_VERIFICATION_SECURITY.MAX_REQUESTS_PER_EMAIL_PER_DAY) {
    const retryAfter = Math.ceil((oneDay - (now - entry.firstRequest)) / 1000)
    
    return {
      allowed: false,
      error: {
        code: 'EMAIL_DAILY_LIMIT_EXCEEDED',
        message: '이 이메일 주소의 일일 요청 한도를 초과했습니다.',
        statusCode: 429,
        retryAfter
      }
    }
  }
  
  // Update counter
  entry.count++
  entry.lastRequest = now
  emailRateLimit.set(email, entry)
  
  return { allowed: true }
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: 'rate_limit_exceeded' | 'suspicious_activity' | 'invalid_request' | 'verification_request',
  context: {
    ip?: string
    email?: string
    userAgent?: string
    error?: string
    additional?: Record<string, unknown>
  }
): void {
  logger.warn(`[SECURITY] Email verification: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...context
  })
}

/**
 * Implement constant-time delay to prevent timing attacks
 */
export async function constantTimeDelay(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, EMAIL_VERIFICATION_SECURITY.CONSTANT_TIME_DELAY_MS)
  })
}

/**
 * Validate email format with security considerations
 */
export function validateEmailSecurity(email: string): {
  valid: boolean
  normalized?: string
  error?: string
} {
  try {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: 'Invalid email format'
      }
    }
    
    // Normalize email (lowercase, trim)
    const normalized = email.toLowerCase().trim()
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\+.*@/, // Plus addressing (could be used for enumeration)
      /\.{2,}/, // Multiple consecutive dots
      /^\./, // Starting with dot
      /\.$/, // Ending with dot
    ]
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(normalized))
    if (hasSuspiciousPattern) {
      logSecurityEvent('suspicious_activity', {
        email: normalized,
        error: 'Suspicious email pattern detected'
      })
      // Don't reject, but log for monitoring
    }
    
    // Check length limits
    if (normalized.length > 254) { // RFC 5321 limit
      return {
        valid: false,
        error: 'Email address too long'
      }
    }
    
    return {
      valid: true,
      normalized
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Email validation failed'
    }
  }
}

/**
 * Generate standardized error response that doesn't leak information
 */
export function createSecureErrorResponse(
  code: string,
  publicMessage: string,
  statusCode: number,
  retryAfter?: number
): {
  success: false
  message: string
  error: {
    code: string
    timestamp: string
    retryAfter?: number
  }
} {
  return {
    success: false,
    message: publicMessage,
    error: {
      code,
      timestamp: new Date().toISOString(),
      ...(retryAfter && { retryAfter })
    }
  }
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitEntries(): void {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  
  // Clean IP rate limits
  for (const [ip, entry] of ipRateLimit.entries()) {
    if (now - entry.lastRequest > oneDay) {
      ipRateLimit.delete(ip)
    }
  }
  
  // Clean email rate limits
  for (const [email, entry] of emailRateLimit.entries()) {
    if (now - entry.lastRequest > oneDay) {
      emailRateLimit.delete(email)
    }
  }
  
  logger.debug('Rate limit entries cleaned up', {
    ipEntries: ipRateLimit.size,
    emailEntries: emailRateLimit.size
  })
}