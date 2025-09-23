import DOMPurify from 'dompurify'

// Content Security Policy configuration
export const cspConfig = {
  // Base directives for ReadZone
  directives: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for inline scripts, minimize usage
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://developers.kakao.com',
      'https://t1.kakaocdn.net'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and Tailwind
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.cloudinary.com',
      'https://www.google-analytics.com',
      'https://ssl.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://api.readzone.com', // Backend API
      'https://dapi.kakao.com', // Kakao Book API
      'https://www.google-analytics.com'
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true
  },

  // Generate CSP header string
  toString(): string {
    const directives = Object.entries(this.directives)
      .map(([key, values]) => {
        if (key === 'upgrade-insecure-requests') {
          return values ? 'upgrade-insecure-requests' : ''
        }
        if (Array.isArray(values)) {
          return `${key} ${values.join(' ')}`
        }

        return ''
      })
      .filter(Boolean)
      .join('; ')

    return directives
  }
}

// HTML sanitization for user-generated content
export const sanitizeHtml = (dirty: string, options?: {
  allowedTags?: string[]
  allowedAttributes?: string[]
  stripIgnoreTag?: boolean
}): string => {
  const config = {
    ALLOWED_TAGS: options?.allowedTags ?? [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's',
      'blockquote', 'pre', 'code',
      'ul', 'ol', 'li',
      'a', 'img'
    ],
    ALLOWED_ATTR: options?.allowedAttributes ?? [
      'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class'
    ],
    STRIP_IGNORE_TAG: options?.stripIgnoreTag ?? true,
    STRIP_IGNORE_TAG_BODY: ['script', 'style'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus'],
    USE_PROFILES: { html: true }
  }

  return DOMPurify.sanitize(dirty, config)
}

// URL validation and sanitization
export const sanitizeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }

    // Block common malicious patterns
    const maliciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i
    ]

    if (maliciousPatterns.some(pattern => pattern.test(url))) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

// Input validation utilities
export const validateInput = {
  // Email validation with security considerations
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const maxLength = 254 // RFC 5321 limit

    return (
      email.length <= maxLength &&
      emailRegex.test(email) &&
      !email.includes('..') && // Prevent consecutive dots
      !email.startsWith('.') &&
      !email.endsWith('.')
    )
  },

  // Username validation
  username: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    const minLength = 3
    const maxLength = 30

    return (
      username.length >= minLength &&
      username.length <= maxLength &&
      usernameRegex.test(username) &&
      !username.startsWith('_') &&
      !username.startsWith('-') &&
      !username.endsWith('_') &&
      !username.endsWith('-')
    )
  },

  // Password strength validation
  password: (password: string): { valid: boolean; score: number; feedback: string[] } => {
    const feedback: string[] = []
    let score = 0

    // Length check
    if (password.length < 8) {
      feedback.push('비밀번호는 최소 8자 이상이어야 합니다')
    } else if (password.length >= 12) {
      score += 2
    } else {
      score += 1
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {score += 1}
    if (/[A-Z]/.test(password)) {score += 1}
    if (/[0-9]/.test(password)) {score += 1}
    if (/[^a-zA-Z0-9]/.test(password)) {score += 2}

    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i
    ]

    if (commonPatterns.some(pattern => pattern.test(password))) {
      score -= 2
      feedback.push('일반적인 패턴을 피해주세요')
    }

    // Score evaluation
    if (score < 3) {
      feedback.push('약한 비밀번호입니다')
    } else if (score < 5) {
      feedback.push('보통 강도의 비밀번호입니다')
    } else {
      feedback.push('강한 비밀번호입니다')
    }

    return {
      valid: password.length >= 8 && score >= 3,
      score: Math.max(0, Math.min(5, score)),
      feedback
    }
  }
}

// Rate limiting for client-side operations
class RateLimiter {
  private attempts = new Map<string, number[]>()

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing attempts for this key
    const keyAttempts = this.attempts.get(key) ?? []

    // Filter out attempts outside the window
    const recentAttempts = keyAttempts.filter(timestamp => timestamp > windowStart)

    // Check if we're within limits
    if (recentAttempts.length >= maxAttempts) {
      return false
    }

    // Record this attempt
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)

    // Cleanup old entries periodically
    if (Math.random() < 0.1) { // 10% chance
      this.cleanup(windowStart)
    }

    return true
  }

  private cleanup(cutoff: number): void {
    for (const [key, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(timestamp => timestamp > cutoff)

      if (recentAttempts.length === 0) {
        this.attempts.delete(key)
      } else {
        this.attempts.set(key, recentAttempts)
      }
    }
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

// Security headers for fetch requests
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// Secure fetch wrapper
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      ...securityHeaders,
      ...options.headers
    },
    credentials: 'same-origin', // Prevent CSRF
    mode: 'cors'
  }

  // Validate URL
  const sanitizedUrl = sanitizeUrl(url)

  if (!sanitizedUrl) {
    throw new Error('Invalid URL provided')
  }

  // Check rate limiting for this endpoint
  const endpoint = new URL(sanitizedUrl).pathname

  if (!rateLimiter.isAllowed(`fetch:${endpoint}`, 10, 60000)) { // 10 requests per minute
    throw new Error('Rate limit exceeded')
  }

  return fetch(sanitizedUrl, secureOptions)
}

// XSS prevention utilities
export const xssProtection = {
  // Escape HTML special characters
  escapeHtml: (text: string): string => {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }

    return text.replace(/[&<>"'/]/g, char => htmlEscapes[char] ?? char)
  },

  // Sanitize attributes
  sanitizeAttribute: (attr: string): string => {
    return attr.replace(/[^\w-]/g, '')
  },

  // Remove dangerous protocols from URLs
  sanitizeHref: (href: string): string => {
    const sanitized = sanitizeUrl(href)

    return sanitized ?? '#'
  }
}

// CSRF protection utilities
export const csrfProtection = {
  // Generate CSRF token
  generateToken: (): string => {
    const array = new Uint8Array(32)

    crypto.getRandomValues(array)

    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  },

  // Get CSRF token from meta tag or localStorage
  getToken: (): string | null => {
    // Try meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]')

    if (metaTag) {
      return metaTag.getAttribute('content')
    }

    // Fallback to localStorage
    return localStorage.getItem('csrf-token')
  },

  // Add CSRF token to request headers
  addToHeaders: (headers: HeadersInit = {}): HeadersInit => {
    const token = csrfProtection.getToken()

    if (token) {
      return {
        ...headers,
        'X-CSRF-Token': token
      }
    }

    return headers
  }
}

// Security event logging
export const securityLogger = {
  logSecurityEvent: (event: {
    type: 'xss_attempt' | 'csrf_attempt' | 'rate_limit' | 'invalid_input'
    details: string
    severity: 'low' | 'medium' | 'high'
    userAgent?: string
    ip?: string
  }) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
      userAgent: event.userAgent ?? navigator.userAgent,
      url: window.location.href
    }

    // In production, send to security monitoring service
    if (import.meta.env.MODE === 'production') {
      // Example: Send to security monitoring endpoint
      fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfProtection.addToHeaders()
        },
        body: JSON.stringify(logEntry)
      }).catch(console.error)
    } else {
      console.warn('[Security Event]', logEntry)
    }
  }
}