import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { handleApiError } from '@/lib/api/settings'
import { notificationsApi } from '@/lib/api/notifications'
import type {
  BulkUpdateNotificationsRequest,
  GetNotificationsRequest,
  Notification,
  NotificationAction,
  NotificationPagination,
  NotificationSummary,
  NotificationTab,
  NotificationType,
} from '@/types/notifications'
import { useAuthStore } from '@/store/authStore'

// Store State
interface NotificationsState {
  // Data
  notifications: Notification[]
  pagination: NotificationPagination | null
  summary: NotificationSummary | null

  // Filters
  filters: {
    tab: NotificationTab
    type?: NotificationType
    dateFrom?: string
    dateTo?: string
  }

  // Loading states
  isLoading: boolean
  isLoadingMore: boolean
  isUpdating: boolean

  // Error
  error: string | null

  // Actions
  loadNotifications: () => Promise<void>
  loadMore: () => Promise<void>
  updateNotification: (id: string, action: NotificationAction) => Promise<void>
  bulkUpdateNotifications: (action: NotificationAction, filters?: { type?: NotificationType; dateFrom?: string; dateTo?: string }) => Promise<void>
  refreshUnreadCount: () => Promise<void>
  setFilter: (key: keyof NotificationsState['filters'], value: string | undefined) => void
  clearError: () => void
  reset: () => void
}

// API 호출 중복 방지
let loadingPromise: Promise<void> | null = null

