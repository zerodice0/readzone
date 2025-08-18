# 09. 도서 상세 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/books/[id]`
- **우선순위**: 3순위 (Enhanced Features)
- **설명**: 도서 정보, 관련 독후감 목록, 도서 통계
- **인증**: 비로그인 접근 가능, 상호작용 시 로그인 필요

## 📋 참조 문서

### 사용자 플로우
- **[도서 탐색 및 검색](../user-flows/discovery.md)** - 도서 상세 진입, 중복 작성 선택
- **[독후감 작성](../user-flows/content-creation.md)** - 도서 선택 후 독후감 작성
- **[소셜 상호작용](../user-flows/social-interaction.md)** - 안전한 구매 연결

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 도서 상세의 정보 탐색 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 도서 탐색 및 발견 흐름

### 관련 PRD 문서
- **[도서 검색 페이지](./06-search.md)** - 검색에서 도서 상세로 진입
- **[독후감 작성 페이지](./04-write.md)** - 도서 상세에서 독후감 작성
- **[독후감 상세 페이지](./05-review-detail.md)** - 도서 상세에서 독후감 상세로 연결
- **[메인 피드 페이지](./01-main-feed.md)** - 도서 정보 클릭 진입점

## 핵심 기능

### 1. 도서 정보 표시
- **기본 정보**: 표지, 제목, 저자, 출판사, 출간년도, ISBN
- **상세 정보**: 줄거리, 장르, 페이지 수, 언어
- **외부 링크**: 도서 구매 링크 (알라딘, 교보문고, 예스24, 인터파크)
- **메타데이터**: 추가일, 마지막 독후감 작성일

### 2. 독후감 통계 및 분석
- **전체 통계**: 독후감 수, 평균 평점, 최근 활동
- **평점 분포**: 추천/비추천 비율 시각화
- **태그 클라우드**: 자주 사용된 태그들
- **읽기 경향**: 월별 독후감 작성 추이

### 3. 관련 독후감 목록
- **정렬 옵션**: 최신순, 인기순, 평점순
- **필터링**: 추천/비추천, 기간, 태그
- **무한 스크롤**: 페이지당 20개 로딩
- **미리보기**: 독후감 요약 (150자)

### 4. 상호작용 기능
- **독후감 쓰기**: 해당 도서에 대한 독후감 작성
- **서재 추가**: 읽고 싶은 책, 읽는 중, 읽은 책 상태 관리
- **알림 설정**: 새로운 독후감 알림 구독
- **공유 기능**: 도서 정보 공유

## 필요한 API

### GET `/api/books/[id]`
```typescript
interface BookDetailRequest {
  id: string;
  includeStats?: boolean;
  includeReviews?: boolean;
}

interface BookDetailResponse {
  book: {
    id: string;
    title: string;
    author: string;
    publisher: string;
    publishedDate: string;
    isbn?: string;
    coverImage?: string;
    description?: string;
    genre: string[];
    language: string;
    pages?: number;
    
    // 메타데이터
    addedAt: string;
    lastReviewAt?: string;
    source: 'db' | 'api'; // 데이터 출처
    
    // 외부 링크
    externalLinks: {
      aladin?: string;
      kyobo?: string;
      yes24?: string;
      interpark?: string;
    };
  };
  
  stats: {
    reviewCount: number;
    averageRating: number; // 0-100 (추천 비율)
    ratingsDistribution: {
      recommend: number;
      not_recommend: number;
    };
    recentActivity: {
      thisWeek: number;
      thisMonth: number;
      thisYear: number;
    };
    topTags: Array<{
      tag: string;
      count: number;
    }>;
  };
  
  userStatus?: {
    hasReviewed: boolean;
    reviewId?: string;
    libraryStatus?: 'want_to_read' | 'reading' | 'read';
    isSubscribed?: boolean; // 알림 구독 여부
  }; // 로그인 사용자만
  
  similarBooks?: Array<{
    id: string;
    title: string;
    author: string;
    coverImage?: string;
    reviewCount: number;
    averageRating: number;
  }>;
}
```

### GET `/api/books/[id]/reviews`
```typescript
interface BookReviewsRequest {
  bookId: string;
  sort?: 'newest' | 'oldest' | 'popular' | 'rating';
  filter?: {
    rating?: 'recommend' | 'not_recommend';
    tags?: string[];
    dateRange?: {
      from?: string;
      to?: string;
    };
  };
  cursor?: string;
  limit?: number;
}

interface BookReviewsResponse {
  reviews: Array<{
    id: string;
    content: string; // 미리보기 150자
    rating: 'recommend' | 'not_recommend';
    tags: string[];
    createdAt: string;
    
    author: {
      id: string;
      username: string;
      profileImage?: string;
    };
    
    stats: {
      likes: number;
      comments: number;
      shares: number;
    };
    
    userInteraction?: {
      isLiked: boolean;
    }; // 로그인 사용자만
  }>;
  
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
  
  facets: {
    ratings: {
      recommend: number;
      not_recommend: number;
    };
    tags: Array<{
      tag: string;
      count: number;
    }>;
  };
}
```

