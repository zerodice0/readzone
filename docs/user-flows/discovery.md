# 3,6. 도서 탐색 및 검색 흐름 (Discovery Flow)

## 3-1. 도서 검색 흐름

```mermaid
flowchart TD
    Start([사용자]) --> BookSearchPage[도서 검색 페이지]
    
    BookSearchPage --> SearchMethod{검색 방법}
    SearchMethod -->|키워드| KeywordInput[제목/저자 입력]
    SearchMethod -->|장르/태그| TagBrowse[태그 선택]
    SearchMethod -->|최근 활동| RecentActivity[최근 독후감 업데이트]
    SearchMethod -->|이달의 인기| MonthlyPopular[이달의 인기 도서]
    
    KeywordInput --> SearchDB{서버 DB 검색}
    TagBrowse --> TagFilter{태그별 DB 조회}
    RecentActivity --> ActivityQuery{최근 24시간 조회}
    MonthlyPopular --> PopularQuery{이달 인기 조회}
    
    SearchDB -->|검색 성공| ShowResults[검색 결과 표시]
    SearchDB -->|결과 없음| KakaoSearch[카카오 API 검색]
    KakaoSearch --> ShowResults
    
    TagFilter --> ShowResults
    ActivityQuery --> ShowResults
    PopularQuery --> ShowResults
    
    ShowResults --> SelectBook[도서 선택]
    SelectBook --> BookDetail[도서 상세 페이지]
```

## 3-2. 도서 상세 및 독후감 목록 흐름

```mermaid
flowchart TD
    BookDetail[도서 상세 페이지] --> BookInfo[도서 정보 표시]
    BookDetail --> ReviewSection[독후감 섹션]
    BookDetail --> WriteAction{독후감 작성}
    
    ReviewSection --> SortOptions{정렬 옵션}
    SortOptions -->|작성일 최신순| LatestReviews[최근 작성된 독후감]
    SortOptions -->|좋아요 많은 순| MostLikedReviews[좋아요 많은 독후감]
    SortOptions -->|댓글 많은 순| MostCommentedReviews[댓글 많은 독후감]
    
    LatestReviews --> ReviewList[독후감 목록 표시]
    MostLikedReviews --> ReviewList
    MostCommentedReviews --> ReviewList
    ReviewList --> ReviewCard[독후감 카드]
    
    ReviewCard --> UserChoice{사용자 상호작용}
    UserChoice -->|독후감 클릭| ReviewDetail[독후감 상세 페이지]
    UserChoice -->|좋아요 버튼| QuickLike[목록에서 좋아요]
    UserChoice -->|작성자 클릭| AuthorProfile[작성자 프로필]
    
    WriteAction -->|로그인 + 이미 작성| WritingOptions{작성 옵션}
    WriteAction -->|로그인 + 작성 없음| WritePage[독후감 작성 페이지]
    WriteAction -->|비로그인| LoginPrompt[로그인 유도]
    
    WritingOptions -->|새 독후감| NewReview[새 독후감 작성]
    WritingOptions -->|기존 수정| EditExisting[기존 독후감 수정]
```

## 6. 통합 검색 및 발견 흐름

