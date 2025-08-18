# 06. 도서 검색 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/search`
- **우선순위**: 2순위 (Core Features)
- **설명**: 3단계 도서 검색과 통합 검색 기능
- **인증**: 비로그인 접근 가능, 독후감 작성 시 로그인 필요

## 📋 참조 문서

### 사용자 플로우
- **[도서 탐색 및 검색](../user-flows/discovery.md)** - 3단계 도서 검색, 통합 검색, 필터링
- **[독후감 작성](../user-flows/content-creation.md)** - 도서 검색 후 독후감 작성 연결
- **[오류 처리](../user-flows/error-handling.md)** - 검색 실패, API 오류 처리

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 도서 검색의 탐색 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 도서 탐색 및 발견 흐름

### 관련 PRD 문서
- **[독후감 작성 페이지](./04-write.md)** - 검색 후 독후감 작성 연결
- **[도서 상세 페이지](./09-book-detail.md)** - 검색 결과에서 도서 상세로 이동
- **[메인 피드 페이지](./01-main-feed.md)** - 헤더 검색에서 통합 검색으로 연결
- **[독후감 상세 페이지](./05-review-detail.md)** - 독후감 검색 결과 연결

## 핵심 기능

### 1. 통합 검색 시스템
- **도서 검색**: 제목, 저자, ISBN으로 검색
- **독후감 검색**: 독후감 내용, 태그, 작성자로 검색
- **사용자 검색**: 닉네임, 자기소개로 검색
- **실시간 검색**: 입력 시 즉시 검색 결과 표시
- **검색 제안**: 인기 검색어, 최근 검색어

### 2. 3단계 도서 검색
- **1단계**: 서버 DB 검색 (기존 등록 도서)
- **2단계**: 카카오 도서 검색 API
- **3단계**: 수동 도서 추가 양식
- **검색 결과 통합**: DB + API 결과 병합 표시
- **중복 제거**: ISBN 기준 중복 도서 제거

### 3. 고급 필터링
- **도서 필터**: 출간년도, 장르, 출판사
- **독후감 필터**: 평점(추천/비추천), 작성일, 좋아요수
- **정렬 옵션**: 관련도, 최신순, 인기순, 평점순
- **결과 개수**: 페이지당 20개, 무한 스크롤

### 4. 검색 결과 표시
- **도서 카드**: 표지, 제목, 저자, 독후감 수, 평균 평점
- **독후감 카드**: 미리보기, 작성자, 도서 정보, 좋아요 수
- **사용자 카드**: 프로필 사진, 닉네임, 팔로워 수, 독후감 수

## 필요한 API

### GET `/api/search`
```typescript
interface UnifiedSearchRequest {
  query: string;
  type: 'all' | 'books' | 'reviews' | 'users';
  filters?: SearchFilters;
  sort?: 'relevance' | 'newest' | 'oldest' | 'popular' | 'rating';
  cursor?: string;
  limit?: number;
}

interface SearchFilters {
  // 도서 필터
  publishYear?: {
    from?: number;
    to?: number;
  };
  genre?: string[];
  publisher?: string[];
  
  // 독후감 필터
  rating?: 'recommend' | 'not_recommend';
  dateRange?: {
    from?: string;
    to?: string;
  };
  minLikes?: number;
  
  // 사용자 필터
  hasAvatar?: boolean;
  minFollowers?: number;
}

interface UnifiedSearchResponse {
  results: {
    books: BookSearchResult[];
    reviews: ReviewSearchResult[];
    users: UserSearchResult[];
  };
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
  suggestions?: string[]; // 검색어 제안
}
```

### GET `/api/search/books`
```typescript
interface BookSearchRequest {
  query: string;
  source?: 'db' | 'api' | 'all';
  filters?: BookFilters;
  sort?: 'relevance' | 'newest' | 'popular' | 'title';
  page?: number;
  limit?: number;
}

interface BookSearchResponse {
  books: BookSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  sources: {
    db: number; // DB 결과 수
    api: number; // API 결과 수
  };
}

interface BookSearchResult {
  id?: string; // DB에 있는 경우만
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  isbn?: string;
  coverImage?: string;
  description?: string;
  genre?: string[];
  
  // 통계 (DB에 있는 경우만)
  stats?: {
    reviewCount: number;
    averageRating?: number; // 추천 비율
    recentReviews: number; // 최근 30일 독후감 수
  };
  
  source: 'db' | 'api';
  isExisting: boolean;
}
```

