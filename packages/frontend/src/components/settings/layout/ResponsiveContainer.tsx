import { type ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useResponsiveBreakpoint } from '@/hooks/useBreakpoint';
import { variants } from '@/lib/animations';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string | undefined;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  layout?: 'stack' | 'grid' | 'sidebar';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  centerContent?: boolean;
}

/**
 * 반응형 컨테이너 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - 반응형 레이아웃 시스템
 * - 모바일 최적화
 * - 적응형 그리드 시스템
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  layout = 'stack',
  gap = 'md',
  centerContent = false,
}: ResponsiveContainerProps) {
  const {
    isMobile,
    isTablet,
    isDesktop: _isDesktop,
  } = useResponsiveBreakpoint();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 py-2 md:px-4 md:py-4',
    md: 'px-4 py-4 md:px-6 md:py-6',
    lg: 'px-6 py-6 md:px-8 md:py-8',
  };

  const gapClasses = {
    none: '',
    sm: 'gap-2',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return clsx(
          'grid',
          isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'
        );
      case 'sidebar':
        return clsx('flex', isMobile ? 'flex-col' : 'flex-row');
      case 'stack':
      default:
        return 'flex flex-col';
    }
  };

  return (
    <motion.div
      className={clsx(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        getLayoutClasses(),
        gapClasses[gap],
        centerContent && 'items-center justify-center',
        className
      )}
      variants={variants.settingsSection}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

/**
 * 적응형 그리드 컴포넌트
 */
interface AdaptiveGridProps {
  children: ReactNode;
  className?: string;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  minItemWidth?: number;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  aspectRatio?: 'square' | 'video' | 'auto';
}

export function AdaptiveGrid({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  minItemWidth,
  gap = 'md',
  aspectRatio = 'auto',
}: AdaptiveGridProps) {
  const { isMobile, isTablet } = useResponsiveBreakpoint();

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const aspectRatioClasses = {
    square: '[&>*]:aspect-square',
    video: '[&>*]:aspect-video',
    auto: '',
  };

  const getGridColumns = () => {
    if (minItemWidth) {
      return `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`;
    }

    if (isMobile) {
      return columns.mobile;
    }
    if (isTablet) {
      return columns.tablet;
    }

    return columns.desktop;
  };

  return (
    <div
      className={clsx(
        'grid',
        gapClasses[gap],
        aspectRatioClasses[aspectRatio],
        className
      )}
      style={{
        gridTemplateColumns: minItemWidth
          ? `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`
          : `repeat(${getGridColumns()}, 1fr)`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 반응형 사이드바 레이아웃
 */
interface ResponsiveSidebarProps {
  sidebar: ReactNode;
  main: ReactNode;
  className?: string;
  sidebarWidth?: 'sm' | 'md' | 'lg';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function ResponsiveSidebar({
  sidebar,
  main,
  className,
  sidebarWidth = 'md',
  collapsible = true,
  defaultCollapsed = false,
}: ResponsiveSidebarProps) {
  const { isMobile } = useResponsiveBreakpoint();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const sidebarWidthClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isMobile) {
    // 모바일에서는 스택 레이아웃
    return (
      <div className={clsx('flex flex-col', className)}>
        <div className="w-full mb-4">{sidebar}</div>
        <div className="flex-1">{main}</div>
      </div>
    );
  }

  return (
    <div className={clsx('flex', className)}>
      {/* 사이드바 */}
      <motion.aside
        className={clsx(
          'flex-shrink-0 border-r border-gray-200 dark:border-gray-700',
          sidebarWidthClasses[sidebarWidth],
          isCollapsed && 'w-16'
        )}
        initial={false}
        animate={{
          width: isCollapsed
            ? 64
            : sidebarWidthClasses[sidebarWidth].replace('w-', '') === '64'
              ? 256
              : sidebarWidthClasses[sidebarWidth].replace('w-', '') === '80'
                ? 320
                : 384,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="h-full relative">
          {/* 접기/펼치기 버튼 */}
          {collapsible && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            >
              <motion.svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </motion.svg>
            </button>
          )}

          <div className={clsx('h-full', isCollapsed && 'overflow-hidden')}>
            {sidebar}
          </div>
        </div>
      </motion.aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-w-0">{main}</main>
    </div>
  );
}

/**
 * 반응형 스택 레이아웃
 */
interface ResponsiveStackProps {
  children: ReactNode;
  className?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  distribution?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function ResponsiveStack({
  children,
  className,
  spacing = 'md',
  align = 'stretch',
  distribution = 'start',
}: ResponsiveStackProps) {
  const spacingClasses = {
    none: 'space-y-0',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const distributionClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div
      className={clsx(
        'flex flex-col',
        spacingClasses[spacing],
        alignClasses[align],
        distributionClasses[distribution],
        className
      )}
    >
      {children}
    </div>
  );
}

export default ResponsiveContainer;
