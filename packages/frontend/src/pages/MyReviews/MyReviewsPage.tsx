import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { ThumbsUp, FileText, Edit } from 'lucide-react';
import { api } from 'convex/_generated/api';
import { Button } from '../../components/ui/button';
import { LoadingState } from '../../components/ui/loading-state';
import { EmptyState } from '../../components/ui/empty-state';
import { UserLayout } from '../../components/layout/UserLayout';
import { MyReviewCard } from '../../components/reviews/MyReviewCard';

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT';

const publishedDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
});

export default function MyReviewsPage() {
  const navigate = useNavigate();
  const { user } = useUser();
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

  return (
    <UserLayout title="내 독후감">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-2 hidden lg:block">
          내 독후감
        </h1>
        <p className="text-stone-600">작성한 독후감을 관리하고 확인하세요</p>
      </div>

      {/* Loading state */}
      {isLoading && <LoadingState message="독후감을 불러오는 중..." />}

      {!isLoading && stats && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-stone-200 rounded-xl p-4 text-center">
              <FileText className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-stone-900">
                {stats.totalReviews}
              </p>
              <p className="text-sm text-stone-600">총 독후감</p>
            </div>
            <div className="bg-card border border-stone-200 rounded-xl p-4 text-center">
              <ThumbsUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-stone-900">
                {stats.recommendationRate}%
              </p>
              <p className="text-sm text-stone-600">추천 비율</p>
            </div>
            <div className="bg-card border border-stone-200 rounded-xl p-4 text-center">
              <Edit className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-stone-900">
                {stats.draftCount}
              </p>
              <p className="text-sm text-stone-600">초안</p>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('ALL')}
            >
              전체 ({stats.totalReviews})
            </Button>
            <Button
              variant={statusFilter === 'PUBLISHED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('PUBLISHED')}
            >
              발행됨 ({stats.publishedCount})
            </Button>
            <Button
              variant={statusFilter === 'DRAFT' ? 'default' : 'outline'}
              size="sm"
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
            <EmptyState
              icon={FileText}
              title={
                statusFilter === 'ALL'
                  ? '작성한 독후감이 없습니다'
                  : statusFilter === 'PUBLISHED'
                    ? '발행된 독후감이 없습니다'
                    : '초안이 없습니다'
              }
              description="첫 번째 독후감을 작성해보세요!"
              action={{
                label: '독후감 작성하기',
                // eslint-disable-next-line no-void
                onClick: () => void navigate('/reviews/new'),
              }}
            />
          )}
        </>
      )}
    </UserLayout>
  );
}
