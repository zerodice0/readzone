import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  Lock,
  Save,
  X,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { m } from 'framer-motion';
import { api } from 'convex/_generated/api';
import { Button } from '../../components/ui/button';
import { BookSearch } from '../../components/review/BookSearch';
import { logError } from '../../utils/error';
import { toast } from '../../utils/toast';
import { pageVariants, fadeInUpVariants } from '../../utils/animations';
import type { BookData } from '../../types/book';

export default function ReadingDiaryNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [isBookSearchOpen, setIsBookSearchOpen] = useState(true);
  const [date, setDate] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
    const today = new Date();
    // 로컬 시간대 기준 YYYY-MM-DD (UTC 기반 toISOString() 대신 사용)
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const createDiary = useMutation(api.readingDiaries.create);

  useEffect(() => {
    if (selectedBook) {
      contentRef.current?.focus();
    }
  }, [selectedBook]);

  const handleSelectBook = (book: BookData) => {
    setSelectedBook(book);
    setIsBookSearchOpen(false);
  };

  const handleClearBook = () => {
    setSelectedBook(null);
    setIsBookSearchOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedBook || !user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    if (!content.trim()) {
      toast.error('내용을 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert date string to timestamp
      const [y, m, d] = date.split('-').map(Number);
      const dateTimestamp = Date.UTC(y, m - 1, d);

      await createDiary({
        bookId: selectedBook._id,
        date: dateTimestamp,
        content: content.trim(),
        visibility: 'PRIVATE',
      });

      toast.success('독서 일기가 저장되었습니다');
      void navigate('/reading-diary', { replace: true });
    } catch (error) {
      logError(error, 'Failed to create diary');
      toast.error('독서 일기 저장에 실패했습니다', '다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedBook && content.trim().length > 0;

  return (
    <m.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto max-w-3xl px-4 py-4 pb-28 sm:px-6 sm:py-6 lg:px-8"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reading-diary', { replace: true })}
          className="h-9 px-3 text-stone-600 hover:bg-paper-50 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">독서 일기</span>
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          variant="warm"
          size="sm"
          className="h-9 px-4 disabled:from-stone-300 disabled:to-stone-300 disabled:text-stone-500"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? '저장 중' : '저장'}
        </Button>
      </div>

      <m.section
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="paper-surface overflow-hidden rounded-2xl"
      >
        <div className="border-b border-paper-200/70 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-primary-700">
                독서 일기
              </p>
              <h1 className="mt-1 text-2xl font-bold text-stone-950 sm:text-3xl">
                오늘의 기록
              </h1>
            </div>
            <label
              htmlFor="diary-date"
              className="flex w-full items-center gap-2 rounded-xl border border-paper-200/80 bg-white/65 px-3 py-2 sm:w-auto"
            >
              <Calendar className="h-4 w-4 shrink-0 text-primary-700" />
              <span className="text-xs font-semibold text-stone-500">날짜</span>
              <input
                type="date"
                id="diary-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-stone-800 outline-none sm:w-36"
              />
            </label>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-stone-800">
                <BookOpen className="h-4 w-4 text-primary-700" />책
              </h2>
              {selectedBook && (
                <button
                  type="button"
                  onClick={() => setIsBookSearchOpen((current) => !current)}
                  aria-expanded={isBookSearchOpen}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-stone-500 transition-colors hover:bg-paper-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isBookSearchOpen ? '닫기' : '책 바꾸기'}
                </button>
              )}
            </div>

            {selectedBook && (
              <div className="flex items-center gap-3 rounded-xl border border-paper-200/80 bg-white/60 p-3">
                <div className="book-paper-frame h-16 w-11 shrink-0 overflow-hidden rounded-md bg-stone-100">
                  {selectedBook.coverImageUrl ? (
                    <img
                      src={selectedBook.coverImageUrl}
                      alt={`${selectedBook.title} 표지`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpen className="m-auto mt-5 h-5 w-5 text-stone-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">
                    <Check className="h-3 w-3" />
                    선택됨
                  </span>
                  <h3 className="truncate text-base font-bold text-stone-950">
                    {selectedBook.title}
                  </h3>
                  <p className="truncate text-sm text-stone-500">
                    {selectedBook.author}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearBook}
                  className="h-9 w-9 shrink-0 text-stone-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="선택한 책 해제"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {(!selectedBook || isBookSearchOpen) && (
              <div
                className={
                  selectedBook ? 'border-t border-paper-200/70 pt-3' : ''
                }
              >
                <BookSearch
                  onSelectBook={handleSelectBook}
                  selectedBook={selectedBook}
                  context="diary"
                  hideInitialHint
                  compact
                />
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="diary-content"
                className="text-sm font-bold text-stone-800"
              >
                오늘 읽으며 남긴 생각
              </label>
              <span className="text-xs font-medium text-stone-500">
                {content.length}자
              </span>
            </div>
            <textarea
              ref={contentRef}
              id="diary-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="오늘 읽은 범위, 마음에 남은 문장, 떠오른 생각을 자유롭게 적어보세요."
              rows={12}
              className="paper-input w-full min-h-[min(52vh,34rem)] resize-y rounded-2xl px-4 py-4 text-base leading-8 outline-none placeholder:text-stone-400 sm:min-h-[26rem] sm:px-5"
            />
          </section>
        </div>

        <div className="border-t border-paper-200/70 bg-[#fffdf8]/75 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-1.5 text-xs text-stone-500">
              <Lock className="h-3.5 w-3.5" />
              {selectedBook
                ? '비공개로 일기에 저장됩니다.'
                : '책을 선택하면 저장할 수 있습니다.'}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              variant="warm"
              className="w-full disabled:from-stone-300 disabled:to-stone-300 disabled:text-stone-500 sm:w-auto"
              size="lg"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? '저장 중...' : '저장하기'}
            </Button>
          </div>
        </div>
      </m.section>
    </m.main>
  );
}
