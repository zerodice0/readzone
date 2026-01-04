import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Calendar } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

interface BookDiaryListProps {
  bookId: Id<'books'>;
  className?: string;
}

export function BookDiaryList({ bookId, className = '' }: BookDiaryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const diaries = useQuery(api.readingDiaries.getByUserAndBook, { bookId });

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" />내 독서 일기 ({diaries.length})
      </h3>
      <div className="space-y-2">
        {diaries.map((diary) => {
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
                  <p className="text-xs text-stone-500 mb-1">
                    {formatDate(diary.date)}
                  </p>
                  <p className="text-sm text-stone-700 line-clamp-2">
                    {isExpanded ? '' : previewContent}
                  </p>
                </div>
                <div className="text-stone-400 flex-shrink-0 mt-1">
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
  );
}
