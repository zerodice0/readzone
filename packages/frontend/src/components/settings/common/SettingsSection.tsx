import { type ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { animations, variants } from '@/lib/animations';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  icon?: ReactNode;
  badge?: string;
  disabled?: boolean;
}

/**
 * 설정 섹션 컨테이너 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - 애니메이션 전환
 * - 접근성 지원
 * - 우선순위 기반 스타일링
 * - 접기/펼치기 기능
 */
export function SettingsSection({
  title,
  description,
  children,
  className,
  priority = 'medium',
  isCollapsible = false,
  defaultExpanded = true,
  icon,
  badge,
  disabled = false,
}: SettingsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const priorityStyles = {
    high: 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-900/10',
    medium:
      'border-gray-200 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-800/30',
    low: 'border-gray-100 bg-gray-25/30 dark:border-gray-800 dark:bg-gray-900/20',
  };

  const handleToggle = () => {
    if (!isCollapsible || disabled) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.section
      className={clsx(
        'rounded-lg border p-6 transition-all duration-200',
        priorityStyles[priority],
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
      variants={variants.settingsSection}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      {/* 섹션 헤더 */}
      <div
        className={clsx(
          'flex items-start justify-between',
          isCollapsible && 'cursor-pointer'
        )}
        onClick={handleToggle}
        role={isCollapsible ? 'button' : undefined}
        tabIndex={isCollapsible && !disabled ? 0 : -1}
        onKeyDown={(e) => {
          if (
            (e.key === 'Enter' || e.key === ' ') &&
            isCollapsible &&
            !disabled
          ) {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={isCollapsible ? isExpanded : undefined}
        aria-controls={
          isCollapsible
            ? `settings-section-${title.toLowerCase().replace(/\s+/g, '-')}`
            : undefined
        }
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="text-gray-600 dark:text-gray-400">{icon}</div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {badge && (
              <motion.span
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200"
                {...animations.scale}
              >
                {badge}
              </motion.span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {isCollapsible && (
          <motion.div
            className="ml-4 text-gray-400 dark:text-gray-600"
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-5 h-5"
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
          </motion.div>
        )}
      </div>

      {/* 섹션 콘텐츠 */}
      <motion.div
        id={
          isCollapsible
            ? `settings-section-${title.toLowerCase().replace(/\s+/g, '-')}`
            : undefined
        }
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
          marginTop: isExpanded ? 16 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        style={{ overflow: 'hidden' }}
      >
        <div className="space-y-4">{children}</div>
      </motion.div>
    </motion.section>
  );
}

/**
 * 설정 카드 컴포넌트 - 개별 설정 항목용
 */
interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  error?: string;
  success?: boolean;
}

export function SettingsCard({
  title,
  description,
  children,
  className,
  disabled = false,
  error,
  success,
}: SettingsCardProps) {
  return (
    <motion.div
      className={clsx(
        'p-4 bg-white dark:bg-gray-800 rounded-lg border',
        error
          ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20'
          : success
            ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20'
            : 'border-gray-200 dark:border-gray-700',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
      variants={variants.settingsCard}
      initial="initial"
      animate="animate"
      whileHover={disabled ? {} : 'hover'}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {title}
          </h4>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {description}
            </p>
          )}
          {error && (
            <motion.p
              className="text-sm text-red-600 dark:text-red-400 mb-3"
              {...animations.slideDown}
            >
              {error}
            </motion.p>
          )}
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>

      {success && (
        <motion.div
          className="mt-3 flex items-center text-sm text-green-600 dark:text-green-400"
          {...animations.slideUp}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          설정이 저장되었습니다
        </motion.div>
      )}
    </motion.div>
  );
}

export default SettingsSection;
