import { BookOpen, Heart, MessageCircle, TrendingUp, Users } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { getPopularReview } from '@/data/dummyReviews'

interface ActivityPreviewProps {
  hideHeader?: boolean
}

export function ActivityPreview({ hideHeader = false }: ActivityPreviewProps) {
  // 인기 독후감 하나 가져오기
  const popularReview = getPopularReview()

  return (
    <div className="space-y-8">
      {/* 웰컴백 메시지 - hideHeader가 true일 때 숨김 */}
      {!hideHeader && (
        <div className="text-center space-y-4">
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
      )}

      {/* 인기 독후감 미리보기 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">지금 인기 있는 독후감</h3>
        </div>
        
        <div className="bg-card border rounded-lg p-4 space-y-3">
          {/* 도서 정보 */}
          <div className="flex items-start space-x-3">
            <div className="w-12 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{popularReview.book.title}</h4>
              <p className="text-xs text-muted-foreground">{popularReview.book.author}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{popularReview.author.nickname}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 독후감 미리보기 */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {popularReview.content}
            </p>
            
            {/* 상호작용 통계 */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Heart className="h-3 w-3" />
                <span>{popularReview.stats.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-3 w-3" />
                <span>{popularReview.stats.comments}</span>
              </div>
            </div>
          </div>

          {/* 전체 보기 링크 */}
          <div className="pt-2 border-t">
            <Link 
              to="/"
              className="text-primary hover:underline text-sm font-medium"
            >
              더 많은 독후감 보러가기 →
            </Link>
          </div>
        </div>
      </div>

      {/* TODO: 향후 확장 기능들 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-muted-foreground">
          로그인하면 더 많은 기능을 이용할 수 있어요
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <Heart className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">개인화된 추천</p>
              <p className="text-xs text-muted-foreground">취향에 맞는 독후감을 추천받아요</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">댓글과 소통</p>
              <p className="text-xs text-muted-foreground">다른 독자들과 감상을 나누어요</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">독후감 작성</p>
              <p className="text-xs text-muted-foreground">나만의 독후감을 작성하고 공유해요</p>
            </div>
          </div>
        </div>
      </div>

      {/* TODO: 향후 추가될 기능들 - 주석으로 남겨둠 */}
      {/* 
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">새로운 소식</h3>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            새로운 도서 추가, 커뮤니티 활동 통계 등이 여기에 표시될 예정입니다.
          </p>
        </div>
      </div>
      */}

      {/* 가입 안내 */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          아직 계정이 없으신가요?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            회원가입하기
          </Link>
        </p>
      </div>
    </div>
  )
}