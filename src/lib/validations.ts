import { z } from 'zod'

// 회원가입 검증 스키마
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '비밀번호는 영문과 숫자를 포함해야 합니다.'
    ),
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하여야 합니다.')
    .regex(
      /^[가-힣a-zA-Z0-9_-]+$/,
      '닉네임은 한글, 영문, 숫자, _, - 만 사용 가능합니다.'
    ),
})

// 로그인 검증 스키마
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

// 중복 확인 검증 스키마
export const checkDuplicateSchema = z.object({
  field: z.enum(['email', 'nickname']),
  value: z.string().min(1, '값을 입력해주세요.'),
})

// 이메일 인증 검증 스키마
export const verifyEmailSchema = z.object({
  token: z.string().min(1, '인증 토큰이 필요합니다.'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CheckDuplicateInput = z.infer<typeof checkDuplicateSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>