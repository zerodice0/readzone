# 5. 프로필 및 활동 관리 흐름 (Profile Management Flow)

## 5-1. 프로필 관리 흐름

```mermaid
flowchart TD
    Start([로그인 상태]) --> UserMenu[사용자 메뉴]
    
    UserMenu --> Options{선택}
    Options -->|내 프로필| MyProfile[프로필 페이지]
    Options -->|설정| Settings[설정 페이지]
    Options -->|로그아웃| Logout[로그아웃]
    
    Logout --> LogoutConfirm{로그아웃 확인}
    LogoutConfirm -->|확인| ProcessLogout[로그아웃 처리]
    LogoutConfirm -->|취소| CancelLogout[취소]
    ProcessLogout --> ClearSession[세션 정리]
    ClearSession --> RedirectToFeed[메인 피드로 이동]
    RedirectToFeed --> UnauthenticatedFeed[비로그인 상태 피드]
    
    MyProfile --> ViewStats[활동 통계 확인]
    ViewStats --> MyContent{내 콘텐츠}
    MyContent -->|독후감| MyReviews[작성한 독후감]
    MyContent -->|좋아요| MyLikes[좋아요한 독후감]
    MyContent -->|댓글| MyComments[작성한 댓글]
    
    Settings --> ProfileEdit[프로필 편집]
    ProfileEdit --> UpdateInfo{정보 수정}
    UpdateInfo -->|프로필 사진| ProfilePictureUpload[프로필 사진 업로드]
    UpdateInfo -->|닉네임| ChangeNickname[닉네임 변경]
    UpdateInfo -->|자기소개| ChangeBio[자기소개 수정]
    UpdateInfo -->|비밀번호| ChangePassword[비밀번호 변경]
    
    Settings --> NotificationSettings[알림 설정]
    Settings --> AccountDelete[계정 삭제]
```

## 5-2. 프로필 사진 업로드 흐름

```mermaid
flowchart TD
    ProfilePictureUpload[프로필 사진 업로드] --> SelectImageMethod{이미지 선택 방법}
    
    SelectImageMethod -->|파일 선택| FileSelect[파일 선택 다이얼로그]
    SelectImageMethod -->|드래그 앤 드롭| DragDrop[드래그 앤 드롭 영역]
    SelectImageMethod -->|카메라| CameraCapture[카메라 촬영]
    
    FileSelect --> ValidateFile{파일 유효성 검사}
    DragDrop --> ValidateFile
    CameraCapture --> ValidateFile
    
    ValidateFile -->|유효| ShowImagePreview[이미지 미리보기]
    ValidateFile -->|크기 초과| FileSizeError[파일 크기 오류]
    ValidateFile -->|형식 불일치| FileTypeError[파일 형식 오류]
    ValidateFile -->|손상된 파일| CorruptedFileError[손상된 파일 오류]
    
    FileSizeError --> ShowErrorMessage[오류 메시지 표시]
    FileTypeError --> ShowErrorMessage
    CorruptedFileError --> ShowErrorMessage
    ShowErrorMessage --> SelectImageMethod
    
    ShowImagePreview --> CropAndEdit{편집 옵션}
    CropAndEdit -->|크롭| ImageCropper[이미지 크롭]
    CropAndEdit -->|회전| ImageRotate[이미지 회전]
    CropAndEdit -->|필터| ImageFilter[필터 적용]
    CropAndEdit -->|원본 사용| ConfirmUpload[업로드 확인]
    
    ImageCropper --> PreviewEdited[편집된 이미지 미리보기]
    ImageRotate --> PreviewEdited
    ImageFilter --> PreviewEdited
    PreviewEdited --> ConfirmUpload
    
    ConfirmUpload --> UploadToServer[서버 업로드]
    UploadToServer --> CheckUploadResult{업로드 결과}
    
    CheckUploadResult -->|성공| UpdateProfilePicture[프로필 사진 업데이트]
    CheckUploadResult -->|실패| UploadError[업로드 실패]
    
    UpdateProfilePicture --> ShowSuccessMessage[성공 메시지]
    ShowSuccessMessage --> RefreshProfile[프로필 새로고침]
    
    UploadError --> RetryUpload[재업로드 옵션]
    RetryUpload --> UploadToServer
```

## 5-3. 독후감 수정/삭제 흐름

```mermaid
flowchart TD
    MyReviews[내가 작성한 독후감] --> ReviewList[독후감 목록 표시]
    ReviewList --> SelectReview[독후감 선택]
    
    SelectReview --> ReviewDetail[독후감 상세 페이지]
    ReviewDetail --> CheckOwnership{작성자 확인}
    
    CheckOwnership -->|본인| ShowEditOptions[수정/삭제 버튼 표시]
    CheckOwnership -->|타인| ReadOnly[읽기 전용]
    
    ShowEditOptions --> UserAction{사용자 선택}
    UserAction -->|수정| EditMode[편집 모드 진입]
    UserAction -->|삭제| DeleteConfirm[삭제 확인 다이얼로그]
    
    EditMode --> LoadContent[기존 내용 불러오기]
    LoadContent --> ModifyContent[내용 수정]
    ModifyContent --> SaveChanges{저장하기}
    
    SaveChanges -->|성공| UpdatedReview[수정된 독후감 표시]
    SaveChanges -->|실패| ShowSaveError[저장에 실패했습니다]
    
    DeleteConfirm --> ConfirmChoice{확인}
    ConfirmChoice -->|예| DeleteReview[독후감 삭제]
    ConfirmChoice -->|아니오| CancelDelete[취소]
    
    DeleteReview -->|성공| RedirectToList[목록으로 이동]
    DeleteReview -->|실패| ShowDeleteError[독후감 삭제에 실패했습니다]
```

