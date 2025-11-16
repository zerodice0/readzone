/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useState, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Heart,
  Bookmark,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Star,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Id } from 'convex/_generated/dataModel';
import { useLoginPromptStore } from '../../stores/loginPromptStore';

// Convex data structure from getFeed query
interface ReviewCardProps {
  review: {
    _id: Id<'reviews'>;
    _creationTime: number;
    userId: string;
    bookId: Id<'books'>;
    title?: string;
    content: string;
    rating?: number;
    isRecommended: boolean;
    readStatus: 'READING' | 'COMPLETED' | 'DROPPED';
    status: 'DRAFT' | 'PUBLISHED' | 'DELETED';
    likeCount: number;
    bookmarkCount: number;
    viewCount: number;
    publishedAt?: number;
    deletedAt?: number;
    book: {
      _id: Id<'books'>;
      title: string;
      author: string;
      coverImageUrl?: string;
    } | null;
    hasLiked: boolean;
    hasBookmarked: boolean;
  };
}

export const ReviewCard = memo(function ReviewCard({
  review,
}: ReviewCardProps) {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { show: showLoginPrompt } = useLoginPromptStore();
  const [imageError, setImageError] = useState(false);

  // Convex mutations
  const toggleLike = useMutation(api.likes.toggle);
  const toggleBookmark = useMutation(api.bookmarks.toggle);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't navigate if clicking on buttons
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      navigate(`/reviews/${String(review._id)}`);
    },
    [navigate, review._id]
  );

  // T111: Keyboard navigation support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(`/reviews/${String(review._id)}`);
      }
    },
    [navigate, review._id]
  );

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isSignedIn) {
        showLoginPrompt('좋아요를 누르려면 로그인이 필요합니다.');
        return;
      }

      void toggleLike({ reviewId: review._id }).catch((error: unknown) => {
        console.error('Failed to toggle like:', error);
        // eslint-disable-next-line no-alert
        alert('좋아요 처리에 실패했습니다.');
      });
    },
    [toggleLike, review._id, isSignedIn, showLoginPrompt]
  );

  const handleBookmark = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isSignedIn) {
        showLoginPrompt('북마크를 추가하려면 로그인이 필요합니다.');
        return;
      }

      void toggleBookmark({ reviewId: review._id }).catch((error: unknown) => {
        console.error('Failed to toggle bookmark:', error);
        // eslint-disable-next-line no-alert
        alert('북마크 처리에 실패했습니다.');
      });
    },
    [toggleBookmark, review._id, isSignedIn, showLoginPrompt]
  );

  const handleShare = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      const origin = (window as Window).location.origin;
      const url = `${origin}/reviews/${String(review._id)}`;
      void navigator.clipboard.writeText(url);
      // TODO: Replace with toast notification
      // eslint-disable-next-line no-alert
      (alert as (message: string) => void)('링크가 복사되었습니다');
    },
    [review._id]
  );

  const displayTime = useMemo(() => {
    if (!review.publishedAt) return '발행 일자 미정';

    const date = new Date(review.publishedAt);
    const now = new Date();
    const yearDiff = now.getFullYear() - date.getFullYear();

    if (yearDiff >= 1) {
      return date.toLocaleDateString('ko-KR');
    }

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ko,
    });
  }, [review.publishedAt]);

  return (
    <Card
      // T110: Add ARIA attributes and semantic HTML
      role="article"
      aria-labelledby={`review-${review._id}-title`}
      aria-describedby={`review-${review._id}-content`}
      // T111: Keyboard navigation
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/5 hover:scale-[1.01] hover:border-primary-200 w-full bg-white border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background shadow-sm"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-col sm:flex-row gap-4 sm:gap-6 space-y-0 p-6">
        {/* Book cover */}
        <div className="shrink-0 self-center sm:self-start">
          {/* T109: Image optimization with WebP and responsive images */}
          <picture>
            <source
              srcSet={
                imageError || !review.book?.coverImageUrl
                  ? '/placeholder-book.webp'
                  : `${review.book.coverImageUrl}?format=webp`
              }
              type="image/webp"
            />
            <img
              src={
                imageError || !review.book?.coverImageUrl
                  ? '/placeholder-book.png'
                  : review.book.coverImageUrl
              }
              srcSet={
                !imageError && review.book?.coverImageUrl
                  ? `${review.book.coverImageUrl}?w=96 96w, ${review.book.coverImageUrl}?w=192 192w, ${review.book.coverImageUrl}?w=288 288w`
                  : undefined
              }
              sizes="(max-width: 640px) 96px, 128px"
              alt={`${review.book?.title || '책'} 표지`}
              className="w-24 h-32 sm:w-32 sm:h-44 object-cover rounded-lg shadow-md ring-1 ring-stone-200 transition-all hover:shadow-lg hover:ring-primary-200"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </picture>
        </div>

        <div className="flex-1 text-center sm:text-left">
          {/* User info */}
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
              {review.userId.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">
                사용자 {review.userId.slice(-4)}
              </p>
              <p className="text-xs text-muted-foreground">{displayTime}</p>
            </div>
          </div>

          {/* Book title and author - T110: Add IDs for ARIA */}
          <h3
            id={`review-${review._id}-title`}
            className="font-bold text-xl sm:text-2xl mb-1 text-stone-900 leading-tight"
          >
            {review.book?.title || '제목 없음'}
          </h3>
          <p className="text-sm sm:text-base text-stone-600 mb-3">
            {review.book?.author || '작가 미상'}
          </p>

          {/* Review title */}
          {review.title && (
            <h4 className="font-semibold text-base mb-2 text-stone-800">
              {review.title}
            </h4>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-4 pt-0">
        {/* Review excerpt - T110: Add ID for ARIA */}
        <p
          id={`review-${review._id}-content`}
          className="text-sm text-stone-700 line-clamp-3 mb-4 leading-relaxed"
        >
          {review.content.length > 200
            ? review.content.substring(0, 200) + '...'
            : review.content}
        </p>

        {/* Recommend status and rating */}
        <div className="flex items-center gap-2 flex-wrap">
          {review.isRecommended ? (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              추천
            </Badge>
          ) : (
            <Badge
              variant="destructive"
              className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
            >
              <ThumbsDown className="w-3 h-3 mr-1" />
              비추천
            </Badge>
          )}
          {review.rating && (
            <Badge
              variant="secondary"
              className="bg-amber-50 text-amber-900 border-amber-200"
            >
              <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
              {review.rating}/5
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap justify-between items-center gap-2 px-6 py-4 bg-stone-50/50 border-t border-stone-100">
        <div className="flex gap-2">
          {/* Like button - T110: Add ARIA labels */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`transition-all hover:bg-red-50 hover:text-red-600 ${
              review.hasLiked ? 'text-red-600 bg-red-50' : 'text-stone-600'
            }`}
            aria-label={`${review.hasLiked ? '좋아요 취소' : '좋아요'} (${review.likeCount}개)`}
            title={!isSignedIn ? '로그인이 필요합니다' : undefined}
          >
            <Heart
              className={`w-4 h-4 mr-1.5 ${review.hasLiked ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
            <span className="font-medium">{review.likeCount}</span>
          </Button>

          {/* Bookmark button - T110: Add ARIA labels */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={`transition-all hover:bg-amber-50 hover:text-amber-700 ${
              review.hasBookmarked
                ? 'text-amber-700 bg-amber-50'
                : 'text-stone-600'
            }`}
            aria-label={`${review.hasBookmarked ? '북마크 취소' : '북마크 추가'}`}
            title={!isSignedIn ? '로그인이 필요합니다' : undefined}
          >
            <Bookmark
              className={`w-4 h-4 ${review.hasBookmarked ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
          </Button>
        </div>

        {/* Share button - T110: Add ARIA labels */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="transition-all hover:bg-stone-100 text-stone-600 hover:text-stone-900"
          aria-label="링크 공유"
        >
          <Share2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
});
