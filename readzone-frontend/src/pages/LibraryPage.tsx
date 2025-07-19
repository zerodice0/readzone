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
import LazyImage from '../components/ui/LazyImage';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
                내 서재
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">나만의 독서 기록을 관리하세요</p>
            </div>
            <Link to="/search" className="w-full sm:w-auto">
              <Button className="flex items-center justify-center w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">책 추가하기</span>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{libraryStats.totalBooks}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">전체 도서</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookMarked className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{libraryStats.stats.want_to_read}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">읽고 싶은 책</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{libraryStats.stats.reading}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">읽는 중</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{libraryStats.stats.completed}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">완료</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 현재 읽고 있는 책 */}
        {libraryStats?.currentlyReading && libraryStats.currentlyReading.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              현재 읽고 있는 책
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {libraryStats.currentlyReading.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {item.book.thumbnail ? (
                        <LazyImage
                          src={item.book.thumbnail}
                          alt={item.book.title}
                          className="w-10 h-12 sm:w-12 sm:h-16 object-cover rounded"
                          placeholderClassName="bg-gray-200 flex items-center justify-center"
                        />
                      ) : (
                        <div className="w-10 h-12 sm:w-12 sm:h-16 bg-gray-200 rounded flex items-center justify-center">
                          <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">
                        {item.book.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {item.book.authors.join(', ')}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span className="truncate">{item.currentPage} / {item.totalPages || '?'} 페이지</span>
                          <span className="ml-2">{item.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div
                            className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all"
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
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="책 제목이나 작가로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
            </form>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LibraryStatus | '')}
                className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="submit" onClick={handleSearch} className="w-full sm:w-auto" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                <span className="sm:hidden">검색</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6">
                {libraryBooks.map((libraryBook) => (
                  <div key={libraryBook.id} className="group relative">
                    <Link
                      to={`/books/${libraryBook.book.isbn}`}
                      className="block bg-gray-50 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0">
                          {libraryBook.book.thumbnail ? (
                            <LazyImage
                              src={libraryBook.book.thumbnail}
                              alt={libraryBook.book.title}
                              className="w-12 h-16 sm:w-14 sm:h-18 lg:w-16 lg:h-20 object-cover rounded"
                              placeholderClassName="bg-gray-200 flex items-center justify-center"
                            />
                          ) : (
                            <div className="w-12 h-16 sm:w-14 sm:h-18 lg:w-16 lg:h-20 bg-gray-200 rounded flex items-center justify-center">
                              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {libraryBook.book.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {libraryBook.book.authors.join(', ')}
                          </p>
                          
                          {/* 상태 배지 */}
                          <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(libraryBook.status)}`}>
                            {getStatusLabel(libraryBook.status)}
                          </span>

                          {/* 진행률 (읽는 중인 경우) */}
                          {libraryBook.status === 'reading' && libraryBook.totalPages && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span className="truncate">{libraryBook.currentPage} / {libraryBook.totalPages}</span>
                                <span className="ml-1">{getProgressPercentage(libraryBook.currentPage, libraryBook.totalPages)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5">
                                <div
                                  className="bg-blue-600 h-1 sm:h-1.5 rounded-full transition-all"
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
                              <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{formatDate(libraryBook.finishedAt)} 완료</span>
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
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 p-4 sm:p-6 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="text-xs sm:text-sm"
                  >
                    이전
                  </Button>
                  
                  <div className="flex items-center space-x-0.5 sm:space-x-1">
                    {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {pagination.totalPages > (window.innerWidth < 640 ? 3 : 5) && (
                      <>
                        <span className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>
                        <button
                          onClick={() => handlePageChange(pagination.totalPages)}
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg ${
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
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages || isLoading}
                    className="text-xs sm:text-sm"
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