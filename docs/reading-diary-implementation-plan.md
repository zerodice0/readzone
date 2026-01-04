# 독서 일기 기능 구현 계획

## 개요

책을 읽는 동안 날짜별로 읽은 내용을 간단히 기록하는 독서 일기 기능 구현.
캘린더로 시각화하여 독서 패턴을 파악하고, 독후감 작성 시 참고자료로 활용.

## 핵심 요구사항

- 책 선택 후 날짜와 함께 간단한 기록 작성
- 공개/비공개 선택 가능
- 캘린더에 날짜별 책 커버 썸네일 표시
- 독후감 작성 시 해당 도서의 독서 일기를 사이드에 표시

---

## Phase 1: 백엔드 기반 구축

### 1.1 스키마 확장

**파일**: `packages/backend/convex/schema.ts`

```typescript
readingDiaries: defineTable({
  userId: v.string(),                    // Clerk user ID
  bookId: v.id('books'),                 // 연결된 책
  date: v.number(),                      // 읽은 날짜 (Unix timestamp, 날짜만)
  content: v.string(),                   // 일기 내용
  visibility: v.union(
    v.literal('PUBLIC'),
    v.literal('PRIVATE')
  ),
})
  .index('by_user', ['userId'])
  .index('by_user_date', ['userId', 'date'])
  .index('by_user_book', ['userId', 'bookId'])
  .index('by_book', ['bookId']),
```

### 1.2 Convex 함수 구현

**새 파일**: `packages/backend/convex/readingDiaries.ts`

| 함수                 | 타입     | 용도                                |
| -------------------- | -------- | ----------------------------------- |
| `getCalendarSummary` | Query    | 월별 캘린더 데이터 (날짜별 책 커버) |
| `getByUserAndDate`   | Query    | 특정 날짜의 일기 목록               |
| `getByUserAndBook`   | Query    | 특정 책의 모든 일기 (독후감 연동용) |
| `get`                | Query    | 단일 일기 상세                      |
| `create`             | Mutation | 일기 작성                           |
| `update`             | Mutation | 일기 수정                           |
| `remove`             | Mutation | 일기 삭제                           |

---

## Phase 2: 독서 일기 작성 페이지

### 2.1 새 페이지 생성

**새 파일**: `packages/frontend/src/pages/ReadingDiaryNew/ReadingDiaryNewPage.tsx`

**UI 구성**:

1. 책 선택 (기존 `BookSearch` 컴포넌트 재사용)
2. 날짜 선택 (기본값: 오늘)
3. 내용 작성 (textarea)
4. 공개/비공개 토글
5. 저장 버튼

### 2.2 라우터 추가

**파일**: `packages/frontend/src/router.tsx`

```typescript
// 새 lazy import
const ReadingDiaryPage = lazy(() => import('./pages/ReadingDiary/ReadingDiaryPage'));
const ReadingDiaryNewPage = lazy(() => import('./pages/ReadingDiaryNew/ReadingDiaryNewPage'));

// Protected routes 추가
{ path: '/reading-diary', element: <ProtectedRoute><ReadingDiaryPage /></ProtectedRoute> },
{ path: '/reading-diary/new', element: <ProtectedRoute><ReadingDiaryNewPage /></ProtectedRoute> },
```

---

## Phase 3: 캘린더 뷰 구현

### 3.1 캘린더 메인 페이지

**새 파일**: `packages/frontend/src/pages/ReadingDiary/ReadingDiaryPage.tsx`

**UI 구성**:

- 헤더: 월 네비게이션 (< 2025년 1월 >)
- 캘린더 그리드 (7x6)
- 각 날짜 셀에 책 커버 썸네일 표시 (일기 있는 날만)
- 날짜 클릭 → 모달로 해당 날짜 일기 목록 표시

### 3.2 캘린더 컴포넌트

**새 폴더**: `packages/frontend/src/pages/ReadingDiary/components/`

| 컴포넌트              | 역할                                    |
| --------------------- | --------------------------------------- |
| `ReadingCalendar.tsx` | 캘린더 그리드 (date-fns 기반 자체 구현) |
| `CalendarDay.tsx`     | 개별 날짜 셀 (책 커버 표시)             |
| `DiaryListModal.tsx`  | 날짜 클릭 시 일기 목록 모달             |
| `DiaryCard.tsx`       | 일기 카드 (수정/삭제 버튼 포함)         |

### 3.3 Hook

**새 파일**: `packages/frontend/src/hooks/useReadingDiary.ts`

- 월별 데이터 관리
- 월 네비게이션 (이전/다음/오늘)

---

## Phase 4: 독후감 연동

### 4.1 사이드바 컴포넌트

**새 파일**: `packages/frontend/src/components/diary/BookDiaryList.tsx`

- 해당 책의 독서 일기 목록 표시
- 날짜순 정렬
- 내용 미리보기 (클릭 시 확장)

### 4.2 ReviewNewPage 확장

**파일**: `packages/frontend/src/pages/ReviewNew/ReviewNewPage.tsx`

Step 2 (독후감 작성) 화면에서:

- 데스크톱: 우측 사이드바에 `BookDiaryList` 표시
- 모바일: 접히는 아코디언 섹션으로 표시

---

## Phase 5: 마무리

### 5.1 헤더 네비게이션 추가

**파일**: `packages/frontend/src/components/layout/Header.tsx`

- "독서 일기" 메뉴 항목 추가

### 5.2 대시보드 통계 확장 (선택)

- 독서 연속일(streak) 표시

---

## 주요 수정 파일 목록

### 백엔드

- `packages/backend/convex/schema.ts` - readingDiaries 테이블 추가
- `packages/backend/convex/readingDiaries.ts` - 새 파일 (CRUD)

### 프론트엔드

- `packages/frontend/src/router.tsx` - 라우트 추가
- `packages/frontend/src/pages/ReadingDiary/` - 새 폴더 (캘린더 뷰)
- `packages/frontend/src/pages/ReadingDiaryNew/` - 새 폴더 (작성 페이지)
- `packages/frontend/src/components/diary/` - 새 폴더 (공유 컴포넌트)
- `packages/frontend/src/hooks/useReadingDiary.ts` - 새 파일
- `packages/frontend/src/pages/ReviewNew/ReviewNewPage.tsx` - 사이드바 연동
- `packages/frontend/src/components/layout/Header.tsx` - 메뉴 추가

---

## 구현 순서 요약

1. **스키마 + Convex 함수** (readingDiaries 테이블 및 CRUD)
2. **작성 페이지** (ReadingDiaryNewPage + 라우터)
3. **캘린더 뷰** (ReadingDiaryPage + 컴포넌트들)
4. **독후감 연동** (ReviewNewPage 사이드바)
5. **헤더 메뉴 + 마무리**
