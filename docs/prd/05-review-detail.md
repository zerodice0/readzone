# 05. 독후감 상세 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/review/[id]`
- **우선순위**: 2순위 (Core Features)
- **설명**: 독후감 전체 내용 표시, 댓글 시스템, 소셜 상호작용
- **인증**: 비로그인 접근 가능 (읽기 전용), 상호작용 시 로그인 필요

## 📋 참조 문서

### 사용자 플로우
- **[소셜 상호작용](../user-flows/social-interaction.md)** - 좋아요, 댓글, 공유 기능
- **[커뮤니티 안전](../user-flows/safety.md)** - 신고 기능, 부적절한 콘텐츠 처리
- **[오류 처리](../user-flows/error-handling.md)** - 로딩 실패, 권한 오류 대응

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 독후감 상세의 소셜 상호작용 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 콘텐츠 소비 및 상호작용 흐름

### 관련 PRD 문서
- **[메인 피드 페이지](./01-main-feed.md)** - 피드에서 상세로 이동하는 진입점
- **[프로필 페이지](./07-profile.md)** - 작성자 프로필 클릭 시 이동 페이지
- **[도서 상세 페이지](./09-book-detail.md)** - 도서 정보 클릭 시 연결 페이지
- **[알림 페이지](./10-notifications.md)** - 댓글, 좋아요 알림 시스템
- **[신고/차단 관리 페이지](./13-moderation.md)** - 콘텐츠 신고 기능

## 핵심 기능

### 1. 독후감 내용 표시
- **안전한 마크다운 렌더링**: DOMPurify로 XSS 방지
- **반응형 레이아웃**: 데스크톱/모바일 최적화
- **읽기 모드**: 가독성 최적화된 타이포그래피
- **작성자 정보**: 프로필 이미지, 닉네임, 작성일시
- **도서 정보**: 표지, 제목, 저자, 출간년도
- **태그 표시**: 클릭 가능한 해시태그

### 2. 소셜 상호작용
- **좋아요 시스템**: 하트 애니메이션, 실시간 카운트 업데이트
- **공유 기능**: 링크 복사, 카카오톡, X(Twitter) 공유
- **북마크 기능**: 나중에 읽기 목록 추가
- **신고 기능**: 부적절한 콘텐츠 신고

### 3. 댓글 시스템
- **댓글 작성**: 실시간 등록, 마크다운 지원
- **답글 기능**: 중첩 댓글 (최대 3단계)
- **댓글 정렬**: 최신순, 좋아요순, 작성자순
- **댓글 좋아요**: 개별 댓글 좋아요 기능
- **댓글 신고**: 부적절한 댓글 신고 기능

### 4. 작성자 전용 기능
- **수정/삭제**: 본인 독후감만 가능
- **공개 설정 변경**: 전체공개 ↔ 팔로워만 ↔ 비공개
- **통계 확인**: 조회수, 좋아요, 댓글, 공유 수

## 필요한 API

### GET `/api/reviews/[id]`
```typescript
interface ReviewDetailRequest {
  id: string;
  includeComments?: boolean;
}

interface ReviewDetailResponse {
  review: {
    id: string;
    content: string; // 마크다운
    contentHtml: string; // 렌더된 HTML
    rating: 'recommend' | 'not_recommend';
    tags: string[];
    visibility: 'public' | 'followers' | 'private';
    createdAt: string;
    updatedAt: string;
    
    author: {
      id: string;
      username: string;
      profileImage?: string;
      isFollowing?: boolean; // 로그인 사용자만
    };
    
    book: {
      id: string;
      title: string;
      author: string;
      publisher: string;
      publishedDate: string;
      coverImage?: string;
      isbn?: string;
    };
    
    stats: {
      views: number;
      likes: number;
      comments: number;
      shares: number;
    };
    
    userInteraction?: {
      isLiked: boolean;
      isBookmarked: boolean;
    }; // 로그인 사용자만
  };
  
  comments?: Comment[];
  isOwner: boolean; // 작성자 여부
}

interface Comment {
  id: string;
  content: string;
  contentHtml: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    profileImage?: string;
  };
  parentId?: string; // 답글인 경우
  replies?: Comment[];
  stats: {
    likes: number;
  };
  userInteraction?: {
    isLiked: boolean;
  };
}
```

### POST `/api/reviews/[id]/like`
```typescript
interface LikeReviewRequest {
  action: 'like' | 'unlike';
}

interface LikeReviewResponse {
  success: boolean;
  isLiked: boolean;
  likesCount: number;
}
```

