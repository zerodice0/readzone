# Phase 3: Book System (도서 시스템)

## 목표
카카오 도서 API 연동과 수동 도서 입력 기능을 구현하여 사용자가 다양한 도서 정보를 활용할 수 있는 기반을 구축합니다.

## 범위

### 1. 카카오 도서 API 연동
- [ ] 카카오 API 클라이언트 구현
- [ ] API 키 관리 및 보안
- [ ] 검색 API 연동
- [ ] 상세 정보 API 연동
- [ ] API 사용량 추적
- [ ] 캐싱 시스템 구현

### 2. 도서 검색 페이지
- [ ] 검색 인터페이스 구현
- [ ] 실시간 검색 결과 표시
- [ ] 검색 결과 필터링
- [ ] 검색 기록 저장
- [ ] 빈 검색 결과 처리

### 3. 수동 도서 입력 기능
- [ ] 도서 정보 입력 폼
- [ ] 필수/선택 필드 검증
- [ ] 장르 선택 UI
- [ ] 이미지 업로드 (선택)
- [ ] 입력 데이터 검증

### 4. 도서 상세 페이지
- [ ] 도서 정보 표시
- [ ] 관련 독후감 목록
- [ ] 도서 의견 섹션
- [ ] 구매 링크 표시
- [ ] 공유 기능

### 5. 도서 관리 시스템
- [ ] 도서 데이터 저장/업데이트
- [ ] 중복 도서 처리
- [ ] 도서 메타데이터 관리
- [ ] 인기 도서 트래킹

## 기술 요구사항

### 카카오 도서 API

#### API 클라이언트
```typescript
// lib/kakao.ts
interface KakaoBookSearchParams {
  query: string
  sort?: 'accuracy' | 'latest'
  page?: number
  size?: number
}

interface KakaoBookResponse {
  documents: KakaoBook[]
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
  }
}

interface KakaoBook {
  title: string
  contents: string
  url: string
  isbn: string
  datetime: string
  authors: string[]
  publisher: string
  translators: string[]
  price: number
  sale_price: number
  thumbnail: string
  status: string
}

class KakaoBookAPI {
  private apiKey: string
  private baseURL = 'https://dapi.kakao.com/v3/search/book'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async search(params: KakaoBookSearchParams): Promise<KakaoBookResponse> {
    // API 호출 구현
  }
  
  async getBookByISBN(isbn: string): Promise<KakaoBook | null> {
    // ISBN 기반 검색
  }
}
```

#### API 사용량 관리
```typescript
interface ApiUsage {
  id: string
  date: string
  searchCount: number
  remaining: number
  resetTime: Date
}

class ApiUsageTracker {
  private usage: Map<string, ApiUsage> = new Map()
  
  track(date: string): void
  canMakeRequest(): boolean
  getRemainingQuota(): number
}
```

### API Routes

#### 도서 검색
```typescript
// app/api/books/search/route.ts
GET /api/books/search
Query: {
  q: string
  page?: number
  size?: number
  sort?: 'accuracy' | 'latest'
}
Response: {
  books: Book[]
  pagination: {
    page: number
    size: number
    total: number
    hasMore: boolean
  }
}

// app/api/books/manual/route.ts
POST /api/books/manual
Body: {
  title: string
  authors: string[]
  publisher?: string
  genre?: string
  pageCount?: number
  description?: string
}
Response: {
  success: boolean
  book: Book
}
```

#### 도서 관리
```typescript
// app/api/books/[id]/route.ts
GET /api/books/[id]
Response: {
  book: Book
  reviews: BookReview[]
  opinions: BookOpinion[]
  stats: {
    totalReviews: number
    totalOpinions: number
    averageRating: number
    recommendationRate: number
  }
}
```

### 데이터 모델 확장

```typescript
// types/book.ts
interface Book {
  id: string
  isbn?: string
  title: string
  authors: string[]
  publisher?: string
  genre?: string
  pageCount?: number
  thumbnail?: string
  description?: string
  price?: number
  salePrice?: number
  isManualEntry: boolean
  createdAt: Date
  updatedAt: Date
  
  // 관계
  reviews: BookReview[]
  opinions: BookOpinion[]
}

interface BookSearchResult extends Book {
  _count: {
    reviews: number
    opinions: number
  }
  stats: {
    recommendationRate: number
  }
}
```

### 캐싱 전략

```typescript
// lib/cache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class BookCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly TTL = 24 * 60 * 60 * 1000 // 24시간
  
  set<T>(key: string, data: T): void
  get<T>(key: string): T | null
  invalidate(key: string): void
  cleanup(): void
}
```

## UI/UX 명세

### 도서 검색 페이지 (/search)
```
┌─────────────────────────────────────┐
│          도서 검색                   │
├─────────────────────────────────────┤
│                                     │
│  [🔍 도서 제목이나 저자를 입력하세요] │
│                                     │
│  ┌─ 검색 결과 ─────────────────────┐  │
│  │                               │  │
│  │  [📖] 책 제목                 │  │
│  │       저자명 | 출판사         │  │
│  │       ₩15,000 (₩13,500)      │  │
│  │       [선택]                  │  │
│  │                               │  │
│  │  [📖] 책 제목 2               │  │
│  │       저자명 | 출판사         │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  찾는 책이 없나요?                   │
│  [➕ 직접 입력하기]                  │
│                                     │
└─────────────────────────────────────┘
```

