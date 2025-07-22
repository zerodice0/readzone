# Phase 5: Social Features (소셜 기능)

## 목표
좋아요, 댓글, 도서 의견, 프로필 등 소셜 기능을 구현하여 사용자 간 상호작용과 커뮤니티 형성을 촉진합니다.

## 범위

### 1. 좋아요 시스템
- [ ] 독후감 좋아요 기능
- [ ] 좋아요 상태 실시간 업데이트
- [ ] 좋아요 수 표시
- [ ] 좋아요 취소 기능
- [ ] 애니메이션 효과

### 2. 댓글 시스템
- [ ] 독후감 댓글 작성
- [ ] 댓글 목록 표시
- [ ] 댓글 수정/삭제
- [ ] 댓글 좋아요 (선택)
- [ ] 대댓글 기능 (1단계)

### 3. 도서 의견 시스템
- [ ] 280자 제한 의견 작성
- [ ] 추천/비추천 선택
- [ ] 도서별 의견 목록
- [ ] 의견 정렬 기능
- [ ] 사용자별 도서 의견 제한 (1개)

### 4. 프로필 페이지
- [ ] 사용자 기본 정보
- [ ] 활동 통계 표시
- [ ] 작성한 독후감 목록
- [ ] 작성한 도서 의견 목록
- [ ] 프로필 편집 기능

### 5. 외부 SNS 공유
- [ ] 독후감 공유 링크 생성
- [ ] 오픈 그래프 메타 태그
- [ ] X(Twitter) 공유
- [ ] 인스타그램 스토리 공유
- [ ] 카카오톡 공유

## 기술 요구사항

### API Routes

#### 좋아요 시스템
```typescript
// app/api/reviews/[id]/like/route.ts
POST /api/reviews/[id]/like
Response: {
  success: boolean
  isLiked: boolean
  likesCount: number
}

DELETE /api/reviews/[id]/like
Response: {
  success: boolean
  isLiked: boolean
  likesCount: number
}

// app/api/users/[id]/likes/route.ts
GET /api/users/[id]/likes
Query: {
  page: number
  limit: number
}
Response: {
  reviews: BookReview[]
  pagination: PaginationInfo
}
```

#### 댓글 시스템
```typescript
// app/api/reviews/[id]/comments/route.ts
GET /api/reviews/[id]/comments
Query: {
  page?: number
  limit?: number
  sort?: 'latest' | 'oldest'
}
Response: {
  comments: Comment[]
  pagination: PaginationInfo
}

POST /api/reviews/[id]/comments
Body: {
  content: string
  parentId?: string // 대댓글인 경우
}
Response: {
  success: boolean
  comment: Comment
}

// app/api/comments/[id]/route.ts
PUT /api/comments/[id]
Body: {
  content: string
}

DELETE /api/comments/[id]
```

#### 도서 의견 시스템
```typescript
// app/api/books/[id]/opinions/route.ts
GET /api/books/[id]/opinions
Query: {
  page?: number
  limit?: number
  sort?: 'latest' | 'recommended' | 'not_recommended'
}
Response: {
  opinions: BookOpinion[]
  stats: {
    total: number
    recommended: number
    notRecommended: number
    recommendationRate: number
  }
  pagination: PaginationInfo
}

POST /api/books/[id]/opinions
Body: {
  content: string
  isRecommended: boolean
}
Response: {
  success: boolean
  opinion: BookOpinion
}

// app/api/opinions/[id]/route.ts
PUT /api/opinions/[id]
DELETE /api/opinions/[id]
```

#### 프로필 관련
```typescript
// app/api/users/[id]/profile/route.ts
GET /api/users/[id]/profile
Response: {
  user: UserProfile
  stats: UserStats
}

PUT /api/users/[id]/profile
Body: {
  nickname?: string
  bio?: string
  image?: string
}

// app/api/users/[id]/reviews/route.ts
GET /api/users/[id]/reviews
Query: {
  page: number
  limit: number
  sort?: 'latest' | 'popular'
}

// app/api/users/[id]/opinions/route.ts
GET /api/users/[id]/opinions
```

### 데이터 모델 확장

#### 사용자 프로필
```typescript
interface UserProfile {
  id: string
  nickname: string
  email: string
  bio?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

interface UserStats {
  reviewsCount: number
  opinionsCount: number
  likesReceived: number
  booksRead: number
  averageRating?: number
  joinDate: Date
  lastActive: Date
}
```

#### 댓글 모델
```typescript
interface Comment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  
  userId: string
  reviewId: string
  parentId?: string // 대댓글인 경우
  
  user: {
    id: string
    nickname: string
    image?: string
  }
  
  replies?: Comment[] // 대댓글 목록
  _count: {
    replies: number
  }
}
```

