import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${useId()}`

    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id={checkboxId}
              ref={ref}
              className={cn(
                'h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-primary-400 dark:focus:ring-primary-400 rounded cursor-pointer',
                error && 'border-red-500',
                className
              )}
              {...props}
            />
          </div>
          {(label || description) && (
            <div className="text-sm">
              {label && (
                <label 
                  htmlFor={checkboxId}
                  className={cn(
                    'font-medium cursor-pointer',
                    error ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-gray-100'
                  )}
                >
                  {label}
                  {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
              {description && (
                <p className={cn(
                  'mt-1',
                  error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                )}>
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }