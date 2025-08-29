import { z } from 'zod'

// 로그인 폼 검증 스키마
export const loginSchema = z.object({
  userid: z
    .string()
    .min(1, '아이디를 입력해주세요.')
    .min(3, '아이디는 최소 3자 이상이어야 합니다.')
    .max(30, '아이디는 최대 30자까지 가능합니다.')
    .regex(
      /^[a-z0-9_-]+$/,
      '아이디는 영문 소문자, 숫자, _, - 만 사용 가능합니다.'
    ),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요.')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.')
    .max(128, '비밀번호가 너무 깁니다.'),
  rememberMe: z.boolean().default(false),
})

export type LoginFormData = z.infer<typeof loginSchema>

// 회원가입 폼 검증 스키마
export const registerSchema = z.object({
  userid: z
    .string()
    .min(1, '아이디를 입력해주세요.')
    .min(3, '아이디는 최소 3자 이상이어야 합니다.')
    .max(30, '아이디는 최대 30자까지 가능합니다.')
    .regex(
      /^[a-z0-9_-]+$/,
      '아이디는 영문 소문자, 숫자, _, - 만 사용 가능합니다.'
    ),
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식을 입력해주세요.')
    .max(320, '이메일이 너무 깁니다.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요.')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .max(64, '비밀번호는 최대 64자까지 입력할 수 있습니다.')
    .regex(
      /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=[\]{}|;:,.<>?]+$/,
      '비밀번호는 소문자, 숫자, 특수문자(!@#$%^&*()_+-=[]{}|;:,.<>?)를 각각 최소 1개씩 포함해야 합니다.'
    ),
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  nickname: z
    .string()
    .min(1, '닉네임을 입력해주세요.')
    .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .max(50, '닉네임은 최대 50자까지 가능합니다.')
    .regex(
      /^[가-힣a-zA-Z0-9_]+$/,
      '닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.'
    ),
  terms: z.boolean().refine((val) => val === true, {
    message: '서비스 이용약관에 동의해주세요.',
  }),
  privacy: z.boolean().refine((val) => val === true, {
    message: '개인정보 처리방침에 동의해주세요.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

// 비밀번호 찾기 폼 검증 스키마
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식을 입력해주세요.')
    .max(255, '이메일이 너무 깁니다.'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// 비밀번호 재설정 폼 검증 스키마
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .max(100, '비밀번호가 너무 깁니다.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '비밀번호는 영문 대/소문자, 숫자를 포함해야 합니다.'
    ),
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  token: z.string().min(1, '유효하지 않은 링크입니다.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// 이메일 인증 재발송 스키마
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식을 입력해주세요.')
    .max(255, '이메일이 너무 깁니다.'),
})

export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>

// 일반적인 에러 메시지
export const AUTH_ERROR_MESSAGES = {
  UNAUTHORIZED: '아이디 또는 비밀번호가 올바르지 않습니다.',
  LOGIN_FAILED: '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  EMAIL_NOT_VERIFIED: '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
  ACCOUNT_LOCKED: '계정이 잠겼습니다. 잠시 후 다시 시도해주세요.',
  TOO_MANY_ATTEMPTS: '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  USERID_ALREADY_EXISTS: '이미 사용중인 아이디입니다.',
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일입니다.',
  NICKNAME_ALREADY_EXISTS: '이미 사용중인 닉네임입니다.',
  INVALID_TOKEN: '유효하지 않은 토큰입니다.',
  EXPIRED_TOKEN: '만료된 토큰입니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES