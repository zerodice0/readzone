# ReadZone 프론트엔드 아키텍처 가이드

## 프로젝트 구조

### 디렉토리 구조
```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── ui/              # 기본 UI 컴포넌트 (Button, Input 등)
│   ├── common/          # 공통 컴포넌트 (Header, Footer, Layout)
│   ├── posts/           # 게시글 관련 컴포넌트
│   ├── comments/        # 댓글 관련 컴포넌트
│   ├── library/         # 서재 관련 컴포넌트
│   ├── notifications/   # 알림 관련 컴포넌트
│   ├── reading-goals/   # 독서 목표 관련 컴포넌트
│   ├── search/          # 검색 관련 컴포넌트
│   ├── pwa/            # PWA 관련 컴포넌트
│   └── dev/            # 개발용 컴포넌트
├── pages/              # 페이지 컴포넌트
├── services/           # API 서비스
├── stores/             # Zustand 상태 관리
├── hooks/              # 커스텀 훅
├── utils/              # 유틸리티 함수
├── types/              # TypeScript 타입 정의
└── styles/             # 전역 스타일
```

## 컴포넌트 아키텍처

### 컴포넌트 분류

#### 1. UI 컴포넌트 (Presentational Components)
순수하게 UI만 담당하는 컴포넌트입니다.

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
          'border border-gray-300 bg-transparent hover:bg-gray-50': variant === 'outline',
          'hover:bg-gray-100': variant === 'ghost',
        },
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-base': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;
```

#### 2. 기능 컴포넌트 (Container Components)
비즈니스 로직과 상태를 관리하는 컴포넌트입니다.

```typescript
// components/posts/PostCard.tsx
interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  showActions?: boolean;
  className?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  showActions = true,
  className,
}) => {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.stats.likesCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = useCallback(async () => {
    if (!user || isLoading) return;

    try {
      setIsLoading(true);
      
      if (isLiked) {
        await postsAPI.unlike(post.id);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await postsAPI.like(post.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
      
      onLike?.(post.id);
    } catch (error) {
      console.error('Like action failed:', error);
      // 에러 시 상태 롤백
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLoading(false);
    }
  }, [post.id, user, isLiked, isLoading, onLike]);

  const handleComment = useCallback(() => {
    onComment?.(post.id);
  }, [post.id, onComment]);

  return (
    <article className={cn('bg-white rounded-lg shadow-md p-6', className)}>
      {/* 사용자 정보 */}
      <div className="flex items-center mb-4">
        <img
          src={post.user.avatar || '/default-avatar.png'}
          alt={post.user.displayName || post.user.username}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h3 className="font-semibold text-gray-900">
            {post.user.displayName || post.user.username}
          </h3>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
          </p>
        </div>
      </div>

      {/* 도서 정보 */}
      <div className="flex mb-4">
        <img
          src={post.book.thumbnail || '/default-book.png'}
          alt={post.book.title}
          className="w-16 h-20 object-cover rounded mr-4"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{post.book.title}</h4>
          <p className="text-sm text-gray-600 mb-2">
            {post.book.authors.join(', ')}
          </p>
          {post.rating && (
            <div className="flex items-center">
              <StarRating rating={post.rating} readonly size="sm" />
              <span className="ml-2 text-sm text-gray-600">({post.rating}/5)</span>
            </div>
          )}
        </div>
      </div>

      {/* 게시글 내용 */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        
        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={!user || isLoading}
              className={cn(
                'flex items-center space-x-1 px-3 py-1 rounded-full transition-colors',
                isLiked
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
              <span className="text-sm">{likesCount}</span>
            </button>
            
            <button
              onClick={handleComment}
              className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.stats.commentsCount}</span>
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            진행률: {post.readingProgress}%
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;
```

#### 3. 페이지 컴포넌트
라우팅과 연결되는 최상위 컴포넌트입니다.

```typescript
// pages/DashboardPage.tsx
const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로딩
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [postsResponse, statsResponse] = await Promise.all([
          postsAPI.getAll({ type: 'following', limit: 20 }),
          statisticsAPI.getUserStats(),
        ]);
        
        setPosts(postsResponse.data.items);
      } catch (err) {
        setError('데이터를 불러오는데 실패했습니다.');
        console.error('Dashboard data loading failed:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        안녕하세요, {user?.displayName || user?.username}님!
      </h1>
      
      {/* 대시보드 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 메인 피드 */}
        <div className="lg:col-span-2">
          <PostFeed posts={posts} />
        </div>
        
        {/* 사이드바 */}
        <div className="space-y-6">
          <ReadingGoalCard />
          <RecentBooksCard />
          <RecommendedUsersCard />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
```

## 상태 관리 (Zustand)

### 스토어 구조 패턴
```typescript
// stores/authStore.ts
interface AuthState {
  // 상태
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // 액션
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 액션 구현
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authAPI.login({ email, password });
          const { user, token } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || '로그인에 실패했습니다.';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        // API 호출 (실패해도 로컬 상태는 정리)
        authAPI.logout().catch(console.error);
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshUser: async () => {
        try {
          const { token } = get();
          if (!token) return;

          set({ isLoading: true });
          
          const response = await authAPI.getMe();
          const user = response.data.data;
          
          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Refresh user error:', error);
          
          // 토큰이 유효하지 않으면 로그아웃
          if (error.response?.status === 401) {
            get().logout();
          } else {
            set({
              isLoading: false,
              error: '사용자 정보를 불러오는데 실패했습니다.',
            });
          }
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 복합 상태 관리 패턴
```typescript
// stores/libraryStore.ts
interface LibraryState {
  books: LibraryBook[];
  currentBook: LibraryBook | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status: 'all' | 'reading' | 'completed' | 'want_to_read';
    sortBy: 'recent' | 'title' | 'author';
  };
}

interface LibraryActions {
  fetchBooks: () => Promise<void>;
  addBook: (isbn: string, status: string) => Promise<void>;
  updateBook: (id: string, updates: Partial<LibraryBook>) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  setFilters: (filters: Partial<LibraryState['filters']>) => void;
  clearError: () => void;
}

export const useLibraryStore = create<LibraryState & LibraryActions>((set, get) => ({
  // 상태
  books: [],
  currentBook: null,
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    sortBy: 'recent',
  },

  // 액션
  fetchBooks: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { filters } = get();
      const params = {
        status: filters.status !== 'all' ? filters.status : undefined,
        sortBy: filters.sortBy,
      };
      
      const response = await libraryAPI.getBooks(params);
      const books = response.data.data.items;
      
      set({ books, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || '서재 정보를 불러오는데 실패했습니다.',
      });
    }
  },

  addBook: async (isbn: string, status: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await libraryAPI.addBook({ isbn, status });
      const newBook = response.data.data;
      
      set(state => ({
        books: [newBook, ...state.books],
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || '도서 추가에 실패했습니다.',
      });
      throw error;
    }
  },

  updateBook: async (id: string, updates: Partial<LibraryBook>) => {
    try {
      const response = await libraryAPI.updateBook(id, updates);
      const updatedBook = response.data.data;
      
      set(state => ({
        books: state.books.map(book => 
          book.id === id ? updatedBook : book
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || '도서 정보 수정에 실패했습니다.',
      });
      throw error;
    }
  },

  removeBook: async (id: string) => {
    try {
      await libraryAPI.removeBook(id);
      
      set(state => ({
        books: state.books.filter(book => book.id !== id),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || '도서 삭제에 실패했습니다.',
      });
      throw error;
    }
  },

  setFilters: (newFilters: Partial<LibraryState['filters']>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
    }));
    
    // 필터 변경 시 자동으로 데이터 다시 로드
    get().fetchBooks();
  },

  clearError: () => set({ error: null }),
}));
```

## 커스텀 훅 패턴

### API 호출 훅
```typescript
// hooks/useApi.ts
interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  dependencies?: any[];
}

export function useApi<T>(
  apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      const result = response.data.data;
      
      setData(result);
      options.onSuccess?.(result);
      
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || '요청에 실패했습니다.';
      setError(errorMessage);
      options.onError?.(new Error(errorMessage));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, options]);

  // 의존성 배열이 있으면 자동 실행
  useEffect(() => {
    if (options.dependencies) {
      execute();
    }
  }, options.dependencies || []);

  return { data, loading, error, execute, refetch: execute };
}

// 사용 예시
const PostDetail: React.FC<{ postId: string }> = ({ postId }) => {
  const { data: post, loading, error } = useApi(
    () => postsAPI.getById(postId),
    {
      dependencies: [postId],
      onError: (error) => {
        console.error('Failed to load post:', error);
      },
    }
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;
  if (!post) return <div>Post not found</div>;

  return <PostCard post={post} />;
};
```

### 무한 스크롤 훅
```typescript
// hooks/useInfiniteScroll.ts
interface UseInfiniteScrollOptions<T> {
  fetchMore: (cursor?: string) => Promise<CursorPaginatedResult<T>>;
  initialData?: T[];
  enabled?: boolean;
}

export function useInfiniteScroll<T>({
  fetchMore,
  initialData = [],
  enabled = true,
}: UseInfiniteScrollOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchMore(cursor || undefined);
      
      setData(prev => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [fetchMore, cursor, loading, hasMore, enabled]);

  // Intersection Observer를 사용한 자동 로딩
  const { ref: loadMoreRef } = useIntersectionObserver({
    onIntersect: loadMore,
    enabled: hasMore && !loading,
  });

  // 초기 데이터 로드
  useEffect(() => {
    if (enabled && data.length === 0) {
      loadMore();
    }
  }, [enabled]);

  const refresh = useCallback(async () => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    
    try {
      setLoading(true);
      const result = await fetchMore();
      setData(result.items);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [fetchMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    loadMoreRef,
    refresh,
  };
}
```

## 에러 처리 패턴

### Error Boundary
```typescript
// components/common/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 에러 리포팅 서비스에 전송
    // reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              문제가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-6">
              페이지를 불러오는 중 오류가 발생했습니다.
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              페이지 새로고침
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 전역 에러 처리
```typescript
// utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: any): never {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.error?.message || '서버 오류가 발생했습니다.';
    const code = data?.error?.code || 'UNKNOWN_ERROR';
    
    throw new AppError(message, code, status);
  } else if (error.request) {
    throw new AppError('네트워크 연결을 확인해주세요.', 'NETWORK_ERROR');
  } else {
    throw new AppError(error.message || '알 수 없는 오류가 발생했습니다.', 'UNKNOWN_ERROR');
  }
}
```

이러한 아키텍처 패턴을 따라 일관성 있고 확장 가능한 프론트엔드 애플리케이션을 구축해주세요.