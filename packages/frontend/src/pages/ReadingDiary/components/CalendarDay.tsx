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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        aspect-square p-1 rounded-lg transition-colors
        hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500
        ${isToday ? 'ring-2 ring-primary-500 bg-primary-50' : ''}
        ${hasBooks ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      {/* Date number */}
      <div
        className={`text-sm font-medium mb-1 ${
          isToday
            ? 'text-primary-600'
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
            <div className="flex flex-col items-center gap-0.5">
              {/* 책 커버 (페이드 전환) */}
              <div className="relative w-5 h-7 sm:w-6 sm:h-8">
                {books.slice(0, 3).map((book, idx) => (
                  <div
                    key={book.bookId}
                    className={`absolute inset-0 rounded overflow-hidden bg-stone-200 shadow-sm animate-book-fade-${Math.min(books.length, 3)}-${idx + 1}`}
                  >
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400" />
                    )}
                  </div>
                ))}

                {/* 전체 일기 개수 뱃지 */}
                <span className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center bg-primary-600 text-white text-[10px] font-bold rounded-full px-0.5 z-10">
                  {books.reduce((sum, b) => sum + (b.diaryCount ?? 1), 0)}
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
            <div className="flex justify-center">
              <div className="relative w-5 h-7 sm:w-6 sm:h-8">
                <div className="w-full h-full rounded overflow-hidden bg-stone-200 shadow-sm">
                  {books[0].coverImageUrl ? (
                    <img
                      src={books[0].coverImageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400" />
                  )}
                </div>

                {/* 일기 개수 뱃지 (2개 이상일 때) */}
                {(books[0].diaryCount ?? 1) > 1 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center bg-primary-600 text-white text-[10px] font-bold rounded-full px-0.5">
                    {books[0].diaryCount ?? 1}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </button>
  );
}
