'use client'

import { ColorContrast } from './draft-accessibility-styles'

export function EmptyDraftState() {
  return (
    <div 
      className="text-center py-8"
      role="status"
      aria-label="저장된 독후감 초안이 없습니다"
    >
      <div 
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        aria-hidden="true"
      >
        <svg 
          className="w-8 h-8 text-gray-400 dark:text-gray-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
      </div>
      <h3 
        className={`text-lg font-medium mb-2 ${ColorContrast.text.primary}`}
        id="empty-state-title"
      >
        저장된 임시글이 없습니다
      </h3>
      <p 
        className={`text-sm ${ColorContrast.text.secondary}`}
        aria-describedby="empty-state-title"
      >
        독후감을 작성하면 자동으로 임시저장됩니다
      </p>
    </div>
  )
}