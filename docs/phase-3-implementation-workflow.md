# Phase 3: Book System Implementation Workflow

## 워크플로우 개요

**목표**: 카카오 도서 API 연동과 수동 도서 입력 기능을 구현하여 완전한 도서 관리 시스템 구축  
**전략**: Systematic (체계적 접근) - 외부 API 연동의 복잡성과 데이터 무결성 보장  
**예상 기간**: 7주 (총 280시간)  
**주요 위험도**: 중간 (외부 API 의존성, 데이터 품질 관리)

## Phase 1: Foundation & API Integration (주 1-2)

### 목표
외부 API 연동 기반 구축 및 핵심 데이터 모델 설계

### Week 1: 카카오 API 연동 및 기본 인프라

#### 1.1 카카오 API 클라이언트 구현 (16시간)
**담당자**: Backend Developer  
**MCP**: Context7 (카카오 API 문서 패턴)

**구현 단계**:
1. **환경변수 및 보안 설정** (2시간)
   ```typescript
   // .env.local
   KAKAO_API_KEY=your_api_key_here
   KAKAO_API_BASE_URL=https://dapi.kakao.com/v3/search/book
   ```

2. **API 클라이언트 기본 구조** (4시간)
   ```typescript
   // lib/kakao.ts
   class KakaoBookAPI {
     private apiKey: string
     private baseURL: string
     private rateLimiter: RateLimiter
     
     async search(params: KakaoBookSearchParams): Promise<KakaoBookResponse>
     async getBookByISBN(isbn: string): Promise<KakaoBook | null>
     private handleApiError(error: any): never
   }
   ```

3. **에러 처리 및 재시도 로직** (4시간)
   - 네트워크 오류, 할당량 초과, 타임아웃 처리
   - 지수 백오프 재시도 메커니즘
   - 사용자 친화적 에러 메시지

4. **API 사용량 추적 시스템** (6시간)
   ```typescript
   // lib/api-usage-tracker.ts
   class ApiUsageTracker {
     private redis: Redis // 또는 메모리 기반
     
     async track(apiKey: string): Promise<void>
     async canMakeRequest(apiKey: string): Promise<boolean>
     async getRemainingQuota(apiKey: string): Promise<number>
   }
   ```

**완료 기준**:
- [ ] 카카오 API 검색 성공적으로 호출
- [ ] 에러 처리 로직 모든 시나리오 커버
- [ ] API 사용량 추적 정상 동작
- [ ] 단위 테스트 커버리지 90% 이상

#### 1.2 도서 데이터 모델 설계 (12시간)
**담당자**: Backend Developer + Database Specialist  
**MCP**: Sequential (복잡한 데이터 관계 분석)

**구현 단계**:
1. **Prisma 스키마 확장** (4시간)
   ```prisma
   model Book {
     id           String   @id @default(cuid())
     isbn         String?  @unique
     title        String
     authors      String[]
     publisher    String?
     genre        String?
     pageCount    Int?
     thumbnail    String?
     description  String?
     price        Int?
     salePrice    Int?
     isManualEntry Boolean @default(false)
     sourceUrl    String? // 카카오 API URL
     createdAt    DateTime @default(now())
     updatedAt    DateTime @updatedAt
     
     // 관계
     reviews      BookReview[]
     opinions     BookOpinion[]
     
     @@map("books")
   }
   
   model BookCache {
     id        String   @id @default(cuid())
     cacheKey  String   @unique
     data      Json
     expiresAt DateTime
     createdAt DateTime @default(now())
     
     @@map("book_cache")
   }
   ```

