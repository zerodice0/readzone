'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useVerifyEmail } from '@/hooks/use-auth-api'
import { useResendVerification } from '@/hooks/use-resend-verification'

function VerifyEmailInner(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string>('')
  const [token, setToken] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  
  const verifyEmail = useVerifyEmail()
  const resendVerification = useResendVerification(email)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const tokenParam = searchParams.get('token')
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
    
    if (tokenParam) {
      setToken(tokenParam)
    }
  }, [searchParams])
  
  const handleVerifyEmail = useCallback(async (verificationToken: string): Promise<void> => {
    try {
      await verifyEmail.mutateAsync({
        token: verificationToken,
      })
      setIsVerified(true)
      
      // 3초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push('/login?verified=true')
      }, 3000)
    } catch (error) {
      // 에러는 hook에서 toast로 처리됨
    }
  }, [verifyEmail, router])

  useEffect(() => {
    // 토큰이 있으면 자동으로 인증 시도
    if (token && email) {
      handleVerifyEmail(token)
    }
  }, [token, email, handleVerifyEmail])


  const handleResendEmail = async (): Promise<void> => {
    if (!email) return
    
    try {
      await resendVerification.resend()
    } catch (error) {
      // 에러는 hook에서 toast로 처리됨
    }
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-green-600">인증 완료!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">
                이메일 인증이 완료되었습니다.
                <br />
                이제 ReadZone의 모든 기능을 이용하실 수 있습니다.
              </p>
              <p className="text-sm text-gray-500">
                잠시 후 로그인 페이지로 이동합니다...
              </p>
              <Button 
                onClick={() => router.push('/login?verified=true')}
                className="w-full"
              >
                로그인 페이지로 이동
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">이메일 인증</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 이메일 인증 안내 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">인증 이메일을 확인해주세요</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {email ? (
                    <>
                      <span className="font-medium">{email}</span>으로 인증 이메일을 발송했습니다.
                    </>
                  ) : (
                    '회원가입 시 입력하신 이메일로 인증 링크를 발송했습니다.'
                  )}
                </p>
              </div>
            </div>

            {/* 인증 진행 중 표시 */}
            {token && verifyEmail.isPending && (
              <div className="text-center space-y-2">
                <div className="w-6 h-6 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">인증을 진행하고 있습니다...</p>
              </div>
            )}

            {/* 인증 실패 시 표시 */}
            {verifyEmail.isError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">인증 실패</h3>
                    <p className="mt-1 text-sm text-red-700">
                      인증 링크가 만료되었거나 올바르지 않습니다. 새로운 인증 이메일을 요청해주세요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* 이메일 재발송 버튼 */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                loading={resendVerification.isLoading}
                disabled={!email || resendVerification.isLoading}
              >
                {resendVerification.isLoading ? '발송 중...' : '인증 이메일 재발송'}
              </Button>

              {/* 이메일 확인 안내 */}
              <div className="text-sm text-gray-500 space-y-2">
                <p>• 이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요.</p>
                <p>• 인증 링크는 24시간 후 만료됩니다.</p>
                <p>• 이메일 주소를 잘못 입력하셨다면 다시 회원가입을 진행해주세요.</p>
              </div>
            </div>

            {/* 하단 링크 */}
            <div className="text-center text-sm">
              <div className="flex items-center justify-center space-x-1">
                <span className="text-gray-500">다른 이메일로 가입하시겠어요?</span>
                <Link 
                  href="/register" 
                  className="text-primary-500 hover:text-primary-600 hover:underline font-medium"
                >
                  다시 회원가입
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailContent(): JSX.Element {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-6 h-6 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm text-gray-600">로딩 중...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  )
}