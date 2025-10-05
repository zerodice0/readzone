# 08. 설정 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/settings`
- **우선순위**: 2순위 (Core Features)
- **설명**: 개인 설정, 계정 관리, 알림 설정, 개인정보 보호
- **인증**: 로그인 필수

## 📋 참조 문서

### 사용자 플로우
- **[프로필 관리](../user-flows/profile-management.md)** - 프로필 편집, 계정 삭제, 프로필 사진 관리
- **[알림 시스템](../user-flows/notifications.md)** - 알림 설정, 스마트 관리
- **[오류 처리](../user-flows/error-handling.md)** - 설정 저장 실패, 검증 오류

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 설정의 사용자 관리 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 프로필 및 활동 관리 흐름

### 관련 PRD 문서
- **[프로필 페이지](./07-profile.md)** - 프로필 편집 연결점
- **[알림 페이지](./10-notifications.md)** - 알림 설정과 실제 알림 페이지
- **[비밀번호 찾기 페이지](./12-forgot-password.md)** - 비밀번호 변경 정책 공유
- **[신고/차단 관리 페이지](./13-moderation.md)** - 차단 목록 관리

## 핵심 기능

### 1. 계정 설정
- **기본 정보 편집**: 닉네임, 이메일, 자기소개
- **프로필 사진 관리**: 업로드, 변경, 삭제
- **비밀번호 변경**: 현재 비밀번호 확인 후 변경
- **계정 연결**: 소셜 로그인 계정 연결/해제
- **계정 삭제**: 30일 유예기간 후 완전 삭제

### 2. 개인정보 보호 설정
- **프로필 공개 범위**: 전체공개, 팔로워만, 비공개
- **활동 내역 공개**: 독후감, 좋아요, 댓글 공개 범위
- **검색 노출**: 검색 결과 노출 여부
- **데이터 다운로드**: 개인 데이터 내보내기

### 3. 알림 설정
- **알림 유형별 설정**: 좋아요, 댓글, 팔로우 알림 개별 제어
- **알림 시간 설정**: 방해금지 시간 설정
- **이메일 알림**: 주요 알림 이메일 발송 여부
- **푸시 알림**: 브라우저 푸시 알림 허용 여부

### 4. 서비스 설정
- **테마 설정**: 라이트/다크 모드, 자동 모드
- **언어 설정**: 한국어, 영어 (향후 확장)
- **피드 설정**: 기본 피드 탭, 콘텐츠 필터링
- **데이터 절약**: 이미지 품질, 자동재생 설정

## 필요한 API

### GET `/api/settings`
```typescript
interface UserSettingsResponse {
  user: {
    id: string;
    username: string;
    email: string;
    bio?: string;
    profileImage?: string;
    createdAt: string;
  };
  
  privacy: {
    profileVisibility: 'public' | 'followers' | 'private';
    activityVisibility: 'public' | 'followers' | 'private';
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
      startTime: string; // "22:00"
      endTime: string;   // "08:00"
    };
  };
  
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'ko' | 'en';
    defaultFeedTab: 'recommended' | 'latest' | 'following';
    contentFilter: {
      hideNSFW: boolean;
      hideSpoilers: boolean;
      hideNegativeReviews: boolean;
    };
    dataUsage: {
      imageQuality: 'low' | 'medium' | 'high';
      autoplayVideos: boolean;
      preloadImages: boolean;
    };
  };
  
  connectedAccounts: Array<{
    provider: 'google' | 'kakao' | 'naver';
    email: string;
    connectedAt: string;
  }>;
}
```

### PUT `/api/settings/profile`
```typescript
interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  profileImage?: string;
}

interface UpdateProfileResponse {
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

### PUT `/api/settings/email`
```typescript
interface UpdateEmailRequest {
  newEmail: string;
  password: string;
}

