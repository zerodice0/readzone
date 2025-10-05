import type { FC, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import useSearchStore, { useSearchPagination, useSearchResults } from '@/store/searchStore';
import type { BookSearchResult, ReviewSearchResult, UserSearchResult } from '@/types/index';
import { cn } from '@/lib/utils';
import { Calendar, Eye, Heart, MessageSquare, Star, User } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface SearchResultsProps {
  className?: string;
}

const sortOptions = [
  { key: 'relevance', label: '관련도순' },
  { key: 'newest', label: '최신순' },
  { key: 'oldest', label: '오래된순' },
  { key: 'popular', label: '인기순' },
  { key: 'rating', label: '평점순' },
];

const Highlight: FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query) {return <>{text}</>;}

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-yellow-100 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const BookResultCard: FC<{ book: BookSearchResult; query: string }> = ({ book, query }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (book.id) {
      navigate({ to: `/books/${book.id}` });
    }
  };

  const handleWriteReview = (e: MouseEvent) => {
    e.stopPropagation();
    if (book.id) {
      navigate({ to: `/write?bookId=${book.id}` });
    }
  };

  return (
    <div
      className="group relative flex gap-4 p-4 rounded-xl border bg-white/70 transition border-slate-200 hover:shadow-md cursor-pointer"
      onClick={handleClick}
    >
      <div className="w-12 h-16 rounded-md bg-slate-100 overflow-hidden shadow-sm shrink-0">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Eye className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-slate-900 line-clamp-2">
            <Highlight text={book.title} query={query} />
          </h3>
          {book.stats && book.stats.reviewCount > 0 && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              📚 {book.stats.reviewCount}
            </Badge>
          )}
        </div>

        <p className="text-sm text-slate-600 mt-0.5 truncate">
          <Highlight text={book.author} query={query} />
          {book.publisher && ` · ${book.publisher}`}
          {book.publishedDate && ` · ${book.publishedDate}`}
        </p>

        {book.genre && book.genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {book.genre.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {book.stats?.averageRating && (
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>추천 {Math.round(book.stats.averageRating * 100)}%</span>
          </div>
        )}

        {book.description && (
          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
            <Highlight text={book.description} query={query} />
          </p>
        )}
      </div>

      <div className="self-start">
        {book.id && (
          <Button size="sm" onClick={handleWriteReview}>
            독후감 쓰기
          </Button>
        )}
      </div>
    </div>
  );
};

const ReviewResultCard: FC<{ review: ReviewSearchResult; query: string }> = ({ review, query }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: `/review/${review.id}` });
  };

  const handleUserClick = (e: MouseEvent) => {
    e.stopPropagation();
    navigate({ to: `/profile/${review.author.id}` });
  };

  const handleBookClick = (e: MouseEvent) => {
    e.stopPropagation();
    navigate({ to: `/books/${review.book.id}` });
  };

  return (
    <div
      className="group relative p-4 rounded-xl border bg-white/70 transition border-slate-200 hover:shadow-md cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-8 h-8" onClick={handleUserClick}>
          {review.author.profileImage && <AvatarImage src={review.author.profileImage} />}
          <AvatarFallback>
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUserClick}
              className="font-medium text-sm text-slate-900 hover:underline"
            >
              <Highlight text={review.author.nickname} query={query} />
            </button>
            <Badge variant={review.rating === 'recommend' ? 'default' : 'secondary'} className="text-xs">
              {review.rating === 'recommend' ? '👍 추천' : '👎 비추천'}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-slate-700 line-clamp-3">
          <Highlight text={review.content} query={query} />
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleBookClick}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          {review.book.coverImage && (
            <img
              src={review.book.coverImage}
              alt={review.book.title}
              className="w-6 h-8 object-cover rounded"
            />
          )}
          <div className="text-left">
            <div className="font-medium line-clamp-1">
              <Highlight text={review.book.title} query={query} />
            </div>
            <div className="text-xs text-slate-500">
              <Highlight text={review.book.author} query={query} />
            </div>
          </div>
        </button>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>{review.stats.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>{review.stats.comments}</span>
          </div>
        </div>
      </div>

      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {review.tags.slice(0, 5).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const UserResultCard: FC<{ user: UserSearchResult; query: string }> = ({ user, query }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: `/profile/${user.id}` });
  };

  return (
    <div
      className="group relative p-4 rounded-xl border bg-white/70 transition border-slate-200 hover:shadow-md cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12">
          {user.profileImage && <AvatarImage src={user.profileImage} />}
          <AvatarFallback>
            <User className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">
              <Highlight text={user.nickname} query={query} />
            </h3>
            {user.isFollowing && (
              <Badge variant="secondary" className="text-xs">
                팔로잉
              </Badge>
            )}
          </div>

          {user.bio && (
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              <Highlight text={user.bio} query={query} />
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <div>독후감 {user.stats.reviewCount}개</div>
            <div>팔로워 {user.stats.followerCount}명</div>
            <div>팔로잉 {user.stats.followingCount}명</div>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
            <Calendar className="w-3 h-3" />
            <span>
              마지막 활동: {new Date(user.recentActivity.lastActiveAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SearchResults: FC<SearchResultsProps> = ({ className }) => {
  const {
    query,
    type,
    sort,
    setSort,
    loadMore,
    error,
  } = useSearchStore();

  const { books, reviews, users } = useSearchResults();
  const { hasMore, isLoading, isLoadingMore, total } = useSearchPagination();

  const triggerRef = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  });

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-red-600 mb-4">검색 중 오류가 발생했습니다</div>
        <div className="text-sm text-gray-600">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-slate-200 bg-slate-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const totalResults = books.length + reviews.length + users.length;

  if (totalResults === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-gray-600 mb-2">검색 결과가 없습니다</div>
        <div className="text-sm text-gray-500">
          다른 키워드로 검색해보세요
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          총 {total ? total.toLocaleString() : totalResults.toLocaleString()}개의 결과
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">정렬:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {/* Book Results */}
        {books.length > 0 && (
          <div className="space-y-3">
            {type === 'all' && (
              <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                📚 도서 ({books.length})
              </h3>
            )}
            {books.map((book, index) => (
              <BookResultCard
                key={book.id ?? `book-${index}`}
                book={book}
                query={query}
              />
            ))}
          </div>
        )}

        {/* Review Results */}
        {reviews.length > 0 && (
          <div className="space-y-3">
            {type === 'all' && (
              <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                📝 독후감 ({reviews.length})
              </h3>
            )}
            {reviews.map((review) => (
              <ReviewResultCard
                key={review.id}
                review={review}
                query={query}
              />
            ))}
          </div>
        )}

        {/* User Results */}
        {users.length > 0 && (
          <div className="space-y-3">
            {type === 'all' && (
              <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                👤 사용자 ({users.length})
              </h3>
            )}
            {users.map((user) => (
              <UserResultCard
                key={user.id}
                user={user}
                query={query}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More Trigger */}
      {!isLoadingMore && hasMore && <div ref={triggerRef} className="h-1" />}

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-slate-500">
            더 많은 결과를 불러오는 중...
          </div>
        </div>
      )}
    </div>
  );
};