### GET `/api/books/[id]/stats`
```typescript
interface BookStatsRequest {
  bookId: string;
  period?: 'week' | 'month' | 'year' | 'all';
}

interface BookStatsResponse {
  timeline: Array<{
    date: string; // YYYY-MM-DD
    reviewCount: number;
    averageRating: number;
  }>;
  
  demographics: {
    ageGroups?: Array<{
      range: string; // "20-29"
      count: number;
      avgRating: number;
    }>;
    genderDistribution?: {
      male: number;
      female: number;
      other: number;
    };
  };
  
  readingPatterns: {
    avgReadingTime?: number; // 일
    popularReadingMonths: Array<{
      month: number; // 1-12
      count: number;
    }>;
    rereadRate: number; // 재독률 %
  };
}
```

### POST `/api/books/[id]/library`
```typescript
interface AddToLibraryRequest {
  status: 'want_to_read' | 'reading' | 'read';
  startDate?: string; // 읽기 시작일
  finishDate?: string; // 읽기 완료일
  notes?: string; // 개인 메모
}

interface AddToLibraryResponse {
  success: boolean;
  libraryStatus: string;
  message: string;
}
```

### POST `/api/books/[id]/subscribe`
```typescript
interface SubscribeBookRequest {
  action: 'subscribe' | 'unsubscribe';
}

interface SubscribeBookResponse {
  success: boolean;
  isSubscribed: boolean;
  message: string;
}
```

### POST `/api/books/[id]/share`
```typescript
interface ShareBookRequest {
  platform: 'link' | 'kakao' | 'twitter';
}

interface ShareBookResponse {
  success: boolean;
  shareUrl: string;
  shareCount: number;
}
```

### GET `/api/books/similar/[id]`
```typescript
interface SimilarBooksRequest {
  bookId: string;
  limit?: number;
  method?: 'genre' | 'author' | 'collaborative'; // 유사도 계산 방식
}

interface SimilarBooksResponse {
  books: Array<{
    id: string;
    title: string;
    author: string;
    coverImage?: string;
    similarity: number; // 0-100
    reason: 'same_author' | 'same_genre' | 'similar_tags' | 'user_behavior';
    
    stats: {
      reviewCount: number;
      averageRating: number;
    };
  }>;
}
```

## 컴포넌트 구조

### 1. BookDetailPage (메인 컴포넌트)
```typescript
interface BookDetailPageProps {
  bookId: string;
  initialData?: BookDetailResponse;
}

// 상태 관리
- book: BookDetail | null
- reviews: BookReview[]
- reviewsFilter: ReviewsFilter
- reviewsSort: string
- isLoading: boolean
- activeTab: 'reviews' | 'stats' | 'similar'
```

### 2. BookHeader (도서 정보 헤더)
```typescript
interface BookHeaderProps {
  book: BookDetail;
  stats: BookStats;
  userStatus?: UserBookStatus;
  onWriteReview: () => void;
  onAddToLibrary: (status: string) => Promise<void>;
  onSubscribe: () => Promise<void>;
  onShare: (platform: string) => Promise<void>;
}

// 하위 컴포넌트
- BookCover: 도서 표지 (확대 가능)
- BookInfo: 기본 정보 (제목, 저자, 출판사 등)
- BookDescription: 줄거리
- ActionButtons: 독후감 쓰기, 서재 추가, 알림, 공유
- ExternalLinks: 외부 도서 구매 링크
```

### 3. BookStats (도서 통계)
```typescript
interface BookStatsProps {
  stats: BookStats;
  timeline?: BookTimeline[];
  isLoading: boolean;
}

// 통계 컴포넌트
- RatingDistribution: 평점 분포 차트
- TagCloud: 태그 클라우드
- ActivityTimeline: 활동 타임라인
- ReadingPatterns: 읽기 패턴 분석
```

### 4. BookReviewsList (독후감 목록)
```typescript
interface BookReviewsListProps {
  bookId: string;
  reviews: BookReview[];
  sort: string;
  filter: ReviewsFilter;
  facets: ReviewsFacets;
  hasMore: boolean;
  isLoading: boolean;
  onSortChange: (sort: string) => void;
  onFilterChange: (filter: ReviewsFilter) => void;
  onLoadMore: () => void;
}

// 하위 컴포넌트
- ReviewsFilters: 필터링 옵션
- ReviewsSorting: 정렬 옵션
- ReviewCard: 개별 독후감 카드
- LoadMoreButton: 더 보기 버튼
```

