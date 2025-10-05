export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN'

export interface User {
  id: string
  userid: string
  email: string
  nickname: string
  bio?: string
  profileImage?: string
  isVerified: boolean
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  userid: string
  password: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface AuthError {
  code: string
  message: string
  field?: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  // refreshToken 제거 - Cookie로 관리
  isAuthenticated: boolean
  isAuthReady: boolean
  isLoading: boolean
  error: AuthError | null
  rememberMe: boolean
}

export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<boolean> // 성공 여부 반환으로 변경
  logout: () => Promise<void> // Cookie 기반으로 변경되어 async
  verifyToken: () => Promise<boolean>
  refreshTokens: () => Promise<boolean>
  clearError: () => void
  setLoading: (loading: boolean) => void
  getCurrentUser: () => Promise<void>
}