#### 도서 의견 확장
```typescript
interface BookOpinionDetail extends BookOpinion {
  user: {
    id: string
    nickname: string
    image?: string
  }
  
  canEdit: boolean
  canDelete: boolean
}

interface BookOpinionStats {
  total: number
  recommended: number
  notRecommended: number
  recommendationRate: number // 0-100 백분율
}
```

### 상태 관리

#### 좋아요 상태 (Zustand)
```typescript
interface LikeState {
  likedReviews: Set<string>
  toggleLike: (reviewId: string) => Promise<void>
  setLiked: (reviewId: string, isLiked: boolean) => void
  isLiked: (reviewId: string) => boolean
}
```

#### 댓글 상태 (TanStack Query)
```typescript
const useCommentsQuery = (reviewId: string) => {
  return useInfiniteQuery({
    queryKey: ['comments', reviewId],
    queryFn: ({ pageParam }) => fetchComments(reviewId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
  })
}

const useCommentMutation = (reviewId: string) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (content: string) => createComment(reviewId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
    }
  })
}
```

## UI/UX 명세

### 좋아요 버튼 애니메이션
```typescript
interface LikeButtonProps {
  reviewId: string
  initialIsLiked: boolean
  initialCount: number
  size?: 'sm' | 'md' | 'lg'
}

const LikeButton: React.FC<LikeButtonProps> = ({
  reviewId,
  initialIsLiked,
  initialCount,
  size = 'md'
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [count, setCount] = useState(initialCount)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const handleLike = async () => {
    setIsAnimating(true)
    // 좋아요 토글 로직
    setTimeout(() => setIsAnimating(false), 300)
  }
  
  return (
    <button
      onClick={handleLike}
      className={`
        flex items-center space-x-1 transition-all duration-200
        ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}
        ${isAnimating ? 'scale-110' : 'scale-100'}
      `}
    >
      <Heart 
        size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
        fill={isLiked ? 'currentColor' : 'none'}
        className={isAnimating ? 'animate-ping' : ''}
      />
      <span className="text-sm font-medium">{count}</span>
    </button>
  )
}
```

### 댓글 섹션 UI
```
┌─────────────────────────────────────┐
│ 💬 댓글 (12개)                      │
├─────────────────────────────────────┤
│                                     │
│ [댓글을 남겨보세요...          ] [📤] │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ 👤 @username • 2시간 전             │
│ "정말 좋은 독후감이네요! 저도 이..."│
│ ❤️ 3 💬 답글 ✏️ 수정 🗑️ 삭제        │
│                                     │
│   ↳ 👤 @author • 1시간 전           │
│     "감사합니다! 도움이 되었다니..." │
│     ❤️ 1                           │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ 👤 @reader2 • 1일 전                │
│ "다른 관점에서 보면..."             │
│ ❤️ 5 💬 답글                        │
│                                     │
│         [더 많은 댓글 보기]          │
│                                     │
└─────────────────────────────────────┘
```

### 도서 의견 섹션 UI
```
┌─────────────────────────────────────┐
│ 💬 이 책에 대한 의견 (28개)         │
│                                     │
│ 📊 85% 추천 (24명) | 15% 비추천 (4명)│
│                                     │
│ ┌─ 정렬 ────────────────────────────┐│
│ │ ● 최신순  ○ 추천순  ○ 비추천순   ││
│ └───────────────────────────────────┘│
│                                     │
│ ┌─ 의견 작성 ───────────────────────┐│
│ │ [의견을 남겨보세요... (280자)]    ││
│ │                                  ││
│ │ 이 책을 추천하시나요?             ││
│ │ ○ 👍 추천  ○ 👎 비추천           ││
│ │                   [게시] 45/280  ││
│ └───────────────────────────────────┘│
│                                     │
│ 👤 @user1 • 2일 전  👍              │
│ "정말 감동적인 책이었어요. 특히..." │
│ ❤️ 3                               │
│                                     │
│ 👤 @user2 • 1주 전  👎              │
│ "개인적으로는 조금 아쉬웠어요..."   │
│ ❤️ 1                               │
│                                     │
└─────────────────────────────────────┘
```

