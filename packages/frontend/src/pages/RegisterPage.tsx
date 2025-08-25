import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
// import { RegisterIntro } from '@/components/auth/RegisterIntro' // TODO: 향후 확장 시 사용
import { RegisterForm } from '@/components/auth/RegisterForm'
import { GuestOnlyRoute } from '@/components/auth/AuthRedirect'
import { type RegisterFormData } from '@/lib/validations/auth'
import { register } from '@/lib/api/auth'

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

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // 실제 회원가입 API 호출
      const result = await register({
        email: data.email,
        nickname: data.nickname,
        password: data.password
      })

      // 회원가입 성공 시 토큰 저장
      if (result.tokens) {
        localStorage.setItem('accessToken', result.tokens.accessToken)
        localStorage.setItem('refreshToken', result.tokens.refreshToken)
      }

      // 이메일 인증이 필요한 경우
      if (result.emailVerificationRequired) {
        // 임시로 로그인 페이지로 리다이렉트 (이메일 인증 페이지는 나중에 추가)
        navigate({ 
          to: '/login',
          search: { 
            redirect: undefined
          }
        })
      } else {
        // 이메일 인증이 불필요한 경우 바로 메인 페이지로
        navigate({ to: '/' })
      }
    } catch (error) {
      console.error('Registration error:', error)
      
      // API 에러 메시지 추출
      const errorMessage = error instanceof Error 
        ? error.message 
        : '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      
      setError(errorMessage)
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

        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-2rem)]">
          {/* 반응형 헤더 - 모든 화면에서 표시 */}
          <div className="text-center mb-8">
            {/* 큰 화면용 */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-center mb-4">
                <BookOpen className="h-10 w-10 text-primary mr-3" />
                <h1 className="text-3xl font-bold text-primary">ReadZone</h1>
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                ReadZone에서 독서의 즐거움을 나누어보세요
              </h2>
              <p className="text-muted-foreground">
                회원가입하고 새로운 독후감과 소식들을 확인해보세요
              </p>
            </div>
            
            {/* 모바일/태블릿용 */}
            <div className="lg:hidden">
              <h1 className="text-2xl font-bold mb-2">회원가입</h1>
              <p className="text-sm text-muted-foreground">
                ReadZone에서 독서의 즐거움을 나누어보세요
              </p>
            </div>
          </div>

          {/* 모바일과 큰 화면 모두 회원가입 폼만 중앙 표시 */}
          {/* 
            TODO: 향후 레이아웃 개선 계획
            - 방향 4: 사용자 통계, 후기, 미니 갤러리 등 시각적 콘텐츠 추가
            - 좌측 영역 활용: "이미 N명이 함께하고 있어요", 최근 가입자 활동 등
            - 조건: 충분한 사용자 데이터 확보 시 (목표: 사용자 1000명 이상)
            - 구현 시 아래 주석 해제하고 RegisterIntro 컴포넌트 개선
          */}
          <div className="flex justify-center max-w-6xl mx-auto">
            {/* 
            향후 확장용 좌측 영역 (현재 숨김)
            <div className="hidden lg:block lg:order-1">
              <RegisterIntro />
            </div>
            */}

            {/* 회원가입 폼 섹션 - 모든 화면에서 중앙 정렬 */}
            <div className="w-full max-w-md">
              <div className="w-full">
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