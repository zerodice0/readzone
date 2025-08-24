import { BookOpen, MessageCircle } from 'lucide-react'
import { Link } from '@tanstack/react-router'

/**
 * RegisterIntro - 회원가입 페이지 좌측 소개 컴포넌트
 * 
 * 현재 상태: 사용 안함 (RegisterPage에서 숨김 처리)
 * 
 * TODO: 향후 개선 계획 (사용자 1000명 이상 확보 시)
 * - 실시간 사용자 통계 추가 ("현재 N명이 활동 중")
 * - 최근 가입자 또는 인기 독후감 미리보기
 * - 회원가입 완료율 향상을 위한 동기 부여 요소
 * - 시각적 요소 강화 (일러스트, 애니메이션 등)
 */
export function RegisterIntro() {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* 핵심 가치 제안 */}
      <div className="space-y-4 max-w-md">
        <h2 className="text-2xl font-semibold text-foreground">
          책을 읽은 후, 당신의 이야기를 들려주세요
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          ReadZone은 독서 계획이 아닌, <strong>독서 후의 깊은 감상</strong>을 나누는 공간입니다.
        </p>
      </div>

      {/* 가입 혜택 - 간결하게 2개만 */}
      <div className="space-y-4 max-w-sm">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border">
          <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="text-left">
            <p className="text-sm font-medium">풍부한 독후감 작성</p>
            <p className="text-xs text-muted-foreground">마크다운으로 상세한 감상 기록</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border">
          <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="text-left">
            <p className="text-sm font-medium">독자들과 소통</p>
            <p className="text-xs text-muted-foreground">댓글과 좋아요로 감상 공유</p>
          </div>
        </div>
      </div>

      {/* 간단한 안내 */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          이미 계정이 있으신가요?
        </p>
        <Link 
          to="/login" 
          className="text-primary hover:underline font-medium"
        >
          로그인하기 →
        </Link>
      </div>
    </div>
  )
}