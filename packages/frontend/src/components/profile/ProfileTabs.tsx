import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/hooks/useAccessibility';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    reviews: number;
    followers: number;
    following: number;
  };
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  counts
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);
  const { elementRef } = useAccessibility({
    trapFocus: false,
  });

  const tabs = [
    { id: 'reviews', label: '독후감', count: counts.reviews, visible: true },
    { id: 'followers', label: '팔로워', count: counts.followers, visible: true },
    { id: 'following', label: '팔로잉', count: counts.following, visible: true },
  ].filter(tab => tab.visible);

  // 키보드 네비게이션 핸들러
  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const currentTab = tabs[currentIndex];

        if (currentTab) {
          onTabChange(currentTab.id);
        }

        return;
      }
      default:
        return;
    }

    // 포커스 이동

    const nextTab = tabs[nextIndex];

    if (nextTab) {
      const targetTab = tabListRef.current?.querySelector(`#${nextTab.id}-tab`) as HTMLButtonElement;

      if (targetTab) {
        targetTab.focus();
        // 활성 탭이 뷰포트에 보이도록 스크롤
        targetTab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  };

  useEffect(() => {
    // Merge refs
    if (tabListRef.current && elementRef) {
      (elementRef as React.MutableRefObject<HTMLElement | null>).current = tabListRef.current;
    }
  }, [elementRef]);

  // 활성 탭 변경 시 스크롤 처리
  useEffect(() => {
    const activeTabButton = tabListRef.current?.querySelector(`#${activeTab}-tab`) as HTMLButtonElement;

    if (activeTabButton) {
      // 활성 탭이 뷰포트에 보이도록 스크롤
      activeTabButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTab]);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      {/* 좌우 패딩 추가로 여유로운 느낌 제공 */}
      <div className="px-4 sm:px-6 lg:px-8">
        <nav
          ref={tabListRef}
          className="-mb-px flex gap-2 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="프로필 섹션 탭"
        >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'flex items-center gap-2 py-3 px-3 sm:py-4 sm:px-4 border-b-2 font-medium text-sm sm:text-base transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset whitespace-nowrap',
              'hover:text-gray-700 dark:hover:text-gray-300',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 dark:text-gray-400'
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            aria-label={`${tab.label} ${tab.count}개`}
          >
            <span className="font-medium">{tab.label}</span>
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors',
                'min-w-[1.5rem] h-6',
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              )}
              aria-label={`${tab.count}개`}
              role="status"
            >
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
        </nav>
      </div>
    </div>
  );
};