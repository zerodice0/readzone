import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, NotebookPen } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { m } from 'framer-motion';
import { api } from 'convex/_generated/api';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { BookSearch } from '../../components/review/BookSearch';
import { ReviewForm } from '../../components/review/ReviewForm';
import { logError } from '../../utils/error';
import { toast } from '../../utils/toast';
import { pageVariants, fadeInUpVariants } from '../../utils/animations';
import { getUserNickname } from '../../utils/userDisplayName';
import { BookDiaryListView } from '../../components/diary/BookDiaryList';
import type { BookData } from '../../types/book';
import type { Id } from 'convex/_generated/dataModel';

interface ReviewFormData {
  title: string;
  content: string;
  isRecommended: boolean;
  readStatus: 'READING' | 'COMPLETED' | 'DROPPED';
}

export default function ReviewNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExistingReviewDialog, setShowExistingReviewDialog] =
    useState(false);
  const [hasHandledPreselectedBook, setHasHandledPreselectedBook] =
    useState(false);

  const createReview = useMutation(api.reviews.create);
  const bookIdParam = searchParams.get('bookId');
  const validBookIdParam =
    bookIdParam && /^[a-z0-9]{16,64}$/.test(bookIdParam) ? bookIdParam : null;
  const preselectedBook = useQuery(
    api.books.get,
    validBookIdParam ? { id: validBookIdParam as Id<'books'> } : 'skip'
  );

  useEffect(() => {
    if (!selectedBook && preselectedBook) {
      setSelectedBook(preselectedBook);
    }
  }, [preselectedBook, selectedBook]);

  useEffect(() => {
    if (!bookIdParam || validBookIdParam) return;

    toast.error('잘못된 책 링크입니다');
    void navigate('/reviews/new', { replace: true });
  }, [bookIdParam, navigate, validBookIdParam]);

  // 책 선택 시 해당 책에 대한 기존 리뷰 조회
  const existingReview = useQuery(
    api.reviews.getByUserAndBook,
    selectedBook && user
      ? { userId: user.id, bookId: selectedBook._id }
      : 'skip'
  );
  const diaries = useQuery(
    api.readingDiaries.getByUserAndBook,
    step === 2 && selectedBook && user ? { bookId: selectedBook._id } : 'skip'
  );

  useEffect(() => {
    if (
      !validBookIdParam ||
      hasHandledPreselectedBook ||
      !selectedBook ||
      !isLoaded
    ) {
      return;
    }

    if (!user) {
      setHasHandledPreselectedBook(true);
      setStep(2);
      return;
    }

    if (existingReview === undefined) return;

    setHasHandledPreselectedBook(true);
    if (existingReview && existingReview.status !== 'DELETED') {
      setShowExistingReviewDialog(true);
      return;
    }

    setStep(2);
  }, [
    existingReview,
    hasHandledPreselectedBook,
    isLoaded,
    selectedBook,
    user,
    validBookIdParam,
  ]);

  const handleSelectBook = (book: BookData | null) => {
    setSelectedBook(book);
  };

  const handleContinueToForm = () => {
    if (!selectedBook) return;
    if (user && existingReview === undefined) return;

    // 기존 리뷰가 있고 삭제된 상태가 아니면 모달 표시
    if (existingReview && existingReview.status !== 'DELETED') {
      setShowExistingReviewDialog(true);
      return;
    }

    setStep(2);
  };

  const isCheckingExistingReview =
    Boolean(selectedBook && user) && existingReview === undefined;

  const handleBackToBookSelection = () => {
    setStep(1);
  };

  const handleEditExistingReview = () => {
    if (existingReview) {
      void navigate(`/reviews/${existingReview._id}/edit`);
    }
  };

  const handleSubmitReview = async (
    data: ReviewFormData,
    status: 'DRAFT' | 'PUBLISHED'
  ) => {
    if (!selectedBook || !user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setIsSubmitting(true);

    try {
      const displayName = getUserNickname(user);
      const reviewId = await createReview({
        bookId: selectedBook._id,
        title: data.title || undefined,
        content: data.content,
        isRecommended: data.isRecommended,
        readStatus: data.readStatus,
        status,
        ...(displayName ? { displayName } : {}),
      });

      // Navigate to the created review
      void navigate(`/reviews/${reviewId}`);
    } catch (error) {
      logError(error, 'Failed to create review');
      toast.error('독후감 작성에 실패했습니다', '다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <m.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl"
    >
      {/* Header */}
      <div className="mb-8 paper-panel rounded-3xl p-6 sm:p-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/feed')}
          className="mb-4 text-stone-600 hover:text-stone-900 hover:bg-white/70"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          피드로 돌아가기
        </Button>

        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-2 font-serif">
          독후감 작성하기
        </h1>
        <p className="text-stone-600">
          책을 고르고, 그동안 남긴 독서 일기를 펼쳐보며 긴 감상으로 정리합니다.
        </p>
      </div>

      {/* Progress indicator */}
      <m.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-4 mb-8"
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1
                ? 'bg-ink text-paper-100'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {step > 1 ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <span
            className={`font-medium ${
              step === 1 ? 'text-stone-900' : 'text-stone-600'
            }`}
          >
            책 선택
          </span>
        </div>

        <div className="flex-1 h-0.5 bg-stone-200">
          <div
            className={`h-full transition-all duration-300 ${
              step >= 2 ? 'bg-primary-600 w-full' : 'bg-stone-200 w-0'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2
                ? 'bg-ink text-paper-100'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            2
          </div>
          <span
            className={`font-medium ${
              step === 2 ? 'text-stone-900' : 'text-stone-600'
            }`}
          >
            일기 회고와 작성
          </span>
        </div>
      </m.div>

      {/* Step 1: Book selection */}
      {step === 1 && (
        <m.div
          variants={fadeInUpVariants}
          initial="hidden"
          animate="visible"
          className="paper-surface rounded-2xl p-6 sm:p-8"
        >
          <h2 className="text-xl font-semibold text-stone-900 mb-6">
            독후감을 작성할 책을 선택하세요
          </h2>

          <BookSearch
            onSelectBook={handleSelectBook}
            selectedBook={selectedBook}
          />

          {selectedBook && (
            <div className="mt-6 pt-6 border-t border-stone-200">
              <Button
                onClick={handleContinueToForm}
                variant="warm"
                className="w-full"
                size="lg"
                disabled={isCheckingExistingReview}
              >
                {isCheckingExistingReview ? '확인 중...' : '계속하기'}
              </Button>
            </div>
          )}
        </m.div>
      )}

      {/* Step 2: Review form with diary sidebar */}
      {step === 2 && selectedBook && (
        <m.div
          variants={fadeInUpVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main form area */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-stone-900">
                독후감 작성
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToBookSelection}
                className="text-stone-600 hover:text-stone-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />책 다시 선택
              </Button>
            </div>

            {/* Selected book summary */}
            <div className="paper-panel rounded-2xl p-4 flex items-center gap-4">
              {selectedBook.coverImageUrl && (
                <img
                  src={selectedBook.coverImageUrl}
                  alt={`${selectedBook.title} 표지`}
                  className="book-paper-frame w-16 h-24 object-cover rounded-lg"
                />
              )}
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-paper-700 ring-1 ring-paper-200">
                  <NotebookPen className="w-3 h-3" />
                  선택한 책
                </div>
                <h3 className="font-semibold text-stone-900">
                  {selectedBook.title}
                </h3>
                <p className="text-sm text-stone-600">{selectedBook.author}</p>
              </div>
            </div>

            {/* Mobile: Collapsible diary section */}
            <details className="lg:hidden paper-surface rounded-2xl">
              <summary className="p-4 cursor-pointer text-sm font-medium text-stone-700 hover:bg-paper-50 rounded-2xl">
                내 독서 일기 보기
              </summary>
              <div className="px-4 pb-4">
                <BookDiaryListView diaries={diaries} />
              </div>
            </details>

            {/* Review form */}
            <div className="lg:flex-1">
              <ReviewForm
                onSubmit={handleSubmitReview}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>

          {/* Desktop: Diary sidebar */}
          <div className="hidden lg:block">
            <div className="paper-surface rounded-2xl p-5 sticky top-24 lg:flex lg:flex-col lg:max-h-[calc(100vh-7rem)] overflow-hidden">
              <BookDiaryListView
                diaries={diaries}
                className="h-full"
                viewMode="full"
              />
            </div>
          </div>
        </m.div>
      )}

      {/* 기존 리뷰 존재 시 안내 다이얼로그 */}
      <Dialog
        open={showExistingReviewDialog}
        onOpenChange={setShowExistingReviewDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미 작성한 리뷰가 있습니다</DialogTitle>
            <DialogDescription>
              이 책에 대한 리뷰를 이미 작성하셨습니다. 기존 리뷰를
              수정하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          {existingReview && (
            <div className="bg-stone-50 rounded-lg p-4 my-4 space-y-1">
              <p className="font-medium text-stone-900">
                {existingReview.readStatus === 'READING'
                  ? '읽는 중'
                  : existingReview.readStatus === 'COMPLETED'
                    ? '완독'
                    : '중단'}
              </p>
              <p className="text-sm text-stone-500">
                {existingReview.publishedAt
                  ? new Date(existingReview.publishedAt).toLocaleDateString(
                      'ko-KR'
                    )
                  : '초안'}{' '}
                · {existingReview.status === 'DRAFT' ? '미발행' : '발행됨'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExistingReviewDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleEditExistingReview}>기존 리뷰 수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </m.div>
  );
}
