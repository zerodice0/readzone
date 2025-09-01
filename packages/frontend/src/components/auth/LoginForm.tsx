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
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userid: '',
      password: '',
      rememberMe: false,
    },
  })

  const rememberMe = watch('rememberMe')

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    
    // LoginRequest는 rememberMe 없이 userid와 password만 필요
    const loginSuccess = await login({
      userid: data.userid,
      password: data.password
    })
    
    // 로그인 성공 시 리다이렉트 또는 콜백 실행
    if (loginSuccess) {
      if (onSuccess) {
        onSuccess()
      } else {
        const redirectTo = (search as { redirect?: string })?.redirect ?? '/'

        await navigate({ to: redirectTo })
      }
    }
    // 로그인 실패 시 에러는 authStore에서 관리되므로 추가 처리 불필요
    // error 상태는 화면에서 자동으로 표시됨
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
          {/* 아이디 입력 */}
          <div className="space-y-2">
            <Label htmlFor="userid">아이디</Label>
            <Input
              id="userid"
              type="text"
              autoComplete="username"
              placeholder="아이디를 입력하세요"
              error={!!errors.userid}
              {...register('userid')}
              aria-describedby={errors.userid ? 'userid-error' : undefined}
            />
            {errors.userid && (
              <p id="userid-error" className="text-sm text-destructive" role="alert">
                {errors.userid.message}
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
          <div className="flex items-center gap-2">
            <Link
              to="/forgot-password"
              className="text-primary hover:underline"
              aria-label="비밀번호 재설정 페이지로 이동"
            >
              비밀번호를 잊으셨나요?
            </Link>
            <span className="text-xs text-muted-foreground hidden sm:inline">이메일로 재설정 링크를 보내드려요</span>
          </div>
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