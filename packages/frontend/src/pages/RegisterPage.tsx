import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { RegisterServiceIntro } from '@/components/auth/RegisterServiceIntro'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { GuestOnlyRoute } from '@/components/auth/AuthRedirect'
import { type RegisterFormData } from '@/lib/validations/auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // SEO 및 접근성을 위한 페이지 메타데이터 설정
  useEffect(() => {
    document.title = '회원가입 - ReadZone'
    
    const metaDescription = document.querySelector('meta[name="description"]')

    if (metaDescription) {
      metaDescription.setAttribute('content', 'ReadZone에 가입하여 독서 후 감상을 공유하고 다른 독자들과 소통해보세요. 간편한 회원가입으로 시작하세요.')
    }

    // 페이지 언마운트 시 원래 제목으로 복원
    return () => {
      document.title = 'ReadZone'
    }
  }, [])

  const handleRegister = async (_data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // 여기서 실제 회원가입 API 호출
      // TODO: 실제 API 호출 구현
      
      // 임시로 2초 대기 (실제 API 호출 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 성공 시 이메일 인증 페이지로 이동 (임시로 로그인 페이지로 이동)
      navigate({ to: '/login' })
    } catch (_error) {
      setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <GuestOnlyRoute>
      <div className="min-h-screen bg-background">
        {/* 페이지 헤더 (스크린 리더용) */}
        <div className="sr-only">
          <h1>ReadZone 회원가입 페이지</h1>
          <p>독서 후 감상을 공유하는 커뮤니티에 가입하세요.</p>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
            {/* 서비스 소개 섹션 */}
            <div className="order-2 lg:order-1">
              <RegisterServiceIntro />
            </div>

            {/* 회원가입 폼 섹션 */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-start">
              <div className="w-full max-w-md">
                <RegisterForm 
                  onSubmit={handleRegister}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 배경 패턴 (선택사항) */}
        <div 
          className="fixed inset-0 -z-10 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />
      </div>
    </GuestOnlyRoute>
  )
}