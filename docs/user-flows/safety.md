# 11. 커뮤니티 안전 및 신고 시스템 (Safety & Reporting Flow)

## 11-1. 신고 기능 흐름

```mermaid
flowchart TD
    ContentView[콘텐츠 보기] --> UserAction{사용자 액션}
    UserAction -->|신고 버튼 클릭| ShowReportMenu[신고 메뉴 표시]
    UserAction -->|더보기 메뉴| MoreOptions[더보기 옵션]
    
    MoreOptions --> ReportOption[신고하기 옵션]
    ReportOption --> ShowReportMenu
    
    ShowReportMenu --> ReportTypes{신고 유형 선택}
    ReportTypes -->|스팸/광고| SpamReport[스팸/광고 신고]
    ReportTypes -->|부적절한 콘텐츠| InappropriateContent[부적절한 콘텐츠]
    ReportTypes -->|괴롭힘/폭언| HarassmentReport[괴롭힘/폭언 신고]
    ReportTypes -->|저작권 침해| CopyrightReport[저작권 침해 신고]
    ReportTypes -->|가짜 정보| FakeInfoReport[가짜 정보 신고]
    ReportTypes -->|기타| OtherReport[기타 신고]
    
    SpamReport --> ReportDetails[신고 상세 내용]
    InappropriateContent --> ReportDetails
    HarassmentReport --> ReportDetails
    CopyrightReport --> CopyrightDetails[저작권 상세 정보]
    FakeInfoReport --> ReportDetails
    OtherReport --> CustomReportDetails[사용자 정의 신고 내용]
    
    ReportDetails --> OptionalDescription[추가 설명 (선택)]
    CopyrightDetails --> CopyrightEvidence[저작권 증빙 자료]
    CustomReportDetails --> RequiredDescription[상세 설명 (필수)]
    
    OptionalDescription --> SubmitReport[신고 제출]
    CopyrightEvidence --> SubmitReport
    RequiredDescription --> SubmitReport
    
    SubmitReport --> ValidateReport{신고 유효성 검증}
    ValidateReport -->|유효| SaveReport[신고 DB 저장]
    ValidateReport -->|무효| ShowValidationError[유효성 오류]
    
    SaveReport --> NotifyModerators[운영진 알림]
    NotifyModerators --> ShowReportConfirmation[신고 접수 확인]
    ShowReportConfirmation --> UpdateReportStatus[신고 상태 업데이트]
    
    ShowValidationError --> ReportTypes
```

## 11-2. 신고 처리 및 관리자 검토 흐름

```mermaid
flowchart TD
    NotifyModerators[운영진 알림] --> ModeratorReview[운영진 검토]
    ModeratorReview --> ReviewReport{신고 검토}
    
    ReviewReport -->|긴급| UrgentAction[긴급 조치]
    ReviewReport -->|일반| NormalReview[일반 검토]
    ReviewReport -->|자동 필터링| AutoFilter[자동 필터링]
    
    UrgentAction --> ImmediateAction{즉시 조치}
    ImmediateAction -->|콘텐츠 숨김| HideContent[콘텐츠 숨김 처리]
    ImmediateAction -->|계정 정지| SuspendAccount[계정 임시 정지]
    ImmediateAction -->|삭제| DeleteContent[콘텐츠 삭제]
    
    NormalReview --> DetailedInvestigation[상세 조사]
    DetailedInvestigation --> GatherEvidence[증거 수집]
    GatherEvidence --> CheckUserHistory[사용자 이력 확인]
    CheckUserHistory --> MakeDecision{처리 결정}
    
    AutoFilter --> AIContentAnalysis[AI 콘텐츠 분석]
    AIContentAnalysis --> AutoDecision{자동 판단}
    AutoDecision -->|위반 확실| AutoAction[자동 조치]
    AutoDecision -->|애매함| EscalateToHuman[인간 검토 이관]
    AutoDecision -->|문제없음| DismissReport[신고 기각]
    
    EscalateToHuman --> NormalReview
    
    MakeDecision -->|위반 확인| TakeAction[조치 실행]
    MakeDecision -->|위반 아님| DismissReport
    MakeDecision -->|경고| IssueWarning[경고 발송]
    
    TakeAction --> ActionTypes{조치 유형}
    ActionTypes -->|콘텐츠 삭제| DeleteContent
    ActionTypes -->|계정 정지| SuspendAccount
    ActionTypes -->|영구 차단| PermanentBan[영구 차단]
    ActionTypes -->|접근 제한| RestrictAccess[접근 제한]
    
    HideContent --> NotifyReporter[신고자 알림]
    DeleteContent --> NotifyReporter
    SuspendAccount --> NotifyTargetUser[대상 사용자 알림]
    PermanentBan --> NotifyTargetUser
    RestrictAccess --> NotifyTargetUser
    IssueWarning --> NotifyTargetUser
    DismissReport --> NotifyReporter
    
    NotifyReporter --> CloseReport[신고 종료]
    NotifyTargetUser --> CloseReport
    CloseReport --> UpdateStatistics[통계 업데이트]
```

## 11-3. 사용자 차단 기능 흐름