## 5-4. 계정 삭제 상세 흐름

```mermaid
flowchart TD
    AccountDelete[계정 삭제] --> ShowDeleteWarning[삭제 경고 안내]
    ShowDeleteWarning --> UserDeleteChoice{사용자 선택}
    
    UserDeleteChoice -->|계속| VerifyIdentity[신원 확인]
    UserDeleteChoice -->|취소| CancelDelete[삭제 취소]
    
    VerifyIdentity --> PasswordConfirm[비밀번호 확인]
    PasswordConfirm --> CheckPassword{비밀번호 검증}
    
    CheckPassword -->|정확| ShowDataInfo[데이터 처리 안내]
    CheckPassword -->|틀림| PasswordError[비밀번호 오류]
    PasswordError --> PasswordConfirm
    
    ShowDataInfo --> DataRetentionOptions{데이터 보존 옵션}
    DataRetentionOptions -->|즉시 삭제| ImmediateDelete[즉시 삭제]
    DataRetentionOptions -->|30일 유예| GracePeriod[30일 유예 기간]
    
    ImmediateDelete --> FinalConfirmation[최종 확인]
    GracePeriod --> ScheduleDelete[삭제 예약]
    
    FinalConfirmation --> UserFinalChoice{최종 선택}
    UserFinalChoice -->|확인| ProcessDelete[계정 삭제 처리]
    UserFinalChoice -->|취소| CancelDelete
    
    ProcessDelete --> AnonymizeData[개인정보 익명화]
    AnonymizeData --> DeletePersonalData[개인 데이터 삭제]
    DeletePersonalData --> PreserveContent[콘텐츠 처리]
    
    PreserveContent --> ContentChoice{콘텐츠 처리 방식}
    ContentChoice -->|삭제| DeleteAllContent[모든 콘텐츠 삭제]
    ContentChoice -->|익명화| AnonymizeContent[작성자 익명화]
    
    DeleteAllContent --> CompleteDelete[삭제 완료]
    AnonymizeContent --> CompleteDelete
    CompleteDelete --> LogoutUser[사용자 로그아웃]
    LogoutUser --> ShowDeleteConfirmation[삭제 완료 안내]
    
    ScheduleDelete --> SetDeleteDate[삭제 예정일 설정]
    SetDeleteDate --> SendDeleteNotice[삭제 예정 알림]
    SendDeleteNotice --> PendingDelete[삭제 대기 상태]
    
    PendingDelete --> CheckCancellation{취소 요청 확인}
    CheckCancellation -->|취소 요청| CancelScheduledDelete[예약 삭제 취소]
    CheckCancellation -->|30일 경과| ProcessDelete
    
    CancelScheduledDelete --> RestoreAccount[계정 복구]
    RestoreAccount --> SendRestoreNotice[복구 완료 알림]
```

## 주요 기능

### 기본 프로필 관리
- **독후감 수정**: 작성한 독후감의 내용, 태그, 추천 여부 수정 가능
- **독후감 삭제**: 삭제 확인 후 영구 삭제
- **소유권 확인**: 본인이 작성한 독후감만 수정/삭제 가능
- **안전한 로그아웃**: 
  - 로그아웃 확인 다이얼로그로 실수 방지
  - 세션 완전 정리 후 메인 피드로 복귀
  - 비로그인 상태에서도 콘텐츠 탐색 가능

### 프로필 사진 시스템
- **업로드 방식**: 파일 선택, 드래그 앤 드롭, 카메라 촬영
- **파일 제한**: 
  - 최대 크기: 5MB
  - 지원 형식: JPG, PNG, WebP
  - 최소 해상도: 100x100px
- **편집 기능**:
  - 정사각형 크롭 (1:1 비율)
  - 90도 단위 회전
  - 기본 필터 (밝기, 대비, 채도)
- **처리 과정**:
  - 클라이언트 리사이징 (최대 800x800)
  - 서버 최적화 및 CDN 업로드
  - 다중 크기 생성 (50px, 100px, 200px)

### 계정 삭제 시스템
- **안전장치**:
  - 다단계 확인 과정
  - 비밀번호 재확인 필수
  - 데이터 처리 방식 안내
- **유예 기간**: 
  - 30일 복구 가능 기간
  - 예약 삭제 취소 옵션
  - 삭제 예정 안내 알림
- **데이터 처리**:
  - 개인정보 즉시 익명화
  - 작성 콘텐츠 선택적 보존/삭제
  - GDPR 및 개인정보보호법 준수
- **복구 옵션**:
  - 30일 내 계정 복구 가능
  - 원클릭 복구 링크 제공
  - 복구 완료 알림

### 내 독후감 접근 경로
- **메인 메뉴**: 사용자 메뉴 → 내 프로필 → 내 콘텐츠 → 독후감
- **본인 프로필**: 다른 플로우에서 본인 프로필 진입 시 내 콘텐츠 섹션 표시
- **독후감 작성 후**: 독후감 상세 페이지 → "내 독후감 보기" 버튼
- **소셜 상호작용**: 피드에서 본인 프로필 클릭 → 내 콘텐츠 바로 표시