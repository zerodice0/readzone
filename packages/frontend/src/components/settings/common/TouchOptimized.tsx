import { type ReactNode, useId } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useBreakpointContext } from '@/hooks/useBreakpointContext';
import {
  useAccessibilityStyles,
  useTouchOptimizedStyles,
} from '@/hooks/useResponsiveStyles';
import { animations } from '@/lib/animations';

interface TouchOptimizedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * 터치 최적화 버튼 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - 터치 디바이스 최적화
 * - 접근성 지원
 * - 반응형 크기 조정
 */
export function TouchOptimizedButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  'aria-label': ariaLabel,
}: TouchOptimizedButtonProps) {
  const { isTouchDevice, prefersReducedMotion } = useBreakpointContext();
  const touchStyles = useTouchOptimizedStyles();
  const a11yStyles = useAccessibilityStyles();

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary:
      'bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:border-gray-700',
    ghost:
      'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent dark:hover:bg-gray-800 dark:text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
  };

  const sizeClasses = {
    sm: isTouchDevice ? 'px-4 py-3 text-sm' : 'px-3 py-2 text-sm',
    md: isTouchDevice ? 'px-6 py-4 text-base' : 'px-4 py-2 text-sm',
    lg: isTouchDevice ? 'px-8 py-5 text-lg' : 'px-6 py-3 text-base',
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <motion.button
      className={clsx(
        'relative inline-flex items-center justify-center font-medium rounded-lg border transition-colors',
        touchStyles.touchTargetSize,
        sizeClasses[size],
        variantClasses[variant],
        a11yStyles.focusRing,
        a11yStyles.highContrast,
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        !prefersReducedMotion && 'transform-gpu',
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      whileHover={
        !disabled && !loading && !isTouchDevice ? { scale: 1.02 } : {}
      }
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {loading && (
        <motion.div
          className="mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </motion.div>
      )}
      {children}
    </motion.button>
  );
}

/**
 * 터치 최적화 입력 필드
 */
interface TouchOptimizedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}

export function TouchOptimizedInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error,
  label,
  required = false,
  autoComplete,
  className,
}: TouchOptimizedInputProps) {
  const { isTouchDevice } = useBreakpointContext();
  const touchStyles = useTouchOptimizedStyles();
  const a11yStyles = useAccessibilityStyles();

  const inputId = useId();

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <motion.input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        className={clsx(
          'w-full border rounded-lg transition-colors',
          isTouchDevice ? 'px-4 py-4 text-base' : 'px-3 py-2 text-sm',
          touchStyles.touchTargetSize,
          a11yStyles.focusRing,
          a11yStyles.highContrast,
          error
            ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
            : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800',
          disabled &&
            'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900'
        )}
        whileFocus={{ scale: isTouchDevice ? 1 : 1.02 }}
      />

      {error && (
        <motion.p
          className="mt-2 text-sm text-red-600 dark:text-red-400"
          {...animations.slideDown}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/**
 * 터치 최적화 토글 스위치
 */
interface TouchOptimizedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TouchOptimizedToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}: TouchOptimizedToggleProps) {
  const { isTouchDevice } = useBreakpointContext();
  const a11yStyles = useAccessibilityStyles();

  const sizeConfig = {
    sm: {
      track: isTouchDevice ? 'w-10 h-6' : 'w-8 h-5',
      thumb: isTouchDevice ? 'w-5 h-5' : 'w-4 h-4',
      translate: isTouchDevice ? 'translate-x-4' : 'translate-x-3',
    },
    md: {
      track: isTouchDevice ? 'w-12 h-7' : 'w-10 h-6',
      thumb: isTouchDevice ? 'w-6 h-6' : 'w-5 h-5',
      translate: isTouchDevice ? 'translate-x-5' : 'translate-x-4',
    },
    lg: {
      track: isTouchDevice ? 'w-14 h-8' : 'w-12 h-7',
      thumb: isTouchDevice ? 'w-7 h-7' : 'w-6 h-6',
      translate: isTouchDevice ? 'translate-x-6' : 'translate-x-5',
    },
  };

  const config = sizeConfig[size];

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={clsx('flex items-start gap-3', className)}>
      <motion.button
        className={clsx(
          'relative flex-shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer',
          config.track,
          a11yStyles.focusRing,
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <motion.span
          className={clsx(
            'block rounded-full bg-white shadow-lg ring-0 transition-transform',
            config.thumb
          )}
          animate={{
            x: checked ? (size === 'sm' ? 16 : size === 'md' ? 20 : 24) : 0,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        />
      </motion.button>

      {(label ?? description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
              onClick={handleToggle}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 터치 최적화 셀렉트 박스
 */
interface TouchOptimizedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export function TouchOptimizedSelect({
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  disabled = false,
  error,
  label,
  required = false,
  className,
}: TouchOptimizedSelectProps) {
  const { isTouchDevice } = useBreakpointContext();
  const touchStyles = useTouchOptimizedStyles();
  const a11yStyles = useAccessibilityStyles();

  const selectId = useId();

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className={clsx(
            'w-full appearance-none border rounded-lg bg-white dark:bg-gray-800 transition-colors cursor-pointer',
            isTouchDevice ? 'px-4 py-4 text-base' : 'px-3 py-2 text-sm',
            touchStyles.touchTargetSize,
            a11yStyles.focusRing,
            a11yStyles.highContrast,
            error
              ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
              : 'border-gray-300 dark:border-gray-600',
            disabled &&
              'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900'
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* 화살표 아이콘 */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
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
        </div>
      </div>

      {error && (
        <motion.p
          className="mt-2 text-sm text-red-600 dark:text-red-400"
          {...animations.slideDown}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export default TouchOptimizedButton;
