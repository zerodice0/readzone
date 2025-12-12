import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import {
  Heart,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Book as BookIcon,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { api } from 'convex/_generated/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { UserLayout } from '../../components/layout/UserLayout';

type SortOption = 'recent' | 'popular';

export default function BookmarksPage() {
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Fetch bookmarked reviews with book info
  const bookmarkedReviews = useQuery(
    api.bookmarks.listReviewsWithBooksByUser,
    user ? { userId: user.id, sortBy } : 'skip'
  );

  const isLoading = bookmarkedReviews === undefined;
  const hasBookmarks = bookmarkedReviews && bookmarkedReviews.length > 0;

  return (
    <UserLayout title="북마크">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-2 hidden lg:block">
          북마크
        </h1>
        <p className="text-stone-600">저장한 독후감을 모아보세요</p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mr-2" />
          <span className="text-stone-700">북마크를 불러오는 중...</span>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Sort options */}
          {hasBookmarks && (
            <div className="flex gap-2 mb-6">
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('recent')}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                최신순
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('popular')}
                className="gap-2"
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
                  className="block bg-white border border-stone-200 rounded-xl p-6 hover:shadow-md transition-all"
                >
                  <div className="flex gap-4">
                    {/* Book cover */}
                    <div className="w-20 h-28 flex-shrink-0">
                      {item.book.coverImageUrl ? (
                        <img
                          src={item.book.coverImageUrl}
                          alt={`${item.book.title} 표지`}
                          className="w-full h-full object-cover rounded-lg shadow-sm"
                          loading="lazy"
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
                      <h3 className="text-sm font-medium text-stone-600 mb-1">
                        {item.book.title}
                      </h3>

                      {/* Review title */}
                      {item.title && (
                        <h4 className="text-lg font-semibold text-stone-900 mb-2 line-clamp-1">
                          {item.title}
                        </h4>
                      )}

                      {/* Review content */}
                      <p className="text-sm text-stone-700 line-clamp-2 mb-3">
                        {item.content}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
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
                            {new Date(item.bookmarkedAt).toLocaleDateString(
                              'ko-KR'
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
            <div className="text-center py-20 bg-white border border-stone-200 rounded-xl">
              <Bookmark className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                북마크한 독후감이 없습니다
              </h3>
              <p className="text-stone-600 mb-6">
                마음에 드는 독후감을 북마크해보세요
              </p>
              <Link to="/feed">
                <Button className="bg-primary-600 hover:bg-primary-700">
                  피드 둘러보기
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </UserLayout>
  );
}
