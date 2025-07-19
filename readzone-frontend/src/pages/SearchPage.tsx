import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookOpen, Hash, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { bookService, type BookSearchResult } from '../services/bookService';
import { searchService, type SearchResults as SearchResultsType, type SearchType } from '../services/searchService';
import SearchResultsComponent from '../components/search/SearchResults';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<'books' | 'content'>('content');
  const [activeTab, setActiveTab] = useState<SearchType>('all');
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [contentResults, setContentResults] = useState<SearchResultsType | null>(null);
  const [popularTags, setPopularTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookPagination, setBookPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
  });

  useEffect(() => {
    loadPopularTags();
    
    // URL 파라미터에서 검색어가 있으면 자동 검색
    const query = searchParams.get('q');
    const type = searchParams.get('type') as 'books' | 'content';
    if (query) {
      setSearchQuery(query);
      setSearchType(type || 'content');
      handleSearch(query, type || 'content');
    }
  }, []);

  const loadPopularTags = async () => {
    try {
      const tags = await searchService.getPopularTags(20);
      setPopularTags(tags);
    } catch (err) {
      console.error('인기 태그 로드 실패:', err);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    handleSearch(searchQuery.trim(), searchType);
  };

  const handleSearch = async (query: string, type: 'books' | 'content') => {
    setIsLoading(true);
    setError('');
    
    // URL 업데이트
    setSearchParams({ q: query, type });

    try {
      if (type === 'books') {
        const response = await bookService.searchBooks({
          query,
          page: 1,
          limit: 10,
        });
        setBookResults(response.books);
        setBookPagination(response.pagination);
        setContentResults(null);
      } else {
        const response = await searchService.searchAll(query, {
          type: activeTab === 'all' ? undefined : activeTab,
          page: 1,
          limit: 20
        });
        setContentResults(response);
        setBookResults([]);
      }
    } catch (error: any) {
      console.error('검색 오류:', error);
      setError(error.response?.data?.error?.message || '검색 중 오류가 발생했습니다.');
      setBookResults([]);
      setContentResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = async (tab: SearchType) => {
    setActiveTab(tab);
    if (searchQuery.trim() && searchType === 'content') {
      setIsLoading(true);
      try {
        const response = await searchService.searchAll(searchQuery.trim(), {
          type: tab === 'all' ? undefined : tab,
          page: 1,
          limit: 20
        });
        setContentResults(response);
      } catch (error: any) {
        console.error('탭 변경 검색 오류:', error);
        setError('검색 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLoadMore = async () => {
    if (!searchQuery.trim() || !contentResults) return;

    setIsLoading(true);
    try {
      const response = await searchService.searchAll(searchQuery.trim(), {
        type: activeTab === 'all' ? undefined : activeTab,
        page: contentResults.pagination.page + 1,
        limit: 20
      });

      // 결과 병합
      setContentResults({
        ...response,
        posts: [...contentResults.posts, ...response.posts],
        users: [...contentResults.users, ...response.users],
        tags: [...contentResults.tags, ...response.tags],
      });
    } catch (error: any) {
      console.error('더 보기 오류:', error);
      setError('더 많은 결과를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookLoadMore = async () => {
    if (!searchQuery.trim() || !bookPagination.hasNext) return;

    setIsLoading(true);
    try {
      const response = await bookService.searchBooks({
        query: searchQuery,
        page: bookPagination.page + 1,
        limit: bookPagination.limit,
      });
      
      setBookResults(prev => [...prev, ...response.books]);
      setBookPagination(response.pagination);
    } catch (error: any) {
      console.error('도서 더 보기 오류:', error);
      setError('더 많은 도서를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '정보 없음';
    return price.toLocaleString('ko-KR') + '원';
  };

  const hasResults = searchType === 'books' 
    ? bookResults.length > 0 
    : contentResults && (contentResults.posts.length > 0 || contentResults.users.length > 0 || contentResults.tags.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 검색 헤더 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">검색</h1>
          
          {/* 검색 폼 */}
          <form onSubmit={handleSearchSubmit} className="mb-4 sm:mb-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* 검색 입력 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  type="text"
                  placeholder="검색어를 입력하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 text-sm sm:text-base"
                />
              </div>
              
              {/* 검색 타입 + 검색 버튼 */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                {/* 검색 타입 선택 */}
                <div className="flex space-x-2 flex-1">
                  <Button
                    type="button"
                    variant={searchType === 'content' ? 'primary' : 'outline'}
                    onClick={() => setSearchType('content')}
                    className="flex items-center flex-1 sm:flex-none justify-center"
                    size="sm"
                  >
                    <Hash className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">콘텐츠</span>
                  </Button>
                  <Button
                    type="button"
                    variant={searchType === 'books' ? 'primary' : 'outline'}
                    onClick={() => setSearchType('books')}
                    className="flex items-center flex-1 sm:flex-none justify-center"
                    size="sm"
                  >
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">도서</span>
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  disabled={!searchQuery.trim() || isLoading}
                  loading={isLoading}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  <span className="text-sm sm:text-base">검색</span>
                </Button>
              </div>
            </div>
          </form>

          {/* 인기 태그 */}
          {!searchQuery && popularTags.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">인기 태그</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {popularTags.slice(0, window.innerWidth < 640 ? 10 : 15).map((tag) => (
                  <button
                    key={tag.tag}
                    onClick={() => {
                      setSearchQuery(tag.tag);
                      setSearchType('content');
                      handleSearch(tag.tag, 'content');
                    }}
                    className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-xs sm:text-sm transition-colors"
                  >
                    <Hash className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                    <span className="truncate max-w-[80px] sm:max-w-none">{tag.tag}</span>
                    <span className="ml-1 sm:ml-2 text-xs opacity-75">
                      {tag.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 검색 결과 */}
        {searchQuery && (
          <div>
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                <span className="hidden sm:inline">'{searchQuery}' 검색 결과</span>
                <span className="sm:hidden">검색 결과</span>
              </h2>
            </div>

            {/* 콘텐츠 검색 결과 */}
            {searchType === 'content' && contentResults && (
              <SearchResultsComponent
                results={contentResults}
                query={searchQuery}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onLoadMore={handleLoadMore}
                loading={isLoading}
                hasMore={contentResults.pagination.page < contentResults.pagination.totalPages}
              />
            )}

            {/* 도서 검색 결과 */}
            {searchType === 'books' && (
              <div>
                {isLoading && bookResults.length === 0 ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600 text-sm sm:text-base">도서를 검색하는 중...</span>
                  </div>
                ) : bookResults.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {bookResults.map((book, index) => (
                        <div key={`${book.isbn}-${index}`} className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                          <div className="flex space-x-3 sm:space-x-4">
                            <div className="flex-shrink-0">
                              {book.thumbnail ? (
                                <img
                                  src={book.thumbnail}
                                  alt={book.title}
                                  className="w-12 h-16 sm:w-14 sm:h-18 lg:w-16 lg:h-20 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-16 sm:w-14 sm:h-18 lg:w-16 lg:h-20 bg-gray-200 rounded flex items-center justify-center">
                                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">
                                {book.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 line-clamp-1">
                                {book.authors.join(', ')}
                              </p>
                              {book.publisher && (
                                <p className="text-xs text-gray-500 mb-1 sm:mb-2 line-clamp-1">
                                  {book.publisher}
                                </p>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-xs sm:text-sm font-medium text-blue-600">
                                  {formatPrice(book.salePrice || book.price)}
                                </span>
                                {book.url && (
                                  <a
                                    href={book.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 더 보기 버튼 */}
                    {bookPagination.hasNext && (
                      <div className="text-center">
                        <Button
                          onClick={handleBookLoadMore}
                          variant="outline"
                          loading={isLoading}
                          disabled={isLoading}
                        >
                          더 많은 도서 보기
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      도서를 찾을 수 없습니다
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 px-4">
                      '{searchQuery}' 와 관련된 도서가 없습니다.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 검색 결과 없음 */}
            {searchType === 'content' && contentResults && !hasResults && !isLoading && (
              <div className="text-center py-8 sm:py-12">
                <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-sm sm:text-base text-gray-600 px-4">
                  '{searchQuery}' 와 관련된 내용을 찾을 수 없습니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 검색 전 상태 */}
        {!searchQuery && (
          <div className="text-center py-8 sm:py-12">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              ReadZone에서 검색해보세요
            </h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              게시글, 사용자, 태그, 도서를 검색할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;