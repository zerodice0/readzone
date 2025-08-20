import { BookOpen, MessageSquare, TrendingUp, Users } from 'lucide-react'

export function ServiceIntro() {
  return (
    <div className="flex flex-col items-center text-center space-y-8">
      {/* 서비스 로고 및 제목 */}
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-4xl font-bold text-primary">ReadZone</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-md">
          독서 후 감상을 공유하는 특별한 커뮤니티
        </p>
      </div>

      {/* 핵심 가치 제안 */}
      <div className="space-y-6 max-w-lg">
        <h2 className="text-2xl font-semibold">
          책을 읽은 후, 당신의 이야기를 들려주세요
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          ReadZone은 독서 계획이 아닌, <strong>독서 후의 깊은 감상</strong>을 나누는 공간입니다. 
          마크다운으로 풍부한 독후감을 작성하고, 같은 책을 읽은 독자들과 소통해보세요.
        </p>
      </div>

      {/* 주요 기능 하이라이트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-card border">
          <MessageSquare className="h-6 w-6 text-primary mt-1" />
          <div className="text-left">
            <h3 className="font-semibold mb-1">풍부한 독후감</h3>
            <p className="text-sm text-muted-foreground">
              마크다운 에디터로 이미지와 링크를 포함한 상세한 감상을 작성
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-card border">
          <Users className="h-6 w-6 text-primary mt-1" />
          <div className="text-left">
            <h3 className="font-semibold mb-1">활발한 소통</h3>
            <p className="text-sm text-muted-foreground">
              같은 책을 읽은 사람들과 댓글과 좋아요로 감상 공유
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-card border">
          <BookOpen className="h-6 w-6 text-primary mt-1" />
          <div className="text-left">
            <h3 className="font-semibold mb-1">다양한 도서</h3>
            <p className="text-sm text-muted-foreground">
              카카오 도서 API와 수동 입력으로 모든 책에 대한 독후감
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-card border">
          <TrendingUp className="h-6 w-6 text-primary mt-1" />
          <div className="text-left">
            <h3 className="font-semibold mb-1">개인화 피드</h3>
            <p className="text-sm text-muted-foreground">
              추천, 최신, 팔로잉 탭으로 맞춤형 독후감 발견
            </p>
          </div>
        </div>
      </div>

      {/* 게스트 브라우징 안내 */}
      <div className="bg-muted/50 p-6 rounded-lg max-w-md">
        <h3 className="font-semibold mb-2">먼저 둘러보고 싶다면?</h3>
        <p className="text-sm text-muted-foreground mb-3">
          로그인 없이도 다른 사람들의 독후감을 읽어볼 수 있습니다.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="text-primary hover:underline text-sm font-medium"
        >
          ← 메인 피드로 돌아가기
        </button>
      </div>
    </div>
  )
}