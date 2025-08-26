/**
 * 인증 관련 API 요청/응답 타입
 * - 로그인, 회원가입, 토큰 관리에 사용
 * - JWT 토큰 페이로드 정의
 */

/** JWT 토큰 페이로드 */
export interface JWTPayload {
  userId: string
  email: string
  nickname: string
  iat?: number                 // 발행 시간
  exp?: number                 // 만료 시간
}

/** 로그인 요청 */
export interface LoginRequest {
  email: string
  password: string
}

/** 회원가입 요청 */
export interface RegisterRequest {
  email: string
  nickname: string
  password: string
}

/** 로그인/회원가입 응답 */
export interface AuthResponse {
  user: {
    id: string
    email: string
    nickname: string
    profileImage?: string | null
    isVerified: boolean
  }
  token: string                // JWT 토큰
}

/** 비밀번호 찾기 요청 */
export interface ForgotPasswordRequest {
  email: string
}

/** 비밀번호 재설정 요청 */
export interface ResetPasswordRequest {
  token: string               // 재설정 토큰
  newPassword: string
}

/** 이메일 인증 요청 */
export interface VerifyEmailRequest {
  token: string               // 이메일 인증 토큰
}

/** 토큰 갱신 응답 */
export interface RefreshTokenResponse {
  token: string               // 새로운 JWT 토큰
}