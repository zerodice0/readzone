'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { z } from 'zod'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/lib/utils'

// 비밀번호 찾기 검증 스키마
const forgotPasswordSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.'),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordFormProps {
  className?: string
  onSuccess?: () => void
}

export function ForgotPasswordForm({ className, onSuccess }: ForgotPasswordFormProps): JSX.Element {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordInput): Promise<void> => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || '비밀번호 재설정 요청에 실패했습니다.')
      }

      console.log('✅ [FORGOT PASSWORD FORM] API 요청 성공:', result)
      
      setSubmittedEmail(data.email)
      setIsSubmitted(true)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('❌ [FORGOT PASSWORD FORM] API 요청 실패:', error)
      setError('root', {
        message: error instanceof Error ? error.message : '비밀번호 재설정 요청 중 오류가 발생했습니다. 다시 시도해주세요.',
      })
    }
  }

  // 성공 상태 표시
  if (isSubmitted) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader>
          <CardTitle className="text-center">이메일을 확인해주세요</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* 성공 아이콘 */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* 완료 메시지 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              비밀번호 재설정 이메일을 발송했습니다
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-primary-600 dark:text-primary-400">{submittedEmail}</span>로<br />
              비밀번호 재설정 링크를 발송했습니다.
            </p>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">이메일을 확인해주세요</p>
                <p>이메일의 링크를 클릭하여 새로운 비밀번호를 설정할 수 있습니다.</p>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="w-full"
            >
              다른 이메일로 재시도
            </Button>
            
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              로그인 페이지로 돌아가기
            </Button>
          </div>

          {/* 도움말 링크 */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            이메일이 오지 않았나요?{' '}
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
            >
              다시 요청하기
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="text-center">비밀번호 찾기</CardTitle>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
          가입하신 이메일 주소를 입력해주세요.<br />
          비밀번호 재설정 링크를 발송해드립니다.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이메일 입력 */}
          <Input
            label="이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            error={errors.email?.message}
            {...register('email')}
            required
          />

          {/* 전역 에러 메시지 */}
          {errors.root && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center">
              {errors.root.message}
            </div>
          )}

          {/* 비밀번호 재설정 요청 버튼 */}
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? '요청 중...' : '비밀번호 재설정 링크 발송'}
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
                href="/register" 
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 hover:underline font-medium"
              >
                회원가입
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}