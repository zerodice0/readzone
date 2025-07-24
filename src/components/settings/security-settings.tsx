'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Lock,
  Shield,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save,
  Monitor,
  Clock,
  LogOut,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요.'),
  newPassword: z
    .string()
    .min(8, '새 비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '영문 대소문자와 숫자를 포함해야 합니다.'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword']
})

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>

interface SecuritySettingsProps {
  userId: string
  className?: string
}

interface LoginSession {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
  ip: string
  userAgent: string
}

const mockSessions: LoginSession[] = [
  {
    id: '1',
    device: 'Chrome on macOS',
    location: '서울, 대한민국',
    lastActive: '방금 전',
    current: true,
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  },
  {
    id: '2',
    device: 'Safari on iPhone',
    location: '서울, 대한민국',
    lastActive: '2시간 전',
    current: false,
    ip: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
  },
  {
    id: '3',
    device: 'Chrome on Windows',
    location: '부산, 대한민국',
    lastActive: '1일 전',
    current: false,
    ip: '203.241.XXX.XXX',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
]

export function SecuritySettings({ userId, className }: SecuritySettingsProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState<LoginSession[]>(mockSessions)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
    mode: 'onChange'
  })

  const newPassword = watch('newPassword')

  const onSubmit = async (data: PasswordChangeForm) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('비밀번호가 성공적으로 변경되었습니다.')
        reset()
        
        // 다른 세션에서 로그아웃
        await fetch(`/api/users/${userId}/logout-other-sessions`, {
          method: 'POST'
        })
        
        toast.info('보안을 위해 다른 기기에서 자동 로그아웃되었습니다.')
      } else {
        throw new Error(result.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      toast.error(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.id !== sessionId))
        toast.success('세션이 종료되었습니다.')
      } else {
        throw new Error('세션 종료에 실패했습니다.')
      }
    } catch (error) {
      console.error('세션 종료 실패:', error)
      toast.error('세션 종료에 실패했습니다.')
    }
  }

  const terminateAllOtherSessions = async () => {
    if (!confirm('다른 모든 기기에서 로그아웃하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/logout-other-sessions`, {
        method: 'POST'
      })

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.current))
        toast.success('다른 모든 세션이 종료되었습니다.')
      } else {
        throw new Error('세션 종료에 실패했습니다.')
      }
    } catch (error) {
      console.error('세션 종료 실패:', error)
      toast.error('세션 종료에 실패했습니다.')
    }
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z\d]/.test(password)) score++

    if (score <= 2) return { strength: score, label: '매우 약함', color: 'bg-red-500' }
    if (score <= 3) return { strength: score, label: '약함', color: 'bg-orange-500' }
    if (score <= 4) return { strength: score, label: '보통', color: 'bg-yellow-500' }
    if (score <= 5) return { strength: score, label: '강함', color: 'bg-blue-500' }
    return { strength: score, label: '매우 강함', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(newPassword || '')

  return (
    <div className={cn('space-y-8', className)}>
      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            비밀번호 변경
          </CardTitle>
          <CardDescription>
            보안을 위해 정기적으로 비밀번호를 변경하는 것을 권장합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 현재 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium">
                현재 비밀번호 *
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...register('currentPassword')}
                  className={cn(
                    'pr-10',
                    errors.currentPassword && 'border-red-500 focus:border-red-500'
                  )}
                  placeholder="현재 비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showCurrentPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* 새 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">
                새 비밀번호 *
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  {...register('newPassword')}
                  className={cn(
                    'pr-10',
                    errors.newPassword && 'border-red-500 focus:border-red-500'
                  )}
                  placeholder="새 비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showNewPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* 비밀번호 강도 */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>비밀번호 강도: {passwordStrength.label}</span>
                    <span>{passwordStrength.strength}/6</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full transition-all duration-300', passwordStrength.color)}
                      style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {errors.newPassword && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.newPassword.message}
                </p>
              )}
              
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p>비밀번호는 다음 조건을 만족해야 합니다:</p>
                <ul className="mt-1 space-y-1">
                  <li className={cn(newPassword?.length >= 8 ? 'text-green-600' : 'text-gray-500')}>
                    • 최소 8자 이상
                  </li>
                  <li className={cn(/[a-z]/.test(newPassword || '') ? 'text-green-600' : 'text-gray-500')}>
                    • 영문 소문자 포함
                  </li>
                  <li className={cn(/[A-Z]/.test(newPassword || '') ? 'text-green-600' : 'text-gray-500')}>
                    • 영문 대문자 포함
                  </li>
                  <li className={cn(/\d/.test(newPassword || '') ? 'text-green-600' : 'text-gray-500')}>
                    • 숫자 포함
                  </li>
                </ul>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                새 비밀번호 확인 *
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={cn(
                    'pr-10',
                    errors.confirmPassword && 'border-red-500 focus:border-red-500'
                  )}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                {isLoading ? '변경 중...' : '비밀번호 변경'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isLoading}
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2단계 인증 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            2단계 인증
            <Badge variant="outline" className="ml-2 text-xs">
              권장
            </Badge>
          </CardTitle>
          <CardDescription>
            추가 보안 계층으로 계정을 더욱 안전하게 보호하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-sm">
                  인증 앱 (Google Authenticator, Authy)
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {twoFactorEnabled ? '설정됨' : '모바일 앱을 사용한 2단계 인증'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {twoFactorEnabled && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  활성화
                </Badge>
              )}
              <Button
                variant={twoFactorEnabled ? 'outline' : 'default'}
                size="sm"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              >
                {twoFactorEnabled ? '비활성화' : '설정하기'}
              </Button>
            </div>
          </div>

          {!twoFactorEnabled && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    2단계 인증을 설정하세요
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    비밀번호만으로는 계정이 완전히 보호되지 않습니다. 2단계 인증으로 보안을 강화하세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 로그인 세션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            활성 세션
          </CardTitle>
          <CardDescription>
            현재 로그인되어 있는 기기와 위치를 확인하고 관리하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'flex items-center justify-between p-4 border rounded-lg',
                  session.current && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{session.device}</span>
                      {session.current && (
                        <Badge variant="default" className="text-xs">
                          현재 세션
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center space-x-1">
                        <span>{session.location}</span>
                        <span>•</span>
                        <span>{session.ip}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>마지막 활동: {session.lastActive}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminateSession(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    종료
                  </Button>
                )}
              </div>
            ))}
          </div>

          {sessions.filter(s => !s.current).length > 0 && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={terminateAllOtherSessions}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                다른 모든 세션 종료
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 보안 권장사항 */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center text-blue-900 dark:text-blue-100">
            <Shield className="w-5 h-5 mr-2" />
            보안 권장사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
              <span>강력한 비밀번호를 사용하고 정기적으로 변경하세요.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
              <span>2단계 인증을 설정하여 계정 보안을 강화하세요.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
              <span>공공 WiFi에서는 개인정보 입력을 피하세요.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
              <span>의심스러운 활동이 발견되면 즉시 비밀번호를 변경하세요.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
              <span>사용하지 않는 기기에서는 로그아웃하세요.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}