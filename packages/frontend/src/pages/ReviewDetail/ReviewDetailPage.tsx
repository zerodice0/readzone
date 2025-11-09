import { useEffect, useState } from 'react';
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
import { reviewsService } from '../../services/api/reviews';
import { likesService } from '../../services/api/likes';
import { bookmarksService } from '../../services/api/bookmarks';
import { Review } from '../../types/review';
import { Button } from '../../components/ui/button';

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local state for like/bookmark (independent from feed store)
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const loadReview = async (reviewId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await reviewsService.getReview(reviewId);
      const reviewData = response.data;
      setReview(reviewData);

      // Initialize like/bookmark states
      setIsLiked(reviewData.isLikedByMe ?? false);
      setLikeCount(reviewData.likeCount);
      setIsBookmarked(reviewData.isBookmarkedByMe ?? false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '독후감을 불러올 수 없습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id) {
        setError('잘못된 독후감 ID입니다');
        setIsLoading(false);
        return;
      }

      try {
        await loadReview(id);
      } catch {
        // Error already handled in loadReview
        if (!isMounted) {
          // Component unmounted, do nothing
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBack = (): void => {
    navigate('/feed');
  };

  const handleLike = (): void => {
    if (!review) return;

    // Optimistic update
    const prevIsLiked = isLiked;
    const prevLikeCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    likesService
      .toggleLike(review.id)
      .then((response) => {
        setIsLiked(response.data.isLiked);
        setLikeCount(response.data.likeCount);
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-alert, @typescript-eslint/no-unsafe-call
        alert('좋아요 처리에 실패했습니다. 다시 시도해주세요.');
        // eslint-disable-next-line no-console
        console.error('Toggle like failed:', err);
        // Rollback to previous state
        setIsLiked(prevIsLiked);
        setLikeCount(prevLikeCount);
      });
  };

  const handleBookmark = (): void => {
    if (!review) return;

    // Optimistic update
    const prevIsBookmarked = isBookmarked;
    setIsBookmarked(!isBookmarked);

    bookmarksService
      .toggleBookmark(review.id)
      .then((response) => {
        setIsBookmarked(response.data.isBookmarked);
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-alert, @typescript-eslint/no-unsafe-call
        alert('북마크 처리에 실패했습니다. 다시 시도해주세요.');
        // eslint-disable-next-line no-console
        console.error('Toggle bookmark failed:', err);
        // Rollback to previous state
        setIsBookmarked(prevIsBookmarked);
      });
  };

  const handleShare = (): void => {
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
          // eslint-disable-next-line no-alert, @typescript-eslint/no-unsafe-call
          alert('링크 복사에 실패했습니다');
          // eslint-disable-next-line no-console
          console.error('Share failed:', err);
        });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>독후감을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            독후감을 불러올 수 없습니다
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button
            onClick={() => {
              if (id) {
                loadReview(id).catch(() => {
                  // Error already handled in loadReview
                });
              }
            }}
          >
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  // No review data
  if (!review) {
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
      {/* Header with back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          피드로 돌아가기
        </Button>

        {/* User info */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={review.user.profileImage || '/default-avatar.png'}
            alt={`${review.user.name}의 프로필 사진`}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold">{review.user.name}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(review.publishedAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
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
        {review.rating !== null && (
          <span className="text-muted-foreground">⭐ {review.rating}/5</span>
        )}
      </div>

      {/* Book information section */}
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

      {/* Action buttons */}
      <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
        <Button
          variant="outline"
          onClick={handleLike}
          aria-label={isLiked ? '좋아요 취소' : '좋아요'}
        >
          <Heart
            className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current text-red-500' : ''}`}
          />
          <span className="sr-only">좋아요</span>
          {likeCount}
        </Button>
        <Button
          variant="outline"
          onClick={handleBookmark}
          aria-label={isBookmarked ? '북마크 취소' : '북마크'}
        >
          <Bookmark
            className={`w-4 h-4 ${isBookmarked ? 'fill-current text-blue-500' : ''}`}
          />
          <span className="sr-only">북마크</span>
        </Button>
        <Button variant="outline" onClick={handleShare} aria-label="링크 공유">
          <Share2 className="w-4 h-4" />
          <span className="sr-only">공유</span>
        </Button>
      </div>
    </div>
  );
}
