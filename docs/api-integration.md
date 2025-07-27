# ReadZone API 통합 가이드

## 카카오 도서 검색 API

### 기본 정보
- **엔드포인트**: `https://dapi.kakao.com/v3/search/book`
- **일일 할당량**: 300,000회 (2024년 기준)
- **캐싱 전략**: 검색 결과 24시간 캐싱

### 카카오 API 인터페이스
```typescript
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
```

### API 클라이언트 구현
```typescript
class KakaoBookAPI {
  private apiKey: string
  private baseURL = 'https://dapi.kakao.com/v3/search/book'
  
  async search(params: {
    query: string
    sort?: 'accuracy' | 'latest'
    page?: number
    size?: number
  }): Promise<KakaoBookResponse> {
    const url = new URL(this.baseURL)
    url.searchParams.append('query', params.query)
    if (params.sort) url.searchParams.append('sort', params.sort)
    if (params.page) url.searchParams.append('page', params.page.toString())
    if (params.size) url.searchParams.append('size', params.size.toString())

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `KakaoAK ${this.apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`카카오 API 오류: ${response.status}`)
    }

    return response.json()
  }
  
  async getBookByISBN(isbn: string): Promise<KakaoBook | null> {
    const response = await this.search({ query: isbn, size: 1 })
    return response.documents[0] || null
  }
}
```

### API 사용량 관리
```typescript
interface ApiUsageTracking {
  date: string
  searchCount: number
  remaining: number
  resetTime: Date
}

class ApiUsageTracker {
  private usage: Map<string, ApiUsageTracking> = new Map()

  trackUsage(date: string) {
    const today = this.usage.get(date) || {
      date,
      searchCount: 0,
      remaining: 300000,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    today.searchCount++
    today.remaining--
    this.usage.set(date, today)
  }

  canMakeRequest(date: string): boolean {
    const today = this.usage.get(date)
    return !today || today.remaining > 0
  }
}
```

### 에러 처리
```typescript
const handleApiError = (error: any) => {
  if (error.status === 429) {
    return '일일 검색 한도에 도달했습니다.'
  }
  if (error.status >= 500) {
    return '도서 검색 서비스에 일시적 문제가 있습니다.'
  }
  return '검색 중 오류가 발생했습니다.'
}
```

## API Routes 설계

### 인증 관련 API

#### 회원가입
```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string
  password: string
  nickname: string
}

interface RegisterResponse {
  success: boolean
  message: string
  userId?: string
}
```

#### 이메일 인증
```typescript
// POST /api/auth/verify-email
interface VerifyEmailRequest {
  token: string
}

interface VerifyEmailResponse {
  success: boolean
  message: string
}
```

#### 중복 확인
```typescript
// POST /api/auth/check-duplicate
interface CheckDuplicateRequest {
  field: 'email' | 'nickname'
  value: string
}

interface CheckDuplicateResponse {
  available: boolean
  message: string
}
```

### 도서 관련 API

#### 도서 검색
```typescript
// GET /api/books/search?q=검색어&page=1&sort=accuracy
interface BookSearchResponse {
  books: Book[]
  totalCount: number
  currentPage: number
  hasMore: boolean
}
```

#### 수동 도서 등록
```typescript
// POST /api/books/manual
interface ManualBookRequest {
  title: string
  authors: string[]
  publisher?: string
  genre?: string
  pageCount?: number
  description?: string
}

interface ManualBookResponse {
  book: Book
  message: string
}
```

#### 도서 상세
```typescript
// GET /api/books/[id]
interface BookDetailResponse {
  book: Book
  reviews: BookReview[]
  opinions: BookOpinion[]
  stats: {
    reviewCount: number
    opinionCount: number
    averageRating: number
    recommendationRate: number
  }
}
```

### 독후감 관련 API

#### 독후감 CRUD
```typescript
// GET /api/reviews - 피드용 독후감 목록
interface ReviewsListResponse {
  reviews: BookReview[]
  hasMore: boolean
  nextCursor?: string
}

// POST /api/reviews - 새 독후감 생성
interface CreateReviewRequest {
  bookId: string
  title?: string
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink?: string
}

// PUT /api/reviews/[id] - 독후감 수정
interface UpdateReviewRequest {
  title?: string
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink?: string
}
```

#### 좋아요 시스템
```typescript
// POST /api/reviews/[id]/like - 좋아요 토글
interface LikeToggleResponse {
  isLiked: boolean
  likeCount: number
}
```

#### 댓글 시스템
```typescript
// GET /api/reviews/[id]/comments - 댓글 목록
interface CommentsResponse {
  comments: Comment[]
  totalCount: number
  hasMore: boolean
}

