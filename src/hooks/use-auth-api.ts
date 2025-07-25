'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { signIn, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { queryKeys, handleQueryError } from '@/lib/query-client'
import { useAuthStore } from '@/store/auth-store'
import { AuthErrorCode, createAuthError, type AuthError } from '@/types/error'
import type { 
  RegisterRequest, 
  RegisterResponse, 
  CheckDuplicateRequest, 
  CheckDuplicateResponse,
  VerifyEmailRequest,
  VerifyEmailResponse 
} from '@/types/auth'

// API 호출 함수들
const authApi = {
  // 회원가입
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '회원가입에 실패했습니다.')
    }
    
    return result
  },

  // 중복 확인
  checkDuplicate: async (data: CheckDuplicateRequest): Promise<CheckDuplicateResponse> => {
    const response = await fetch('/api/auth/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '중복 확인에 실패했습니다.')
    }
    
    return result
  },

  // 이메일 인증
  verifyEmail: async (data: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '이메일 인증에 실패했습니다.')
    }
    
    return result
  },

  // 인증 이메일 재발송
  resendVerification: async (data: { email: string }): Promise<{ message: string }> => {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || '인증 이메일 재발송에 실패했습니다.')
    }
    
    return result
  },
}

// 회원가입 훅
export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      toast.success(data.message)
      // 인증 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session })
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
    },
  })
}

// 중복 확인 훅
export function useCheckDuplicate() {
  return useMutation({
    mutationFn: authApi.checkDuplicate,
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
    },
  })
}

// 이메일 인증 훅
export function useVerifyEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (data) => {
      toast.success(data.message)
      // 인증 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session })
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
    },
  })
}

// 인증 이메일 재발송 훅 (기본 - 제한 없음)
export function useResendVerificationBasic() {
  return useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: (data) => {
      toast.success(data.message)
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
    },
  })
}

/**
 * NextAuth 에러 메시지를 구조화된 AuthError로 변환
 * 타입 안전성과 유지보수성을 보장하는 중앙화된 파싱 로직
 */
function parseNextAuthError(errorMessage: string, email?: string): AuthError {
  // 에러 패턴 매핑 - 확장 가능한 구조
  const errorPatterns: Array<{
    patterns: string[]
    code: AuthErrorCode
    details?: Record<string, any>
  }> = [
    {
      patterns: [
        '이메일 인증이 필요합니다',
        '이메일 인증이 완료되지 않았습니다', 
        'Email verification required',
        'EMAIL_NOT_VERIFIED',
        'CredentialsSignin'  // NextAuth v5 기본 에러
      ],
      code: AuthErrorCode.EMAIL_NOT_VERIFIED,
      details: {
        actionable: true,
        actions: ['resend_email', 'show_guide'],
        email
      }
    },
    {
      patterns: [
        '등록되지 않은 이메일입니다',
        'User not found',
        'USER_NOT_FOUND'
      ],
      code: AuthErrorCode.USER_NOT_FOUND,
      details: { email }
    },
    {
      patterns: [
        '비밀번호가 올바르지 않습니다',
        '이메일 또는 비밀번호가 올바르지 않습니다',
        'Invalid credentials',
        'INVALID_CREDENTIALS'
      ],
      code: AuthErrorCode.INVALID_CREDENTIALS,
      details: { email }
    },
    {
      patterns: [
        '필수 입력 정보가 누락되었습니다',
        '이메일과 비밀번호를 입력해주세요',
        'Missing required field',
        'MISSING_REQUIRED_FIELD'
      ],
      code: AuthErrorCode.MISSING_REQUIRED_FIELD
    },
    {
      patterns: [
        '계정이 일시적으로 잠겼습니다',
        'Account locked',
        'ACCOUNT_LOCKED'
      ],
      code: AuthErrorCode.ACCOUNT_LOCKED,
      details: { email }
    },
    {
      patterns: [
        '너무 많은 시도',
        'Too many attempts',
        'TOO_MANY_ATTEMPTS'
      ],
      code: AuthErrorCode.TOO_MANY_ATTEMPTS,
      details: { email }
    }
  ]

  // 패턴 매칭을 통한 에러 코드 식별
  for (const { patterns, code, details } of errorPatterns) {
    const isMatch = patterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    )
    
    if (isMatch) {
      return createAuthError(code, {
        ...details,
        originalMessage: errorMessage,
        operation: 'login'
      })
    }
  }

  // 알 수 없는 에러의 경우 기본 처리
  return createAuthError(AuthErrorCode.INTERNAL_ERROR, {
    originalMessage: errorMessage,
    operation: 'login',
    email
  })
}

// 로그인 훅
export function useLogin() {
  const { setLoading } = useAuthStore()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      setLoading(true)
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // NextAuth v5: signIn 실패 시 별도 API로 구체적인 에러 정보 조회
        try {
          const errorResponse = await fetch(`/api/auth/last-error?email=${encodeURIComponent(email)}`)
          
          if (errorResponse.ok) {
            const errorData = await errorResponse.json()
            const authError = errorData.error
            
            // 구조화된 AuthError를 Error 객체로 변환
            const error = new Error(authError.message)
            Object.assign(error, {
              code: authError.code,
              details: authError.details,
              timestamp: authError.timestamp,
              actionable: authError.details?.actionable || false,
              actions: authError.details?.actions || []
            })
            
            throw error
          }
        } catch (apiError) {
          // API 호출 실패 시 기본 에러 파싱으로 fallback
        }
        
        // 구체적인 에러 정보를 가져올 수 없는 경우 기존 방식 사용
        const authError = parseNextAuthError(result.error, email)
        const error = new Error(authError.userMessage)
        Object.assign(error, {
          code: authError.code,
          details: authError.details,
          timestamp: authError.timestamp,
          actionable: authError.details?.actionable || false,
          actions: authError.details?.actions || []
        })
        
        throw error
      }

      return result
    },
    onSuccess: () => {
      toast.success('로그인되었습니다.')
      // 홈 페이지로 리다이렉트는 컴포넌트에서 처리
    },
    onError: (error) => {
      // EMAIL_NOT_VERIFIED 에러는 LoginForm에서 처리하므로 토스트 표시하지 않음
      const authError = error as any
      if (authError.code !== AuthErrorCode.EMAIL_NOT_VERIFIED) {
        const message = handleQueryError(error)
        toast.error(message)
      }
      setLoading(false)
    },
    onSettled: () => {
      setLoading(false)
    },
  })
}

// 로그아웃 훅
export function useLogout() {
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      await signOut({ redirect: false })
      await logout()
    },
    onSuccess: () => {
      toast.success('로그아웃되었습니다.')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
    },
  })
}

// 실시간 중복 확인을 위한 디바운스 훅
export function useDebouncedDuplicateCheck(
  field: 'email' | 'nickname',
  value: string
) {
  return useQuery({
    queryKey: ['duplicate-check', field, value],
    queryFn: () => authApi.checkDuplicate({ field, value }),
    enabled: value.length > 0,
    staleTime: 30000, // 30초간 캐시
    gcTime: 60000, // 1분간 메모리 유지
    retry: false, // 중복 확인은 재시도하지 않음
  })
}