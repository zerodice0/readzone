---
work_package_id: 'WP09'
subtasks:
  - 'T092'
  - 'T093'
  - 'T094'
  - 'T095'
  - 'T096'
  - 'T097'
  - 'T098'
  - 'T099'
  - 'T100'
  - 'T101'
title: 'Frontend - Review Detail Page'
phase: 'Phase 2 - Frontend'
lane: 'doing'
assignee: ''
agent: 'claude'
shell_pid: '26989'
history:
  - timestamp: '2025-11-08T17:52:47Z'
    lane: 'planned'
    agent: 'system'
    shell_pid: ''
    action: 'Prompt generated via /spec-kitty.tasks'
  - timestamp: '2025-11-09T01:25:01Z'
    lane: 'doing'
    agent: 'claude'
    shell_pid: '88760'
    action: 'Started implementation'
  - timestamp: '2025-11-09T01:31:31Z'
    lane: 'for_review'
    agent: 'claude'
    shell_pid: '88760'
    action: 'Ready for review'
  - timestamp: '2025-11-09T01:45:00Z'
    lane: 'planned'
    agent: 'claude'
    shell_pid: '22833'
    action: 'Returned for changes - UX and error handling improvements needed'
---

# Work Package Prompt: WP09 – Frontend - Review Detail Page

## Objectives & Success Criteria

**Goal**: Implement ReviewDetailPage displaying full review content with SPA navigation and scroll position preservation.

**Success Criteria**:

- [ ] ReviewDetailPage component created
- [ ] Review detail API call (GET /api/reviews/:id) implemented
- [ ] Full review content displayed (no truncation)
- [ ] Book information section displayed (cover, title, author, description)
- [ ] Like/bookmark buttons functional on detail page
- [ ] Share functionality implemented (copy link, social media)
- [ ] Route `/reviews/:id` added to React Router
- [ ] Scroll position restoration on back navigation works
- [ ] Loading and error states implemented
- [ ] Back button returns to feed with scroll preserved

## Context & Constraints

**Related Documents**:

- `kitty-specs/002-feature/contracts/reviews-api.md` - GET /reviews/:id spec
- `kitty-specs/002-feature/spec.md` - Detail page requirements

**Constraints**:

- Must increment viewCount on page load
- Scroll restoration on back navigation
- Mobile-optimized reading experience
- SEO-friendly meta tags (future enhancement)

**Architectural Decisions**:

- React Router useParams() for ID extraction
- Separate detail store or component state (not feed store)
- ScrollRestoration component from React Router

## Subtasks & Detailed Guidance

### Subtask T092 – Create ReviewDetailPage component

### Subtask T093 – Create index file for export

### Subtask T094 – Implement review detail API call

### Subtask T095 – Display full review content

### Subtask T096 – Display book information section

### Subtask T097 – Implement like/bookmark buttons

### Subtask T098 – Implement share functionality

### Subtask T099 – Add route to React Router

### Subtask T100 – Implement scroll position restoration

### Subtask T101 – Add loading and error states

## Implementation Guidance

**Create component structure** (T092-T093):

```typescript
// packages/frontend/src/pages/ReviewDetail/ReviewDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewsApi } from '../../services/api/reviews';
import { Review } from '../../types/review';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Heart, Bookmark, Share2 } from 'lucide-react';

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadReview(id);
  }, [id]);

  const loadReview = async (reviewId: string) => {
    // Implemented in T094
  };

  const handleBack = () => {
    navigate('/feed');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Loading state - T101 */}
      {/* Error state - T101 */}
      {/* Content - T095-T098 */}
    </div>
  );
}
```

**Fetch review data** (T094):

```typescript
const loadReview = async (reviewId: string) => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await reviewsApi.getReview(reviewId);
    setReview(response.data);
  } catch (err: any) {
    setError(err.message || '독후감을 불러올 수 없습니다');
  } finally {
    setIsLoading(false);
  }
};
```

**Display full content** (T095):

```typescript
{review && (
  <>
    {/* Header with back button */}
    <div className="mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        피드로 돌아가기
      </Button>

      {/* User info */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={review.user.profileImage || '/default-avatar.png'}
          alt={review.user.name}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <p className="font-semibold">{review.user.name}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(review.publishedAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
    </div>

    {/* Review title */}
    {review.title && (
      <h1 className="text-3xl font-bold mb-6">{review.title}</h1>
    )}

    {/* Full review content */}
    <div className="prose max-w-none mb-8">
      <p className="whitespace-pre-wrap">{review.content}</p>
    </div>

    {/* Recommend status */}
    <div className="flex items-center gap-2 mb-8">
      {review.isRecommended ? (
        <span className="text-green-600 font-medium">✅ 추천</span>
      ) : (
        <span className="text-red-600 font-medium">❌ 비추천</span>
      )}
      {review.rating && (
        <span className="text-muted-foreground">
          ⭐ {review.rating}/5
        </span>
      )}
    </div>

    {/* Book info - T096 */}
    {/* Action buttons - T097-T098 */}
  </>
)}
```