### 수동 도서 입력 페이지 (/books/manual)
```
┌─────────────────────────────────────┐
│          도서 정보 입력              │
├─────────────────────────────────────┤
│                                     │
│  도서 제목 *                        │
│  [_____________________]            │
│                                     │
│  저자 * (쉼표로 구분)               │
│  [_____________________]            │
│                                     │
│  출판사                             │
│  [_____________________]            │
│                                     │
│  장르                               │
│  [▼ 선택하세요         ]            │
│                                     │
│  페이지 수                          │
│  [_____] 페이지                     │
│                                     │
│  간단한 소개                        │
│  [________________________]        │
│  [________________________]        │
│  [________________________]        │
│                                     │
│  표지 이미지 (선택)                 │
│  [📎 파일 선택] 또는 URL            │
│  [_____________________]            │
│                                     │
│  [    취소    ] [    저장    ]      │
│                                     │
└─────────────────────────────────────┘
```

### 도서 상세 페이지 (/books/[id])
```
┌─────────────────────────────────────┐
│                                     │
│  ┌────┐  책 제목                    │
│  │ 📖 │  저자명                     │
│  │표지│  출판사 | 장르             │
│  │이미│  ⭐ 4.2 (리뷰 15개)        │
│  │지  │                            │
│  └────┘  [💝 추천 85%]              │
│                                     │
│  📝 소개                            │
│  책에 대한 간단한 소개...            │
│                                     │
│  🛒 구매하기                        │
│  [교보문고] [예스24] [알라딘]        │
│                                     │
│  ─────────────────────────────────   │
│                                     │
│  💬 이 책에 대한 의견 (28개)        │
│                                     │
│  [의견을 남겨보세요...     ] [👍👎] │
│                                     │
│  @username • 2일 전                 │
│  "정말 감동적인 책이었어요..."       │
│  👍 추천 • ❤️ 3                     │
│                                     │
│  @username2 • 1주 전                │
│  "조금 아쉬웠지만 나름 괜찮..."      │
│  👎 비추천 • ❤️ 1                   │
│                                     │
└─────────────────────────────────────┘
```

## 장르 분류 시스템

### KDC(한국십진분류법) 기반 장르
```typescript
enum BookGenre {
  // 주요 분류
  PHILOSOPHY = '철학',
  RELIGION = '종교',
  SOCIAL_SCIENCE = '사회과학',
  NATURAL_SCIENCE = '자연과학',
  TECHNOLOGY = '기술과학',
  ARTS = '예술',
  LANGUAGE = '언어',
  LITERATURE = '문학',
  HISTORY = '역사',
  
  // 세부 문학 장르
  NOVEL = '소설',
  POETRY = '시',
  ESSAY = '에세이',
  DRAMA = '희곡',
  
  // 실용서
  SELF_HELP = '자기계발',
  BUSINESS = '경영/경제',
  HEALTH = '건강',
  COOKING = '요리',
  TRAVEL = '여행',
  HOBBY = '취미',
  
  // 기타
  CHILDREN = '아동',
  COMICS = '만화',
  OTHER = '기타'
}
```

### 장르 매핑 로직
```typescript
function mapISBNToGenre(isbn: string): BookGenre {
  // ISBN 분류 코드 기반 장르 매핑
  const classificationCode = isbn.substring(3, 6)
  // 분류 코드에 따른 장르 반환
}

function extractGenreFromKakao(kakaoBook: KakaoBook): BookGenre {
  // 카카오 API 응답에서 장르 추출 및 매핑
}
```

## 테스트 시나리오

### 1. 카카오 API 연동 테스트
- [ ] 도서 검색 API 호출 성공
- [ ] ISBN 기반 상세 정보 조회
- [ ] API 오류 처리 (네트워크, 할당량 초과)
- [ ] 검색 결과 캐싱 동작 확인

### 2. 도서 검색 기능 테스트
- [ ] 제목으로 검색
- [ ] 저자명으로 검색
- [ ] 검색 결과 페이지네이션
- [ ] 빈 검색 결과 처리
- [ ] 검색 기록 저장/표시

### 3. 수동 입력 기능 테스트
- [ ] 필수 필드 유효성 검증
- [ ] 중복 도서 확인
- [ ] 이미지 업로드 처리
- [ ] 장르 선택 기능

### 4. 도서 상세 페이지 테스트
- [ ] 도서 정보 표시
- [ ] 관련 독후감 목록
- [ ] 도서 의견 작성/표시
- [ ] 구매 링크 클릭 추적

## 완료 기준

### 필수 완료 사항
1. ✅ **API 연동**: 카카오 도서 검색 API 완전 연동
2. ✅ **검색 기능**: 실시간 검색 및 결과 표시
3. ✅ **수동 입력**: 검색되지 않는 도서 직접 등록
4. ✅ **상세 페이지**: 도서 정보 및 관련 콘텐츠 표시
5. ✅ **캐싱**: 검색 결과 24시간 캐싱

### 검증 방법
1. 인기 도서 10권 검색 후 모든 정보 정상 표시
2. 검색되지 않는 도서 수동 입력 완료
3. 도서 상세 페이지에서 모든 섹션 정상 동작
4. API 사용량 추적 및 캐싱 확인

## 다음 Phase 연계 사항

Phase 3 완료 후 Phase 4에서 활용할 요소:
- 도서 검색 결과를 독후감 작성에 연동
- 도서 상세 페이지를 독후감 상세에서 참조
- 수동 입력된 도서 정보 활용
- 장르 분류를 독후감 필터링에 활용

## 위험 요소 및 대응 방안

### 위험 요소
1. **API 할당량**: 카카오 API 일일 사용량 제한
2. **검색 성능**: 대량 검색 결과 처리 시 지연
3. **데이터 품질**: 수동 입력 데이터의 일관성

### 대응 방안
1. **API 할당량**: 캐싱 강화, 사용량 모니터링, 대체 API 검토
2. **검색 성능**: 페이지네이션, 디바운싱, 로딩 상태 표시
3. **데이터 품질**: 입력 검증 강화, 관리자 검토 시스템