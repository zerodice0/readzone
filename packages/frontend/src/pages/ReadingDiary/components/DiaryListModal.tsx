import { useState, useMemo } from 'react';
import { Plus, BookOpen, CalendarDays, X } from 'lucide-react';
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
import { QuickAddDiaryDialog } from './QuickAddDiaryDialog';
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

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 shrink-0 relative">
          <div className="flex items-center gap-3 pr-10">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-xl font-heading font-semibold">
                {formattedDate}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                이 날의 독서 기록
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="absolute right-4 top-4 p-2 -m-2 rounded-full hover:bg-muted/80 transition-colors z-20 touch-manipulation">
            <X className="w-5 h-5 text-muted-foreground" />
            <span className="sr-only">닫기</span>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 min-h-[200px]">
          {diaries === undefined ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                기록을 불러오는 중...
              </p>
            </div>
          ) : diaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-5 ring-1 ring-border/50">
                <BookOpen className="w-9 h-9 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                작성된 일기가 없습니다
              </h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-[240px] leading-relaxed">
                이 날 어떤 책을 읽으셨나요?
                <br />
                소중한 독서 기록을 남겨보세요.
              </p>
              <Button
                onClick={handleAddDiary}
                className="bg-primary hover:bg-primary/90 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />첫 일기 작성하기
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
                    {/* 책 헤더 + 빠른 추가 버튼 */}
                    <div className="flex items-center justify-between bg-stone-100 rounded-lg p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {group.book.coverImageUrl && (
                          <img
                            src={group.book.coverImageUrl}
                            alt={group.book.title}
                            className="w-8 h-11 object-cover rounded shadow-sm shrink-0"
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickAdd(group.book)}
                        className="shrink-0 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* 해당 책의 일기 목록 */}
                    <div className="space-y-2 pl-2">
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

        {diaries && diaries.length > 0 && (
          <div className="p-4 border-t border-border bg-background/95 backdrop-blur shrink-0">
            <Button
              variant="outline"
              onClick={handleAddDiary}
              className="w-full hover:bg-muted/50 transition-colors border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              다른 책으로 기록하기
            </Button>
          </div>
        )}
      </DialogContent>

      {/* 빠른 일기 추가 다이얼로그 */}
      {quickAddBook && (
        <QuickAddDiaryDialog
          book={quickAddBook}
          date={date}
          onClose={() => setQuickAddBook(null)}
          onSuccess={() => setQuickAddBook(null)}
        />
      )}
    </Dialog>
  );
}