```mermaid
flowchart TD
    UserProfile[사용자 프로필 보기] --> ProfileActions{프로필 액션}
    ProfileActions -->|차단하기| ShowBlockConfirm[차단 확인 다이얼로그]
    ProfileActions -->|신고하기| ShowReportMenu[신고 메뉴]
    
    ShowBlockConfirm --> BlockConfirmation{차단 확인}
    BlockConfirmation -->|확인| ProcessBlock[차단 처리]
    BlockConfirmation -->|취소| CancelBlock[차단 취소]
    
    ProcessBlock --> AddToBlockList[차단 목록 추가]
    AddToBlockList --> HideUserContent[해당 사용자 콘텐츠 숨김]
    HideUserContent --> PreventInteraction[상호작용 차단]
    PreventInteraction --> ShowBlockSuccess[차단 완료 안내]
    
    ShowBlockSuccess --> UpdateFeed[피드 업데이트]
    UpdateFeed --> RemoveBlockedContent[차단된 사용자 콘텐츠 제거]
    
    UserMenu[사용자 메뉴] --> Settings[설정]
    Settings --> PrivacySettings[개인정보 및 보안]
    PrivacySettings --> BlockedUsers[차단된 사용자 관리]
    
    BlockedUsers --> BlockList[차단 목록 표시]
    BlockList --> SelectBlockedUser[차단된 사용자 선택]
    SelectBlockedUser --> UnblockOption[차단 해제 옵션]
    
    UnblockOption --> UnblockConfirm{차단 해제 확인}
    UnblockConfirm -->|확인| ProcessUnblock[차단 해제 처리]
    UnblockConfirm -->|취소| CancelUnblock[차단 해제 취소]
    
    ProcessUnblock --> RemoveFromBlockList[차단 목록에서 제거]
    RemoveFromBlockList --> RestoreUserContent[사용자 콘텐츠 복원]
    RestoreUserContent --> AllowInteraction[상호작용 허용]
    AllowInteraction --> ShowUnblockSuccess[차단 해제 완료]
```

## 11-4. 커뮤니티 가이드라인 및 교육 흐름

```mermaid
flowchart TD
    NewUserSignup[신규 사용자 가입] --> ShowGuidelines[커뮤니티 가이드라인 표시]
    ShowGuidelines --> UserAgreement{가이드라인 동의}
    
    UserAgreement -->|동의| CompleteSignup[가입 완료]
    UserAgreement -->|거부| ExplainImportance[가이드라인 중요성 설명]
    
    ExplainImportance --> DetailedGuidelines[상세 가이드라인]
    DetailedGuidelines --> UserAgreement
    
    FirstViolation[첫 위반 감지] --> SendEducationalContent[교육 콘텐츠 발송]
    SendEducationalContent --> ShowViolationExample[위반 사례 설명]
    ShowViolationExample --> ProvideCorrectExample[올바른 사례 제시]
    ProvideCorrectExample --> RequestAcknowledgment[이해 확인 요청]
    
    RequestAcknowledgment --> UserResponse{사용자 응답}
    UserResponse -->|이해함| IssueWarning[경고 발송]
    UserResponse -->|추가 설명 요청| ProvideDetailedExplanation[상세 설명 제공]
    UserResponse -->|무응답| EscalateViolation[위반 수위 상승]
    
    ProvideDetailedExplanation --> RequestAcknowledgment
    
    RepeatedViolation[반복 위반] --> CheckViolationHistory[위반 이력 확인]
    CheckViolationHistory --> CalculateViolationScore[위반 점수 계산]
    CalculateViolationScore --> DetermineAction{조치 결정}
    
    DetermineAction -->|경미| ExtendedEducation[확장 교육]
    DetermineAction -->|보통| TemporaryRestriction[임시 제한]
    DetermineAction -->|심각| AccountSuspension[계정 정지]
    DetermineAction -->|매우 심각| PermanentBan[영구 차단]
```

## 주요 기능

### 신고 시스템
- **신고 유형**:
  - 스팸/광고: 홍보성 콘텐츠, 반복적 게시물
  - 부적절한 콘텐츠: 선정적, 폭력적, 혐오 표현
  - 괴롭힘/폭언: 개인 공격, 악성 댓글
  - 저작권 침해: 무단 복제, 표절
  - 가짜 정보: 허위 사실, 오해의 소지가 있는 정보
  - 기타: 사용자 정의 신고 사유

- **신고 처리**:
  - 24시간 내 1차 검토
  - 중요도에 따른 우선순위 처리
  - AI 자동 필터링 + 인간 검토
  - 신고자/대상자 모두에게 처리 결과 통보

### 사용자 차단 기능
- **차단 효과**:
  - 차단된 사용자의 모든 콘텐츠 숨김
  - 상호 팔로우, 좋아요, 댓글 불가
  - 검색 결과에서 제외
  - 알림 차단

- **차단 관리**:
  - 설정에서 차단 목록 확인
  - 언제든 차단 해제 가능
  - 차단 사유 기록 (선택사항)

### 교육 및 예방
- **신규 사용자 교육**:
  - 가입 시 커뮤니티 가이드라인 필수 확인
  - 주요 규칙 요약 및 예시 제공
  - 건전한 독서 커뮤니티 문화 안내

- **위반 대응**:
  - 1차 위반: 교육 콘텐츠 + 경고
  - 2차 위반: 임시 기능 제한 (7일)
  - 3차 위반: 계정 정지 (30일)
  - 심각한 위반: 즉시 영구 차단

### 운영진 도구
- **신고 관리 대시보드**:
  - 실시간 신고 현황
  - 우선순위별 정렬
  - 처리 상태 추적
  - 통계 및 분석

- **자동화 시스템**:
  - AI 기반 콘텐츠 분석
  - 스팸 패턴 자동 감지
  - 반복 위반자 자동 플래그
  - 대량 신고 알림

### 투명성 및 이의제기
- **처리 과정 투명성**:
  - 신고 접수 알림
  - 검토 중 상태 안내
  - 처리 결과 상세 통보

- **이의제기 시스템**:
  - 조치에 대한 이의제기 가능
  - 재검토 요청 절차
  - 독립적인 검토 과정