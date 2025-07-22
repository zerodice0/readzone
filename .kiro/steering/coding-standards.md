# ReadZone 코딩 표준 및 베스트 프랙티스

## TypeScript 코딩 표준

### 타입 정의
```typescript
// ✅ 좋은 예: 명확한 인터페이스 정의
interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  createdAt: Date;
}

// ✅ 좋은 예: 유니온 타입 활용
type PostStatus = 'draft' | 'published' | 'archived';

// ❌ 나쁜 예: any 타입 사용
const userData: any = response.data;
```

### 함수 정의
```typescript
// ✅ 좋은 예: 명확한 타입 정의와 JSDoc
/**
 * 사용자 프로필을 업데이트합니다.
 * @param userId - 사용자 ID
 * @param updateData - 업데이트할 데이터
 * @returns 업데이트된 사용자 정보
 */
async function updateUserProfile(
  userId: string,
  updateData: Partial<User>
): Promise<User> {
  // 구현
}

// ❌ 나쁜 예: 타입 정의 없음
async function updateUser(id, data) {
  // 구현
}
```

### 에러 처리
```typescript
// ✅ 좋은 예: 구체적인 에러 타입
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ 좋은 예: 에러 처리
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    // 검증 에러 처리
  } else {
    // 기타 에러 처리
    logger.error('Unexpected error:', error);
  }
  throw error;
}
```

## React 컴포넌트 표준

### 컴포넌트 구조
```typescript
// ✅ 좋은 예: 명확한 Props 인터페이스
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
  className = '',
}) => {
  // 상태 관리
  const [isLiked, setIsLiked] = useState(false);
  
  // 이벤트 핸들러
  const handleLike = useCallback(() => {
    onLike?.(post.id);
    setIsLiked(!isLiked);
  }, [post.id, onLike, isLiked]);
  
  // 렌더링
  return (
    <div className={`post-card ${className}`}>
      {/* 컴포넌트 내용 */}
    </div>
  );
};

export default PostCard;
```

### 커스텀 훅
```typescript
// ✅ 좋은 예: 재사용 가능한 커스텀 훅
interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
      options.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [apiCall, options]);
  
  return { data, loading, error, execute };
}
```

## 백엔드 API 표준

### 컨트롤러 구조
```typescript
// ✅ 좋은 예: 명확한 컨트롤러 구조
export const createPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // 1. 입력 검증
  const validatedData = validateData(createPostSchema, req.body);
  
  // 2. 권한 확인
  const userId = req.user!.id;
  
  // 3. 비즈니스 로직 실행
  const post = await postService.createPost(userId, validatedData);
  
  // 4. 응답 반환
  res.status(201).json({
    success: true,
    data: post,
    message: '게시글이 생성되었습니다.',
  });
});
```

### 서비스 레이어
```typescript
// ✅ 좋은 예: 비즈니스 로직 분리
class PostService {
  async createPost(userId: string, postData: CreatePostData): Promise<Post> {
    // 1. 도서 정보 확인
    const book = await this.bookService.findOrCreateBook(postData.isbn);
    
    // 2. 게시글 생성
    const post = await prisma.post.create({
      data: {
        userId,
        bookId: book.id,
        content: postData.content,
        rating: postData.rating,
        tags: postData.tags,
        isPublic: postData.isPublic,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        book: true,
      },
    });
    
    // 3. 알림 생성 (팔로워들에게)
    await this.notificationService.createPostNotification(post);
    
    return post;
  }
}
```

### 데이터 검증
```typescript
// ✅ 좋은 예: Joi 스키마 정의
export const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  isbn: Joi.string().pattern(/^[0-9]{10,13}$/).required(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  readingProgress: Joi.number().integer().min(0).max(100).default(0),
  tags: Joi.array().items(Joi.string().max(50)).max(5).default([]),
  isPublic: Joi.boolean().default(true),
});
```

## 데이터베이스 쿼리 최적화

### Prisma 쿼리 최적화
```typescript
// ✅ 좋은 예: 필요한 필드만 선택
const posts = await prisma.post.findMany({
  select: {
    id: true,
    content: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
      },
    },
    book: {
      select: {
        id: true,
        title: true,
        authors: true,
        thumbnail: true,
      },
    },
    _count: {
      select: {
        likes: true,
        comments: true,
      },
    },
  },
  where: {
    isPublic: true,
    isDeleted: false,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 20,
  skip: (page - 1) * 20,
});

// ❌ 나쁜 예: 모든 필드 조회
const posts = await prisma.post.findMany({
  include: {
    user: true,
    book: true,
    likes: true,
    comments: true,
  },
});
```

