import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, PenLine, Save } from 'lucide-react';
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

  const createDiary = useMutation(api.readingDiaries.create);

  const promptHints = [
    '오늘 읽은 범위:',
    '인상 깊었던 문장:',
    '나중에 독후감에서 더 쓰고 싶은 생각:',
  ];

  const handleAddPrompt = (prompt: string) => {
    setContent((current) =>
      current.trim() ? `${current.trim()}\n\n${prompt} ` : `${prompt} `
    );
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
    <m.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl"
    >
      {/* Header */}
      <div className="mb-8 paper-panel rounded-3xl p-6 sm:p-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reading-diary', { replace: true })}
          className="mb-4 text-stone-600 hover:text-stone-900 hover:bg-white/70"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          독서 일기로 돌아가기
        </Button>

        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-2 font-serif">
          독서 일기 작성
        </h1>
        <p className="text-stone-600">
          오늘 읽은 범위와 생각을 짧게 남겨두면, 완독 후 독후감의 재료가 됩니다.
        </p>
      </div>

      {/* Form */}
      <m.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="paper-surface rounded-2xl p-6 sm:p-8 space-y-6"
      >
        {/* Book Selection */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">책 선택</h2>
          <BookSearch
            onSelectBook={setSelectedBook}
            selectedBook={selectedBook}
            context="diary"
          />
        </div>

        {/* Date Selection */}
        <div>
          <label
            htmlFor="diary-date"
            className="block text-sm font-medium text-stone-700 mb-2"
          >
            <Calendar className="w-4 h-4 inline-block mr-2" />
            날짜
          </label>
          <input
            type="date"
            id="diary-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="paper-input w-full sm:w-auto px-4 py-2 rounded-lg outline-none"
          />
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="diary-content"
            className="block text-sm font-medium text-stone-700 mb-2"
          >
            오늘의 독서 기록
          </label>
          <div className="mb-3 flex flex-wrap gap-2">
            {promptHints.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleAddPrompt(prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border border-paper-200 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-paper-700 transition-colors hover:bg-paper-100"
              >
                <PenLine className="w-3 h-3" />
                {prompt.replace(':', '')}
              </button>
            ))}
          </div>
          <textarea
            id="diary-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 읽은 내용, 인상 깊었던 구절, 떠오른 생각 등을 자유롭게 적어보세요..."
            rows={6}
            className="paper-input w-full px-4 py-3 rounded-xl outline-none resize-y min-h-48 leading-relaxed"
          />
          <p className="mt-1 text-sm text-stone-500">{content.length}자</p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-paper-200/70">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            variant="warm"
            className="w-full disabled:bg-stone-300"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </m.div>
    </m.div>
  );
}
