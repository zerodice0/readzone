import { type ReactNode, type RefObject, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  useFocusTrap,
  useSettingsTabNavigation,
} from '@/hooks/useKeyboardNavigation';
import { animations, variants } from '@/lib/animations';
import { settingsAnalytics } from '@/lib/analytics';

interface SettingsTab {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface MobileSettingsNavigationProps {
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * 모바일 설정 네비게이션 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - 모바일 최적화된 네비게이션
 * - 접근성 지원 (키보드 네비게이션, 포커스 트랩)
 * - 애니메이션 전환
 * - 터치 제스처 지원
 */
export function MobileSettingsNavigation({
  tabs,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  className,
}: MobileSettingsNavigationProps) {
  const isMobile = useBreakpoint('md');
  const overlayRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  // 키보드 네비게이션
  const tabIds = tabs.filter((tab) => !tab.disabled).map((tab) => tab.id);

  useSettingsTabNavigation(tabIds, activeTab, onTabChange, isOpen);

  // 포커스 트랩
  useFocusTrap(isOpen, navigationRef as RefObject<HTMLElement>);

  // 터치 스와이프 감지
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientX ?? 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX ?? 0);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;

    if (isLeftSwipe) {
      onClose();
      settingsAnalytics.accessibilityUsed('keyboard_navigation');
    }
  };

  const handleTabClick = (tabId: string) => {
    if (tabs.find((tab) => tab.id === tabId)?.disabled) {
      return;
    }

    onTabChange(tabId);
    onClose();
    settingsAnalytics.tabChange('settings', tabId, true);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // 데스크톱에서는 렌더링하지 않음
  if (!isMobile) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={clsx('fixed inset-0 z-50', className)}
          role="dialog"
          aria-modal="true"
          aria-label="설정 메뉴"
        >
          {/* 오버레이 */}
          <motion.div
            ref={overlayRef}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleOverlayClick}
            {...animations.fadeIn}
          />

          {/* 네비게이션 패널 */}
          <motion.div
            ref={navigationRef}
            className="fixed inset-y-0 left-0 w-80 max-w-[80vw] bg-white dark:bg-gray-800 shadow-xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                설정
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors"
                aria-label="메뉴 닫기"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 탭 목록 */}
            <motion.nav
              className="flex-1 overflow-y-auto py-4"
              variants={variants.listContainer}
              initial="hidden"
              animate="visible"
              role="tablist"
              aria-orientation="vertical"
            >
              {tabs.map((tab, _index) => (
                <motion.button
                  key={tab.id}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    tab.id === activeTab
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
                    tab.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => handleTabClick(tab.id)}
                  disabled={tab.disabled}
                  variants={variants.listItem}
                  whileTap={{ scale: 0.98 }}
                  role="tab"
                  aria-selected={tab.id === activeTab}
                  aria-controls={`settings-panel-${tab.id}`}
                  tabIndex={tab.id === activeTab ? 0 : -1}
                >
                  <div className="flex-shrink-0 w-6 h-6 text-current">
                    {tab.icon}
                  </div>

                  <span className="flex-1 font-medium">{tab.label}</span>

                  {tab.badge !== undefined && tab.badge > 0 && (
                    <motion.span
                      className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200"
                      {...animations.scale}
                    >
                      {tab.badge}
                    </motion.span>
                  )}

                  {/* 활성 표시기 */}
                  {tab.id === activeTab && (
                    <motion.div
                      className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full dark:bg-blue-400"
                      layoutId="mobile-active-indicator"
                      transition={{
                        type: 'spring',
                        damping: 25,
                        stiffness: 300,
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.nav>

            {/* 하단 영역 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                좌우로 스와이프하여 메뉴를 닫을 수 있습니다
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * 모바일 설정 트리거 버튼
 */
interface MobileSettingsTriggerProps {
  onClick: () => void;
  className?: string;
  badge?: number;
}

export function MobileSettingsTrigger({
  onClick,
  className,
  badge,
}: MobileSettingsTriggerProps) {
  const isMobile = useBreakpoint('md');

  if (!isMobile) {
    return null;
  }

  return (
    <motion.button
      className={clsx(
        'relative p-3 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors',
        className
      )}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      aria-label="설정 메뉴 열기"
    >
      <svg
        className="w-6 h-6"
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

      {badge !== undefined && badge > 0 && (
        <motion.span
          className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full"
          {...animations.scale}
        >
          {badge}
        </motion.span>
      )}
    </motion.button>
  );
}

export default MobileSettingsNavigation;
