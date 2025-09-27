import { api } from './client'
import type {
  CancelDeletionRequest,
  CancelDeletionResponse,
  ConnectAccountRequest,
  ConnectAccountResponse,
  DataExportResponse,
  DeleteAccountRequest,
  DeleteAccountResponse,
  DisconnectAccountRequest,
  DisconnectAccountResponse,
  UpdateEmailRequest,
  UpdateEmailResponse,
  UpdateNotificationsRequest,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  UpdatePreferencesRequest,
  UpdatePrivacyRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserSettings,
} from '@/types/settings'

/**
 * Settings API abstraction layer
 * Provides type-safe API calls for settings management
 */
export const settingsApi = {
  /**
   * 전체 설정 조회
   */
  async getSettings(): Promise<UserSettings> {
    const response = await api.get<UserSettings>('/settings')

    return response.data
  },

  /**
   * 프로필 업데이트
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const response = await api.put<UpdateProfileResponse>('/settings/profile', data)

    return response.data
  },

  /**
   * 이메일 변경
   */
  async updateEmail(data: UpdateEmailRequest): Promise<UpdateEmailResponse> {
    const response = await api.put<UpdateEmailResponse>('/settings/email', data)

    return response.data
  },

  /**
   * 비밀번호 변경
   */
  async updatePassword(data: UpdatePasswordRequest): Promise<UpdatePasswordResponse> {
    const response = await api.put<UpdatePasswordResponse>('/settings/password', data)

    return response.data
  },

  /**
   * 개인정보 보호 설정 업데이트
   */
  async updatePrivacy(data: UpdatePrivacyRequest): Promise<{ success: boolean; privacy: UserSettings['privacy'] }> {
    const response = await api.put<{ success: boolean; privacy: UserSettings['privacy'] }>('/settings/privacy', data)

    return response.data
  },

  /**
   * 알림 설정 업데이트
   */
  async updateNotifications(data: UpdateNotificationsRequest): Promise<{ success: boolean; notifications: UserSettings['notifications'] }> {
    const response = await api.put<{ success: boolean; notifications: UserSettings['notifications'] }>('/settings/notifications', data)

    return response.data
  },

  /**
   * 서비스 설정 업데이트
   */
  async updatePreferences(data: UpdatePreferencesRequest): Promise<{ success: boolean; preferences: UserSettings['preferences'] }> {
    const response = await api.put<{ success: boolean; preferences: UserSettings['preferences'] }>('/settings/preferences', data)

    return response.data
  },

  /**
   * 소셜 계정 연결
   */
  async connectAccount(data: ConnectAccountRequest): Promise<ConnectAccountResponse> {
    const response = await api.post<ConnectAccountResponse>('/settings/account/connect', data)

    return response.data
  },

  /**
   * 소셜 계정 해제
   */
  async disconnectAccount(data: DisconnectAccountRequest): Promise<DisconnectAccountResponse> {
    const response = await api.delete<DisconnectAccountResponse>('/settings/account/disconnect', { data })

    return response.data
  },

  /**
   * 데이터 내보내기
   */
  async exportData(): Promise<DataExportResponse> {
    const response = await api.get<DataExportResponse>('/settings/data-export')

    return response.data
  },

  /**
   * 계정 삭제
   */
  async deleteAccount(data: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    const response = await api.post<DeleteAccountResponse>('/settings/account/delete', data)

    return response.data
  },

  /**
   * 계정 삭제 취소
   */
  async cancelDeletion(data: CancelDeletionRequest): Promise<CancelDeletionResponse> {
    const response = await api.post<CancelDeletionResponse>('/settings/account/cancel-deletion', data)

    return response.data
  },
}

/**
 * API 에러 처리 헬퍼
 */
export const handleApiError = (error: unknown): string => {
  const errorObj = error as { response?: { status?: number; data?: { message?: string } }; message?: string }

  if (errorObj.response?.status === 401) {
    return '인증이 만료되었습니다. 다시 로그인해주세요.'
  }

  if (errorObj.response?.status === 409) {
    return '이미 사용 중인 정보입니다.'
  }

  if (errorObj.response?.status === 429) {
    return '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
  }

  if (errorObj.response?.status && errorObj.response.status >= 500) {
    return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  return errorObj.response?.data?.message ?? errorObj.message ?? '알 수 없는 오류가 발생했습니다.'
}

/**
 * 재시도 래퍼 헬퍼
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: unknown

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error: unknown) {
      lastError = error

      // 재시도하지 않을 에러들
      const errorObj = error as { response?: { status?: number } }

      if (errorObj.response?.status === 400 || errorObj.response?.status === 401 || errorObj.response?.status === 403) {
        throw error
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }

  throw lastError
}