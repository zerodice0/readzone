import { useState } from 'react';

/**
 * T117: SessionListItem Component
 * T118: Session logout action
 * Display session information with logout capability
 */

interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  ipAddress: string;
  userAgent: string;
  deviceType: string;
  browser: string;
  os: string;
  current: boolean;
}

interface SessionListItemProps {
  session: Session;
  isCurrent: boolean;
  onLogout: (sessionId: string) => Promise<void>;
}

function SessionListItem({
  session,
  isCurrent,
  onLogout,
}: SessionListItemProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout(session.id);
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return (
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      case 'tablet':
        return (
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      case 'desktop':
      default:
        return (
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        {/* Device Icon and Info */}
        <div className="flex space-x-4 flex-1">
          <div className="flex-shrink-0">
            {getDeviceIcon(session.deviceType)}
          </div>
          <div className="flex-1 min-w-0">
            {/* Device Name */}
            <div className="flex items-center">
              <h3 className="text-sm font-semibold text-gray-900">
                {session.browser} - {session.os}
              </h3>
              {isCurrent && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  현재 세션
                </span>
              )}
            </div>

            {/* Device Details */}
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-500">
                <span className="font-medium">기기:</span> {session.deviceType}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">IP 주소:</span>{' '}
                {session.ipAddress}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">마지막 활동:</span>{' '}
                {formatDate(session.lastActivityAt)}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">로그인 시각:</span>{' '}
                {new Date(session.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        {!isCurrent && (
          <div className="ml-4 flex-shrink-0">
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isLoggingOut}
                className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                로그아웃
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">확실합니까?</span>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? '처리 중...' : '확인'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoggingOut}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionListItem;
