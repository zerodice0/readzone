'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Share2, 
  Copy, 
  MessageCircle, 
  Facebook,
  Twitter,
  Check,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ShareMenuProps {
  url: string
  title: string
  description?: string
  className?: string
}

export function ShareMenu({ 
  url, 
  title, 
  description = '', 
  className = '' 
}: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // 링크 복사
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      toast.success('링크가 복사되었습니다!')
      
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
      toast.error('링크 복사에 실패했습니다.')
    }
  }

  // 카카오톡 공유
  const shareToKakao = () => {
    try {
      // 카카오톡 공유 URL 생성
      const kakaoUrl = `https://sharer.kakao.com/talk/friends/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`
      window.open(kakaoUrl, '_blank', 'width=500,height=600')
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      toast.error('카카오톡 공유에 실패했습니다.')
    }
  }

  // 트위터(X) 공유
  const shareToTwitter = () => {
    try {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
      window.open(twitterUrl, '_blank', 'width=500,height=600')
    } catch (error) {
      console.error('트위터 공유 실패:', error)
      toast.error('트위터 공유에 실패했습니다.')
    }
  }

  // 페이스북 공유
  const shareToFacebook = () => {
    try {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      window.open(facebookUrl, '_blank', 'width=500,height=600')
    } catch (error) {
      console.error('페이스북 공유 실패:', error)
      toast.error('페이스북 공유에 실패했습니다.')
    }
  }

  // Web Share API 사용 (모바일)
  const shareNative = async () => {
    if (!navigator.share) {
      copyToClipboard()
      return
    }

    try {
      await navigator.share({
        title,
        text: description,
        url
      })
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('네이티브 공유 실패:', error)
        copyToClipboard()
      }
    }
  }

  const shareOptions = [
    {
      label: '링크 복사',
      icon: isCopied ? Check : Copy,
      onClick: copyToClipboard,
      className: isCopied ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'
    },
    {
      label: '카카오톡',
      icon: MessageCircle,
      onClick: shareToKakao,
      className: 'text-yellow-500'
    },
    {
      label: 'X (Twitter)',
      icon: Twitter,
      onClick: shareToTwitter,
      className: 'text-blue-400'
    },
    {
      label: '페이스북',
      icon: Facebook,
      onClick: shareToFacebook,
      className: 'text-blue-600'
    }
  ]

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // 모바일에서는 네이티브 공유 API 우선 사용
          if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            shareNative()
          } else {
            setIsOpen(!isOpen)
          }
        }}
        className="flex items-center gap-1"
      >
        <Share2 className="h-4 w-4" />
        공유
      </Button>

      {/* 공유 메뉴 */}
      {isOpen && (
        <>
          {/* 백드롭 */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 공유 옵션 카드 */}
          <Card className="absolute top-full right-0 mt-2 p-3 z-50 min-w-[200px] shadow-lg border">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                공유하기
              </div>
              
              {shareOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => {
                    option.onClick()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <option.icon 
                    className={cn('h-4 w-4', option.className)} 
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {option.label}
                  </span>
                </button>
              ))}
              
              {/* 구분선 */}
              <div className="border-t my-2" />
              
              {/* URL 미리보기 */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  {url}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// 간단한 공유 버튼 (링크 복사만)
export function SimpleShareButton({ 
  url, 
  title, 
  className = '' 
}: Pick<ShareMenuProps, 'url' | 'title' | 'className'>) {
  const [isCopied, setIsCopied] = useState(false)

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setIsCopied(true)
        toast.success('링크가 복사되었습니다!')
        
        setTimeout(() => {
          setIsCopied(false)
        }, 2000)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // 사용자가 취소한 경우
      }
      
      console.error('공유 실패:', error)
      toast.error('공유에 실패했습니다.')
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleShare}
      className={cn(
        'transition-colors',
        isCopied && 'text-green-600',
        className
      )}
      title={'공유하기'}
    >
      {isCopied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  )
}