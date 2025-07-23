'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { signIn, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { queryKeys, handleQueryError } from '@/lib/query-client'
import { useAuthStore } from '@/store/auth-store'
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

// 인증 이메일 재발송 훅
export function useResendVerification() {
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
        throw new Error('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
      }

      return result
    },
    onSuccess: () => {
      toast.success('로그인되었습니다.')
      // 홈 페이지로 리다이렉트는 컴포넌트에서 처리
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(message)
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