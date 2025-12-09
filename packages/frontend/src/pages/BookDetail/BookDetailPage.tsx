import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  PenSquare,
  Book as BookIcon,
  ShoppingCart,
  Tablet,
  ExternalLink,
} from 'lucide-react';
import { api } from 'convex/_generated/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useLoginPromptStore } from '../../stores/loginPromptStore';
import { LoginPrompt } from '../../components/LoginPrompt';
import type { Id } from 'convex/_generated/dataModel';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { show: showLoginPrompt } = useLoginPromptStore();

  // Fetch book data
  const book = useQuery(api.books.get, id ? { id: id as Id<'books'> } : 'skip');

  // Fetch reviews for this book
  const reviews = useQuery(
    api.reviews.listByBook,
    id ? { bookId: id as Id<'books'>, status: 'PUBLISHED' } : 'skip'
  );

  const isLoading = book === undefined || reviews === undefined;

  // Calculate stats
  const reviewCount = reviews?.length || 0;
  const recommendedCount = reviews?.filter((r) => r.isRecommended).length || 0;
  const recommendationRate =
    reviewCount > 0 ? (recommendedCount / reviewCount) * 100 : 0;

  const handleWriteReview = () => {
    if (!isSignedIn) {
      showLoginPrompt('독후감을 작성하려면 로그인이 필요합니다.');
      return;
    }
    navigate('/reviews/new');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mr-2" />
          <span className="text-stone-700">책 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // Book not found
  if (!book || !id) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-stone-900">
            책을 찾을 수 없습니다
          </h2>
          <p className="text-stone-600 mb-8">
            요청하신 책이 존재하지 않거나 삭제되었습니다
          </p>
          <Button
            onClick={() => navigate('/books')}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />책 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const publishYear = book.publishedDate
    ? new Date(book.publishedDate).getFullYear()
    : null;

  return (
    <>
      <LoginPrompt />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/books')}
          className="mb-6 text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />책 목록으로 돌아가기
        </Button>

        {/* Book info section */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex gap-6 flex-col sm:flex-row">
            {/* Book cover */}
            <div className="w-40 h-56 sm:w-48 sm:h-64 flex-shrink-0 mx-auto sm:mx-0">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={`${book.title} 표지`}
                  className="w-full h-full object-cover rounded-lg shadow-lg ring-1 ring-stone-200"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-stone-100 rounded-lg flex items-center justify-center">
                  <BookIcon className="w-20 h-20 text-stone-300" />
                </div>
              )}
            </div>

            {/* Book details */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
                {book.title}
              </h1>
              <p className="text-lg text-stone-600 mb-4">{book.author}</p>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 text-sm text-stone-600 mb-6">
                {book.publisher && (
                  <span className="bg-stone-100 px-3 py-1 rounded-full">
                    {book.publisher}
                  </span>
                )}
                {publishYear && (
                  <span className="bg-stone-100 px-3 py-1 rounded-full">
                    {publishYear}년
                  </span>
                )}
                {book.pageCount && (
                  <span className="bg-stone-100 px-3 py-1 rounded-full">
                    {book.pageCount}쪽
                  </span>
                )}
              </div>

              {/* Description */}
              {book.description && (
                <p className="text-stone-700 leading-relaxed mb-6">
                  {book.description}
                </p>
              )}

              {/* 알라딘 구매 버튼 */}
              {book.aladinUrl && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {/* 종이책 구매 버튼 */}
                  <Button
                    asChild
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700 gap-2"
                  >
                    <a
                      href={book.aladinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      종이책 구매
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </a>
                  </Button>

                  {/* 전자책 구매 버튼 (있는 경우만) */}
                  {book.ebookUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 gap-2"
                    >
                      <a
                        href={book.ebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Tablet className="w-4 h-4" />
                        전자책 구매
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {/* Write review CTA */}
              <Button
                onClick={handleWriteReview}
                className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 gap-2"
              >
                <PenSquare className="w-4 h-4" />이 책의 독후감 작성하기
              </Button>
            </div>
          </div>
        </div>

        {/* Review statistics */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-stone-900">
            리뷰 통계
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Review count */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="w-8 h-8 text-primary-500" />
              </div>
              <p className="text-2xl font-bold text-stone-900">{reviewCount}</p>
              <p className="text-sm text-stone-600">독후감 수</p>
            </div>

            {/* Recommended */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <ThumbsUp className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-stone-900">
                {recommendationRate > 0 ? Math.round(recommendationRate) : 0}%
              </p>
              <p className="text-sm text-stone-600">추천 비율</p>
            </div>

            {/* Not recommended */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <ThumbsDown className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-stone-900">
                {reviewCount - recommendedCount}
              </p>
              <p className="text-sm text-stone-600">비추천 수</p>
            </div>
          </div>
        </div>

        {/* Reviews list */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-stone-900">
            독후감 ({reviewCount})
          </h2>

          {reviewCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-stone-600 mb-4">
                아직 작성된 독후감이 없습니다
              </p>
              <Button
                onClick={handleWriteReview}
                variant="outline"
                className="gap-2"
              >
                <PenSquare className="w-4 h-4" />첫 번째 독후감 작성하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Link
                  key={review._id}
                  to={`/reviews/${review._id}`}
                  className="block border border-stone-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {review.title && (
                        <h3 className="font-semibold text-stone-900 mb-1">
                          {review.title}
                        </h3>
                      )}
                      <p className="text-sm text-stone-600 line-clamp-2">
                        {review.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {review.isRecommended ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          추천
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          비추천
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-stone-500">
                    {review.author?.imageUrl && (
                      <img
                        src={review.author.imageUrl}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span>
                      {review.author?.name ??
                        `사용자 ${review.userId.slice(-4)}`}
                    </span>
                    {review.publishedAt && (
                      <span>
                        {new Date(review.publishedAt).toLocaleDateString(
                          'ko-KR'
                        )}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
