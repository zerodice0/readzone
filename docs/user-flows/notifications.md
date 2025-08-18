# 7. 알림 시스템 흐름 (Notification System Flow)

## 7-1. 알림 표시 및 확인 흐름

```mermaid
flowchart TD
    Start([로그인한 사용자]) --> CheckNotifications{미읽음 알림 확인}
    
    CheckNotifications -->|미읽음 있음| ShowBadge[헤더 벨 아이콘에 뱃지 표시]
    CheckNotifications -->|미읽음 없음| ShowBellOnly[벨 아이콘만 표시]
    
    ShowBadge --> UserAction{사용자 상호작용}
    ShowBellOnly --> UserAction
    
    UserAction -->|벨 아이콘 클릭| NotificationDropdown[알림 드롭다운 표시]
    UserAction -->|사용자 메뉴| UserMenu[사용자 메뉴]
    
    NotificationDropdown --> RecentNotifications[최근 알림 5개 시간순 표시]
    RecentNotifications --> DropdownActions{드롭다운 액션}
    
    DropdownActions -->|개별 알림 클릭| NotificationClick[알림 클릭]
    DropdownActions -->|모든 알림 보기| NotificationList[알림 목록 페이지]
    DropdownActions -->|전체 읽음 처리| MarkAllRead[전체 읽음 처리]
    
    UserMenu --> MenuOptions{메뉴 선택}
    MenuOptions -->|알림| NotificationList
    
    NotificationClick --> NotificationType{알림 유형}
    NotificationType -->|댓글/답글 알림| ReviewDetail[독후감 상세 페이지]
    NotificationType -->|좋아요 알림| ReviewDetail
    NotificationType -->|팔로우 알림| FollowerProfile[팔로워 프로필]
    
    NotificationClick --> CheckReadStatus{읽음 상태 확인}
    CheckReadStatus -->|미읽음| MarkAsRead[해당 알림 읽음 처리]
    CheckReadStatus -->|이미 읽음| SkipMarkRead[읽음 처리 건너뛰기]
    MarkAsRead --> UpdateBadge[뱃지 수 업데이트]
    SkipMarkRead --> NavigateToContent[콘텐츠로 이동]
    UpdateBadge --> NavigateToContent
    MarkAllRead --> ClearBadge[뱃지 초기화]
    
    NotificationList --> ListTabs{목록 탭 선택}
    ListTabs -->|전체| AllNotifications[전체 알림 목록]
    ListTabs -->|미읽음| UnreadOnly[미읽음만 표시]
    ListTabs -->|읽음| ReadOnly[읽은 알림만 표시]
    
    AllNotifications --> ListActions{목록 액션}
    UnreadOnly --> ListActions
    ReadOnly --> ListActions
    
    ListActions -->|개별 알림 클릭| NotificationClick
    ListActions -->|전체 읽음| MarkAllRead
    ListActions -->|알림 삭제| DeleteNotification[알림 삭제]
    ListActions -->|필터링| FilterNotifications[알림 유형별 필터]
    
    FilterNotifications --> FilteredList[필터링된 알림 목록]
    DeleteNotification --> RefreshList[목록 새로고침]
```

## 7-2. 알림 발생 및 전송 흐름

```mermaid
flowchart TD
    Start([사용자 액션]) --> ActionType{액션 유형}
    
    ActionType -->|댓글/답글 작성| CommentReplyAction[댓글/답글 작성]
    ActionType -->|좋아요| LikeAction[좋아요]
    ActionType -->|팔로우| FollowAction[팔로우]
    
    CommentReplyAction --> CheckTargetAuthor{대상 작성자 확인}
    CheckTargetAuthor -->|본인 아님| CreateCommentNotification[댓글/답글 알림 생성]
    CheckTargetAuthor -->|본인| SkipNotification[알림 생성 안함]
    
    LikeAction --> CheckContentAuthor{콘텐츠 작성자 확인}
    CheckContentAuthor -->|본인 아님| CreateLikeNotification[좋아요 알림 생성]
    CheckContentAuthor -->|본인| SkipNotification
    
    FollowAction --> CheckTargetUser{팔로우 대상 확인}
    CheckTargetUser -->|본인 아님| CreateFollowNotification[팔로우 알림 생성]
    CheckTargetUser -->|본인| SkipNotification
    
    CreateCommentNotification --> CheckUserSettings{사용자 알림 설정 확인}
    CreateLikeNotification --> CheckUserSettings
    CreateFollowNotification --> CheckUserSettings
    
    CheckUserSettings -->|알림 허용| SaveNotification[알림 DB 저장]
    CheckUserSettings -->|알림 차단| SkipNotification
    
    SaveNotification --> CheckUserOnline{사용자 온라인 상태}
    CheckUserOnline -->|온라인| UpdateBadgeRealtime[실시간 뱃지 업데이트]
    CheckUserOnline -->|오프라인| WaitForLogin[로그인 시 표시 대기]
    
    UpdateBadgeRealtime --> CheckPushEnabled{푸시 알림 설정}
    CheckPushEnabled -->|활성화| SendPushNotification[푸시 알림 전송]
    CheckPushEnabled -->|비활성화| OnlyBadgeUpdate[뱃지만 업데이트]
```

