import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AlertCircle, CheckCircle, Clock, Loader2, Mail } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { resendEmailVerification, verifyEmail } from '@/lib/api/auth'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'

interface VerifyEmailSearch {
  token?: string
}

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as VerifyEmailSearch
  const { toast } = useToast()
  const refreshTokens = useAuthStore((s) => s.refreshTokens)
  
  type Status = 'loading' | 'success' | 'already-verified' | 'expired' | 'invalid' | 'no-token'
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string>('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string>('')
  const [cooldown, setCooldown] = useState(0)
  const [showHelp, setShowHelp] = useState(false)

  const startedRef = useRef(false)

  useEffect(() => {
    const token = search.token

    if (!token) {
      setStatus('no-token')

      return
    }

    // 중복 호출 방지
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const handleVerification = async () => {
      try {
        setStatus('loading')
        const res = await verifyEmail(token)

        // 인증 후 세션 정보 갱신(배너 숨김 목적)
        try { await refreshTokens() } catch { /* ignore */ }
        
        // Cookie 기반 인증으로 전환됨 - 토큰은 자동으로 Cookie에 저장됨
        
        const message = res?.message ?? ''

        setStatus(message.includes('이미 인증') ? 'already-verified' : 'success')
        
        toast({
          title: '이메일 인증 완료',
          description: '이메일 인증이 완료되었습니다. 환영합니다!',
        })

        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
          navigate({ to: '/' })
        }, 3000)
        
      } catch (err) {
        console.error('Email verification error:', err)
        const msg = err instanceof Error ? err.message : '이메일 인증 중 오류가 발생했습니다.'

        setError(msg)

        setStatus(/만료|expire/i.test(msg) ? 'expired' : 'invalid')
        
        toast({
          title: '인증 실패',
          description: '이메일 인증에 실패했습니다. 토큰이 만료되었거나 잘못된 토큰입니다.',
          variant: 'destructive',
        })
      }
    }

    handleVerification()
    // navigate/toast/refreshTokens는 의도적으로 제외해 중복 호출을 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.token])

  const handleGoHome = () => {
    navigate({ to: '/' })
  }

  const handleGoLogin = () => {
    navigate({ to: '/login', search: { redirect: undefined } })
  }

  const user = useAuthStore.getState().user
  const handleResend = async () => {
    if (!user?.email || isResending || cooldown > 0) {
      return
    }
    setIsResending(true)
    setResendSuccess('')
    setError('')
    try {
      const res = await resendEmailVerification(user.email)

      setResendSuccess(res.message || '인증 이메일을 다시 보냈습니다.')
      setCooldown(60)
    } catch (e) {
      setError(e instanceof Error ? e.message : '재발송 중 오류가 발생했습니다.')
    } finally {
      setIsResending(false)
    }
  }

  useEffect(() => {
    if (cooldown <= 0) {
      return
    }
    const id = setInterval(() => setCooldown(s => Math.max(0, s - 1)), 1000)

    return () => clearInterval(id)
  }, [cooldown])

  return (
    <div className="container mx-auto max-w-md py-16 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">이메일 인증</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">이메일 인증을 처리하고 있습니다...</p>
            </div>
          )}
          
          {(status === 'success' || status === 'already-verified') && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">
                {status === 'already-verified' ? '이미 인증된 계정이에요.' : '인증이 완료되었어요!'}
              </h3>
              <p className="text-muted-foreground mb-4">
                이제 ReadZone의 모든 기능을 사용할 수 있어요.
              </p>
              <p className="text-sm text-muted-foreground">
                3초 후 메인 페이지로 이동합니다...
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2">
                <Button onClick={handleGoHome} className="w-full">홈으로 가기</Button>
                <Button onClick={() => navigate({ to: '/write' })} variant="outline" className="w-full">독후감 작성하기</Button>
              </div>
            </div>
          )}
          
          {(status === 'invalid' || status === 'expired') && (
            <div className="space-y-4" aria-live="polite">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {status === 'expired' ? '이 인증 링크는 만료되었어요.' : '유효하지 않은 인증 링크예요.'}
                </AlertDescription>
              </Alert>
              
              <div className="text-center py-4">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {status === 'expired' ? '링크가 만료되었어요' : '링크를 확인할 수 없어요'}
                </h3>
                <p className="text-muted-foreground mb-2">
                  {status === 'expired' ? '이메일을 다시 받아 인증을 완료해 주세요.' : '올바른 링크인지 확인하거나, 인증 이메일을 다시 받아 주세요.'}
                </p>
                {!user && (
                  <p className="text-xs text-muted-foreground mb-4">로그인하면 인증 이메일을 바로 다시 보낼 수 있어요.</p>
                )}

                {user ? (
                  <div className="space-y-2">
                    <Button onClick={handleResend} disabled={isResending || cooldown > 0} className="w-full">
                      {isResending ? '재발송 중...' : cooldown > 0 ? `재요청 가능: ${cooldown}s` : '인증 이메일 재발송'}
                    </Button>
                    <Button onClick={handleGoHome} variant="outline" className="w-full">메인 페이지로 이동</Button>
                    {resendSuccess && (
                      <div className="flex items-center justify-center text-green-600 text-sm"><Clock className="h-4 w-4 mr-1" />{resendSuccess}</div>
                    )}
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button onClick={handleGoLogin} className="w-full">로그인하고 재발송</Button>
                    <Button onClick={handleGoHome} variant="outline" className="w-full">메인 페이지로 이동</Button>
                  </div>
                )}

                <div className="mt-6 text-left">
                  <button
                    onClick={() => setShowHelp((v) => !v)}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {showHelp ? '도움말 접기' : '이메일이 오지 않나요? 도움말 보기'}
                  </button>
                  {showHelp && (
                    <div className="mt-3 rounded-md border p-3 text-sm text-muted-foreground">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>스팸함·프로모션함에 수신 메일이 있는지 확인해 주세요.</li>
                        <li>이메일 필터/규칙에 의해 자동 분류되지 않았는지 확인해 주세요.</li>
                        <li>회사/학교 메일은 보안 설정으로 차단될 수 있어요. 개인 메일 사용을 권장합니다.</li>
                        <li>1분 뒤에도 오지 않으면 재발송해 주세요. 너무 잦은 요청은 제한돼요.</li>
                        <li>입력한 주소가 올바른지 확인하거나 프로필에서 이메일을 업데이트해 주세요.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {status === 'no-token' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  인증 토큰이 제공되지 않았습니다.
                </AlertDescription>
              </Alert>
              
              <div className="text-center py-4">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">토큰 없음</h3>
                <p className="text-muted-foreground mb-4">
                  이메일에서 받은 인증 링크를 클릭해 주세요.
                </p>
                <div className="space-y-2">
                  <Button onClick={handleGoLogin} className="w-full">
                    로그인 페이지로 이동
                  </Button>
                  <Button onClick={handleGoHome} variant="outline" className="w-full">
                    메인 페이지로 이동
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
