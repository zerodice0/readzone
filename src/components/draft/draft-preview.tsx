'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface DraftPreviewProps {
  content: string
  maxLength?: number
  className?: string
}

export function DraftPreview({ 
  content, 
  maxLength = 120, 
  className = '' 
}: DraftPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const plainText = stripHtml(content)
  const needsTruncation = plainText.length > maxLength
  const displayText = needsTruncation && !isExpanded 
    ? plainText.slice(0, maxLength) + '...' 
    : plainText

  if (!content.trim()) {
    return (
      <div 
        className={`text-sm text-gray-400 dark:text-gray-500 italic ${className}`}
        role="status"
        aria-label="미리보기 내용 없음"
      >
        내용 없음
      </div>
    )
  }

  return (
    <div className={`text-sm ${className}`}>
      <div 
        className="text-gray-600 dark:text-gray-300 leading-relaxed"
        aria-label={`작성내용 미리보기: ${plainText.slice(0, 50)}${plainText.length > 50 ? '...' : ''}`}
      >
        {displayText}
      </div>
      
      {needsTruncation && (
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto text-xs text-primary-600 dark:text-primary-400 mt-1 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="preview-content"
          aria-label={isExpanded ? '미리보기 접기' : '전체 내용 보기'}
        >
          {isExpanded ? '접기' : '더보기'}
        </Button>
      )}
    </div>
  )
}