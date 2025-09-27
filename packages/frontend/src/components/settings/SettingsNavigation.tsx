import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { SettingsTab } from './SettingsPage';

interface NavigationItem {
  id: SettingsTab;
  label: string;
  description: string;
  icon: ReactNode;
  badge?: string | number;
}

interface SettingsNavigationProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  hasUnsavedChanges: boolean;
  className?: string;
}

/**
 * 설정 사이드바 네비게이션 컴포넌트
 * 5개 설정 섹션 간 탭 네비게이션 제공
 */
export function SettingsNavigation({
  activeTab,
  onTabChange,
  hasUnsavedChanges,
  className,
}: SettingsNavigationProps) {
  const navigationItems: NavigationItem[] = [
    {
      id: 'profile',
      label: '프로필 설정',
      description: '기본 정보, 프로필 이미지',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: 'privacy',
      label: '개인정보 보호',
      description: '프로필 공개 설정, 활동 표시',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: '알림 설정',
      description: '좋아요, 댓글, 팔로우 알림',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM10.07 2.82l3.12 3.12c.78.78.78 2.05 0 2.83L4.7 17.26a2 2 0 01-2.83 0l-1.02-1.02a2 2 0 010-2.83L9.24 5.93c.78-.78 2.05-.78 2.83 0z"
          />
        </svg>
      ),
      badge: 3, // 새 알림 수 (예시)
    },
    {
      id: 'preferences',
      label: '환경 설정',
      description: '테마, 언어, 피드 설정',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: 'account',
      label: '계정 관리',
      description: '보안, 연결된 계정, 계정 삭제',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className={clsx('space-y-2', className)}>
      {/* 모바일 표시용 제목 */}
      <div className="lg:hidden mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          설정 메뉴
        </h2>
      </div>

      {/* 네비게이션 아이템들 */}
      <ul className="space-y-1">
        {navigationItems.map((item) => {
          const isActive = activeTab === item.id;
          const showBadge =
            item.badge &&
            (typeof item.badge === 'number' ? item.badge > 0 : true);

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onTabChange(item.id)}
                className={clsx(
                  'w-full flex items-start space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-left group',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                {/* 아이콘 */}
                <div
                  className={clsx(
                    'flex-shrink-0 mt-0.5',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                  )}
                >
                  {item.icon}
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={clsx(
                        'text-sm font-medium',
                        isActive
                          ? 'text-blue-900 dark:text-blue-200'
                          : 'text-gray-900 dark:text-gray-100'
                      )}
                    >
                      {item.label}
                    </p>

                    {/* 저장되지 않은 변경사항 또는 배지 */}
                    <div className="flex items-center space-x-2">
                      {hasUnsavedChanges && isActive && (
                        <div className="flex h-2 w-2">
                          <div className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></div>
                          <div className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></div>
                        </div>
                      )}

                      {showBadge && (
                        <span
                          className={clsx(
                            'inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full',
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    className={clsx(
                      'text-xs mt-1',
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    )}
                  >
                    {item.description}
                  </p>
                </div>

                {/* 활성 표시 */}
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* 구분선 */}
      <hr className="border-gray-200 dark:border-gray-700 my-6" />

      {/* 하단 링크들 */}
      <div className="space-y-1">
        <button
          type="button"
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>도움말</span>
        </button>

        <button
          type="button"
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <span>피드백 보내기</span>
        </button>

        <button
          type="button"
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>서비스 약관</span>
        </button>
      </div>

      {/* 버전 정보 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 px-3">
          ReadZone v1.0.0
        </p>
      </div>
    </nav>
  );
}

/**
 * 컴팩트 네비게이션 컴포넌트 (좁은 사이드바용)
 */
interface CompactNavigationProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  hasUnsavedChanges: boolean;
  className?: string;
}

export function CompactNavigation({
  activeTab,
  onTabChange,
  hasUnsavedChanges,
  className,
}: CompactNavigationProps) {
  const navigationItems = [
    {
      id: 'profile' as const,
      label: '프로필',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: 'privacy' as const,
      label: '개인정보',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      id: 'notifications' as const,
      label: '알림',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5z"
          />
        </svg>
      ),
    },
    {
      id: 'preferences' as const,
      label: '환경설정',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
        </svg>
      ),
    },
    {
      id: 'account' as const,
      label: '계정',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className={clsx('space-y-1', className)}>
      {navigationItems.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            title={item.label}
            className={clsx(
              'relative w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
            )}
          >
            {item.icon}

            {/* 저장되지 않은 변경사항 표시 */}
            {hasUnsavedChanges && isActive && (
              <div className="absolute -top-1 -right-1 flex h-3 w-3">
                <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></div>
                <div className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></div>
              </div>
            )}

            {/* 활성 표시 */}
            {isActive && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-l-full"></div>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default SettingsNavigation;