**Book information section** (T096):

```typescript
<div className="border rounded-lg p-6 mb-8 bg-muted/50">
  <h2 className="text-xl font-semibold mb-4">책 정보</h2>
  <div className="flex gap-4">
    <img
      src={review.book.coverImageUrl || '/placeholder-book.png'}
      alt={review.book.title}
      className="w-32 h-44 object-cover rounded shadow"
    />
    <div className="flex-1">
      <h3 className="text-lg font-bold mb-2">{review.book.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{review.book.author}</p>
      {/* Future: Add book description */}
    </div>
  </div>
</div>
```

**Action buttons** (T097-T098):

```typescript
import { likesApi } from '../../services/api/likes';
import { bookmarksApi } from '../../services/api/bookmarks';

const [isLiked, setIsLiked] = useState(review.isLikedByMe);
const [likeCount, setLikeCount] = useState(review.likeCount);
const [isBookmarked, setIsBookmarked] = useState(review.isBookmarkedByMe);

const handleLike = async () => {
  try {
    const response = await likesApi.toggleLike(review.id);
    setIsLiked(response.data.isLiked);
    setLikeCount(response.data.likeCount);
  } catch (err) {
    alert('좋아요 처리에 실패했습니다');
  }
};

const handleBookmark = async () => {
  try {
    const response = await bookmarksApi.toggleBookmark(review.id);
    setIsBookmarked(response.data.isBookmarked);
  } catch (err) {
    alert('북마크 처리에 실패했습니다');
  }
};

const handleShare = async () => {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    alert('링크가 복사되었습니다');
  } catch (err) {
    alert('링크 복사에 실패했습니다');
  }
};

<div className="flex gap-2 justify-center sm:justify-start">
  <Button variant="outline" onClick={handleLike}>
    <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current text-red-500' : ''}`} />
    {likeCount}
  </Button>
  <Button variant="outline" onClick={handleBookmark}>
    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-blue-500' : ''}`} />
  </Button>
  <Button variant="outline" onClick={handleShare}>
    <Share2 className="w-4 h-4" />
  </Button>
</div>
```

**Routing** (T099):

```typescript
// In App.tsx
import { ReviewDetailPage } from './pages/ReviewDetail';

<Routes>
  <Route path="/feed" element={<FeedPage />} />
  <Route path="/reviews/:id" element={<ReviewDetailPage />} />
  {/* Other routes */}
</Routes>
```

**Scroll restoration** (T100):

```typescript
// In App.tsx
import { BrowserRouter, ScrollRestoration } from 'react-router-dom';

<BrowserRouter>
  <ScrollRestoration />
  <Routes>
    {/* routes */}
  </Routes>
</BrowserRouter>
```

**Loading and error states** (T101):

```typescript
{isLoading && (
  <div className="flex justify-center items-center py-16">
    <Loader2 className="w-8 h-8 animate-spin" />
    <span className="ml-2">독후감을 불러오는 중...</span>
  </div>
)}

