import { useCallback, useState } from 'react';
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
  Edit,
  Trash2,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useLoginPromptStore } from '../../stores/loginPromptStore';
import { LoginPrompt } from '../../components/LoginPrompt';
import { logError } from '../../utils/error';
import { toast } from '../../utils/toast';
import {
  pageVariants,
  fadeInUpVariants,
  scaleInVariants,
  modalVariants,
  backdropVariants,
} from '../../utils/animations';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Convex queries and mutations
  const review = useQuery(
    api.reviews.getDetail,
    id ? { id: id as Id<'reviews'>, userId: user?.id } : 'skip'
  ) as ReviewDetail | undefined;
  const toggleLike = useMutation(api.likes.toggle);
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const deleteReview = useMutation(api.reviews.remove);

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
      toast.error('좋아요 처리에 실패했습니다', '다시 시도해주세요.');
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

    void toggleBookmark({ reviewId: id as Id<'reviews'> }).catch(
      (err: unknown) => {
        toast.error('북마크 처리에 실패했습니다', '다시 시도해주세요.');
        logError(err, 'Toggle bookmark failed');
      }
    );
  }, [review, id, isSignedIn, showLoginPrompt, toggleBookmark]);

  const handleShare = useCallback((): void => {
    // Check if clipboard API is available
    if (
      typeof navigator !== 'undefined' &&
      'clipboard' in navigator &&
      typeof window !== 'undefined'
    ) {
      const href = (window as Window).location.href;
      void navigator.clipboard
        .writeText(href)
        .then(() => {
          toast.success('링크가 복사되었습니다');
        })
        .catch((err: unknown) => {
          toast.error('링크 복사에 실패했습니다');
          logError(err, 'Share failed');
        });
    }
  }, []);

  const handleEdit = useCallback((): void => {
    if (id) {
      navigate(`/reviews/${id}/edit`);
    }
  }, [id, navigate]);

  const handleDelete = useCallback((): void => {
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback((): void => {
    if (!id) return;

    void deleteReview({ id: id as Id<'reviews'> })
      .then(() => {
        navigate('/feed');
      })
      .catch((err: unknown) => {
        toast.error('독후감 삭제에 실패했습니다', '다시 시도해주세요.');
        logError(err, 'Delete review failed');
        setShowDeleteModal(false);
      });
  }, [id, deleteReview, navigate]);

  // Loading state
  if (review === undefined) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin mr-2 text-primary-500" />
          <span className="text-stone-700">독후감을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // No review data
  if (!review || !id) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
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
          <Button
            onClick={handleBack}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            피드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* T108: Login prompt for unauthenticated users */}
      <LoginPrompt />

      <m.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl"
      >
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
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                {review.userId.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-stone-900">
                  사용자 {review.userId.slice(-4)}
                </p>
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

            {/* Edit/Delete buttons (only for author) */}
            {user && review.userId === user.id && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  수정
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Review title */}
        {review.title && (
          <m.h1
            variants={fadeInUpVariants}
            initial="hidden"
            animate="visible"
            className="text-2xl sm:text-3xl font-bold mb-6 text-stone-900"
          >
            {review.title}
          </m.h1>
        )}

        {/* Full review content */}
        <m.div
          variants={fadeInUpVariants}
          initial="hidden"
          animate="visible"
          className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 mb-8 shadow-sm"
        >
          <p className="whitespace-pre-wrap text-base leading-relaxed text-stone-700">
            {review.content}
          </p>
        </m.div>

        {/* Recommend status and rating */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {review.isRecommended ? (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-sm py-1.5 px-3"
            >
              <ThumbsUp className="w-4 h-4 mr-1.5" />
              추천
            </Badge>
          ) : (
            <Badge
              variant="destructive"
              className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200 text-sm py-1.5 px-3"
            >
              <ThumbsDown className="w-4 h-4 mr-1.5" />
              비추천
            </Badge>
          )}
        </div>

        {/* Book information section */}
        {review.book && (
          <m.div
            variants={scaleInVariants}
            initial="hidden"
            animate="visible"
            className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 mb-8 shadow-sm"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-6 text-stone-900">
              책 정보
            </h2>
            <div className="flex gap-6 flex-col sm:flex-row">
              <img
                src={review.book.coverImageUrl || '/placeholder-book.svg'}
                alt={`${review.book.title} 표지`}
                className="w-24 h-32 sm:w-32 sm:h-44 object-cover rounded-lg shadow-md ring-1 ring-stone-200 self-start"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-book.svg';
                }}
              />
              <div className="flex-1">
                <h3 className="font-serif text-base sm:text-lg font-bold mb-2 text-stone-900">
                  {review.book.title}
                </h3>
                <p className="text-sm text-stone-600 mb-4">
                  {review.book.author}
                </p>
              </div>
            </div>
          </m.div>
        )}

        {/* Action buttons */}
        <m.div
          variants={fadeInUpVariants}
          initial="hidden"
          animate="visible"
          className="flex gap-3 justify-center sm:justify-start flex-wrap"
        >
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
              review.hasBookmarked
                ? 'text-amber-700 bg-amber-50'
                : 'text-stone-600'
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
        </m.div>
      </m.div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <m.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <m.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    독후감 삭제
                  </h3>
                  <p className="text-sm text-stone-600">
                    정말로 이 독후감을 삭제하시겠습니까?
                    <br />
                    삭제된 독후감은 복구할 수 없습니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  삭제
                </Button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