## 7-3. 알림 설정 관리 흐름

```mermaid
flowchart TD
    Start([설정 페이지]) --> NotificationSettings[알림 설정 섹션]
    
    NotificationSettings --> SettingTypes{설정 유형}
    
    SettingTypes -->|댓글/답글 알림| CommentSetting[댓글/답글 알림 on/off]
    SettingTypes -->|좋아요 알림| LikeSetting[좋아요 알림 on/off]
    SettingTypes -->|팔로우 알림| FollowSetting[팔로우 알림 on/off]
    SettingTypes -->|푸시 알림| PushSetting[푸시 알림 설정]
    
    CommentSetting --> DetailedCommentSettings{상세 설정}
    DetailedCommentSettings -->|내 독후감 댓글| MyReviewComments[내 독후감 댓글 알림]
    DetailedCommentSettings -->|내 댓글 답글| MyCommentReplies[내 댓글 답글 알림]
    
    LikeSetting --> DetailedLikeSettings{상세 설정}
    DetailedLikeSettings -->|독후감 좋아요| ReviewLikes[독후감 좋아요 알림]
    DetailedLikeSettings -->|댓글 좋아요| CommentLikes[댓글 좋아요 알림]
    
    PushSetting --> PushOptions{푸시 옵션}
    PushOptions -->|브라우저 푸시| BrowserPush[브라우저 푸시 알림]
    PushOptions -->|모바일 푸시| MobilePush[모바일 앱 푸시]
    PushOptions -->|이메일 요약| EmailDigest[이메일 요약 알림]
    
    MyReviewComments --> SaveSettings[설정 저장]
    MyCommentReplies --> SaveSettings
    ReviewLikes --> SaveSettings
    CommentLikes --> SaveSettings
    FollowSetting --> SaveSettings
    BrowserPush --> SaveSettings
    MobilePush --> SaveSettings
    EmailDigest --> SaveSettings
    
    SaveSettings --> SettingsSuccess[설정 저장 완료]
    SettingsSuccess --> ApplySettings[새 설정 적용]
    
    NotificationSettings --> QuickActions{빠른 설정}
    QuickActions -->|모든 알림 끄기| DisableAll[전체 알림 비활성화]
    QuickActions -->|모든 알림 켜기| EnableAll[전체 알림 활성화]
    QuickActions -->|기본값으로 복원| ResetToDefault[기본 설정 복원]
    QuickActions -->|방해 금지 모드| DoNotDisturb[방해 금지 모드]
    
    DisableAll --> SaveSettings
    EnableAll --> SaveSettings
    ResetToDefault --> SaveSettings
    DoNotDisturb --> SetDNDSchedule[방해 금지 시간 설정]
    SetDNDSchedule --> SaveSettings
```

## 7-4. 알림 성능 최적화 및 배치 처리 흐름

```mermaid
flowchart TD
    MultipleActions[다중 사용자 액션] --> BatchCollector[배치 수집기]
    BatchCollector --> GroupByUser[사용자별 그룹화]
    GroupByUser --> GroupByType[알림 유형별 그룹화]
    
    GroupByType --> CheckBatchRules{배치 규칙 확인}
    CheckBatchRules -->|좋아요 집계| AggregateLikes[좋아요 알림 집계]
    CheckBatchRules -->|댓글 집계| AggregateComments[댓글 알림 집계]
    CheckBatchRules -->|개별 처리| IndividualProcess[개별 알림 처리]
    
    AggregateLikes --> CreateSummaryNotification[요약 알림 생성]
    AggregateComments --> CreateSummaryNotification
    CreateSummaryNotification --> Examples{알림 메시지 예시}
    
    Examples -->|좋아요 집계| LikeSummary["김독서님 외 5명이 회원님의 독후감을 좋아합니다"]
    Examples -->|댓글 집계| CommentSummary["어린왕자 독후감에 새 댓글 3개가 있습니다"]
    
    IndividualProcess --> RateLimitCheck{발송 제한 확인}
    RateLimitCheck -->|제한 내| SendNotification[알림 발송]
    RateLimitCheck -->|제한 초과| QueueForLater[나중에 발송 대기]
    
    SendNotification --> UpdateDeliveryStatus[발송 상태 업데이트]
    QueueForLater --> ScheduledSend[예약 발송]
    
    ScheduledSend --> CheckOptimalTime{최적 시간 확인}
    CheckOptimalTime -->|사용자 활성 시간| SendAtActiveTime[활성 시간에 발송]
    CheckOptimalTime -->|일반 시간| SendAtRegularTime[일반 시간에 발송]
```

