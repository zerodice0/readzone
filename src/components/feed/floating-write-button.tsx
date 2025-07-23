'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'

export function FloatingWriteButton(): JSX.Element {
  const { data: session } = useSession()
  const { isAuthenticated } = useAuthStore()
  const [showTooltip, setShowTooltip] = useState(false)

  const handleClick = (): void => {
    if (!isAuthenticated) {
      // 로그인 유도
      window.location.href = '/login'
      return
    }
  }

  if (isAuthenticated) {
    return (
      <Link href="/write">
        <Button
          size="lg"
          className={cn(
            'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg',
            'hover:scale-105 transition-transform z-50',
            'bg-blue-600 hover:bg-blue-700'
          )}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          
          {/* 툴팁 */}
          {showTooltip && (
            <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm px-2 py-1 rounded whitespace-nowrap">
              독후감 작성
              <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </Button>
      </Link>
    )
  }

  return (
    <Button
      size="lg"
      onClick={handleClick}
      className={cn(
        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg',
        'hover:scale-105 transition-transform z-50',
        'bg-blue-600 hover:bg-blue-700'
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      
      {/* 툴팁 */}
      {showTooltip && (
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm px-2 py-1 rounded whitespace-nowrap">
          로그인 후 독후감 작성
          <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </Button>
  )
}