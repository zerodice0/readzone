import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import {
  Heart,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Edit,
  Eye,
} from 'lucide-react';
import { api } from 'convex/_generated/api';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { LoadingState } from '../../../components/ui/loading-state';
import { EmptyState } from '../../../components/ui/empty-state';

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
            <div
              key={review._id}
              className="paper-surface rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                    {review.title && (
                      <h3 className="min-w-0 text-lg font-semibold text-stone-950 line-clamp-2">
                        {review.title}
                      </h3>
                    )}
                    {review.status === 'DRAFT' ? (
                      <Badge variant="secondary" className="text-xs">
                        초안
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="text-xs bg-green-100 text-green-800 border-green-200"
                      >
                        발행됨
                      </Badge>
                    )}
                  </div>
                  <p className="mb-3 text-sm leading-6 text-stone-600 line-clamp-2">
                    {review.content}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 tabular-nums">
                    {review.isRecommended ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        추천
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        비추천
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{review.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bookmark className="w-4 h-4" />
                      <span>{review.bookmarkCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{review.viewCount}</span>
                    </div>
                    {review.publishedAt && (
                      <span>
                        {publishedDateFormatter.format(
                          new Date(review.publishedAt)
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2 sm:ml-4">
                  <Link to={`/reviews/${review._id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                      보기
                    </Button>
                  </Link>
                  <Link to={`/reviews/${review._id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                      수정
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
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