interface UpdateEmailResponse {
  success: boolean;
  message: string;
  requiresVerification: boolean;
  verificationSent: boolean;
}
```

### PUT `/api/settings/password`
```typescript
interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdatePasswordResponse {
  success: boolean;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### PUT `/api/settings/privacy`
```typescript
interface UpdatePrivacyRequest {
  profileVisibility?: 'public' | 'followers' | 'private';
  activityVisibility?: 'public' | 'followers' | 'private';
  searchable?: boolean;
  showEmail?: boolean;
  showFollowers?: boolean;
  showFollowing?: boolean;
}

interface UpdatePrivacyResponse {
  success: boolean;
  privacy: PrivacySettings;
}
```

### PUT `/api/settings/notifications`
```typescript
interface UpdateNotificationsRequest {
  likes?: {
    enabled?: boolean;
    email?: boolean;
    push?: boolean;
  };
  comments?: {
    enabled?: boolean;
    email?: boolean;
    push?: boolean;
  };
  follows?: {
    enabled?: boolean;
    email?: boolean;
    push?: boolean;
  };
  quietHours?: {
    enabled?: boolean;
    startTime?: string;
    endTime?: string;
  };
}

interface UpdateNotificationsResponse {
  success: boolean;
  notifications: NotificationSettings;
}
```

### PUT `/api/settings/preferences`
```typescript
interface UpdatePreferencesRequest {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'ko' | 'en';
  defaultFeedTab?: 'recommended' | 'latest' | 'following';
  contentFilter?: {
    hideNSFW?: boolean;
    hideSpoilers?: boolean;
    hideNegativeReviews?: boolean;
  };
  dataUsage?: {
    imageQuality?: 'low' | 'medium' | 'high';
    autoplayVideos?: boolean;
    preloadImages?: boolean;
  };
}

interface UpdatePreferencesResponse {
  success: boolean;
  preferences: UserPreferences;
}
```

### POST `/api/settings/account/connect`
```typescript
interface ConnectAccountRequest {
  provider: 'google' | 'kakao' | 'naver';
  authCode: string;
}

interface ConnectAccountResponse {
  success: boolean;
  connectedAccount: {
    provider: string;
    email: string;
    connectedAt: string;
  };
}
```

### DELETE `/api/settings/account/disconnect`
```typescript
interface DisconnectAccountRequest {
  provider: 'google' | 'kakao' | 'naver';
}

interface DisconnectAccountResponse {
  success: boolean;
  remainingMethods: string[];
  warning?: string; // 마지막 로그인 방법인 경우 경고
}
```

### GET `/api/settings/data-export`
```typescript
interface DataExportResponse {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  format: 'json' | 'csv';
}
```

### POST `/api/settings/account/delete`
```typescript
interface DeleteAccountRequest {
  password: string;
  reason?: string;
  feedback?: string;
}

interface DeleteAccountResponse {
  success: boolean;
  deletionDate: string; // 30일 후 실제 삭제일
  cancellationToken: string; // 삭제 취소용 토큰
}
```

### POST `/api/settings/account/cancel-deletion`
```typescript
interface CancelDeletionRequest {
  cancellationToken: string;
}

interface CancelDeletionResponse {
  success: boolean;
  message: string;
}
```

## 컴포넌트 구조

### 1. SettingsPage (메인 컴포넌트)
```typescript
interface SettingsPageProps {
  initialData?: UserSettingsResponse;
}

// 상태 관리
- activeTab: 'profile' | 'privacy' | 'notifications' | 'preferences' | 'account'
- settings: UserSettingsResponse
- isLoading: boolean
- hasChanges: boolean
- isSaving: boolean
```

### 2. SettingsNavigation (사이드바 네비게이션)
```typescript
interface SettingsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasUnsavedChanges: boolean;
}

// 탭 목록
- 프로필 설정
- 개인정보 보호
- 알림 설정
- 서비스 설정
- 계정 관리
```

### 3. ProfileSettings (프로필 설정)
```typescript
interface ProfileSettingsProps {
  user: UserProfile;
  onUpdate: (data: UpdateProfileRequest) => Promise<void>;
  isLoading: boolean;
}

// 하위 컴포넌트
- ProfileImageUpload: 프로필 사진 업로드/편집
- UsernameField: 닉네임 입력 + 중복 확인
- BioField: 자기소개 텍스트에리어
- EmailField: 이메일 변경 (별도 확인 필요)
```

### 4. PrivacySettings (개인정보 설정)
```typescript
interface PrivacySettingsProps {
  privacy: PrivacySettings;
  onUpdate: (privacy: UpdatePrivacyRequest) => Promise<void>;
  isLoading: boolean;
}

// 설정 항목
- 프로필 공개 범위
- 활동 내역 공개 범위
- 검색 노출 여부
- 이메일 주소 공개 여부
- 팔로워/팔로잉 목록 공개 여부
```

### 5. NotificationSettings (알림 설정)
```typescript
interface NotificationSettingsProps {
  notifications: NotificationSettings;
  onUpdate: (notifications: UpdateNotificationsRequest) => Promise<void>;
  isLoading: boolean;
}

// 설정 항목
- 알림 유형별 on/off
- 이메일 알림 여부
- 푸시 알림 여부
- 방해금지 시간 설정
```

### 6. PreferenceSettings (서비스 설정)
```typescript
interface PreferenceSettingsProps {
  preferences: UserPreferences;
  onUpdate: (preferences: UpdatePreferencesRequest) => Promise<void>;
  isLoading: boolean;
}

// 설정 항목
- 테마 선택 (라이트/다크/자동)
- 기본 피드 탭
- 콘텐츠 필터링 옵션
- 데이터 사용량 설정
```

### 7. AccountManagement (계정 관리)
```typescript
interface AccountManagementProps {
  connectedAccounts: ConnectedAccount[];
  onConnect: (provider: string) => Promise<void>;
  onDisconnect: (provider: string) => Promise<void>;
  onPasswordChange: (data: UpdatePasswordRequest) => Promise<void>;
  onDeleteAccount: () => void;
}

// 기능
- 비밀번호 변경
- 소셜 계정 연결/해제
- 데이터 다운로드
- 계정 삭제
```

### 8. DeleteAccountModal (계정 삭제 모달)
```typescript
interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: DeleteAccountRequest) => Promise<void>;
  isLoading: boolean;
}

// 삭제 절차
- 비밀번호 확인
- 삭제 사유 선택 (선택사항)
- 피드백 입력 (선택사항)
- 30일 유예기간 안내
- 데이터 백업 옵션
```

## 상태 관리 (Zustand)

### SettingsStore
```typescript
interface SettingsState {
  // 상태
  settings: UserSettingsResponse | null;
  activeTab: string;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // 액션
  loadSettings: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  updateEmail: (data: UpdateEmailRequest) => Promise<void>;
  updatePassword: (data: UpdatePasswordRequest) => Promise<void>;
  updatePrivacy: (data: UpdatePrivacyRequest) => Promise<void>;
  updateNotifications: (data: UpdateNotificationsRequest) => Promise<void>;
  updatePreferences: (data: UpdatePreferencesRequest) => Promise<void>;
  
  // 계정 관리
  connectAccount: (provider: string) => Promise<void>;
  disconnectAccount: (provider: string) => Promise<void>;
  exportData: () => Promise<string>;
  deleteAccount: (data: DeleteAccountRequest) => Promise<void>;
  cancelDeletion: (token: string) => Promise<void>;
  
  // 유틸리티
  setActiveTab: (tab: string) => void;
  markAsChanged: () => void;
  resetChanges: () => void;
  reset: () => void;
}
```

## 프로필 사진 업로드

### 이미지 업로드 및 크롭
```typescript
const ProfileImageUpload: React.FC<{
  currentImage?: string;
  onUpdate: (imageUrl: string) => Promise<void>;
}> = ({ currentImage, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>();
  const [showCropper, setShowCropper] = useState(false);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 파일 유효성 검사
    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하로 업로드해주세요');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }
    
    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };
  
  const handleCropComplete = async (croppedImage: Blob) => {
    setIsUploading(true);
    try {
      // 백엔드 아바타 업로드 API 호출 (로컬 파일 스토리지 사용)
      const formData = new FormData();
      formData.append('image', croppedImage, 'avatar.webp');
      formData.append('width', '400');
      formData.append('height', '400');

      const response = await fetch(`/api/users/${user.userid}/avatar`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.profileImage) {
        await onUpdate(data.profileImage);
        toast.success('프로필 사진이 변경되었습니다');
      }
    } catch (error) {
      toast.error('이미지 업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
      setShowCropper(false);
      setPreviewImage(undefined);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
          {currentImage ? (
            <img src={currentImage} alt="프로필" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <UserIcon className="w-8 h-8" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="profile-image-input"
          />
          <label
            htmlFor="profile-image-input"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
          >
            {currentImage ? '사진 변경' : '사진 업로드'}
          </label>
          {currentImage && (
            <button
              onClick={() => onUpdate('')}
              className="block text-red-600 hover:text-red-800"
            >
              사진 삭제
            </button>
          )}
        </div>
      </div>
      
      {showCropper && previewImage && (
        <ImageCropperModal
          image={previewImage}
          isOpen={showCropper}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCropComplete}
          isLoading={isUploading}
        />
      )}
    </div>
  );
};
```

## 비밀번호 변경 시스템

### 비밀번호 강도 검증
```typescript
interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

const validatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];
  
  // 길이 검증
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('최소 8자 이상 입력해주세요');
  }
  
  // 대소문자 검증
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('대문자와 소문자를 모두 포함해주세요');
  }
  
  // 숫자 검증
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('숫자를 포함해주세요');
  }
  
  // 특수문자 검증
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('특수문자를 포함해주세요');
  }
  
  return {
    score,
    feedback,
    isValid: score >= 3
  };
};

const PasswordChangeForm: React.FC<{
  onSubmit: (data: UpdatePasswordRequest) => Promise<void>;
}> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const newPasswordStrength = useMemo(
    () => validatePasswordStrength(formData.newPassword),
    [formData.newPassword]
  );
  
  const passwordsMatch = formData.newPassword === formData.confirmPassword;
  const canSubmit = formData.currentPassword.length > 0 &&
                   newPasswordStrength.isValid &&
                   passwordsMatch;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('비밀번호가 변경되었습니다');
    } catch (error: any) {
      toast.error(error.message || '비밀번호 변경에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 현재 비밀번호 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          현재 비밀번호
        </label>
        <div className="relative">
          <input
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={(e) => setFormData({
              ...formData,
              currentPassword: e.target.value
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords({
              ...showPasswords,
              current: !showPasswords.current
            })}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
          >
            {showPasswords.current ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* 새 비밀번호 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          새 비밀번호
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => setFormData({
              ...formData,
              newPassword: e.target.value
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords({
              ...showPasswords,
              new: !showPasswords.new
            })}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
          >
            {showPasswords.new ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
        
        {/* 비밀번호 강도 표시 */}
        {formData.newPassword.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    newPasswordStrength.score <= 1 ? 'bg-red-500 w-1/4' :
                    newPasswordStrength.score === 2 ? 'bg-yellow-500 w-2/4' :
                    newPasswordStrength.score === 3 ? 'bg-blue-500 w-3/4' :
                    'bg-green-500 w-full'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-600">
                {['매우 약함', '약함', '보통', '강함', '매우 강함'][newPasswordStrength.score]}
              </span>
            </div>
            
            {newPasswordStrength.feedback.length > 0 && (
              <ul className="mt-2 text-xs text-gray-600 space-y-1">
                {newPasswordStrength.feedback.map((feedback, index) => (
                  <li key={index} className="flex items-center">
                    <XMarkIcon className="w-3 h-3 text-red-500 mr-1" />
                    {feedback}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      
      {/* 비밀번호 확인 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          새 비밀번호 확인
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({
              ...formData,
              confirmPassword: e.target.value
            })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 ${
              formData.confirmPassword.length > 0 && !passwordsMatch 
                ? 'border-red-300' 
                : 'border-gray-300'
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords({
              ...showPasswords,
              confirm: !showPasswords.confirm
            })}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
          >
            {showPasswords.confirm ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
        
        {formData.confirmPassword.length > 0 && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-600">
            비밀번호가 일치하지 않습니다
          </p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '변경 중...' : '비밀번호 변경'}
      </button>
    </form>
  );
};
```

## 테마 시스템

### 다크 모드 구현
```typescript
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark' | 'auto'>('theme', 'auto');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const ThemeSelector: React.FC<{
  value: 'light' | 'dark' | 'auto';
  onChange: (theme: 'light' | 'dark' | 'auto') => void;
}> = ({ value, onChange }) => {
  const options = [
    { value: 'light', label: '라이트', icon: SunIcon },
    { value: 'dark', label: '다크', icon: MoonIcon },
    { value: 'auto', label: '시스템 설정', icon: ComputerDesktopIcon },
  ];
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        테마
      </label>
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ value: optionValue, label, icon: Icon }) => (
          <button
            key={optionValue}
            onClick={() => onChange(optionValue as any)}
            className={`p-3 rounded-lg border-2 transition-colors ${
              value === optionValue
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
            }`}
          >
            <Icon className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

## 데이터 내보내기

### 개인 데이터 내보내기
```typescript
const DataExportSection: React.FC<{
  onExport: () => Promise<string>;
}> = ({ onExport }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<Date | null>(null);
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const downloadUrl = await onExport();
      
      // 자동 다운로드 시작
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `readzone-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setLastExport(new Date());
      toast.success('데이터 내보내기가 완료되었습니다');
    } catch (error) {
      toast.error('데이터 내보내기에 실패했습니다');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-2">개인 데이터 다운로드</h3>
      <p className="text-gray-600 text-sm mb-4">
        회원님의 모든 데이터(독후감, 댓글, 프로필 정보 등)를 JSON 형식으로 다운로드할 수 있습니다.
        다운로드 링크는 24시간 동안 유효합니다.
      </p>
      
      {lastExport && (
        <p className="text-xs text-gray-500 mb-4">
          마지막 내보내기: {lastExport.toLocaleString()}
        </p>
      )}
      
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
      >
        {isExporting ? '내보내는 중...' : '데이터 다운로드'}
      </button>
    </div>
  );
};
```

## 에러 처리

### 설정 변경 실패 처리
```typescript
const handleSettingsError = (error: any) => {
  if (error.status === 400) {
    // 유효성 검증 오류
    if (error.errors) {
      error.errors.forEach((err: any) => {
        toast.error(`${err.field}: ${err.message}`);
      });
    } else {
      toast.error(error.message || '입력값을 확인해주세요');
    }
  } else if (error.status === 409) {
    // 중복 오류 (닉네임, 이메일)
    toast.error('이미 사용 중인 정보입니다');
  } else if (error.status === 429) {
    // 너무 많은 요청
    toast.error('너무 많은 요청입니다. 잠시 후 다시 시도해주세요');
  } else {
    // 기타 서버 오류
    toast.error('설정 변경에 실패했습니다. 잠시 후 다시 시도해주세요');
  }
};
```

## 접근성

### 키보드 네비게이션
```typescript
// 설정 탭 간 키보드 네비게이션
const useSettingsKeyboardNavigation = (tabs: string[], activeTab: string, onTabChange: (tab: string) => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest('[role="tablist"]')) {
        const currentIndex = tabs.indexOf(activeTab);
        
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % tabs.length;
            onTabChange(tabs[nextIndex]);
            break;
            
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            onTabChange(tabs[prevIndex]);
            break;
            
          case 'Home':
            e.preventDefault();
            onTabChange(tabs[0]);
            break;
            
          case 'End':
            e.preventDefault();
            onTabChange(tabs[tabs.length - 1]);
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTab, onTabChange]);
};

// ARIA 라벨링
<nav role="tablist" aria-label="설정 메뉴">
  {tabs.map(tab => (
    <button
      key={tab.id}
      role="tab"
      aria-selected={activeTab === tab.id}
      aria-controls={`${tab.id}-panel`}
      id={`${tab.id}-tab`}
      onClick={() => onTabChange(tab.id)}
    >
      {tab.label}
    </button>
  ))}
</nav>

<div
  role="tabpanel"
  id={`${activeTab}-panel`}
  aria-labelledby={`${activeTab}-tab`}
>
  {/* 설정 콘텐츠 */}
</div>
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (설정 페이지 로딩)
- **FID**: < 100ms (설정 변경 응답성)
- **CLS**: < 0.1 (탭 전환 시 레이아웃 안정성)

### 사용자 경험 지표
- 설정 로딩: < 1.5초
- 설정 저장 응답: < 1초
- 탭 전환: < 200ms
- 이미지 업로드: < 3초
