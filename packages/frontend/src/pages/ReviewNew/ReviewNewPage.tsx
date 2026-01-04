import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
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
import { BookDiaryList } from '../../components/diary/BookDiaryList';
import type { Id } from 'convex/_generated/dataModel';

interface BookData {
  _id: Id<'books'>;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: number;
  coverImageUrl?: string;
  description?: string;
}

interface ReviewFormData {
  title: string;
  content: string;
  isRecommended: boolean;
  readStatus: 'READING' | 'COMPLETED' | 'DROPPED';
}

export default function ReviewNewPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExistingReviewDialog, setShowExistingReviewDialog] =
    useState(false);

  const createReview = useMutation(api.reviews.create);

  // 책 선택 시 해당 책에 대한 기존 리뷰 조회
  const existingReview = useQuery(
    api.reviews.getByUserAndBook,
    selectedBook && user
      ? { userId: user.id, bookId: selectedBook._id }
      : 'skip'
  );

  const handleSelectBook = (book: BookData | null) => {
    setSelectedBook(book);
  };

  const handleContinueToForm = () => {
    if (!selectedBook) return;

    // 기존 리뷰가 있고 삭제된 상태가 아니면 모달 표시
    if (existingReview && existingReview.status !== 'DELETED') {
      setShowExistingReviewDialog(true);
      return;
    }

    setStep(2);
  };

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
      const reviewId = await createReview({
        bookId: selectedBook._id,
        title: data.title || undefined,
        content: data.content,
        isRecommended: data.isRecommended,
        readStatus: data.readStatus,
        status,
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
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl"
    >
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/feed')}
          className="mb-4 text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          피드로 돌아가기
        </Button>

        <h1 className="text-3xl font-bold text-stone-900 mb-2">
          독후감 작성하기
        </h1>
        <p className="text-stone-600">
          책을 선택하고 당신의 생각을 공유해보세요
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
                ? 'bg-primary-600 text-white'
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
                ? 'bg-primary-600 text-white'
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
            독후감 작성
          </span>
        </div>
      </m.div>

      {/* Step 1: Book selection */}
      {step === 1 && (
        <m.div
          variants={fadeInUpVariants}
          initial="hidden"
          animate="visible"
          className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm"
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
                className="w-full bg-primary-600 hover:bg-primary-700"
                size="lg"
              >
                계속하기
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
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
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
            <div className="bg-stone-50 rounded-lg p-4 mb-6 flex items-center gap-4">
              {selectedBook.coverImageUrl && (
                <img
                  src={selectedBook.coverImageUrl}
                  alt={`${selectedBook.title} 표지`}
                  className="w-16 h-22 object-cover rounded shadow-sm"
                />
              )}
              <div>
                <h3 className="font-semibold text-stone-900">
                  {selectedBook.title}
                </h3>
                <p className="text-sm text-stone-600">{selectedBook.author}</p>
              </div>
            </div>

            {/* Mobile: Collapsible diary section */}
            <details className="lg:hidden mb-6 bg-stone-50 rounded-lg border border-stone-200">
              <summary className="p-4 cursor-pointer text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg">
                📖 내 독서 일기 보기
              </summary>
              <div className="px-4 pb-4">
                <BookDiaryList bookId={selectedBook._id} />
              </div>
            </details>

            {/* Review form */}
            <ReviewForm
              onSubmit={handleSubmitReview}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Desktop: Diary sidebar */}
          <div className="hidden lg:block">
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm sticky top-24">
              <BookDiaryList bookId={selectedBook._id} />
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
