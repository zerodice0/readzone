import { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  ShoppingCart,
  Tablet,
  ExternalLink,
  BookOpen,
  Calendar,
  Building2,
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
import { extractMiddleCategory } from '../../utils/category';
import { decodeHtmlEntities } from '../../utils/html';
import { useShare } from '../../hooks/useShare';
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
    aladinUrl?: string;
    ebookUrl?: string;
    reviewCount?: number;
    isbn?: string;
    category?: string;
    description?: string;
    publishedDate?: number;
    publisher?: string;
  } | null;
  author: {
    name?: string;
    imageUrl?: string;
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
  const incrementViewCount = useMutation(api.reviews.incrementViewCount);
  const { share } = useShare();
  const hasIncrementedViewCount = useRef(false);

  // Increment view count on page load (hybrid approach)
  // - Skip if user is viewing their own review
  // - Skip if already viewed in this session
  useEffect(() => {
    if (!review || !id || hasIncrementedViewCount.current) return;

    // Skip if this is the author viewing their own review
    if (user?.id && review.userId === user.id) {
      return;
    }

    // Check sessionStorage for duplicate prevention
    const viewedReviewsKey = 'geuldarak_viewed_reviews';
    const storedViews = sessionStorage.getItem(viewedReviewsKey);
    const viewedReviews = (
      storedViews ? JSON.parse(storedViews) : []
    ) as string[];

    if (viewedReviews.includes(id)) {
      return;
    }

    // Mark as incremented to prevent duplicate calls in StrictMode
    hasIncrementedViewCount.current = true;

    // Increment view count
    void incrementViewCount({ id: id as Id<'reviews'> })
      .then(() => {
        // Add to viewed list in sessionStorage
        const updatedViewed = [...viewedReviews, id];
        sessionStorage.setItem(viewedReviewsKey, JSON.stringify(updatedViewed));
      })
      .catch((err: unknown) => {
        // Reset flag on error so it can retry on next render
        hasIncrementedViewCount.current = false;
        logError(err, 'Increment view count failed');
      });
  }, [review, id, user?.id, incrementViewCount]);

  const handleBack = useCallback((): void => {
    void navigate('/feed');
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
    if (typeof window === 'undefined' || !review) return;

    const url = (window as Window).location.href;
    const title = review.title || '독후감';
    const bookTitle = review.book?.title || '책';

    void share({
      title,
      text: `${title} - "${bookTitle}"에 대한 독후감`,
      url,
    });
  }, [review, share]);

  const handleEdit = useCallback((): void => {
    if (id) {
      void navigate(`/reviews/${id}/edit`);
    }
  }, [id, navigate]);

  const handleDelete = useCallback((): void => {
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback((): void => {
    if (!id) return;

    void deleteReview({ id: id as Id<'reviews'> })
      .then(() => {
        void navigate('/feed');
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="text-stone-500 font-medium">
            독후감을 불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  // No review data
  if (!review || !id) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="paper-surface rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">
            독후감을 찾을 수 없습니다
          </h2>
          <p className="text-stone-500 mb-6">
            요청하신 독후감이 존재하지 않거나 삭제되었습니다.
          </p>
          <Button
            onClick={handleBack}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            피드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const book = review.book;
  const bookPublishYear = book?.publishedDate
    ? new Date(book.publishedDate).getFullYear()
    : null;
  const bookDescription = book?.description
    ? decodeHtmlEntities(book.description)
    : null;
  const bookCategory = book?.category
    ? extractMiddleCategory(book.category)
    : null;

  return (
    <div className="min-h-screen">
      {/* T108: Login prompt for unauthenticated users */}
      <LoginPrompt />

      <m.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between mb-8 sticky top-0 z-10 bg-[#fbf7ee]/80 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 -ml-2 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="font-medium">돌아가기</span>
          </Button>

          {/* Mobile Action Buttons (Edit/Delete) - visible only for author */}
          {user && review.userId === user.id && (
            <div className="sm:hidden flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              >
                <Edit className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content Area */}
          <main className="lg:col-span-8 space-y-8">
            {/* Header: Title & Author */}
            <header className="space-y-6">
              <div className="flex items-center gap-3 text-sm text-stone-500 font-medium">
                <span className="bg-stone-100 px-2 py-1 rounded-md text-stone-600">
                  {review.publishedAt
                    ? new Date(review.publishedAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '임시저장'}
                </span>
                {review.isRecommended ? (
                  <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <ThumbsUp className="w-3.5 h-3.5 mr-1" /> 추천
                  </span>
                ) : (
                  <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-md">
                    <ThumbsDown className="w-3.5 h-3.5 mr-1" /> 비추천
                  </span>
                )}
              </div>

              {review.title && (
                <m.h1
                  variants={fadeInUpVariants}
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight tracking-tight font-serif"
                >
                  {review.title}
                </m.h1>
              )}

              <div className="flex items-center justify-between border-b border-stone-200 pb-6">
                <div className="flex items-center gap-4">
                  {review.author?.imageUrl ? (
                    <img
                      src={review.author.imageUrl}
                      alt={review.author.name || '작성자'}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-stone-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg ring-2 ring-stone-100">
                      {(review.author?.name || review.userId)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-stone-900 text-lg">
                      {review.author?.name ||
                        `사용자 ${review.userId.slice(-4)}`}
                    </p>
                    <p className="text-sm text-stone-500">
                      View {review.viewCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Desktop Action Buttons (Edit/Delete) */}
                {user && review.userId === user.id && (
                  <div className="hidden sm:flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      className="text-stone-600 hover:text-primary-600 hover:border-primary-200"
                    >
                      <Edit className="w-4 h-4 mr-1.5" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      className="text-stone-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      삭제
                    </Button>
                  </div>
                )}
              </div>
            </header>

            {/* Review Content */}
            <m.article
              variants={fadeInUpVariants}
              className="prose prose-stone prose-lg max-w-none"
            >
              <div className="whitespace-pre-wrap leading-relaxed text-stone-800 font-serif">
                {review.content}
              </div>
            </m.article>

            {/* Interaction Bar */}
            <div className="flex items-center justify-center gap-6 py-8 border-t border-stone-200 mt-12">
              <Button
                variant="ghost"
                size="lg"
                onClick={handleLike}
                className={`flex flex-col gap-1 h-auto py-3 px-6 rounded-xl transition-all duration-300 ${
                  review.hasLiked
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Heart
                  className={`w-8 h-8 ${review.hasLiked ? 'fill-current' : ''}`}
                />
                <span className="text-xs font-medium">{review.likeCount}</span>
              </Button>

              <div className="w-px h-12 bg-stone-200" />

              <Button
                variant="ghost"
                size="lg"
                onClick={handleBookmark}
                className={`flex flex-col gap-1 h-auto py-3 px-6 rounded-xl transition-all duration-300 ${
                  review.hasBookmarked
                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Bookmark
                  className={`w-8 h-8 ${review.hasBookmarked ? 'fill-current' : ''}`}
                />
                <span className="text-xs font-medium">저장</span>
              </Button>

              <div className="w-px h-12 bg-stone-200" />

              <Button
                variant="ghost"
                size="lg"
                onClick={handleShare}
                className="flex flex-col gap-1 h-auto py-3 px-6 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-primary-600 transition-all duration-300"
              >
                <Share2 className="w-8 h-8" />
                <span className="text-xs font-medium">공유</span>
              </Button>
            </div>
          </main>

          {/* Sidebar: Book Info */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {book && (
                <m.div
                  variants={scaleInVariants}
                  initial="hidden"
                  animate="visible"
                  className="paper-surface rounded-3xl overflow-hidden"
                >
                  <div className="ink-panel relative min-h-72 overflow-hidden flex items-center justify-center p-8">
                    {book.coverImageUrl && (
                      <div
                        className="absolute inset-0 opacity-30 blur-xl scale-110"
                        style={{
                          backgroundImage: `url(${book.coverImageUrl})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }}
                        aria-hidden="true"
                      />
                    )}

                    <div className="relative z-10">
                      <Link
                        to={`/books/${book._id}`}
                        className="block relative group"
                      >
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                        <img
                          src={book.coverImageUrl || '/placeholder-book.svg'}
                          alt={`${book.title} 표지`}
                          className="book-paper-frame w-40 h-auto rounded-lg transform group-hover:scale-[1.03] transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-book.svg';
                          }}
                        />
                      </Link>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-stone-900 mb-5">
                      책 정보
                    </h3>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {bookPublishYear && (
                        <Badge
                          variant="outline"
                          className="text-stone-500 border-stone-200"
                        >
                          {bookPublishYear}년
                        </Badge>
                      )}
                      {bookCategory && (
                        <Badge
                          variant="secondary"
                          className="bg-note-blue/10 text-note-blue border-note-blue/20"
                        >
                          {bookCategory}
                        </Badge>
                      )}
                    </div>

                    <div className="text-left">
                      <Link
                        to={`/books/${book._id}`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        <h4 className="font-bold text-2xl text-stone-900 mb-2 font-serif">
                          {book.title}
                        </h4>
                      </Link>
                      <p className="text-stone-600 mb-5 font-medium">
                        {book.author}
                      </p>

                      {(book.publisher || book.publishedDate) && (
                        <div className="grid grid-cols-1 gap-3 mb-5">
                          {book.publisher && (
                            <div className="flex items-center gap-2 text-stone-600">
                              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium">
                                {book.publisher}
                              </span>
                            </div>
                          )}
                          {book.publishedDate && (
                            <div className="flex items-center gap-2 text-stone-600">
                              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium">
                                {new Date(
                                  book.publishedDate
                                ).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {bookDescription && (
                        <p className="text-sm text-stone-600 leading-relaxed mb-5 line-clamp-3">
                          {bookDescription}
                        </p>
                      )}

                      {book.reviewCount !== undefined &&
                        book.reviewCount > 0 && (
                          <Link
                            to={`/books/${book._id}`}
                            className="block mb-5"
                          >
                            <Badge
                              variant="secondary"
                              className="hover:bg-stone-200 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3 mr-1" />이 책의 다른
                              리뷰 {book.reviewCount}개
                            </Badge>
                          </Link>
                        )}

                      <div className="w-full flex flex-wrap gap-3">
                        {book.aladinUrl && (
                          <Button
                            asChild
                            variant="outline"
                            className="border-stone-200 text-stone-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                          >
                            <a
                              href={book.aladinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              종이책
                              <ExternalLink className="w-3 h-3 ml-1.5 opacity-50" />
                            </a>
                          </Button>
                        )}
                        {book.ebookUrl && (
                          <Button
                            asChild
                            variant="outline"
                            className="border-stone-200 text-stone-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <a
                              href={book.ebookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Tablet className="w-4 h-4 mr-2" />
                              전자책
                              <ExternalLink className="w-3 h-3 ml-1.5 opacity-50" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
            </div>
          </aside>
        </div>
      </m.div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <m.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <m.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="paper-surface rounded-2xl p-6 sm:p-8 max-w-md w-full scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">
                  독후감을 삭제하시겠습니까?
                </h3>
                <p className="text-stone-500">
                  삭제된 독후감은 복구할 수 없습니다.
                  <br />
                  정말로 삭제하시겠습니까?
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-6 text-base"
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="flex-1 py-6 text-base bg-red-600 hover:bg-red-700"
                >
                  삭제하기
                </Button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
