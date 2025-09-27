import { type ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useBreakpointContext } from '@/hooks/useBreakpointContext';
import { useConditionalRender } from '@/hooks/useResponsiveStyles';
import {
  MobileSettingsNavigation,
  MobileSettingsTrigger,
} from '../navigation/MobileSettingsNavigation';
import { ResponsiveContainer, ResponsiveSidebar } from './ResponsiveContainer';
import { variants } from '@/lib/animations';

interface SettingsTab {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface AdaptiveLayoutProps {
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
  className?: string;
  sidebarCollapsible?: boolean;
  defaultSidebarCollapsed?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * 적응형 설정 레이아웃 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - 반응형 네비게이션 (데스크톱: 사이드바, 모바일: 드로어)
 * - 적응형 레이아웃 시스템
 * - 접근성 지원
 * - 성능 최적화
 */
export function AdaptiveLayout({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
  sidebarCollapsible = true,
  defaultSidebarCollapsed = false,
  header,
  footer,
}: AdaptiveLayoutProps) {
  const {
    isMobile,
    isTablet,
    isTouchDevice: _isTouchDevice,
  } = useBreakpointContext();
  const conditionalRender = useConditionalRender();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openMobileNav = () => setMobileNavOpen(true);
  const closeMobileNav = () => setMobileNavOpen(false);

  // 탭 변경 시 모바일 네비게이션 닫기
  useEffect(() => {
    if (mobileNavOpen) {
      closeMobileNav();
    }
  }, [activeTab, mobileNavOpen]);

  // ESC 키로 모바일 네비게이션 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileNavOpen) {
        closeMobileNav();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileNavOpen]);

  // 데스크톱 사이드바 렌더링
  const renderDesktopSidebar = () => (
    <div className="h-full flex flex-col">
      {/* 사이드바 헤더 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          설정
        </h2>
      </div>

      {/* 탭 네비게이션 */}
      <nav className="flex-1 p-4" role="tablist" aria-orientation="vertical">
        <div className="space-y-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors',
                tab.id === activeTab
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              whileHover={!tab.disabled ? { x: 4 } : {}}
              whileTap={!tab.disabled ? { scale: 0.98 } : {}}
              role="tab"
              aria-selected={tab.id === activeTab}
              aria-controls={`settings-panel-${tab.id}`}
              tabIndex={tab.id === activeTab ? 0 : -1}
            >
              <div className="flex-shrink-0 w-5 h-5">{tab.icon}</div>

              <span className="flex-1 font-medium text-sm">{tab.label}</span>

              {tab.badge !== undefined && tab.badge > 0 && (
                <motion.span
                  className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200"
                  layoutId={`badge-${tab.id}`}
                >
                  {tab.badge}
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );

  // 메인 컨텐츠 렌더링
  const renderMainContent = () => (
    <motion.div
      className="h-full flex flex-col"
      key={activeTab}
      variants={variants.settingsSection}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* 모바일 헤더 */}
      {conditionalRender.showOnMobile(
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <MobileSettingsTrigger
              onClick={openMobileNav}
              badge={tabs.reduce((sum, tab) => sum + (tab.badge ?? 0), 0)}
            />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {tabs.find((tab) => tab.id === activeTab)?.label ?? '설정'}
            </h1>
          </div>
          {header && <div className="flex-shrink-0">{header}</div>}
        </div>
      )}

      {/* 데스크톱 헤더 */}
      {conditionalRender.showOnDesktop(
        header && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {header}
          </div>
        )
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        <ResponsiveContainer
          maxWidth="full"
          padding={isMobile ? 'sm' : 'lg'}
          className="h-full overflow-y-auto"
        >
          <div
            id={`settings-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`settings-tab-${activeTab}`}
            className="space-y-6"
          >
            {children}
          </div>
        </ResponsiveContainer>
      </div>

      {/* 푸터 */}
      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <ResponsiveContainer padding={isMobile ? 'sm' : 'md'}>
            {footer}
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );

  if (isMobile || isTablet) {
    // 모바일/태블릿 레이아웃
    return (
      <div
        className={clsx(
          'h-full flex flex-col bg-gray-50 dark:bg-gray-900',
          className
        )}
      >
        {renderMainContent()}

        {/* 모바일 네비게이션 */}
        <MobileSettingsNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          isOpen={mobileNavOpen}
          onClose={closeMobileNav}
        />
      </div>
    );
  }

  // 데스크톱 레이아웃
  return (
    <div className={clsx('h-full bg-gray-50 dark:bg-gray-900', className)}>
      <ResponsiveSidebar
        sidebar={renderDesktopSidebar()}
        main={renderMainContent()}
        sidebarWidth="md"
        collapsible={sidebarCollapsible}
        defaultCollapsed={defaultSidebarCollapsed}
      />
    </div>
  );
}

/**
 * 설정 페이지 래퍼 컴포넌트
 */
interface SettingsPageWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function SettingsPageWrapper({
  title,
  description,
  children,
  className,
  maxWidth = 'xl',
  loading = false,
  error = null,
  onRetry,
}: SettingsPageWrapperProps) {
  const { isMobile } = useBreakpointContext();

  if (loading) {
    return (
      <div className={clsx('flex items-center justify-center h-64', className)}>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            설정을 불러오는 중...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('flex items-center justify-center h-64', className)}>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-red-500 dark:text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            설정을 불러올 수 없습니다
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {error}
          </p>
          {onRetry && (
            <motion.button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={onRetry}
              whileTap={{ scale: 0.95 }}
            >
              다시 시도
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <ResponsiveContainer
      maxWidth={maxWidth}
      padding={isMobile ? 'sm' : 'lg'}
      className={className}
    >
      {/* 페이지 헤더 */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </motion.div>

      {/* 페이지 컨텐츠 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {children}
      </motion.div>
    </ResponsiveContainer>
  );
}

export default AdaptiveLayout;
