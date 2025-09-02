interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

interface CheckDuplicateRequest {
  field: 'email' | 'nickname' | 'userid'
  value: string
}

interface CheckDuplicateResponse {
  field: 'email' | 'nickname' | 'userid'
  value: string
  isDuplicate: boolean
}

interface User {
  id: string
  userid: string
  email: string
  nickname: string
  bio?: string
  profileImage?: string
  isVerified: boolean
  createdAt: string
  updatedAt?: string
  _count?: {
    reviews: number
    followers: number
    following: number
    likes: number
  }
}

interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: string
  tokenType: string
}

interface RegisterRequest {
  userid: string
  email: string
  nickname: string
  password: string
}

interface RegisterResponse {
  user: User
  tokens: TokenPair
  emailVerificationRequired: boolean
  message: string
}

interface LoginRequest {
  userid: string
  password: string
}

interface LoginResponse {
  user: User
  tokens: TokenPair
  emailVerificationRequired: boolean
}

interface RefreshTokenRequest {
  refreshToken: string
}

interface RefreshTokenResponse {
  tokens: TokenPair
  user: User
}

interface VerifyTokenResponse {
  valid: boolean
  user: User
  payload: {
    userId: string
    email: string
    nickname: string
    type: string
    iat: number
    exp: number
  }
}

interface SendVerificationRequest {
  email: string
}

interface SendVerificationResponse {
  message: string
  email: string
  expiresIn: string
}

interface VerifyEmailRequest {
  token: string
}

interface VerifyEmailResponse {
  message: string
  user?: User
  tokens?: TokenPair
}

interface ResendVerificationRequest {
  email: string
}

interface ResendVerificationResponse {
  message: string
  email: string
  expiresIn: string
}

const API_BASE_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:3001/api'
  : '/api'

/**
 * 백엔드 로그인 응답 타입 정의
 */
interface BackendLoginResponse {
  success: boolean
  message?: string
  user?: User
  tokens?: TokenPair
  error?: {
    code: string
    message: string | string[]
  }
}

/**
 * 인증 API 요청을 위한 fetch 래퍼
 */
async function authFetch<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}/auth${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    // 에러 응답 처리
    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }))
    
    // validation 에러 배열 처리
    if (errorData.message && Array.isArray(errorData.message)) {
      throw new Error(errorData.message.join(', '))
    }
    
    throw new Error(errorData.message ?? `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

/**
 * 이메일/닉네임/아이디 중복 체크
 */
export async function checkDuplicate(
  field: 'email' | 'nickname' | 'userid',
  value: string
): Promise<CheckDuplicateResponse> {
  const response = await authFetch<CheckDuplicateResponse>('/check-duplicate', {
    method: 'POST',
    body: JSON.stringify({ [field]: value }),
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '중복 확인 중 오류가 발생했습니다')
  }

  return response.data
}

/**
 * 회원가입
 */
// 백엔드 회원가입 응답(래핑 없이 반환됨)
interface BackendRegisterResponse {
  success: boolean
  message?: string
  user?: User
  // tokens는 회원가입 단계에선 반환하지 않음
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await authFetch<BackendRegisterResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  // 백엔드가 래핑 없이 { success, user, message } 형태로 반환하므로 이에 맞춰 변환
  const payload = response as unknown as BackendRegisterResponse

  if (payload?.success && payload.user) {
    return {
      user: payload.user,
      // 회원가입 직후에는 이메일 인증이 필요하므로 true로 고정
      emailVerificationRequired: true,
      // tokens는 회원가입 응답에서 제공하지 않음(쿠키 기반 전환 이후 설계)
      tokens: {
        accessToken: '',
        refreshToken: '',
        expiresIn: '',
        tokenType: 'Bearer',
      },
      message: payload.message ?? '회원가입이 완료되었습니다.',
    }
  }

  // 에러 처리(래핑된 에러 구조가 올 수도 있으므로 함께 고려)
  const respObj = response as { error?: { message?: string } } | unknown
  const errMsg =
    (typeof respObj === 'object' && respObj !== null && 'error' in respObj &&
      typeof (respObj as { error?: { message?: string } }).error?.message === 'string'
      ? (respObj as { error?: { message?: string } }).error?.message
      : undefined) ?? payload?.message

  throw new Error(errMsg ?? '회원가입 중 오류가 발생했습니다')
}

/**
 * 로그인
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await authFetch<BackendLoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  // 기존 data 래핑 형식 지원
  if (response.success && response.data) {
    const backendData = response.data

    if (backendData.user && backendData.tokens) {
      return {
        user: backendData.user,
        tokens: backendData.tokens,
        emailVerificationRequired: !backendData.user.isVerified
      }
    }
  }

  // 에러 처리
  const errorMessage = response.error?.message

  if (Array.isArray(errorMessage)) {
    throw new Error(errorMessage.join(', '))
  }
  
  throw new Error(errorMessage ?? '로그인 중 오류가 발생했습니다.')
}

/**
 * 토큰 갱신
 */
export async function refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await authFetch<RefreshTokenResponse>('/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '토큰 갱신 중 오류가 발생했습니다')
  }

  return response.data
}

/**
 * 토큰 검증
 */
export async function verifyToken(): Promise<VerifyTokenResponse> {
  throw new Error('Use useAuthStore().verifyToken() instead')
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<User> {
  throw new Error('Use useAuthStore().getCurrentUser() instead')
}

/**
 * userid로 사용자 프로필 조회
 */
export async function getUserProfile(userid: string): Promise<User> {
  const API_BASE_URL = import.meta.env.MODE === 'development' 
    ? 'http://localhost:3001/api'
    : '/api'

  const response = await fetch(`${API_BASE_URL}/users/${userid}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()

  if (!result.success || !result.data) {
    throw new Error(result.error?.message ?? '사용자 프로필 조회 중 오류가 발생했습니다')
  }

  return result.data.user
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  throw new Error('Use useAuthStore().logout() instead')
}

