'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TableOfContentsProps {
  content: string
  className?: string
  collapsible?: boolean
  maxLevel?: number
}

interface Heading {
  id: string
  text: string
  level: number
}

export function TableOfContents({
  content,
  className = '',
  collapsible = true,
  maxLevel = 6
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeHeading, setActiveHeading] = useState<string>('')

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const extractedHeadings: Heading[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      if (level <= maxLevel) {
        const text = match[2].trim()
        const id = text.toLowerCase().replace(/[^\w가-힣]+/g, '-').replace(/^-+|-+$/g, '')
        extractedHeadings.push({ id, text, level })
      }
    }

    setHeadings(extractedHeadings)
  }, [content, maxLevel])

  useEffect(() => {
    // Track active heading on scroll
    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean)
      
      if (headingElements.length === 0) return

      // Find the heading that's currently in view
      const scrollPosition = window.scrollY + 100 // Offset for header
      let currentHeading = ''

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i]
        if (element && element.offsetTop <= scrollPosition) {
          currentHeading = element.id
          break
        }
      }

      setActiveHeading(currentHeading)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Set initial active heading

    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
      
      // Focus the element for accessibility
      element.focus()
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <Card className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            목차
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({headings.length}개)
          </span>
        </div>
        
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0"
            aria-label={isCollapsed ? '목차 펼치기' : '목차 접기'}
          >
            {isCollapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {/* Table of Contents */}
      {!isCollapsed && (
        <nav
          role="navigation"
          aria-label="문서 목차"
          className="space-y-1"
        >
          {headings.map((heading, index) => (
            <button
              key={index}
              onClick={() => scrollToHeading(heading.id)}
              className={cn(
                'w-full text-left px-2 py-1 text-sm rounded transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                activeHeading === heading.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              )}
              style={{ 
                paddingLeft: `${(heading.level - 1) * 0.75 + 0.5}rem`,
                fontSize: `${Math.max(0.75, 0.9 - (heading.level - 1) * 0.05)}rem`
              }}
              title={`${heading.level}단계 제목: ${heading.text}`}
            >
              <span className="block truncate">
                {heading.text}
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* Quick stats */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>제목 수:</span>
            <span>{headings.length}개</span>
          </div>
          <div className="flex justify-between">
            <span>최대 단계:</span>
            <span>{Math.max(...headings.map(h => h.level))}단계</span>
          </div>
        </div>
      </div>
    </Card>
  )
}