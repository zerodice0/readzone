import * as React from 'react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Input, type InputProps } from './input'

interface ValidationInputProps extends Omit<InputProps, 'error'> {
  validationType?: 'email' | 'nickname'
  onValidationChange?: (isValid: boolean, message?: string) => void
  debounceMs?: number
}

const validateField = async (field: 'email' | 'nickname', value: string): Promise<{
  available: boolean
  message?: string
}> => {
  if (!value.trim()) {
    return { available: false, message: `${field === 'email' ? '이메일' : '닉네임'}을 입력해주세요.` }
  }

  const response = await fetch('/api/auth/check-duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value }),
  })

  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || '중복 확인 중 오류가 발생했습니다.')
  }

  return result
}

const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export const ValidationInput = React.forwardRef<HTMLInputElement, ValidationInputProps>(
  ({ validationType, onValidationChange, debounceMs = 500, value: propValue, onChange, ...props }, ref) => {
    const [value, setValue] = useState(propValue?.toString() || '')
    const debouncedValue = useDebounce(value, debounceMs)

    const {
      data: validationResult,
      isLoading,
      error,
    } = useQuery({
      queryKey: ['validate', validationType, debouncedValue],
      queryFn: () => validateField(validationType!, debouncedValue),
      enabled: !!validationType && debouncedValue.length > 0,
      staleTime: 30000, // 30초
      retry: false,
    })

    // 검증 상태 변경 콜백
    useEffect(() => {
      if (!validationType || !onValidationChange) return

      if (!debouncedValue) {
        onValidationChange(false)
        return
      }

      if (isLoading) {
        onValidationChange(false)
        return
      }

      if (error) {
        onValidationChange(false, error.message)
        return
      }

      if (validationResult) {
        onValidationChange(validationResult.available, validationResult.message)
      }
    }, [validationResult, isLoading, error, debouncedValue, validationType, onValidationChange])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      onChange?.(e)
    }

    // 에러 메시지 결정
    let errorMessage = ''
    let showSuccess = false

    if (validationType && debouncedValue) {
      if (error) {
        errorMessage = error.message
      } else if (validationResult && !isLoading) {
        if (validationResult.available) {
          showSuccess = true
        } else {
          errorMessage = validationResult.message || '사용할 수 없습니다.'
        }
      }
    }

    // 입력 상태 스타일
    const getInputClassName = () => {
      if (!validationType || !debouncedValue) return ''
      
      if (isLoading) {
        return 'border-yellow-300 focus-visible:ring-yellow-500'
      }
      
      if (error || (validationResult && !validationResult.available)) {
        return 'border-red-300 focus-visible:ring-red-500'
      }
      
      if (validationResult?.available) {
        return 'border-green-300 focus-visible:ring-green-500'
      }
      
      return ''
    }

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            value={value}
            onChange={handleChange}
            error={errorMessage}
            className={cn(getInputClassName(), props.className)}
          />
          
          {/* 상태 아이콘 */}
          {validationType && debouncedValue && (
            <div className="absolute right-3 top-10 -translate-y-1/2">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              ) : error || (validationResult && !validationResult.available) ? (
                <div className="w-4 h-4 text-red-500">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : validationResult?.available ? (
                <div className="w-4 h-4 text-green-500">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 성공 메시지 */}
        {showSuccess && validationResult?.message && (
          <p className="text-sm text-green-600">
            {validationResult.message}
          </p>
        )}
      </div>
    )
  }
)

ValidationInput.displayName = 'ValidationInput'