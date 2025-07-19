import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Filter, Check, CheckCheck, Trash2, RefreshCw, X } from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';
import Button from '../components/ui/Button';

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'like' | 'comment' | 'follow'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
  } = useNotificationStore();

  // 초기 로드 및 필터 변경 시 알림 목록 로드
  useEffect(() => {
    const params: any = { page: currentPage, limit: 20 };
    
    if (filter === 'unread') {
      params.isRead = false;
    } else if (filter !== 'all') {
      params.type = filter;
    }

    fetchNotifications(params);
  }, [fetchNotifications, filter, currentPage]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId: string) => {
    if (confirm('이 알림을 삭제하시겠습니까?')) {
      await deleteNotification(notificationId);
    }
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case 'like':
      case 'comment':
        return notification.relatedId ? `/posts/${notification.relatedId}` : '#';
      case 'follow':
        return notification.relatedId ? `/users/${notification.relatedId}` : '#';
      default:
        return '#';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      default:
        return '📢';
    }
  };

  const filterOptions = [
    { value: 'all', label: '전체', count: pagination.total },
    { value: 'unread', label: '읽지 않음', count: unreadCount },
    { value: 'like', label: '좋아요', count: null },
    { value: 'comment', label: '댓글', count: null },
    { value: 'follow', label: '팔로우', count: null },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Bell className="w-8 h-8 mr-3" />
                알림
              </h1>
              <p className="text-gray-600 mt-2">
                회원님의 활동에 대한 알림을 확인하세요
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => fetchNotifications({ page: currentPage, limit: 20 })}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="primary"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  모두 읽음 ({unreadCount})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                <Filter className="w-4 h-4 inline mr-1" />
                {option.label}
                {option.count !== null && (
                  <span className="ml-1 text-xs">({option.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 animate-pulse" />
              <p>알림을 불러오는 중...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-2">알림이 없습니다</p>
              <p>새로운 활동이 있으면 여기에 알림이 표시됩니다.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative group p-6 ${
                    !notification.isRead ? 'bg-blue-50' : 'bg-white'
                  } hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-start space-x-4">
                    {/* 아이콘 */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link
                            to={getNotificationLink(notification)}
                            className="block hover:underline"
                          >
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.content}
                            </p>
                          </Link>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                            {notification.sender && (
                              <span>
                                from {notification.sender.displayName || notification.sender.username}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 읽지 않음 표시 */}
                        {!notification.isRead && (
                          <div className="flex-shrink-0 ml-4">
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="읽음 처리"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              이전
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              {pagination.totalPages > 5 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      currentPage === pagination.totalPages
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages || isLoading}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;