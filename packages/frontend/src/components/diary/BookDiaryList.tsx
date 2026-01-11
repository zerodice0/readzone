import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

interface BookDiaryListProps {
  bookId: Id<'books'>;
  className?: string;
}

type SortOrder = 'newest' | 'oldest';

export function BookDiaryList({ bookId, className = '' }: BookDiaryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('oldest');

  const diaries = useQuery(api.readingDiaries.getByUserAndBook, { bookId });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 날짜별 그룹핑 (작성 순서 유지) - hooks는 early return 전에 위치해야 함
  const groupedDiaries = useMemo(() => {
    if (!diaries || diaries.length === 0) return [];

    const groups = new Map<string, typeof diaries>();

    for (const diary of diaries) {
      const dateKey = formatDate(diary.date);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(diary);
    }

    const entries = Array.from(groups.entries());
    entries.sort((a, b) => {
      const dateA = a[1][0].date;
      const dateB = b[1][0].date;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return entries;
  }, [diaries, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Early returns는 모든 hooks 이후에 위치
  if (diaries === undefined) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-4 bg-stone-200 rounded w-1/2 mb-3" />
        <div className="space-y-2">
          <div className="h-16 bg-stone-100 rounded" />
          <div className="h-16 bg-stone-100 rounded" />
        </div>
      </div>
    );
  }

  if (diaries.length === 0) {
    return (
      <div className={`${className} text-center py-6`}>
        <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-2" />
        <p className="text-sm text-stone-500">
          아직 작성한 독서 일기가 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <Calendar className="w-4 h-4" />내 독서 일기 ({diaries.length})
        </h3>
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="appearance-none text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 pl-2 pr-6 py-1 rounded cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-stone-300"
          >
            <option value="newest">최신 날짜순</option>
            <option value="oldest">오래된 날짜순</option>
          </select>
          <ArrowUpDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-4">
        {groupedDiaries.map(([dateKey, diariesInDate]) => (
          <div key={dateKey}>
            <p className="text-xs font-medium text-stone-500 mb-2 pb-1 border-b border-stone-200">
              {dateKey}
            </p>
            <div className="space-y-2">
              {diariesInDate.map((diary) => {
                const isExpanded = expandedId === diary._id;
                const previewContent =
                  diary.content.length > 50
                    ? diary.content.slice(0, 50) + '...'
                    : diary.content;

                return (
                  <div
                    key={diary._id}
                    className="bg-stone-50 rounded-lg border border-stone-200 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(diary._id)}
                      className="w-full p-3 text-left flex items-start justify-between gap-2 hover:bg-stone-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-700 line-clamp-2">
                          {isExpanded ? '' : previewContent}
                        </p>
                      </div>
                      <div className="text-stone-400 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0">
                        <p className="text-sm text-stone-700 whitespace-pre-wrap">
                          {diary.content}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