### POST `/api/reviews/[id]/bookmark`
```typescript
interface BookmarkReviewRequest {
  action: 'bookmark' | 'unbookmark';
}

interface BookmarkReviewResponse {
  success: boolean;
  isBookmarked: boolean;
}
```

### POST `/api/reviews/[id]/share`
```typescript
interface ShareReviewRequest {
  platform: 'link' | 'kakao' | 'twitter';
}

interface ShareReviewResponse {
  success: boolean;
  shareUrl?: string; // 플랫폼별 공유 URL
  shareCount: number; // 업데이트된 공유 수
}
```

### POST `/api/reviews/[id]/comments`
```typescript
interface CreateCommentRequest {
  content: string; // 마크다운
  parentId?: string; // 답글인 경우
}

interface CreateCommentResponse {
  success: boolean;
  comment: Comment;
}
```

### GET `/api/reviews/[id]/comments`
```typescript
interface GetCommentsRequest {
  reviewId: string;
  sort?: 'newest' | 'oldest' | 'likes' | 'author';
  cursor?: string;
  limit?: number;
}

interface GetCommentsResponse {
  comments: Comment[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}
```

### POST `/api/comments/[id]/like`
```typescript
interface LikeCommentRequest {
  action: 'like' | 'unlike';
}

interface LikeCommentResponse {
  success: boolean;
  isLiked: boolean;
  likesCount: number;
}
```

### DELETE `/api/reviews/[id]`
```typescript
interface DeleteReviewResponse {
  success: boolean;
  message: string;
}
```

### PUT `/api/reviews/[id]/visibility`
```typescript
interface UpdateVisibilityRequest {
  visibility: 'public' | 'followers' | 'private';
}

interface UpdateVisibilityResponse {
  success: boolean;
  visibility: string;
}
```

## 컴포넌트 구조

### 1. ReviewDetailPage (메인 컴포넌트)
```typescript
interface ReviewDetailPageProps {
  reviewId: string;
}

// 상태 관리
- review: ReviewDetail | null
- comments: Comment[]
- isLoading: boolean
- error: string | null
- isOwner: boolean
- commentsSort: 'newest' | 'oldest' | 'likes' | 'author'
```

### 2. ReviewContent (독후감 내용)
```typescript
interface ReviewContentProps {
  review: ReviewDetail;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onVisibilityChange: (visibility: string) => void;
}

// 하위 컴포넌트
- BookInfo: 도서 정보 표시
- AuthorInfo: 작성자 정보
- ReviewBody: 마크다운 렌더링된 본문
- TagList: 해시태그 목록
- ReviewStats: 통계 정보
```

### 3. InteractionPanel (상호작용 패널)
```typescript
interface InteractionPanelProps {
  review: ReviewDetail;
  onLike: () => Promise<void>;
  onBookmark: () => Promise<void>;
  onShare: (platform: string) => Promise<void>;
  onReport: () => void;
  isAuthenticated: boolean;
}

// 버튼들
- LikeButton: 좋아요 토글
- BookmarkButton: 북마크 토글
- ShareButton: 공유 옵션 드롭다운
- ReportButton: 신고 버튼
```

### 4. CommentSection (댓글 섹션)
```typescript
interface CommentSectionProps {
  reviewId: string;
  comments: Comment[];
  total: number;
  sort: string;
  onSortChange: (sort: string) => void;
  onCommentAdd: (comment: Comment) => void;
  isAuthenticated: boolean;
}

// 하위 컴포넌트
- CommentForm: 댓글 작성 폼
- CommentList: 댓글 목록
- CommentSortSelector: 정렬 옵션
```

### 5. CommentItem (댓글 아이템)
```typescript
interface CommentItemProps {
  comment: Comment;
  level: number; // 중첩 깊이 (0-2)
  onReply: (parentId: string) => void;
  onLike: () => Promise<void>;
  onReport: () => void;
  canReply: boolean; // 최대 깊이 제한
}

// 기능
- 답글 버튼 (3단계 제한)
- 좋아요 기능
- 상대 시간 표시 ("5분 전")
- 마크다운 렌더링
```

### 6. CommentForm (댓글 작성)
```typescript
interface CommentFormProps {
  reviewId: string;
  parentId?: string; // 답글인 경우
  onSubmit: (comment: Comment) => void;
  onCancel?: () => void; // 답글 작성 취소
  placeholder?: string;
}

// 기능
- 마크다운 지원
- 실시간 미리보기
- 글자 수 제한 (1000자)
- 키보드 단축키 (Ctrl+Enter 제출)
```

## 상태 관리 (Zustand)

