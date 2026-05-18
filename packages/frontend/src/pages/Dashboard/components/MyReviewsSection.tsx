import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { ThumbsUp, FileText, Edit } from 'lucide-react';
import { api } from 'convex/_generated/api';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/ui/loading-state';
import { EmptyState } from '../../../components/ui/empty-state';
import { MyReviewCard } from '../../../components/reviews/MyReviewCard';

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT';

const publishedDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
});

export function MyReviewsSection() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Fetch user's reviews
  const allReviews = useQuery(
    api.reviews.listByUser,
    user ? { userId: user.id } : 'skip'
  );

  // Filter reviews based on selected status
  const filteredReviews = useMemo(() => {
    if (!allReviews) return null;
    if (statusFilter === 'ALL') return allReviews;
    return allReviews.filter((review) => review.status === statusFilter);
  }, [allReviews, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!allReviews) return null;

    const publishedReviews = allReviews.filter((r) => r.status === 'PUBLISHED');
    const draftReviews = allReviews.filter((r) => r.status === 'DRAFT');

    const totalReviews = allReviews.length;
    const recommendedCount = publishedReviews.filter(
      (r) => r.isRecommended
    ).length;
    const recommendationRate =
      publishedReviews.length > 0
        ? (recommendedCount / publishedReviews.length) * 100
        : 0;

    return {
      totalReviews,
      publishedCount: publishedReviews.length,
      draftCount: draftReviews.length,
      recommendationRate: Math.round(recommendationRate),
    };
  }, [allReviews]);

  const isLoading = allReviews === undefined;
  const hasReviews = filteredReviews && filteredReviews.length > 0;

  // Loading state
  if (isLoading) {
    return <LoadingState message="독후감을 불러오는 중…" />;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="paper-panel flex items-center gap-3 rounded-xl p-4">
          <FileText className="h-5 w-5 shrink-0 text-primary-600" />
          <div>
            <p className="text-2xl font-bold text-stone-950 tabular-nums">
              {stats.totalReviews}
            </p>
            <p className="text-sm text-stone-600">총 독후감</p>
          </div>
        </div>
        <div className="paper-panel flex items-center gap-3 rounded-xl p-4">
          <ThumbsUp className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-stone-950 tabular-nums">
              {stats.recommendationRate}%
            </p>
            <p className="text-sm text-stone-600">추천 비율</p>
          </div>
        </div>
        <div className="paper-panel flex items-center gap-3 rounded-xl p-4">
          <Edit className="h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <p className="text-2xl font-bold text-stone-950 tabular-nums">
              {stats.draftCount}
            </p>
            <p className="text-sm text-stone-600">초안</p>
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="paper-surface flex gap-2 overflow-x-auto rounded-xl p-2 shadow-sm">
        <Button
          variant={statusFilter === 'ALL' ? 'default' : 'outline'}
          size="sm"
          className="shrink-0"
          onClick={() => setStatusFilter('ALL')}
        >
          전체 ({stats.totalReviews})
        </Button>
        <Button
          variant={statusFilter === 'PUBLISHED' ? 'default' : 'outline'}
          size="sm"
          className="shrink-0"
          onClick={() => setStatusFilter('PUBLISHED')}
        >
          발행됨 ({stats.publishedCount})
        </Button>
        <Button
          variant={statusFilter === 'DRAFT' ? 'default' : 'outline'}
          size="sm"
          className="shrink-0"
          onClick={() => setStatusFilter('DRAFT')}
        >
          초안 ({stats.draftCount})
        </Button>
      </div>

      {/* Reviews list */}
      {hasReviews ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <MyReviewCard
              key={review._id}
              review={review}
              dateFormatter={publishedDateFormatter}
            />
          ))}
        </div>
      ) : (
        <div className="paper-surface rounded-xl">
          <EmptyState
            icon={FileText}
            title={
              statusFilter === 'ALL'
                ? '작성한 독후감이 없습니다'
                : statusFilter === 'PUBLISHED'
                  ? '발행된 독후감이 없습니다'
                  : '초안이 없습니다'
            }
            description="첫 번째 독후감을 작성해보세요."
            action={{
              label: '독후감 작성하기',
              // eslint-disable-next-line no-void
              onClick: () => void navigate('/reviews/new'),
            }}
          />
        </div>
      )}
    </div>
  );
}
