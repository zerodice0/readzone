import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { prisma } from '../lib/prisma'
import { hashPassword, validatePasswordPolicy, verifyPassword } from '../lib/password'
import { generateEmailVerificationToken, generateTokenPair, verifyToken, validateTokenType } from '../lib/jwt'
import { createAuthRouteResponse } from '../schemas/common'
import { AuthRequest, CheckDuplicateData, LoginData, RegisterData } from '../schemas/auth'

const auth = new OpenAPIHono()

// Rate limiting for auth endpoints (removed unused variables)

// 스키마들은 schemas/auth.ts로 이동됨

// Login Route
const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Authentication'],
  summary: '로그인',
  description: '이메일과 비밀번호로 로그인합니다.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AuthRequest.login
        }
      }
    }
  },
  responses: createAuthRouteResponse(LoginData, {
    successDescription: '로그인 성공'
  })
})

auth.openapi(loginRoute, async (c) => {
  try {
    const { email, password } = c.req.valid('json')

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
        success: false as const,
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
        success: false as const,
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

    // 응답 데이터 (비밀번호 제외) - 스키마 순서에 맞게 구성
    const userResponse = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isVerified: user.isVerified
    }

    return c.json({
      success: true as const,
      data: {
        user: userResponse,
        tokens,
        emailVerificationRequired: Boolean(!user.isVerified)
      }
    }, 200)

  } catch (error) {
    console.error('Login error:', error)

    return c.json({
      success: false as const,
      error: {
        code: 'LOGIN_FAILED',
        message: '로그인 중 오류가 발생했습니다'
      }
    }, 500)
  }
})

// Check Duplicate Route
const checkDuplicateRoute = createRoute({
  method: 'post',
  path: '/check-duplicate',
  tags: ['Authentication'],
  summary: '이메일/닉네임 중복 체크',
  description: '회원가입 시 이메일 또는 닉네임 중복을 확인합니다.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AuthRequest.checkDuplicate
        }
      }
    }
  },
  responses: createAuthRouteResponse(CheckDuplicateData, {
    successDescription: '중복 체크 완료'
  })
})

auth.openapi(checkDuplicateRoute, async (c) => {
  try {
    const { field, value } = c.req.valid('json')

    // 필드별 추가 검증
    if (field === 'email') {
      // 이메일 형식은 이미 스키마에서 검증됨
      if (value.length > 320) {
        return c.json({
          success: false as const,
          error: {
            code: 'INVALID_EMAIL_LENGTH',
            message: '이메일이 너무 깁니다'
          }
        }, 400)
      }
    }

    if (field === 'nickname') {
      // 닉네임 길이는 이미 스키마에서 검증됨
      if (value.length < 2 || value.length > 50) {
        return c.json({
          success: false as const,
          error: {
            code: 'INVALID_NICKNAME_LENGTH',
            message: '닉네임은 2자 이상 50자 이하여야 합니다'
          }
        }, 400)
      }

      // 닉네임 특수문자 체크 (영문, 숫자, 한글, 언더스코어, 하이픈만 허용)
      const nicknamePattern = /^[a-zA-Z0-9가-힣_-]+$/
      
      if (!nicknamePattern.test(value)) {
        return c.json({
          success: false as const,
          error: {
            code: 'INVALID_NICKNAME_FORMAT',
            message: '닉네임은 영문, 숫자, 한글, 언더스코어, 하이픈만 사용할 수 있습니다'
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
    }

    const isDuplicate = !!existingUser

    return c.json({
      success: true as const,
      data: {
        field,
        value,
        isDuplicate
      }
    }, 200)

  } catch (error) {
    console.error('Check duplicate error:', error)

    return c.json({
      success: false as const,
      error: {
        code: 'DUPLICATE_CHECK_FAILED',
        message: '중복 확인 중 오류가 발생했습니다'
      }
    }, 500)
  }
})

// Register Route
const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Authentication'],
  summary: '회원가입',
  description: '새 계정을 생성합니다.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AuthRequest.register
        }
      }
    }
  },
  responses: createAuthRouteResponse(RegisterData, {
    successDescription: '회원가입 성공',
    successStatus: 201
  })
})

auth.openapi(registerRoute, async (c) => {
  try {
    const { email, nickname, password } = c.req.valid('json')

    // 비밀번호 정책 검증
    const passwordValidation = validatePasswordPolicy(password)

    if (!passwordValidation.isValid) {
      return c.json({
        success: false as const,
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
        success: false as const,
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
        success: false as const,
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

    // 스키마 순서에 맞게 사용자 응답 구성
    const userResponse = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString()
    }

    return c.json({
      success: true as const,
      data: {
        user: userResponse,
        tokens,
        emailVerificationRequired: true as const,
        message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.'
      }
    }, 201)

  } catch (error) {
    console.error('Register error:', error)

    return c.json({
      success: false as const,
      error: {
        code: 'REGISTRATION_FAILED',
        message: '회원가입 중 오류가 발생했습니다'
      }
    }, 500)
  }
})

// Refresh Token Route
const refreshRoute = createRoute({
  method: 'post',
  path: '/refresh',
  tags: ['Authentication'],
  summary: '토큰 갱신',
  description: '리프레시 토큰으로 새로운 액세스 토큰을 발급받습니다.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AuthRequest.refresh
        }
      }
    }
  },
  responses: createAuthRouteResponse(LoginData, {
    successDescription: '토큰 갱신 성공'
  })
})

auth.openapi(refreshRoute, async (c) => {
  try {
    const { refreshToken } = c.req.valid('json')

    // 리프레시 토큰 검증
    const payload = verifyToken(refreshToken)
    
    // 토큰 타입 확인
    if (!validateTokenType(refreshToken, 'refresh')) {
      return c.json({
        success: false as const,
        error: {
          code: 'INVALID_TOKEN',
          message: '유효하지 않은 리프레시 토큰입니다'
        }
      }, 401)
    }

    // 사용자 정보 조회
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
        success: false as const,
        error: {
          code: 'USER_NOT_FOUND',
          message: '사용자를 찾을 수 없습니다'
        }
      }, 404)
    }

    // 새 토큰 쌍 생성
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      nickname: user.nickname
    })

    return c.json({
      success: true as const,
      data: {
        user,
        tokens,
        emailVerificationRequired: Boolean(!user.isVerified)
      }
    }, 200)

  } catch (error) {
    console.error('Refresh token error:', error)

    return c.json({
      success: false as const,
      error: {
        code: 'TOKEN_REFRESH_FAILED',
        message: '토큰 갱신 중 오류가 발생했습니다'
      }
    }, 500)
  }
})

export default auth