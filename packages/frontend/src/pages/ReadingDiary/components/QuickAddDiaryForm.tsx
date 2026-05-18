import { useRef, useState, type FormEvent } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Button } from '../../../components/ui/button';
import { toast } from '../../../utils/toast';
import { logError } from '../../../utils/error';
import type { Id } from 'convex/_generated/dataModel';

interface QuickAddDiaryFormProps {
  book: {
    _id: Id<'books'>;
    title: string;
    author: string;
    coverImageUrl?: string;
  };
  date: Date;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * 같은 책에 빠르게 일기를 추가할 수 있는 모달 내부 폼
 * - 책 검색 단계 생략
 * - 내용과 공개 설정만 입력
 */
export function QuickAddDiaryForm({
  book,
  date,
  onCancel,
  onSuccess,
}: QuickAddDiaryFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const createDiary = useMutation(api.readingDiaries.create);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!content.trim()) {
      toast.error('내용을 입력해주세요');
      contentRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const timestamp = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      await createDiary({
        bookId: book._id,
        date: timestamp,
        content: content.trim(),
        visibility: 'PRIVATE',
      });

      toast.success('일기가 추가되었습니다');
      onSuccess();
    } catch (error) {
      logError(error, 'Failed to create diary');
      toast.error('일기 추가에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="paper-panel flex items-center gap-3 rounded-xl p-3">
        {book.coverImageUrl && (
          <img
            src={book.coverImageUrl}
            alt={`${book.title} 표지`}
            width={40}
            height={56}
            className="book-paper-frame h-14 w-10 shrink-0 rounded object-cover shadow-sm"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-900">
            {book.title}
          </p>
          <p className="truncate text-xs text-stone-500">{book.author}</p>
          <p className="mt-1 text-xs font-bold text-primary-700">
            {formattedDate}
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="quick-diary-content"
          className="mb-2 block text-sm font-bold text-stone-800"
        >
          오늘의 독서 기록
        </label>
        <textarea
          ref={contentRef}
          id="quick-diary-content"
          name="quick-diary-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이 책에서 인상 깊었던 부분이나 느낀 점을 기록해보세요…"
          rows={6}
          autoComplete="off"
          className="paper-input w-full resize-y rounded-xl px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-stone-400"
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-paper-200/70 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-600 hover:bg-primary-700"
        >
          {isSubmitting ? '저장 중…' : '저장'}
        </Button>
      </div>
    </form>
  );
}
