// Settings Types and Interfaces for Frontend
// Based on Phase 2: Frontend Components implementation
// Phase 3: State Management - Added UserSettings and SettingsState interfaces

import type { ComponentType, ReactNode } from 'react'

// UserSettings Interface (Phase 3 - matches PRD specification)
export interface UserSettings {
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

  connectedAccounts: {
    provider: 'GOOGLE' | 'KAKAO' | 'NAVER';
    email: string;
    connectedAt: string;
  }[];
}

// Settings Store State Interface (Phase 3)
export interface SettingsState {
  // 데이터 상태
  settings: UserSettings | null;
  originalSettings: UserSettings | null; // 변경사항 추적용

  // UI 상태
  activeTab: string;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  // 에러 상태
  error: string | null;
  fieldErrors: Record<string, string>;

  // 액션
  loadSettings: () => Promise<void>;
  updateProfile: (data: Partial<UserSettings['user']>) => Promise<void>;
  updateEmail: (data: { newEmail: string; password: string }) => Promise<void>;
  updatePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  updatePrivacy: (data: Partial<UserSettings['privacy']>) => Promise<void>;
  updateNotifications: (data: Partial<UserSettings['notifications']>) => Promise<void>;
  updatePreferences: (data: Partial<UserSettings['preferences']>) => Promise<void>;

  // 계정 관리
  connectAccount: (provider: SocialProvider, authCode: string) => Promise<void>;
  disconnectAccount: (provider: SocialProvider) => Promise<void>;
  exportData: () => Promise<string>;
  deleteAccount: (data: { password: string; reason?: string; feedback?: string }) => Promise<void>;
  cancelDeletion: (token: string) => Promise<void>;

  // 유틸리티
  setActiveTab: (tab: string) => void;
  clearError: () => void;
  reset: () => void;
}

// Main Settings Response Type
export interface UserSettingsResponse {
  user: {
    id: string
    username: string
    email: string
    bio?: string
    profileImage?: string
    createdAt: string
  }

  privacy: {
    profileVisibility: VisibilityLevel
    activityVisibility: VisibilityLevel
    searchable: boolean
    showEmail: boolean
    showFollowers: boolean
    showFollowing: boolean
  }

  notifications: {
    likes: {
      enabled: boolean
      email: boolean
      push: boolean
    }
    comments: {
      enabled: boolean
      email: boolean
      push: boolean
    }
    follows: {
      enabled: boolean
      email: boolean
      push: boolean
    }
    quietHours: {
      enabled: boolean
      startTime: string // "22:00"
      endTime: string   // "08:00"
    }
  }

  preferences: {
    theme: Theme
    language: Language
    defaultFeedTab: FeedTab
    contentFilter: {
      hideNSFW: boolean
      hideSpoilers: boolean
      hideNegativeReviews: boolean
    }
    dataUsage: {
      imageQuality: ImageQuality
      autoplayVideos: boolean
      preloadImages: boolean
    }
  }

  connectedAccounts: ConnectedAccount[]
}

// Enum Types
export type VisibilityLevel = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
export type Theme = 'LIGHT' | 'DARK' | 'AUTO'
export type Language = 'KO' | 'EN'
export type FeedTab = 'RECOMMENDED' | 'LATEST' | 'FOLLOWING'
export type ImageQuality = 'LOW' | 'MEDIUM' | 'HIGH'
export type SocialProvider = 'GOOGLE' | 'KAKAO' | 'NAVER'

// Individual Setting Categories
export interface PrivacySettings {
  profileVisibility: VisibilityLevel
  activityVisibility: VisibilityLevel
  searchable: boolean
  showEmail: boolean
  showFollowers: boolean
  showFollowing: boolean
}

export interface NotificationSettings {
  likes: {
    enabled: boolean
    email: boolean
    push: boolean
  }
  comments: {
    enabled: boolean
    email: boolean
    push: boolean
  }
  follows: {
    enabled: boolean
    email: boolean
    push: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
}

export interface UserPreferences {
  theme: Theme
  language: Language
  defaultFeedTab: FeedTab
  contentFilter: {
    hideNSFW: boolean
    hideSpoilers: boolean
    hideNegativeReviews: boolean
  }
  dataUsage: {
    imageQuality: ImageQuality
    autoplayVideos: boolean
    preloadImages: boolean
  }
}

export interface ConnectedAccount {
  provider: SocialProvider
  email: string
  connectedAt: string
}

// API Request Types
export interface UpdateProfileRequest {
  username?: string
  bio?: string
  profileImage?: string
}

export interface UpdateEmailRequest {
  newEmail: string
  password: string
}

export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdatePrivacyRequest {
  profileVisibility?: VisibilityLevel
  activityVisibility?: VisibilityLevel
  searchable?: boolean
  showEmail?: boolean
  showFollowers?: boolean
  showFollowing?: boolean
}

export interface UpdateNotificationsRequest {
  likes?: {
    enabled?: boolean
    email?: boolean
    push?: boolean
  }
  comments?: {
    enabled?: boolean
    email?: boolean
    push?: boolean
  }
  follows?: {
    enabled?: boolean
    email?: boolean
    push?: boolean
  }
  quietHours?: {
    enabled?: boolean
    startTime?: string
    endTime?: string
  }
}

export interface UpdatePreferencesRequest {
  theme?: Theme
  language?: Language
  defaultFeedTab?: FeedTab
  contentFilter?: {
    hideNSFW?: boolean
    hideSpoilers?: boolean
    hideNegativeReviews?: boolean
  }
  dataUsage?: {
    imageQuality?: ImageQuality
    autoplayVideos?: boolean
    preloadImages?: boolean
  }
}

export interface ConnectAccountRequest {
  provider: SocialProvider
  authCode: string
}

export interface DisconnectAccountRequest {
  provider: SocialProvider
}

export interface DeleteAccountRequest {
  password: string
  reason?: string
  feedback?: string
}

export interface CancelDeletionRequest {
  cancellationToken: string
}

// API Response Types
export interface UpdateProfileResponse {
  success: boolean
  user: {
    username: string
    bio?: string
    profileImage?: string
  }
  errors?: {
    field: string
    message: string
  }[]
}

export interface UpdateEmailResponse {
  success: boolean
  message: string
  requiresVerification: boolean
  verificationSent: boolean
}

export interface UpdatePasswordResponse {
  success: boolean
  message: string
  errors?: {
    field: string
    message: string
  }[]
}

export interface ConnectAccountResponse {
  success: boolean
  connectedAccount: {
    provider: string
    email: string
    connectedAt: string
  }
}

export interface DisconnectAccountResponse {
  success: boolean
  remainingMethods: string[]
  warning?: string // 마지막 로그인 방법인 경우 경고
}

export interface DataExportResponse {
  downloadUrl: string
  expiresAt: string
  fileSize: number
  format: 'json' | 'csv'
}

export interface DeleteAccountResponse {
  success: boolean
  deletionDate: string // 30일 후 실제 삭제일
  cancellationToken: string // 삭제 취소용 토큰
}

export interface CancelDeletionResponse {
  success: boolean
  message: string
}

// Component Props Types
export interface SettingsPageProps {
  initialData?: UserSettingsResponse
}

export interface SettingsNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  hasUnsavedChanges: boolean
}

