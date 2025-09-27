import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import type {
  DeleteAccountRequest,
  SocialProvider,
  UpdateEmailRequest,
  UpdateNotificationsRequest,
  UpdatePasswordRequest,
  UpdatePreferencesRequest,
  UpdatePrivacyRequest,
  UpdateProfileRequest,
  UserSettingsResponse,
} from '@/types/settings'

/**
 * 설정 관리 커스텀 훅 (Phase 3 - Zustand 기반)
 * Zustand 설정 스토어를 사용하는 커스텀 훅 레이어
 */
export function useSettings() {
  const store = useSettingsStore()

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    if (!store.settings) {
      store.loadSettings()
    }
  }, [store, store.loadSettings, store.settings])

  return {
    // 데이터
    settings: store.settings,
    activeTab: store.activeTab,

    // 상태
    isLoading: store.isLoading,
    isSaving: store.isSaving,
    hasUnsavedChanges: store.hasUnsavedChanges,
    error: store.error,
    fieldErrors: store.fieldErrors,

    // 액션
    loadSettings: store.loadSettings,
    updateProfile: (data: UpdateProfileRequest) => store.updateProfile(data),
    updateEmail: (data: UpdateEmailRequest) => store.updateEmail(data),
    updatePassword: (data: UpdatePasswordRequest) => store.updatePassword(data),
    updatePrivacy: (data: UpdatePrivacyRequest) => store.updatePrivacy(data),
    updateNotifications: (data: UpdateNotificationsRequest) =>
      store.updateNotifications(data as Partial<UserSettingsResponse['notifications']>),
    updatePreferences: (data: UpdatePreferencesRequest) =>
      store.updatePreferences(data as Partial<UserSettingsResponse['preferences']>),

    // 계정 관리
    connectAccount: (provider: SocialProvider, authCode: string) =>
      store.connectAccount(provider, authCode),
    disconnectAccount: (provider: SocialProvider) =>
      store.disconnectAccount(provider),
    exportData: store.exportData,
    deleteAccount: (data: DeleteAccountRequest) => store.deleteAccount(data),
    cancelDeletion: (token: string) => store.cancelDeletion(token),

    // 유틸리티
    setActiveTab: store.setActiveTab,
    clearError: store.clearError,
    reset: store.reset,
    markAsChanged: () => store.setActiveTab(store.activeTab), // Trigger change detection
    refresh: store.loadSettings,
  }
}

/**
 * 설정 페이지 초기화 훅 (Phase 3 - Zustand 기반)
 * 페이지 마운트 시 자동으로 설정 로드
 */
export function useSettingsInit() {
  const settings = useSettings()

  // 컴포넌트 마운트 시 설정 로드 (useSettings에서 이미 처리됨)
  return settings
}