### 트랜잭션 사용
```typescript
// ✅ 좋은 예: 트랜잭션으로 데이터 일관성 보장
async function followUser(followerId: string, followingId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. 팔로우 관계 생성
    const follow = await tx.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
    
    // 2. 알림 생성
    await tx.notification.create({
      data: {
        recipientId: followingId,
        senderId: followerId,
        type: 'follow',
        title: '새로운 팔로워',
        content: '회원님을 팔로우하기 시작했습니다.',
      },
    });
    
    return follow;
  });
}
```

## 스타일링 표준 (Tailwind CSS)

### 클래스 순서
```typescript
// ✅ 좋은 예: 논리적 순서로 클래스 정렬
<div className="
  flex items-center justify-between
  w-full max-w-md
  p-4 mx-auto
  bg-white border border-gray-200 rounded-lg shadow-md
  hover:shadow-lg transition-shadow duration-200
">
  {/* 내용 */}
</div>

// 순서: Layout → Sizing → Spacing → Colors → Effects → Interactions
```

### 커스텀 컴포넌트 스타일
```typescript
// ✅ 좋은 예: cn 유틸리티 함수 사용
import { cn } from '@/utils/cn';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        // 기본 스타일
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        
        // 변형별 스타일
        {
          'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
          'border border-gray-300 bg-transparent hover:bg-gray-50': variant === 'outline',
        },
        
        // 크기별 스타일
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-base': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

## 테스트 작성 표준

### 백엔드 테스트
```typescript
// ✅ 좋은 예: 명확한 테스트 구조
describe('POST /api/posts', () => {
  beforeEach(async () => {
    // 테스트 데이터 설정
    await setupTestData();
  });
  
  afterEach(async () => {
    // 테스트 데이터 정리
    await cleanupTestData();
  });
  
  it('should create a new post with valid data', async () => {
    // Given
    const postData = {
      content: '좋은 책이었습니다.',
      isbn: '9788983920775',
      rating: 5,
      tags: ['소설', '판타지'],
    };
    
    // When
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(201);
    
    // Then
    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe(postData.content);
    expect(response.body.data.rating).toBe(postData.rating);
  });
  
  it('should return 400 for invalid data', async () => {
    // Given
    const invalidData = {
      content: '', // 빈 내용
      isbn: 'invalid-isbn',
    };
    
    // When & Then
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData)
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_001');
  });
});
```

### 프론트엔드 테스트
```typescript
// ✅ 좋은 예: 컴포넌트 테스트
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PostCard from './PostCard';

const mockPost = {
  id: 'post-1',
  content: '좋은 책이었습니다.',
  rating: 5,
  user: {
    id: 'user-1',
    username: 'testuser',
    displayName: '테스트 사용자',
  },
  book: {
    title: '해리포터',
    authors: ['조앤 K. 롤링'],
  },
};

describe('PostCard', () => {
  it('should render post content correctly', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('좋은 책이었습니다.')).toBeInTheDocument();
    expect(screen.getByText('해리포터')).toBeInTheDocument();
    expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
  });
  
  it('should call onLike when like button is clicked', async () => {
    const mockOnLike = vi.fn();
    
    render(<PostCard post={mockPost} onLike={mockOnLike} />);
    
    const likeButton = screen.getByRole('button', { name: /좋아요/i });
    fireEvent.click(likeButton);
    
    await waitFor(() => {
      expect(mockOnLike).toHaveBeenCalledWith('post-1');
    });
  });
});
```

## 성능 최적화 가이드

### React 최적화
```typescript
// ✅ 좋은 예: React.memo와 useCallback 활용
const PostCard = React.memo<PostCardProps>(({ post, onLike, onComment }) => {
  const handleLike = useCallback(() => {
    onLike?.(post.id);
  }, [post.id, onLike]);
  
  const handleComment = useCallback(() => {
    onComment?.(post.id);
  }, [post.id, onComment]);
  
  return (
    <div className="post-card">
      {/* 컴포넌트 내용 */}
    </div>
  );
});

// ✅ 좋은 예: useMemo로 비용이 큰 계산 최적화
const ExpensiveComponent: React.FC<{ data: any[] }> = ({ data }) => {
  const processedData = useMemo(() => {
    return data
      .filter(item => item.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [data]);
  
  return <div>{/* 렌더링 */}</div>;
};
```

### 이미지 최적화
```typescript
// ✅ 좋은 예: LazyImage 컴포넌트
const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
```

이러한 표준을 따라 일관성 있고 유지보수 가능한 코드를 작성해주세요.