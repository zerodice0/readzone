'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Checkbox } from '@/components/ui'
import { ValidationInput } from '@/components/ui/validation-input'
import { PasswordStrength } from '@/components/ui/password-strength'
import { useRegister } from '@/hooks/use-auth-api'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { z } from 'zod'
import { cn } from '@/lib/utils'

interface RegisterFormProps {
  className?: string
  onSuccess?: () => void
}

export function RegisterForm({ className, onSuccess }: RegisterFormProps): JSX.Element {
  const router = useRouter()
  const register = useRegister()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [emailValid, setEmailValid] = useState(false)
  const [nicknameValid, setNicknameValid] = useState(false)
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
    clearErrors,
  } = useForm<RegisterInput & { passwordConfirm: string; agreeTerms: boolean; agreePrivacy: boolean }>({
    resolver: zodResolver(registerSchema.extend({
      passwordConfirm: registerSchema.shape.password,
      agreeTerms: z.boolean().refine((val) => val === true, {
        message: '이용약관에 동의해주세요.',
      }),
      agreePrivacy: z.boolean().refine((val) => val === true, {
        message: '개인정보처리방침에 동의해주세요.',
      }),
    })),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      nickname: '',
      agreeTerms: false,
      agreePrivacy: false,
    },
  })

  const watchedPassword = watch('password')
  const watchedPasswordConfirm = watch('passwordConfirm')

  const onSubmit = async (data: RegisterInput & { passwordConfirm: string; agreeTerms: boolean; agreePrivacy: boolean }): Promise<void> => {
    // 비밀번호 확인 검증
    if (data.password !== data.passwordConfirm) {
      setError('passwordConfirm', {
        message: '비밀번호가 일치하지 않습니다.',
      })
      return
    }

    // 약관 동의 검증은 Zod 스키마에서 자동 처리됨

    // 실시간 검증 확인
    if (!emailValid) {
      setError('email', {
        message: '이메일 중복 확인이 필요합니다.',
      })
      return
    }

    if (!nicknameValid) {
      setError('nickname', {
        message: '닉네임 중복 확인이 필요합니다.',
      })
      return
    }

    try {
      await register.mutateAsync({
        email: data.email,
        password: data.password,
        nickname: data.nickname,
      })
      
      // 성공 시 등록된 이메일 저장하고 성공 상태로 변경
      setRegisteredEmail(data.email)
      setIsRegistrationSuccess(true)
      
      // onSuccess 콜백이 있으면 실행 (다이얼로그 등에서 사용)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      // 에러는 register hook에서 toast로 이미 처리됨
      setError('root', {
        message: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.',
      })
    }
  }

  // 회원가입 성공 시 표시할 컴포넌트
  const RegistrationSuccessView = (): JSX.Element => (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="text-center">회원가입 완료</CardTitle>
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
            회원가입이 완료되었습니다!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-primary-600 dark:text-primary-400">{registeredEmail}</span>로<br />
            인증 이메일을 발송했습니다.
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
              <p className="font-medium mb-1">이메일 인증을 완료해주세요</p>
              <p>이메일 인증을 완료해야 ReadZone 서비스를 이용할 수 있습니다.</p>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push(`/verify-email?email=${encodeURIComponent(registeredEmail)}`)}
            className="w-full"
          >
            이메일 인증 페이지로 이동
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push('/login')}
            className="w-full"
          >
            로그인 페이지로 이동
          </Button>
        </div>

        {/* 도움말 링크 */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          이메일이 오지 않았나요?{' '}
          <button
            type="button"
            onClick={() => router.push(`/verify-email?email=${encodeURIComponent(registeredEmail)}`)}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
          >
            인증 이메일 재발송
          </button>
        </div>
      </CardContent>
    </Card>
  )

  // 성공 상태라면 성공 뷰를 렌더링
  if (isRegistrationSuccess) {
    return <RegistrationSuccessView />
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="text-center">회원가입</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이메일 입력 (실시간 중복 확인) */}
          <ValidationInput
            label="이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            validationType="email"
            onValidationChange={(isValid, message) => {
              setEmailValid(isValid)
              if (!isValid && message) {
                setError('email', { message })
              } else {
                clearErrors('email')
              }
            }}
            {...registerField('email')}
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
                {...registerField('password')}
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
            
            {/* 비밀번호 강도 표시 */}
            <PasswordStrength password={watchedPassword || ''} />
          </div>

          {/* 비밀번호 확인 */}
          <div className="relative">
            <Input
              label="비밀번호 확인"
              type={showPasswordConfirm ? 'text' : 'password'}
              placeholder="비밀번호를 다시 입력하세요"
              error={errors.passwordConfirm?.message}
              {...registerField('passwordConfirm')}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            >
              {showPasswordConfirm ? (
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
            
            {/* 비밀번호 일치 확인 */}
            {watchedPassword && watchedPasswordConfirm && (
              <div className="mt-2">
                {watchedPassword === watchedPasswordConfirm ? (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    비밀번호가 일치합니다
                  </p>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    비밀번호가 일치하지 않습니다
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 닉네임 입력 (실시간 중복 확인) */}
          <ValidationInput
            label="닉네임"
            type="text"
            placeholder="닉네임을 입력하세요"
            validationType="nickname"
            onValidationChange={(isValid, message) => {
              setNicknameValid(isValid)
              if (!isValid && message) {
                setError('nickname', { message })
              } else {
                clearErrors('nickname')
              }
            }}
            {...registerField('nickname')}
            required
          />

          {/* 약관 동의 */}
          <div className="space-y-3">
            <Checkbox
              label="이용약관 동의"
              description="ReadZone 서비스 이용약관에 동의합니다."
              error={errors.agreeTerms?.message}
              {...registerField('agreeTerms')}
              required
            />
            
            <Checkbox
              label="개인정보처리방침 동의"
              description="개인정보 수집 및 이용에 동의합니다."
              error={errors.agreePrivacy?.message}
              {...registerField('agreePrivacy')}
              required
            />
          </div>

          {/* 전역 에러 메시지 */}
          {errors.root && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center">
              {errors.root.message}
            </div>
          )}

          {/* 회원가입 버튼 */}
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting || register.isPending}
            disabled={isSubmitting || register.isPending || !emailValid || !nicknameValid}
          >
            {isSubmitting || register.isPending ? '가입 중...' : '가입하기'}
          </Button>

          {/* 하단 링크 */}
          <div className="text-center text-sm">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-gray-500 dark:text-gray-400">이미 계정이 있으신가요?</span>
              <Link 
                href="/login" 
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 hover:underline font-medium"
              >
                로그인
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}