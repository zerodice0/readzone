import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import {
  Heart,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FileText,
  Edit,
  Eye,
} from 'lucide-react';
import { api } from 'convex/_generated/api';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT';

export function MyReviewsSection() {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mr-2" />
        <span className="text-stone-700">독후감을 불러오는 중...</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
          <FileText className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-stone-900">
            {stats.totalReviews}
          </p>
          <p className="text-sm text-stone-600">총 독후감</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
          <ThumbsUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-stone-900">
            {stats.recommendationRate}%
          </p>
          <p className="text-sm text-stone-600">추천 비율</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
          <Edit className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-stone-900">
            {stats.draftCount}
          </p>
          <p className="text-sm text-stone-600">초안</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
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
            <div
              key={review._id}
              className="bg-white border border-stone-200 rounded-xl p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {review.title && (
                      <h3 className="text-lg font-semibold text-stone-900">
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
                  <p className="text-sm text-stone-600 line-clamp-2 mb-3">
                    {review.content}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
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
                        {new Date(review.publishedAt).toLocaleDateString(
                          'ko-KR'
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <Link to={`/reviews/${review._id}`}>
                    <Button variant="outline" size="sm">
                      보기
                    </Button>
                  </Link>
                  <Link to={`/reviews/${review._id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-xl">
          <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stone-900 mb-2">
            {statusFilter === 'ALL'
              ? '작성한 독후감이 없습니다'
              : statusFilter === 'PUBLISHED'
                ? '발행된 독후감이 없습니다'
                : '초안이 없습니다'}
          </h3>
          <p className="text-stone-600 mb-6">첫 번째 독후감을 작성해보세요!</p>
          <Link to="/reviews/new">
            <Button className="bg-primary-600 hover:bg-primary-700">
              독후감 작성하기
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
