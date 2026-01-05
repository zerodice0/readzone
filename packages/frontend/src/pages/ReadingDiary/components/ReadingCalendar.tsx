import { useMemo } from 'react';
import { CalendarDay } from './CalendarDay';

interface BookEntry {
  bookId: string;
  coverImageUrl?: string;
  diaryCount?: number;
  diaryIds?: string[];
}

interface CalendarData {
  [dateKey: string]: BookEntry[];
}

interface NormalizedBookEntry {
  bookId: string;
  coverImageUrl?: string;
  diaryCount: number;
  diaryIds: string[];
}

/**
 * 백엔드 호환성을 위한 데이터 정규화 함수
 * - diaryCount/diaryIds가 없는 이전 버전 데이터 처리
 * - 같은 책이 중복으로 들어온 경우 합침
 */
function normalizeBooks(books: BookEntry[]): NormalizedBookEntry[] {
  const bookMap = new Map<string, NormalizedBookEntry>();

  for (const book of books) {
    const existing = bookMap.get(book.bookId);
    if (existing) {
      // 같은 책이 이미 있으면 카운트 합산
      existing.diaryCount += book.diaryCount ?? 1;
      if (book.diaryIds) {
        existing.diaryIds.push(...book.diaryIds);
      }
    } else {
      // 새 책 항목 추가 (원본 배열 참조 방지를 위해 복사)
      bookMap.set(book.bookId, {
        bookId: book.bookId,
        coverImageUrl: book.coverImageUrl,
        diaryCount: book.diaryCount ?? 1,
        diaryIds: [...(book.diaryIds ?? [])],
      });
    }
  }

  return Array.from(bookMap.values());
}

interface ReadingCalendarProps {
  year: number;
  month: number; // 1-12
  calendarData: CalendarData;
  onDateClick: (date: Date) => void;
}

export function ReadingCalendar({
  year,
  month,
  calendarData,
  onDateClick,
}: ReadingCalendarProps) {
  // 백엔드 데이터 정규화 (중복 책 합치기, 기본값 처리)
  const normalizedCalendarData = useMemo(() => {
    const result: Record<string, NormalizedBookEntry[]> = {};
    for (const [dateKey, books] of Object.entries(calendarData)) {
      result[dateKey] = normalizeBooks(books);
    }
    return result;
  }, [calendarData]);

  // Generate calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Fill empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Fill days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(year, month - 1, day));

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill remaining cells in last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div>
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {dayLabels.map((label, index) => (
          <div
            key={label}
            className={`text-center text-sm font-medium py-2 ${
              index === 0
                ? 'text-red-500'
                : index === 6
                  ? 'text-blue-500'
                  : 'text-stone-500'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIndex) =>
          week.map((date, dayIndex) => {
            if (!date) {
              return (
                <div
                  key={`empty-${weekIndex}-${dayIndex}`}
                  className="aspect-square"
                />
              );
            }

            const dateKey = getDateKey(date);
            const books = normalizedCalendarData[dateKey] || [];
            const isToday = new Date().toDateString() === date.toDateString();
            const isWeekend = dayIndex === 0 || dayIndex === 6;

            return (
              <CalendarDay
                key={dateKey}
                date={date}
                books={books}
                isToday={isToday}
                isWeekend={isWeekend}
                isSunday={dayIndex === 0}
                onClick={() => onDateClick(date)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
