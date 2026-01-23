import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Save } from 'lucide-react';
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
  const { user } = useUser();
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [date, setDate] = useState(() => {
    const today = new Date();
    // 로컬 시간대 기준 YYYY-MM-DD (UTC 기반 toISOString() 대신 사용)
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDiary = useMutation(api.readingDiaries.create);

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
      const dateTimestamp = new Date(date).getTime();

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
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl"
    >
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reading-diary', { replace: true })}
          className="mb-4 text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          독서 일기로 돌아가기
        </Button>

        <h1 className="text-3xl font-bold text-stone-900 mb-2">
          독서 일기 작성
        </h1>
        <p className="text-stone-600">오늘 읽은 내용을 간단히 기록해보세요</p>
      </div>

      {/* Form */}
      <m.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6"
      >
        {/* Book Selection */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">책 선택</h2>
          <BookSearch
            onSelectBook={setSelectedBook}
            selectedBook={selectedBook}
          />
        </div>

        {/* Selected Book Summary */}
        {selectedBook && (
          <div className="bg-stone-50 rounded-lg p-4 flex items-center gap-4">
            {selectedBook.coverImageUrl && (
              <img
                src={selectedBook.coverImageUrl}
                alt={`${selectedBook.title} 표지`}
                className="w-12 h-16 object-cover rounded shadow-sm"
              />
            )}
            <div>
              <h3 className="font-semibold text-stone-900">
                {selectedBook.title}
              </h3>
              <p className="text-sm text-stone-600">{selectedBook.author}</p>
            </div>
          </div>
        )}

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
            className="w-full sm:w-auto px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
          <textarea
            id="diary-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 읽은 내용, 인상 깊었던 구절, 떠오른 생각 등을 자유롭게 적어보세요..."
            rows={6}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
          />
          <p className="mt-1 text-sm text-stone-500">{content.length}자</p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-stone-200">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-stone-300"
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