2. **TypeScript 타입 정의** (4시간)
   ```typescript
   // types/book.ts
   interface Book {
     id: string
     isbn?: string
     title: string
     authors: string[]
     publisher?: string
     genre?: BookGenre
     pageCount?: number
     thumbnail?: string
     description?: string
     price?: number
     salePrice?: number
     isManualEntry: boolean
     sourceUrl?: string
     createdAt: Date
     updatedAt: Date
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

3. **데이터 검증 스키마** (4시간)
   ```typescript
   // lib/validations/book.ts
   export const bookSchema = z.object({
     title: z.string().min(1).max(200),
     authors: z.array(z.string().min(1)).min(1),
     publisher: z.string().optional(),
     genre: z.nativeEnum(BookGenre).optional(),
     pageCount: z.number().positive().optional(),
     description: z.string().max(1000).optional(),
     thumbnail: z.string().url().optional()
   })
   ```

**완료 기준**:
- [ ] 데이터베이스 마이그레이션 성공
- [ ] 타입 정의 완전성 확인
- [ ] 데이터 검증 모든 케이스 테스트
- [ ] 성능 테스트 (인덱스 최적화)

### Week 2: 캐싱 시스템 및 기본 API 엔드포인트

#### 2.1 도서 캐싱 시스템 구현 (16시간)
**담당자**: Backend Developer  
**MCP**: Context7 (캐싱 패턴 및 최적화)

**구현 단계**:
1. **인메모리 캐시 구현** (6시간)
   ```typescript
   // lib/cache/book-cache.ts
   class BookCache {
     private cache = new Map<string, CacheEntry<any>>()
     private readonly TTL = 24 * 60 * 60 * 1000 // 24시간
     
     set<T>(key: string, data: T): void
     get<T>(key: string): T | null
     invalidate(key: string): void
     cleanup(): void
     getStats(): CacheStats
   }
   ```

2. **캐시 무효화 전략** (4시간)
   - TTL 기반 자동 만료
   - 수동 도서 등록 시 관련 캐시 무효화
   - 메모리 사용량 기반 LRU 제거

3. **캐시 성능 모니터링** (6시간)
   ```typescript
   interface CacheStats {
     hitRate: number
     missRate: number
     memoryUsage: number
     itemCount: number
     avgResponseTime: number
   }
   ```

**완료 기준**:
- [ ] 캐시 히트율 85% 이상
- [ ] 메모리 사용량 최적화
- [ ] 캐시 통계 정확성 확인

#### 2.2 도서 검색 API 엔드포인트 (12시간)
**담당자**: Backend Developer  
**MCP**: Context7 (REST API 패턴)

**구현 단계**:
1. **검색 API 구현** (8시간)
   ```typescript
   // app/api/books/search/route.ts
   export async function GET(request: NextRequest) {
     const { searchParams } = new URL(request.url)
     const query = searchParams.get('q')
     const page = parseInt(searchParams.get('page') || '1')
     const size = parseInt(searchParams.get('size') || '10')
     
     // 캐시 확인
     const cacheKey = `search:${query}:${page}:${size}`
     const cached = await bookCache.get(cacheKey)
     if (cached) return NextResponse.json(cached)
     
     // 카카오 API 호출
     const results = await kakaoAPI.search({ query, page, size })
     
     // 캐시 저장
     await bookCache.set(cacheKey, results)
     
     return NextResponse.json(results)
   }
   ```

2. **에러 처리 및 로깅** (4시간)
   - API 할당량 초과 처리
   - 검색 결과 없음 처리
   - 상세 로깅 및 모니터링

**완료 기준**:
- [ ] 모든 검색 케이스 정상 동작
- [ ] 에러 핸들링 완전성
- [ ] API 응답 시간 <500ms

## Phase 2: Core Implementation (주 3-4)

### 목표
도서 검색 및 수동 입력 핵심 기능 완성

### Week 3: 수동 도서 입력 시스템

#### 3.1 수동 도서 입력 API (16시간)
**담당자**: Backend Developer  
**MCP**: Sequential (복잡한 검증 로직)

**구현 단계**:
1. **입력 검증 로직** (6시간)
   ```typescript
   // app/api/books/manual/route.ts
   export async function POST(request: NextRequest) {
     const body = await request.json()
     const validatedData = bookSchema.parse(body)
     
     // 중복 도서 확인
     const duplicate = await checkDuplicateBook(validatedData)
     if (duplicate) {
       return NextResponse.json({ error: 'Book already exists' }, { status: 409 })
     }
     
     // 도서 생성
     const book = await prisma.book.create({
       data: { ...validatedData, isManualEntry: true }
     })
     
     return NextResponse.json({ success: true, book })
   }
   ```

2. **중복 도서 감지** (6시간)
   - 제목+저자 조합 기반 유사도 계산
   - ISBN 중복 확인
   - 퍼지 매칭 알고리즘

3. **이미지 업로드 처리** (4시간)
   - Next.js Image 최적화
   - CDN 연동 준비
   - 이미지 검증 및 리사이징

**완료 기준**:
- [ ] 모든 검증 케이스 통과
- [ ] 중복 감지 정확도 95%
- [ ] 이미지 업로드 성공률 99%

#### 3.2 장르 분류 시스템 (12시간)
**담당자**: Backend Developer  
**MCP**: Context7 (분류 체계 패턴)

**구현 단계**:
1. **장르 열거형 정의** (2시간)
   ```typescript
   enum BookGenre {
     PHILOSOPHY = '철학',
     LITERATURE = '문학',
     NOVEL = '소설',
     SELF_HELP = '자기계발',
     // ... 추가 장르
   }
   ```

2. **카카오 API 장르 매핑** (6시간)
   - 카카오 분류 → 내부 장르 매핑 테이블
   - 키워드 기반 장르 추론
   - 기본값 및 예외 처리

3. **장르 통계 및 분석** (4시간)
   - 장르별 도서 수 집계
   - 인기 장르 트렌드 분석
   - 장르별 추천 시스템 기반 준비

**완료 기준**:
- [ ] 장르 매핑 정확도 90%
- [ ] 통계 계산 성능 최적화
- [ ] 장르 관리 UI 연동 준비

### Week 4: 도서 상세 정보 시스템

#### 4.1 도서 상세 API 구현 (16시간)
**담당자**: Backend Developer  
**MCP**: Sequential (복잡한 데이터 조합)

**구현 단계**:
1. **상세 정보 API** (8시간)
   ```typescript
   // app/api/books/[id]/route.ts
   export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
     const book = await prisma.book.findUnique({
       where: { id: params.id },
       include: {
         reviews: {
           take: 5,
           orderBy: { createdAt: 'desc' },
           include: { user: { select: { nickname: true } } }
         },
         opinions: {
           take: 10,
           orderBy: { createdAt: 'desc' },
           include: { user: { select: { nickname: true } } }
         },
         _count: {
           select: { reviews: true, opinions: true }
         }
       }
     })
     
     const stats = await calculateBookStats(params.id)
     
     return NextResponse.json({ book, stats })
   }
   ```

2. **도서 통계 계산** (4시간)
   ```typescript
   async function calculateBookStats(bookId: string) {
     const [reviewStats, opinionStats] = await Promise.all([
       prisma.bookReview.groupBy({
         by: ['isRecommended'],
         where: { bookId },
         _count: true
       }),
       prisma.bookOpinion.groupBy({
         by: ['isRecommended'],
         where: { bookId },
         _count: true
       })
     ])
     
     return {
       totalReviews: reviewStats.reduce((sum, stat) => sum + stat._count, 0),
       totalOpinions: opinionStats.reduce((sum, stat) => sum + stat._count, 0),
       recommendationRate: calculateRecommendationRate(reviewStats, opinionStats)
     }
   }
   ```

3. **관련 콘텐츠 추천** (4시간)
   - 같은 저자 도서 추천
   - 같은 장르 인기 도서
   - 유사한 독후감을 가진 도서

**완료 기준**:
- [ ] 상세 정보 완전성 100%
- [ ] 통계 계산 정확성 확인
- [ ] 추천 시스템 기본 동작

#### 4.2 구매 링크 관리 시스템 (12시간)
**담당자**: Backend Developer  
**MCP**: Context7 (링크 관리 패턴)

**구현 단계**:
1. **구매 링크 데이터 모델** (4시간)
   ```typescript
   model PurchaseLink {
     id       String @id @default(cuid())
     bookId   String
     provider String // 교보문고, 예스24, 알라딘
     url      String
     price    Int?
     isActive Boolean @default(true)
     clicks   Int     @default(0)
     
     book     Book    @relation(fields: [bookId], references: [id])
     
     @@map("purchase_links")
   }
   ```

2. **링크 클릭 추적** (4시간)
   ```typescript
   // app/api/books/[id]/purchase/[provider]/route.ts
   export async function GET(request: NextRequest, { params }) {
     await prisma.purchaseLink.update({
       where: { 
         bookId: params.id,
         provider: params.provider
       },
       data: { clicks: { increment: 1 } }
     })
     
     const link = await prisma.purchaseLink.findFirst({
       where: { bookId: params.id, provider: params.provider }
     })
     
     return NextResponse.redirect(link.url)
   }
   ```

3. **자동 링크 생성** (4시간)
   - ISBN 기반 구매 링크 자동 생성
   - 링크 유효성 검증
   - 가격 정보 업데이트

**완료 기준**:
- [ ] 모든 주요 서점 링크 지원
- [ ] 클릭 추적 정확성 100%
- [ ] 링크 유효성 95% 이상

## Phase 3: UI/UX Implementation (주 5-6)

### 목표
사용자 친화적인 도서 시스템 인터페이스 완성

### Week 5: 도서 검색 인터페이스

#### 5.1 도서 검색 페이지 구현 (20시간)
**담당자**: Frontend Developer  
**MCP**: Magic (검색 UI 컴포넌트)

**구현 단계**:
1. **검색 입력 컴포넌트** (6시간)
   ```typescript
   // components/book/book-search-input.tsx
   export function BookSearchInput({ onSearch, isLoading }: BookSearchInputProps) {
     const [query, setQuery] = useState('')
     const debouncedQuery = useDebounce(query, 300)
     
     useEffect(() => {
       if (debouncedQuery.length >= 2) {
         onSearch(debouncedQuery)
       }
     }, [debouncedQuery, onSearch])
     
     return (
       <div className="relative">
         <Input
           placeholder="도서 제목이나 저자를 입력하세요"
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           className="pr-12"
         />
         {isLoading && <Spinner className="absolute right-3 top-3" />}
       </div>
     )
   }
   ```

2. **검색 결과 표시** (8시간)
   ```typescript
   // components/book/book-search-results.tsx
   export function BookSearchResults({ results, onSelect }: BookSearchResultsProps) {
     return (
       <div className="space-y-4">
         {results.map((book) => (
           <BookSearchCard
             key={book.id}
             book={book}
             onSelect={() => onSelect(book)}
           />
         ))}
       </div>
     )
   }
   ```

3. **무한 스크롤 구현** (6시간)
   ```typescript
   // hooks/use-book-search.ts
   export function useBookSearch() {
     const {
       data,
       fetchNextPage,
       hasNextPage,
       isFetchingNextPage,
       isLoading
     } = useInfiniteQuery({
       queryKey: ['book-search', query],
       queryFn: ({ pageParam = 1 }) => searchBooks(query, pageParam),
       getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined
     })
     
     return {
       books: data?.pages.flatMap(page => page.books) ?? [],
       loadMore: fetchNextPage,
       hasMore: hasNextPage,
       isLoading: isLoading || isFetchingNextPage
     }
   }
   ```

**완료 기준**:
- [ ] 실시간 검색 응답 속도 <300ms
- [ ] 무한 스크롤 매끄러운 동작
- [ ] 모바일 반응형 완벽 지원

#### 5.2 검색 필터 및 정렬 기능 (12시간)
**담당자**: Frontend Developer  
**MCP**: Magic (필터 UI 컴포넌트)

**구현 단계**:
1. **고급 필터 UI** (6시간)
   ```typescript
   // components/book/book-search-filters.tsx
   export function BookSearchFilters({ filters, onFiltersChange }: FiltersProps) {
     return (
       <div className="flex flex-wrap gap-4">
         <Select
           value={filters.genre}
           onValueChange={(genre) => onFiltersChange({ ...filters, genre })}
         >
           <SelectTrigger className="w-40">
             <SelectValue placeholder="장르 선택" />
           </SelectTrigger>
           <SelectContent>
             {Object.entries(BookGenre).map(([key, value]) => (
               <SelectItem key={key} value={key}>{value}</SelectItem>
             ))}
           </SelectContent>
         </Select>
         
         <DateRangePicker
           value={filters.dateRange}
           onChange={(dateRange) => onFiltersChange({ ...filters, dateRange })}
         />
       </div>
     )
   }
   ```

2. **정렬 옵션** (3시간)
   - 정확도순, 최신순, 인기순
   - 가격순 (구매 링크 있는 경우)
   - 추천율순

3. **필터 상태 관리** (3시간)
   - URL 쿼리 파라미터 동기화
   - 필터 초기화 기능
   - 필터 히스토리 관리

**완료 기준**:
- [ ] 모든 필터 조합 정상 동작
- [ ] URL 상태 동기화 완벽
- [ ] 필터 성능 최적화

### Week 6: 도서 상세 및 수동 입력

#### 6.1 도서 상세 페이지 구현 (16시간)
**담당자**: Frontend Developer  
**MCP**: Magic (상세 페이지 레이아웃)

**구현 단계**:
1. **도서 정보 표시 컴포넌트** (6시간)
   ```typescript
   // components/book/book-detail-info.tsx
   export function BookDetailInfo({ book }: BookDetailInfoProps) {
     return (
       <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-shrink-0">
           <Image
             src={book.thumbnail || '/images/book-placeholder.png'}
             alt={book.title}
             width={200}
             height={280}
             className="rounded-lg shadow-md"
           />
         </div>
         
         <div className="flex-1">
           <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
           <p className="text-gray-600 mb-2">{book.authors.join(', ')}</p>
           <p className="text-gray-500 mb-4">{book.publisher} | {book.genre}</p>
           
           <div className="flex items-center gap-4 mb-4">
             <div className="flex items-center">
               <Star className="w-5 h-5 text-yellow-400 fill-current" />
               <span className="ml-1 font-medium">{book.stats.averageRating}</span>
               <span className="ml-1 text-gray-500">
                 (리뷰 {book.stats.totalReviews}개)
               </span>
             </div>
             
             <div className="flex items-center">
               <ThumbsUp className="w-5 h-5 text-green-500" />
               <span className="ml-1">추천 {book.stats.recommendationRate}%</span>
             </div>
           </div>
           
           {book.description && (
             <p className="text-gray-700 leading-relaxed">{book.description}</p>
           )}
         </div>
       </div>
     )
   }
   ```

2. **구매 링크 섹션** (4시간)
   ```typescript
   // components/book/purchase-links.tsx
   export function PurchaseLinks({ links }: PurchaseLinksProps) {
     const trackClick = async (provider: string) => {
       await fetch(`/api/books/${book.id}/purchase/${provider}`)
     }
     
     return (
       <div className="bg-gray-50 p-4 rounded-lg">
         <h3 className="font-semibold mb-3">구매하기</h3>
         <div className="flex flex-wrap gap-2">
           {links.map((link) => (
             <Button
               key={link.provider}
               variant="outline"
               onClick={() => trackClick(link.provider)}
               asChild
             >
               <a href={`/api/books/${book.id}/purchase/${link.provider}`} target="_blank">
                 {link.provider}
                 {link.price && <span className="ml-2">₩{link.price.toLocaleString()}</span>}
               </a>
             </Button>
           ))}
         </div>
       </div>
     )
   }
   ```

3. **도서 의견 섹션** (6시간)
   - 의견 목록 표시 (무한 스크롤)
   - 새 의견 작성 폼
   - 추천/비추천 투표 시스템

**완료 기준**:
- [ ] 모든 도서 정보 완전 표시
- [ ] 구매 링크 클릭 추적 동작
- [ ] 의견 시스템 완전 기능

#### 6.2 수동 도서 입력 폼 (12시간)
**담당자**: Frontend Developer  
**MCP**: Magic (복잡한 폼 컴포넌트)

**구현 단계**:
1. **기본 정보 입력 폼** (6시간)
   ```typescript
   // components/book/manual-book-form.tsx
   export function ManualBookForm({ onSubmit }: ManualBookFormProps) {
     const form = useForm<ManualBookInput>({
       resolver: zodResolver(manualBookSchema),
       defaultValues: {
         title: '',
         authors: [''],
         publisher: '',
         genre: undefined,
         pageCount: undefined,
         description: ''
       }
     })
     
     return (
       <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
           <FormField
             control={form.control}
             name="title"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>도서 제목 *</FormLabel>
                 <FormControl>
                   <Input placeholder="도서 제목을 입력하세요" {...field} />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
           
           <AuthorInput
             authors={form.watch('authors')}
             onChange={(authors) => form.setValue('authors', authors)}
           />
           
           {/* 기타 필드들... */}
           
           <Button type="submit" className="w-full">
             도서 등록
           </Button>
         </form>
       </Form>
     )
   }
   ```

2. **동적 저자 입력** (3시간)
   ```typescript
   // components/book/author-input.tsx
   export function AuthorInput({ authors, onChange }: AuthorInputProps) {
     const addAuthor = () => {
       onChange([...authors, ''])
     }
     
     const removeAuthor = (index: number) => {
       onChange(authors.filter((_, i) => i !== index))
     }
     
     return (
       <div className="space-y-2">
         <Label>저자 *</Label>
         {authors.map((author, index) => (
           <div key={index} className="flex gap-2">
             <Input
               value={author}
               onChange={(e) => {
                 const newAuthors = [...authors]
                 newAuthors[index] = e.target.value
                 onChange(newAuthors)
               }}
               placeholder={`저자 ${index + 1}`}
             />
             {authors.length > 1 && (
               <Button
                 type="button"
                 variant="outline"
                 size="icon"
                 onClick={() => removeAuthor(index)}
               >
                 <X className="w-4 h-4" />
               </Button>
             )}
           </div>
         ))}
         <Button type="button" variant="outline" onClick={addAuthor}>
           저자 추가
         </Button>
       </div>
     )
   }
   ```

3. **이미지 업로드** (3시간)
   - 드래그 앤 드롭 인터페이스
   - 이미지 미리보기
   - URL 입력 옵션

**완료 기준**:
- [ ] 모든 검증 규칙 UI 반영
- [ ] 사용자 친화적 입력 경험
- [ ] 에러 처리 완전성

## Phase 4: Integration & Optimization (주 7)

### 목표
시스템 통합, 성능 최적화, 프로덕션 준비

### Week 7: 통합 테스트 및 최적화

#### 7.1 통합 테스트 구현 (16시간)
**담당자**: QA Engineer + Backend Developer  
**MCP**: Sequential (복잡한 테스트 시나리오)

**구현 단계**:
1. **API 통합 테스트** (8시간)
   ```typescript
   // __tests__/integration/book-system.test.ts
   describe('Book System Integration', () => {
     it('should search books and cache results', async () => {
       // 첫 번째 검색 - API 호출
       const response1 = await request(app)
         .get('/api/books/search?q=해리포터')
         .expect(200)
       
       // 두 번째 검색 - 캐시 히트
       const response2 = await request(app)
         .get('/api/books/search?q=해리포터')
         .expect(200)
       
       expect(response1.body).toEqual(response2.body)
       expect(cacheHitCount).toBe(1)
     })
     
     it('should handle manual book creation workflow', async () => {
       const bookData = {
         title: '테스트 도서',
         authors: ['테스트 저자'],
         publisher: '테스트 출판사'
       }
       
       const response = await request(app)
         .post('/api/books/manual')
         .send(bookData)
         .expect(201)
       
       const createdBook = response.body.book
       expect(createdBook.isManualEntry).toBe(true)
     })
   })
   ```

2. **E2E 테스트** (8시간)
   ```typescript
   // e2e/book-search.spec.ts
   test('complete book search workflow', async ({ page }) => {
     await page.goto('/search')
     
     // 검색 입력
     await page.fill('[data-testid=search-input]', '어린왕자')
     await page.waitForSelector('[data-testid=search-results]')
     
     // 첫 번째 결과 클릭
     await page.click('[data-testid=book-card]:first-child')
     await page.waitForURL(/\/books\/.+/)
     
     // 도서 상세 정보 확인
     await expect(page.locator('[data-testid=book-title]')).toBeVisible()
     await expect(page.locator('[data-testid=book-authors]')).toBeVisible()
     
     // 구매 링크 클릭 (새 탭에서 열림)
     const [newPage] = await Promise.all([
       page.waitForEvent('popup'),
       page.click('[data-testid=purchase-link]:first-child')
     ])
     
     expect(newPage.url()).toContain('kyobobook.co.kr')
   })
   ```

**완료 기준**:
- [ ] 모든 주요 워크플로우 테스트 통과
- [ ] 에러 시나리오 100% 커버
- [ ] 성능 테스트 기준치 달성

#### 7.2 성능 최적화 (12시간)
**담당자**: Frontend + Backend Developer  
**MCP**: Sequential (성능 분석)

**구현 단계**:
1. **프론트엔드 최적화** (6시간)
   ```typescript
   // 이미지 최적화
   const BookCover = memo(({ src, alt, ...props }: BookCoverProps) => {
     return (
       <Image
         src={src}
         alt={alt}
         placeholder="blur"
         blurDataURL="data:image/jpeg;base64,..."
         sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
         {...props}
       />
     )
   })
   
   // 검색 결과 가상화
   const VirtualizedSearchResults = ({ items }: VirtualizedSearchResultsProps) => {
     return (
       <VariableSizeList
         height={600}
         itemCount={items.length}
         itemSize={(index) => getItemSize(items[index])}
         itemData={items}
       >
         {({ index, style, data }) => (
           <div style={style}>
             <BookCard book={data[index]} />
           </div>
         )}
       </VariableSizeList>
     )
   }
   ```

2. **백엔드 최적화** (6시간)
   ```typescript
   // 데이터베이스 쿼리 최적화
   const getBookWithDetails = async (id: string) => {
     return prisma.book.findUnique({
       where: { id },
       include: {
         reviews: {
           take: 5,
           orderBy: { createdAt: 'desc' },
           select: {
             id: true,
             title: true,
             createdAt: true,
             user: { select: { nickname: true } }
           }
         },
         _count: {
           select: { reviews: true, opinions: true }
         }
       }
     })
   }
   
   // 배치 처리 최적화
   const batchUpdatePurchaseLinks = async (books: Book[]) => {
     const updates = books.map(book => 
       prisma.purchaseLink.updateMany({
         where: { bookId: book.id },
         data: { lastChecked: new Date() }
       })
     )
     
     await prisma.$transaction(updates)
   }
   ```

**완료 기준**:
- [ ] 페이지 로드 시간 <2초
- [ ] 검색 응답 시간 <500ms
- [ ] Lighthouse 스코어 90+ 달성

## 의존성 분석

### 외부 의존성
- **카카오 도서 API**: 일일 할당량 제한, 네트워크 지연
- **이미지 CDN**: 업로드 및 최적화 서비스
- **Redis/캐싱**: 선택적 - 메모리 기반으로 시작

### 내부 의존성
- **Phase 2 인증 시스템**: 사용자 관련 기능
- **데이터베이스 스키마**: Book 모델 추가
- **UI 컴포넌트 라이브러리**: 기존 디자인 시스템

### 팀 의존성
- **디자인팀**: UI/UX 가이드라인
- **백엔드팀**: API 개발 및 최적화
- **프론트엔드팀**: 사용자 인터페이스 구현

## 위험 요소 및 대응 방안

### 고위험 (즉시 대응 필요)
1. **카카오 API 할당량 초과**
   - **위험도**: 높음
   - **영향**: 서비스 중단
   - **대응**: 캐싱 강화, 사용량 모니터링, 대체 API 준비

2. **검색 성능 저하**
   - **위험도**: 중간
   - **영향**: 사용자 경험 악화
   - **대응**: 인덱스 최적화, 검색 알고리즘 개선

### 중위험 (모니터링 필요)
1. **수동 입력 데이터 품질**
   - **위험도**: 중간
   - **영향**: 콘텐츠 신뢰성
   - **대응**: 검증 강화, 사용자 피드백 시스템

2. **캐시 메모리 사용량**
   - **위험도**: 낮음
   - **영향**: 서버 성능
   - **대응**: LRU 정책, 메모리 모니터링

## 완료 기준 및 검증 방법

### 기능 완료 기준
- [ ] 카카오 API 연동 100% 작동
- [ ] 도서 검색 모든 케이스 처리
- [ ] 수동 입력 검증 로직 완전
- [ ] 상세 페이지 모든 정보 표시
- [ ] 캐싱 시스템 안정적 동작

### 성능 기준
- [ ] 검색 응답 시간 <500ms
- [ ] 페이지 로드 시간 <2초
- [ ] 캐시 히트율 >85%
- [ ] API 에러율 <1%

### 사용자 경험 기준
- [ ] 모바일 반응형 완벽 지원
- [ ] 접근성 WCAG 2.1 AA 준수
- [ ] 에러 메시지 사용자 친화적
- [ ] 로딩 상태 명확한 표시

## 다음 Phase 연계

Phase 3 완료 후 Phase 4에서 활용:
- **도서 선택**: 독후감 작성 시 도서 검색/선택
- **도서 정보 연동**: 독후감과 도서 상세 정보 연결
- **장르 기반 필터링**: 독후감 피드 장르별 필터
- **통계 데이터**: 도서별 독후감 수, 추천율 등

## 추정 시간 및 리소스

### 총 소요 시간: 280시간 (7주)
- **Backend 개발**: 180시간 (64%)
- **Frontend 개발**: 80시간 (29%)
- **테스트 및 QA**: 20시간 (7%)

### 팀 구성
- **Backend Developer**: 1명 (풀타임)
- **Frontend Developer**: 1명 (풀타임)
- **QA Engineer**: 1명 (파트타임)

### 마일스톤
- **Week 2**: API 연동 및 데이터 모델 완성
- **Week 4**: 핵심 기능 구현 완료
- **Week 6**: UI/UX 구현 완료
- **Week 7**: 통합 테스트 및 프로덕션 준비

---

**🎯 다음 단계**: Phase 3 구현 시작을 위해 `/sc:implement` 명령으로 첫 번째 태스크(카카오 API 클라이언트) 구현을 진행할 수 있습니다.