### GET `/api/search/reviews`
```typescript
interface ReviewSearchRequest {
  query: string;
  filters?: ReviewFilters;
  sort?: 'relevance' | 'newest' | 'popular' | 'rating';
  cursor?: string;
  limit?: number;
}

interface ReviewSearchResponse {
  reviews: ReviewSearchResult[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
  facets: {
    ratings: { recommend: number; not_recommend: number };
    authors: Array<{ username: string; count: number }>;
    books: Array<{ title: string; count: number }>;
  };
}

interface ReviewSearchResult {
  id: string;
  content: string; // 하이라이트된 요약 (150자)
  rating: 'recommend' | 'not_recommend';
  tags: string[];
  createdAt: string;
  
  author: {
    id: string;
    username: string;
    profileImage?: string;
  };
  
  book: {
    id: string;
    title: string;
    author: string;
    coverImage?: string;
  };
  
  stats: {
    likes: number;
    comments: number;
  };
  
  highlights?: {
    content?: string[]; // 매칭된 텍스트
    tags?: string[]; // 매칭된 태그
  };
}
```

### GET `/api/search/users`
```typescript
interface UserSearchRequest {
  query: string;
  filters?: UserFilters;
  sort?: 'relevance' | 'followers' | 'reviews' | 'activity';
  cursor?: string;
  limit?: number;
}

interface UserSearchResponse {
  users: UserSearchResult[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
}

interface UserSearchResult {
  id: string;
  username: string;
  bio?: string;
  profileImage?: string;
  
  stats: {
    reviewCount: number;
    followerCount: number;
    followingCount: number;
    likesReceived: number;
  };
  
  recentActivity: {
    lastReviewAt?: string;
    lastActiveAt: string;
  };
  
  isFollowing?: boolean; // 로그인 사용자만
  
  highlights?: {
    username?: string;
    bio?: string;
  };
}
```

### GET `/api/search/suggestions`
```typescript
interface SearchSuggestionsRequest {
  query: string;
  type?: 'books' | 'reviews' | 'users' | 'tags';
  limit?: number;
}

interface SearchSuggestionsResponse {
  suggestions: Array<{
    text: string;
    type: 'book' | 'review' | 'user' | 'tag';
    count?: number; // 결과 예상 개수
  }>;
  popular: string[]; // 인기 검색어
  recent: string[]; // 최근 검색어 (로그인 사용자만)
}
```

### POST `/api/books/manual`
```typescript
interface ManualBookRequest {
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  isbn?: string;
  coverImage?: string;
  description?: string;
  genre?: string[];
}

interface ManualBookResponse {
  success: boolean;
  book: BookSearchResult;
  message?: string;
}
```

## 컴포넌트 구조

### 1. SearchPage (메인 컴포넌트)
```typescript
interface SearchPageProps {
  initialQuery?: string;
  initialType?: 'all' | 'books' | 'reviews' | 'users';
}

// 상태 관리
- searchQuery: string
- searchType: 'all' | 'books' | 'reviews' | 'users'
- results: SearchResults
- filters: SearchFilters
- sort: string
- isLoading: boolean
- hasMore: boolean
```

### 2. SearchHeader (검색 헤더)
```typescript
interface SearchHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  type: string;
  onTypeChange: (type: string) => void;
  onSearch: () => void;
  suggestions: string[];
  showSuggestions: boolean;
}

// 하위 컴포넌트
- SearchInput: 검색어 입력
- SearchTypeSelector: 검색 타입 탭
- SearchSuggestions: 검색 제안 드롭다운
```

### 3. SearchFilters (필터 패널)
```typescript
interface SearchFiltersProps {
  type: string;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset: () => void;
  facets?: SearchFacets;
}

// 필터 컴포넌트
- DateRangeFilter: 날짜 범위 선택
- GenreFilter: 장르 다중 선택
- RatingFilter: 평점 필터
- NumberRangeFilter: 숫자 범위 (팔로워 수 등)
```

### 4. SearchResults (검색 결과)
```typescript
interface SearchResultsProps {
  type: string;
  results: SearchResults;
  sort: string;
  onSortChange: (sort: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

// 결과 표시 컴포넌트
- BookResultsList: 도서 검색 결과
- ReviewResultsList: 독후감 검색 결과  
- UserResultsList: 사용자 검색 결과
- UnifiedResultsList: 통합 검색 결과
```

### 5. BookSearchResult (도서 결과 아이템)
```typescript
interface BookSearchResultProps {
  book: BookSearchResult;
  onWriteReview: (book: BookSearchResult) => void;
  onViewDetails: (book: BookSearchResult) => void;
  showStats?: boolean;
}

// 표시 정보
- 도서 표지 (썸네일)
- 제목, 저자, 출간년도
- 독후감 수, 평균 평점
- "독후감 쓰기" 버튼
- "상세보기" 버튼
```

