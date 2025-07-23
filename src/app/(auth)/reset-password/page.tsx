'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { ServiceIntro } from '@/components/auth/service-intro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

type PageState = 'loading' | 'valid-token' | 'invalid-token' | 'missing-token'

export default function ResetPasswordPage(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    const tokenParam = searchParams.get('token')

    if (!tokenParam) {
      setPageState('missing-token')
      return
    }

    // 토큰 유효성을 서버에서 검증
    validateToken(tokenParam)
  }, [searchParams])

  const validateToken = async (tokenParam: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenParam }),
      })

      const result = await response.json()

      if (response.ok && result.valid) {
        setToken(tokenParam)
        setPageState('valid-token')
      } else {
        setPageState('invalid-token')
      }
    } catch (error) {
      console.error('❌ [RESET PASSWORD PAGE] 토큰 검증 실패:', error)
      setPageState('invalid-token')
    }
  }

  const handleSuccess = (): void => {
    // 2초 후 로그인 페이지로 리다이렉트
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  // 로딩 상태
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <span>토큰을 확인하는 중...</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 토큰이 없는 경우
  if (pageState === 'missing-token') {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-12rem)]">
            {/* 왼쪽: 서비스 소개 */}
            <div className="order-2 lg:order-1">
              <ServiceIntro />
            </div>

            {/* 오른쪽: 에러 메시지 */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-center text-red-600">잘못된 접근</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      재설정 토큰이 없습니다
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      비밀번호 재설정을 위해서는 이메일의 링크를 통해 접근해야 합니다.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/forgot-password')}
                      className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition-colors"
                    >
                      비밀번호 재설정 요청
                    </button>
                    <button
                      onClick={() => router.push('/login')}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      로그인 페이지로 이동
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 토큰이 유효하지 않은 경우
  if (pageState === 'invalid-token') {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-12rem)]">
            {/* 왼쪽: 서비스 소개 */}
            <div className="order-2 lg:order-1">
              <ServiceIntro />
            </div>

            {/* 오른쪽: 에러 메시지 */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-center text-red-600">토큰이 유효하지 않습니다</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      재설정 링크가 만료되었습니다
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      비밀번호 재설정 링크가 만료되었거나 이미 사용되었습니다.<br />
                      새로운 재설정 링크를 요청해주세요.
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-sm text-amber-700">
                        <p className="font-medium mb-1">참고사항</p>
                        <p>보안을 위해 재설정 링크는 15분 후 자동으로 만료되며, 한 번만 사용할 수 있습니다.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/forgot-password')}
                      className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition-colors"
                    >
                      새로운 재설정 링크 요청
                    </button>
                    <button
                      onClick={() => router.push('/login')}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      로그인 페이지로 이동
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 유효한 토큰인 경우 - 비밀번호 재설정 폼 표시
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-12rem)]">
          {/* 왼쪽: 서비스 소개 */}
          <div className="order-2 lg:order-1">
            <ServiceIntro />
          </div>

          {/* 오른쪽: 비밀번호 재설정 폼 */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <ResetPasswordForm 
              token={token}
              onSuccess={handleSuccess}
              className="w-full max-w-md"
            />
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 ReadZone. 모든 권리 보유.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}