import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserBooksQueryOptions } from '@/lib/api/user';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface BooksListProps {
  userid: string;
  isOwner: boolean;
}

export const BooksList: React.FC<BooksListProps> = ({ userid }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'reading' | 'want_to_read'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'rating'>('recent');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    ...getUserBooksQueryOptions(userid, {
      ...(statusFilter !== 'all' && { status: statusFilter }),
      sort: sortBy
    }),
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
  });

  const loadMoreRef = useInfiniteScroll({
    hasMore: hasNextPage || false,
    isLoading: isFetchingNextPage,
    onLoadMore: async () => {
      await fetchNextPage();
    },
  });

  const allBooks = data?.pages.flatMap(page => page.books) ?? [];
  const summary = data?.pages[0]?.summary;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">
          서재를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 서재 통계 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalBooks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">전체</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.readBooks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">읽음</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.readingBooks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">읽는 중</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.wantToReadBooks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">읽고 싶음</div>
          </div>
        </div>
      )}

      {/* 필터 및 정렬 옵션 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <label htmlFor="status-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            상태:
          </label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="read">읽음</option>
            <option value="reading">읽는 중</option>
            <option value="want_to_read">읽고 싶음</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            정렬:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="recent">최신순</option>
            <option value="title">제목순</option>
            <option value="rating">평점순</option>
          </select>
        </div>
      </div>

      {/* 도서 목록 */}
      {allBooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {statusFilter === 'all' ? '아직 등록한 도서가 없습니다.' : `${statusFilter} 상태의 도서가 없습니다.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allBooks.map((book) => (
            <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex space-x-4">
                {book.book.thumbnail && (
                  <img
                    src={book.book.thumbnail}
                    alt={book.book.title}
                    className="w-16 h-20 object-cover rounded"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {book.book.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {book.book.author}
                  </p>

                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      book.status === 'read'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : book.status === 'reading'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>
                      {book.status === 'read' ? '읽음' : book.status === 'reading' ? '읽는 중' : '읽고 싶음'}
                    </span>

                    {book.rating && (
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                          {book.rating}
                        </span>
                      </div>
                    )}
                  </div>

                  {book.reviewId && (
                    <div className="mt-2">
                      <span className="text-xs text-blue-600 dark:text-blue-400">독후감 작성됨</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {book.readAt ? `읽은 날짜: ${new Date(book.readAt).toLocaleDateString()}` :
                     `등록일: ${new Date(book.addedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 무한 스크롤 센티넬 */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-6">
        {isFetchingNextPage && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">더 불러오는 중...</span>
          </div>
        )}
      </div>
    </div>
  );
};