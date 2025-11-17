import { useState } from 'react';
import { useQuery } from 'convex/react';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { api } from 'convex/_generated/api';
import { BookCard } from '../../components/book/BookCard';
import { useDebounce } from '../../hooks/useDebounce';

export default function BooksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Fetch books with stats
  const allBooks = useQuery(api.books.listWithStats, { limit: 50 });

  // Filter books based on search query
  const filteredBooks =
    allBooks && debouncedQuery.trim()
      ? allBooks.filter(
          (book) =>
            book.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
      : allBooks;

  const isLoading = allBooks === undefined;
  const hasBooks = filteredBooks && filteredBooks.length > 0;
  const showNoResults =
    !isLoading && debouncedQuery.trim() && filteredBooks?.length === 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">책 목록</h1>
        <p className="text-stone-600">
          다양한 책들의 독후감을 둘러보고 새로운 책을 발견해보세요
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="책 제목 또는 저자로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mr-2" />
          <span className="text-stone-700">책 목록을 불러오는 중...</span>
        </div>
      )}

      {/* No results */}
      {showNoResults && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-stone-900">
            검색 결과가 없습니다
          </h2>
          <p className="text-stone-600 mb-8">
            &quot;{debouncedQuery}&quot;에 대한 책을 찾을 수 없습니다
          </p>
        </div>
      )}

      {/* Books grid */}
      {hasBooks && (
        <>
          <div className="mb-6">
            <p className="text-sm text-stone-600">
              총{' '}
              <span className="font-semibold text-stone-900">
                {filteredBooks.length}
              </span>
              권의 책
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        </>
      )}

      {/* Empty state (no books at all) */}
      {!isLoading && !searchQuery && filteredBooks?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-stone-900">
            아직 등록된 책이 없습니다
          </h2>
          <p className="text-stone-600">첫 번째 독후감을 작성해보세요!</p>
        </div>
      )}
    </div>
  );
}
