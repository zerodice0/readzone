'use client'

import { useState, useEffect } from 'react'
import { Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchHistoryProps {
  onSelect: (query: string) => void
}

export function SearchHistory({ onSelect }: SearchHistoryProps) {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    // 검색 기록 로드
    try {
      const savedHistory = JSON.parse(localStorage.getItem('book-search-history') || '[]')
      setHistory(savedHistory)
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [])

  const removeHistoryItem = (query: string) => {
    try {
      const newHistory = history.filter(h => h !== query)
      setHistory(newHistory)
      localStorage.setItem('book-search-history', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to remove history item:', error)
    }
  }

  const clearAllHistory = () => {
    try {
      setHistory([])
      localStorage.removeItem('book-search-history')
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  if (history.length === 0) {
    return null
  }

  return (
    <div className="border-b">
      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">최근 검색어</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllHistory}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          전체 삭제
        </Button>
      </div>
      
      <div className="px-4 py-2 max-h-40 overflow-y-auto">
        {history.map((query, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 group hover:bg-gray-50 -mx-2 px-2 rounded"
          >
            <button
              onClick={() => onSelect(query)}
              className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900 truncate"
            >
              {query}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeHistoryItem(query)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}