## 주요 알림 유형

### 핵심 알림 (3가지)
- **댓글/답글 알림**: "사용자명이 '독후감 제목'에 댓글을 남겼습니다" / "사용자명이 회원님의 댓글에 답글을 남겼습니다"
- **좋아요 알림**: "사용자명이 '독후감 제목'을 좋아합니다"
- **팔로우 알림**: "사용자명이 회원님을 팔로우하기 시작했습니다"

### 집계 알림 (성능 최적화)
- **다중 좋아요**: "김독서님 외 5명이 회원님의 '어린왕자' 독후감을 좋아합니다"
- **다중 댓글**: "'어린왕자' 독후감에 새 댓글 3개가 있습니다"
- **다중 팔로우**: "김독서님 외 2명이 회원님을 팔로우하기 시작했습니다"

## 알림 UI 요소

### 헤더 알림
- **헤더 뱃지**: 벨 아이콘 위 빨간 원형 뱃지 (미읽음 개수)
- **벨 아이콘**: 미읽음 없어도 항상 표시, 클릭하면 드롭다운 열림
- **실시간 업데이트**: WebSocket으로 즉시 반영

### 드롭다운 알림
- **최근 알림 5개**를 시간순으로 표시
- **미읽음**: 굵은 텍스트 + 배경색 강조
- **읽음**: 일반 텍스트 + 연한 배경색
- **빠른 액션**: 전체 읽음 처리, 모든 알림 보기

### 알림 목록 페이지
- **탭 구조**: 전체/미읽음/읽음 탭으로 구분
- **무한 스크롤**: 과거 알림까지 모두 확인 가능
- **필터링**: 알림 유형별 필터
- **일괄 처리**: 선택된 알림들 일괄 읽음/삭제

## 주요 기능

### 실시간 업데이트
- 온라인 사용자에게 실시간 뱃지 업데이트
- WebSocket 연결을 통한 즉시 반영
- 오프라인 시 로그인 후 일괄 동기화

### 스마트 알림 관리
- **중복 방지**: 본인 액션에 대한 알림 생성 방지
- **설정 기반**: 사용자 설정에 따른 선택적 알림 발송
- **배치 처리**: 동일 유형 알림 집계로 스팸 방지
- **발송 제한**: 시간당 최대 알림 수 제한

### 컨텍스트 연결
- 알림 클릭 시 관련 콘텐츠로 직접 이동
- 독후감 상세 페이지의 해당 댓글로 스크롤
- 프로필 페이지로 자연스러운 연결

### 완전한 알림 히스토리
- **읽은 알림도 항상 확인 가능**
- 드롭다운에서 최근 읽은 알림 표시
- 알림 목록에서 전체/미읽음/읽음 탭 제공
- 검색 기능으로 과거 알림 찾기

### 직관적 드롭다운
- 시간순 정렬로 자연스러운 히스토리 확인
- 시각적 구분으로 읽음/미읽음 상태 즉시 파악
- 호버 효과와 클릭 가능한 영역 명확화

### 알림 피로감 방지
- **팔로잉 활동 알림 제거**: 피드에서 확인 가능하므로 중복 제거
- **댓글/답글 알림 통합**: 중복 방지로 깔끔한 관리
- **핵심 상호작용만 알림**: 3가지 유형으로 단순화
- **방해 금지 모드**: 특정 시간대 알림 차단

### 고급 설정
- **세분화된 알림 제어**: 유형별 개별 on/off
- **푸시 알림 지원**: 브라우저/모바일 푸시
- **이메일 요약**: 일별/주별 알림 요약 이메일
- **최적 시간 발송**: 사용자 활성 패턴 기반 발송