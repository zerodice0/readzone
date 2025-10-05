import { lazy, Suspense, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from '@tanstack/react-router';
import { useSettings } from '@/hooks/useSettings';
import { useUnsavedChangesConfirmation } from '@/hooks/useConfirmation';
import { SettingsNavigation } from './SettingsNavigation';
import { FullPageAuthError } from './FullPageAuthError';
import { FullPageLoading } from './FullPageLoading';

// 임시로 섹션 컴포넌트들을 placeholder로 정의
// 실제 구현은 다음 단계에서 진행
const ProfileSettings = lazy(() => import('./sections/ProfileSettings'));
const PrivacySettings = lazy(() => import('./sections/PrivacySettings'));
const NotificationSettings = lazy(
  () => import('./sections/NotificationSettings')
);
const PreferenceSettings = lazy(() => import('./sections/PreferenceSettings'));
const AccountManagement = lazy(() => import('./sections/AccountManagement'));

export type SettingsTab =
  | 'profile'
  | 'privacy'
  | 'notifications'
  | 'preferences'
  | 'account';

interface SettingsPageProps {
  className?: string;
}

/**
 * 메인 설정 페이지 컴포넌트
 * 탭 기반 네비게이션과 섹션 관리
 */
export function SettingsPage({ className }: SettingsPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const {
    settings,
    isLoading,
    error,
    hasUnsavedChanges,
    isAuthError,
    refresh,
    updateProfile,
    updatePreferences,
    markAsChanged
  } = useSettings();

  const {
    confirmUnsavedChanges,
    setupBeforeUnloadProtection,
    ConfirmationModal,
  } = useUnsavedChangesConfirmation();

  // 페이지 이탈 방지 설정
  useEffect(() => {
    const cleanup = setupBeforeUnloadProtection(hasUnsavedChanges);

    return cleanup;
  }, [hasUnsavedChanges, setupBeforeUnloadProtection]);

  // 전체 화면 인증 에러 표시 - store의 isAuthError 플래그 사용
  if (isAuthError) {
    return <FullPageAuthError />
  }

  // 전체 화면 로딩 표시
  if (isLoading) {
    return <FullPageLoading />
  }

  // 탭 변경 핸들러
  const handleTabChange = async (newTab: SettingsTab) => {
    if (hasUnsavedChanges) {
      const confirmed = await confirmUnsavedChanges();

      if (!confirmed) {
        return;
      }
    }

    setActiveTab(newTab);
  };

  // 설정 섹션 컴포넌트 렌더링
  const renderSettingsSection = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-2">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              설정을 불러올 수 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              {error?.includes('인증') ? (
                <button
                  type="button"
                  onClick={() => window.location.href = '/login'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  로그인하기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={refresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (!settings) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-gray-600 dark:text-gray-400">
            설정 정보가 없습니다.
          </div>
        </div>
      );
    }

    // 실제 섹션 컴포넌트들은 아직 구현되지 않았으므로 Suspense로 감쌈
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        {activeTab === 'profile' && (
          <ProfileSettings
            settings={settings}
            updateProfile={updateProfile}
            markAsChanged={markAsChanged}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}
        {activeTab === 'privacy' && <PrivacySettings settings={settings} />}
        {activeTab === 'notifications' && (
          <NotificationSettings settings={settings} />
        )}
        {activeTab === 'preferences' && (
          <PreferenceSettings
            settings={settings}
            updatePreferences={updatePreferences}
            markAsChanged={markAsChanged}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}
        {activeTab === 'account' && <AccountManagement settings={settings} />}
      </Suspense>
    );
  };

  return (
    <div
      className={clsx('min-h-screen bg-gray-50 dark:bg-gray-900', className)}
    >
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <button
                onClick={() => navigate({ to: '/' })}
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                홈
              </button>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                설정
              </span>
            </nav>

            {/* 페이지 제목 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  설정
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  계정 정보, 개인정보 보호, 알림 설정을 관리하세요
                </p>
              </div>

              {/* 저장되지 않은 변경사항 표시 */}
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    저장되지 않은 변경사항
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 네비게이션 */}
          <div className="lg:w-64 flex-shrink-0">
            <SettingsNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>

          {/* 설정 콘텐츠 */}
          <div className="flex-1 min-w-0">{renderSettingsSection()}</div>
        </div>
      </div>

      {/* 확인 모달 */}
      <ConfirmationModal />
    </div>
  );
}

/**
 * 모바일용 탭 네비게이션 컴포넌트
 */
interface MobileTabNavigationProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  hasUnsavedChanges: boolean;
}

export function MobileTabNavigation({
  activeTab,
  onTabChange,
  hasUnsavedChanges,
}: MobileTabNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tabs = [
    { id: 'profile', label: '프로필', icon: '👤' },
    { id: 'privacy', label: '개인정보', icon: '🔒' },
    { id: 'notifications', label: '알림', icon: '🔔' },
    { id: 'preferences', label: '환경설정', icon: '⚙️' },
    { id: 'account', label: '계정 관리', icon: '🏠' },
  ] as const;

  const activeTabInfo = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="lg:hidden">
      {/* 현재 탭 표시 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{activeTabInfo?.icon}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {activeTabInfo?.label}
          </span>
          {hasUnsavedChanges && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
          )}
        </div>
        <svg
          className={clsx(
            'h-5 w-5 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onTabChange(tab.id);
                setIsOpen(false);
              }}
              className={clsx(
                'w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors',
                tab.id === activeTab &&
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              )}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
