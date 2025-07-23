import { type Metadata } from 'next'
import { ReviewFeed } from '@/components/feed/review-feed'
import { FloatingWriteButton } from '@/components/feed/floating-write-button'

export const metadata: Metadata = {
  title: 'ReadZone - 독서 커뮤니티',
  description: '독서 후 생각을 나누는 공간',
}

export default function HomePage(): JSX.Element {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 독후감 피드 */}
      <ReviewFeed />

      {/* 플로팅 작성 버튼 */}
      <FloatingWriteButton />
    </div>
  )
}