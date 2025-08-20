import { useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { ActivityPreview } from '@/components/auth/ActivityPreview'
import { LoginForm } from '@/components/auth/LoginForm'
import { GuestOnlyRoute } from '@/components/auth/AuthRedirect'

export function LoginPage() {
  // SEO 및 접근성을 위한 페이지 메타데이터 설정
  useEffect(() => {
    document.title = '로그인 - ReadZone'
    
    const metaDescription = document.querySelector('meta[name="description"]')

    if (metaDescription) {
      metaDescription.setAttribute('content', 'ReadZone에 로그인하여 독서 후 감상을 공유하고 다른 독자들과 소통하세요.')
    }

    // 페이지 언마운트 시 원래 제목으로 복원
    return () => {
      document.title = 'ReadZone'
    }
  }, [])

  return (
    <GuestOnlyRoute>
      <div className="min-h-screen bg-background">
        {/* 페이지 헤더 (스크린 리더용) */}
        <div className="sr-only">
          <h1>ReadZone 로그인 페이지</h1>
          <p>독서 후 감상을 공유하는 커뮤니티에 로그인하세요.</p>
        </div>

        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-2rem)]">
          {/* 큰 화면에서 상단 중앙 헤더 */}
          <div className="hidden lg:block text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-primary mr-3" />
              <h1 className="text-3xl font-bold text-primary">ReadZone</h1>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              다시 돌아오신 것을 환영합니다!
            </h2>
            <p className="text-muted-foreground">
              로그인하고 새로운 독후감과 소식들을 확인해보세요
            </p>
          </div>

          {/* 모바일: 로그인 폼만 표시, 큰 화면: 좌우 2단 구조 */}
          <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] lg:min-h-0 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start lg:items-center max-w-6xl mx-auto lg:h-full">
            {/* 최근 활동 미리보기 섹션 - 큰 화면에서만 표시 */}
            <div className="hidden lg:block lg:order-1">
              <ActivityPreview hideHeader />
            </div>

            {/* 로그인 폼 섹션 - 모바일에서는 중앙 정렬, 큰 화면에서는 우측 */}
            <div className="w-full max-w-md lg:flex lg:justify-start lg:order-2">
              <div className="w-full">
                <LoginForm />
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