import React, { useState } from 'react'
import { Check, Facebook, Link2, Share2, Twitter } from 'lucide-react'
import { copyToClipboard, generateShareUrl, nativeShare, type ShareData } from '@/utils/seo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ShareButtonProps {
  title: string
  text: string
  url?: string
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  className = '',
  variant = 'ghost',
  size = 'sm',
  showLabel = false
}) => {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const shareData: ShareData = {
    title,
    text,
    url: url ?? window.location.href
  }

  const handleNativeShare = async () => {
    const success = await nativeShare(shareData)

    if (!success) {
      // Fallback to showing share menu
      setIsOpen(true)
    }
  }

  const handlePlatformShare = (platform: string) => {
    const shareUrl = generateShareUrl(platform, shareData)

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    }
    setIsOpen(false)
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareData.url)

    setCopied(success)
    if (success) {
      setTimeout(() => setCopied(false), 2000)
    }
    setIsOpen(false)
  }

  // Use native sharing if available, otherwise show dropdown
  const shouldShowNativeShare = 'share' in navigator

  if (shouldShowNativeShare) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleNativeShare}
        className={`flex items-center gap-2 ${className ?? ''}`}
        aria-label={`"${title}" 공유하기`}
      >
        <Share2 className="w-4 h-4" />
        {showLabel && <span>공유</span>}
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center gap-2 ${className ?? ''}`}
          aria-label={`"${title}" 공유하기`}
        >
          <Share2 className="w-4 h-4" />
          {showLabel && <span>공유</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handlePlatformShare('twitter')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Twitter className="w-4 h-4 text-blue-400" />
          <span>Twitter</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handlePlatformShare('facebook')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Facebook className="w-4 h-4 text-blue-600" />
          <span>Facebook</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handlePlatformShare('naver')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span>네이버</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleCopyLink}
          className="flex items-center gap-2 cursor-pointer"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          <span>{copied ? '복사 완료!' : '링크 복사'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Specialized share buttons for different content types
export const ReviewShareButton: React.FC<{
  review: {
    title: string
    author: { nickname: string }
    book: { title: string }
  }
  reviewId: string
  className?: string
}> = ({ review, reviewId, className }) => {
  const shareTitle = `${review.title} - ${review.author.nickname}의 독후감`
  const shareText = `"${review.book.title}" 도서에 대한 ${review.author.nickname}님의 독후감을 ReadZone에서 확인해보세요!`
  const shareUrl = `${window.location.origin}/review/${reviewId}`

  return (
    <ShareButton
      title={shareTitle}
      text={shareText}
      url={shareUrl}
      className={className ?? ''}
      showLabel={false}
    />
  )
}

export const ProfileShareButton: React.FC<{
  user: {
    nickname: string
    userid: string
    bio?: string
  }
  className?: string
}> = ({ user, className }) => {
  const shareTitle = `${user.nickname} (@${user.userid}) - ReadZone`
  const shareText = user.bio ?? `${user.nickname}님의 ReadZone 프로필을 확인해보세요!`
  const shareUrl = `${window.location.origin}/profile/${user.userid}`

  return (
    <ShareButton
      title={shareTitle}
      text={shareText}
      url={shareUrl}
      className={className ?? ''}
      showLabel={false}
    />
  )
}

export const BookShareButton: React.FC<{
  book: {
    title: string
    author: string
  }
  bookId: string
  className?: string
}> = ({ book, bookId, className }) => {
  const shareTitle = `${book.title} - ${book.author}`
  const shareText = `"${book.title}" 도서 정보와 독후감을 ReadZone에서 확인해보세요!`
  const shareUrl = `${window.location.origin}/books/${bookId}`

  return (
    <ShareButton
      title={shareTitle}
      text={shareText}
      url={shareUrl}
      className={className ?? ''}
      showLabel={false}
    />
  )
}

// Kakao sharing component (requires Kakao SDK)
export const KakaoShareButton: React.FC<{
  title: string
  description: string
  imageUrl?: string
  linkUrl?: string
  className?: string
}> = ({ title, description, imageUrl, linkUrl, className }) => {
  const handleKakaoShare = () => {
    if (typeof window !== 'undefined' && window.Kakao) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description,
          imageUrl: imageUrl ?? `${window.location.origin}/og-image.png`,
          link: {
            mobileWebUrl: linkUrl ?? window.location.href,
            webUrl: linkUrl ?? window.location.href,
          },
        },
        buttons: [
          {
            title: 'ReadZone에서 보기',
            link: {
              mobileWebUrl: linkUrl ?? window.location.href,
              webUrl: linkUrl ?? window.location.href,
            },
          },
        ],
      })
    } else {
      console.warn('Kakao SDK is not loaded')
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleKakaoShare}
      className={`flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400 ${className ?? ''}`}
      aria-label={`카카오톡으로 "${title}" 공유하기`}
    >
      <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
        <span className="text-yellow-400 text-xs font-bold">K</span>
      </div>
      <span>카카오톡</span>
    </Button>
  )
}