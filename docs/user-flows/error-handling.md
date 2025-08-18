# 8. 오류 처리 및 복구 흐름 (Error Handling Flow)

## 8-1. 기본 오류 처리 흐름

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
    ErrorType -->|클라이언트| ClientError[클라이언트 오류]
    
    NetworkError --> RetryPrompt[재시도 안내]
    AuthError --> ReLogin[재로그인 유도]
    ValidationError --> ShowMessage[오류 메시지]
    ServerError --> FallbackUI[대체 UI]
    ClientError --> RefreshPage[페이지 새로고침 제안]
    
    Action -->|페이지 이탈| CheckUnsaved{저장되지 않은 내용?}
    CheckUnsaved -->|있음| ConfirmLeave[이탈 확인 알림]
    CheckUnsaved -->|없음| ProceedLeave[페이지 이탈]
    ConfirmLeave --> UserChoice{사용자 선택}
    UserChoice -->|저장| SaveDraft[임시 저장]
    UserChoice -->|무시| ProceedLeave
```

## 8-2. 네트워크 및 서버 오류 처리 흐름

```mermaid
flowchart TD
    NetworkRequest[API 호출] --> CheckConnectivity{연결 상태 확인}
    
    CheckConnectivity -->|연결됨| SendRequest[요청 전송]
    CheckConnectivity -->|연결 안됨| OfflineMode[오프라인 모드]
    
    SendRequest --> ResponseTimeout{응답 시간 확인}
    ResponseTimeout -->|정상| ProcessResponse[응답 처리]
    ResponseTimeout -->|타임아웃| TimeoutError[타임아웃 오류]
    
    ProcessResponse --> ResponseStatus{HTTP 상태 코드}
    ResponseStatus -->|200-299| SuccessResponse[성공 응답]
    ResponseStatus -->|400-499| ClientErrorResponse[클라이언트 오류]
    ResponseStatus -->|500-599| ServerErrorResponse[서버 오류]
    
    TimeoutError --> RetryLogic{재시도 로직}
    ClientErrorResponse --> HandleClientError{클라이언트 오류 처리}
    ServerErrorResponse --> HandleServerError{서버 오류 처리}
    
    HandleClientError -->|400| BadRequest[잘못된 요청]
    HandleClientError -->|401| Unauthorized[인증 필요]
    HandleClientError -->|403| Forbidden[권한 없음]
    HandleClientError -->|404| NotFound[리소스 없음]
    HandleClientError -->|429| RateLimit[요청 제한]
    
    HandleServerError -->|500| InternalServerError[서버 내부 오류]
    HandleServerError -->|502| BadGateway[게이트웨이 오류]
    HandleServerError -->|503| ServiceUnavailable[서비스 불가]
    HandleServerError -->|504| GatewayTimeout[게이트웨이 타임아웃]
    
    RetryLogic --> CheckRetryCount{재시도 횟수 확인}
    CheckRetryCount -->|3회 미만| ExponentialBackoff[지수 백오프]
    CheckRetryCount -->|3회 이상| ShowRetryOption[수동 재시도 옵션]
    
    ExponentialBackoff --> WaitAndRetry[대기 후 재시도]
    WaitAndRetry --> SendRequest
    
    ShowRetryOption --> UserRetryChoice{사용자 선택}
    UserRetryChoice -->|재시도| ResetRetryCount[재시도 카운트 리셋]
    UserRetryChoice -->|포기| ShowErrorFallback[오류 대체 UI]
    
    ResetRetryCount --> SendRequest
    
    OfflineMode --> CacheCheck{캐시 확인}
    CacheCheck -->|캐시 있음| LoadFromCache[캐시에서 로드]
    CacheCheck -->|캐시 없음| ShowOfflineMessage[오프라인 안내]
    
    LoadFromCache --> ShowCachedContent[캐시된 콘텐츠 표시]
    ShowOfflineMessage --> WaitForConnection[연결 복구 대기]
    
    WaitForConnection --> CheckConnectivity
