'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useLogin, useResendVerification } from '@/hooks/use-auth-api'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { cn } from '@/lib/utils'
import { AuthErrorCode } from '@/types/error'
import { EmailVerificationPrompt } from './email-verification-prompt'
import { EmailGuideModal } from './email-guide-modal'

interface LoginFormProps {
  className?: string
  onSuccess?: () => void
}

export function LoginForm({ className, onSuccess }: LoginFormProps): JSX.Element {
  const router = useRouter()
  const login = useLogin()
  const resendVerification = useResendVerification()
  const [showPassword, setShowPassword] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showEmailGuide, setShowEmailGuide] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginInput): Promise<void> => {
    try {
      await login.mutateAsync(data)
      
      // 성공 시 리다이렉트 또는 콜백 실행
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/')
      }
    } catch (error) {
      // Enhanced error handling with error codes
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.'
      const errorCode = (error as any)?.code
      const isActionable = (error as any)?.actionable
      
      // Handle specific error types with appropriate UI
      if (errorCode === AuthErrorCode.EMAIL_NOT_VERIFIED || 
          errorMessage.includes('이메일 인증이 필요합니다') ||
          errorMessage.includes('이메일 인증이 완료되지 않았습니다') ||
          isActionable) {
        setNeedsVerification(true)
        setUserEmail(data.email)
        // Clear any existing form errors since we'll show the verification prompt
        clearErrors('root')
      } else {
        setNeedsVerification(false)
        setError('root', {
          message: errorMessage,
        })
      }
    }
  }

  const handleShowEmailGuide = (): void => {
    setShowEmailGuide(true)
  }

  const handleCloseEmailGuide = (): void => {
    setShowEmailGuide(false)
  }

  const handleEmailChange = (): void => {
    clearErrors('email')
    clearErrors('root')
    setNeedsVerification(false)
  }

  const handlePasswordChange = (): void => {
    clearErrors('password')
    clearErrors('root')
    setNeedsVerification(false)
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="text-center">로그인</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이메일 입력 */}
          <Input
            label="이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            error={errors.email?.message}
            {...register('email', {
              onChange: handleEmailChange,
            })}
            required
          />

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                label="비밀번호"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                error={errors.password?.message}
                {...register('password', {
                  onChange: handlePasswordChange,
                })}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 이메일 인증 필요 시 EmailVerificationPrompt 표시 */}
          {needsVerification && userEmail && (
            <EmailVerificationPrompt
              email={userEmail}
              onShowGuide={handleShowEmailGuide}
              className="mb-4"
            />
          )}

          {/* 일반 에러 메시지 (이메일 인증 에러가 아닌 경우만) */}
          {errors.root && !needsVerification && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center">
              {errors.root.message}
            </div>
          )}

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting || login.isPending}
            disabled={isSubmitting || login.isPending}
          >
            {isSubmitting || login.isPending ? '로그인 중...' : '로그인'}
          </Button>

          {/* 하단 링크들 */}
          <div className="space-y-3 text-center text-sm">
            <div>
              <Link 
                href="/forgot-password" 
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-gray-500 dark:text-gray-400">계정이 없으신가요?</span>
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
      
      {/* 이메일 확인 가이드 모달 */}
      <EmailGuideModal
        isOpen={showEmailGuide}
        onClose={handleCloseEmailGuide}
        userEmail={userEmail}
      />
    </Card>
  )
}