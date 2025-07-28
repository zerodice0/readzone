'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useLogin } from '@/hooks/use-auth-api'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { cn } from '@/lib/utils'
import { AuthErrorCode, type AuthError } from '@/types/error'
import { Eye, EyeOff } from 'lucide-react'
import { EmailVerificationPrompt } from './email-verification-prompt'
import { EmailGuideModal } from './email-guide-modal'

interface LoginFormProps {
  className?: string
  onSuccess?: () => void
}

export function LoginForm({ className, onSuccess }: LoginFormProps): JSX.Element {
  const router = useRouter()
  const login = useLogin()
  // const resendVerification = useResendVerificationBasic()
  
  // UI 상태 관리
  const [showPassword, setShowPassword] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showEmailGuide, setShowEmailGuide] = useState(false)
  const [availableActions, setAvailableActions] = useState<string[]>([])

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
      // 개선된 구조화된 에러 처리
      const authError = error as AuthError & Error
      const errorMessage = authError.message || '로그인에 실패했습니다.'
      
      // 이메일 인증이 필요한 경우
      if (authError.code === AuthErrorCode.EMAIL_NOT_VERIFIED) {
        setNeedsVerification(true)
        setUserEmail(data.email)
        setAvailableActions(authError.details?.actions || ['resend_email', 'show_guide'])
        clearErrors('root')
      } else {
        // 다른 에러 타입들 처리
        setNeedsVerification(false)
        setAvailableActions([])
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

  // 폼 필드 변경 시 상태 초기화
  const handleFieldChange = (field: 'email' | 'password'): void => {
    clearErrors(field)
    clearErrors('root')
    if (needsVerification) {
      setNeedsVerification(false)
      setAvailableActions([])
    }
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
              onChange: () => handleFieldChange('email'),
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
                  onChange: () => handleFieldChange('password'),
                })}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* 이메일 인증 필요 시 EmailVerificationPrompt 표시 */}
          {needsVerification && userEmail && (
            <EmailVerificationPrompt
              email={userEmail}
              onShowGuide={handleShowEmailGuide}
              availableActions={availableActions}
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