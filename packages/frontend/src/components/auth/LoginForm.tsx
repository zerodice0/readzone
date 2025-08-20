import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useAuthStore } from '@/store/authStore'
import { AUTH_ERROR_MESSAGES, type LoginFormData, loginSchema } from '@/lib/validations/auth'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const { login, isLoading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const rememberMe = watch('rememberMe')

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      await login(data)
      
      // 로그인 성공 시 리다이렉트 또는 콜백 실행
      if (onSuccess) {
        onSuccess()
      } else {
        const redirectTo = (search as { redirect?: string })?.redirect ?? '/'

        await navigate({ to: redirectTo })
      }
    } catch (error) {
      // 에러는 authStore에서 처리되므로 여기서는 UI 관련 에러만 처리
      if (error instanceof Error) {
        const message = error.message
        
        // 특정 필드 에러인지 확인
        if (message.includes('email') || message.includes('이메일')) {
          setError('email', { message })
        } else if (message.includes('password') || message.includes('비밀번호')) {
          setError('password', { message })
        }
      }
    }
  }

  const getErrorMessage = () => {
    if (!error) {return null}
    
    // 미리 정의된 에러 메시지가 있으면 사용
    const knownMessage = AUTH_ERROR_MESSAGES[error.code as keyof typeof AUTH_ERROR_MESSAGES]
    
    return knownMessage ?? error.message ?? '로그인에 실패했습니다.'
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">로그인</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>로그인 실패</AlertTitle>
            <AlertDescription>{getErrorMessage()}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이메일 입력 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              error={!!errors.email}
              {...register('email')}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                error={!!errors.password}
                {...register('password')}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* 로그인 상태 유지 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setValue('rememberMe', !!checked)}
              aria-describedby="remember-me-description"
            />
            <Label 
              htmlFor="rememberMe"
              className="text-sm font-normal cursor-pointer"
            >
              로그인 상태 유지
            </Label>
          </div>
          <p id="remember-me-description" className="text-xs text-muted-foreground">
            체크하면 브라우저를 닫아도 로그인 상태가 유지됩니다.
          </p>

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isSubmitting}
          >
            {(isLoading || isSubmitting) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            로그인
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        {/* 추가 링크들 */}
        <div className="flex items-center justify-between w-full text-sm">
          <Link
            to="/forgot-password"
            className="text-primary hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        {/* 회원가입 링크 */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">아직 계정이 없으신가요? </span>
          <Link
            to="/register"
            className="text-primary hover:underline font-medium"
          >
            회원가입
          </Link>
        </div>

        {/* 게스트 브라우징 */}
        <div className="text-center">
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            먼저 둘러보기 →
          </button>
        </div>
      </CardFooter>
    </Card>
  )
}