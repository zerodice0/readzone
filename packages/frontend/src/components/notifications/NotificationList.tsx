import { useEffect } from 'react'
import { useNotificationsStore } from '@/store/notificationsStore'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import NotificationItem from './NotificationItem'
import { Bell, Loader2 } from 'lucide-react'

const NotificationList = () => {
  const {
    notifications,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    loadNotifications,
    loadMore,
  } = useNotificationsStore()

  // 컴포넌트 마운트 시 알림 로드
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // 무한 스크롤 설정
  const loadMoreRef = useInfiniteScroll({
    hasMore: pagination?.hasMore ?? false,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  })

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">알림을 불러오는 중...</p>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
          <Bell className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">알림을 불러올 수 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <button
          onClick={() => loadNotifications()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          다시 시도
        </button>
      </div>
    )
  }

  // 빈 상태
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">알림이 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">
            새로운 알림이 도착하면 여기에 표시됩니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="notification-list">
      {/* 알림 목록 */}
      <div className="divide-y divide-border">
        {notifications.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      {pagination?.hasMore && (
        <div ref={loadMoreRef} className="py-8 flex items-center justify-center">
          {isLoadingMore && (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              <span className="text-sm text-muted-foreground">추가 로딩 중...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationList
