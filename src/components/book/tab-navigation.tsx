'use client'

import { memo } from 'react'
import { Users, Search, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchTabId, SearchTab } from '@/types/book-selector'

const searchTabs: SearchTab[] = [
  { 
    id: 'community', 
    label: '커뮤니티 도서', 
    description: '다른 사용자들이 등록한 도서',
    icon: Users
  },
  { 
    id: 'kakao', 
    label: '도서 검색', 
    description: '카카오 도서 API로 새로운 도서 찾기',
    icon: Search
  },
  { 
    id: 'manual', 
    label: '직접 입력', 
    description: '검색되지 않는 도서 직접 등록',
    icon: Edit
  }
]

interface TabNavigationProps {
  activeTab: SearchTabId
  onTabChange: (tabId: SearchTabId) => void
  className?: string
}

export const TabNavigation = memo(function TabNavigation({ 
  activeTab, 
  onTabChange, 
  className = '' 
}: TabNavigationProps) {
  return (
    <div className={cn('w-full', className)} role="tablist" aria-label="도서 검색 탭">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {searchTabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200',
                'border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                'hover:text-gray-700 dark:hover:text-gray-300',
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <Icon 
                    className={cn(
                      'h-4 w-4',
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    )} 
                    aria-hidden="true" 
                  />
                  <span className="font-medium">{tab.label}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">
                  {tab.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})

export { searchTabs, type SearchTabId }