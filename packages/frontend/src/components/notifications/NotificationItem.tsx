import { Check, Circle, Heart, MessageCircle, MessageSquare, UserPlus, X } from 'lucide-react'
import type { Notification } from '@/types/notifications'
import { formatTimeAgo } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { useNotificationsStore } from '@/store/notificationsStore'

interface NotificationItemProps {
  notification: Notification
}

const NotificationItem = ({ notification }: NotificationItemProps) => {
  const navigate = useNavigate()
  const updateNotification = useNotificationsStore(state => state.updateNotification)

  // 알림 타입에 따른 아이콘 선택
  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-green-500" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />
      default:
        return null
    }
  }

  // 알림 클릭 핸들러
  const handleClick = async () => {
    // 미읽음이면 읽음으로 변경
    if (!notification.isRead) {
      await updateNotification(notification.id, 'read')
    }

    // 액션 URL로 이동
    if (notification.actionUrl) {
      navigate({ to: notification.actionUrl })
    }
  }

  // 읽음/미읽음 토글
  const handleToggleRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const action = notification.isRead ? 'unread' : 'read'

    await updateNotification(notification.id, action)
  }

  // 삭제
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateNotification(notification.id, 'delete')
  }

  return (
    <article
      className={`notification-item border-b border-border p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* 아이콘 */}
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>

        {/* 액터 프로필 이미지 */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {notification.actor.profileImage ? (
              <img
                src={notification.actor.profileImage}
                alt={`${notification.actor.username}의 프로필`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {notification.actor.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* 알림 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* 메시지 */}
              <p className="text-sm text-foreground">
                <span className="font-semibold">{notification.actor.username}</span>
                {notification.additionalActors && notification.actorCount && notification.actorCount > 1 && (
                  <span className="text-muted-foreground">
                    {' '}외 {notification.actorCount - 1}명
                  </span>
                )}
                {' '}
                <span className="text-muted-foreground">{notification.message}</span>
              </p>

              {/* 타겟 컨텐츠 */}
              {notification.target && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {notification.target.content}
                </p>
              )}

              {/* 시간 */}
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimeAgo(notification.createdAt)}
              </p>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center space-x-1 ml-2">
              {/* 읽음/미읽음 토글 */}
              <button
                onClick={handleToggleRead}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title={notification.isRead ? '미읽음으로 표시' : '읽음으로 표시'}
              >
                {notification.isRead ? (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>

              {/* 삭제 */}
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title="삭제"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default NotificationItem
