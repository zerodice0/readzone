import React, { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

export interface SelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
  icon?: React.ReactNode
}

interface SettingsSelectProps {
  id?: string
  label: string
  description?: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  className?: string
  searchable?: boolean
}

/**
 * 설정용 선택 컴포넌트
 * 네이티브 select의 향상된 버전
 */
export function SettingsSelect({
  id,
  label,
  description,
  value,
  options,
  onChange,
  placeholder = '선택하세요',
  disabled = false,
  error,
  required = false,
  className,
  searchable = false,
}: SettingsSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(option => option.value === value)

  const filteredOptions = searchable && searchQuery
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 드롭다운 열릴 때 검색 인풋에 포커스
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) {return}

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        setIsOpen(!isOpen)
        break
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          // 다음 옵션 선택 로직
          const currentIndex = filteredOptions.findIndex(opt => opt.value === value)
          const nextIndex = Math.min(currentIndex + 1, filteredOptions.length - 1)
          const nextOption = filteredOptions[nextIndex]

          if (nextIndex >= 0 && nextOption && !nextOption.disabled) {
            onChange(nextOption.value)
          }
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          // 이전 옵션 선택 로직
          const currentIndex = filteredOptions.findIndex(opt => opt.value === value)
          const prevIndex = Math.max(currentIndex - 1, 0)
          const prevOption = filteredOptions[prevIndex]

          if (prevIndex >= 0 && prevOption && !prevOption.disabled) {
            onChange(prevOption.value)
          }
        }
        break
    }
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {/* 라벨 */}
      <label
        htmlFor={id}
        className={clsx(
          'block text-sm font-medium',
          disabled
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* 설명 */}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {/* 선택 박스 */}
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          id={id}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={clsx(
            'relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        >
          <span className="flex items-center">
            {selectedOption?.icon && (
              <span className="mr-2 flex-shrink-0">
                {selectedOption.icon}
              </span>
            )}
            <span className={clsx(
              'block truncate',
              selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            )}>
              {selectedOption?.label ?? placeholder}
            </span>
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className={clsx(
                'h-5 w-5 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="max-h-48 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  검색 결과가 없습니다.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleOptionClick(option.value)}
                    disabled={option.disabled}
                    className={clsx(
                      'relative w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors',
                      option.value === value && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center">
                      {option.icon && (
                        <span className="mr-2 flex-shrink-0">
                          {option.icon}
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {option.value === value && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * 간단한 네이티브 select 컴포넌트
 * 성능이 중요하거나 간단한 경우 사용
 */
interface SimpleSelectProps {
  id?: string
  label: string
  description?: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  className?: string
}

export function SimpleSelect({
  id,
  label,
  description,
  value,
  options,
  onChange,
  placeholder = '선택하세요',
  disabled = false,
  error,
  required = false,
  className,
}: SimpleSelectProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      {/* 라벨 */}
      <label
        htmlFor={id}
        className={clsx(
          'block text-sm font-medium',
          disabled
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* 설명 */}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {/* Select */}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={clsx(
          'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
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

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * 다중 선택 컴포넌트
 * 여러 값을 선택할 수 있는 select
 */
interface MultiSelectProps {
  id?: string
  label: string
  description?: string
  values: string[]
  options: SelectOption[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  maxSelections?: number
  className?: string
}

export function MultiSelect({
  id,
  label,
  description,
  values,
  options,
  onChange,
  placeholder = '선택하세요',
  disabled = false,
  error,
  required = false,
  maxSelections,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOptions = options.filter(option => values.includes(option.value))

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionToggle = (optionValue: string) => {
    const isSelected = values.includes(optionValue)

    if (isSelected) {
      // 선택 해제
      onChange(values.filter(v => v !== optionValue))
    } else {
      // 선택 추가 (최대 선택 수 체크)
      if (!maxSelections || values.length < maxSelections) {
        onChange([...values, optionValue])
      }
    }
  }

  const handleRemoveSelection = (valueToRemove: string) => {
    onChange(values.filter(v => v !== valueToRemove))
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {/* 라벨 */}
      <label
        htmlFor={id}
        className={clsx(
          'block text-sm font-medium',
          disabled
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* 설명 */}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {/* 선택된 항목들 */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
            >
              {option.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveSelection(option.value)}
                  className="ml-1 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* 드롭다운 */}
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          id={id}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        >
          <span className="block truncate text-gray-500 dark:text-gray-400">
            {selectedOptions.length > 0
              ? `${selectedOptions.length}개 선택됨`
              : placeholder
            }
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className={clsx(
                'h-5 w-5 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-lg border border-gray-200 dark:border-gray-600 overflow-auto">
            {options.map((option) => {
              const isSelected = values.includes(option.value)
              const canSelect = !maxSelections || values.length < maxSelections || isSelected

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => canSelect && handleOptionToggle(option.value)}
                  disabled={(option.disabled ?? false) || (!canSelect && !isSelected)}
                  className={clsx(
                    'relative w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors',
                    isSelected && 'bg-blue-50 dark:bg-blue-900/20',
                    ((option.disabled ?? false) || (!canSelect && !isSelected)) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { /* handled by parent button */ }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 최대 선택 수 안내 */}
      {maxSelections && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          최대 {maxSelections}개까지 선택 가능 ({values.length}/{maxSelections})
        </p>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}