# 도서 검색 시스템 사용자 흐름도

## 1. 전체 시스템 플로우

```mermaid
flowchart TD
    Start[독후감 작성 화면 진입] --> BookSelector[도서 선택 컴포넌트]
    BookSelector --> CheckRecent{최근 선택 도서 있음?}
    
    CheckRecent -->|Yes| ShowRecent[최근 선택 도서 표시]
    CheckRecent -->|No| ShowTabs[탭 네비게이션 표시]
    ShowRecent --> UserChoice1{사용자 선택}
    UserChoice1 -->|최근 도서 선택| BookSelected[도서 선택 완료]
    UserChoice1 -->|새로 검색| ShowTabs
    
    ShowTabs --> Tab1[커뮤니티 도서 탭]
    ShowTabs --> Tab2[도서 검색 탭]
    ShowTabs --> Tab3[직접 입력 탭]
    
    %% 각 탭의 결과는 도서 선택으로 연결
    Tab1 --> BookSelected
    Tab2 --> BookSelected
    Tab3 --> BookSelected
    
    BookSelected --> End[독후감 작성 화면으로 이동]
```

## 2. 상세 탭별 플로우

### 2.1 커뮤니티 도서 탭 플로우

```mermaid
flowchart TD
    CommunityTab[커뮤니티 도서 탭 선택] --> ShowSearchInput1[검색창 표시]
    ShowSearchInput1 --> UserInput1{사용자 입력}
    
    UserInput1 -->|검색어 입력| DebounceWait1[500ms 대기]
    UserInput1 -->|검색어 삭제| ClearResults1[검색 결과 초기화]
    
    DebounceWait1 --> ValidateInput1{검색어 길이 ≥ 2?}
    ValidateInput1 -->|No| ShowMinLength1[최소 2글자 안내]
    ValidateInput1 -->|Yes| CallCommunityAPI[커뮤니티 API 호출]
    
    CallCommunityAPI --> LoadingState1[로딩 스피너 표시]
    LoadingState1 --> APIResult1{API 결과}
    
    APIResult1 -->|성공 & 결과 있음| ShowResults1[검색 결과 목록 표시]
    APIResult1 -->|성공 & 결과 없음| NoResults1[결과 없음 안내]
    APIResult1 -->|실패| ErrorState1[오류 메시지 표시]
    
    ShowResults1 --> UserScroll1{사용자 스크롤}
    UserScroll1 -->|하단 도달| CheckMore1{더 많은 결과 있음?}
    CheckMore1 -->|Yes| LoadMore1[다음 페이지 로드]
    CheckMore1 -->|No| ShowEndMessage1[마지막 페이지 안내]
    LoadMore1 --> ShowResults1
    
    ShowResults1 --> UserSelect1[도서 선택]
    UserSelect1 --> UpdateRecent1[최근 선택 목록 업데이트]
    UpdateRecent1 --> ShowToast1[선택 완료 토스트]
    
    NoResults1 --> SuggestOtherTabs1[다른 탭 추천]
    SuggestOtherTabs1 --> UserChoice2{사용자 선택}
    UserChoice2 -->|카카오 검색| KakaoTab[도서 검색 탭으로 이동]
    UserChoice2 -->|직접 입력| ManualTab[직접 입력 탭으로 이동]
    UserChoice2 -->|재검색| UserInput1
```

### 2.2 도서 검색 (카카오 API) 탭 플로우

```mermaid
flowchart TD
    KakaoTab[도서 검색 탭 선택] --> ShowSearchInput2[검색창 표시]
    ShowSearchInput2 --> UserInput2{사용자 입력}
    
    UserInput2 -->|검색어 입력| DebounceWait2[500ms 대기]
    UserInput2 -->|검색어 삭제| ClearResults2[검색 결과 초기화]
    
    DebounceWait2 --> ValidateInput2{검색어 길이 ≥ 2?}
    ValidateInput2 -->|No| ShowMinLength2[최소 2글자 안내]
    ValidateInput2 -->|Yes| CallKakaoAPI[카카오 API 호출]
    
    CallKakaoAPI --> LoadingState2[로딩 스피너 표시]
    LoadingState2 --> APIResult2{API 결과}
    
    APIResult2 -->|성공 & 결과 있음| ShowResults2[검색 결과 목록 표시]
    APIResult2 -->|성공 & 결과 없음| NoResults2[결과 없음 안내]
    APIResult2 -->|API 한도 초과| QuotaExceeded[한도 초과 안내]
    APIResult2 -->|네트워크 오류| NetworkError[네트워크 오류 안내]
    APIResult2 -->|기타 오류| ErrorState2[오류 메시지 표시]
    
    ShowResults2 --> AddBadge[새 도서 뱃지 표시]
    AddBadge --> UserScroll2{사용자 스크롤}
    UserScroll2 -->|하단 도달| CheckMore2{더 많은 결과 있음?}
    CheckMore2 -->|Yes| LoadMore2[다음 페이지 로드]
    CheckMore2 -->|No| ShowEndMessage2[마지막 페이지 안내]
    LoadMore2 --> ShowResults2
    
    ShowResults2 --> UserSelect2[도서 선택]
    UserSelect2 --> ShowSaveConfirm[커뮤니티 추가 확인]
    ShowSaveConfirm --> SaveToDB[커뮤니티 DB에 저장]
    SaveToDB --> SaveResult{저장 결과}
    
    SaveResult -->|성공| UpdateRecent2[최근 선택 목록 업데이트]
    SaveResult -->|실패| SaveError[저장 실패 안내]
    UpdateRecent2 --> ShowToast2[커뮤니티 추가 완료 토스트]
    
    SaveError --> RetryOption{재시도 선택}
    RetryOption -->|재시도| SaveToDB
    RetryOption -->|취소| ShowResults2
    
    QuotaExceeded --> SuggestManual[직접 입력 탭 추천]
    NetworkError --> RetryButton[재시도 버튼 표시]
    RetryButton --> CallKakaoAPI
```

