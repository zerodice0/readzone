# ReadZone 사용자 흐름도

## 개요
ReadZone 서비스의 주요 사용자 여정과 상호작용 흐름을 정리한 문서입니다.

## 1. 신규 사용자 여정 (User Onboarding Flow)

```mermaid
flowchart TD
    Start([사용자 방문]) --> MainFeed[메인 피드 페이지]
    MainFeed --> ReadOnly{비로그인 상태}
    
    ReadOnly -->|읽기 가능| BrowseReviews[독후감 둘러보기]
    BrowseReviews --> TryInteraction{상호작용 시도}
    
    TryInteraction -->|좋아요 클릭| LoginPrompt[로그인 필요 알림]
    TryInteraction -->|댓글 작성| LoginPrompt
    TryInteraction -->|독후감 작성| LoginPrompt
    
    LoginPrompt --> LoginPage[로그인 페이지]
    LoginPage --> ServiceIntro[서비스 소개 확인]
    ServiceIntro --> SignupChoice{회원가입 선택}
    
    SignupChoice -->|회원가입| RegisterPage[회원가입 페이지]
    RegisterPage --> InputInfo[정보 입력]
    InputInfo --> EmailVerification[이메일 인증]
    EmailVerification --> VerifyEmail[이메일 확인]
    VerifyEmail --> LoginSuccess[로그인 성공]
    
    SignupChoice -->|로그인| LoginProcess[로그인 시도]
    LoginProcess --> LoginSuccess
    
    LoginSuccess --> AuthenticatedFeed[인증된 피드 접근]
    AuthenticatedFeed --> FullFeatures[전체 기능 사용 가능]
```

### 주요 포인트
- **비로그인 접근성**: 독후감 읽기는 로그인 없이 가능
- **점진적 참여 유도**: 상호작용 시점에서 로그인 유도
- **서비스 이해**: 로그인 페이지에서 서비스 가치 전달

## 2. 독후감 작성 흐름 (Review Creation Flow)

```mermaid
flowchart TD
    Start([로그인한 사용자]) --> FloatingButton[플로팅 작성 버튼 클릭]
    FloatingButton --> WritePage[독후감 작성 페이지]
    
    WritePage --> BookSearchInput[도서 제목/저자 입력]
    BookSearchInput --> ServerDB{서버 DB 검색}
    
    ServerDB -->|검색 성공| DBResults[DB 검색 결과]
    DBResults --> SelectBook[도서 선택]
    
    ServerDB -->|결과 없음| KakaoAPI{카카오 API 검색}
    KakaoAPI -->|검색 성공| APIResults[API 검색 결과]
    APIResults --> SaveToDB[DB에 도서 정보 저장]
    SaveToDB --> SelectBook
    
    KakaoAPI -->|결과 없음| ManualEntry[수동 입력 옵션 제공]
    ManualEntry --> InputBookInfo[도서 정보 직접 입력]
    InputBookInfo --> CreateBook[새 도서 생성]
    CreateBook --> SelectBook
    
    SelectBook --> WriteReview[독후감 작성]
    WriteReview --> MarkdownEditor[마크다운 에디터]
    
    MarkdownEditor --> AddDetails{상세 정보 추가}
    AddDetails --> RecommendChoice[추천/비추천 선택]
    AddDetails --> AddTags[해시태그 추가]
    AddDetails --> AddPurchaseLink[구매 링크 추가 - 선택사항]
    
    RecommendChoice --> AutoSave[자동 임시저장]
    AddTags --> AutoSave
    AddPurchaseLink --> AutoSave
    
    AutoSave --> PublishReview{게시하기}
    PublishReview -->|성공| ReviewDetail[독후감 상세 페이지]
    PublishReview -->|실패| ErrorHandling[에러 처리]
    
    ReviewDetail --> ShareOptions[공유 옵션]
    ShareOptions --> ExternalShare[외부 SNS 공유]
```

### 주요 기능
- **3단계 도서 검색**: 
  1. 서버 DB 우선 검색 (기존 등록 도서)
  2. 카카오 API 검색 (미등록 도서)
  3. 수동 입력 (API에도 없는 도서)
- **자동 저장**: 작성 중 데이터 손실 방지
- **풍부한 콘텐츠**: 마크다운, 태그, 구매 링크