{error && (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <AlertCircle className="w-16 h-16 text-destructive mb-4" />
    <h2 className="text-xl font-semibold mb-2">독후감을 불러올 수 없습니다</h2>
    <p className="text-muted-foreground mb-6">{error}</p>
    <Button onClick={() => id && loadReview(id)}>다시 시도</Button>
  </div>
)}
```

## Definition of Done Checklist

- [ ] All subtasks T092-T101 completed
- [ ] ReviewDetailPage component created
- [ ] GET /api/reviews/:id API call working
- [ ] Full review content displayed
- [ ] Book information section displayed
- [ ] Like/bookmark buttons functional
- [ ] Share functionality copies link
- [ ] Route `/reviews/:id` added
- [ ] Scroll restoration works on back navigation
- [ ] Loading and error states implemented
- [ ] TypeScript compilation passes

## Review Guidance

**Reviewer Should Verify**:

- [ ] Navigate to feed, click review card - navigates to detail
- [ ] View detail page - full content displayed
- [ ] Click like button - toggles state
- [ ] Click bookmark button - toggles state
- [ ] Click share button - copies link
- [ ] Click back button - returns to feed with scroll position
- [ ] Test loading state - throttle network in DevTools
- [ ] Test error state - block API in DevTools Network tab
- [ ] Test on mobile - responsive layout works

## Review Feedback

**검토 일시**: 2025-11-09T01:45:00Z
**검토자**: claude (reviewer)
**Shell PID**: 22833
**결과**: ❌ **수정 필요** - 기능은 완성되었으나 UX 및 에러 처리 개선 필요

### ✅ 성공적으로 구현된 항목

1. **핵심 기능** - 모든 Success Criteria 충족
   - ReviewDetailPage 컴포넌트 생성 완료
   - API 호출 (GET /reviews/:id) 정상 동작
   - 전체 리뷰 콘텐츠 표시 (truncation 없음)
   - 책 정보 섹션 (표지, 제목, 저자) 표시
   - 좋아요/북마크 토글 기능 구현
   - 공유 기능 (클립보드 복사) 구현
   - React Router 라우트 추가 (/reviews/:id)
   - ScrollRestoration 적용
   - 로딩/에러 상태 구현

2. **코드 품질**
   - ✅ TypeScript 컴파일 통과
   - ✅ 반응형 디자인 (모바일 퍼스트)
   - ✅ 이미지 최적화 (lazy loading, error fallback)
   - ✅ XSS 방지 (React 기본 보호)

### ⚠️ 필수 수정 사항 (Critical)

#### 1. 에러 처리 개선 - `ReviewDetailPage.tsx:68-93`

**현재 문제**: 좋아요/북마크 실패 시 **에러를 완전히 무시**하여 사용자에게 피드백 없음

```typescript
// 현재 코드 (문제)
.catch(() => {
  // Error silently handled - user can retry
});
```

**수정 필요**:

```typescript
.catch((error) => {
  alert('좋아요 처리에 실패했습니다. 다시 시도해주세요.');
  console.error('Toggle like failed:', error);
  // 상태 롤백
  setIsLiked(prev => !prev);
  setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
});
```

**영향**:

- 사용자가 버튼 클릭 후 아무 반응이 없으면 혼란스러움
- "Fail explicitly" 원칙 위반
- 북마크도 동일한 문제

#### 2. 공유 기능 피드백 개선 - `ReviewDetailPage.tsx:95-107`

**현재 문제**: 클립보드 복사 성공/실패에 대한 사용자 피드백 없음

```typescript
// 현재 코드 (문제)
void navigator.clipboard.writeText(url);
```

**수정 필요**:

```typescript
const handleShare = async (): Promise<void> => {
  if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다');
    } catch (err) {
      alert('링크 복사에 실패했습니다');
      console.error('Share failed:', err);
    }
  }
};
```

### 💡 권장 개선 사항 (Optional but Recommended)

#### 3. 접근성 개선

**이미지 alt 텍스트 개선**:

```typescript
// 더 설명적인 alt 텍스트
alt={`${review.user.name}의 프로필 사진`}
alt={`${review.book.title} 표지`}
```

**버튼 접근성**:

```typescript
<Button variant="outline" onClick={handleBookmark} aria-label="북마크 토글">
  <Bookmark className={...} />
  <span className="sr-only">북마크</span>
</Button>
```

#### 4. 메모리 누수 방지

**useEffect cleanup 함수 추가**:

```typescript
useEffect(() => {
  let isMounted = true;

  if (!id) {
    setError('잘못된 독후감 ID입니다');
    setIsLoading(false);
    return;
  }

  loadReview(id).then(() => {
    if (!isMounted) return;
    // 상태 업데이트
  });

  return () => {
    isMounted = false;
  };
}, [id]);
```

### 📋 수정 후 재검토 체크리스트

구현자는 다음 항목을 수정 후 재검토를 요청해주세요:

- [ ] 좋아요/북마크 실패 시 사용자에게 에러 메시지 표시
- [ ] 상태 롤백 로직 추가 (네트워크 오류 시 UI 상태 되돌리기)
- [ ] 공유 버튼 클릭 시 "링크가 복사되었습니다" 피드백
- [ ] 공유 실패 시 에러 메시지 표시
- [ ] (권장) 접근성 개선 - alt 텍스트 및 aria-label
- [ ] (권장) useEffect cleanup 함수 추가

### 🧪 검증 완료 항목

- ✅ TypeScript 컴파일 통과
- ✅ 모든 Success Criteria 기능 구현
- ✅ 반응형 레이아웃 확인
- ✅ ScrollRestoration 적용 확인
- ✅ 라우팅 설정 확인
- ✅ API 서비스 연동 확인

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.
- 2025-11-09T01:25:01Z – claude – shell_pid=88760 – lane=doing – Started implementation
- 2025-11-09T01:31:31Z – claude – shell_pid=88760 – lane=for_review – Ready for review
- 2025-11-09T01:45:00Z – claude – shell_pid=22833 – lane=for_review – **Code review completed - Changes required for UX and error handling improvements**

---

### Next Steps After Completion

- **WP10**: Frontend - Authentication Integration
- **WP11**: Polish & Performance
- 2025-11-09T01:36:07Z – claude – shell_pid=22833 – lane=planned – Returned for changes - UX and error handling improvements needed
- 2025-11-09T01:38:06Z – claude – shell_pid=26989 – lane=doing – Started implementation
