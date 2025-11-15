import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { Button } from '../../components/ui/button';
import { useLoginPromptStore } from '../../stores/loginPromptStore';
import { LoginPrompt } from '../../components/LoginPrompt';
import { logError } from '../../utils/error';
import type { Id } from 'convex/_generated/dataModel';

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { show: showLoginPrompt } = useLoginPromptStore();

  // Convex queries and mutations
  const review = useQuery(
    api.reviews.getDetail,
    id ? { id: id as Id<'reviews'>, userId: user?.id } : 'skip'
  );
  const toggleLike = useMutation(api.likes.toggle);
  const toggleBookmark = useMutation(api.bookmarks.toggle);

  const handleBack = useCallback((): void => {
    navigate('/feed');
  }, [navigate]);

  const handleLike = useCallback(async (): Promise<void> => {
    if (!review || !id) return;

    // T108: Check authentication before allowing like
    if (!isSignedIn) {
      showLoginPrompt('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    try {
      await toggleLike({ reviewId: id as Id<'reviews'> });
    } catch (err: unknown) {
      alert('좋아요 처리에 실패했습니다. 다시 시도해주세요.');
      logError(err, 'Toggle like failed');
    }
  }, [review, id, isSignedIn, showLoginPrompt, toggleLike]);

  const handleBookmark = useCallback(async (): Promise<void> => {
    if (!review || !id) return;

    // T108: Check authentication before allowing bookmark
    if (!isSignedIn) {
      showLoginPrompt('북마크를 추가하려면 로그인이 필요합니다.');
      return;
    }

    try {
      await toggleBookmark({ reviewId: id as Id<'reviews'> });
    } catch (err: unknown) {
      alert('북마크 처리에 실패했습니다. 다시 시도해주세요.');
      logError(err, 'Toggle bookmark failed');
    }
  }, [review, id, isSignedIn, showLoginPrompt, toggleBookmark]);

  const handleShare = useCallback((): void => {
    // Check if clipboard API is available
    if (
      typeof navigator !== 'undefined' &&
      'clipboard' in navigator &&
      typeof window !== 'undefined'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      navigator.clipboard
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .writeText(window.location.href)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .then(() => {
          // eslint-disable-next-line no-alert, @typescript-eslint/no-unsafe-call
          alert('링크가 복사되었습니다');
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .catch((err: unknown) => {
          alert('링크 복사에 실패했습니다');
          logError(err, 'Share failed');
        });
    }
  }, []);

  // Loading state
  if (review === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>독후감을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // No review data
  if (!review || !id) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            독후감을 찾을 수 없습니다
          </h2>
          <Button onClick={handleBack}>피드로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* T108: Login prompt for unauthenticated users */}
      <LoginPrompt />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
      {/* Header with back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          피드로 돌아가기
        </Button>

        {/* User info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
            {review.userId.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">사용자 {review.userId.slice(-4)}</p>
            <p className="text-sm text-muted-foreground">
              {review.publishedAt
                ? new Date(review.publishedAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '발행 일자 미정'}
            </p>
          </div>
        </div>
      </div>

      {/* Review title */}
      {review.title && (
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">{review.title}</h1>
      )}

      {/* Full review content */}
      <div className="prose prose-slate max-w-none mb-8">
        <p className="whitespace-pre-wrap text-base leading-relaxed">
          {review.content}
        </p>
      </div>

      {/* Recommend status and rating */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        {review.isRecommended ? (
          <div className="flex items-center gap-2 text-green-600">
            <ThumbsUp className="w-5 h-5" />
            <span className="font-medium">추천</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <ThumbsDown className="w-5 h-5" />
            <span className="font-medium">비추천</span>
          </div>
        )}
        {review.rating !== undefined && review.rating !== null && (
          <span className="text-muted-foreground">⭐ {review.rating}/5</span>
        )}
      </div>

      {/* Book information section */}
      {review.book && (
        <div className="border rounded-lg p-4 sm:p-6 mb-8 bg-muted/50">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">책 정보</h2>
          <div className="flex gap-4 flex-col sm:flex-row">
            <img
              src={review.book.coverImageUrl || '/placeholder-book.png'}
              alt={`${review.book.title} 표지`}
              className="w-24 h-32 sm:w-32 sm:h-44 object-cover rounded shadow self-start"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-book.png';
              }}
            />
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold mb-2">
                {review.book.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {review.book.author}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
        <Button
          variant="outline"
          onClick={handleLike}
          aria-label={review.hasLiked ? '좋아요 취소' : '좋아요'}
        >
          <Heart
            className={`w-4 h-4 mr-2 ${review.hasLiked ? 'fill-current text-red-500' : ''}`}
          />
          <span className="sr-only">좋아요</span>
          {review.likeCount}
        </Button>
        <Button
          variant="outline"
          onClick={handleBookmark}
          aria-label={review.hasBookmarked ? '북마크 취소' : '북마크'}
        >
          <Bookmark
            className={`w-4 h-4 ${review.hasBookmarked ? 'fill-current text-blue-500' : ''}`}
          />
          <span className="sr-only">북마크</span>
        </Button>
        <Button variant="outline" onClick={handleShare} aria-label="링크 공유">
          <Share2 className="w-4 h-4" />
          <span className="sr-only">공유</span>
        </Button>
      </div>
      </div>
    </>
  );
}
