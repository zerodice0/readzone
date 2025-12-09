import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  PenSquare,
  Book as BookIcon,
  ShoppingCart,
  Tablet,
  ExternalLink,
  Calendar,
  Building2,
  BookOpen,
} from 'lucide-react';
import { api } from 'convex/_generated/api';
import { m } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useLoginPromptStore } from '../../stores/loginPromptStore';
import { LoginPrompt } from '../../components/LoginPrompt';
import {
  pageVariants,
  fadeInUpVariants,
  scaleInVariants,
} from '../../utils/animations';
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
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="text-stone-500 font-medium">
            책 정보를 불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  // Book not found
  if (!book || !id) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-stone-100">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">
            책을 찾을 수 없습니다
          </h2>
          <p className="text-stone-500 mb-6">
            요청하신 책이 존재하지 않거나 삭제되었습니다.
          </p>
          <Button
            onClick={() => navigate('/books')}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
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
    <div className="min-h-screen bg-[#FAFAF9]">
      <LoginPrompt />

      <m.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between mb-8 sticky top-0 z-10 bg-[#FAFAF9]/80 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Button
            variant="ghost"
            onClick={() => navigate('/books')}
            className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 -ml-2 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="font-medium">책 목록으로 돌아가기</span>
          </Button>
        </nav>

        {/* Top Section: Book Info and Cover */}
        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8">
            {/* Left: Book Cover (with blurred background effect) */}
            <div className="md:col-span-5 lg:col-span-4 bg-stone-100 relative overflow-hidden flex items-center justify-center p-8 md:p-12 min-h-[400px]">
              {/* Blurred background image */}
              {book.coverImageUrl && (
                <div
                  className="absolute inset-0 opacity-20 blur-xl scale-110"
                  style={{
                    backgroundImage: `url(${book.coverImageUrl})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                  }}
                  aria-hidden="true"
                />
              )}

              <m.div
                variants={scaleInVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10"
              >
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={`${book.title} 표지`}
                    className="w-48 sm:w-56 h-auto shadow-2xl rounded-lg transform hover:scale-[1.02] transition-transform duration-500 ease-out"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-48 h-64 bg-white rounded-lg flex items-center justify-center shadow-lg">
                    <BookIcon className="w-16 h-16 text-stone-300" />
                  </div>
                )}
              </m.div>
            </div>

            {/* Right: Book Details */}
            <div className="md:col-span-7 lg:col-span-8 p-8 md:p-10 flex flex-col justify-center">
              <m.div variants={fadeInUpVariants}>
                {publishYear && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge
                      variant="outline"
                      className="text-stone-500 border-stone-200"
                    >
                      {publishYear}년
                    </Badge>
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-2 font-serif tracking-tight">
                  {book.title}
                </h1>
                <p className="text-xl text-stone-600 mb-8 font-medium">
                  {book.author}
                </p>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                        {new Date(book.publishedDate).toLocaleDateString(
                          'ko-KR'
                        )}
                      </span>
                    </div>
                  )}
                  {book.pageCount && (
                    <div className="flex items-center gap-2 text-stone-600">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">
                        {book.pageCount}쪽
                      </span>
                    </div>
                  )}
                </div>

                {book.description && (
                  <p className="text-stone-600 leading-relaxed mb-8 max-w-2xl line-clamp-3 hover:line-clamp-none transition-all duration-300">
                    {book.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    onClick={handleWriteReview}
                    size="lg"
                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200/50 hover:shadow-primary-300/50 transition-all"
                  >
                    <PenSquare className="w-4 h-4 mr-2" />
                    독후감 쓰기
                  </Button>

                  <div className="w-px h-8 bg-stone-200 mx-2 hidden sm:block" />

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
              </m.div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main: Reviews List */}
          <main className="lg:col-span-8 order-2 lg:order-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-900 font-serif">
                이 책의 독후감
                <span className="ml-2 text-lg text-primary-600 font-sans font-medium">
                  {reviewCount}
                </span>
              </h2>
              {reviewCount > 0 && (
                <Button
                  variant="ghost"
                  className="text-primary-600 hover:text-primary-700 p-0 hover:bg-transparent"
                >
                  전체보기 <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                </Button>
              )}
            </div>

            {reviewCount === 0 ? (
              <div className="bg-white border border-dashed border-stone-200 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenSquare className="w-6 h-6 text-stone-400" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  아직 작성된 독후감이 없습니다
                </h3>
                <p className="text-stone-500 mb-8 max-w-sm mx-auto">
                  이 책의 첫 번째 독자가 되어주세요! 당신의 감상을 나누면 더
                  많은 사람들이 이 책을 발견하게 될 거예요.
                </p>
                <Button
                  onClick={handleWriteReview}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  <PenSquare className="w-4 h-4 mr-2" />첫 독후감 남기기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <m.div
                    key={review._id}
                    variants={fadeInUpVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      to={`/reviews/${review._id}`}
                      className="group block bg-white border border-stone-100 rounded-xl p-5 sm:p-6 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-100 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                          {review.author?.imageUrl ? (
                            <img
                              src={review.author.imageUrl}
                              alt={review.author.name || 'user'}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] text-primary-700 font-bold">
                              {(review.author?.name || 'U').charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-stone-700">
                            {review.author?.name ??
                              `사용자 ${review.userId.slice(-4)}`}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span>
                            {new Date(
                              review.publishedAt || Date.now()
                            ).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        {review.isRecommended ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-50 text-green-700 hover:bg-green-100"
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" /> 추천
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            <ThumbsDown className="w-3 h-3 mr-1" /> 비추천
                          </Badge>
                        )}
                      </div>

                      {review.title && (
                        <h3 className="text-xl font-bold text-stone-900 mb-2 group-hover:text-primary-700 transition-colors font-serif">
                          {review.title}
                        </h3>
                      )}
                      <p className="text-stone-600 line-clamp-2 leading-relaxed mb-4">
                        {review.content}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                          조회 {review.viewCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                          좋아요 {review.likeCount ?? 0}
                        </span>
                      </div>
                    </Link>
                  </m.div>
                ))}
              </div>
            )}
          </main>

          {/* Sidebar: Stats */}
          <aside className="lg:col-span-4 order-1 lg:order-2">
            <div className="sticky top-24">
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm mb-6">
                <h3 className="text-lg font-bold text-stone-900 mb-6">
                  리뷰 분석
                </h3>

                <div className="text-center mb-8 pb-8 border-b border-stone-100">
                  <div className="text-5xl font-bold text-primary-600 mb-2 font-serif">
                    {recommendationRate > 0
                      ? Math.round(recommendationRate)
                      : 0}
                    <span className="text-2xl text-primary-400">%</span>
                  </div>
                  <p className="text-stone-500 text-sm font-medium">
                    이 책을 추천해요
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm">
                        <ThumbsUp className="w-4 h-4" />
                      </div>
                      <span className="text-stone-700 font-medium">추천</span>
                    </div>
                    <span className="text-lg font-bold text-stone-900">
                      {recommendedCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm">
                        <ThumbsDown className="w-4 h-4" />
                      </div>
                      <span className="text-stone-700 font-medium">비추천</span>
                    </div>
                    <span className="text-lg font-bold text-stone-900">
                      {reviewCount - recommendedCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 rounded-2xl p-6 text-center">
                <p className="text-primary-800 font-medium mb-4">
                  이 책을 읽고 계신가요?
                  <br />
                  여러분의 생각이 궁금해요!
                </p>
                <Button
                  onClick={handleWriteReview}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  독후감 쓰러 가기
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </m.div>
    </div>
  );
}
