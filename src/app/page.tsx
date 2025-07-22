import { Suspense } from 'react';
import { ReviewFeed } from '@/components/feed/review-feed';
import { FeedLoading } from '@/components/feed/feed-loading';

export default function Home() {
  return (
    <Suspense fallback={<FeedLoading />}>
      <ReviewFeed />
    </Suspense>
  );
}