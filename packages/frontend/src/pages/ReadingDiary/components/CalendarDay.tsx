interface Book {
  bookId: string;
  coverImageUrl?: string;
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
        <div className="flex flex-wrap gap-0.5 justify-center">
          {books.slice(0, 3).map((book, index) => (
            <div
              key={`${book.bookId}-${index}`}
              className="w-5 h-7 sm:w-6 sm:h-8 rounded overflow-hidden bg-stone-200 shadow-sm"
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
          {books.length > 3 && (
            <div className="w-5 h-7 sm:w-6 sm:h-8 rounded bg-stone-300 flex items-center justify-center text-xs font-medium text-stone-600">
              +{books.length - 3}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
