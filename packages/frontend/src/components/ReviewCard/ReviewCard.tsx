import { useState, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import {
  Heart,
  Bookmark,
  Share2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import type { Review } from '../../types/review';
import { useFeedStore } from '../../stores/feedStore';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '../../lib/auth-context';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = memo(function ReviewCard({ review }: ReviewCardProps) {
  const navigate = useNavigate();
  const toggleLike = useFeedStore((state) => state.toggleLike);
  const toggleBookmark = useFeedStore((state) => state.toggleBookmark);
  const [imageError, setImageError] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/reviews/${review.id}`);
  }, [navigate, review.id]);

  // T111: Keyboard navigation support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/reviews/${review.id}`);
    }
  }, [navigate, review.id]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    void toggleLike(review.id);
  }, [toggleLike, review.id]);

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    void toggleBookmark(review.id);
  }, [toggleBookmark, review.id]);

  const handleShare = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    const url = `${window.location.origin}/reviews/${review.id}`;
    void navigator.clipboard.writeText(url);
    // TODO: Replace with toast notification
    // eslint-disable-next-line no-alert
    alert('링크가 복사되었습니다');
  }, [review.id]);

  const displayTime = useMemo(() => {
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
      aria-labelledby={`review-${review.id}-title`}
      aria-describedby={`review-${review.id}-content`}
      // T111: Keyboard navigation
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] w-full max-w-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-col sm:flex-row gap-4 space-y-0 p-4 sm:p-6">
        {/* Book cover */}
        <div className="shrink-0 self-center sm:self-start">
          {/* T109: Image optimization with WebP and responsive images */}
          <picture>
            <source
              srcSet={
                imageError
                  ? '/placeholder-book.webp'
                  : `${review.book.coverImageUrl}?format=webp`
              }
              type="image/webp"
            />
            <img
              src={
                imageError
                  ? '/placeholder-book.png'
                  : review.book.coverImageUrl || '/placeholder-book.png'
              }
              srcSet={
                !imageError && review.book.coverImageUrl
                  ? `${review.book.coverImageUrl}?w=80 80w, ${review.book.coverImageUrl}?w=160 160w, ${review.book.coverImageUrl}?w=240 240w`
                  : undefined
              }
              sizes="(max-width: 640px) 80px, 160px"
              alt={`${review.book.title} 표지`}
              className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded shadow-sm transition-transform hover:scale-105"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </picture>
        </div>

        <div className="flex-1 text-center sm:text-left">
          {/* User info */}
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <img
              src={review.user.profileImage || '/default-avatar.png'}
              alt={review.user.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="font-semibold text-sm">{review.user.name}</p>
              <p className="text-xs text-muted-foreground">{displayTime}</p>
            </div>
          </div>

          {/* Book title and author - T110: Add IDs for ARIA */}
          <h3
            id={`review-${review.id}-title`}
            className="font-bold text-lg sm:text-xl mb-1"
          >
            {review.book.title}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-2">
            {review.book.author}
          </p>

          {/* Review title */}
          {review.title && (
            <h4 className="font-semibold text-md mb-2">{review.title}</h4>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* Review excerpt - T110: Add ID for ARIA */}
        <p
          id={`review-${review.id}-content`}
          className="text-sm text-foreground line-clamp-3 mb-2"
        >
          {review.content.length > 150
            ? review.content.substring(0, 150) + '...'
            : review.content}
        </p>

        {/* Recommend status */}
        <div className="flex items-center gap-1 text-sm">
          {review.isRecommended ? (
            <>
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">추천</span>
            </>
          ) : (
            <>
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium">비추천</span>
            </>
          )}
          {review.rating && (
            <span className="ml-2 text-muted-foreground">
              ⭐ {review.rating}/5
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap justify-between items-center gap-2 p-4 sm:p-6">
        <div className="flex gap-2">
          {/* Like button - T110: Add ARIA labels */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`transition-colors hover:bg-accent hover:text-accent-foreground ${review.isLikedByMe ? 'text-red-500' : ''}`}
            aria-label={`${review.isLikedByMe ? '좋아요 취소' : '좋아요'} (${review.likeCount}개)`}
            title={!isAuthenticated ? '로그인이 필요합니다' : undefined}
          >
            <Heart
              className={`w-4 h-4 mr-1 ${review.isLikedByMe ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
            <span>{review.likeCount}</span>
          </Button>

          {/* Bookmark button - T110: Add ARIA labels */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={`transition-colors hover:bg-accent hover:text-accent-foreground ${review.isBookmarkedByMe ? 'text-blue-500' : ''}`}
            aria-label={`${review.isBookmarkedByMe ? '북마크 취소' : '북마크 추가'}`}
            title={!isAuthenticated ? '로그인이 필요합니다' : undefined}
          >
            <Bookmark
              className={`w-4 h-4 ${review.isBookmarkedByMe ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
          </Button>
        </div>

        {/* Share button - T110: Add ARIA labels */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="링크 공유"
        >
          <Share2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
});
