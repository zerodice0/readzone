import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { verifyEmail } from '@/lib/api/auth'
import { useToast } from '@/hooks/use-toast'

interface VerifyEmailSearch {
  token?: string
}

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as VerifyEmailSearch
  const { toast } = useToast()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const token = search.token

    if (!token) {
      setStatus('no-token')
      
      return
    }

    const handleVerification = async () => {
      try {
        setStatus('loading')
        await verifyEmail(token)
        
        // Cookie 기반 인증으로 전환됨 - 토큰은 자동으로 Cookie에 저장됨
        
        setStatus('success')
        
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
        setStatus('error')
        setError(err instanceof Error ? err.message : '이메일 인증 중 오류가 발생했습니다.')
        
        toast({
          title: '인증 실패',
          description: '이메일 인증에 실패했습니다. 토큰이 만료되었거나 잘못된 토큰입니다.',
          variant: 'destructive',
        })
      }
    }

    handleVerification()
  }, [search.token, navigate, toast])

  const handleGoHome = () => {
    navigate({ to: '/' })
  }

  const handleGoLogin = () => {
    navigate({ to: '/login', search: { redirect: undefined } })
  }

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
          
          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">인증 완료!</h3>
              <p className="text-muted-foreground mb-4">
                이메일 인증이 성공적으로 완료되었습니다.
              </p>
              <p className="text-sm text-muted-foreground">
                3초 후 메인 페이지로 이동합니다...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
              
              <div className="text-center py-4">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">인증 실패</h3>
                <p className="text-muted-foreground mb-4">
                  인증 토큰이 만료되었거나 잘못된 토큰입니다.
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