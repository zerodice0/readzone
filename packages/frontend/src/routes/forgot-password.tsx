import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, Loader2, Mail } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { checkResetToken, requestPasswordReset, resetPasswordWithToken } from '@/lib/api/auth'
import type { User as AuthUser } from '@/types/auth'
import { useAuthStore } from '@/store/authStore'

type Mode = 'request' | 'reset' | 'success'

function EmailMaskHint({ email }: { email: string }) {
  return (
    <p className="text-sm text-muted-foreground">{email} 로 메일을 보냈어요. 스팸함도 확인해 주세요.</p>
  )
}

function PasswordStrength({ value }: { value: string }) {
  const score = useMemo(() => {
    let s = 0

    if (value.length >= 8) { s++ }
    if (/[A-Za-z]/.test(value)) { s++ }
    if (/\d/.test(value)) { s++ }
    if (/[^A-Za-z0-9]/.test(value)) { s++ }

    return s
  }, [value])

  const labels = ['약함', '보통', '좋음', '매우 좋음']
  const color = ['text-destructive', 'text-yellow-600', 'text-green-600', 'text-green-700'][Math.max(0, score - 1)]

  return (
    <p className={`text-xs ${color}`}>비밀번호 강도: {score === 0 ? '약함' : labels[score - 1]}</p>
  )
}

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { token?: string }

  const [mode, setMode] = useState<Mode>('request')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // request state
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)

  // reset state
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'expired' | 'used'>('idle')
  const [maskedEmail, setMaskedEmail] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 토큰이 있으면 검증 후 reset 모드로 전환
  useEffect(() => {
    const token = search.token

    if (!token) { return }

    setMode('reset')
    setTokenStatus('checking')
    setError(null)

    checkResetToken(token)
      .then((res) => {
        if (res.status === 'valid') {
          setTokenStatus('valid')

          if (res.tokenInfo?.email) { setMaskedEmail(res.tokenInfo.email) }
        } else {
          setTokenStatus(res.status)
          setError(res.message)
        }
      })
      .catch((e: unknown) => {
        setTokenStatus('invalid')
        setError(e instanceof Error ? e.message : '토큰 검증 중 오류가 발생했습니다')
      })
  }, [search.token])


  // 레이트리밋 정보/카운트다운은 보안상 노출하지 않음


  const handleRequest = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // reCAPTCHA v3 토큰 발급
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined
      let recaptchaToken: string | undefined

      if (siteKey) {
        // 스크립트가 로드되지 않았다면 로드
        if (!(window as unknown as { grecaptcha?: unknown }).grecaptcha) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')

            script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
            script.async = true
            script.defer = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('reCAPTCHA 스크립트 로드 실패'))
            document.head.appendChild(script)
          })
        }
        const grecaptcha = (window as unknown as { grecaptcha: { ready(cb: () => void): void; execute(key: string, opts: { action: string }): Promise<string> } }).grecaptcha
        
        await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()))
        recaptchaToken = await grecaptcha.execute(siteKey, { action: 'forgot_password' })
      }

      const res = await requestPasswordReset(email, recaptchaToken)

      if (res.success) {
        setSentTo(res.sentTo)
        setMode('success')
      } else {
        setError(res.message || '요청에 실패했습니다')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!search.token) { return }

    if (newPassword !== confirmPassword) {
      setError('비밀번호 확인이 일치하지 않습니다.')

      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await resetPasswordWithToken({ token: search.token, newPassword, confirmPassword })

      if (res.success) {
        // 자동 로그인: 쿠키에 RT가 설정되었고, AT는 응답에 포함
        const accessToken = res.tokens?.accessToken
        const user = res.user

        if (accessToken && user) {
          // API 응답 사용자 타입을 스토어 사용자 타입으로 매핑 (updatedAt 보장)
          interface ApiUser {
            id: string; userid: string; email: string; nickname: string;
            bio?: string; profileImage?: string; isVerified: boolean;
            role: 'USER' | 'MODERATOR' | 'ADMIN';
            createdAt: string; updatedAt?: string;
          }
          const u = user as ApiUser
          const mappedUser: AuthUser = {
            id: u.id,
            userid: u.userid,
            email: u.email,
            nickname: u.nickname,
            isVerified: u.isVerified,
            role: u.role,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt ?? u.createdAt,
            ...(u.bio !== undefined ? { bio: u.bio } : {}),
            ...(u.profileImage !== undefined ? { profileImage: u.profileImage } : {}),
          }

          useAuthStore.setState({ user: mappedUser, accessToken, isAuthenticated: true })
          useAuthStore.getState().stopTokenExpirationCheck()
          useAuthStore.getState().startTokenExpirationCheck()
        }
        setMode('success')
      } else {
        setError(res.message || '비밀번호 재설정에 실패했습니다')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const goLogin = () => navigate({ to: '/login', search: { redirect: undefined } })
  

  return (
    <div className="container mx-auto max-w-md py-16 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">비밀번호 재설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mode === 'request' && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border p-3 bg-muted/30">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">가입 시 사용한 이메일 주소로 재설정 링크를 보내드립니다.</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                    <li>이메일이 보이지 않으면 스팸함을 확인해 주세요.</li>
                    <li>요청은 일정 횟수로 제한되며 남용을 방지합니다.</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="가입하신 이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* TODO: reCAPTCHA */}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                재설정 이메일 보내기
              </Button>

              <p className="text-center text-xs text-muted-foreground">자동으로 로봇 여부를 확인합니다.</p>


              <div className="text-center text-sm text-muted-foreground">
                <button type="button" onClick={goLogin} className="hover:underline">로그인 페이지로 이동</button>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <div>
              {tokenStatus === 'checking' && (
                <div className="text-center py-8">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-primary" />
                  <p className="text-muted-foreground">토큰을 확인하는 중...</p>
                </div>
              )}

              {tokenStatus === 'valid' && (
                <form onSubmit={handleReset} className="space-y-4">
                  {maskedEmail && <EmailMaskHint email={maskedEmail} />}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">새 비밀번호</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="새 비밀번호"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <PasswordStrength value={newPassword} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="비밀번호 확인"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    비밀번호 재설정
                  </Button>
                </form>
              )}

              {tokenStatus !== 'valid' && tokenStatus !== 'checking' && (
                <div className="text-center py-8 space-y-4">
                  <Mail className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">유효하지 않은 링크이거나 만료된 토큰입니다.</p>
                  <Button onClick={() => setMode('request')} className="w-full">다시 요청하기</Button>
                </div>
              )}
            </div>
          )}

          {mode === 'success' && (
            <div className="text-center py-10 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold">완료되었습니다</h3>
              {sentTo ? (
                <EmailMaskHint email={sentTo} />
              ) : (
                <p className="text-sm text-muted-foreground">비밀번호가 재설정되었습니다. 환영합니다!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})
