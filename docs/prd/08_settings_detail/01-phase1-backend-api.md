# Phase 1: Backend API 구현

## 📋 개요

NestJS 기반으로 설정 관리를 위한 RESTful API를 구현합니다. 11개의 엔드포인트와 관련 DTO, Service 로직을 포함합니다.

## 🗄️ Prisma 스키마 확장

### UserSettings 테이블
```prisma
model UserSettings {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 개인정보 보호 설정
  profileVisibility     VisibilityLevel @default(PUBLIC)
  activityVisibility    VisibilityLevel @default(PUBLIC)
  searchable            Boolean         @default(true)
  showEmail             Boolean         @default(false)
  showFollowers         Boolean         @default(true)
  showFollowing         Boolean         @default(true)

  // 서비스 설정
  theme                 Theme           @default(AUTO)
  language              Language        @default(KO)
  defaultFeedTab        FeedTab         @default(RECOMMENDED)
  hideNSFW              Boolean         @default(true)
  hideSpoilers          Boolean         @default(false)
  hideNegativeReviews   Boolean         @default(false)
  imageQuality          ImageQuality    @default(MEDIUM)
  autoplayVideos        Boolean         @default(false)
  preloadImages         Boolean         @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user_settings")
}

model NotificationSettings {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 기본 알림 설정
  likesEnabled     Boolean @default(true)
  likesEmail       Boolean @default(false)
  likesPush        Boolean @default(true)

  commentsEnabled  Boolean @default(true)
  commentsEmail    Boolean @default(false)
  commentsPush     Boolean @default(true)

  followsEnabled   Boolean @default(true)
  followsEmail     Boolean @default(false)
  followsPush      Boolean @default(true)

  // 방해금지 설정
  quietHoursEnabled Boolean @default(false)
  quietStartTime    String  @default("22:00")
  quietEndTime      String  @default("08:00")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("notification_settings")
}

model ConnectedAccount {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider    SocialProvider
  email       String
  providerId  String
  connectedAt DateTime  @default(now())

  @@unique([userId, provider])
  @@map("connected_accounts")
}

model AccountDeletion {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  scheduledAt     DateTime
  reason          String?
  feedback        String?
  cancellationToken String @unique

  createdAt       DateTime @default(now())

  @@map("account_deletions")
}

// Enums
enum VisibilityLevel {
  PUBLIC
  FOLLOWERS
  PRIVATE
}

enum Theme {
  LIGHT
  DARK
  AUTO
}

enum Language {
  KO
  EN
}

enum FeedTab {
  RECOMMENDED
  LATEST
  FOLLOWING
}

enum ImageQuality {
  LOW
  MEDIUM
  HIGH
}

enum SocialProvider {
  GOOGLE
  KAKAO
  NAVER
}
```

### User 모델 확장
```prisma
model User {
  // ... 기존 필드들

  // 관계 추가
  settings            UserSettings?
  notificationSettings NotificationSettings?
  connectedAccounts   ConnectedAccount[]
  accountDeletion     AccountDeletion?
}
```

## 📁 모듈 구조

```
packages/backend/src/modules/settings/
├── dto/
│   ├── get-settings.dto.ts
│   ├── update-profile.dto.ts
│   ├── update-email.dto.ts
│   ├── update-password.dto.ts
│   ├── update-privacy.dto.ts
│   ├── update-notifications.dto.ts
│   ├── update-preferences.dto.ts
│   ├── connect-account.dto.ts
│   ├── disconnect-account.dto.ts
│   ├── delete-account.dto.ts
│   └── cancel-deletion.dto.ts
├── settings.controller.ts
├── settings.service.ts
└── settings.module.ts
```

## 🔌 API 엔드포인트 상세

### 1. GET `/api/settings`
```typescript
// Response DTO
export class UserSettingsResponseDto {
  user: {
    id: string;
    username: string;
    email: string;
    bio?: string;
    profileImage?: string;
    createdAt: string;
  };

  privacy: {
    profileVisibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
    activityVisibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
    searchable: boolean;
    showEmail: boolean;
    showFollowers: boolean;
    showFollowing: boolean;
  };

  notifications: {
    likes: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
    comments: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
    follows: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };

  preferences: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    language: 'KO' | 'EN';
    defaultFeedTab: 'RECOMMENDED' | 'LATEST' | 'FOLLOWING';
    contentFilter: {
      hideNSFW: boolean;
      hideSpoilers: boolean;
      hideNegativeReviews: boolean;
    };
    dataUsage: {
      imageQuality: 'LOW' | 'MEDIUM' | 'HIGH';
      autoplayVideos: boolean;
      preloadImages: boolean;
    };
  };

  connectedAccounts: Array<{
    provider: 'GOOGLE' | 'KAKAO' | 'NAVER';
    email: string;
    connectedAt: string;
  }>;
}
```