```

## 8-3. 폼 및 입력 검증 오류 처리 흐름

```mermaid
flowchart TD
    UserInput[사용자 입력] --> ClientValidation{클라이언트 검증}
    
    ClientValidation -->|통과| ServerValidation[서버 검증]
    ClientValidation -->|실패| ShowFieldError[필드별 오류 표시]
    
    ShowFieldError --> HighlightError[오류 필드 강조]
    HighlightError --> ShowErrorMessage[오류 메시지 표시]
    ShowErrorMessage --> FocusErrorField[오류 필드로 포커스]
    FocusErrorField --> UserCorrection[사용자 수정]
    UserCorrection --> ClientValidation
    
    ServerValidation --> ServerResponse{서버 응답}
    ServerResponse -->|성공| ProcessSuccess[성공 처리]
    ServerResponse -->|검증 오류| HandleValidationError[검증 오류 처리]
    ServerResponse -->|서버 오류| HandleServerError[서버 오류 처리]
    
    HandleValidationError --> ParseErrorResponse[오류 응답 파싱]
    ParseErrorResponse --> MapErrorsToFields[필드별 오류 매핑]
    MapErrorsToFields --> ShowServerErrors[서버 오류 표시]
    ShowServerErrors --> FocusFirstError[첫 번째 오류로 포커스]
    
    HandleServerError --> ShowGenericError[일반 오류 메시지]
    ShowGenericError --> OfferRetry[재시도 옵션]
    
    OfferRetry --> UserRetryChoice{사용자 선택}
    UserRetryChoice -->|재시도| ServerValidation
    UserRetryChoice -->|취소| CancelOperation[작업 취소]
```

## 8-4. 파일 업로드 오류 처리 흐름

```mermaid
flowchart TD
    FileSelect[파일 선택] --> ClientFileValidation{클라이언트 파일 검증}
    
    ClientFileValidation -->|통과| StartUpload[업로드 시작]
    ClientFileValidation -->|실패| FileValidationError{파일 검증 오류}
    
    FileValidationError -->|크기 초과| FileSizeError[파일 크기 오류]
    FileValidationError -->|형식 불일치| FileTypeError[파일 형식 오류]
    FileValidationError -->|손상된 파일| CorruptedFileError[손상된 파일 오류]
    
    FileSizeError --> ShowSizeError["파일 크기가 5MB를 초과합니다"]
    FileTypeError --> ShowTypeError["지원하지 않는 파일 형식입니다"]
    CorruptedFileError --> ShowCorruptedError["파일이 손상되었습니다"]
    
    ShowSizeError --> SuggestCompression[압축 제안]
    ShowTypeError --> SuggestConversion[형식 변환 제안]
    ShowCorruptedError --> SuggestReselection[다른 파일 선택 제안]
    
    StartUpload --> UploadProgress[업로드 진행률]
    UploadProgress --> CheckUploadStatus{업로드 상태}
    
    CheckUploadStatus -->|진행 중| ContinueUpload[업로드 계속]
    CheckUploadStatus -->|완료| UploadSuccess[업로드 성공]
    CheckUploadStatus -->|실패| UploadError{업로드 오류}
    
    UploadError -->|네트워크 오류| NetworkUploadError[네트워크 오류]
    UploadError -->|서버 오류| ServerUploadError[서버 오류]
    UploadError -->|용량 부족| StorageFullError[저장 공간 부족]
    
    NetworkUploadError --> ResumeUpload[업로드 재개]
    ServerUploadError --> RetryUpload[업로드 재시도]
    StorageFullError --> SuggestCleanup[저장 공간 정리 제안]
    
    ContinueUpload --> ShowProgress[진행률 표시]
    ShowProgress --> AllowCancel[취소 옵션]
    AllowCancel --> UserCancelChoice{사용자 취소}
    UserCancelChoice -->|취소| CancelUpload[업로드 취소]
    UserCancelChoice -->|계속| CheckUploadStatus
    
    CancelUpload --> CleanupTempFiles[임시 파일 정리]
