import { useState, useMemo } from 'react';
import { Plus, CalendarDays, X, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { m, AnimatePresence } from 'framer-motion';

import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { DiaryCard } from './DiaryCard';
import { QuickAddDiaryForm } from './QuickAddDiaryForm';
import type { Id } from 'convex/_generated/dataModel';

interface DiaryListModalProps {
  date: Date;
  onClose: () => void;
}

interface BookGroup {
  book: {
    _id: Id<'books'>;
    title: string;
    author: string;
    coverImageUrl?: string;
  };
  diaries: Array<{
    _id: Id<'readingDiaries'>;
    _creationTime: number;
    content: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    book: {
      _id: Id<'books'>;
      title: string;
      author: string;
      coverImageUrl?: string;
    } | null;
  }>;
}

export function DiaryListModal({ date, onClose }: DiaryListModalProps) {
  const navigate = useNavigate();
  const [quickAddBook, setQuickAddBook] = useState<BookGroup['book'] | null>(
    null
  );

  // 로컬 날짜를 UTC 자정 타임스탬프로 변환하여 백엔드에서 올바르게 해석되도록 함
  const timestamp = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diaries = useQuery(api.readingDiaries.getByUserAndDate, {
    date: timestamp,
  });

  // 책별로 일기 그룹화
  const groupedByBook = useMemo(() => {
    if (!diaries) return [];

    const groups: Record<string, BookGroup> = {};

    for (const diary of diaries) {
      if (!diary.book) continue;

      const bookId = diary.book._id;
      if (!groups[bookId]) {
        groups[bookId] = {
          book: diary.book,
          diaries: [],
        };
      }
      groups[bookId].diaries.push(diary);
    }

    return Object.values(groups);
  }, [diaries]);

  // 제목용: "1월 4일 토요일" 형식
  const formattedDate = date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const handleAddDiary = () => {
    // Navigate to new diary page with date pre-filled
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    void navigate(`/reading-diary/new?date=${dateStr}`, { replace: true });
  };

  const handleQuickAdd = (book: BookGroup['book']) => {
    setQuickAddBook(book);
  };

  const handleBackToList = () => {
    setQuickAddBook(null);
  };

  const handleQuickAddSuccess = () => {
    setQuickAddBook(null);
  };

  const handleWriteReview = (book: BookGroup['book']) => {
    void navigate(`/reviews/new?bookId=${book._id}`);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="paper-surface flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="relative z-10 shrink-0 border-b border-paper-200/70 bg-[#fffdf8]/95 p-6 pb-4 backdrop-blur">
          <div className="flex items-center gap-3 pr-10">
            {quickAddBook ? (
              <button
                type="button"
                onClick={handleBackToList}
                className="rounded-xl border border-paper-200 bg-white/70 p-2.5 text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="일기 목록으로 돌아가기"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="rounded-xl border border-paper-200 bg-white/70 p-2.5">
                <CalendarDays className="h-5 w-5 text-primary-700" />
              </div>
            )}
            <div className="space-y-0.5">
              <DialogTitle className="font-heading text-xl font-semibold text-stone-950">
                {quickAddBook ? '빠른 일기 추가' : formattedDate}
              </DialogTitle>
              <DialogDescription className="text-sm text-stone-500">
                {quickAddBook
                  ? `${formattedDate}의 독서 기록`
                  : '이 날의 독서 기록'}
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="absolute right-4 top-4 p-2 -m-2 rounded-full hover:bg-muted/80 transition-colors z-20 touch-manipulation">
            <X className="w-5 h-5 text-muted-foreground" />
            <span className="sr-only">닫기</span>
          </DialogClose>
        </DialogHeader>

        <div className="min-h-[200px] flex-1 overflow-y-auto p-6">
          {quickAddBook ? (
            <QuickAddDiaryForm
              book={quickAddBook}
              date={date}
              onCancel={handleBackToList}
              onSuccess={handleQuickAddSuccess}
            />
          ) : diaries === undefined ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
              <p className="text-sm text-muted-foreground animate-pulse">
                기록을 불러오는 중…
              </p>
            </div>
          ) : diaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <p className="mb-4 text-sm text-stone-500">
                이 날짜에 작성된 일기가 없습니다
              </p>
              <Button
                onClick={handleAddDiary}
                className="bg-primary-600 shadow-sm hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                일기 작성하기
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {groupedByBook.map((group, groupIndex) => (
                  <m.div
                    key={group.book._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.3,
                      delay: groupIndex * 0.1,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className="space-y-3"
                  >
                    <div className="paper-panel rounded-xl p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {group.book.coverImageUrl && (
                          <img
                            src={group.book.coverImageUrl}
                            alt={`${group.book.title} 표지`}
                            width={32}
                            height={44}
                            className="book-paper-frame h-11 w-8 shrink-0 rounded object-cover shadow-sm"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 text-sm truncate">
                            {group.book.title}
                          </p>
                          <p className="text-xs text-stone-500">
                            {group.book.author} · {group.diaries.length}개의
                            기록
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWriteReview(group.book)}
                          className="w-full border-paper-200 bg-white/70 text-stone-700 hover:bg-primary-50 hover:text-primary-700"
                          aria-label={`${group.book.title} 독후감 쓰기`}
                        >
                          <FileText className="w-4 h-4" />
                          독후감
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAdd(group.book)}
                          className="w-full border-primary-200 bg-primary-50/60 text-primary-700 hover:bg-primary-100 hover:text-primary-800"
                          aria-label={`${group.book.title} 일기 추가`}
                        >
                          <Plus className="w-4 h-4" />
                          일기 추가
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.diaries.map((diary) => (
                        <DiaryCard
                          key={diary._id}
                          diary={diary}
                          showBookInfo={false}
                        />
                      ))}
                    </div>
                  </m.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {diaries && diaries.length > 0 && !quickAddBook && (
          <div className="shrink-0 border-t border-paper-200/70 bg-[#fffdf8]/95 p-4 backdrop-blur">
            <Button
              variant="outline"
              onClick={handleAddDiary}
              className="w-full border-dashed border-primary-200 bg-white/70 text-primary-700 hover:bg-primary-50 hover:text-primary-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              다른 책으로 기록하기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