export interface ProfileSettingsProps {
  user: UserSettingsResponse['user']
  onUpdate: (data: UpdateProfileRequest) => Promise<void>
  isLoading: boolean
}

export interface PrivacySettingsProps {
  privacy: PrivacySettings
  onUpdate: (privacy: UpdatePrivacyRequest) => Promise<void>
  isLoading: boolean
}

export interface NotificationSettingsProps {
  notifications: NotificationSettings
  onUpdate: (notifications: UpdateNotificationsRequest) => Promise<void>
  isLoading: boolean
}

export interface PreferenceSettingsProps {
  preferences: UserPreferences
  onUpdate: (preferences: UpdatePreferencesRequest) => Promise<void>
  isLoading: boolean
}

export interface AccountManagementProps {
  connectedAccounts: ConnectedAccount[]
  onConnect: (provider: SocialProvider) => Promise<void>
  onDisconnect: (provider: SocialProvider) => Promise<void>
  onPasswordChange: (data: UpdatePasswordRequest) => Promise<void>
  onDeleteAccount: () => void
}

// Form Components Props
export interface ProfileImageUploadProps {
  currentImage?: string
  onUpdate: (imageUrl: string) => Promise<void>
}

export interface EmailChangeFormProps {
  currentEmail: string
  onSubmit: (data: UpdateEmailRequest) => Promise<void>
  isLoading?: boolean
}

export interface PasswordChangeFormProps {
  onSubmit: (data: UpdatePasswordRequest) => Promise<void>
  isLoading?: boolean
}

export interface ThemeSelectorProps {
  value: Theme
  onChange: (theme: Theme) => void
  disabled?: boolean
}

// Modal Components Props
export interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: DeleteAccountRequest) => Promise<void>
  isLoading: boolean
}

export interface ImageCropperModalProps {
  image: string
  isOpen: boolean
  onClose: () => void
  onCropComplete: (croppedImage: Blob) => Promise<void>
  isLoading: boolean
}

export interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

// Common UI Components Props
export interface SettingsCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export interface SettingsToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  description?: string
}

export interface SettingsSelectProps<T = string> {
  value: T
  onChange: (value: T) => void
  options: {
    value: T
    label: string
    description?: string
  }[]
  disabled?: boolean
  placeholder?: string
}

// Hook Types
export interface UseSettingsReturn {
  settings: UserSettingsResponse | null
  isLoading: boolean
  error: string | null
  hasUnsavedChanges: boolean

  // Actions
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  updateEmail: (data: UpdateEmailRequest) => Promise<void>
  updatePassword: (data: UpdatePasswordRequest) => Promise<void>
  updatePrivacy: (data: UpdatePrivacyRequest) => Promise<void>
  updateNotifications: (data: UpdateNotificationsRequest) => Promise<void>
  updatePreferences: (data: UpdatePreferencesRequest) => Promise<void>

  // Account management
  connectAccount: (provider: SocialProvider) => Promise<void>
  disconnectAccount: (provider: SocialProvider) => Promise<void>
  exportData: () => Promise<string>
  deleteAccount: (data: DeleteAccountRequest) => Promise<void>
  cancelDeletion: (token: string) => Promise<void>

  // Utility
  markAsChanged: () => void
  resetChanges: () => void
  refresh: () => Promise<void>
}

export interface UseImageUploadReturn {
  uploadImage: (file: Blob) => Promise<string>
  isUploading: boolean
  error: string | null
  progress: number | undefined
  clearError: () => void
  reset: () => void
}

export interface UseConfirmationReturn {
  showConfirmation: (options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'danger'
  }) => Promise<boolean>
  ConfirmationModal: ComponentType
}

// Settings Tab Type
export type SettingsTab = 'profile' | 'privacy' | 'notifications' | 'preferences' | 'account'

// Password Strength Types
export interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
  isValid: boolean
}

// Navigation Item Type
export interface NavigationItem {
  id: SettingsTab
  label: string
  icon: ComponentType<{ className?: string }>
  description: string
}

// Data Export Types
export interface DataExportOptions {
  format: 'json' | 'csv'
  includeReviews: boolean
  includeComments: boolean
  includeLikes: boolean
  includeFollows: boolean
}