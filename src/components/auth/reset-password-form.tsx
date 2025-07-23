'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { z } from 'zod'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/lib/utils'

// 비밀번호 재설정 검증 스키마 (토큰 제외 - 이미 URL에서 추출됨)
const resetPasswordFormSchema = z.object({
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '비밀번호는 영문과 숫자를 포함해야 합니다.'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
})

type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>

interface ResetPasswordFormProps {
  className?: string
  token: string
  onSuccess?: () => void
}

export function ResetPasswordForm({ className, token, onSuccess }: ResetPasswordFormProps): JSX.Element {
  const [isCompleted, setIsCompleted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password')

  const onSubmit = async (data: ResetPasswordFormInput): Promise<void> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || '비밀번호 재설정에 실패했습니다.')
      }

      console.log('✅ [RESET PASSWORD FORM] 비밀번호 재설정 성공:', result)
      
      setIsCompleted(true)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('❌ [RESET PASSWORD FORM] 비밀번호 재설정 실패:', error)
      setError('root', {
        message: error instanceof Error ? error.message : '비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해주세요.',
      })
    }
  }

  // 성공 상태 표시
  if (isCompleted) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader>
          <CardTitle className="text-center">비밀번호 재설정 완료</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* 성공 아이콘 */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* 완료 메시지 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              비밀번호가 성공적으로 변경되었습니다
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              새로운 비밀번호로 로그인할 수 있습니다.
            </p>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                <p className="font-medium mb-1">보안을 위한 안내</p>
                <p>새로운 비밀번호는 안전하게 저장되었으며, 재설정 링크는 더 이상 사용할 수 없습니다.</p>
              </div>
            </div>
          </div>

          {/* 로그인 버튼 */}
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              로그인하기
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="text-center">새 비밀번호 설정</CardTitle>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
          새로운 비밀번호를 설정해주세요.<br />
          영문과 숫자를 포함하여 8자 이상 입력하세요.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 새 비밀번호 입력 */}
          <Input
            label="새 비밀번호"
            type="password"
            placeholder="새 비밀번호를 입력하세요"
            error={errors.password?.message}
            {...register('password')}
            required
          />

          {/* 비밀번호 강도 표시 */}
          {password && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600 dark:text-gray-400">비밀번호 강도:</div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      getPasswordStrength(password) >= level
                        ? getPasswordStrength(password) >= 3
                          ? 'bg-green-500'
                          : getPasswordStrength(password) >= 2
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <div className={`text-xs ${
                getPasswordStrength(password) >= 3
                  ? 'text-green-600 dark:text-green-400'
                  : getPasswordStrength(password) >= 2
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {getPasswordStrengthText(password)}
              </div>
            </div>
          )}

          {/* 비밀번호 확인 입력 */}
          <Input
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
            required
          />

          {/* 전역 에러 메시지 */}
          {errors.root && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center">
              {errors.root.message}
            </div>
          )}

          {/* 비밀번호 재설정 버튼 */}
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? '변경 중...' : '비밀번호 변경'}
          </Button>

          {/* 하단 링크들 */}
          <div className="space-y-3 text-center text-sm">
            <div className="flex items-center justify-center space-x-4">
              <Link 
                href="/login" 
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 hover:underline font-medium"
              >
                로그인
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Link 
                href="/forgot-password" 
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 hover:underline font-medium"
              >
                다시 재설정 요청
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// 비밀번호 강도 계산 함수
function getPasswordStrength(password: string): number {
  let strength = 0
  
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
  
  return Math.min(4, strength)
}

// 비밀번호 강도 텍스트
function getPasswordStrengthText(password: string): string {
  const strength = getPasswordStrength(password)
  
  switch (strength) {
    case 0:
    case 1:
      return '매우 약함'
    case 2:
      return '약함'
    case 3:
      return '보통'
    case 4:
      return '강함'
    default:
      return ''
  }
}