import { clsx } from 'clsx'

interface SettingsToggleProps {
  id?: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

/**
 * 설정용 토글 스위치 컴포넌트
 * 다양한 크기와 스타일 지원
 */
export function SettingsToggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  className,
}: SettingsToggleProps) {
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-13',
  }

  const thumbSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0',
    lg: checked ? 'translate-x-6' : 'translate-x-0',
  }

  const variantClasses = {
    default: checked
      ? 'bg-blue-600 focus:ring-blue-500'
      : 'bg-gray-200 dark:bg-gray-700 focus:ring-blue-500',
    success: checked
      ? 'bg-green-600 focus:ring-green-500'
      : 'bg-gray-200 dark:bg-gray-700 focus:ring-green-500',
    warning: checked
      ? 'bg-yellow-600 focus:ring-yellow-500'
      : 'bg-gray-200 dark:bg-gray-700 focus:ring-yellow-500',
    danger: checked
      ? 'bg-red-600 focus:ring-red-500'
      : 'bg-gray-200 dark:bg-gray-700 focus:ring-red-500',
  }

  return (
    <div className={clsx('flex items-start justify-between', className)}>
      {/* 라벨 영역 */}
      <div className="flex-1 mr-4">
        <label
          htmlFor={id}
          className={clsx(
            'block text-sm font-medium cursor-pointer',
            disabled
              ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300'
          )}
        >
          {label}
        </label>
        {description && (
          <p
            className={clsx(
              'text-xs mt-1',
              disabled
                ? 'text-gray-400 dark:text-gray-500'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {description}
          </p>
        )}
      </div>

      {/* 토글 스위치 */}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-description` : undefined}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={clsx(
          'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
          sizeClasses[size],
          variantClasses[variant],
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* 토글 썸 */}
        <span
          className={clsx(
            'pointer-events-none relative inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
            thumbSizeClasses[size],
            translateClasses[size]
          )}
        >
          {/* 체크/엑스 아이콘 */}
          <span
            className={clsx(
              'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity',
              checked ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'
            )}
            aria-hidden="true"
          >
            <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span
            className={clsx(
              'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity',
              checked ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
            )}
            aria-hidden="true"
          >
            <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zm-1.414 1.414l2 2 1.414-1.414-2-2-1.414 1.414zm5.414 0l4-4-1.414-1.414-4 4 1.414 1.414z" />
            </svg>
          </span>
        </span>
      </button>
    </div>
  )
}

/**
 * 간단한 토글 컴포넌트
 * 라벨 없이 토글만 필요한 경우
 */
interface SimpleToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export function SimpleToggle({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  className,
}: SimpleToggleProps) {
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-13',
  }

  const thumbSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0',
    lg: checked ? 'translate-x-6' : 'translate-x-0',
  }

  const variantClasses = {
    default: checked
      ? 'bg-blue-600 focus:ring-blue-500'
      : 'bg-gray-200 dark:bg-gray-700 focus:ring-blue-500',
    success: checked
      ? 'bg-green-600 focus:ring-green-500'
      : 'bg-gray-200 dark:bg-gray-700 focus:ring-green-500',
    warning: checked
      ? 'bg-yellow-600 focus:ring-yellow-500'
      : 'bg-gray-200 dark:bg-gray-700 focus:ring-yellow-500',
    danger: checked
      ? 'bg-red-600 focus:ring-red-500'
      : 'bg-gray-200 dark:bg-gray-700 focus:ring-red-500',
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={clsx(
        'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={clsx(
          'pointer-events-none relative inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
          thumbSizeClasses[size],
          translateClasses[size]
        )}
      />
    </button>
  )
}

/**
 * 토글 그룹 컴포넌트
 * 여러 토글을 그룹화해서 표시
 */
interface ToggleGroupItem {
  id: string
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
}

interface SettingsToggleGroupProps {
  title?: string
  description?: string
  items: ToggleGroupItem[]
  onChange: (id: string, checked: boolean) => void
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export function SettingsToggleGroup({
  title,
  description,
  items,
  onChange,
  variant = 'default',
  className,
}: SettingsToggleGroupProps) {
  return (
    <div className={clsx('space-y-4', className)}>
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

      <div className="space-y-3">
        {items.map((item) => (
          <SettingsToggle
            key={item.id}
            id={item.id}
            label={item.label}
            checked={item.checked}
            onChange={(checked) => onChange(item.id, checked)}
            {...(item.description && { description: item.description })}
            {...(item.disabled !== undefined && { disabled: item.disabled })}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}