# Phase 2: Core Pages (핵심 페이지)

## 목표
사용자 인증 흐름과 메인 피드 페이지를 구현하여 ReadZone의 핵심 사용자 경험을 구축합니다.

## 범위

### 1. 독후감 피드 (메인 페이지)
- [ ] 피드 레이아웃 구현
- [ ] 독후감 카드 컴포넌트
- [ ] 무한 스크롤 구현
- [ ] 비로그인 읽기 전용 모드
- [ ] 플로팅 작성 버튼

### 2. 로그인 페이지
- [ ] 좌측 서비스 소개 섹션
- [ ] 우측 로그인 폼
- [ ] 이메일/비밀번호 검증
- [ ] 로그인 에러 처리
- [ ] "회원가입" 링크

### 3. 회원가입 페이지
- [ ] 회원가입 폼 (이메일, 비밀번호, 닉네임)
- [ ] 실시간 유효성 검증
- [ ] 중복 확인 (이메일, 닉네임)
- [ ] 이메일 인증 메일 발송
- [ ] 약관 동의 체크박스

### 4. 이메일 인증 페이지
- [ ] 인증 토큰 검증
- [ ] 성공/실패 메시지 표시
- [ ] 재발송 기능
- [ ] 자동 리다이렉트

### 5. 기본 레이아웃
- [ ] 헤더 네비게이션
- [ ] 사용자 메뉴 (로그인/프로필)
- [ ] 모바일 반응형 디자인
- [ ] 로딩 상태 표시

## 기술 요구사항

### API Routes

#### 인증 관련
```typescript
// app/api/auth/register/route.ts
POST /api/auth/register
Body: {
  email: string
  password: string
  nickname: string
}
Response: {
  success: boolean
  message: string
  userId?: string
}

// app/api/auth/verify-email/route.ts
POST /api/auth/verify-email
Body: {
  token: string
}
Response: {
  success: boolean
  message: string
}

// app/api/auth/check-duplicate/route.ts
POST /api/auth/check-duplicate
Body: {
  field: 'email' | 'nickname'
  value: string
}
Response: {
  available: boolean
}
```

#### 피드 관련
```typescript
// app/api/reviews/route.ts
GET /api/reviews
Query: {
  page: number
  limit: number
  cursor?: string
}
Response: {
  reviews: BookReview[]
  nextCursor?: string
  hasMore: boolean
}
```

### 컴포넌트 구조

#### 독후감 카드
```typescript
interface ReviewCardProps {
  review: {
    id: string
    title?: string
    content: string
    isRecommended: boolean
    createdAt: Date
    user: {
      id: string
      nickname: string
      image?: string
    }
    book: {
      id: string
      title: string
      authors: string
      thumbnail?: string
      genre?: string
    }
    _count: {
      likes: number
      comments: number
    }
  }
  isPreview?: boolean // 미리보기 모드 (200자)
}
```

#### 레이아웃 컴포넌트
```typescript
interface LayoutProps {
  children: React.ReactNode
}

interface HeaderProps {
  user?: {
    id: string
    nickname: string
    image?: string
  }
}
```

### 상태 관리

#### Auth Store (Zustand)
```typescript
interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}
```

#### 피드 쿼리 (TanStack Query)
```typescript
// 무한 스크롤 쿼리
const useReviewsInfiniteQuery = () => {
  return useInfiniteQuery({
    queryKey: ['reviews'],
    queryFn: ({ pageParam }) => fetchReviews({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  })
}
```

## UI/UX 명세

### 독후감 피드 페이지 (/)
```
┌─────────────────────────────────────┐
│          Header Navigation          │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Review Card #1         │   │
│  │  [Book Thumbnail] Title     │   │
│  │  Author | Genre             │   │
│  │  "독후감 내용 미리보기..."   │   │
│  │  ❤️ 12  💬 5  by @username  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Review Card #2         │   │
│  └─────────────────────────────┘   │
│                                     │
│         [무한 스크롤]               │
│                                     │
│                        [+] 작성     │
└─────────────────────────────────────┘
```

