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
  emailOrUserid: string
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
  user: User
  tokens: TokenPair
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
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

/**
 * 인증 토큰이 필요한 API 요청을 위한 fetch 래퍼
 */
async function authenticatedFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('accessToken')
  
  if (!token) {
    throw new Error('No access token found')
  }

  return authFetch<T>(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
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
    body: JSON.stringify({ field, value }),
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '중복 확인 중 오류가 발생했습니다')
  }

  return response.data
}

/**
 * 회원가입
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await authFetch<RegisterResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '회원가입 중 오류가 발생했습니다')
  }

  return response.data
}

/**
 * 로그인
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await authFetch<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '로그인 중 오류가 발생했습니다')
  }

  return response.data
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
  const response = await authenticatedFetch<VerifyTokenResponse>('/verify-token', {
    method: 'POST',
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '토큰 검증 중 오류가 발생했습니다')
  }

  return response.data
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<User> {
  const response = await authenticatedFetch<{ user: User }>('/me', {
    method: 'GET',
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message  ?? '사용자 정보 조회 중 오류가 발생했습니다')
  }

  return response.data.user
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
  const response = await authenticatedFetch<{ message: string }>('/logout', {
    method: 'POST',
  })

  if (!response.success) {
    throw new Error(response.error?.message  ?? '로그아웃 중 오류가 발생했습니다')
  }

  // 로컬 스토리지에서 토큰 제거
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
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

  // 인증 성공 시 토큰 저장
  localStorage.setItem('accessToken', response.data.tokens.accessToken)
  localStorage.setItem('refreshToken', response.data.tokens.refreshToken)

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