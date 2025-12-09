import { useState, useCallback, useMemo, memo } from 'react';
import { m } from 'framer-motion';
import { Card, CardFooter } from '../ui/card';
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

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't navigate if clicking on buttons
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      navigate(`/reviews/${String(review._id)}`);
    },
    [navigate, review._id]
  );

  // Keyboard navigation support
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
    async (e: React.MouseEvent): Promise<void> => {
      e.stopPropagation();
      const url = `${window.location.origin}/reviews/${String(review._id)}`;

      // 1. 모바일에서 Web Share API 지원 시 네이티브 공유 UI 사용
      if (navigator.share) {
        try {
          await navigator.share({ url });
          return;
        } catch (err) {
          // 사용자가 취소한 경우 조용히 처리
          if ((err as Error).name === 'AbortError') return;
          // 그 외 에러는 clipboard fallback으로 진행
        }
      }

      // 2. Clipboard API 시도
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          toast.success('링크가 복사되었습니다');
          return;
        } catch {
          // Fallback으로 진행
        }
      }

      // 3. Legacy fallback (execCommand)
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (success) {
          toast.success('링크가 복사되었습니다');
        } else {
          toast.error('링크 복사에 실패했습니다');
        }
      } catch {
        toast.error('링크 복사에 실패했습니다');
      }
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        role="article"
        aria-labelledby={`review-${review._id}-title`}
        aria-describedby={`review-${review._id}-content`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="cursor-pointer w-full bg-white border-stone-200 hover:border-primary-200/50 hover:shadow-xl hover:shadow-primary-100/20 transition-all duration-300 overflow-hidden group h-full flex flex-col"
        onClick={handleCardClick}
      >
        <div className="p-5 flex gap-5 h-full">
          {/* Left Side: Book Cover (Hidden on very small screens if needed, but keeping for now) */}
          <div className="shrink-0">
            <div className="relative w-24 h-36 rounded-md overflow-hidden bg-stone-100 shadow-sm group-hover:shadow-md transition-shadow">
              {review.book?.coverImageUrl && !imageError ? (
                <img
                  src={review.book.coverImageUrl}
                  alt={review.book.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 font-bold bg-stone-50">
                  {(review.book?.title || '?').charAt(0)}
                </div>
              )}
              {/* Read Status Overlay */}
              {review.readStatus === 'READING' && (
                <div className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-[2px] py-1 text-[10px] text-white text-center font-medium">
                  읽는 중
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header: User & Time */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {review.author?.imageUrl ? (
                  <img
                    src={review.author.imageUrl}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-500">
                    {(review.author?.name || 'U').charAt(0)}
                  </div>
                )}
                <span className="text-xs font-medium text-stone-600 truncate max-w-[100px]">
                  {review.author?.name || `사용자 ${review.userId.slice(-4)}`}
                </span>
                <span className="text-[10px] text-stone-400">•</span>
                <span className="text-xs text-stone-400">{displayTime}</span>
              </div>

              {review.isRecommended ? (
                <Badge
                  variant="secondary"
                  className="bg-green-50 text-green-700 text-[10px] h-5 px-1.5 hover:bg-green-100 border-0"
                >
                  <ThumbsUp className="w-3 h-3 mr-1" /> 추천
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-red-50 text-red-700 text-[10px] h-5 px-1.5 hover:bg-red-100 border-0"
                >
                  <ThumbsDown className="w-3 h-3 mr-1" /> 비추천
                </Badge>
              )}
            </div>

            {/* Title */}
            {review.title && (
              <h3 className="font-serif font-bold text-lg text-stone-900 mb-1 leading-tight line-clamp-1 group-hover:text-primary-700 transition-colors">
                {review.title}
              </h3>
            )}

            {/* Book Title */}
            <p className="text-xs text-stone-500 mb-2 font-medium flex items-center gap-1">
              <span className="text-stone-400 font-normal">in</span>
              {review.book?.title || '알 수 없는 책'}
            </p>

            {/* Content Preview */}
            <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed mb-auto">
              {review.content}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <CardFooter className="px-5 py-3 border-t border-stone-50 bg-stone-50/30 flex items-center justify-between mt-auto">
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
            <span className="text-xs font-medium text-stone-500 min-w-[12px]">
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
                className={`h-8 w-8 rounded-full ${review.hasBookmarked ? 'text-amber-500 bg-amber-50' : 'text-stone-400 hover:text-amber-500 hover:bg-amber-50'}`}
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
        </CardFooter>
      </Card>
    </m.div>
  );
});
