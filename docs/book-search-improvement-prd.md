# 도서 검색 시스템 개선 PRD (Product Requirements Document)

## 1. 개요

### 1.1 목적
현재 혼재된 도서 검색 시스템을 사용자가 명확히 인지할 수 있는 탭 기반 UI로 개선하여 사용자 경험을 향상시킵니다.

### 1.2 배경
- 현재 DB 검색과 카카오 API 검색이 혼재되어 있어 사용자가 검색 소스를 인지하기 어려움
- 페이지네이션 동작이 일관되지 않아 무한 스크롤이 예상대로 작동하지 않음
- 검색 결과의 출처가 불명확하여 사용자 혼란 야기

### 1.3 목표
- 검색 소스를 명확히 구분하는 탭 기반 UI 제공
- 각 검색 소스별 독립적이고 일관된 페이지네이션 구현
- 사용자가 검색 소스를 직접 선택할 수 있는 직관적인 인터페이스 구현

## 2. 핵심 변경사항

### 2.1 검색 소스 탭 구조

```typescript
interface SearchTab {
  id: 'community' | 'kakao' | 'manual'
  label: string
  description: string
  icon: IconType
}

const searchTabs: SearchTab[] = [
  { 
    id: 'community', 
    label: '커뮤니티 도서', 
    description: '다른 사용자들이 등록한 도서',
    icon: Users
  },
  { 
    id: 'kakao', 
    label: '도서 검색', 
    description: '카카오 도서 API로 새로운 도서 찾기',
    icon: Search
  },
  { 
    id: 'manual', 
    label: '직접 입력', 
    description: '검색되지 않는 도서 직접 등록',
    icon: Edit
  }
]
```

### 2.2 라벨링 전략
- **커뮤니티 도서**: 다른 사용자들이 이미 선택했던 도서들의 집합임을 명확히 표현
- **도서 검색**: 카카오 API를 통한 외부 검색임을 직관적으로 표현
- **직접 입력**: 검색으로 찾을 수 없는 도서를 수동으로 등록하는 기능

## 3. API 엔드포인트 설계

### 3.1 기존 구조 (제거 예정)
```
GET /api/books/search?q={query}&source={source}&page={page}
```

### 3.2 새로운 구조

#### 커뮤니티 도서 검색
```
GET /api/books/community/search
Query Parameters:
- q: string (검색어)
- page: number (페이지 번호, 기본값: 1)
- limit: number (페이지 크기, 기본값: 10)

Response:
{
  success: boolean
  data: Book[]
  pagination: {
    currentPage: number
    pageSize: number
    totalCount: number
    isEnd: boolean
  }
}
```

#### 카카오 도서 검색
```
GET /api/books/kakao/search
Query Parameters:
- q: string (검색어)
- page: number (페이지 번호, 기본값: 1)
- limit: number (페이지 크기, 기본값: 10)
- sort: 'accuracy' | 'latest' (정렬 방식, 기본값: 'accuracy')

Response:
{
  success: boolean
  data: KakaoBook[]
  pagination: {
    currentPage: number
    pageSize: number
    totalCount: number
    isEnd: boolean
  }
  usage?: {
    apiCalls: number
    remainingQuota: number
  }
}
```

#### 카카오 검색 결과 저장
```
POST /api/books/save-from-kakao
Body:
{
  title: string
  authors: string[]
  publisher?: string
  genre?: string
  thumbnail?: string
  isbn?: string
}

Response:
{
  success: boolean
  data: {
    id: string
    title: string
    authors: string[]
    publisher?: string
    genre?: string
    thumbnail?: string
    isbn?: string
    isManualEntry: false
    createdAt: string
  }
}
```

#### 직접 입력 도서 저장
```
POST /api/books/manual
Body:
{
  title: string
  authors: string[]
  publisher?: string
  genre?: string
}

Response:
{
  success: boolean
  data: {
    id: string
    title: string
    authors: string[]
    publisher?: string
    genre?: string
    isManualEntry: true
    createdAt: string
  }
}
```

## 4. UI/UX 설계

### 4.1 탭 네비게이션
- 3개의 탭이 수평으로 배치
- 현재 활성 탭은 하이라이트 표시
- 각 탭에는 아이콘과 라벨, 설명 텍스트 포함
- 탭 전환 시 부드러운 애니메이션 적용

### 4.2 검색 결과 표시

#### 커뮤니티 도서 탭
- 도서 정보와 함께 "등록자 수" 또는 "선택 횟수" 표시
- 최근 선택된 도서 우선 표시
- 무한 스크롤 지원

#### 카카오 검색 탭
- 도서 정보와 함께 "새 도서" 뱃지 표시
- 선택 시 "커뮤니티에 추가됩니다" 안내 메시지
- 무한 스크롤 지원

#### 직접 입력 탭
- 제목, 저자, 출판사, 장르 입력 폼
- 실시간 유효성 검증
- 중복 도서 확인 기능

### 4.3 무한 스크롤 개선
- 각 탭별 독립적인 페이지네이션 상태
- 스크롤 하단 도달 시 자동 로딩
- 로딩 중 스피너 표시
- 마지막 페이지 도달 시 안내 메시지

