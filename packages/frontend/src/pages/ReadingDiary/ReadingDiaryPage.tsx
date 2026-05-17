import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  BookCheck,
  FileText,
  CalendarDays,
  PenLine,
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
      className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,720px)_300px] lg:px-8"
    >
      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-950">독서 일기</h1>
            <p className="text-sm text-stone-500">
              날짜별로 남긴 독서 흔적을 펼쳐봅니다
            </p>
          </div>
        </div>

        <div className="paper-surface mb-4 rounded-2xl p-4">
          <button
            type="button"
            onClick={() => navigate('/reading-diary/new')}
            className="group flex w-full gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary-300/50 bg-primary-50 text-primary-700">
              <NotebookPen className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 border-b border-paper-200 pb-4">
              <span className="block text-base font-semibold text-stone-900 group-hover:text-primary-700">
                오늘 읽은 문장을 남겨보세요
              </span>
              <span className="mt-1 block text-sm text-stone-500">
                짧은 메모를 쌓아두고, 나중에 긴 독후감으로 이어갈 수 있습니다.
              </span>
            </span>
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
            <Button
              onClick={() => navigate('/reading-diary/new')}
              size="sm"
              className="w-full bg-primary-500 text-stone-950 hover:bg-primary-400 sm:w-auto"
            >
              <PenLine className="h-4 w-4" />
              오늘 기록
            </Button>
            <Button
              onClick={() => navigate('/reviews/new')}
              variant="ghost"
              size="sm"
              className="w-full text-stone-600 hover:text-ink-green sm:w-auto"
            >
              <FileText className="h-4 w-4" />
              독후감 쓰기
            </Button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 lg:hidden">
          <div className="rounded-xl border border-paper-200/70 bg-[#fffdf8]/80 p-3">
            <p className="text-xs font-medium text-stone-500">이번 달</p>
            <p className="mt-1 text-xl font-bold text-stone-900">
              {monthDiaryCount}
            </p>
          </div>
          <div className="rounded-xl border border-paper-200/70 bg-[#fffdf8]/80 p-3">
            <p className="text-xs font-medium text-stone-500">기록일</p>
            <p className="mt-1 text-xl font-bold text-stone-900">
              {activeDayCount}
            </p>
          </div>
          <div className="rounded-xl border border-primary-300/60 bg-primary-100 p-3 text-primary-700">
            <p className="text-xs font-medium text-primary-700/75">후보</p>
            <p className="mt-1 text-xl font-bold">
              {reviewCandidates?.length ?? 0}
            </p>
          </div>
        </div>

        <div className="sticky top-16 z-20 mb-4 bg-[#fbf7ee]/92 py-3 backdrop-blur-xl">
          <div className="paper-surface rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="shrink-0 text-stone-600 hover:text-stone-900"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 text-center">
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-700">
                  <CalendarDays className="h-4 w-4" />
                  월간 기록
                </div>
                <h2 className="text-lg font-bold text-stone-950 sm:text-xl">
                  {year}년 {monthNames[month - 1]}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="shrink-0 text-stone-600 hover:text-stone-900"
                aria-label="다음 달"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-paper-200/70 pt-3">
              <p className="min-w-0 text-xs text-stone-500">
                기록이 있는 날짜는 펼쳐보고, 빈 날짜는 바로 작성합니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="shrink-0 border-paper-200 bg-white/80 text-stone-600 hover:bg-paper-50"
              >
                오늘
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-paper-200/70 bg-[#fffdf8]/82">
          <div className="p-3 sm:p-4">
            <ReadingCalendar
              year={year}
              month={month}
              calendarData={calendarData ?? {}}
              onDateClick={handleDateClick}
            />
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="paper-surface hidden rounded-2xl p-5 lg:block">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary-700" />
              <h2 className="font-bold text-stone-950">이번 달 요약</h2>
            </div>
            <dl className="grid grid-cols-3 gap-2">
              <div>
                <dt className="text-xs font-medium text-stone-500">기록</dt>
                <dd className="mt-1 text-2xl font-bold text-stone-950">
                  {monthDiaryCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">날짜</dt>
                <dd className="mt-1 text-2xl font-bold text-stone-950">
                  {activeDayCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">후보</dt>
                <dd className="mt-1 text-2xl font-bold text-primary-700">
                  {reviewCandidates?.length ?? 0}
                </dd>
              </div>
            </dl>
          </div>

          {reviewCandidates && reviewCandidates.length > 0 && (
            <section className="paper-surface rounded-2xl p-5">
              <div className="mb-4">
                <h2 className="font-bold text-stone-950">
                  독후감을 기다리는 책
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  일기가 쌓였지만 아직 독후감이 없는 책입니다.
                </p>
              </div>
              <div className="space-y-3">
                {reviewCandidates.slice(0, 4).map(({ book, diaryCount }) => (
                  <button
                    key={book._id}
                    type="button"
                    onClick={() => navigate(`/reviews/new?bookId=${book._id}`)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-paper-200/70 bg-white/60 p-3 text-left transition-colors hover:border-paper-300 hover:bg-white/80"
                  >
                    <div className="book-paper-frame h-16 w-11 shrink-0 overflow-hidden rounded-md bg-stone-100">
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={`${book.title} 표지`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookCheck className="m-auto mt-5 h-5 w-5 text-stone-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-900 group-hover:text-primary-700">
                        {book.title}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        {book.author}
                      </p>
                      <p className="mt-2 text-xs font-bold text-primary-700">
                        일기 {diaryCount}건
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* Diary List Modal */}
      {selectedDate && (
        <DiaryListModal date={selectedDate} onClose={handleCloseModal} />
      )}
    </m.div>
  );
}