### 2.3 직접 입력 탭 플로우

```mermaid
flowchart TD
    ManualTab[직접 입력 탭 선택] --> ShowForm[입력 폼 표시]
    ShowForm --> FormFields[제목/저자/출판사/장르 입력칸]
    
    FormFields --> UserTyping{사용자 입력}
    UserTyping -->|제목 입력| ValidateTitle[제목 유효성 검증]
    UserTyping -->|저자 입력| ValidateAuthor[저자 유효성 검증]
    UserTyping -->|출판사 입력| ValidatePublisher[출판사 유효성 검증]
    UserTyping -->|장르 입력| ValidateGenre[장르 유효성 검증]
    
    ValidateTitle --> TitleResult{제목 검증 결과}
    TitleResult -->|유효| ClearTitleError[제목 오류 메시지 제거]
    TitleResult -->|무효| ShowTitleError[제목 오류 메시지 표시]
    
    ValidateAuthor --> AuthorResult{저자 검증 결과}
    AuthorResult -->|유효| ClearAuthorError[저자 오류 메시지 제거]
    AuthorResult -->|무효| ShowAuthorError[저자 오류 메시지 표시]
    
    ValidatePublisher --> PublisherResult{출판사 검증 결과}
    PublisherResult -->|유효| ClearPublisherError[출판사 오류 메시지 제거]
    PublisherResult -->|무효| ShowPublisherError[출판사 오류 메시지 표시]
    
    ValidateGenre --> GenreResult{장르 검증 결과}
    GenreResult -->|유효| ClearGenreError[장르 오류 메시지 제거]
    GenreResult -->|무효| ShowGenreError[장르 오류 메시지 표시]
    
    %% 폼 제출
    FormFields --> SubmitAttempt{등록 버튼 클릭}
    SubmitAttempt --> ValidateAll[전체 폼 유효성 검증]
    ValidateAll --> AllValid{모든 필드 유효?}
    
    AllValid -->|No| ShowValidationErrors[유효성 오류 메시지 표시]
    AllValid -->|Yes| CheckDuplicate[중복 도서 확인]
    
    CheckDuplicate --> DuplicateResult{중복 확인 결과}
    DuplicateResult -->|중복 발견| ShowDuplicateWarning[중복 경고 표시]
    DuplicateResult -->|중복 없음| SubmitForm[폼 제출]
    
    ShowDuplicateWarning --> UserChoice3{사용자 선택}
    UserChoice3 -->|계속 진행| SubmitForm
    UserChoice3 -->|수정| FormFields
    UserChoice3 -->|취소| FormFields
    
    SubmitForm --> SubmittingState[제출 중 상태 표시]
    SubmittingState --> SubmitResult{제출 결과}
    
    SubmitResult -->|성공| SaveSuccess[저장 성공]
    SubmitResult -->|실패| SaveFailed[저장 실패 안내]
    
    SaveSuccess --> UpdateRecent3[최근 선택 목록 업데이트]
    UpdateRecent3 --> ShowToast3[등록 완료 토스트]
    ShowToast3 --> ClearForm[폼 초기화]
    
    SaveFailed --> RetrySubmit{재시도 선택}
    RetrySubmit -->|재시도| SubmitForm
    RetrySubmit -->|수정| FormFields
```

## 3. 공통 상호작용 플로우

### 3.1 탭 전환 플로우