### 4.4 피드백 메시지
- 검색 결과 없음: "다른 탭에서 검색해보세요" 안내
- 카카오 도서 선택 시: "커뮤니티에 추가되었습니다" 토스트
- 직접 입력 완료 시: "새 도서가 등록되었습니다" 토스트

## 5. 상태 관리 구조

```typescript
interface BookSelectorState {
  // 현재 활성 탭
  activeTab: 'community' | 'kakao' | 'manual'
  
  // 커뮤니티 도서 탭 상태
  community: {
    query: string
    books: Book[]
    page: number
    hasMore: boolean
    isLoading: boolean
    isLoadingMore: boolean
    totalCount: number
    searchPerformed: boolean
  }
  
  // 카카오 검색 탭 상태
  kakao: {
    query: string
    books: KakaoBook[]
    page: number
    hasMore: boolean
    isLoading: boolean
    isLoadingMore: boolean
    totalCount: number
    searchPerformed: boolean
  }
  
  // 직접 입력 탭 상태
  manual: {
    form: {
      title: string
      authors: string
      publisher: string
      genre: string
    }
    isSubmitting: boolean
    validationErrors: Record<string, string>
  }
  
  // 공통 상태
  recentBooks: Book[]
}
```

## 6. 주요 기능 변경사항

### 6.1 검색 로직 분리
- `searchCommunityBooks()`: 커뮤니티 도서 검색
- `searchKakaoBooks()`: 카카오 API 검색
- `submitManualBook()`: 직접 입력 도서 등록
- 각 함수는 독립적으로 동작하며 서로 영향을 주지 않음

### 6.2 페이지네이션 개선
- 각 탭별로 독립적인 무한 스크롤 구현
- Intersection Observer 활용한 자동 로딩
- 일관된 로딩 상태 관리

### 6.3 사용자 피드백 강화
- 검색 소스 명확히 표시
- 실시간 검색 결과 카운트
- 각 액션에 대한 즉시 피드백 제공

### 6.4 성능 최적화
- 탭 전환 시 기존 검색 결과 캐싱
- debounce 적용으로 불필요한 API 호출 방지
- React.memo 적용으로 불필요한 리렌더링 방지

## 7. 기술적 고려사항

### 7.1 컴포넌트 구조
```
BookSelector
├── TabNavigation
├── CommunityBookTab
│   ├── SearchInput
│   ├── BookList
│   └── InfiniteScroll
├── KakaoBookTab
│   ├── SearchInput
│   ├── BookList
│   └── InfiniteScroll
└── ManualInputTab
    ├── BookForm
    └── ValidationMessages
```

### 7.2 데이터 흐름
1. 사용자가 탭 선택
2. 해당 탭의 상태로 전환
3. 검색어 입력 시 debounce 적용
4. API 호출 및 결과 표시
5. 스크롤 시 추가 페이지 로드

### 7.3 에러 처리
- 네트워크 오류 시 재시도 옵션 제공
- API 한도 초과 시 안내 메시지 표시
- 유효성 검증 실패 시 구체적인 오류 메시지

## 8. 예상 이점

### 8.1 사용자 경험 개선
- 검색 소스를 명확히 구분하여 혼란 방지
- 각 소스의 특성에 맞는 최적화된 인터페이스 제공
- 직관적인 탭 기반 네비게이션

### 8.2 개발자 경험 개선
- 명확히 분리된 로직으로 유지보수성 향상
- 각 탭별 독립적인 테스트 가능
- 새로운 검색 소스 추가 용이

### 8.3 성능 개선
- 불필요한 혼합 검색 로직 제거
- 각 소스별 최적화된 캐싱 전략 적용
- 효율적인 무한 스크롤 구현

## 9. 마이그레이션 계획

### Phase 1: API 엔드포인트 분리
1. 새로운 API 엔드포인트 구현
2. 기존 엔드포인트와 병행 운영
3. 새 엔드포인트 테스트 및 검증

### Phase 2: UI 컴포넌트 개발
1. 탭 네비게이션 컴포넌트 구현
2. 각 탭별 검색 컴포넌트 구현
3. 상태 관리 로직 구현

### Phase 3: 통합 및 테스트
1. 새로운 BookSelector 컴포넌트 통합
2. 기존 기능과의 호환성 테스트
3. 사용자 피드백 수집 및 개선

### Phase 4: 기존 코드 제거
1. 기존 API 엔드포인트 제거
2. 사용하지 않는 코드 정리
3. 문서 업데이트

## 10. 성공 지표

### 10.1 정량적 지표
- 검색 성공률 개선 (현재 대비 +20%)
- 페이지 로딩 시간 단축 (현재 대비 -30%)
- API 호출 최적화 (불필요한 호출 -50%)

### 10.2 정성적 지표
- 사용자 피드백 점수 향상
- 검색 소스 인지도 개선
- 개발자 만족도 향상

이 PRD는 도서 검색 시스템의 전면적인 개선을 위한 로드맵을 제시합니다. 각 단계별로 명확한 목표와 구현 방안을 정의하여 성공적인 개선을 도모합니다.