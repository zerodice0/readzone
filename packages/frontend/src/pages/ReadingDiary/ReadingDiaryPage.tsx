import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  BookCheck,
  FileText,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { m } from 'framer-motion';
import { api } from 'convex/_generated/api';
import { Button } from '../../components/ui/button';
import { pageVariants } from '../../utils/animations';
import { ReadingCalendar } from './components/ReadingCalendar';
import { DiaryListModal } from './components/DiaryListModal';

export default function ReadingDiaryPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  // Fetch calendar data for current month
  const calendarData = useQuery(api.readingDiaries.getCalendarSummary, {
    year,
    month,
  });
  const reviewCandidates = useQuery(api.readingDiaries.getBooksWithoutReview);

  const monthDiaryCount = Object.values(calendarData ?? {}).reduce(
    (total, books) =>
      total + books.reduce((sum, book) => sum + (book.diaryCount ?? 1), 0),
    0
  );
  const activeDayCount = Object.keys(calendarData ?? {}).length;

  const handlePrevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    if (!calendarData) return;

    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (calendarData[dateKey]?.length > 0) {
      setSelectedDate(date);
    } else {
      void navigate(`/reading-diary/new?date=${dateKey}`);
    }
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
  };

  const monthNames = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];

  return (
    <m.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl"
    >
      <section className="paper-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-8">
        <div className="absolute inset-y-0 right-8 hidden w-px bg-primary-200/70 sm:block" />
        <div className="absolute inset-x-0 top-16 hidden h-px bg-primary-100/70 sm:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-paper-200 bg-white/70 px-3 py-1 text-xs font-bold text-paper-700">
              <NotebookPen className="w-3.5 h-3.5" />
              오늘의 독서 기록
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3 font-serif">
              독서 일기
            </h1>
            <p className="text-stone-600 leading-relaxed">
              매일 남긴 작은 기록을 모아두고, 완독한 책은 그 기록을 펼쳐보며 긴
              독후감으로 정리합니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/reading-diary/new')}
              variant="warm"
              size="lg"
            >
              <Plus className="w-4 h-4" />
              오늘 기록하기
            </Button>
            <Button
              onClick={() => navigate('/reviews/new')}
              variant="outline"
              size="lg"
              className="border-paper-200 bg-white/80 hover:bg-paper-50"
            >
              <FileText className="w-4 h-4" />
              독후감 작성
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="paper-surface rounded-2xl p-5">
          <p className="text-sm font-medium text-stone-500">이번 달 기록</p>
          <p className="mt-2 text-3xl font-bold text-stone-900 font-serif">
            {monthDiaryCount}
          </p>
        </div>
        <div className="paper-surface rounded-2xl p-5">
          <p className="text-sm font-medium text-stone-500">기록한 날짜</p>
          <p className="mt-2 text-3xl font-bold text-stone-900 font-serif">
            {activeDayCount}
          </p>
        </div>
        <div className="ink-panel rounded-2xl p-5">
          <p className="text-sm font-medium text-paper-100">독후감 후보</p>
          <p className="mt-2 text-3xl font-bold text-paper-100 font-serif">
            {reviewCandidates?.length ?? 0}
          </p>
        </div>
      </div>

      {reviewCandidates && reviewCandidates.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                독후감을 기다리는 책
              </h2>
              <p className="text-sm text-stone-500">
                일기가 쌓였지만 아직 독후감이 없는 책입니다.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reviewCandidates.slice(0, 3).map(({ book, diaryCount }) => (
              <button
                key={book._id}
                type="button"
                onClick={() => navigate(`/reviews/new?bookId=${book._id}`)}
                className="paper-surface group flex items-center gap-4 rounded-2xl p-4 text-left hover:border-paper-300"
              >
                <div className="book-paper-frame h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl}
                      alt={`${book.title} 표지`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookCheck className="m-auto mt-6 h-6 w-6 text-stone-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-900 truncate group-hover:text-primary-700">
                    {book.title}
                  </p>
                  <p className="text-sm text-stone-500 truncate">
                    {book.author}
                  </p>
                  <p className="mt-2 text-xs font-bold text-paper-700">
                    일기 {diaryCount}건
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Calendar Navigation */}
      <div className="paper-surface rounded-2xl">
        <div className="flex items-center justify-between p-4 border-b border-paper-200/70">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="text-stone-600 hover:text-stone-900"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-semibold text-stone-900 min-w-[140px] text-center">
              {year}년 {monthNames[month - 1]}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="text-stone-600 hover:text-stone-900"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-stone-600"
          >
            오늘
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          <ReadingCalendar
            year={year}
            month={month}
            calendarData={calendarData ?? {}}
            onDateClick={handleDateClick}
          />
        </div>
      </div>

      {/* Diary List Modal */}
      {selectedDate && (
        <DiaryListModal date={selectedDate} onClose={handleCloseModal} />
      )}
    </m.div>
  );
}