### ReviewDetailStore
```typescript
interface ReviewDetailState {
  // 상태
  review: ReviewDetail | null;
  comments: Comment[];
  commentsTotal: number;
  commentsSort: 'newest' | 'oldest' | 'likes' | 'author';
  isLoading: boolean;
  error: string | null;
  
  // 액션
  loadReview: (id: string) => Promise<void>;
  loadComments: (reviewId: string, sort?: string) => Promise<void>;
  likeReview: () => Promise<void>;
  bookmarkReview: () => Promise<void>;
  shareReview: (platform: string) => Promise<void>;
  deleteReview: () => Promise<void>;
  updateVisibility: (visibility: string) => Promise<void>;
  
  // 댓글 관련
  addComment: (content: string, parentId?: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  setCommentsSort: (sort: string) => void;
  
  // 유틸리티
  reset: () => void;
  updateReviewStats: (stats: Partial<ReviewStats>) => void;
}
```

## 마크다운 렌더링 시스템

### 안전한 HTML 렌더링
```typescript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 마크다운 설정
const renderer = new marked.Renderer();

// 이미지 렌더링 커스텀
renderer.image = (href, title, text) => {
  return `
    <img 
      src="${href}" 
      alt="${text}" 
      title="${title || ''}"
      loading="lazy"
      class="max-w-full h-auto rounded-lg shadow-sm"
      onerror="this.style.display='none'"
    />
  `;
};

// 링크 렌더링 커스텀 (외부 링크는 새 탭)
renderer.link = (href, title, text) => {
  const isExternal = !href.startsWith('/') && !href.startsWith('#');
  return `
    <a 
      href="${href}" 
      title="${title || ''}"
      ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}
      class="text-blue-600 hover:text-blue-800 underline"
    >
      ${text}
    </a>
  `;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true,
});

// 안전한 마크다운 렌더링
export const renderSafeMarkdown = (markdown: string): string => {
  const rawHtml = marked(markdown);
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'del', 's',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'target', 'rel',
      'class', 'loading'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'], // 외부 링크 보안
  });
};
```

### 읽기 최적화 타이포그래피
```css
.review-content {
  /* 기본 폰트 설정 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.7;
  color: #1f2937;
  
  /* 제목 스타일링 */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
    line-height: 1.3;
  }
  
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
  
  /* 문단 간격 */
  p {
    margin-bottom: 1.25rem;
  }
  
  /* 인용문 스타일링 */
  blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: #6b7280;
  }
  
  /* 코드 스타일링 */
  code {
    background-color: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
  }
  
  pre {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }
  
  /* 목록 스타일링 */
  ul, ol {
    padding-left: 1.5rem;
    margin-bottom: 1.25rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  /* 이미지 스타일링 */
  img {
    margin: 1.5rem auto;
    display: block;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
}
```

## 댓글 시스템

### 중첩 댓글 구조
```typescript
const CommentTree: React.FC<{
  comments: Comment[];
  level: number;
  maxLevel: number;
}> = ({ comments, level, maxLevel }) => {
  return (
    <div className={`space-y-4 ${level > 0 ? 'ml-8' : ''}`}>
      {comments.map(comment => (
        <div key={comment.id} className="border-l-2 border-gray-100 pl-4">
          <CommentItem 
            comment={comment}
            level={level}
            canReply={level < maxLevel}
            onReply={(parentId) => setReplyingTo(parentId)}
          />
          
          {comment.replies && comment.replies.length > 0 && (
            <CommentTree
              comments={comment.replies}
              level={level + 1}
              maxLevel={maxLevel}
            />
          )}
        </div>
      ))}
    </div>
  );
};
```

### 실시간 댓글 업데이트
```typescript
// 댓글 작성 후 실시간 UI 업데이트
const optimisticUpdateComment = (newComment: Partial<Comment>) => {
  const tempComment: Comment = {
    id: `temp_${Date.now()}`,
    content: newComment.content || '',
    contentHtml: renderSafeMarkdown(newComment.content || ''),
    createdAt: new Date().toISOString(),
    author: currentUser,
    parentId: newComment.parentId,
    stats: { likes: 0 },
    userInteraction: { isLiked: false }
  };
  
  // UI에 즉시 반영
  addCommentToState(tempComment);
  
  // 서버에 전송
  api.createComment(reviewId, newComment)
    .then(response => {
      // 임시 댓글을 실제 댓글로 교체
      replaceComment(tempComment.id, response.comment);
    })
    .catch(error => {
      // 실패 시 임시 댓글 제거
      removeComment(tempComment.id);
      showError('댓글 작성에 실패했습니다');
    });
};
```

