import { type DefaultSession } from 'next-auth'

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface RegisterRequest {
  email: string
  password: string
  nickname: string
}

export interface RegisterResponse {
  success: boolean
  message: string
  userId?: string
}

export interface CheckDuplicateRequest {
  field: 'email' | 'nickname'
  value: string
}

export interface CheckDuplicateResponse {
  available: boolean
  message?: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
}