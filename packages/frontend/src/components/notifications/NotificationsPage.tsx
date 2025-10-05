import { useEffect } from 'react'
import { useNotificationsStore } from '@/store/notificationsStore'
import { useAuthStore } from '@/store/authStore'
import { useConfirmation } from '@/hooks/useConfirmation'
import NotificationList from './NotificationList'
import { Bell, Check, Trash2 } from 'lucide-react'
import type { NotificationTab } from '@/types/notifications'

const NotificationsPage = () => {
  const { isAuthenticated, isAuthReady } = useAuthStore()
  const {
    summary,
    filters,
    isUpdating,
    setFilter,
    bulkUpdateNotifications,
    refreshUnreadCount,
  } = useNotificationsStore()

  const { showConfirmation, ConfirmationModal } = useConfirmation()

  // 미읽음 수 주기적 갱신
  useEffect(() => {
    if (!isAuthenticated || !isAuthReady) {
      return
    }

    refreshUnreadCount()

    const interval = setInterval(() => {
      refreshUnreadCount()
    }, 30000) // 30초마다 갱신

    return () => clearInterval(interval)
  }, [isAuthenticated, isAuthReady, refreshUnreadCount])

  // 로그인하지 않은 경우
  if (!isAuthenticated && isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">로그인이 필요합니다</p>
            <p className="text-xs text-muted-foreground mt-1">
              알림을 확인하려면 로그인해주세요
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 탭 변경 핸들러
  const handleTabChange = (tab: NotificationTab) => {
    setFilter('tab', tab)
  }

  // 모두 읽음 처리
  const handleMarkAllAsRead = async () => {
    const confirmed = await showConfirmation({
      title: '모두 읽음으로 표시',
      message: '모든 알림을 읽음으로 표시하시겠습니까?',
      confirmText: '확인',
      cancelText: '취소',
    })

    if (confirmed) {
      await bulkUpdateNotifications('read')
    }
  }

  // 모두 삭제
  const handleDeleteAll = async () => {
    const confirmed = await showConfirmation({
      title: '모든 알림 삭제',
      message: '모든 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
    })

    if (confirmed) {
      await bulkUpdateNotifications('delete')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-foreground" />
              <h1 className="text-2xl font-bold text-foreground">알림</h1>
              {summary && summary.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {summary.unreadCount}
                </span>
              )}
            </div>

            {/* 일괄 작업 버튼 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMarkAllAsRead}
                disabled={isUpdating || !summary || summary.unreadCount === 0}
                className="inline-flex items-center px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="모두 읽음"
              >
                <Check className="w-4 h-4 mr-1" />
                모두 읽음
              </button>

              <button
                onClick={handleDeleteAll}
                disabled={isUpdating}
                className="inline-flex items-center px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="모두 삭제"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                모두 삭제
              </button>
            </div>
          </div>

          {/* 필터 탭 */}
          <div className="flex items-center space-x-1 border-b border-border">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filters.tab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              전체
            </button>

            <button
              onClick={() => handleTabChange('unread')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filters.tab === 'unread'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              미읽음
              {summary && summary.unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {summary.unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('read')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filters.tab === 'read'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              읽음
            </button>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <NotificationList />
        </div>
      </div>

      {/* 확인 모달 */}
      <ConfirmationModal />
    </div>
  )
}

export default NotificationsPage
