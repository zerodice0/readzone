import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { prisma } from '../lib/prisma'
import { hashPassword, validatePasswordPolicy, verifyPassword } from '../lib/password'
import { generateEmailVerificationToken, generateTokenPair } from '../lib/jwt'
import { createAuthRouteResponse } from '../schemas/common'
import { AuthRequest, LoginData, RegisterData } from '../schemas/auth'

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

export default auth