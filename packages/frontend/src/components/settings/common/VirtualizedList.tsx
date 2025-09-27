import {
  type ReactNode,
  type UIEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useResponsiveBreakpoint } from '@/hooks/useBreakpoint';
import { animations } from '@/lib/animations';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  overscan?: number;
  onItemClick?: (item: T, index: number) => void;
  loading?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

/**
 * 가상화된 리스트 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - 대용량 데이터 성능 최적화
 * - 무한 스크롤 지원
 * - 반응형 디자인
 * - 접근성 지원
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  className,
  overscan = 5,
  onItemClick,
  loading = false,
  loadingComponent,
  emptyComponent,
  onEndReached,
  onEndReachedThreshold = 0.8,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [hasTriggeredEndReached, setHasTriggeredEndReached] = useState(false);

  const { isMobile } = useResponsiveBreakpoint();

  // 가시 영역 계산
  const totalHeight = items.length * itemHeight;
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length, visibleEnd);

  const visibleItems = items.slice(startIndex, endIndex);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = target.scrollTop;

      setScrollTop(newScrollTop);

      // 무한 스크롤 처리
      if (onEndReached) {
        const scrollPercentage = (newScrollTop + containerHeight) / totalHeight;

        if (
          scrollPercentage >= onEndReachedThreshold &&
          !hasTriggeredEndReached
        ) {
          setHasTriggeredEndReached(true);
          onEndReached();
        } else if (scrollPercentage < onEndReachedThreshold) {
          setHasTriggeredEndReached(false);
        }
      }
    },
    [
      containerHeight,
      totalHeight,
      onEndReached,
      onEndReachedThreshold,
      hasTriggeredEndReached,
    ]
  );

  // 키보드 네비게이션
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!onItemClick) {
        return;
      }

      const currentFocused = document.activeElement;
      const focusableItems = Array.from(
        containerRef.current?.querySelectorAll('[data-item-index]') ?? []
      ) as HTMLElement[];

      const currentIndex = focusableItems.indexOf(
        currentFocused as HTMLElement
      );

      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = Math.min(currentIndex + 1, focusableItems.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = focusableItems.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (currentIndex >= 0) {
            const itemIndex = parseInt(
              focusableItems[currentIndex]?.dataset.itemIndex ?? '0'
            );
            const item = items[itemIndex];

            if (item) {
              onItemClick(item, itemIndex);
            }
          }
          break;
      }

      if (nextIndex !== null && focusableItems[nextIndex]) {
        focusableItems[nextIndex]?.focus();
      }
    },
    [onItemClick, items]
  );

  // 빈 상태 렌더링
  if (items.length === 0 && !loading) {
    return (
      <div
        className={clsx('flex items-center justify-center', className)}
        style={{ height: containerHeight }}
      >
        {emptyComponent ?? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              목록이 비어있습니다
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('relative overflow-hidden', className)}>
      {/* 스크롤 컨테이너 */}
      <div
        ref={containerRef}
        className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        role="listbox"
        aria-label="가상화된 목록"
        tabIndex={0}
      >
        {/* 전체 높이를 위한 컨테이너 */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* 가시 영역의 아이템들 */}
          <div
            style={{
              transform: `translateY(${startIndex * itemHeight}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index;
              const key = keyExtractor(item, actualIndex);

              return (
                <motion.div
                  key={key}
                  className={clsx(
                    'flex items-center',
                    onItemClick &&
                      'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    isMobile && 'px-4'
                  )}
                  style={{ height: itemHeight }}
                  onClick={() => onItemClick?.(item, actualIndex)}
                  data-item-index={actualIndex}
                  tabIndex={onItemClick ? 0 : -1}
                  role="option"
                  aria-selected={false}
                  whileHover={
                    onItemClick
                      ? { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                      : {}
                  }
                  {...animations.fadeIn}
                >
                  {renderItem(item, actualIndex)}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 로딩 표시 */}
        {loading && (
          <motion.div
            className="flex items-center justify-center py-4"
            {...animations.fadeIn}
          >
            {loadingComponent ?? (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <motion.div
                  className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-sm">로딩 중...</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* 스크롤 인디케이터 (모바일) */}
      {isMobile && totalHeight > containerHeight && (
        <div className="absolute right-1 top-1 bottom-1 w-1 bg-gray-200 dark:bg-gray-700 rounded-full">
          <motion.div
            className="bg-blue-500 rounded-full"
            style={{
              height: `${(containerHeight / totalHeight) * 100}%`,
              y: `${(scrollTop / (totalHeight - containerHeight)) * (containerHeight - (containerHeight / totalHeight) * containerHeight)}px`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 가상화된 설정 아이템 리스트
 */
interface VirtualizedSettingsListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemHeight?: number;
  maxHeight?: number;
  searchQuery?: string;
  onItemClick?: (item: T, index: number) => void;
  loading?: boolean;
  onLoadMore?: () => void;
}

export function VirtualizedSettingsList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemHeight = 60,
  maxHeight = 400,
  searchQuery,
  onItemClick,
  loading = false,
  onLoadMore,
}: VirtualizedSettingsListProps<T>) {
  const { isMobile } = useResponsiveBreakpoint();

  // 검색 필터링 (간단한 예시)
  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return items;
    }

    // 실제 구현에서는 더 정교한 필터링 로직이 필요
    return items;
  }, [items, searchQuery]);

  const containerHeight = Math.min(
    filteredItems.length * itemHeight,
    isMobile ? maxHeight * 0.8 : maxHeight
  );

  return (
    <div
      className={clsx('border rounded-lg bg-white dark:bg-gray-800', className)}
    >
      {/* 검색 결과 헤더 */}
      {searchQuery && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            "{searchQuery}" 검색 결과: {filteredItems.length}개
          </p>
        </div>
      )}

      {/* 가상화된 리스트 */}
      <VirtualizedList
        items={filteredItems}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        {...(onItemClick && { onItemClick })}
        loading={loading}
        {...(onLoadMore && { onEndReached: onLoadMore })}
        emptyComponent={
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.09M6.343 6.343A8 8 0 1117.657 17.657 8 8 0 016.343 6.343z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? '검색 결과가 없습니다' : '설정 항목이 없습니다'}
            </p>
          </div>
        }
      />
    </div>
  );
}

export default VirtualizedList;
