interface Book {
  bookId: string;
  coverImageUrl?: string;
  diaryCount: number;
  diaryIds: string[];
}

interface CalendarDayProps {
  date: Date;
  books: Book[];
  isToday: boolean;
  isWeekend: boolean;
  isSunday: boolean;
  onClick: () => void;
}

export function CalendarDay({
  date,
  books,
  isToday,
  isSunday,
  onClick,
}: CalendarDayProps) {
  const hasBooks = books.length > 0;
  const diaryCount = books.reduce(
    (sum, book) => sum + (book.diaryCount ?? 1),
    0
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${date.getDate()}일${hasBooks ? `, 독서 기록 ${diaryCount}건` : ', 새 기록 작성'}`}
      className={`
        group flex aspect-square min-h-[3.35rem] flex-col overflow-hidden rounded-xl border p-1.5 text-left transition-all
        hover:border-paper-300 hover:bg-paper-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${isToday ? 'border-ring bg-primary-50' : 'border-paper-200/45'}
        ${hasBooks ? 'bg-[#fffdf8]/90 shadow-sm' : 'bg-white/35'}
      `}
    >
      {/* Date number */}
      <div
        className={`mb-1 text-sm font-semibold leading-none ${
          isToday
            ? 'text-primary-700'
            : isSunday
              ? 'text-red-500'
              : 'text-stone-700'
        }`}
      >
        {date.getDate()}
      </div>

      {/* Book covers */}
      {hasBooks && (
        <>
          {books.length > 1 ? (
            // 책 2개 이상: 자동 페이드 캐로셀 + 인디케이터 + 뱃지
            <div className="mt-auto flex flex-col items-center gap-0.5">
              {/* 책 커버 (페이드 전환) */}
              <div className="relative h-7 w-5 sm:h-8 sm:w-6">
                {books.slice(0, 3).map((book, idx) => (
                  <div
                    key={book.bookId}
                    className={`book-paper-frame absolute inset-0 overflow-hidden rounded bg-stone-200 shadow-sm animate-book-fade-${Math.min(books.length, 3)}-${idx + 1}`}
                  >
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-stone-200 to-stone-400" />
                    )}
                  </div>
                ))}

                {/* 전체 일기 개수 뱃지 */}
                <span className="absolute -right-1 -top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-0.5 text-[10px] font-bold text-white">
                  {diaryCount}
                </span>
              </div>

              {/* 인디케이터 점 */}
              <div className="flex gap-0.5">
                {books.slice(0, 3).map((book, idx) => (
                  <span
                    key={`dot-${book.bookId}`}
                    className={`w-1 h-1 rounded-full bg-stone-300 animate-dot-${Math.min(books.length, 3)}-${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            // 책 1개: 단일 책 표시 + 일기 개수 뱃지
            <div className="mt-auto flex justify-center">
              <div className="relative h-7 w-5 sm:h-8 sm:w-6">
                <div className="book-paper-frame h-full w-full overflow-hidden rounded bg-stone-200 shadow-sm">
                  {books[0].coverImageUrl ? (
                    <img
                      src={books[0].coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-stone-200 to-stone-400" />
                  )}
                </div>

                {/* 일기 개수 뱃지 (2개 이상일 때) */}
                {(books[0].diaryCount ?? 1) > 1 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-0.5 text-[10px] font-bold text-white">
                    {books[0].diaryCount ?? 1}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!hasBooks && (
        <div className="mt-auto hidden text-[10px] font-bold text-primary-700 opacity-0 transition-opacity group-hover:opacity-100 sm:block">
          기록
        </div>
      )}
    </button>
  );
}
