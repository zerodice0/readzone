'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Hash, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  maxTags?: number
  maxLength?: number
  className?: string
  disabled?: boolean
}

export function TagInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = '태그를 입력하세요',
  maxTags = 10,
  maxLength = 20,
  className = '',
  disabled = false
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 필터링된 추천 태그
  const filteredSuggestions = suggestions.filter(suggestion =>
    !value.includes(suggestion) && 
    suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
    inputValue.length > 0
  ).slice(0, 8) // 최대 8개까지만 표시

  // 입력 필드 포커스 시 추천 태그 표시
  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0 || suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // 외부 클릭 시 추천 태그 숨김
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setFocusedSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 태그 추가
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    
    if (!trimmedTag) return
    if (value.includes(trimmedTag)) return
    if (value.length >= maxTags) return
    if (trimmedTag.length > maxLength) return

    onChange([...value, trimmedTag])
    setInputValue('')
    setShowSuggestions(false)
    setFocusedSuggestionIndex(-1)
  }

  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
    inputRef.current?.focus()
  }

  // 키보드 이벤트 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (focusedSuggestionIndex >= 0 && filteredSuggestions[focusedSuggestionIndex]) {
          addTag(filteredSuggestions[focusedSuggestionIndex])
        } else if (inputValue.trim()) {
          addTag(inputValue)
        }
        break

      case 'Backspace':
        if (!inputValue && value.length > 0) {
          removeTag(value[value.length - 1])
        }
        break

      case 'ArrowDown':
        e.preventDefault()
        if (showSuggestions && filteredSuggestions.length > 0) {
          setFocusedSuggestionIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          )
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (showSuggestions && filteredSuggestions.length > 0) {
          setFocusedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          )
        }
        break

      case 'Escape':
        setShowSuggestions(false)
        setFocusedSuggestionIndex(-1)
        break

      case 'Tab':
        if (showSuggestions && focusedSuggestionIndex >= 0 && filteredSuggestions[focusedSuggestionIndex]) {
          e.preventDefault()
          addTag(filteredSuggestions[focusedSuggestionIndex])
        }
        break
    }
  }

  // 입력값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // 공백이나 쉼표로 태그 추가
    if (newValue.includes(' ') || newValue.includes(',')) {
      const newTag = newValue.replace(/[, ]+/g, '').trim()
      if (newTag) {
        addTag(newTag)
      } else {
        setInputValue('')
      }
      return
    }

    setInputValue(newValue)
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0)
    setFocusedSuggestionIndex(-1)
  }

  // 추천 태그 클릭
  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion)
  }

  // 인기 태그 표시 (입력이 없을 때)
  const popularTags = suggestions.slice(0, 12).filter(tag => !value.includes(tag))

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* 메인 입력 영역 */}
      <div 
        className={cn(
          'min-h-[42px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          'flex flex-wrap items-center gap-1'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* 기존 태그들 */}
        {value.map((tag, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="flex items-center gap-1 text-xs"
          >
            <Hash className="h-2 w-2" />
            {tag}
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            )}
          </Badge>
        ))}

        {/* 입력 필드 */}
        {value.length < maxTags && (
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled}
            className="border-none shadow-none p-0 h-auto min-w-[120px] flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
            maxLength={maxLength}
          />
        )}
      </div>

      {/* 태그 개수 표시 */}
      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
        <span>
          {value.length}/{maxTags}개
        </span>
        {inputValue.length > 0 && (
          <span>
            {inputValue.length}/{maxLength}자
          </span>
        )}
      </div>

      {/* 추천 태그 드롭다운 */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 p-2 z-50 max-h-48 overflow-y-auto">
          <div className="space-y-1">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                className={cn(
                  'w-full text-left px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground',
                  'flex items-center gap-2',
                  focusedSuggestionIndex === index && 'bg-accent text-accent-foreground'
                )}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setFocusedSuggestionIndex(index)}
              >
                <Hash className="h-3 w-3 text-gray-400" />
                {suggestion}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* 인기 태그 (입력이 없을 때 표시) */}
      {!showSuggestions && !inputValue && popularTags.length > 0 && value.length < maxTags && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">인기 태그</p>
          <div className="flex flex-wrap gap-1">
            {popularTags.map((tag) => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => addTag(tag)}
                disabled={disabled}
              >
                <Plus className="h-2 w-2 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 사용법 안내 */}
      {value.length === 0 && !inputValue && (
        <p className="text-xs text-gray-400 mt-2">
          태그를 입력하고 Enter를 누르거나 공백, 쉼표로 구분하세요
        </p>
      )}
    </div>
  )
}