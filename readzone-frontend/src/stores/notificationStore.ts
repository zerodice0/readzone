import React from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { notificationService, type Notification } from '../services/notificationService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface NotificationActions {
  fetchNotifications: (params?: { page?: number; limit?: number; type?: string; isRead?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearError: () => void;
  resetNotifications: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    fetchNotifications: async (params = {}) => {
      set({ isLoading: true, error: null });
      try {
        const data = await notificationService.getNotifications(params);
        set({
          notifications: data.notifications,
          pagination: data.pagination,
          isLoading: false,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.error?.message || '알림을 불러오는 중 오류가 발생했습니다.',
          isLoading: false,
        });
      }
    },

    fetchUnreadCount: async () => {
      try {
        // 토큰이 있는지 확인
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) {
          console.log('NotificationStore: No auth storage found, skipping fetchUnreadCount');
          return;
        }
        
        const { state } = JSON.parse(authStorage);
        if (!state?.token) {
          console.log('NotificationStore: No token found, skipping fetchUnreadCount');
          return;
        }

        const count = await notificationService.getUnreadCount();
        set({ unreadCount: count });
      } catch (error: any) {
        console.error('읽지 않은 알림 개수 조회 오류:', error);
        // 401 에러일 경우 unreadCount를 0으로 리셋
        if (error.response?.status === 401) {
          set({ unreadCount: 0 });
        }
      }
    },

    markAsRead: async (notificationId: string) => {
      try {
        await notificationService.markAsRead(notificationId);
        
        // 알림 목록에서 해당 알림을 업데이트
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      } catch (error: any) {
        set({
          error: error.response?.data?.error?.message || '알림 읽음 처리 중 오류가 발생했습니다.',
        });
      }
    },

    markAllAsRead: async () => {
      try {
        await notificationService.markAllAsRead();
        
        // 모든 알림을 읽음 상태로 업데이트
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            isRead: true,
          })),
          unreadCount: 0,
        }));
      } catch (error: any) {
        set({
          error: error.response?.data?.error?.message || '모든 알림 읽음 처리 중 오류가 발생했습니다.',
        });
      }
    },

    deleteNotification: async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(notificationId);
        
        // 알림 목록에서 해당 알림을 제거
        set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId);
          const wasUnread = notification && !notification.isRead;
          
          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
            pagination: {
              ...state.pagination,
              total: Math.max(0, state.pagination.total - 1),
            },
          };
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.error?.message || '알림 삭제 중 오류가 발생했습니다.',
        });
      }
    },

    clearError: () => {
      set({ error: null });
    },

    resetNotifications: () => {
      set(initialState);
    },
  }))
);

// 읽지 않은 알림 개수를 주기적으로 업데이트하는 훅
export const useNotificationPolling = (interval = 30000) => {
  const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount);

  React.useEffect(() => {
    // 초기 로드
    fetchUnreadCount();

    // 주기적 업데이트
    const intervalId = setInterval(fetchUnreadCount, interval);

    return () => clearInterval(intervalId);
  }, [fetchUnreadCount, interval]);
};