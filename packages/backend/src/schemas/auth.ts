import { z } from 'zod'

/**
 * Auth 도메인 스키마 정의
 */

// 로그인용 사용자 정보 스키마 (createdAt 없음)
export const LoginUserInfo = z.object({
  id: z.string(),
  email: z.string(),
  nickname: z.string(),
  isVerified: z.boolean()
})

// 회원가입용 사용자 정보 스키마 (createdAt 포함)
export const RegisterUserInfo = z.object({
  id: z.string(),
  email: z.string(),
  nickname: z.string(),
  isVerified: z.boolean(),
  createdAt: z.string()
})

// 토큰 정보 스키마
export const TokenInfo = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.string(),
  tokenType: z.string()
})

// 로그인 응답 데이터 스키마
export const LoginData = z.object({
  user: LoginUserInfo,
  tokens: TokenInfo,
  emailVerificationRequired: z.boolean()
})

// 회원가입 응답 데이터 스키마
export const RegisterData = z.object({
  user: RegisterUserInfo,
  tokens: TokenInfo,
  emailVerificationRequired: z.literal(true),
  message: z.string()
})

// 중복 체크 응답 데이터 스키마
export const CheckDuplicateData = z.object({
  field: z.enum(['email', 'nickname']),
  value: z.string(),
  isDuplicate: z.boolean()
})

/**
 * Request 스키마들
 */
export const AuthRequest = {
  // 로그인 요청
  login: z.object({
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: z.string().min(1)
  }),
  
  // 회원가입 요청
  register: z.object({
    email: z.string().email('올바른 이메일 형식이 아닙니다').max(320),
    nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다').max(50, '닉네임은 50자 이하여야 합니다'),
    password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다').max(128)
  }),

  // 중복 체크 요청
  checkDuplicate: z.object({
    field: z.enum(['email', 'nickname'], {
      message: 'field는 email 또는 nickname이어야 합니다'
    }),
    value: z.string().min(1, '값이 필요합니다').max(320, '값이 너무 깁니다')
  }),

  // 토큰 갱신 요청
  refresh: z.object({
    refreshToken: z.string().min(1, '리프레시 토큰이 필요합니다')
  }),

  // 이메일 인증 재발송 요청
  resendVerification: z.object({
    email: z.string().email('올바른 이메일 형식이 아닙니다').max(320)
  }),

  // 이메일 인증 처리 요청
  verifyEmail: z.object({
    token: z.string().min(1, '인증 토큰이 필요합니다')
  })
}