## 공유 기능

### 플랫폼별 공유 구현
```typescript
interface ShareOptions {
  url: string;
  title: string;
  description: string;
  image?: string;
}

const shareToKakao = ({ url, title, description, image }: ShareOptions) => {
  if (typeof window !== 'undefined' && window.Kakao) {
    window.Kakao.Link.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl: image,
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
    });
  }
};

const shareToTwitter = ({ url, title }: ShareOptions) => {
  const text = encodeURIComponent(`${title} - ReadZone`);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'width=550,height=420');
};

const copyToClipboard = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    toast.success('링크가 클립보드에 복사되었습니다');
  } catch (error) {
    // 폴백: 임시 input 엘리먼트 사용
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    toast.success('링크가 복사되었습니다');
  }
};
```

### Open Graph 메타태그
```typescript
// Next.js Head 컴포넌트에서 동적 메타태그 설정
const ReviewMetaTags: React.FC<{ review: ReviewDetail }> = ({ review }) => {
  const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/review/${review.id}`;
  const description = review.content.slice(0, 160).replace(/[#*`]/g, ''); // 마크다운 제거
  
  return (
    <Head>
      <title>{`${review.book.title} 독후감 - ${review.author.username} | ReadZone`}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={`${review.book.title} 독후감`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={review.book.coverImage || '/og-default.jpg'} />
      <meta property="og:site_name" content="ReadZone" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${review.book.title} 독후감`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={review.book.coverImage || '/og-default.jpg'} />
    </Head>
  );
};
```

## SEO 및 성능 최적화

### 서버 사이드 렌더링
```typescript
// getServerSideProps for SEO and initial data
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  try {
    const reviewData = await api.getReview(id as string);
    
    // 404 처리
    if (!reviewData.review) {
      return { notFound: true };
    }
    
    // 비공개 독후감 접근 제한
    if (reviewData.review.visibility === 'private' && !reviewData.isOwner) {
      return { notFound: true };
    }
    
    return {
      props: {
        initialData: reviewData,
        reviewId: id,
      },
    };
  } catch (error) {
    return { notFound: true };
  }
};
```

### 이미지 최적화
```typescript
// 차세대 이미지 형식 지원
const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  
  // WebP 지원 확인
  const webpSrc = src.includes('cloudinary') 
    ? src.replace(/\.(jpg|jpeg|png)/, '.webp')
    : src;
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={webpSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageSrc(src); // WebP 실패 시 원본 사용
          setIsLoading(false);
        }}
        className={`transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};
```

## 에러 처리

### 에러 바운더리
```typescript
class ReviewDetailErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ReviewDetail error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-xl font-semibold mb-4">독후감을 불러올 수 없습니다</h2>
          <p className="text-gray-600 mb-4">페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            새로고침
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## 접근성

### 스크린 리더 지원
```typescript
// ARIA 라벨링
<article role="article" aria-labelledby="review-title">
  <header>
    <h1 id="review-title">{review.book.title} 독후감</h1>
    <p aria-label={`작성자: ${review.author.username}, 작성일: ${formatDate(review.createdAt)}`}>
      {review.author.username} · {formatRelativeTime(review.createdAt)}
    </p>
  </header>
  
  <div 
    className="review-content"
    dangerouslySetInnerHTML={{ __html: review.contentHtml }}
    aria-label="독후감 내용"
  />
  
  <footer role="contentinfo">
    <div role="group" aria-label="독후감 상호작용">
      <button
        aria-label={`좋아요 ${review.userInteraction?.isLiked ? '취소' : '하기'}, 현재 ${review.stats.likes}개`}
        aria-pressed={review.userInteraction?.isLiked}
      >
        좋아요
      </button>
    </div>
  </footer>
</article>

<section aria-labelledby="comments-title">
  <h2 id="comments-title">댓글 {commentsTotal}개</h2>
  <div role="list" aria-label="댓글 목록">
    {comments.map(comment => (
      <div key={comment.id} role="listitem">
        {/* 댓글 내용 */}
      </div>
    ))}
  </div>
</section>
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (독후감 내용 렌더링)
- **FID**: < 100ms (좋아요, 댓글 버튼 반응)
- **CLS**: < 0.1 (댓글 로딩 시 레이아웃 변경 최소화)

### 사용자 경험 지표
- 초기 렌더링: < 1.5초
- 댓글 로딩: < 1초
- 좋아요 응답: < 300ms
- 댓글 작성 응답: < 1.5초