import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/hooks/useAccessibility';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    reviews: number;
    likes: number;
    books: number;
    followers: number;
    following: number;
    badges?: number;
  };
  isOwner: boolean;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
  isOwner
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);
  const { elementRef } = useAccessibility({
    trapFocus: false,
  });

  const tabs = [
    { id: 'reviews', label: '독후감', count: counts.reviews, visible: true },
    { id: 'likes', label: '좋아요', count: counts.likes, visible: isOwner },
    { id: 'books', label: '서재', count: counts.books, visible: true },
    { id: 'badges', label: '배지', count: counts.badges ?? 0, visible: true },
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
      }
    }
  };

  useEffect(() => {
    // Merge refs
    if (tabListRef.current && elementRef) {
      (elementRef as React.MutableRefObject<HTMLElement | null>).current = tabListRef.current;
    }
  }, [elementRef]);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav
        ref={tabListRef}
        className="-mb-px flex space-x-8"
        role="tablist"
        aria-label="프로필 섹션 탭"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            aria-label={`${tab.label} ${tab.count}개`}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'rounded-full px-2 py-1 text-xs',
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
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
  );
};