## 3. 도서 의견 작성 흐름 (Book Opinion Flow)

```mermaid
flowchart TD
    Start([로그인한 사용자]) --> SearchBook[도서 검색 페이지]
    SearchBook --> FindBook[원하는 도서 찾기]
    FindBook --> BookDetail[도서 상세 페이지]
    
    BookDetail --> ViewOpinions[기존 의견 확인]
    ViewOpinions --> CheckExisting{내 의견 있음?}
    
    CheckExisting -->|없음| WriteOpinion[의견 작성]
    CheckExisting -->|있음| EditOpinion[의견 수정]
    
    WriteOpinion --> Input280[280자 의견 입력]
    Input280 --> ChooseRecommend[추천/비추천 선택]
    ChooseRecommend --> SubmitOpinion[의견 제출]
    
    EditOpinion --> ModifyText[내용 수정]
    ModifyText --> SubmitOpinion
    
    SubmitOpinion --> UpdateStats[통계 업데이트]
    UpdateStats --> ShowInFeed[의견 피드에 표시]
```

### 제약사항
- **1인 1의견**: 도서당 사용자별 하나의 의견만 가능
- **글자 수 제한**: 280자 이내로 간결하게
- **수정 가능**: 기존 의견 수정 허용

## 4. 소셜 상호작용 흐름 (Social Interaction Flow)

```mermaid
flowchart TD
    Start([피드 탐색]) --> ReviewCard[독후감 카드]
    
    ReviewCard --> Actions{상호작용}
    Actions -->|좋아요| LikeToggle[좋아요 토글]
    Actions -->|댓글| CommentSection[댓글 섹션]
    Actions -->|공유| ShareMenu[공유 메뉴]
    Actions -->|더보기| FullReview[전체 독후감]
    
    LikeToggle --> UpdateLikeCount[좋아요 수 업데이트]
    UpdateLikeCount --> AnimateHeart[하트 애니메이션]
    
    CommentSection --> WriteComment[댓글 작성]
    WriteComment --> SubmitComment[댓글 게시]
    SubmitComment --> NotifyAuthor[작성자 알림]
    
    CommentSection --> ReplyComment[답글 작성]
    ReplyComment --> SubmitReply[답글 게시]
    
    ShareMenu --> ShareOptions{공유 옵션}
    ShareOptions -->|링크 복사| CopyLink[클립보드 복사]
    ShareOptions -->|카카오톡| KakaoShare[카카오 공유]
    ShareOptions -->|X| TwitterShare[X 공유]
    
    FullReview --> ReadFull[전체 내용 읽기]
    ReadFull --> PurchaseLink{구매 링크?}
    PurchaseLink -->|있음| TrackClick[클릭 추적]
    TrackClick --> ExternalSite[외부 사이트]
```

## 5. 프로필 및 활동 관리 흐름 (Profile Management Flow)

```mermaid
flowchart TD
    Start([로그인 상태]) --> UserMenu[사용자 메뉴]
    
    UserMenu --> Options{선택}
    Options -->|내 프로필| MyProfile[프로필 페이지]
    Options -->|설정| Settings[설정 페이지]
    Options -->|로그아웃| Logout[로그아웃]
    
    MyProfile --> ViewStats[활동 통계 확인]
    ViewStats --> MyContent{내 콘텐츠}
    MyContent -->|독후감| MyReviews[작성한 독후감]
    MyContent -->|의견| MyOpinions[작성한 의견]
    
    MyReviews --> ManageReview{관리}
    ManageReview -->|수정| EditReview[독후감 수정]
    ManageReview -->|삭제| DeleteReview[독후감 삭제]
    
    Settings --> ProfileEdit[프로필 편집]
    ProfileEdit --> UpdateInfo{정보 수정}
    UpdateInfo -->|닉네임| ChangeNickname[닉네임 변경]
    UpdateInfo -->|자기소개| ChangeBio[자기소개 수정]
    UpdateInfo -->|비밀번호| ChangePassword[비밀번호 변경]
    
    Settings --> NotificationSettings[알림 설정]
    Settings --> AccountDelete[계정 삭제]
```

## 6. 검색 및 발견 흐름 (Discovery Flow)