### 로그인 페이지 (/login)
```
┌─────────────────────────────────────┐
│  ReadZone          로그인 | 회원가입│
├─────────────────────────────────────┤
│                                     │
│  ┌────────────┐  ┌────────────┐    │
│  │  서비스    │  │   로그인   │    │
│  │   소개     │  │            │    │
│  │           │  │ 이메일     │    │
│  │ "독서 후  │  │ [_______]  │    │
│  │  생각을   │  │            │    │
│  │  나누는   │  │ 비밀번호   │    │
│  │  공간"    │  │ [_______]  │    │
│  │           │  │            │    │
│  │ • 독후감  │  │ [로그인]   │    │
│  │ • 도서평  │  │            │    │
│  │ • 커뮤니티│  │ 회원가입   │    │
│  └────────────┘  └────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### 회원가입 페이지 (/register)
```
┌─────────────────────────────────────┐
│          회원가입                    │
├─────────────────────────────────────┤
│                                     │
│     이메일 *                        │
│     [_____________________]         │
│     ✓ 사용 가능한 이메일입니다      │
│                                     │
│     비밀번호 *                      │
│     [_____________________]         │
│     • 8자 이상                      │
│     • 영문, 숫자 포함               │
│                                     │
│     비밀번호 확인 *                 │
│     [_____________________]         │
│                                     │
│     닉네임 *                        │
│     [_____________________]         │
│     ✓ 사용 가능한 닉네임입니다      │
│                                     │
│     □ 이용약관 동의 (필수)          │
│     □ 개인정보처리방침 동의 (필수)   │
│                                     │
│     [    가입하기    ]              │
│                                     │
└─────────────────────────────────────┘
```

## 스타일 가이드

### 디자인 토큰
```css
/* colors.css */
:root {
  /* Primary */
  --primary-50: #fef2f2;
  --primary-500: #ef4444;
  --primary-700: #dc2626;
  
  /* Neutral */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
  --gray-900: #111827;
  
  /* Semantic */
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
}

/* spacing.css */
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
}

/* typography.css */
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
}
```

### 반응형 브레이크포인트
```css
/* Mobile First */
/* Default: 0-639px */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

## 테스트 시나리오

### 1. 독후감 피드 테스트
- [ ] 비로그인 상태에서 피드 조회 가능
- [ ] 로그인 상태에서 상호작용 가능
- [ ] 무한 스크롤 동작 확인
- [ ] 플로팅 버튼 표시 (로그인 시)

### 2. 로그인 플로우 테스트
- [ ] 유효한 이메일/비밀번호로 로그인 성공
- [ ] 잘못된 정보로 로그인 시 에러 메시지
- [ ] 로그인 후 피드 페이지로 리다이렉트
- [ ] 세션 유지 확인

### 3. 회원가입 플로우 테스트
- [ ] 이메일 중복 확인 동작
- [ ] 닉네임 중복 확인 동작
- [ ] 비밀번호 유효성 검증
- [ ] 회원가입 완료 후 이메일 발송
- [ ] 이메일 인증 완료 후 로그인 가능

### 4. 반응형 디자인 테스트
- [ ] 모바일 (320px - 768px)
- [ ] 태블릿 (768px - 1024px)
- [ ] 데스크톱 (1024px+)

## 완료 기준

### 필수 완료 사항
1. ✅ **메인 피드**: 독후감 목록 표시 및 무한 스크롤
2. ✅ **인증 플로우**: 로그인/회원가입/이메일 인증 완성
3. ✅ **상태 관리**: 로그인 상태 전역 관리
4. ✅ **반응형**: 모든 디바이스에서 정상 동작
5. ✅ **에러 처리**: 사용자 친화적 에러 메시지

### 검증 방법
1. 회원가입 → 이메일 인증 → 로그인 전체 플로우 성공
2. 피드 페이지에서 10개 이상 독후감 로드
3. 모바일/태블릿/데스크톱 레이아웃 확인
4. 비로그인 상태에서 읽기 가능, 상호작용 제한 확인

## 다음 Phase 연계 사항

Phase 2 완료 후 Phase 3에서 활용할 요소:
- 로그인된 사용자 정보로 독후감 작성자 표시
- 피드 카드 컴포넌트를 도서 상세 페이지에서 재사용
- 인증 미들웨어로 보호된 페이지 구현
- 무한 스크롤 로직을 다른 목록 페이지에 적용

## 위험 요소 및 대응 방안

### 위험 요소
1. **이메일 발송 설정**: SMTP 서버 구성 복잡성
2. **무한 스크롤 성능**: 대량 데이터 로드 시 성능 저하
3. **세션 관리**: NextAuth.js와 Zustand 상태 동기화

### 대응 방안
1. **이메일**: 개발 환경에서는 콘솔 로그로 대체, 프로덕션에서 실제 발송
2. **무한 스크롤**: 가상 스크롤링 도입 검토, 이미지 lazy loading
3. **세션 관리**: useSession 훅으로 중앙화된 상태 관리