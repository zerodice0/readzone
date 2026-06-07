import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, ListChecks } from 'lucide-react';
import type { Doc } from 'convex/_generated/dataModel';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { BookDiaryListView } from '../diary/BookDiaryList';

interface ReviewDiaryReferenceProps {
  diaries: Doc<'readingDiaries'>[] | undefined;
  className?: string;
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'short',
  day: 'numeric',
});

const fullDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function getPreview(content: string, length = 96) {
  const normalized = content.trim().replace(/\s+/g, ' ');

  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, length)}…`;
}

export function ReviewDiaryReference({
  diaries,
  className = '',
}: ReviewDiaryReferenceProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);

  const sortedDiaries = useMemo(() => {
    if (!diaries) return [];

    return [...diaries].sort((a, b) => a.date - b.date);
  }, [diaries]);

  const selectedDiary =
    sortedDiaries.find((diary) => diary._id === selectedDiaryId) ??
    sortedDiaries[0];

  return (
    <section className={`lg:hidden paper-surface rounded-2xl p-3 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <BookOpen className="h-4 w-4 text-primary-600" />
            독서 일기 참고
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsSheetOpen(true)}
          disabled={!diaries || diaries.length === 0}
          className="shrink-0 text-primary-700 hover:bg-primary-50 hover:text-primary-800"
        >
          <ListChecks className="h-4 w-4" />
          전체 보기
        </Button>
      </div>

      {diaries === undefined ? (
        <div className="animate-pulse space-y-2">
          <div className="flex gap-2">
            <div className="h-8 w-16 rounded-full bg-stone-100" />
            <div className="h-8 w-16 rounded-full bg-stone-100" />
            <div className="h-8 w-16 rounded-full bg-stone-100" />
          </div>
          <div className="h-20 rounded-lg bg-stone-100" />
        </div>
      ) : diaries.length === 0 ? (
        <div className="rounded-lg border border-paper-200/70 bg-white/60 px-4 py-4 text-center">
          <CalendarDays className="mx-auto mb-2 h-6 w-6 text-stone-300" />
          <p className="text-sm text-stone-500">
            이 책으로 작성한 독서 일기가 없습니다.
          </p>
        </div>
      ) : (
        <>
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 scrollbar-hide"
            aria-label="독서 일기 날짜 선택"
          >
            {sortedDiaries.map((diary) => {
              const isSelected = diary._id === selectedDiary?._id;

              return (
                <button
                  key={diary._id}
                  type="button"
                  onClick={() => setSelectedDiaryId(diary._id)}
                  aria-pressed={isSelected}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-paper-200 bg-white/70 text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {dateFormatter.format(new Date(diary.date))}
                </button>
              );
            })}
          </div>

          <div
            className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide"
            aria-label="독서 일기 미리보기"
          >
            {sortedDiaries.map((diary) => {
              const isSelected = diary._id === selectedDiary?._id;

              return (
                <button
                  key={diary._id}
                  type="button"
                  onClick={() => setSelectedDiaryId(diary._id)}
                  className={`min-h-20 w-[min(72vw,20rem)] shrink-0 snap-start rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/70'
                      : 'border-paper-200/80 bg-white/60 hover:bg-white/85'
                  }`}
                >
                  <span className="mb-1.5 block text-xs font-semibold text-stone-500">
                    {fullDateFormatter.format(new Date(diary.date))}
                  </span>
                  <span className="line-clamp-2 text-sm leading-5 text-stone-700">
                    {getPreview(diary.content, 72)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="bottom"
          className="paper-surface flex max-h-[82dvh] flex-col gap-0 overflow-hidden rounded-t-2xl p-0"
        >
          <SheetHeader className="border-b border-paper-200/70 px-5 pb-4 pt-5 text-left">
            <SheetTitle className="font-heading text-lg text-stone-950">
              전체 독서 일기
            </SheetTitle>
            <SheetDescription>
              긴 일기 탐색은 이 화면에서만 열고, 닫으면 바로 작성으로
              돌아갑니다.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <BookDiaryListView diaries={diaries} viewMode="full" />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
