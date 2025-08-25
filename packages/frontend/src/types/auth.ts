export interface User {
  id: string
  email: string
  nickname: string
  bio?: string
  profileImage?: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe: boolean
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
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
  rememberMe: boolean
}

export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  verifyToken: () => Promise<boolean>
  refreshTokens: () => Promise<boolean>
  clearError: () => void
  setLoading: (loading: boolean) => void
  getCurrentUser: () => Promise<void>
}