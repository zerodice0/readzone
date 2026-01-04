import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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
    setSelectedDate(date);
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
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">독서 일기</h1>
          <p className="text-stone-600">날짜별로 독서 기록을 확인하세요</p>
        </div>

        <Button
          onClick={() => navigate('/reading-diary/new')}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          일기 작성
        </Button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
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