/**
 * 이메일 인증 발송
 */
export async function sendEmailVerification(email: string): Promise<SendVerificationResponse> {
  const response = await authFetch<SendVerificationResponse>('/send-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '이메일 인증 발송 중 오류가 발생했습니다')
  }

  return response.data
}

/**
 * 이메일 인증 확인
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const response = await authFetch<VerifyEmailResponse>('/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '이메일 인증 중 오류가 발생했습니다')
  }

  // 토큰 저장은 호출하는 곳에서 authStore를 통해 처리
  return response.data
}

/**
 * 인증 이메일 재발송
 */
export async function resendEmailVerification(email: string): Promise<ResendVerificationResponse> {
  const response = await authFetch<ResendVerificationResponse>('/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '인증 이메일 재발송 중 오류가 발생했습니다')
  }

  return response.data
}

/**
 * 비밀번호 재설정 요청
 */
export async function requestPasswordReset(email: string, recaptchaToken?: string): Promise<{
  success: boolean
  message: string
  sentTo: string
  }> {
  const url = `${API_BASE_URL}/auth/forgot-password`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, recaptchaToken }),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error?.message ?? data?.message ?? '비밀번호 재설정 요청 중 오류가 발생했습니다')
  }

  return data
}

/**
 * 재설정 토큰 검증
 */
export async function checkResetToken(token: string): Promise<{
  success: boolean
  status: 'valid' | 'invalid' | 'expired' | 'used'
  message: string
  tokenInfo?: { email: string; expiresAt: string; createdAt: string }
  canRequestNew: boolean
}> {
  const url = `${API_BASE_URL}/auth/reset-password?token=${encodeURIComponent(token)}`
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error?.message ?? data?.message ?? '재설정 토큰 확인 중 오류가 발생했습니다')
  }

  return data
}

/**
 * 비밀번호 재설정 처리
 */
export async function resetPasswordWithToken(payload: { token: string; newPassword: string; confirmPassword: string }): Promise<{
  success: boolean
  message: string
  user?: User
  tokens?: TokenPair
  invalidatedSessions?: number
}> {
  const url = `${API_BASE_URL}/auth/reset-password`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = await res.json()

  if (!res.ok || data?.success === false) {
    throw new Error(data?.error?.message ?? data?.message ?? '비밀번호 재설정 중 오류가 발생했습니다')
  }

  return data
}

// 타입 내보내기
export type {
  CheckDuplicateRequest,
  CheckDuplicateResponse,
  User,
  TokenPair,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  VerifyTokenResponse,
  SendVerificationRequest,
  SendVerificationResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
}
