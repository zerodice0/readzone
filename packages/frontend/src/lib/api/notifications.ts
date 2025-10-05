import { api } from './client'
import type {
  BulkUpdateNotificationsRequest,
  BulkUpdateNotificationsResponse,
  GetNotificationsRequest,
  NotificationAction,
  NotificationsResponse,
  UnreadCountResponse,
  UpdateNotificationResponse,
} from '@/types/notifications'

/**
 * Notifications API abstraction layer
 * Provides type-safe API calls for notifications management
 */
export const notificationsApi = {
  /**
   * 알림 목록 조회
   */
  async getNotifications(params?: GetNotificationsRequest): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams()

    if (params?.tab) {
      queryParams.append('tab', params.tab)
    }

    if (params?.type) {
      queryParams.append('type', params.type)
    }

    if (params?.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom)
    }

    if (params?.dateTo) {
      queryParams.append('dateTo', params.dateTo)
    }

    if (params?.cursor) {
      queryParams.append('cursor', params.cursor)
    }

    if (params?.limit) {
      queryParams.append('limit', params.limit.toString())
    }

    const query = queryParams.toString()
    const url = query ? `/api/notifications?${query}` : '/api/notifications'

    const response = await api.get<NotificationsResponse>(url)

    return response.data
  },

  /**
   * 미읽음 알림 수 조회
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await api.get<UnreadCountResponse>('/api/notifications/unread-count')

    return response.data
  },

  /**
   * 알림 업데이트 (읽음/미읽음/삭제)
   */
  async updateNotification(id: string, action: NotificationAction): Promise<UpdateNotificationResponse> {
    const response = await api.put<UpdateNotificationResponse>(`/api/notifications/${id}`, { action })

    return response.data
  },

  /**
   * 알림 일괄 업데이트
   */
  async bulkUpdateNotifications(data: BulkUpdateNotificationsRequest): Promise<BulkUpdateNotificationsResponse> {
    const response = await api.put<BulkUpdateNotificationsResponse>('/api/notifications/bulk', data)

    return response.data
  },
}
