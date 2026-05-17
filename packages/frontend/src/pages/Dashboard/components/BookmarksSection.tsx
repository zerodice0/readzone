import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import {
  Heart,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Book as BookIcon,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { api } from 'convex/_generated/api';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { LoadingState } from '../../../components/ui/loading-state';
import { EmptyState } from '../../../components/ui/empty-state';

type SortOption = 'recent' | 'popular';

const bookmarkedDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
});

export function BookmarksSection() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Fetch bookmarked reviews with book info
  const bookmarkedReviews = useQuery(
    api.bookmarks.listReviewsWithBooksByUser,
    user ? { userId: user.id, sortBy } : 'skip'
  );

  const isLoading = bookmarkedReviews === undefined;
  const hasBookmarks = bookmarkedReviews && bookmarkedReviews.length > 0;

  // Loading state
  if (isLoading) {
    return <LoadingState message="북마크를 불러오는 중…" />;
  }

  return (
    <div className="space-y-6">
      {/* Sort options */}
      {hasBookmarks && (
        <div className="paper-surface flex gap-2 overflow-x-auto rounded-xl p-2 shadow-sm">
          <Button
            variant={sortBy === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('recent')}
            className="shrink-0 gap-2"
          >
            <Clock className="w-4 h-4" />
            최신순
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('popular')}
            className="shrink-0 gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            인기순
          </Button>
        </div>
      )}

      {/* Bookmarked reviews list */}
      {hasBookmarks ? (
        <div className="space-y-4">
          {bookmarkedReviews.map((item) => (
            <Link
              key={item._id}
              to={`/reviews/${item._id}`}
              className="paper-surface block rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:p-6"
            >
              <div className="flex gap-4">
                {/* Book cover */}
                <div className="h-28 w-20 flex-shrink-0">
                  {item.book.coverImageUrl ? (
                    <img
                      src={item.book.coverImageUrl}
                      alt={`${item.book.title} 표지`}
                      width={80}
                      height={112}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 rounded-lg flex items-center justify-center">
                      <BookIcon className="w-8 h-8 text-stone-300" />
                    </div>
                  )}
                </div>

                {/* Review info */}
                <div className="flex-1 min-w-0">
                  {/* Book title */}
                  <h3 className="mb-1 text-sm font-medium text-stone-600 line-clamp-1">
                    {item.book.title}
                  </h3>

                  {/* Review title */}
                  {item.title && (
                    <h4 className="mb-2 text-lg font-semibold text-stone-950 line-clamp-2">
                      {item.title}
                    </h4>
                  )}

                  {/* Review content */}
                  <p className="mb-3 text-sm leading-6 text-stone-700 line-clamp-2">
                    {item.content}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 tabular-nums">
                    {item.isRecommended ? (
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
                      <span>{item.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bookmark className="w-4 h-4 fill-current text-primary-500" />
                      <span>{item.bookmarkCount}</span>
                    </div>
                    {item.bookmarkedAt && (
                      <span className="text-xs">
                        {bookmarkedDateFormatter.format(
                          new Date(item.bookmarkedAt)
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="paper-surface rounded-xl">
          <EmptyState
            icon={Bookmark}
            title="북마크한 독후감이 없습니다"
            description="마음에 드는 독후감을 북마크해보세요."
            action={{
              label: '피드 둘러보기',
              // eslint-disable-next-line no-void
              onClick: () => void navigate('/feed'),
            }}
          />
        </div>
      )}
    </div>
  );
}