### 6. ManualBookForm (수동 도서 추가)
```typescript
interface ManualBookFormProps {
  onSubmit: (bookData: ManualBookRequest) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

// 입력 필드
- 제목 (필수)
- 저자 (필수)
- 출판사 (필수)
- 출간년도 (필수)
- ISBN (선택)
- 표지 이미지 URL (선택)
- 설명 (선택)
- 장르 (선택, 다중)
```

## 상태 관리 (Zustand)

### SearchStore
```typescript
interface SearchState {
  // 검색 상태
  query: string;
  type: 'all' | 'books' | 'reviews' | 'users';
  filters: SearchFilters;
  sort: string;
  
  // 결과 상태
  results: {
    books: BookSearchResult[];
    reviews: ReviewSearchResult[];
    users: UserSearchResult[];
  };
  pagination: {
    hasMore: boolean;
    isLoading: boolean;
    nextCursor?: string;
  };
  
  // 메타데이터
  suggestions: string[];
  recentSearches: string[];
  facets: SearchFacets;
  
  // 액션
  setQuery: (query: string) => void;
  setType: (type: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setSort: (sort: string) => void;
  
  search: () => Promise<void>;
  loadMore: () => Promise<void>;
  getSuggestions: (query: string) => Promise<void>;
  addRecentSearch: (query: string) => void;
  
  // 도서 관련
  searchBooks: (query: string, source?: string) => Promise<void>;
  addManualBook: (bookData: ManualBookRequest) => Promise<BookSearchResult>;
  
  // 유틸리티
  reset: () => void;
  clearResults: () => void;
}
```

## 검색 알고리즘

### 통합 검색 로직
```typescript
const performUnifiedSearch = async (
  query: string,
  type: string,
  filters: SearchFilters
): Promise<UnifiedSearchResponse> => {
  const searchTasks = [];
  
  // 병렬 검색 실행
  if (type === 'all' || type === 'books') {
    searchTasks.push(searchBooks(query, filters));
  }
  
  if (type === 'all' || type === 'reviews') {
    searchTasks.push(searchReviews(query, filters));
  }
  
  if (type === 'all' || type === 'users') {
    searchTasks.push(searchUsers(query, filters));
  }
  
  const results = await Promise.allSettled(searchTasks);
  
  return {
    results: {
      books: results[0]?.status === 'fulfilled' ? results[0].value : [],
      reviews: results[1]?.status === 'fulfilled' ? results[1].value : [],
      users: results[2]?.status === 'fulfilled' ? results[2].value : [],
    },
    pagination: calculatePagination(results),
    suggestions: await generateSuggestions(query)
  };
};
```

### 도서 검색 순서 및 병합
```typescript
const searchBooksWithFallback = async (
  query: string
): Promise<BookSearchResult[]> => {
  const [dbResults, apiResults] = await Promise.allSettled([
    searchBooksInDB(query),
    searchBooksInAPI(query)
  ]);
  
  const dbBooks = dbResults.status === 'fulfilled' ? dbResults.value : [];
  const apiBooks = apiResults.status === 'fulfilled' ? apiResults.value : [];
  
  // ISBN 기준으로 중복 제거
  const mergedBooks = [...dbBooks];
  const existingISBNs = new Set(
    dbBooks.map(book => book.isbn).filter(Boolean)
  );
  
  apiBooks.forEach(book => {
    if (!book.isbn || !existingISBNs.has(book.isbn)) {
      mergedBooks.push({
        ...book,
        source: 'api' as const,
        isExisting: false
      });
    }
  });
  
  // 관련도 순으로 정렬
  return mergedBooks.sort((a, b) => {
    // DB 결과 우선
    if (a.source === 'db' && b.source === 'api') return -1;
    if (a.source === 'api' && b.source === 'db') return 1;
    
    // 제목 매칭도 계산
    const aScore = calculateRelevanceScore(query, a.title);
    const bScore = calculateRelevanceScore(query, b.title);
    return bScore - aScore;
  });
};

const calculateRelevanceScore = (query: string, text: string): number => {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // 정확한 매칭
  if (textLower === queryLower) return 100;
  
  // 시작 매칭
  if (textLower.startsWith(queryLower)) return 80;
  
  // 포함 매칭
  if (textLower.includes(queryLower)) return 60;
  
  // 유사성 점수 (Levenshtein distance 기반)
  const distance = calculateLevenshteinDistance(queryLower, textLower);
  const maxLength = Math.max(queryLower.length, textLower.length);
  const similarity = (maxLength - distance) / maxLength;
  
  return similarity * 40;
};
```

