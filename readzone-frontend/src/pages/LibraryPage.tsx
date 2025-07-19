import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  BarChart3,
  BookMarked,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  X
} from 'lucide-react';
import { useLibraryStore, getStatusLabel, getStatusColor } from '../stores/libraryStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import type { LibraryStatus } from '../services/libraryService';

const LibraryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LibraryStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    libraryBooks,
    libraryStats,
    pagination,
    isLoading,
    error,
    fetchLibraryBooks,
    fetchLibraryStats,
    setFilters,
    clearError,
  } = useLibraryStore();

  // 초기 데이터 로드
  useEffect(() => {
    fetchLibraryStats();
    fetchLibraryBooks({ page: 1, limit: 12 });
  }, [fetchLibraryStats, fetchLibraryBooks]);

  // 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    const filters: any = {};
    if (statusFilter) filters.status = statusFilter;
    if (searchQuery.trim()) filters.search = searchQuery.trim();

    setFilters(filters);
    fetchLibraryBooks({ page: currentPage, limit: 12, ...filters });
  }, [statusFilter, searchQuery, currentPage, setFilters, fetchLibraryBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getProgressPercentage = (currentPage: number, totalPages: number | null) => {
    if (!totalPages || totalPages === 0) return 0;
    return Math.round((currentPage / totalPages) * 100);
  };

  const statusOptions = [
    { value: '', label: '전체' },
    { value: 'want_to_read', label: '읽고 싶은 책' },
    { value: 'reading', label: '읽는 중' },
    { value: 'completed', label: '완료' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
                내 서재
              </h1>
              <p className="text-gray-600 mt-2">나만의 독서 기록을 관리하세요</p>
            </div>
            <Link to="/search">
              <Button className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                책 추가하기
              </Button>
            </Link>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        {libraryStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{libraryStats.totalBooks}</h3>
                  <p className="text-sm text-gray-600">전체 도서</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookMarked className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{libraryStats.stats.want_to_read}</h3>
                  <p className="text-sm text-gray-600">읽고 싶은 책</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{libraryStats.stats.reading}</h3>
                  <p className="text-sm text-gray-600">읽는 중</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{libraryStats.stats.completed}</h3>
                  <p className="text-sm text-gray-600">완료</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 현재 읽고 있는 책 */}
        {libraryStats?.currentlyReading && libraryStats.currentlyReading.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              현재 읽고 있는 책
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {libraryStats.currentlyReading.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {item.book.thumbnail ? (
                        <img
                          src={item.book.thumbnail}
                          alt={item.book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.book.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.book.authors.join(', ')}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{item.currentPage} / {item.totalPages || '?'} 페이지</span>
                          <span>{item.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${item.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="책 제목이나 작가로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LibraryStatus | '')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="submit" onClick={handleSearch}>
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 도서 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading && libraryBooks.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 animate-pulse" />
              <p className="text-gray-500">서재를 불러오는 중...</p>
            </div>
          ) : libraryBooks.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">서재가 비어있습니다</h3>
              <p className="text-gray-600 mb-4">
                {statusFilter || searchQuery
                  ? '검색 조건에 맞는 책이 없습니다.'
                  : '첫 번째 책을 추가해보세요!'}
              </p>
              <Link to="/search">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  책 추가하기
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {libraryBooks.map((libraryBook) => (
                  <div key={libraryBook.id} className="group relative">
                    <Link
                      to={`/books/${libraryBook.book.isbn}`}
                      className="block bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          {libraryBook.book.thumbnail ? (
                            <img
                              src={libraryBook.book.thumbnail}
                              alt={libraryBook.book.title}
                              className="w-16 h-20 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {libraryBook.book.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2">
                            {libraryBook.book.authors.join(', ')}
                          </p>
                          
                          {/* 상태 배지 */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(libraryBook.status)}`}>
                            {getStatusLabel(libraryBook.status)}
                          </span>

                          {/* 진행률 (읽는 중인 경우) */}
                          {libraryBook.status === 'reading' && libraryBook.totalPages && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>{libraryBook.currentPage} / {libraryBook.totalPages}</span>
                                <span>{getProgressPercentage(libraryBook.currentPage, libraryBook.totalPages)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                                  style={{ 
                                    width: `${getProgressPercentage(libraryBook.currentPage, libraryBook.totalPages)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* 완료 날짜 */}
                          {libraryBook.status === 'completed' && libraryBook.finishedAt && (
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(libraryBook.finishedAt)} 완료
                            </div>
                          )}

                          {/* 메모 */}
                          {libraryBook.notes && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              "{libraryBook.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 p-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    이전
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {pagination.totalPages > 5 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => handlePageChange(pagination.totalPages)}
                          className={`px-3 py-2 text-sm rounded-lg ${
                            currentPage === pagination.totalPages
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pagination.totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages || isLoading}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryPage;