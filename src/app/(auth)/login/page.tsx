'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { LoginForm } from '@/components/auth/login-form'
import { ServiceIntro } from '@/components/auth/service-intro'

export default function LoginPage(): JSX.Element {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useSession()

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  // 로딩 중이거나 이미 로그인된 경우 로딩 표시
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-12rem)]">
          {/* 왼쪽: 서비스 소개 */}
          <div className="order-2 lg:order-1">
            <ServiceIntro />
          </div>

          {/* 오른쪽: 로그인 폼 */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <LoginForm 
              onSuccess={() => router.push('/')}
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