### 5. SimilarBooks (유사한 도서)
```typescript
interface SimilarBooksProps {
  bookId: string;
  books: SimilarBook[];
  onBookClick: (bookId: string) => void;
}

// 표시 정보
- 유사도 점수
- 유사한 이유
- 기본 통계 (독후감 수, 평점)
```

### 6. LibraryStatusSelector (서재 상태 선택)
```typescript
interface LibraryStatusSelectorProps {
  currentStatus?: string;
  onStatusChange: (status: string, metadata?: any) => Promise<void>;
  isLoading: boolean;
}

// 상태 옵션
- want_to_read: 읽고 싶은 책
- reading: 읽는 중 (시작일 입력)
- read: 읽은 책 (완료일 입력)
- remove: 서재에서 제거
```

## 상태 관리 (Zustand)

### BookDetailStore
```typescript
interface BookDetailState {
  // 상태
  book: BookDetail | null;
  stats: BookStats | null;
  reviews: BookReview[];
  reviewsTotal: number;
  reviewsFilter: ReviewsFilter;
  reviewsSort: string;
  similarBooks: SimilarBook[];
  
  // UI 상태
  activeTab: string;
  isLoading: boolean;
  reviewsLoading: boolean;
  error: string | null;
  
  // 액션
  loadBook: (id: string) => Promise<void>;
  loadBookStats: (id: string, period?: string) => Promise<void>;
  loadReviews: (bookId: string, options?: BookReviewsRequest) => Promise<void>;
  loadSimilarBooks: (bookId: string) => Promise<void>;
  
  // 상호작용
  addToLibrary: (bookId: string, status: string, metadata?: any) => Promise<void>;
  subscribeToBook: (bookId: string) => Promise<void>;
  shareBook: (bookId: string, platform: string) => Promise<void>;
  
  // 필터링 및 정렬
  setReviewsSort: (sort: string) => void;
  setReviewsFilter: (filter: ReviewsFilter) => void;
  loadMoreReviews: () => Promise<void>;
  
  // 유틸리티
  setActiveTab: (tab: string) => void;
  reset: () => void;
  updateUserStatus: (status: Partial<UserBookStatus>) => void;
}
```

## 도서 통계 시각화

### 평점 분포 차트
```typescript
const RatingDistribution: React.FC<{
  distribution: { recommend: number; not_recommend: number };
}> = ({ distribution }) => {
  const total = distribution.recommend + distribution.not_recommend;
  const recommendPercent = total > 0 ? (distribution.recommend / total) * 100 : 0;
  const notRecommendPercent = 100 - recommendPercent;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">독자 평가</h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-green-600">
            <ThumbUpIcon className="w-4 h-4 mr-1" />
            추천
          </span>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${recommendPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {distribution.recommend}명 ({recommendPercent.toFixed(1)}%)
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-red-600">
            <ThumbDownIcon className="w-4 h-4 mr-1" />
            비추천
          </span>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${notRecommendPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {distribution.not_recommend}명 ({notRecommendPercent.toFixed(1)}%)
          </span>
        </div>
      </div>
      
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <span className="text-2xl font-bold text-green-600">
          {recommendPercent.toFixed(1)}%
        </span>
        <p className="text-sm text-gray-600">독자 추천률</p>
      </div>
    </div>
  );
};
```

### 태그 클라우드
```typescript
const TagCloud: React.FC<{
  tags: Array<{ tag: string; count: number }>;
  onTagClick: (tag: string) => void;
}> = ({ tags, onTagClick }) => {
  const maxCount = Math.max(...tags.map(t => t.count));
  
  const getFontSize = (count: number) => {
    const ratio = count / maxCount;
    return 12 + ratio * 12; // 12px ~ 24px
  };
  
  const getOpacity = (count: number) => {
    const ratio = count / maxCount;
    return 0.6 + ratio * 0.4; // 0.6 ~ 1.0
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">인기 태그</h3>
      
      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag, count }) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
            style={{
              fontSize: `${getFontSize(count)}px`,
              opacity: getOpacity(count)
            }}
          >
            #{tag}
            <span className="ml-1 text-xs">({count})</span>
          </button>
        ))}
      </div>
      
      {tags.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          아직 태그가 없습니다
        </p>
      )}
    </div>
  );
};
```

