import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DemoContainerProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  variant?: 'default' | 'dark' | 'light'
}

export function DemoContainer({
  children,
  title,
  description,
  className,
  variant = 'default'
}: DemoContainerProps): JSX.Element {
  const variants = {
    default: 'bg-gray-50 dark:bg-gray-900',
    dark: 'bg-gray-900',
    light: 'bg-white'
  }

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div
        className={cn(
          'p-6 rounded-lg border',
          variants[variant],
          variant === 'dark' ? 'border-gray-700 text-white' : 'border-gray-200 dark:border-gray-700',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}