```mermaid
flowchart TD
    CurrentTab[현재 탭에서 작업 중] --> TabClick[다른 탭 클릭]
    TabClick --> SaveState[현재 탭 상태 저장]
    SaveState --> CheckTargetState{대상 탭 상태 존재?}
    
    CheckTargetState -->|존재| RestoreState[저장된 상태 복원]
    CheckTargetState -->|없음| InitializeState[초기 상태로 설정]
    
    RestoreState --> ShowTargetTab[대상 탭 화면 표시]
    InitializeState --> ShowTargetTab
    
    ShowTargetTab --> TabTransition[탭 전환 애니메이션]
    TabTransition --> UpdateActiveTab[활성 탭 상태 업데이트]
```

### 3.2 오류 처리 플로우

```mermaid
flowchart TD
    APICall[API 호출] --> CheckError{오류 발생?}
    CheckError -->|No| Success[성공 처리]
    CheckError -->|Yes| ErrorType{오류 유형}
    
    ErrorType -->|네트워크 오류| NetworkErrorHandler[네트워크 오류 처리]
    ErrorType -->|서버 오류| ServerErrorHandler[서버 오류 처리]
    ErrorType -->|인증 오류| AuthErrorHandler[인증 오류 처리]
    ErrorType -->|유효성 오류| ValidationErrorHandler[유효성 오류 처리]
    ErrorType -->|기타 오류| GenericErrorHandler[일반 오류 처리]
    
    NetworkErrorHandler --> ShowRetryOption[재시도 옵션 표시]
    ServerErrorHandler --> ShowServerError[서버 오류 메시지 표시]
    AuthErrorHandler --> ShowAuthError[인증 오류 메시지 표시]
    ValidationErrorHandler --> ShowValidationError[유효성 오류 메시지 표시]
    GenericErrorHandler --> ShowGenericError[일반 오류 메시지 표시]
    
    ShowRetryOption --> UserRetry{사용자 재시도 선택}
    UserRetry -->|재시도| APICall
    UserRetry -->|취소| ErrorResolved[오류 처리 완료]
    
    ShowServerError --> ErrorResolved
    ShowAuthError --> ErrorResolved
    ShowValidationError --> ErrorResolved
    ShowGenericError --> ErrorResolved
```

## 4. 성능 최적화 플로우

### 4.1 무한 스크롤 최적화

```mermaid
flowchart TD
    ScrollDetection[스크롤 감지] --> ThrottleCheck[스로틀링 체크]
    ThrottleCheck --> WithinThrottle{스로틀 시간 내?}
    
    WithinThrottle -->|Yes| IgnoreScroll[스크롤 이벤트 무시]
    WithinThrottle -->|No| CheckPosition[스크롤 위치 확인]
    
    CheckPosition --> NearBottom{하단 근처?}
    NearBottom -->|No| UpdateThrottle[스로틀 시간 업데이트]
    NearBottom -->|Yes| CheckLoadingState{로딩 중?}
    
    CheckLoadingState -->|Yes| UpdateThrottle
    CheckLoadingState -->|No| CheckHasMore{더 많은 데이터?}
    
    CheckHasMore -->|No| UpdateThrottle
    CheckHasMore -->|Yes| TriggerLoad[다음 페이지 로드 트리거]
    
    TriggerLoad --> SetLoadingState[로딩 상태 설정]
    SetLoadingState --> LoadNextPage[다음 페이지 데이터 로드]
    LoadNextPage --> AppendData[데이터 추가]
    AppendData --> UpdatePagination[페이지네이션 상태 업데이트]
    UpdatePagination --> ClearLoadingState[로딩 상태 해제]
```

### 4.2 캐싱 및 상태 관리

```mermaid
flowchart TD
    UserAction[사용자 액션] --> CheckCache{캐시 존재?}
    CheckCache -->|Yes| ValidateCache{캐시 유효?}
    CheckCache -->|No| FetchData[새 데이터 요청]
    
    ValidateCache -->|Valid| UseCachedData[캐시된 데이터 사용]
    ValidateCache -->|Invalid| InvalidateCache[캐시 무효화]
    InvalidateCache --> FetchData
    
    FetchData --> APICall[API 호출]
    APICall --> StoreInCache[캐시에 저장]
    StoreInCache --> UseFreshData[새 데이터 사용]
    
    UseCachedData --> RenderUI[UI 렌더링]
    UseFreshData --> RenderUI
    
    RenderUI --> UpdateStateHistory[상태 히스토리 업데이트]
    UpdateStateHistory --> OptimizeMemory[메모리 최적화]
```

이 사용자 흐름도는 새로운 탭 기반 도서 검색 시스템의 모든 시나리오를 상세히 다루며, 사용자 경험과 시스템 동작을 명확히 정의합니다.