// POST /api/reviews/[id]/comments - 댓글 작성
interface CreateCommentRequest {
  content: string
  parentId?: string  // 대댓글용
}
```

### 소셜 기능 API

#### 도서 의견
```typescript
// GET /api/books/[id]/opinions - 도서 의견 목록
interface BookOpinionsResponse {
  opinions: BookOpinion[]
  stats: {
    totalCount: number
    recommendCount: number
    notRecommendCount: number
  }
}

// POST /api/books/[id]/opinions - 의견 작성
interface CreateOpinionRequest {
  content: string
  isRecommended: boolean
}
```

#### 프로필 관련
```typescript
// GET /api/users/[id]/profile - 사용자 프로필
interface UserProfileResponse {
  user: {
    id: string
    nickname: string
    bio?: string
    image?: string
    createdAt: string
  }
  stats: {
    reviewCount: number
    opinionCount: number
    likesReceived: number
    booksRead: number
  }
}

// PUT /api/users/[id]/profile - 프로필 수정
interface UpdateProfileRequest {
  nickname?: string
  bio?: string
  image?: string
}

// GET /api/users/[id]/reviews - 사용자 독후감 목록
interface UserReviewsResponse {
  reviews: BookReview[]
  totalCount: number
  hasMore: boolean
}
```

## API 미들웨어

### 인증 미들웨어
```typescript
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: User) => Promise<Response>
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  return handler(req, session.user as User)
}
```

### 레이트 리미팅
```typescript
const rateLimiter = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
) {
  const now = Date.now()
  const userLimit = rateLimiter.get(identifier)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
}
```

### 입력 검증
```typescript
import { z } from 'zod'

const ReviewSchema = z.object({
  bookId: z.string().cuid(),
  title: z.string().optional(),
  content: z.string().min(10).max(50000),
  isRecommended: z.boolean(),
  tags: z.array(z.string()).max(10),
  purchaseLink: z.string().url().optional()
})

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    throw new Error('입력 데이터가 유효하지 않습니다.')
  }
}
```

## 3단계 도서 검색 시스템

### 검색 흐름
1. **서버 DB 검색**: 기존 등록된 도서 우선 검색
2. **카카오 API 검색**: DB에 없으면 외부 API 호출
3. **수동 입력**: API에서도 찾을 수 없으면 사용자 직접 입력

### 통합 검색 API
```typescript
// GET /api/books/search
export async function searchBooks(query: string): Promise<BookSearchResult> {
  // 1단계: DB 검색
  const dbBooks = await prisma.book.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { authors: { contains: query } }
      ]
    },
    take: 10
  })

  if (dbBooks.length > 0) {
    return { books: dbBooks, source: 'database' }
  }

  // 2단계: 카카오 API 검색
  try {
    const kakaoResponse = await kakaoAPI.search({ query, size: 10 })
    const books = await Promise.all(
      kakaoResponse.documents.map(doc => saveBookFromKakao(doc))
    )
    return { books, source: 'kakao' }
  } catch (error) {
    console.error('카카오 API 오류:', error)
    return { books: [], source: 'error' }
  }
}
```

## 캐싱 전략

### Redis 캐싱 (향후 확장)
```typescript
const CACHE_TTL = {
  BOOK_SEARCH: 24 * 60 * 60, // 24시간
  BOOK_DETAIL: 60 * 60,      // 1시간
  USER_PROFILE: 30 * 60      // 30분
}

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.BOOK_SEARCH
): Promise<T> {
  // 캐시 확인
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }

  // 데이터 조회 및 캐싱
  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}
```

## 에러 응답 표준화

```typescript
interface ApiError {
  code: string
  message: string
  details?: any
}

export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): Response {
  const error: ApiError = { code, message, details }
  return new Response(JSON.stringify(error), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// 사용 예시
return createErrorResponse(
  'BOOK_NOT_FOUND',
  '해당 도서를 찾을 수 없습니다.',
  404
)
```

## API 테스팅

### 테스트 케이스 예시
```typescript
describe('Books API', () => {
  test('도서 검색 - 성공', async () => {
    const response = await fetch('/api/books/search?q=해리포터')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.books).toBeInstanceOf(Array)
  })

  test('수동 도서 등록 - 유효하지 않은 데이터', async () => {
    const response = await fetch('/api/books/manual', {
      method: 'POST',
      body: JSON.stringify({ title: '' })
    })
    
    expect(response.status).toBe(400)
  })
})
```