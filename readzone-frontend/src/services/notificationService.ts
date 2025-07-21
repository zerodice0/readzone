import api from './api';

// 타입 정의
export interface Notification {
  id: string;
  recipientId: string;
  senderId: string | null;
  type: 'like' | 'comment' | 'follow' | 'mention';
  title: string;
  content: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    nickname: string | null;
    avatar: string | null;
  } | null;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface NotificationResponse {
  success: boolean;
  data: Notification;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

// 알림 서비스
export const notificationService = {
  // 알림 목록 조회
  getNotifications: async (params: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
  } = {}): Promise<NotificationListResponse['data']> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.type) searchParams.append('type', params.type);
    if (params.isRead !== undefined) searchParams.append('isRead', params.isRead.toString());

    const response = await api.get<NotificationListResponse>(`/notifications?${searchParams}`);
    return response.data.data;
  },

  // 읽지 않은 알림 개수 조회
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.data.count;
  },

  // 알림 읽음 처리
  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await api.patch<NotificationResponse>(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  // 모든 알림 읽음 처리
  markAllAsRead: async (): Promise<void> => {
    await api.patch<MessageResponse>('/notifications/mark-all-read');
  },

  // 알림 삭제
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete<MessageResponse>(`/notifications/${notificationId}`);
  },
};

export default notificationService;