## 검색 최적화

### 디바운스 및 캐싱
```typescript
const useSearchWithDebounce = (
  query: string,
  delay: number = 300
) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const cacheRef = useRef(new Map<string, any>());
  
  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [query, delay]);
  
  // 검색 실행
  useEffect(() => {
    if (debouncedQuery.length < 2) return;
    
    const cacheKey = `${debouncedQuery}_${JSON.stringify(filters)}`;
    
    // 캐시 확인
    if (cacheRef.current.has(cacheKey)) {
      setResults(cacheRef.current.get(cacheKey));
      return;
    }
    
    // 검색 실행
    performSearch(debouncedQuery)
      .then(results => {
        cacheRef.current.set(cacheKey, results);
        setResults(results);
      })
      .catch(error => {
        console.error('Search error:', error);
      });
  }, [debouncedQuery, filters]);
  
  return { debouncedQuery, results };
};
```

### 검색 제안 시스템
```typescript
const generateSearchSuggestions = async (
  query: string
): Promise<string[]> => {
  if (query.length < 2) return [];
  
  const suggestions = await Promise.all([
    // 도서 제목 자동완성
    api.getBookTitleSuggestions(query),
    // 작가명 자동완성
    api.getAuthorSuggestions(query),
    // 인기 태그 자동완성
    api.getTagSuggestions(query),
    // 사용자명 자동완성
    api.getUsernameSuggestions(query)
  ]);
  
  // 결과 병합 및 중복 제거
  const allSuggestions = suggestions.flat();
  const uniqueSuggestions = [...new Set(allSuggestions)];
  
  // 관련도 순 정렬 후 최대 10개 반환
  return uniqueSuggestions
    .sort((a, b) => calculateRelevanceScore(query, b) - calculateRelevanceScore(query, a))
    .slice(0, 10);
};
```

## UI/UX 최적화

### 검색 결과 하이라이팅
```typescript
const HighlightedText: React.FC<{
  text: string;
  highlights: string[];
  className?: string;
}> = ({ text, highlights, className }) => {
  if (!highlights.length) return <span className={className}>{text}</span>;
  
  let highlightedText = text;
  highlights.forEach(highlight => {
    const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
    highlightedText = highlightedText.replace(
      regex,
      '<mark class="bg-yellow-200">$1</mark>'
    );
  });
  
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedText }}
    />
  );
};
```

### 무한 스크롤 구현
```typescript
const useInfiniteScroll = (
  hasMore: boolean,
  isLoading: boolean,
  onLoadMore: () => void
) => {
  const targetRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (targetRef.current) {
      observer.observe(targetRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);
  
  return targetRef;
};
```

## 에러 처리

### 검색 실패 처리
```typescript
interface SearchError {
  type: 'network' | 'api_limit' | 'invalid_query' | 'no_results';
  message: string;
  retryable: boolean;
}

const handleSearchError = (error: any): SearchError => {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    return {
      type: 'api_limit',
      message: '검색 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
      retryable: true
    };
  }
  
  if (error.code === 'INVALID_QUERY') {
    return {
      type: 'invalid_query',
      message: '검색어를 확인해주세요. 특수문자는 사용할 수 없습니다.',
      retryable: false
    };
  }
  
  if (error.name === 'NetworkError') {
    return {
      type: 'network',
      message: '네트워크 연결을 확인해주세요.',
      retryable: true
    };
  }
  
  return {
    type: 'no_results',
    message: '검색 결과가 없습니다. 다른 키워드로 검색해보세요.',
    retryable: false
  };
};
```

## 접근성

### 키보드 네비게이션
```typescript
const useSearchKeyboardNavigation = (
  suggestions: string[],
  onSelect: (suggestion: string) => void
) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
        event.preventDefault();
        if (activeIndex >= 0) {
          onSelect(suggestions[activeIndex]);
        }
        break;
        
      case 'Escape':
        setActiveIndex(-1);
        break;
    }
  };
  
  return { activeIndex, handleKeyDown };
};
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (검색 결과 렌더링)
- **FID**: < 100ms (검색 입력 응답성)
- **CLS**: < 0.1 (결과 로딩 시 레이아웃 변경 최소화)

### 사용자 경험 지표
- 검색 제안 응답: < 200ms
- 검색 결과 응답: < 1.5초
- 무한 스크롤 로딩: < 1초
- 필터 적용 응답: < 800ms