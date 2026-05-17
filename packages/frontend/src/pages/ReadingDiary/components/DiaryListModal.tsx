import { useState, useMemo } from 'react';
import {
  Plus,
  BookOpen,
  CalendarDays,
  X,
  ChevronUp,
  FileText,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
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

  const handleWriteReview = (book: BookGroup['book']) => {
    void navigate(`/reviews/new?bookId=${book._id}`);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="paper-surface flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="relative z-10 shrink-0 border-b border-paper-200/70 bg-[#fffdf8]/95 p-6 pb-4 backdrop-blur">
          <div className="flex items-center gap-3 pr-10">
            <div className="rounded-xl border border-paper-200 bg-white/70 p-2.5">
              <CalendarDays className="h-5 w-5 text-primary-700" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="font-heading text-xl font-semibold text-stone-950">
                {formattedDate}
              </DialogTitle>
              <DialogDescription className="text-sm text-stone-500">
                이 날의 독서 기록
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="absolute right-4 top-4 p-2 -m-2 rounded-full hover:bg-muted/80 transition-colors z-20 touch-manipulation">
            <X className="w-5 h-5 text-muted-foreground" />
            <span className="sr-only">닫기</span>
          </DialogClose>
        </DialogHeader>

        <div className="min-h-[200px] flex-1 overflow-y-auto p-6">
          {diaries === undefined ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
              <p className="text-sm text-muted-foreground animate-pulse">
                기록을 불러오는 중...
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
                    {/* 책 헤더 + 빠른 추가 버튼 */}
                    <div className="paper-panel flex items-center justify-between gap-3 rounded-xl p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {group.book.coverImageUrl && (
                          <img
                            src={group.book.coverImageUrl}
                            alt={group.book.title}
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
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWriteReview(group.book)}
                          className="text-primary-700 hover:bg-white/70 hover:text-primary-600"
                          aria-label={`${group.book.title} 독후감 쓰기`}
                        >
                          <FileText className="w-4 h-4" />
                          <span className="hidden sm:inline">독후감</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickAdd(group.book)}
                          className="text-primary-700 hover:bg-white/70 hover:text-primary-600"
                          aria-label={`${group.book.title} 일기 추가`}
                        >
                          <Plus className="w-4 h-4" />
                          <span className="sr-only">일기 추가</span>
                        </Button>
                      </div>
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
          <div className="shrink-0 border-t border-paper-200/70 bg-[#fffdf8]/95 p-4 backdrop-blur">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full hover:bg-muted/50 transition-colors border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  일기 추가하기
                  <ChevronUp className="w-4 h-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="center"
                className="w-[calc(100vw-3rem)] sm:w-[calc(28rem-2rem)] max-h-[300px] overflow-y-auto"
              >
                {groupedByBook.map((group) => (
                  <DropdownMenuItem
                    key={group.book._id}
                    onClick={() => handleQuickAdd(group.book)}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                  >
                    {group.book.coverImageUrl ? (
                      <img
                        src={group.book.coverImageUrl}
                        alt={group.book.title}
                        className="w-8 h-10 object-cover rounded shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {group.book.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.diaries.length}개의 기록
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleAddDiary}
                  className="py-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-3" />
                  다른 책으로 기록하기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
