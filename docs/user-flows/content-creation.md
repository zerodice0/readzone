# 2. 독후감 작성 흐름 (Content Creation Flow)

## 2-1. 기본 작성 흐름

```mermaid
flowchart TD
    Start([로그인한 사용자]) --> WriteButton[작성 버튼 클릭]
    WriteButton --> WritePage[독후감 작성 페이지]
    
    WritePage --> BookSearchInput[도서 검색을 위한 키워드 입력]
    BookSearchInput --> ServerDB{서버 DB 검색}
    
    ServerDB -->|검색 성공| DBResults[DB 검색 결과]
    DBResults --> SelectBook[도서 선택]
    
    ServerDB -->|결과 없음| KakaoAPI{카카오 API 검색}
    KakaoAPI -->|검색 성공| APIResults[API 검색 결과]
    APIResults --> SelectBook
    
    KakaoAPI -->|결과 없음| ManualEntry[수동 입력 옵션 제공]
    ManualEntry --> InputBookInfo[도서 정보 직접 입력]
    InputBookInfo --> CreateBook[새 도서 생성]
    CreateBook --> SelectBook
    
    SelectBook --> MarkdownEditor[마크다운 에디터 표시]
    MarkdownEditor --> StartAutoSave[자동저장 시작]
    StartAutoSave --> WriteReview[독후감 내용 작성]
    
    WriteReview --> AddDetails{상세 정보 추가}
    AddDetails --> RecommendChoice[추천/비추천 선택]
    AddDetails --> AddTags[해시태그 추가]
    AddDetails --> AddBookStores[도서 구매 정보 자동 생성]
    
    RecommendChoice --> PublishReview{게시하기}
    AddTags --> PublishReview
    AddBookStores --> PublishReview
    
    PublishReview -->|성공| SaveBookIfNew[새 도서인 경우 DB 저장]
    SaveBookIfNew --> ReviewDetail[독후감 상세 페이지]
    PublishReview -->|실패| ErrorHandling[에러 처리]
    
    ReviewDetail --> ShareOptions[공유 옵션]
    ShareOptions --> ExternalShare[외부 SNS 공유]
    ReviewDetail --> ViewMyReviews[내 독후감 보기]
    ViewMyReviews --> MyReviews[작성한 독후감]
```

## 2-2. 임시저장 및 자동저장 흐름

```mermaid
flowchart TD
    StartAutoSave[자동저장 시작] --> InitTimer[30초 타이머 설정]
    InitTimer --> UserTyping[사용자 입력 감지]
    
    UserTyping --> CheckContentChange{내용 변경 확인}
    CheckContentChange -->|변경됨| ResetTimer[타이머 리셋]
    CheckContentChange -->|변경 없음| ContinueTimer[타이머 계속]
    
    ResetTimer --> TimerExpired{30초 경과}
    ContinueTimer --> TimerExpired
    
    TimerExpired -->|Yes| AutoSaveContent[자동저장 실행]
    TimerExpired -->|No| UserTyping
    
    AutoSaveContent --> SaveToLocalStorage[로컬 스토리지 저장]
    SaveToLocalStorage --> SaveToServer[서버 임시저장]
    SaveToServer --> SaveResult{저장 결과}
    
    SaveResult -->|성공| ShowSaveIndicator[저장 완료 표시]
    SaveResult -->|실패| ShowSaveError[저장 실패 표시]
    
    ShowSaveIndicator --> ResetTimer
    ShowSaveError --> RetryAutoSave[재시도]
    RetryAutoSave --> SaveToServer
    
    UserTyping --> PageLeaveAttempt{페이지 이탈 시도}
    PageLeaveAttempt -->|감지| CheckUnsavedChanges{저장되지 않은 변경사항}
    
    CheckUnsavedChanges -->|있음| ShowLeaveConfirm[이탈 확인 다이얼로그]
    CheckUnsavedChanges -->|없음| AllowLeave[페이지 이탈 허용]
    
    ShowLeaveConfirm --> UserLeaveChoice{사용자 선택}
    UserLeaveChoice -->|저장 후 이탈| FinalSave[최종 저장]
    UserLeaveChoice -->|저장 안함| DiscardAndLeave[변경사항 버리고 이탈]
    UserLeaveChoice -->|취소| CancelLeave[이탈 취소]
    
    FinalSave --> SaveToServer
    DiscardAndLeave --> ClearLocalStorage[로컬 저장소 정리]
    ClearLocalStorage --> AllowLeave
    CancelLeave --> UserTyping
```

## 2-3. 임시저장 복구 흐름

