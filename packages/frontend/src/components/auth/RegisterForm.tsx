import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'

import { type RegisterFormData, registerSchema } from '@/lib/validations/auth'

interface DuplicationCheckState {
  isChecking: boolean
  isAvailable: boolean | null
  message: string
}

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function RegisterForm({ onSubmit, isLoading = false, error }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // 중복 체크 상태
  const [userIdCheck, setUserIdCheck] = useState<DuplicationCheckState>({
    isChecking: false,
    isAvailable: null,
    message: ''
  })
  
  const [emailCheck, setEmailCheck] = useState<DuplicationCheckState>({
    isChecking: false,
    isAvailable: null,
    message: ''
  })
  
  const [nicknameCheck, setNicknameCheck] = useState<DuplicationCheckState>({
    isChecking: false,
    isAvailable: null,
    message: ''
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur'
  })

  const watchedPassword = watch('password', '')

  // 중복 체크 시뮬레이션 함수 (실제로는 API 호출)
  const checkDuplication = async (type: 'userId' | 'email' | 'nickname', value: string) => {
    if (!value || value.length < 2) {
      return
    }

    const setState = type === 'userId' ? setUserIdCheck : 
                     type === 'email' ? setEmailCheck : setNicknameCheck

    setState(prev => ({ ...prev, isChecking: true }))

    // 시뮬레이션을 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 800))

    // 임시 중복 체크 로직 (실제로는 API 호출)
    const isDuplicate = Math.random() > 0.7 // 30% 확률로 중복

    setState({
      isChecking: false,
      isAvailable: !isDuplicate,
      message: isDuplicate 
        ? `이미 사용중인 ${type === 'userId' ? '아이디' : type === 'email' ? '이메일' : '닉네임'}입니다.`
        : `사용 가능한 ${type === 'userId' ? '아이디' : type === 'email' ? '이메일' : '닉네임'}입니다.`
    })
  }

  const handleFormSubmit = async (data: RegisterFormData) => {
    // 중복 체크가 완료되지 않았거나 사용 불가능한 경우 검증
    if (userIdCheck.isAvailable !== true || 
        emailCheck.isAvailable !== true || 
        nicknameCheck.isAvailable !== true) {
      return
    }

    await onSubmit(data)
  }

  const getDuplicationIcon = (check: DuplicationCheckState) => {
    if (check.isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }

    if (check.isAvailable === true) {
      return <Check className="h-4 w-4 text-green-600" />
    }

    if (check.isAvailable === false) {
      return <X className="h-4 w-4 text-red-600" />
    }

    return null
  }

  const getDuplicationStyle = (check: DuplicationCheckState) => {
    if (check.isAvailable === true) {
      return 'border-green-500 focus:ring-green-500'
    }

    if (check.isAvailable === false) {
      return 'border-red-500 focus:ring-red-500'
    }

    return ''
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="text-sm text-muted-foreground">
          ReadZone에서 독서의 즐거움을 나누어보세요
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* 아이디 */}
        <div className="space-y-2">
          <Label htmlFor="userId">아이디 *</Label>
          <div className="relative">
            <Input
              id="userId"
              placeholder="6-20자의 영문, 숫자, _, - 조합"
              className={getDuplicationStyle(userIdCheck)}
              {...register('userId')}
              onBlur={(e) => checkDuplication('userId', e.target.value)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getDuplicationIcon(userIdCheck)}
            </div>
          </div>
          {errors.userId && (
            <p className="text-sm text-red-600">{errors.userId.message}</p>
          )}
          {userIdCheck.message && (
            <p className={`text-sm ${userIdCheck.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {userIdCheck.message}
            </p>
          )}
        </div>

        {/* 이메일 */}
        <div className="space-y-2">
          <Label htmlFor="email">이메일 *</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="example@readzone.com"
              className={getDuplicationStyle(emailCheck)}
              {...register('email')}
              onBlur={(e) => checkDuplication('email', e.target.value)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getDuplicationIcon(emailCheck)}
            </div>
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
          {emailCheck.message && (
            <p className={`text-sm ${emailCheck.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {emailCheck.message}
            </p>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호 *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="6자 이상의 비밀번호"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
          <PasswordStrengthIndicator password={watchedPassword} />
        </div>

        {/* 비밀번호 확인 */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="비밀번호를 다시 입력해주세요"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* 닉네임 */}
        <div className="space-y-2">
          <Label htmlFor="nickname">닉네임 *</Label>
          <div className="relative">
            <Input
              id="nickname"
              placeholder="2-20자의 한글, 영문, 숫자, _, - 조합"
              className={getDuplicationStyle(nicknameCheck)}
              {...register('nickname')}
              onBlur={(e) => checkDuplication('nickname', e.target.value)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getDuplicationIcon(nicknameCheck)}
            </div>
          </div>
          {errors.nickname && (
            <p className="text-sm text-red-600">{errors.nickname.message}</p>
          )}
          {nicknameCheck.message && (
            <p className={`text-sm ${nicknameCheck.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {nicknameCheck.message}
            </p>
          )}
        </div>

        {/* 약관 동의 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              {...register('terms')}
            />
            <Label htmlFor="terms" className="text-sm">
              <span className="text-primary">서비스 이용약관</span>에 동의합니다. *
            </Label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-600">{errors.terms.message}</p>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacy"
              {...register('privacy')}
            />
            <Label htmlFor="privacy" className="text-sm">
              <span className="text-primary">개인정보 처리방침</span>에 동의합니다. *
            </Label>
          </div>
          {errors.privacy && (
            <p className="text-sm text-red-600">{errors.privacy.message}</p>
          )}
        </div>

        {/* 가입 버튼 */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || 
                   userIdCheck.isAvailable !== true || 
                   emailCheck.isAvailable !== true || 
                   nicknameCheck.isAvailable !== true}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              가입 처리 중...
            </>
          ) : (
            '회원가입'
          )}
        </Button>
      </form>

      {/* 로그인 안내 */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
        <Link
          to="/login"
          className="text-primary hover:underline font-medium"
        >
          로그인하기
        </Link>
      </div>
    </div>
  )
}