```mermaid
flowchart TD
    Start([사용자]) --> SearchEntry{검색 진입점}
    
    SearchEntry -->|헤더 검색| GlobalSearch[통합 검색]
    SearchEntry -->|도서 검색| BookSearch[도서 검색 페이지]
    
    GlobalSearch --> SearchType{검색 유형}
    SearchType -->|도서| BookResults[도서 결과]
    SearchType -->|독후감| ReviewResults[독후감 결과]
    SearchType -->|사용자| UserResults[사용자 결과]
    
    BookSearch --> SearchInput[검색어 입력]
    SearchInput --> ServerDB{서버 DB 검색}
    
    ServerDB -->|검색 성공| DBBookResults[DB 도서 결과]
    ServerDB -->|결과 없음| KakaoAPI{카카오 API 검색}
    
    KakaoAPI -->|검색 성공| APIBookResults[API 도서 결과]
    APIBookResults --> SaveNewBooks[새 도서 DB 저장]
    SaveNewBooks --> CombinedResults[통합 검색 결과]
    
    DBBookResults --> CombinedResults
    CombinedResults --> ShowResults[검색 결과 표시]
    
    KakaoAPI -->|결과 없음| NoResults[검색 결과 없음]
    NoResults --> ManualAdd[수동 추가 제안]
    
    ShowResults --> SelectResult[결과 선택]
    SelectResult --> BookPage[도서 상세 페이지]
    BookPage --> RelatedContent[관련 콘텐츠]
    RelatedContent --> Reviews[독후감 목록]
    RelatedContent --> Opinions[의견 목록]
```

## 7. 오류 처리 및 복구 흐름 (Error Handling Flow)

```mermaid
flowchart TD
    Start([사용자 액션]) --> Action{액션 유형}
    
    Action -->|네트워크 요청| NetworkRequest[API 호출]
    NetworkRequest --> CheckResponse{응답 확인}
    
    CheckResponse -->|성공| Success[정상 처리]
    CheckResponse -->|실패| ErrorType{에러 유형}
    
    ErrorType -->|네트워크| NetworkError[연결 오류]
    ErrorType -->|인증| AuthError[인증 만료]
    ErrorType -->|검증| ValidationError[입력 오류]
    ErrorType -->|서버| ServerError[서버 오류]
    
    NetworkError --> RetryPrompt[재시도 안내]
    AuthError --> ReLogin[재로그인 유도]
    ValidationError --> ShowMessage[오류 메시지]
    ServerError --> FallbackUI[대체 UI]
    
    Action -->|자동저장| AutoSave[임시 저장]
    AutoSave --> SaveLocal[로컬 저장]
    SaveLocal --> Recovery{복구 필요?}
    Recovery -->|예| RestoreDraft[임시저장 복원]
```

## 주요 사용자 시나리오

### 시나리오 1: 첫 방문자의 회원가입
1. 메인 페이지 방문 → 독후감 둘러보기
2. 좋아요 클릭 시도 → 로그인 필요 알림
3. 로그인 페이지 → 서비스 소개 확인
4. 회원가입 선택 → 정보 입력
5. 이메일 인증 → 서비스 이용 시작

### 시나리오 2: 독후감 작성
1. 플로팅 버튼 클릭 → 작성 페이지
2. 도서 검색 → 원하는 책 선택
3. 마크다운으로 독후감 작성
4. 추천/비추천 선택 및 태그 추가
5. 게시 → 피드에 즉시 반영

### 시나리오 3: 도서 탐색 및 의견
1. 도서 검색 → 관심 도서 찾기
2. 도서 상세 페이지 → 다른 사람들 의견 확인
3. 280자 의견 작성 → 추천/비추천 표시
4. 관련 독후감 확인 → 상세 읽기

## 접근성 고려사항

### 모바일 최적화
- 터치 친화적 인터페이스
- 스와이프 제스처 지원
- 반응형 레이아웃

### 오프라인 지원
- 읽은 독후감 캐싱
- 작성 중 내용 로컬 저장
- 네트워크 복구 시 자동 동기화

### 성능 최적화
- 이미지 지연 로딩
- 무한 스크롤 가상화
- 검색 결과 캐싱