```

## 8-5. 오프라인 및 연결 복구 흐름

```mermaid
flowchart TD
    OnlineApp[온라인 앱 사용] --> ConnectionCheck{연결 상태 모니터링}
    
    ConnectionCheck -->|연결 유지| ContinueOnline[온라인 사용 계속]
    ConnectionCheck -->|연결 끊김| DetectOffline[오프라인 감지]
    
    DetectOffline --> ShowOfflineBanner[오프라인 상태 표시]
    ShowOfflineBanner --> EnableOfflineMode[오프라인 모드 활성화]
    
    EnableOfflineMode --> OfflineFeatures{오프라인 기능}
    OfflineFeatures -->|캐시된 콘텐츠| LoadCachedData[캐시 데이터 로드]
    OfflineFeatures -->|로컬 저장| SaveToLocal[로컬 저장소 사용]
    OfflineFeatures -->|읽기 전용| ReadOnlyMode[읽기 전용 모드]
    
    LoadCachedData --> ShowCachedContent[캐시된 콘텐츠 표시]
    SaveToLocal --> QueueOfflineActions[오프라인 액션 대기열]
    ReadOnlyMode --> DisableWriteActions[쓰기 액션 비활성화]
    
    ShowCachedContent --> MarkAsOffline[오프라인 표시 추가]
    QueueOfflineActions --> StorePendingActions[대기 액션 저장]
    DisableWriteActions --> ShowOfflineMessage[오프라인 안내 메시지]
    
    ConnectionRestore[연결 복구] --> DetectOnline[온라인 상태 감지]
    DetectOnline --> VerifyConnection[연결 상태 검증]
    
    VerifyConnection --> TestConnectivity{연결 테스트}
    TestConnectivity -->|성공| RestoreOnline[온라인 모드 복구]
    TestConnectivity -->|실패| ContinueOffline[오프라인 모드 유지]
    
    RestoreOnline --> SyncPendingActions[대기 액션 동기화]
    SyncPendingActions --> ProcessQueue[대기열 처리]
    ProcessQueue --> CheckSyncResult{동기화 결과}
    
    CheckSyncResult -->|성공| ShowSyncSuccess[동기화 성공 안내]
    CheckSyncResult -->|실패| ShowSyncError[동기화 실패 안내]
    CheckSyncResult -->|부분 성공| ShowPartialSync[부분 동기화 안내]
    
    ShowSyncSuccess --> RemoveOfflineBanner[오프라인 표시 제거]
    ShowSyncError --> OfferManualSync[수동 동기화 옵션]
    ShowPartialSync --> ShowSyncDetails[동기화 상세 내용]
    
    ContinueOnline --> ConnectionCheck
```

## 주요 오류 처리 원칙

### 1. 사용자 친화적 메시지
- **기술적 용어 피하기**: "서버 오류"보다는 "일시적 문제가 발생했습니다"
- **구체적 안내**: 다음 단계나 해결 방법 제시
- **감정적 배려**: 사과 표현과 이해 구하기

### 2. 점진적 오류 복구
- **자동 재시도**: 네트워크 오류 등 일시적 문제
- **사용자 옵션**: 수동 재시도, 대안 제시
- **우아한 성능 저하**: 핵심 기능 우선 유지

### 3. 컨텍스트 보존
- **사용자 입력 보존**: 폼 데이터, 작성 중인 콘텐츠
- **세션 상태 유지**: 로그인 상태, 설정값
- **진행 상황 저장**: 업로드 진행률, 임시 저장

### 4. 예방적 검증
- **클라이언트 사이드 검증**: 즉시 피드백
- **서버 사이드 검증**: 보안 및 무결성
- **실시간 피드백**: 입력 중 검증 상태 표시

## 오류 메시지 가이드라인

### 네트워크 오류
- **일반**: "인터넷 연결을 확인해주세요"
- **타임아웃**: "응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요"
- **서버 불가**: "서비스 점검 중입니다. 잠시 후 이용해주세요"

### 인증 오류
- **로그인 만료**: "로그인이 만료되었습니다. 다시 로그인해주세요"
- **권한 없음**: "이 기능을 사용할 권한이 없습니다"
- **계정 제한**: "계정에 제한이 있습니다. 고객센터에 문의해주세요"

### 입력 검증 오류
- **필수 입력**: "필수 입력 항목입니다"
- **형식 오류**: "올바른 이메일 형식을 입력해주세요"
- **길이 제한**: "20자 이내로 입력해주세요"

### 파일 업로드 오류
- **크기 초과**: "파일 크기는 5MB 이하만 가능합니다"
- **형식 불일치**: "JPG, PNG, GIF 파일만 업로드 가능합니다"
- **업로드 실패**: "파일 업로드에 실패했습니다. 다시 시도해주세요"

## 성능 모니터링 및 로깅

### 오류 추적
- **오류 발생률**: 전체 요청 대비 오류 비율 모니터링
- **오류 패턴**: 특정 시간대, 기능별 오류 집중 분석
- **사용자 영향**: 오류로 인한 사용자 이탈률 추적

### 로그 수집
- **클라이언트 로그**: JavaScript 오류, 네트워크 실패
- **서버 로그**: API 응답 시간, 오류 상태 코드
- **사용자 행동**: 오류 발생 시점의 사용자 액션

### 개선 피드백 루프
- **오류 빈도 분석**: 자주 발생하는 오류 우선 수정
- **사용자 피드백**: 오류 보고 및 개선 제안 수집
- **A/B 테스트**: 오류 처리 개선안 효과 검증