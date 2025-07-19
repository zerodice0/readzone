import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  User, 
  MessageCircle, 
  Heart,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { bookService, type Book, type BookPost } from '../services/bookService';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';
import PostCard from '../components/posts/PostCard';
import LibraryBookActions from '../components/library/LibraryBookActions';

const BookDetailPage: React.FC = () => {
  const { isbn } = useParams<{ isbn: string }>();
  const { user } = useAuthStore();
  const [book, setBook] = useState<Book | null>(null);
  const [posts, setPosts] = useState<BookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'posts'>('info');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (isbn) {
      loadBookDetail();
      loadBookPosts();
    }
  }, [isbn]);

  const loadBookDetail = async () => {
    if (!isbn) return;

    try {
      setLoading(true);
      setError(null);
      const bookData = await bookService.getBookByIsbn(isbn);
      setBook(bookData);
    } catch (err) {
      console.error('도서 정보 로드 실패:', err);
      setError('도서 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadBookPosts = async (page = 1) => {
    if (!isbn) return;

    try {
      setPostsLoading(true);
      const response = await bookService.getBookPosts(isbn, { page, limit: 10 });
      
      if (page === 1) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }
      
      setPagination(response.pagination);
    } catch (err) {
      console.error('게시글 로드 실패:', err);
      if (page === 1) {
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setPostsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !postsLoading) {
      loadBookPosts(pagination.page + 1);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '정보 없음';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return '정보 없음';
    return price.toLocaleString('ko-KR') + '원';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">도서 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              도서 정보를 불러올 수 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              {error || '도서를 찾을 수 없습니다.'}
            </p>
            <Button onClick={loadBookDetail} variant="outline">
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 도서 상세 정보 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 도서 표지 */}
            <div className="flex-shrink-0">
              {book.thumbnail ? (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="w-48 h-64 object-cover rounded-lg shadow-md mx-auto"
                />
              ) : (
                <div className="w-48 h-64 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                  <BookOpen className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* 도서 정보 */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {book.title}
              </h1>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <User className="w-5 h-5 mr-2" />
                  <span>{book.authors.join(', ')}</span>
                </div>
                
                {book.publisher && (
                  <div className="flex items-center text-gray-600">
                    <BookOpen className="w-5 h-5 mr-2" />
                    <span>{book.publisher}</span>
                  </div>
                )}
                
                {book.publishedDate && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span>{formatDate(book.publishedDate)}</span>
                  </div>
                )}

                {book.pageCount && (
                  <div className="flex items-center text-gray-600">
                    <FileText className="w-5 h-5 mr-2" />
                    <span>{book.pageCount}쪽</span>
                  </div>
                )}
                
                {(book.price || book.salePrice) && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">가격:</span>
                    {book.salePrice && book.salePrice !== book.price ? (
                      <div className="flex items-center space-x-2">
                        <span className="line-through text-gray-400">
                          {formatPrice(book.price)}
                        </span>
                        <span className="text-red-600 font-semibold">
                          {formatPrice(book.salePrice)}
                        </span>
                      </div>
                    ) : (
                      <span>{formatPrice(book.price)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* 통계 */}
              {book.stats && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {book.stats.postsCount}
                    </div>
                    <div className="text-sm text-gray-600">독서 기록</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {book.stats.libraryCount}
                    </div>
                    <div className="text-sm text-gray-600">서재 추가</div>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex flex-wrap gap-3">
                {book.url && (
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    상세 정보 보기
                  </a>
                )}
                
                {user && (
                  <Button variant="outline">
                    <Heart className="w-4 h-4 mr-2" />
                    북마크
                  </Button>
                )}
              </div>
            </div>

            {/* 서재 관리 */}
            {user && (
              <div className="flex-shrink-0 lg:w-80">
                <LibraryBookActions bookId={book.id} />
              </div>
            )}
          </div>

          {/* 도서 설명 */}
          {book.description && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                도서 소개
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {book.description}
              </p>
            </div>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              도서 정보
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              독서 기록 ({book.stats?.postsCount || 0})
            </button>
          </nav>
        </div>

        {/* 컨텐츠 */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              추가 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">ISBN:</span>
                <span className="ml-2 text-gray-600">{book.isbn}</span>
              </div>
              {book.categories && book.categories.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">카테고리:</span>
                  <span className="ml-2 text-gray-600">
                    {book.categories.join(', ')}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">상태:</span>
                <span className="ml-2 text-gray-600">{book.status}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div>
            {postsLoading && posts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">독서 기록을 불러오는 중...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md">
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    독서 기록이 없습니다
                  </h3>
                  <p className="text-gray-600">
                    이 도서에 대한 첫 번째 독서 기록을 작성해보세요!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                
                {/* 더 보기 버튼 */}
                {pagination.page < pagination.totalPages && (
                  <div className="text-center">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      loading={postsLoading}
                      disabled={postsLoading}
                    >
                      더 많은 독서 기록 보기
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetailPage;