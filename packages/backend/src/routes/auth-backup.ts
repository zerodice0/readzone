import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { hashPassword, validatePasswordPolicy, verifyPassword } from '../lib/password'
import { 
  generateEmailVerificationToken, 
  generateTokenPair,
  type JWTPayload,
  verifyToken
} from '../lib/jwt'
import { authMiddleware, rateLimit } from '../middleware/auth'
import { 
  logEmailInDevelopment,
  sendEmailVerification 
} from '../lib/email'

const auth = new Hono()

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 10, // 15분에 10번
  message: '인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
})

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 5, // 15분에 5번
  message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
})

// Validation schemas
const checkDuplicateSchema = z.object({
  field: z.enum(['email', 'nickname']),
  value: z.string().min(1).max(320)
})

const registerSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다').max(320),
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다').max(50, '닉네임은 50자 이하여야 합니다'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다').max(128)
})

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1)
})

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
})

const sendVerificationSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다').max(320)
})

const verifyEmailSchema = z.object({
  token: z.string().min(1, '인증 토큰이 필요합니다')
})

const resendVerificationSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다').max(320)
})

/**
 * POST /api/auth/check-duplicate
 * 이메일/닉네임 중복 체크
 */
auth.post(
  '/check-duplicate',
  authRateLimit,
  zValidator('json', checkDuplicateSchema as never),
  async (c) => {
    try {
      const { field, value } = c.req.valid('json') as { field: 'email' | 'nickname'; value: string }

      // 필드별 검증
      if (field === 'email') {
        const emailSchema = z.string().email()
        const emailValidation = emailSchema.safeParse(value)

        if (!emailValidation.success) {
          return c.json({
            success: false,
            error: {
              code: 'INVALID_EMAIL',
              message: '올바른 이메일 형식이 아닙니다'
            }
          }, 400)
        }
      }

      if (field === 'nickname') {
        if (value.length < 2 || value.length > 50) {
          return c.json({
            success: false,
            error: {
              code: 'INVALID_NICKNAME_LENGTH',
              message: '닉네임은 2자 이상 50자 이하여야 합니다'
            }
          }, 400)
        }

        // 닉네임 특수문자 체크 (영문, 숫자, 한글, 언더스코어만 허용)
        const nicknamePattern = /^[a-zA-Z0-9가-힣_]+$/

        if (!nicknamePattern.test(value)) {
          return c.json({
            success: false,
            error: {
              code: 'INVALID_NICKNAME_FORMAT',
              message: '닉네임은 영문, 숫자, 한글, 언더스코어만 사용할 수 있습니다'
            }
          }, 400)
        }
      }

      // 데이터베이스에서 중복 체크
      let existingUser

      if (field === 'email') {
        existingUser = await prisma.user.findUnique({
          where: { email: value },
          select: { id: true }
        })
      } else if (field === 'nickname') {
        existingUser = await prisma.user.findUnique({
          where: { nickname: value },
          select: { id: true }
        })
      } else {
        throw new Error('Invalid field')
      }

      const isDuplicate = !!existingUser

      return c.json({
        success: true,
        data: {
          field,
          value,
          isDuplicate
        }
      })

    } catch (error) {
      console.error('Check duplicate error:', error)

      return c.json({
        success: false,
        error: {
          code: 'DUPLICATE_CHECK_FAILED',
          message: '중복 확인 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

/**
 * POST /api/auth/register
 * 회원가입
 */
auth.post(
  '/register',
  authRateLimit,
  zValidator('json', registerSchema as never),
  async (c) => {
    try {
      const { email, nickname, password } = c.req.valid('json') as { email: string; nickname: string; password: string }

      // 비밀번호 정책 검증
      const passwordValidation = validatePasswordPolicy(password)

      if (!passwordValidation.isValid) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: passwordValidation.message ?? '비밀번호가 정책에 맞지 않습니다'
          }
        }, 400)
      }

      // 이메일 중복 체크
      const existingEmail = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      })

      if (existingEmail) {
        return c.json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: '이미 사용중인 이메일입니다'
          }
        }, 400)
      }

      // 닉네임 중복 체크
      const existingNickname = await prisma.user.findUnique({
        where: { nickname },
        select: { id: true }
      })

      if (existingNickname) {
        return c.json({
          success: false,
          error: {
            code: 'NICKNAME_ALREADY_EXISTS',
            message: '이미 사용중인 닉네임입니다'
          }
        }, 400)
      }

      // 비밀번호 해싱
      const hashedPassword = await hashPassword(password)

      // 사용자 생성
      const user = await prisma.user.create({
        data: {
          email,
          nickname,
          password: hashedPassword,
          isVerified: false // 이메일 인증 필요
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          isVerified: true,
          createdAt: true
        }
      })

      // 이메일 인증 토큰 생성
      const emailVerificationToken = generateEmailVerificationToken({
        userId: user.id,
        email: user.email,
        nickname: user.nickname
      })

      // 인증 토큰을 데이터베이스에 저장
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken: emailVerificationToken }
      })

      // JWT 토큰 생성 (이메일 인증 전이므로 제한된 접근)
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        nickname: user.nickname
      })

      return c.json({
        success: true,
        data: {
          user,
          tokens,
          emailVerificationRequired: true,
          message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.'
        }
      }, 201)

    } catch (error) {
      console.error('Register error:', error)

      return c.json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: '회원가입 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

/**
 * POST /api/auth/login
 * 로그인
 */
auth.post(
  '/login',
  loginRateLimit,
  zValidator('json', loginSchema as never),
  async (c) => {
    try {
      const { email, password } = c.req.valid('json') as { email: string; password: string }

      // 사용자 찾기
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          nickname: true,
          password: true,
          isVerified: true
        }
      })

      if (!user) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '이메일 또는 비밀번호가 올바르지 않습니다'
          }
        }, 401)
      }

      // 비밀번호 검증
      const isPasswordValid = await verifyPassword(password, user.password)

      if (!isPasswordValid) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '이메일 또는 비밀번호가 올바르지 않습니다'
          }
        }, 401)
      }

      // JWT 토큰 생성
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        nickname: user.nickname
      })

      // 응답 데이터 (비밀번호 제외)
      const { password: _, ...userWithoutPassword } = user

      return c.json({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens,
          emailVerificationRequired: !user.isVerified
        }
      })

    } catch (error) {
      console.error('Login error:', error)

      return c.json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: '로그인 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

/**
 * POST /api/auth/refresh
 * 토큰 갱신
 */
auth.post(
  '/refresh',
  zValidator('json', refreshTokenSchema as never),
  async (c) => {
    try {
      const { refreshToken } = c.req.valid('json') as { refreshToken: string }

      // 리프레시 토큰 검증
      let payload: JWTPayload

      try {
        payload = verifyToken(refreshToken)
      } catch (_error) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: '유효하지 않은 리프레시 토큰입니다'
          }
        }, 401)
      }

      // 리프레시 토큰 타입 확인
      if (payload.type !== 'refresh') {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_TOKEN_TYPE',
            message: '리프레시 토큰이 아닙니다'
          }
        }, 401)
      }

      // 사용자 존재 확인
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
        return c.json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다'
          }
        }, 401)
      }

      // 새로운 토큰 쌍 생성
      const newTokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        nickname: user.nickname
      })

      return c.json({
        success: true,
        data: {
          tokens: newTokens,
          user
        }
      })

    } catch (error) {
      console.error('Token refresh error:', error)

      return c.json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: '토큰 갱신 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

/**
 * POST /api/auth/verify-token
 * 토큰 검증
 */
auth.post(
  '/verify-token',
  async (c) => {
    try {
      // Authorization 헤더에서 토큰 추출
      const authHeader = c.req.header('Authorization')

      if (!authHeader) {
        return c.json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: '토큰이 제공되지 않았습니다'
          }
        }, 401)
      }

      const token = authHeader.replace('Bearer ', '')

      if (!token || token === authHeader) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_TOKEN_FORMAT',
            message: '토큰 형식이 올바르지 않습니다'
          }
        }, 401)
      }

      // 토큰 검증
      let payload: JWTPayload

      try {
        payload = verifyToken(token)
      } catch (_error) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '유효하지 않은 토큰입니다'
          }
        }, 401)
      }

      // 액세스 토큰인지 확인
      if (payload.type !== 'access') {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_TOKEN_TYPE',
            message: '액세스 토큰이 아닙니다'
          }
        }, 401)
      }

      // 사용자 존재 확인
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
        return c.json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다'
          }
        }, 401)
      }

      return c.json({
        success: true,
        data: {
          valid: true,
          user,
          payload: {
            userId: payload.userId,
            email: payload.email,
            nickname: payload.nickname,
            type: payload.type,
            iat: payload.iat,
            exp: payload.exp
          }
        }
      })

    } catch (error) {
      console.error('Token verification error:', error)

      return c.json({
        success: false,
        error: {
          code: 'TOKEN_VERIFICATION_FAILED',
          message: '토큰 검증 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

/**
 * GET /api/auth/me
 * 현재 사용자 정보 조회
 */
auth.get(
  '/me',
  authMiddleware,
  async (c) => {
    try {
      const user = c.get('user')

      // 사용자 상세 정보 조회
      const userInfo = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          nickname: true,
          bio: true,
          profileImage: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reviews: true,
              followers: true,
              following: true,
              likes: true
            }
          }
        }
      })

      if (!userInfo) {
        return c.json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다'
          }
        }, 404)
      }

      return c.json({
        success: true,
        data: {
          user: userInfo
        }
      })

    } catch (error) {
      console.error('Get user info error:', error)

      return c.json({
        success: false,
        error: {
          code: 'USER_INFO_FAILED',
          message: '사용자 정보 조회 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

/**
 * POST /api/auth/logout
 * 로그아웃 (클라이언트 측에서 토큰 제거)
 */
auth.post(
  '/logout',
  authMiddleware,
  (c) => {
    try {
      // 서버 측 로그아웃 로직 (필요시 토큰 블랙리스트 등)
      // 현재는 클라이언트에서 토큰을 제거하도록 안내

      return c.json({
        success: true,
        data: {
          message: '로그아웃되었습니다'
        }
      })

    } catch (error) {
      console.error('Logout error:', error)

      return c.json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: '로그아웃 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

/**
 * POST /api/auth/send-verification
 * 이메일 인증 발송
 */
auth.post(
  '/send-verification',
  authRateLimit,
  zValidator('json', sendVerificationSchema as never),
  async (c) => {
    try {
      const { email } = c.req.valid('json') as { email: string }

      // 사용자 존재 확인
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          nickname: true,
          isVerified: true,
          verificationToken: true
        }
      })

      if (!user) {
        return c.json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '등록되지 않은 이메일입니다'
          }
        }, 404)
      }

      // 이미 인증된 사용자
      if (user.isVerified) {
        return c.json({
          success: false,
          error: {
            code: 'ALREADY_VERIFIED',
            message: '이미 인증된 계정입니다'
          }
        }, 400)
      }

      // 새로운 인증 토큰 생성
      const verificationToken = generateEmailVerificationToken({
        userId: user.id,
        email: user.email,
        nickname: user.nickname
      })

      // 데이터베이스에 토큰 저장
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken }
      })

      // 이메일 발송
      const emailResult = await sendEmailVerification(
        user.email,
        user.nickname,
        verificationToken
      )

      if (!emailResult.success) {
        console.error('Email sending failed:', emailResult.error)

        return c.json({
          success: false,
          error: {
            code: 'EMAIL_SEND_FAILED',
            message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'
          }
        }, 500)
      }

      // 개발 환경에서 로깅
      logEmailInDevelopment(
        user.email,
        '[ReadZone] 이메일 인증을 완료해주세요',
        `http://localhost:3000/verify-email?token=${verificationToken}`
      )

      return c.json({
        success: true,
        data: {
          message: '인증 이메일이 발송되었습니다. 이메일을 확인해주세요.',
          email: user.email,
          expiresIn: '24시간'
        }
      })

    } catch (error) {
      console.error('Send verification error:', error)

      return c.json({
        success: false,
        error: {
          code: 'VERIFICATION_SEND_FAILED',
          message: '인증 이메일 발송 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

/**
 * POST /api/auth/verify-email
 * 이메일 인증 확인
 */
auth.post(
  '/verify-email',
  zValidator('json', verifyEmailSchema as never),
  async (c) => {
    try {
      const { token } = c.req.valid('json') as { token: string }

      // 토큰 검증
      let payload: JWTPayload

      try {
        payload = verifyToken(token)
      } catch (_error) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_VERIFICATION_TOKEN',
            message: '유효하지 않거나 만료된 인증 토큰입니다'
          }
        }, 400)
      }

      // 이메일 인증 토큰인지 확인
      if (payload.type !== 'email-verification') {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_TOKEN_TYPE',
            message: '이메일 인증 토큰이 아닙니다'
          }
        }, 400)
      }

      // 사용자 존재 및 토큰 일치 확인
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          nickname: true,
          isVerified: true,
          verificationToken: true
        }
      })

      if (!user) {
        return c.json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다'
          }
        }, 404)
      }

      // 토큰 일치 확인
      if (user.verificationToken !== token) {
        return c.json({
          success: false,
          error: {
            code: 'TOKEN_MISMATCH',
            message: '유효하지 않은 인증 토큰입니다'
          }
        }, 400)
      }

      // 이미 인증된 사용자
      if (user.isVerified) {
        return c.json({
          success: false,
          error: {
            code: 'ALREADY_VERIFIED',
            message: '이미 인증된 계정입니다'
          }
        }, 400)
      }

      // 이메일 인증 완료
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null // 사용된 토큰 제거
        }
      })

      // 새로운 액세스 토큰 발급 (인증 상태 반영)
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        nickname: user.nickname
      })

      return c.json({
        success: true,
        data: {
          message: '이메일 인증이 완료되었습니다',
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            isVerified: true
          },
          tokens
        }
      })

    } catch (error) {
      console.error('Email verification error:', error)

      return c.json({
        success: false,
        error: {
          code: 'EMAIL_VERIFICATION_FAILED',
          message: '이메일 인증 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

/**
 * POST /api/auth/resend-verification
 * 인증 이메일 재발송
 */
auth.post(
  '/resend-verification',
  authRateLimit,
  zValidator('json', resendVerificationSchema as never),
  async (c) => {
    try {
      const { email } = c.req.valid('json') as { email: string }

      // 사용자 존재 확인
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          nickname: true,
          isVerified: true,
          verificationToken: true,
          updatedAt: true
        }
      })

      if (!user) {
        return c.json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '등록되지 않은 이메일입니다'
          }
        }, 404)
      }

      // 이미 인증된 사용자
      if (user.isVerified) {
        return c.json({
          success: false,
          error: {
            code: 'ALREADY_VERIFIED',
            message: '이미 인증된 계정입니다'
          }
        }, 400)
      }

      // 재발송 제한 (마지막 업데이트로부터 5분 이내)
      const lastUpdate = new Date(user.updatedAt)
      const now = new Date()
      const timeDiff = now.getTime() - lastUpdate.getTime()
      const fiveMinutes = 5 * 60 * 1000

      if (timeDiff < fiveMinutes) {
        const remainingMinutes = Math.ceil((fiveMinutes - timeDiff) / 60000)

        return c.json({
          success: false,
          error: {
            code: 'RESEND_TOO_SOON',
            message: `${remainingMinutes}분 후에 다시 시도해주세요`
          }
        }, 429)
      }

      // 새로운 인증 토큰 생성
      const verificationToken = generateEmailVerificationToken({
        userId: user.id,
        email: user.email,
        nickname: user.nickname
      })

      // 데이터베이스에 토큰 저장
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken }
      })

      // 이메일 발송
      const emailResult = await sendEmailVerification(
        user.email,
        user.nickname,
        verificationToken
      )

      if (!emailResult.success) {
        console.error('Email resending failed:', emailResult.error)

        return c.json({
          success: false,
          error: {
            code: 'EMAIL_SEND_FAILED',
            message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'
          }
        }, 500)
      }

      // 개발 환경에서 로깅
      logEmailInDevelopment(
        user.email,
        '[ReadZone] 이메일 인증을 완료해주세요 (재발송)',
        `http://localhost:3000/verify-email?token=${verificationToken}`
      )

      return c.json({
        success: true,
        data: {
          message: '인증 이메일이 재발송되었습니다. 이메일을 확인해주세요.',
          email: user.email,
          expiresIn: '24시간'
        }
      })

    } catch (error) {
      console.error('Resend verification error:', error)

      return c.json({
        success: false,
        error: {
          code: 'VERIFICATION_RESEND_FAILED',
          message: '인증 이메일 재발송 중 오류가 발생했습니다'
        }
      }, 500)
    }
  }
)

export default auth