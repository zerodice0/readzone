import { BookOpen, MessageSquare, TrendingUp, UserPlus, Users, Zap } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function RegisterServiceIntro() {
  return (
    <div className="flex flex-col items-center text-center space-y-8">
      {/* 서비스 로고 및 제목 */}
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-4xl font-bold text-primary">ReadZone</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-md">
          독서 후 감상을 공유하는 특별한 커뮤니티에 참여하세요
        </p>
      </div>

      {/* 회원가입 혜택 */}
      <div className="space-y-6 max-w-lg">
        <h2 className="text-2xl font-semibold">
          ReadZone 회원이 되시면
        </h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-left">
            <UserPlus className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              마크다운으로 풍부한 독후감 작성
            </span>
          </div>
          <div className="flex items-center space-x-3 text-left">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              다른 독자들과 댓글로 소통
            </span>
          </div>
          <div className="flex items-center space-x-3 text-left">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              관심있는 독자들을 팔로우
            </span>
          </div>
          <div className="flex items-center space-x-3 text-left">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              개인화된 추천 피드 이용
            </span>
          </div>
        </div>
      </div>

      {/* 가입 과정 안내 */}
      <div className="bg-card border p-6 rounded-lg max-w-md">
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">간단한 3단계</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground text-left">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">1</div>
            <span>기본 정보 입력</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">2</div>
            <span>이메일 인증</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">3</div>
            <span>독후감 작성 시작</span>
          </div>
        </div>
      </div>

      {/* 로그인 안내 */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
        <Link
          to="/login"
          search={{ redirect: undefined }}
          className="text-primary hover:underline font-medium"
        >
          로그인하기
        </Link>
      </div>

      {/* 게스트 브라우징 안내 */}
      <div className="bg-muted/50 p-4 rounded-lg max-w-md">
        <h3 className="font-medium mb-2">먼저 둘러보고 싶다면?</h3>
        <p className="text-sm text-muted-foreground mb-3">
          회원가입 없이도 다른 사람들의 독후감을 읽어볼 수 있습니다.
        </p>
        <Link 
          to="/"
          className="text-primary hover:underline text-sm font-medium"
        >
          ← 메인 피드로 가기
        </Link>
      </div>
    </div>
  )
}