import { useState, useCallback, useMemo, memo } from 'react';
import { m, useMotionValue, useTransform } from 'framer-motion';
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
import { toast } from '../../utils/toast';
import { likeVariants, bookmarkVariants } from '../../utils/animations';

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

  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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
        toast.error('좋아요 처리에 실패했습니다');
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
        toast.error('북마크 처리에 실패했습니다');
      });
    },
    [toggleBookmark, review._id, isSignedIn, showLoginPrompt]
  );

  const handleShare = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      const origin = (window as Window).location.origin;
      const url = `${origin}/reviews/${String(review._id)}`;
      void navigator.clipboard.writeText(url).then(() => {
        toast.success('링크가 복사되었습니다');
      });
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
    <m.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
    >
      <Card
        role="article"
        aria-labelledby={`review-${review._id}-title`}
        aria-describedby={`review-${review._id}-content`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="cursor-pointer w-full bg-white border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background overflow-hidden relative group"
        onClick={handleCardClick}
        style={{
          boxShadow:
            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Warm gradient glow - appears on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.08) 0%, transparent 70%)',
          }}
        />

        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="flex flex-col sm:flex-row gap-4 sm:gap-6 space-y-0 p-6 relative z-10">
          {/* Book cover with 3D effect */}
          <m.div
            className="shrink-0 self-center sm:self-start"
            whileHover={{
              rotateY: 5,
              rotateX: -5,
              scale: 1.05,
              transition: { duration: 0.3 },
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <picture>
              <source
                srcSet={
                  imageError || !review.book?.coverImageUrl
                    ? '/placeholder-book.svg'
                    : `${review.book.coverImageUrl}?format=webp`
                }
                type="image/webp"
              />
              <img
                src={
                  imageError || !review.book?.coverImageUrl
                    ? '/placeholder-book.svg'
                    : review.book.coverImageUrl
                }
                srcSet={
                  !imageError && review.book?.coverImageUrl
                    ? `${review.book.coverImageUrl}?w=96 96w, ${review.book.coverImageUrl}?w=192 192w, ${review.book.coverImageUrl}?w=288 288w`
                    : undefined
                }
                sizes="(max-width: 640px) 96px, 128px"
                alt={`${review.book?.title || '책'} 표지`}
                className="w-24 h-32 sm:w-32 sm:h-44 object-cover rounded-lg shadow-lg ring-1 ring-stone-200 transition-all"
                loading="lazy"
                onError={() => setImageError(true)}
                style={{
                  boxShadow:
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                }}
              />
            </picture>
          </m.div>

          <div className="flex-1 text-center sm:text-left">
            {/* User info */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                {review.userId.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  사용자 {review.userId.slice(-4)}
                </p>
                <p className="text-xs text-muted-foreground">{displayTime}</p>
              </div>
            </div>

            {/* Book title - Serif font for elegance */}
            <h3
              id={`review-${review._id}-title`}
              className="font-serif font-bold text-xl sm:text-2xl mb-1 text-stone-900 leading-tight group-hover:text-primary-700 transition-colors duration-300"
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

        <CardContent className="px-6 pb-4 pt-0 relative z-10">
          {/* Review excerpt */}
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
                className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm"
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                추천
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-sm"
              >
                <ThumbsDown className="w-3 h-3 mr-1" />
                비추천
              </Badge>
            )}
            {review.rating && (
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-amber-400 to-amber-500 text-white border-0 shadow-sm"
              >
                <Star className="w-3 h-3 mr-1 fill-white text-white" />
                {review.rating}/5
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap justify-between items-center gap-2 px-6 py-4 bg-gradient-to-b from-stone-50/80 to-stone-100/50 border-t border-stone-100 relative z-10">
          <div className="flex gap-2">
            {/* Like button with heart animation */}
            <m.div
              variants={likeVariants}
              initial="rest"
              animate={review.hasLiked ? 'liked' : 'rest'}
            >
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
            </m.div>

            {/* Bookmark button with bounce animation */}
            <m.div
              variants={bookmarkVariants}
              initial="rest"
              animate={review.hasBookmarked ? 'bookmarked' : 'rest'}
            >
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
            </m.div>
          </div>

          {/* Share button */}
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
    </m.div>
  );
});
