import type { Context, Next } from 'hono'
import { type JWTPayload, verifyToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'

// 인증된 사용자 정보를 Context에 추가하기 위한 타입 확장
declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: string
      email: string
      nickname: string
      isVerified: boolean
    }
    jwtPayload: JWTPayload
  }
}

/**
 * JWT 토큰 검증 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 추출하고 검증합니다.
 */
export async function authMiddleware(c: Context, next: Next): Promise<Response | undefined> {
  try {
    // Authorization 헤더 확인
    const authHeader = c.req.header('Authorization')

    if (!authHeader) {
      return c.json(
        {
          success: false,
          error: {
            code: 'MISSING_AUTH_HEADER',
            message: 'Authorization header is required'
          }
        },
        401
      )
    }

    // Bearer 토큰 형식 확인
    const token = authHeader.replace('Bearer ', '')

    if (!token || token === authHeader) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_AUTH_FORMAT',
            message: 'Invalid authorization format. Use "Bearer <token>"'
          }
        },
        401
      )
    }

    // JWT 토큰 검증
    let payload: JWTPayload

    try {
      payload = verifyToken(token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token verification failed'

      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message
          }
        },
        401
      )
    }

    // 액세스 토큰인지 확인
    if (payload.type !== 'access') {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN_TYPE',
            message: 'Access token is required'
          }
        },
        401
      )
    }

    // 데이터베이스에서 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        isVerified: true
      }
    })

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        },
        401
      )
    }

    // Context에 사용자 정보 저장
    c.set('user', user)
    c.set('jwtPayload', payload)

    await next()

    return
  } catch (error) {
    console.error('Auth middleware error:', error)

    return c.json(
      {
        success: false,
        error: {
          code: 'AUTH_MIDDLEWARE_ERROR',
          message: 'Authentication failed'
        }
      },
      500
    )
  }
}

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 검증하고, 없어도 계속 진행합니다.
 */
export async function optionalAuthMiddleware(c: Context, next: Next): Promise<void> {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      
      if (token && token !== authHeader) {
        try {
          const payload = verifyToken(token)
          
          if (payload.type === 'access') {
            const user = await prisma.user.findUnique({
              where: { id: payload.userId },
              select: {
                id: true,
                email: true,
                nickname: true,
                isVerified: true
              }
            })

            if (user) {
              c.set('user', user)
              c.set('jwtPayload', payload)
            }
          }
        } catch {
          // 토큰이 유효하지 않아도 계속 진행
        }
      }
    }

    await next()

    return
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    await next()

    return
  }
}

/**
 * 이메일 인증 확인 미들웨어
 * 이메일이 인증된 사용자만 접근할 수 있습니다.
 */
export async function requireEmailVerification(c: Context, next: Next): Promise<Response | undefined> {
  const user = c.get('user')
  
  if (!user) {
    return c.json(
      {
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required'
        }
      },
      401
    )
  }

  if (!user.isVerified) {
    return c.json(
      {
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Email verification is required'
        }
      },
      403
    )
  }

  await next()

  return
}

/**
 * Rate limiting 미들웨어
 * 동일 IP에서의 과도한 요청을 제한합니다.
 */
interface RateLimitOptions {
  windowMs: number // 시간 윈도우 (밀리초)
  maxRequests: number // 최대 요청 수
  message?: string // 제한 시 메시지
}

// 간단한 메모리 기반 rate limiter (프로덕션에서는 Redis 사용 권장)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(options: RateLimitOptions) {
  return async (c: Context, next: Next): Promise<Response | undefined> => {
    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
    const now = Date.now()
    const key = `${ip}:${c.req.path}`

    // 만료된 항목 정리
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }

    const record = rateLimitStore.get(key)
    
    if (!record) {
      // 첫 요청
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      })
    } else if (record.resetTime < now) {
      // 윈도우 리셋
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      })
    } else {
      // 기존 윈도우 내 요청
      record.count++
      
      if (record.count > options.maxRequests) {
        return c.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: options.message ?? 'Too many requests. Please try again later.'
            }
          },
          429
        )
      }
    }

    await next()

    return
  }
}

/**
 * CORS 미들웨어
 */
export function corsMiddleware() {
  return async (c: Context, next: Next): Promise<Response | undefined> => {
    const origin = c.req.header('Origin')
    const allowedOrigins = [
      'http://localhost:3000',
      'https://readzone.vercel.app',
      process.env.CORS_ORIGIN
    ].filter(Boolean)

    if (origin && allowedOrigins.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin)
    }

    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    c.header('Access-Control-Allow-Credentials', 'true')

    if (c.req.method === 'OPTIONS') {
      return new Response('', { status: 204 })
    }

    await next()

    return
  }
}