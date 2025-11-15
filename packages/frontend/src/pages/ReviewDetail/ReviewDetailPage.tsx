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
  Star,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useLoginPromptStore } from '../../stores/loginPromptStore';
import { LoginPrompt } from '../../components/LoginPrompt';
import { logError } from '../../utils/error';
import type { Id } from 'convex/_generated/dataModel';

interface ReviewDetail {
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
}

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { show: showLoginPrompt } = useLoginPromptStore();

  // Convex queries and mutations
  const review = useQuery(
    api.reviews.getDetail,
    id ? { id: id as Id<'reviews'>, userId: user?.id } : 'skip'
  ) as ReviewDetail | undefined;
  const toggleLike = useMutation(api.likes.toggle) as (args: { reviewId: Id<'reviews'> }) => Promise<void>;
  const toggleBookmark = useMutation(api.bookmarks.toggle) as (args: { reviewId: Id<'reviews'> }) => Promise<void>;

  const handleBack = useCallback((): void => {
    navigate('/feed');
  }, [navigate]);

  const handleLike = useCallback((): void => {
    if (!review || !id) return;

    // T108: Check authentication before allowing like
    if (!isSignedIn) {
      showLoginPrompt('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    void toggleLike({ reviewId: id as Id<'reviews'> }).catch((err: unknown) => {
      // eslint-disable-next-line no-alert
      alert('좋아요 처리에 실패했습니다. 다시 시도해주세요.');
      logError(err, 'Toggle like failed');
    });
  }, [review, id, isSignedIn, showLoginPrompt, toggleLike]);

  const handleBookmark = useCallback((): void => {
    if (!review || !id) return;

    // T108: Check authentication before allowing bookmark
    if (!isSignedIn) {
      showLoginPrompt('북마크를 추가하려면 로그인이 필요합니다.');
      return;
    }

    void toggleBookmark({ reviewId: id as Id<'reviews'> }).catch((err: unknown) => {
      // eslint-disable-next-line no-alert
      alert('북마크 처리에 실패했습니다. 다시 시도해주세요.');
      logError(err, 'Toggle bookmark failed');
    });
  }, [review, id, isSignedIn, showLoginPrompt, toggleBookmark]);

  const handleShare = useCallback((): void => {
    // Check if clipboard API is available
    if (
      typeof navigator !== 'undefined' &&
      'clipboard' in navigator &&
      typeof window !== 'undefined'
    ) {
      const href = (window as Window).location.href;
      void (navigator as Navigator).clipboard
        .writeText(href)
        .then(() => {
          // eslint-disable-next-line no-alert
          (alert as (message: string) => void)('링크가 복사되었습니다');
        })
        .catch((err: unknown) => {
          // eslint-disable-next-line no-alert
          (alert as (message: string) => void)('링크 복사에 실패했습니다');
          logError(err, 'Share failed');
        });
    }
  }, []);

  // Loading state
  if (review === undefined) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin mr-2 text-primary-500" />
          <span className="text-stone-700">독후감을 불러오는 중...</span>
        </div>
      </main>
    );
  }

  // No review data
  if (!review || !id) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-stone-900">
            독후감을 찾을 수 없습니다
          </h2>
          <p className="text-stone-600 mb-8">
            요청하신 독후감이 존재하지 않거나 삭제되었습니다
          </p>
          <Button onClick={handleBack} className="bg-primary-500 hover:bg-primary-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            피드로 돌아가기
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* T108: Login prompt for unauthenticated users */}
      <LoginPrompt />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
      {/* Header with back button */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-6 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          피드로 돌아가기
        </Button>

        {/* User info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
            {review.userId.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-stone-900">사용자 {review.userId.slice(-4)}</p>
            <p className="text-sm text-stone-600">
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-stone-900">{review.title}</h1>
      )}

      {/* Full review content */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-stone-700">
          {review.content}
        </p>
      </div>

      {/* Recommend status and rating */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        {review.isRecommended ? (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-sm py-1.5 px-3">
            <ThumbsUp className="w-4 h-4 mr-1.5" />
            추천
          </Badge>
        ) : (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200 text-sm py-1.5 px-3">
            <ThumbsDown className="w-4 h-4 mr-1.5" />
            비추천
          </Badge>
        )}
        {review.rating !== undefined && review.rating !== null && (
          <Badge variant="secondary" className="bg-amber-50 text-amber-900 border-amber-200 text-sm py-1.5 px-3">
            <Star className="w-4 h-4 mr-1.5 fill-amber-400 text-amber-400" />
            {review.rating}/5
          </Badge>
        )}
      </div>

      {/* Book information section */}
      {review.book && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold mb-6 text-stone-900">책 정보</h2>
          <div className="flex gap-6 flex-col sm:flex-row">
            <img
              src={review.book.coverImageUrl || '/placeholder-book.png'}
              alt={`${review.book.title} 표지`}
              className="w-24 h-32 sm:w-32 sm:h-44 object-cover rounded-lg shadow-md ring-1 ring-stone-200 self-start"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-book.png';
              }}
            />
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold mb-2 text-stone-900">
                {review.book.title}
              </h3>
              <p className="text-sm text-stone-600 mb-4">
                {review.book.author}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 justify-center sm:justify-start flex-wrap">
        <Button
          variant="ghost"
          size="default"
          onClick={() => handleLike()}
          aria-label={review.hasLiked ? '좋아요 취소' : '좋아요'}
          className={`transition-all hover:bg-red-50 hover:text-red-600 ${
            review.hasLiked ? 'text-red-600 bg-red-50' : 'text-stone-600'
          }`}
          title={!isSignedIn ? '로그인이 필요합니다' : undefined}
        >
          <Heart
            className={`w-4 h-4 mr-2 ${review.hasLiked ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
          <span className="font-medium">{review.likeCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="default"
          onClick={() => handleBookmark()}
          aria-label={review.hasBookmarked ? '북마크 취소' : '북마크 추가'}
          className={`transition-all hover:bg-amber-50 hover:text-amber-700 ${
            review.hasBookmarked ? 'text-amber-700 bg-amber-50' : 'text-stone-600'
          }`}
          title={!isSignedIn ? '로그인이 필요합니다' : undefined}
        >
          <Bookmark
            className={`w-4 h-4 ${review.hasBookmarked ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
        </Button>
        <Button
          variant="ghost"
          size="default"
          onClick={() => handleShare()}
          aria-label="링크 공유"
          className="transition-all hover:bg-stone-100 text-stone-600 hover:text-stone-900"
        >
          <Share2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
      </main>
    </>
  );
}
