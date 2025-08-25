import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import FeedTabs from '@/components/feed/FeedTabs';
import ReviewCard from '@/components/feed/ReviewCard';
import InfiniteScroll from '@/components/common/InfiniteScroll';
import useFeedStore, { useFeedCursor, useFeedReviews } from '@/store/feedStore';
import { useFeed, useLikeMutation } from '@/hooks/useFeedApi';
import type { FeedTab } from '@/types/feed';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const FEED_LIMIT = 20;

interface MainFeedProps {
  className?: string;
}

export const MainFeed = ({ className }: MainFeedProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requireAuth, isAuthenticated } = useAuthGuard();

  const {
    activeTab,
    isLoading,
    hasMore,
    error,
    setActiveTab,
    setReviews,
    appendReviews,
    updateReviewStats,
    updateUserInteraction,
    setLoading,
    setError,
    setHasMore
  } = useFeedStore();

  const reviews = useFeedReviews();
  const cursor = useFeedCursor();

  // 피드 데이터 패칭
  const { data: feedData, isLoading: isQueryLoading, error: queryError } = useFeed({
    tab: activeTab,
    ...(cursor && { cursor }),
    limit: FEED_LIMIT
  });

  const likeMutation = useLikeMutation();

  // 피드 데이터 처리
  useEffect(() => {
    if (feedData) {
      if (cursor) {
        // 무한 스크롤로 추가 로드
        appendReviews(activeTab, feedData.reviews, feedData.nextCursor ?? undefined);
      } else {
        // 새 탭 또는 새로고침
        setReviews(activeTab, feedData.reviews, feedData.nextCursor ?? undefined);
      }
      setHasMore(feedData.hasMore);
    }
  }, [feedData, activeTab, cursor, appendReviews, setReviews, setHasMore]);

  // 로딩 및 에러 상태 동기화
  useEffect(() => {
    setLoading(isQueryLoading);
    setError(queryError?.message ?? null);
  }, [isQueryLoading, queryError, setLoading, setError]);

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      // 다음 페이지 로드 (React Query가 자동으로 처리)
    }
  };

  const handleLike = async (reviewId: string) => {
    return requireAuth(async () => {
      const review = reviews.find(r => r.id === reviewId);

      if (!review) {
        return;
      }

      const isLiked = review.userInteraction?.isLiked ?? false;
      const action = isLiked ? 'unlike' : 'like';

      // 낙관적 업데이트
      updateUserInteraction(reviewId, { 
        isLiked: !isLiked,
        isBookmarked: review.userInteraction?.isBookmarked ?? false
      });
      updateReviewStats(reviewId, { 
        likes: review.stats.likes + (isLiked ? -1 : 1) 
      });

      try {
        await likeMutation.mutateAsync({ reviewId, action });
      } catch (_error) {
        // 실패 시 롤백
        updateUserInteraction(reviewId, review.userInteraction);
        updateReviewStats(reviewId, { likes: review.stats.likes });
      }
    }, {
      message: {
        title: '로그인 필요',
        description: '좋아요를 누르려면 로그인이 필요합니다.'
      }
    });
  };

  const handleComment = (reviewId: string) => {
    return requireAuth(() => {
      navigate({ to: `/review/${reviewId}#comments` });
    }, {
      message: {
        title: '로그인 필요',
        description: '댓글을 남기려면 로그인이 필요합니다.'
      }
    });
  };

  const handleShare = async (reviewId: string) => {
    const shareUrl = `${window.location.origin}/review/${reviewId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '독후감 공유',
          url: shareUrl
        });
      } catch (_error) {
        // 사용자가 공유를 취소한 경우 무시
      }
    } else {
      // 웹 공유 API 미지원시 클립보드 복사
      await navigator.clipboard.writeText(shareUrl);
      toast({
        variant: 'success',
        title: '링크 복사됨',
        description: '독후감 링크가 클립보드에 복사되었습니다.',
      });
    }
  };

  const handleProfileClick = (userId: string) => {
    navigate({ to: `/profile/${userId}` });
  };

  const handleBookClick = (bookId: string) => {
    navigate({ to: `/books/${bookId}` });
  };

  const handleReviewClick = (reviewId: string) => {
    navigate({ to: `/review/${reviewId}` });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <p className="text-destructive">오류가 발생했습니다: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="max-w-2xl mx-auto">
        {/* 피드 탭 */}
        <FeedTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isAuthenticated={isAuthenticated}
        />

        {/* 독후감 목록 */}
        <div>
          <InfiniteScroll
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={handleLoadMore}
            className="space-y-6 py-6"
          >
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onProfileClick={handleProfileClick}
                onBookClick={handleBookClick}
                onReviewClick={handleReviewClick}
              />
            ))}
            
            {reviews.length === 0 && !isLoading && (
              <div className="text-center py-12 space-y-4">
                <p className="text-muted-foreground">독후감이 없습니다.</p>
                {activeTab === 'following' && isAuthenticated && (
                  <p className="text-sm text-muted-foreground">
                    다른 사용자를 팔로우하여 피드를 채워보세요.
                  </p>
                )}
              </div>
            )}
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
};