### 2. PUT `/api/settings/profile`
```typescript
// Request DTO
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  profileImage?: string;
}

// Response DTO
export class UpdateProfileResponseDto {
  success: boolean;
  user: {
    username: string;
    bio?: string;
    profileImage?: string;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### 3. PUT `/api/settings/email`
```typescript
// Request DTO
export class UpdateEmailDto {
  @IsEmail()
  newEmail: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// Response DTO
export class UpdateEmailResponseDto {
  success: boolean;
  message: string;
  requiresVerification: boolean;
  verificationSent: boolean;
}
```

### 4. PUT `/api/settings/password`
```typescript
// Request DTO
export class UpdatePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character'
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}

// Response DTO
export class UpdatePasswordResponseDto {
  success: boolean;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### 5. PUT `/api/settings/privacy`
```typescript
// Request DTO
export class UpdatePrivacyDto {
  @IsOptional()
  @IsEnum(VisibilityLevel)
  profileVisibility?: VisibilityLevel;

  @IsOptional()
  @IsEnum(VisibilityLevel)
  activityVisibility?: VisibilityLevel;

  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  showFollowers?: boolean;

  @IsOptional()
  @IsBoolean()
  showFollowing?: boolean;
}
```

### 6. PUT `/api/settings/notifications`
```typescript
// Request DTO
export class UpdateNotificationsDto {
  @IsOptional()
  @ValidateNested()
  likes?: {
    enabled?: boolean;
    email?: boolean;
    push?: boolean;
  };

  @IsOptional()
  @ValidateNested()
  comments?: {
    enabled?: boolean;
    email?: boolean;
    push?: boolean;
  };

  @IsOptional()
  @ValidateNested()
  follows?: {
    enabled?: boolean;
    email?: boolean;
    push?: boolean;
  };

  @IsOptional()
  @ValidateNested()
  quietHours?: {
    enabled?: boolean;
    startTime?: string;
    endTime?: string;
  };
}
```

### 7. PUT `/api/settings/preferences`
```typescript
// Request DTO
export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(FeedTab)
  defaultFeedTab?: FeedTab;

  @IsOptional()
  @ValidateNested()
  contentFilter?: {
    hideNSFW?: boolean;
    hideSpoilers?: boolean;
    hideNegativeReviews?: boolean;
  };

  @IsOptional()
  @ValidateNested()
  dataUsage?: {
    imageQuality?: ImageQuality;
    autoplayVideos?: boolean;
    preloadImages?: boolean;
  };
}
```

### 8. POST `/api/settings/account/connect`
```typescript
// Request DTO
export class ConnectAccountDto {
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @IsString()
  authCode: string;
}

// Response DTO
export class ConnectAccountResponseDto {
  success: boolean;
  connectedAccount: {
    provider: string;
    email: string;
    connectedAt: string;
  };
}
```

### 9. DELETE `/api/settings/account/disconnect`
```typescript
// Request DTO
export class DisconnectAccountDto {
  @IsEnum(SocialProvider)
  provider: SocialProvider;
}

// Response DTO
export class DisconnectAccountResponseDto {
  success: boolean;
  remainingMethods: string[];
  warning?: string;
}
```

### 10. GET `/api/settings/data-export`
```typescript
// Response DTO
export class DataExportResponseDto {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  format: 'json' | 'csv';
}
```

### 11. POST `/api/settings/account/delete`
```typescript
// Request DTO
export class DeleteAccountDto {
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  feedback?: string;
}

// Response DTO
export class DeleteAccountResponseDto {
  success: boolean;
  deletionDate: string;
  cancellationToken: string;
}
```

### 12. POST `/api/settings/account/cancel-deletion`
```typescript
// Request DTO
export class CancelDeletionDto {
  @IsString()
  cancellationToken: string;
}

// Response DTO
export class CancelDeletionResponseDto {
  success: boolean;
  message: string;
}
```

## 🔧 Service 로직 주요 메서드

```typescript
@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // 설정 조회
  async getSettings(userId: string): Promise<UserSettingsResponseDto> {
    // User, UserSettings, NotificationSettings, ConnectedAccounts 조회
    // 기본값 처리 및 DTO 변환
  }

  // 프로필 업데이트
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    // 닉네임 중복 검사
    // 프로필 업데이트
    // 이미지 URL 유효성 검사
  }

  // 이메일 변경
  async updateEmail(userId: string, dto: UpdateEmailDto): Promise<UpdateEmailResponseDto> {
    // 현재 비밀번호 확인
    // 이메일 중복 검사
    // 인증 이메일 발송
    // 임시 이메일 저장
  }

  // 비밀번호 변경
  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<UpdatePasswordResponseDto> {
    // 현재 비밀번호 확인
    // 새 비밀번호 확인
    // 해시 후 업데이트
    // 모든 세션 무효화
  }

  // 개인정보 보호 설정
  async updatePrivacy(userId: string, dto: UpdatePrivacyDto): Promise<UpdatePrivacyResponseDto> {
    // UserSettings 업서트
    // 변경사항 로깅
  }

  // 알림 설정
  async updateNotifications(userId: string, dto: UpdateNotificationsDto): Promise<UpdateNotificationsResponseDto> {
    // NotificationSettings 업서트
    // 실시간 알림 설정 업데이트
  }

  // 서비스 설정
  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<UpdatePreferencesResponseDto> {
    // UserSettings 업데이트
    // 캐시 무효화
  }

  // 소셜 계정 연결
  async connectAccount(userId: string, dto: ConnectAccountDto): Promise<ConnectAccountResponseDto> {
    // OAuth 토큰 검증
    // 계정 정보 조회
    // ConnectedAccount 생성
  }

  // 소셜 계정 해제
  async disconnectAccount(userId: string, dto: DisconnectAccountDto): Promise<DisconnectAccountResponseDto> {
    // 마지막 로그인 방법 확인
    // ConnectedAccount 삭제
    // 경고 메시지 생성
  }

  // 데이터 내보내기
  async exportData(userId: string): Promise<DataExportResponseDto> {
    // 모든 사용자 데이터 수집
    // JSON 파일 생성
    // Cloudinary 업로드
    // 24시간 만료 URL 생성
  }

  // 계정 삭제
  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<DeleteAccountResponseDto> {
    // 비밀번호 확인
    // 30일 후 삭제 예약
    // 취소 토큰 생성
    // AccountDeletion 생성
  }

  // 삭제 취소
  async cancelDeletion(dto: CancelDeletionDto): Promise<CancelDeletionResponseDto> {
    // 토큰 검증
    // AccountDeletion 삭제
    // 사용자에게 알림
  }
}
```

## 🛡️ 보안 및 검증

### Guard 적용
- `JwtAuthGuard`: 모든 엔드포인트에 적용
- `RateLimitGuard`: 비밀번호/이메일 변경에 적용

### 검증 규칙
- 이메일 형식 검증
- 비밀번호 강도 검증 (대소문자, 숫자, 특수문자)
- 닉네임 중복 확인
- 파일 업로드 크기/형식 제한

### 에러 처리
```typescript
// 공통 에러 응답
export class ErrorResponseDto {
  success: false;
  error: string;
  details?: any;
}

// HTTP 상태 코드
// 400: 잘못된 요청 (검증 오류)
// 401: 인증 필요
// 403: 권한 없음
// 409: 중복 데이터 (닉네임, 이메일)
// 429: 요청 제한 초과
// 500: 서버 오류
```

## 📊 테스트 계획

### Unit Tests
- 각 Service 메서드별 단위 테스트
- DTO 검증 테스트
- 에러 시나리오 테스트

### Integration Tests
- API 엔드포인트 통합 테스트
- 데이터베이스 트랜잭션 테스트
- 인증/권한 테스트

### E2E Tests
- 설정 변경 전체 플로우
- 계정 삭제/복구 플로우
- 소셜 계정 연결/해제 플로우

## 🚀 다음 단계
→ [Phase 2: Frontend Components](./02-phase2-frontend-components.md)로 이동