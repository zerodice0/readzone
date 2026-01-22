import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { toast } from '../../../utils/toast';
import { logError } from '../../../utils/error';
import type { Id } from 'convex/_generated/dataModel';

interface QuickAddDiaryDialogProps {
  book: {
    _id: Id<'books'>;
    title: string;
    author: string;
    coverImageUrl?: string;
  };
  date: Date;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 같은 책에 빠르게 일기를 추가할 수 있는 다이얼로그
 * - 책 검색 단계 생략
 * - 내용과 공개 설정만 입력
 */
export function QuickAddDiaryDialog({
  book,
  date,
  onClose,
  onSuccess,
}: QuickAddDiaryDialogProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDiary = useMutation(api.readingDiaries.create);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('내용을 입력해주세요');
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
      onClose();
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>빠른 일기 추가</DialogTitle>
          <DialogDescription className="sr-only">
            선택한 날짜에 새로운 독서 일기를 작성합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 책 정보 */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            {book.coverImageUrl && (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-10 h-14 object-cover rounded shadow-sm"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-900 text-sm truncate">
                {book.title}
              </p>
              <p className="text-xs text-stone-500">{book.author}</p>
              <p className="text-xs text-primary-600 mt-1">{formattedDate}</p>
            </div>
          </div>

          {/* 내용 입력 */}
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
              placeholder="이 책에서 인상 깊었던 부분이나 느낀 점을 기록해보세요..."
              rows={4}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
              autoFocus
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
