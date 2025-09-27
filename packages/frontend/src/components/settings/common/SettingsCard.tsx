// React import removed - components using plain elements and types from @/types
import { clsx } from 'clsx';
import type { SettingsCardProps } from '@/types';

/**
 * 설정 카드 컴포넌트
 * 설정 항목들을 그룹화하는 카드 컨테이너
 */
export function SettingsCard({
  title,
  description,
  children,
  className,
}: SettingsCardProps) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6',
        className
      )}
    >
      {/* 헤더 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/**
 * 설정 섹션 컴포넌트
 * 여러 설정 카드를 그룹화하는 섹션
 */
interface SettingsSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={clsx('space-y-6', className)}>
      {title && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h2>
          {description && (
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}

      <div className="space-y-6">{children}</div>
    </section>
  );
}

/**
 * 설정 필드 컴포넌트
 * 개별 설정 필드의 래퍼
 */
interface SettingsFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SettingsField({
  label,
  description,
  error,
  required = false,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      {/* 라벨 */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* 설명 */}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {/* 입력 필드 */}
      <div>{children}</div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

/**
 * 설정 그룹 컴포넌트
 * 관련된 설정들을 시각적으로 그룹화
 */
interface SettingsGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'subtle';
}

export function SettingsGroup({
  title,
  description,
  children,
  className,
  variant = 'default',
}: SettingsGroupProps) {
  const variantClasses = {
    default: 'space-y-4',
    outlined:
      'p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4',
    subtle: 'p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4',
  };

  return (
    <div className={clsx(variantClasses[variant], className)}>
      {title && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">{children}</div>
    </div>
  );
}

/**
 * 설정 구분선 컴포넌트
 */
interface SettingsDividerProps {
  className?: string;
  withText?: string;
}

export function SettingsDivider({ className, withText }: SettingsDividerProps) {
  if (withText) {
    return (
      <div className={clsx('relative', className)}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
            {withText}
          </span>
        </div>
      </div>
    );
  }

  return (
    <hr
      className={clsx(
        'border-t border-gray-200 dark:border-gray-700',
        className
      )}
    />
  );
}

/**
 * 설정 행동 버튼 컴포넌트
 */
interface SettingsActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center' | 'between';
}

export function SettingsActions({
  children,
  className,
  align = 'right',
}: SettingsActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    right: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
  };

  return (
    <div
      className={clsx(
        'flex items-center space-x-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}