export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    immer((set, get) => ({
      // 초기 상태
      notifications: [],
      pagination: null,
      summary: null,
      filters: {
        tab: 'all',
      },
      isLoading: false,
      isLoadingMore: false,
      isUpdating: false,
      error: null,

      // 알림 로드
      loadNotifications: async () => {
        const { isLoading, filters } = get()
        const { isAuthenticated, isAuthReady } = useAuthStore.getState()

        if (!isAuthReady) {
          return Promise.resolve()
        }

        // 이미 로딩 중이면 기존 Promise 반환
        if (isLoading || loadingPromise) {
          return loadingPromise ?? Promise.resolve()
        }

        if (!isAuthenticated) {
          set((state) => {
            state.error = '인증이 필요합니다.'
          })

          return Promise.resolve()
        }

        set((state) => {
          state.isLoading = true
          state.error = null
        })

        loadingPromise = (async () => {
          try {
            const params: GetNotificationsRequest = { tab: filters.tab, limit: 20 }

            if (filters.type) {
              params.type = filters.type
            }

            if (filters.dateFrom) {
              params.dateFrom = filters.dateFrom
            }

            if (filters.dateTo) {
              params.dateTo = filters.dateTo
            }

            const response = await notificationsApi.getNotifications(params)

            set((state) => {
              state.notifications = response.notifications
              state.pagination = response.pagination
              state.summary = response.summary
              state.isLoading = false
            })
          } catch (error: unknown) {
            set((state) => {
              state.isLoading = false
              state.error = handleApiError(error)
            })
          } finally {
            loadingPromise = null
          }
        })()

        return loadingPromise
      },

      // 더 불러오기
      loadMore: async () => {
        const { isLoadingMore, pagination, filters, notifications } = get()
        const { isAuthenticated } = useAuthStore.getState()

        if (isLoadingMore || !pagination?.hasMore || !pagination.nextCursor || !isAuthenticated) {
          return
        }

        set((state) => {
          state.isLoadingMore = true
          state.error = null
        })

        try {
          const params: GetNotificationsRequest = {
            tab: filters.tab,
            cursor: pagination.nextCursor,
            limit: 20,
          }

          if (filters.type) {
            params.type = filters.type
          }

          if (filters.dateFrom) {
            params.dateFrom = filters.dateFrom
          }

          if (filters.dateTo) {
            params.dateTo = filters.dateTo
          }

          const response = await notificationsApi.getNotifications(params)

          set((state) => {
            state.notifications = [...notifications, ...response.notifications]
            state.pagination = response.pagination
            state.summary = response.summary
            state.isLoadingMore = false
          })
        } catch (error: unknown) {
          set((state) => {
            state.isLoadingMore = false
            state.error = handleApiError(error)
          })
        }
      },

      // 알림 업데이트
      updateNotification: async (id, action) => {
        const { notifications } = get()

        // 낙관적 업데이트
        const notificationIndex = notifications.findIndex(n => n.id === id)

        if (notificationIndex === -1) {return}

        const originalNotification = notifications[notificationIndex]

        if (!originalNotification) {return}

        set((state) => {
          state.isUpdating = true
          state.error = null

          if (action === 'delete') {
            state.notifications = state.notifications.filter(n => n.id !== id)
          } else {
            const notification = state.notifications[notificationIndex]

            if (notification) {
              notification.isRead = action === 'read'
            }
          }
        })

        try {
          const response = await notificationsApi.updateNotification(id, action)

          set((state) => {
            state.isUpdating = false

            if (action !== 'delete' && response.notification) {
              const idx = state.notifications.findIndex(n => n.id === id)

              if (idx !== -1) {
                state.notifications[idx] = response.notification
              }
            }

            // 미읽음 수 업데이트
            if (state.summary) {
              state.summary.unreadCount = response.unreadCount
            }
          })
        } catch (error: unknown) {
          // 롤백
          set((state) => {
            state.isUpdating = false
            state.error = handleApiError(error)

            if (action === 'delete') {
              state.notifications.splice(notificationIndex, 0, originalNotification)
            } else {
              const notification = state.notifications[notificationIndex]

              if (notification) {
                notification.isRead = originalNotification.isRead
              }
            }
          })
        }
      },

      // 일괄 업데이트
      bulkUpdateNotifications: async (action, filters) => {
        set((state) => {
          state.isUpdating = true
          state.error = null
        })

        try {
          const params: BulkUpdateNotificationsRequest = { action }

          if (filters?.type) {
            params.type = filters.type
          }

          if (filters?.dateFrom) {
            params.dateFrom = filters.dateFrom
          }

          if (filters?.dateTo) {
            params.dateTo = filters.dateTo
          }

          const response = await notificationsApi.bulkUpdateNotifications(params)

          if (response.success) {
            // 전체 목록 다시 로드
            await get().loadNotifications()
          }

          set((state) => {
            state.isUpdating = false
          })
        } catch (error: unknown) {
          set((state) => {
            state.isUpdating = false
            state.error = handleApiError(error)
          })
        }
      },

      // 미읽음 수 갱신
      refreshUnreadCount: async () => {
        const { isAuthenticated } = useAuthStore.getState()

        if (!isAuthenticated) {
          return
        }

        try {
          const response = await notificationsApi.getUnreadCount()

          set((state) => {
            if (state.summary) {
              state.summary.unreadCount = response.count
            } else {
              state.summary = {
                unreadCount: response.count,
                todayCount: 0,
                thisWeekCount: 0,
              }
            }
          })
        } catch (error: unknown) {
          // 미읽음 수 갱신 실패는 조용히 처리
          console.error('Failed to refresh unread count:', error)
        }
      },

      // 필터 설정
      setFilter: (key, value) => {
        set((state) => {
          if (value === undefined) {
            // undefined인 경우 해당 키를 제거
            const { [key]: _, ...rest } = state.filters

            state.filters = rest as typeof state.filters
          } else {
            state.filters[key] = value as never
          }
        })

        // 필터 변경 시 목록 다시 로드
        get().loadNotifications()
      },

      // 에러 클리어
      clearError: () => set((state) => {
        state.error = null
      }),

      // 리셋
      reset: () => {
        loadingPromise = null

        set(() => ({
          notifications: [],
          pagination: null,
          summary: null,
          filters: {
            tab: 'all',
          },
          isLoading: false,
          isLoadingMore: false,
          isUpdating: false,
          error: null,
        }))
      },
    })),
    { name: 'notifications-store' }
  )
)