### 활동 타임라인
```typescript
const ActivityTimeline: React.FC<{
  timeline: Array<{ date: string; reviewCount: number; averageRating: number }>;
}> = ({ timeline }) => {
  const maxReviews = Math.max(...timeline.map(t => t.reviewCount));
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">최근 6개월 활동</h3>
      
      <div className="space-y-3">
        {timeline.map(({ date, reviewCount, averageRating }) => {
          const month = new Date(date).toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long' 
          });
          const barWidth = maxReviews > 0 ? (reviewCount / maxReviews) * 100 : 0;
          
          return (
            <div key={date} className="flex items-center space-x-3">
              <div className="w-20 text-sm text-gray-600 text-right">
                {month}
              </div>
              
              <div className="flex-1 relative">
                <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                
                {reviewCount > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {reviewCount}개
                  </div>
                )}
              </div>
              
              <div className="w-16 text-sm text-right">
                {averageRating > 0 && (
                  <span className={`font-medium ${
                    averageRating >= 70 ? 'text-green-600' : 
                    averageRating >= 50 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {averageRating.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {timeline.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          활동 데이터가 없습니다
        </p>
      )}
    </div>
  );
};
```

## 서재 기능

### 서재 상태 관리
```typescript
const LibraryStatusManager: React.FC<{
  bookId: string;
  currentStatus?: string;
  onStatusChange: (status: string, metadata?: any) => Promise<void>;
}> = ({ bookId, currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [metadata, setMetadata] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const statusOptions = [
    { value: 'want_to_read', label: '읽고 싶은 책', icon: BookmarkIcon, color: 'blue' },
    { value: 'reading', label: '읽는 중', icon: ClockIcon, color: 'yellow' },
    { value: 'read', label: '읽은 책', icon: CheckCircleIcon, color: 'green' },
  ];
  
  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    
    setIsLoading(true);
    try {
      await onStatusChange(selectedStatus, metadata);
      setIsOpen(false);
      toast.success('서재에 추가되었습니다');
    } catch (error) {
      toast.error('서재 추가에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };
  
  const currentOption = statusOptions.find(opt => opt.value === currentStatus);
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
          currentStatus
            ? `border-${currentOption?.color}-500 bg-${currentOption?.color}-50 text-${currentOption?.color}-700`
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {currentOption ? (
          <>
            <currentOption.icon className="w-5 h-5 mr-2" />
            {currentOption.label}
          </>
        ) : (
          <>
            <PlusIcon className="w-5 h-5 mr-2" />
            서재에 추가
          </>
        )}
      </button>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">서재 상태 설정</h3>
          
          <div className="space-y-2">
            {statusOptions.map(option => (
              <label key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedStatus === option.value 
                    ? `border-${option.color}-500 bg-${option.color}-500`
                    : 'border-gray-300'
                }`}>
                  {selectedStatus === option.value && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
                
                <option.icon className={`w-5 h-5 text-${option.color}-600`} />
                <span className="font-medium">{option.label}</span>
              </label>
            ))}
          </div>
          
          {/* 날짜 입력 (상태별) */}
          {selectedStatus === 'reading' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                읽기 시작일
              </label>
              <input
                type="date"
                value={metadata.startDate || ''}
                onChange={(e) => setMetadata({ ...metadata, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
          
          {selectedStatus === 'read' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                읽기 완료일
              </label>
              <input
                type="date"
                value={metadata.finishDate || ''}
                onChange={(e) => setMetadata({ ...metadata, finishDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
          
          {/* 개인 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              개인 메모 (선택사항)
            </label>
            <textarea
              value={metadata.notes || ''}
              onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
              placeholder="이 책에 대한 개인적인 메모를 남겨보세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleStatusChange}
              disabled={!selectedStatus || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? '처리 중...' : '저장'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
```

## 외부 도서 구매 링크

### 도서 구매 링크 생성
```typescript
const generateBookPurchaseLinks = (book: BookDetail): ExternalLinks => {
  const baseUrls = {
    aladin: 'https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=',
    kyobo: 'http://www.kyobobook.co.kr/search/SearchCommonMain.jsp?vPstrKeyWord=',
    yes24: 'http://www.yes24.com/Product/Search?domain=ALL&query=',
    interpark: 'http://book.interpark.com/blog/bookPark/bookSearch.rdo?_method=initial&sc.shopNo=&sc.prdNo=&sc.saNo=&sc.mktNo=&sc.hrgnYn=&sc.q='
  };
  
  // ISBN이 있으면 ISBN으로, 없으면 제목+저자로 검색
  const searchQuery = book.isbn 
    ? book.isbn
    : `${book.title} ${book.author}`;
    
  const encodedQuery = encodeURIComponent(searchQuery);
  
  return {
    aladin: `${baseUrls.aladin}${encodedQuery}`,
    kyobo: `${baseUrls.kyobo}${encodedQuery}`,
    yes24: `${baseUrls.yes24}${encodedQuery}`,
    interpark: `${baseUrls.interpark}${encodedQuery}`
  };
};

const ExternalBookLinks: React.FC<{
  book: BookDetail;
  onLinkClick: (platform: string) => void;
}> = ({ book, onLinkClick }) => {
  const links = generateBookPurchaseLinks(book);
  
  const platforms = [
    { key: 'aladin', name: '알라딘', color: 'blue', icon: '📚' },
    { key: 'kyobo', name: '교보문고', color: 'green', icon: '📖' },
    { key: 'yes24', name: 'YES24', color: 'red', icon: '📕' },
    { key: 'interpark', name: '인터파크', color: 'purple', icon: '📗' },
  ];
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">도서 구매하기</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {platforms.map(platform => (
          <a
            key={platform.key}
            href={links[platform.key as keyof ExternalLinks]}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLinkClick(platform.key)}
            className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg border border-${platform.color}-200 text-${platform.color}-700 hover:bg-${platform.color}-50 transition-colors`}
          >
            <span className="mr-2">{platform.icon}</span>
            {platform.name}
          </a>
        ))}
      </div>
      
      <p className="text-xs text-gray-500">
        외부 사이트로 이동하여 도서를 구매할 수 있습니다
      </p>
    </div>
  );
};
```

## SEO 최적화

### 구조화된 데이터 (JSON-LD)
```typescript
const BookStructuredData: React.FC<{
  book: BookDetail;
  stats: BookStats;
}> = ({ book, stats }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: {
      "@type": "Person",
      name: book.author
    },
    publisher: {
      "@type": "Organization", 
      name: book.publisher
    },
    datePublished: book.publishedDate,
    isbn: book.isbn,
    description: book.description,
    genre: book.genre,
    inLanguage: book.language,
    numberOfPages: book.pages,
    image: book.coverImage,
    aggregateRating: stats.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: stats.averageRating,
      ratingCount: stats.reviewCount,
      bestRating: 100,
      worstRating: 0
    } : undefined,
    review: stats.reviewCount > 0 ? {
      "@type": "Review",
      reviewCount: stats.reviewCount
    } : undefined
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
};
```

## 에러 처리

### 도서 정보 로딩 실패 처리
```typescript
const BookNotFound: React.FC<{
  onSearchSimilar: () => void;
  onReportMissing: () => void;
}> = ({ onSearchSimilar, onReportMissing }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-6">
      <div className="text-center">
        <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          도서를 찾을 수 없습니다
        </h2>
        <p className="text-gray-600">
          요청하신 도서 정보를 찾을 수 없습니다.
        </p>
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={onSearchSimilar}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          유사한 도서 찾기
        </button>
        <button
          onClick={onReportMissing}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          도서 추가 요청
        </button>
      </div>
    </div>
  );
};
```

## 접근성

### 스크린 리더 지원
```typescript
// 도서 정보 ARIA 라벨링
<main role="main" aria-labelledby="book-title">
  <article className="book-detail">
    <header>
      <h1 id="book-title">{book.title}</h1>
      <p aria-label={`저자: ${book.author}, 출판사: ${book.publisher}`}>
        {book.author} · {book.publisher}
      </p>
    </header>
    
    <section aria-labelledby="book-description">
      <h2 id="book-description" className="sr-only">도서 설명</h2>
      <p>{book.description}</p>
    </section>
    
    <section aria-labelledby="book-stats">
      <h2 id="book-stats">도서 통계</h2>
      <dl>
        <dt>독후감 수</dt>
        <dd>{stats.reviewCount}개</dd>
        <dt>추천률</dt>
        <dd>{stats.averageRating}%</dd>
      </dl>
    </section>
    
    <section aria-labelledby="book-reviews">
      <h2 id="book-reviews">독후감 목록</h2>
      <div role="list">
        {reviews.map(review => (
          <article key={review.id} role="listitem">
            {/* 독후감 카드 */}
          </article>
        ))}
      </div>
    </section>
  </article>
</main>
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (도서 정보 렌더링)
- **FID**: < 100ms (탭 전환, 필터링)
- **CLS**: < 0.1 (동적 콘텐츠 로딩 시 레이아웃 안정성)

### 사용자 경험 지표
- 도서 정보 로딩: < 1.5초
- 독후감 목록 로딩: < 2초
- 통계 차트 렌더링: < 1초
- 필터링/정렬 응답: < 500ms