```mermaid
flowchart TD
    WritePage[독후감 작성 페이지 진입] --> CheckDraftExists{임시저장 확인}
    
    CheckDraftExists -->|로컬 임시저장 있음| CheckServerDraft{서버 임시저장 확인}
    CheckDraftExists -->|임시저장 없음| StartFreshEditor[새 에디터 시작]
    
    CheckServerDraft -->|서버에 더 최신| UseServerDraft[서버 임시저장 사용]
    CheckServerDraft -->|로컬이 더 최신| UseLocalDraft[로컬 임시저장 사용]
    CheckServerDraft -->|서버 임시저장 없음| UseLocalDraft
    
    UseServerDraft --> ShowRecoveryMessage[복구 안내 메시지]
    UseLocalDraft --> ShowRecoveryMessage
    
    ShowRecoveryMessage --> UserRecoveryChoice{복구 선택}
    UserRecoveryChoice -->|복구| LoadDraftContent[임시저장 내용 불러오기]
    UserRecoveryChoice -->|새로 작성| ClearDrafts[임시저장 삭제]
    UserRecoveryChoice -->|비교 보기| ShowDraftComparison[임시저장 비교]
    
    LoadDraftContent --> PopulateEditor[에디터에 내용 채우기]
    PopulateEditor --> StartAutoSave[자동저장 재시작]
    
    ClearDrafts --> DeleteLocalDraft[로컬 임시저장 삭제]
    DeleteLocalDraft --> DeleteServerDraft[서버 임시저장 삭제]
    DeleteServerDraft --> StartFreshEditor
    
    ShowDraftComparison --> ComparisonView[비교 뷰 표시]
    ComparisonView --> SelectDraftVersion{버전 선택}
    SelectDraftVersion -->|서버 버전| UseServerDraft
    SelectDraftVersion -->|로컬 버전| UseLocalDraft
    SelectDraftVersion -->|병합| MergeDrafts[수동 병합]
    
    MergeDrafts --> PopulateEditor
    StartFreshEditor --> StartAutoSave
```

## 2-4. 마크다운 에디터 상세 기능

```mermaid
flowchart TD
    MarkdownEditor[마크다운 에디터] --> EditorFeatures{에디터 기능}
    
    EditorFeatures -->|텍스트 입력| TextInput[텍스트 작성]
    EditorFeatures -->|이미지 업로드| ImageUpload[이미지 업로드]
    EditorFeatures -->|미리보기| PreviewToggle[미리보기 토글]
    EditorFeatures -->|도움말| MarkdownHelp[마크다운 도움말]
    
    TextInput --> SyntaxHighlight[구문 강조]
    SyntaxHighlight --> AutoComplete[자동 완성]
    
    ImageUpload --> ValidateImage{이미지 검증}
    ValidateImage -->|유효| UploadToServer[서버 업로드]
    ValidateImage -->|무효| ShowImageError[이미지 오류]
    
    UploadToServer --> InsertImageMarkdown[마크다운 링크 삽입]
    ShowImageError --> RetryUpload[재업로드 옵션]
    
    PreviewToggle --> RenderMarkdown[마크다운 렌더링]
    RenderMarkdown --> ShowPreview[미리보기 표시]
    
    MarkdownHelp --> ShowHelpModal[도움말 모달]
    ShowHelpModal --> SyntaxExamples[구문 예제]
    
    AutoComplete --> TagSuggestions[태그 자동완성]
    TagSuggestions --> UserTagHistory[사용자 태그 히스토리]
    UserTagHistory --> PopularTags[인기 태그]
```

## 주요 기능

### 기본 작성 기능
- **3단계 도서 검색**: 
  1. 서버 DB 우선 검색 (기존 등록 도서)
  2. 카카오 API 검색 (미등록 도서)
  3. 수동 입력 (API에도 없는 도서)
- **풍부한 콘텐츠**: 마크다운, 태그, 신뢰 서점 자동 연결
- **새 도서 저장**: 독후감 게시 시점에 DB 저장

### 임시저장 시스템
- **자동저장 주기**: 30초마다 또는 내용 변경 시
- **저장 위치**: 로컬 스토리지 + 서버 백업
- **복구 기능**: 
  - 페이지 재진입 시 자동 복구 제안
  - 로컬/서버 버전 비교 및 선택
  - 수동 병합 옵션 제공
- **페이지 이탈 보호**: 
  - 저장되지 않은 변경사항 감지
  - 이탈 확인 다이얼로그
  - 저장 후 이탈 옵션

### 마크다운 에디터
- **실시간 기능**:
  - 구문 강조 표시
  - 미리보기 토글 (분할/전체)
  - 이미지 드래그 앤 드롭 업로드
- **사용자 지원**:
  - 마크다운 도움말 및 예제
  - 태그 자동완성 (개인 히스토리 + 인기 태그)
  - 키보드 단축키 지원
- **이미지 처리**:
  - 파일 크기 제한 (최대 5MB)
  - 지원 형식: JPG, PNG, GIF, WebP
  - CDN 업로드 및 최적화