import { useState, useCallback, useMemo, memo } from 'react';
import { m } from 'framer-motion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Heart, Bookmark, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';
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
import { useShare } from '../../hooks/useShare';

// Convex data structure from getFeed query
interface ReviewCardProps {
  review: {
    _id: Id<'reviews'>;
    _creationTime: number;
    userId: string;
    bookId: Id<'books'>;
    title?: string;
    content: string;
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
    author: {
      name?: string;
      imageUrl?: string;
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
  const { share } = useShare();

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't navigate if clicking on buttons
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      void navigate(`/reviews/${String(review._id)}`);
    },
    [navigate, review._id]
  );

  // Keyboard navigation support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void navigate(`/reviews/${String(review._id)}`);
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
      const url = `${window.location.origin}/reviews/${String(review._id)}`;
      const title = review.title || '독후감';
      const bookTitle = review.book?.title || '책';

      void share({
        title,
        text: `${title} - "${bookTitle}"에 대한 독후감`,
        url,
      });
    },
    [review._id, review.title, review.book?.title, share]
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

  const reviewTitleId = `review-${review._id}-title`;
  const reviewContentId = `review-${review._id}-content`;
  const articleLabel =
    review.title || `${review.book?.title || '알 수 없는 책'} 독후감`;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <article
        role="article"
        aria-labelledby={review.title ? reviewTitleId : undefined}
        aria-label={review.title ? undefined : articleLabel}
        aria-describedby={reviewContentId}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="group cursor-pointer border-b border-paper-200/70 bg-transparent transition-colors last:border-b-0 hover:bg-paper-50/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        onClick={handleCardClick}
      >
        <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
          {review.author?.imageUrl ? (
            <img
              src={review.author.imageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-paper-200"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-500 ring-1 ring-paper-200">
              {(review.author?.name || 'U').charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold text-stone-900">
                  {review.author?.name || `사용자 ${review.userId.slice(-4)}`}
                </span>
                <span className="block text-xs text-stone-500">
                  {displayTime}
                </span>
              </div>

              {review.isRecommended ? (
                <Badge
                  variant="secondary"
                  className="note-badge h-6 shrink-0 border-0 bg-ink-green/10 px-2 text-[11px] text-ink-green hover:bg-ink-green/20"
                >
                  <ThumbsUp className="w-3 h-3 mr-1" /> 추천
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="note-badge h-6 shrink-0 border-0 bg-note-red/10 px-2 text-[11px] text-note-red hover:bg-note-red/15"
                >
                  <ThumbsDown className="w-3 h-3 mr-1" /> 비추천
                </Badge>
              )}
            </div>

            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-paper-200/70 bg-white/62 p-2">
              <div className="book-paper-frame h-14 w-10 shrink-0 overflow-hidden rounded-md">
                {review.book?.coverImageUrl && !imageError ? (
                  <img
                    src={review.book.coverImageUrl}
                    alt={review.book.title}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-stone-50 text-xs font-bold text-stone-300">
                    {(review.book?.title || '?').charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-900">
                  {review.book?.title || '알 수 없는 책'}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {review.book?.author || '저자 정보 없음'}
                </p>
                {review.readStatus === 'READING' && (
                  <p className="mt-1 text-[11px] font-medium text-note-blue">
                    읽는 중
                  </p>
                )}
              </div>
            </div>

            {review.title && (
              <h2
                id={reviewTitleId}
                className="mb-1 text-lg font-bold leading-tight text-stone-950 transition-colors group-hover:text-primary-800"
              >
                {review.title}
              </h2>
            )}

            <p
              id={reviewContentId}
              className="mb-3 line-clamp-4 whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700"
            >
              {review.content}
            </p>

            <div className="flex items-center justify-between text-stone-500">
              <div className="flex items-center gap-1">
                <m.div
                  variants={likeVariants}
                  initial="rest"
                  animate={review.hasLiked ? 'liked' : 'rest'}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full ${review.hasLiked ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:text-red-500 hover:bg-red-50'}`}
                    onClick={handleLike}
                  >
                    <Heart
                      className={`w-4 h-4 ${review.hasLiked ? 'fill-current' : ''}`}
                    />
                  </Button>
                </m.div>
                <span className="min-w-4 text-xs font-medium">
                  {review.likeCount > 0 ? review.likeCount : ''}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <m.div
                  variants={bookmarkVariants}
                  initial="rest"
                  animate={review.hasBookmarked ? 'bookmarked' : 'rest'}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full ${review.hasBookmarked ? 'text-paper-700 bg-paper-100' : 'text-stone-400 hover:text-paper-700 hover:bg-paper-100'}`}
                    onClick={handleBookmark}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${review.hasBookmarked ? 'fill-current' : ''}`}
                    />
                  </Button>
                </m.div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-stone-400 hover:text-primary-600 hover:bg-primary-50"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </m.div>
  );
});
