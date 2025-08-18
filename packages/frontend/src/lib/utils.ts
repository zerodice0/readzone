import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '방금 전'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)

    return `${minutes}분 전`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)

    return `${hours}시간 전`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)

    return `${days}일 전`
  } else {
    return formatDate(date)
  }
}

// ReviewCard에서 사용할 별칭
export const formatTimeAgo = formatRelativeTime

/**
 * 숫자를 축약된 형태로 변환 (1K, 1.2M 등)
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trim()}...`
}