```mermaid
flowchart TD
    Start([사용자]) --> SearchEntry{검색 진입점}
    
    SearchEntry -->|헤더 검색| GlobalSearch[통합 검색]
    SearchEntry -->|도서 검색| BookSearch[도서 검색 페이지]
    
    GlobalSearch --> SearchInput[검색어 입력]
    SearchInput --> SearchType{검색 유형 자동 감지}
    
    SearchType -->|도서명/저자| BookResults[도서 결과]
    SearchType -->|독후감 키워드| ReviewResults[독후감 결과]
    SearchType -->|사용자명| UserResults[사용자 결과]
    SearchType -->|혼합 키워드| MixedResults[통합 결과]
    
    BookSearch --> BookSearchInput[도서 전용 검색]
    BookSearchInput --> ServerDB{서버 DB 검색}
    
    ServerDB -->|검색 성공| DBBookResults[DB 도서 결과]
    ServerDB -->|결과 없음| KakaoAPI{카카오 API 검색}
    
    KakaoAPI -->|검색 성공| APIBookResults[API 도서 결과]
    APIBookResults --> SaveNewBooks[새 도서 DB 저장]
    SaveNewBooks --> CombinedResults[통합 검색 결과]
    
    DBBookResults --> CombinedResults
    CombinedResults --> ShowResults[검색 결과 표시]
    
    KakaoAPI -->|결과 없음| NoResults[검색 결과 없음]
    NoResults --> ManualAdd[수동 추가 제안]
    
    BookResults --> ShowBookResults[도서 검색 결과]
    ReviewResults --> ShowReviewResults[독후감 검색 결과]
    UserResults --> ShowUserResults[사용자 검색 결과]
    MixedResults --> ShowMixedResults[통합 검색 결과]
    
    ShowBookResults --> SelectResult[결과 선택]
    ShowReviewResults --> SelectResult
    ShowUserResults --> SelectResult
    ShowMixedResults --> SelectResult
    ShowResults --> SelectResult
    
    SelectResult --> ResultType{결과 유형}
    ResultType -->|도서| BookPage[도서 상세 페이지]
    ResultType -->|독후감| ReviewPage[독후감 상세 페이지]
    ResultType -->|사용자| UserProfile[사용자 프로필]
    
    BookPage --> RelatedContent[관련 콘텐츠]
    RelatedContent --> Reviews[독후감 목록]
    RelatedContent --> BookInfo[도서 정보]
    RelatedContent --> SimilarBooks[유사 도서]
```

## 검색 기능 상세

### 다양한 검색 방법
- **키워드 검색 (제목/저자)**:
  - 한글/영어 통합 검색
  - 초성 검색 지원
  - 오타 교정 기능
  - 동의어/유의어 처리

- **태그/장르별 필터링**:
  - 사전 정의된 장르 카테고리
  - 사용자 생성 태그
  - 복합 태그 검색
  - 인기 태그 자동완성

- **최근 활동 (24시간 내 독후감 작성된 도서)**:
  - 실시간 활동 반영
  - 트렌딩 도서 식별
  - 커뮤니티 관심도 기반

- **이달의 인기 (이달 좋아요 최다 독후감의 도서)**:
  - 월별 통계 기반
  - 좋아요, 댓글, 조회수 종합 점수
  - 계절별/이벤트별 특별 큐레이션

### 명확한 정렬 옵션
- **작성일 최신순** (CREATE_DATE DESC): 최신 트렌드 파악
- **좋아요 많은 순** (LIKE_COUNT DESC): 인기 독후감 우선
- **댓글 많은 순** (COMMENT_COUNT DESC): 활발한 토론 우선
- **관련도순**: 검색 키워드와의 매칭 점수
- **평점순**: 독후감 평균 평점 기준

### 도서별 독후감 집계
- 한 도서에 대한 모든 독후감을 한 곳에서 확인
- 다양한 관점과 의견 비교 가능
- 독후감 통계 (평균 평점, 추천 비율 등)

### 중복 작성 선택
- **이미 작성한 경우**: 새로 작성 또는 기존 수정 선택 가능
- **재독 지원**: 시간 경과 후 다른 감상 등 지원
- **버전 관리**: 수정 이력 추적

### 통합 검색 시스템
- **자동 유형 감지**:
  - 도서명/저자명 패턴 인식
  - 사용자명 (@기호 또는 프로필 패턴)
  - 독후감 키워드 (일반 텍스트)

- **검색 결과 통합**:
  - 관련도 기반 정렬
  - 유형별 탭 구분
  - 무한 스크롤 지원

- **고급 검색 옵션**:
  - 기간 필터 (최근 1주일, 1개월, 1년)
  - 평점 범위 필터
  - 독후감 길이 필터 (짧은글/긴글)
  - 작성자 팔로우 여부

### 성능 최적화
- **검색 결과 캐싱**: 인기 검색어 결과 사전 캐시
- **자동완성**: 입력과 동시에 실시간 제안
- **검색 히스토리**: 개인별 최근 검색어 저장
- **인기 검색어**: 실시간 트렌딩 검색어 표시