### 프로필 페이지 UI (/profile/[userId])
```
┌─────────────────────────────────────┐
│                                     │
│   👤 username                       │
│   📅 2024년 1월 가입               │
│   📝 "책을 사랑하는 평범한 독자"    │
│                                     │
│   📊 활동 통계                      │
│   ┌─────────────────────────────┐   │
│   │ 📚 독후감: 25개             │   │
│   │ 💬 도서 의견: 48개          │   │
│   │ ❤️ 받은 좋아요: 312개       │   │
│   │ 📖 읽은 책: 73권            │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─ 탭 메뉴 ─────────────────────┐  │
│   │ ● 독후감  ○ 도서 의견       │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─ 독후감 목록 ─────────────────┐  │
│   │                             │  │
│   │ [📖] 책 제목 - 독후감 제목   │  │
│   │      👍 추천 • ❤️ 12 💬 5    │  │
│   │      3일 전                 │  │
│   │                             │  │
│   │ [📖] 책 제목 2              │  │
│   │      👎 비추천 • ❤️ 8 💬 2   │  │
│   │      1주 전                 │  │
│   │                             │  │
│   └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### 외부 공유 기능

#### 오픈 그래프 메타 태그
```typescript
// app/review/[id]/page.tsx
export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  const review = await getReview(params.id)
  
  return {
    title: `${review.book.title} 독후감 - ${review.user.nickname}`,
    description: review.content.substring(0, 160) + '...',
    openGraph: {
      title: `${review.book.title} 독후감`,
      description: review.content.substring(0, 160) + '...',
      images: [
        {
          url: review.book.thumbnail || '/default-book.png',
          width: 400,
          height: 600,
        }
      ],
      type: 'article',
      authors: [review.user.nickname],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${review.book.title} 독후감`,
      description: review.content.substring(0, 160) + '...',
      images: [review.book.thumbnail || '/default-book.png'],
    }
  }
}
```

#### 공유 링크 생성
```typescript
interface ShareData {
  title: string
  text: string
  url: string
  image?: string
}

const generateShareData = (review: BookReview): ShareData => {
  return {
    title: `${review.book.title} 독후감 - ReadZone`,
    text: `"${review.content.substring(0, 100)}..." ${review.isRecommended ? '👍 추천' : '👎 비추천'}`,
    url: `${process.env.NEXT_PUBLIC_URL}/review/${review.id}`,
    image: review.book.thumbnail
  }
}

// X(Twitter) 공유
const shareToTwitter = (shareData: ShareData) => {
  const text = encodeURIComponent(`${shareData.text}\n\n${shareData.url}`)
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
}

// 카카오톡 공유
const shareToKakao = (shareData: ShareData) => {
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: shareData.title,
      description: shareData.text,
      imageUrl: shareData.image,
      link: {
        mobileWebUrl: shareData.url,
        webUrl: shareData.url,
      },
    },
  })
}
```

## 테스트 시나리오

### 1. 좋아요 시스템 테스트
- [ ] 좋아요 클릭 시 상태 변경
- [ ] 좋아요 수 실시간 업데이트
- [ ] 좋아요 취소 기능
- [ ] 로그인하지 않은 사용자 제한

### 2. 댓글 시스템 테스트
- [ ] 댓글 작성 및 표시
- [ ] 댓글 수정/삭제 권한 확인
- [ ] 대댓글 작성 및 표시
- [ ] 댓글 페이지네이션

### 3. 도서 의견 테스트
- [ ] 280자 제한 검증
- [ ] 사용자당 책별 1개 의견 제한
- [ ] 추천/비추천 통계 업데이트
- [ ] 의견 정렬 기능

### 4. 프로필 페이지 테스트
- [ ] 사용자 통계 정확성
- [ ] 독후감/의견 목록 표시
- [ ] 프로필 편집 기능
- [ ] 다른 사용자 프로필 조회

### 5. 공유 기능 테스트
- [ ] 오픈 그래프 메타 태그 생성
- [ ] X(Twitter) 공유 링크
- [ ] 카카오톡 공유 기능
- [ ] 공유 URL 접근 시 정상 표시

## 완료 기준

### 필수 완료 사항
1. ✅ **좋아요**: 독후감 좋아요 기능 완전 구현
2. ✅ **댓글**: 작성/수정/삭제 및 대댓글 지원
3. ✅ **도서 의견**: 280자 의견 및 추천 시스템
4. ✅ **프로필**: 사용자 정보 및 활동 통계
5. ✅ **공유**: 외부 SNS 공유 기능

### 검증 방법
1. 좋아요/댓글 상호작용 정상 동작
2. 도서 의견 작성 및 통계 업데이트
3. 프로필 페이지 모든 정보 정확 표시
4. 공유 링크로 접근 시 올바른 메타데이터 표시

## 다음 Phase 연계 사항

Phase 5 완료 후 Phase 6에서 활용할 요소:
- 좋아요/댓글 데이터를 성능 최적화에 활용
- 사용자 활동 데이터로 추천 알고리즘 개선
- 공유 기능을 PWA 기능과 연동
- 프로필 통계를 대시보드 기능으로 확장

## 위험 요소 및 대응 방안

### 위험 요소
1. **스팸 방지**: 댓글/의견 스팸 공격
2. **성능 이슈**: 대량 댓글 로딩 시 지연
3. **데이터 일관성**: 좋아요 수 동기화 문제

### 대응 방안
1. **스팸 방지**: 사용자당 댓글 작성 제한, 관리자 신고 시스템
2. **성능 이슈**: 가상 스크롤링, 페이지네이션 강화
3. **데이터 일관성**: 트랜잭션 처리, 캐시 무효화 전략