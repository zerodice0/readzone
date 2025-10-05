// Settings Types and Interfaces for Frontend
// Based on Phase 2: Frontend Components implementation
// Phase 3: State Management - Added UserSettings and SettingsState interfaces

import type { ComponentType, ReactNode } from 'react'

// UserSettings Interface (Phase 3 - matches PRD specification)
export interface UserSettings {
  user: {
    id: string;
    userid: string;
    nickname: string;
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
  };
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
  isAuthError: boolean; // 인증 에러 여부 추적

  // 액션
  loadSettings: () => Promise<void>;
  updateProfile: (data: Partial<UserSettings['user']>) => Promise<void>;
  updateEmail: (data: { newEmail: string; password: string }) => Promise<void>;
  updatePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  updatePrivacy: (data: Partial<UserSettings['privacy']>) => Promise<void>;
  updateNotifications: (data: Partial<UserSettings['notifications']>) => Promise<void>;
  updatePreferences: (data: Partial<UserSettings['preferences']>) => Promise<void>;

  // 계정 관리
  deleteAccount: (data: { password: string }) => Promise<void>;

  // 유틸리티
  setActiveTab: (tab: string) => void;
  markAsChanged: () => void;
  clearError: () => void;
  requireAuthentication: () => void;
  reset: () => void;
}

// Main Settings Response Type
export interface UserSettingsResponse {
  user: {
    id: string
    userid: string
    nickname: string
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
  }
}

// Enum Types
export type VisibilityLevel = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
export type Theme = 'LIGHT' | 'DARK' | 'AUTO'
export type Language = 'KO' | 'EN'

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
}

// API Request Types
export interface UpdateProfileRequest {
  nickname?: string
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
}

export interface DeleteAccountRequest {
  password: string
}

// API Response Types
export interface UpdateProfileResponse {
  success: boolean
  user: {
    nickname: string
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
  onPasswordChange: (data: UpdatePasswordRequest) => Promise<void>
  onEmailChange: (data: UpdateEmailRequest) => Promise<void>
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
  deleteAccount: (data: DeleteAccountRequest) => Promise<void>

  // Utility
  markAsChanged: () => void
  resetChanges: () => void
  refresh: () => Promise<void>
}

export interface UseImageUploadReturn {
  uploadImage: (
    file: Blob | File,
    options?: {
      endpoint?: string
      fieldName?: string
      filename?: string
      extraFields?: Record<string, string>
    }
  ) => Promise<string>
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
