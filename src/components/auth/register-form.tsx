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
      agreeTerms: registerSchema.shape.email.transform(() => true), // 임시로 email 스키마 재사용
      agreePrivacy: registerSchema.shape.email.transform(() => true), // 임시로 email 스키마 재사용
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

    // 약관 동의 검증
    if (!data.agreeTerms) {
      setError('agreeTerms', {
        message: '이용약관에 동의해주세요.',
      })
      return
    }

    if (!data.agreePrivacy) {
      setError('agreePrivacy', {
        message: '개인정보처리방침에 동의해주세요.',
      })
      return
    }

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
      
      // 성공 시 이메일 인증 페이지로 리다이렉트
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
      }
    } catch (error) {
      // 에러는 register hook에서 toast로 이미 처리됨
      setError('root', {
        message: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.',
      })
    }
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
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
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
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
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
                  <p className="text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    비밀번호가 일치합니다
                  </p>
                ) : (
                  <p className="text-sm text-red-600 flex items-center">
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
            <div className="text-sm text-red-600 text-center">
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
              <span className="text-gray-500">이미 계정이 있으신가요?</span>
              <Link 
                href="/login" 
                className="text-primary-500 hover:text-primary-600 hover:underline font-medium"
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