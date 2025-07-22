# ReadZone API 설계 패턴 및 가이드

## API 설계 원칙

### RESTful API 설계
ReadZone은 RESTful API 원칙을 따르며, 다음과 같은 패턴을 사용합니다:

```
GET    /api/posts           # 게시글 목록 조회
GET    /api/posts/:id       # 특정 게시글 조회
POST   /api/posts           # 새 게시글 생성
PUT    /api/posts/:id       # 게시글 전체 수정
PATCH  /api/posts/:id       # 게시글 부분 수정
DELETE /api/posts/:id       # 게시글 삭제

# 중첩 리소스
GET    /api/posts/:id/comments    # 게시글의 댓글 목록
POST   /api/posts/:id/comments    # 게시글에 댓글 작성
PUT    /api/comments/:id          # 댓글 수정
DELETE /api/comments/:id          # 댓글 삭제

# 액션 기반 엔드포인트
POST   /api/posts/:id/like        # 게시글 좋아요
DELETE /api/posts/:id/like        # 게시글 좋아요 취소
POST   /api/users/:id/follow      # 사용자 팔로우
DELETE /api/users/:id/follow      # 사용자 언팔로우
```

### 응답 형식 표준화

#### 성공 응답
```typescript
interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// 예시
{
  "success": true,
  "data": {
    "id": "post_123",
    "content": "좋은 책이었습니다.",
    "rating": 5,
    "user": {
      "id": "user_456",
      "username": "reader123"
    }
  },
  "message": "게시글이 생성되었습니다."
}
```

#### 에러 응답
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// 예시
{
  "success": false,
  "error": {
    "code": "VALIDATION_001",
    "message": "필수 필드가 누락되었습니다.",
    "details": {
      "field": "content",
      "value": ""
    }
  }
}
```

#### 페이지네이션 응답
```typescript
interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// 예시
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 컨트롤러 패턴

### 표준 컨트롤러 구조
```typescript
import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateData } from '@/utils/validation';
import type { AuthenticatedRequest } from '@/middleware/auth';

export const createPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // 1. 입력 검증
  const validatedData = validateData(createPostSchema, req.body);
  
  // 2. 권한 확인
  const userId = req.user!.id;
  
  // 3. 비즈니스 로직 실행 (서비스 레이어 호출)
  const post = await postService.createPost(userId, validatedData);
  
  // 4. 성공 응답
  res.status(201).json({
    success: true,
    data: post,
    message: '게시글이 생성되었습니다.',
  });
});

export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  // 1. 쿼리 파라미터 검증
  const { page = 1, limit = 20, type = 'public', sort = 'recent' } = req.query;
  
  // 2. 페이지네이션 파라미터 검증
  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
  
  // 3. 데이터 조회
  const result = await postService.getPosts({
    page: pageNum,
    limit: limitNum,
    type: type as string,
    sort: sort as string,
    userId: req.user?.id, // 선택적 인증
  });
  
  // 4. 응답
  res.json({
    success: true,
    data: result,
  });
});
```

### 에러 처리 패턴
```typescript
import { createError } from '@/middleware/errorHandler';

export const updatePost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  
  // 게시글 존재 확인
  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { id: true, userId: true, isDeleted: true },
  });
  
  if (!existingPost) {
    throw createError(404, 'RESOURCE_001', '게시글을 찾을 수 없습니다.');
  }
  
  if (existingPost.isDeleted) {
    throw createError(410, 'RESOURCE_003', '삭제된 게시글입니다.');
  }
  
  // 권한 확인
  if (existingPost.userId !== userId) {
    throw createError(403, 'AUTH_003', '게시글을 수정할 권한이 없습니다.');
  }
  
  // 업데이트 실행
  const validatedData = validateData(updatePostSchema, req.body);
  const updatedPost = await postService.updatePost(id, validatedData);
  
  res.json({
    success: true,
    data: updatedPost,
    message: '게시글이 수정되었습니다.',
  });
});
```

## 서비스 레이어 패턴

### 비즈니스 로직 분리
```typescript
class PostService {
  constructor(
    private prisma: PrismaClient,
    private bookService: BookService,
    private notificationService: NotificationService
  ) {}
  
  async createPost(userId: string, postData: CreatePostData): Promise<Post> {
    // 1. 도서 정보 확인/생성
    const book = await this.bookService.findOrCreateBook(postData.isbn);
    
    // 2. 트랜잭션으로 게시글 생성
    const post = await this.prisma.$transaction(async (tx) => {
      // 게시글 생성
      const newPost = await tx.post.create({
        data: {
          userId,
          bookId: book.id,
          content: postData.content,
          rating: postData.rating,
          readingProgress: postData.readingProgress,
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
          book: {
            select: {
              id: true,
              isbn: true,
              title: true,
              authors: true,
              thumbnail: true,
            },
          },
        },
      });
      
      // 서재에 도서 추가/업데이트
      await this.updateLibraryBook(tx, userId, book.id, postData);
      
      return newPost;
    });
    
    // 3. 비동기 작업 (알림 등)
    this.handlePostCreatedEvents(post);
    
    return post;
  }
  
  private async handlePostCreatedEvents(post: Post): Promise<void> {
    try {
      // 팔로워들에게 알림 전송
      await this.notificationService.notifyFollowers(post.userId, {
        type: 'new_post',
        postId: post.id,
        message: `${post.user.displayName || post.user.username}님이 새 게시글을 작성했습니다.`,
      });
      
      // 통계 업데이트
      await this.updateUserStats(post.userId);
      
    } catch (error) {
      // 비동기 작업 실패는 로그만 남기고 메인 플로우에 영향 없음
      logger.error('Post created event handling failed:', error);
    }
  }
}
```

### 데이터 접근 패턴
```typescript
class PostRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findPosts(options: FindPostsOptions): Promise<PaginatedResult<Post>> {
    const {
      page = 1,
      limit = 20,
      type = 'public',
      userId,
      bookId,
      tags,
      sort = 'recent',
    } = options;
    
    // WHERE 조건 구성
    const where: Prisma.PostWhereInput = {
      isDeleted: false,
      ...(type === 'public' && { isPublic: true }),
      ...(userId && { userId }),
      ...(bookId && { bookId }),
      ...(tags?.length && {
        tags: {
          hasSome: tags,
        },
      }),
    };
    
    // ORDER BY 조건 구성
    const orderBy: Prisma.PostOrderByWithRelationInput = this.getOrderBy(sort);
    
    // 병렬 쿼리 실행
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
        include: {
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
              isbn: true,
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
      }),
      this.prisma.post.count({ where }),
    ]);
    
    return {
      items: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
  
  private getOrderBy(sort: string): Prisma.PostOrderByWithRelationInput {
    switch (sort) {
      case 'popular':
        return { likes: { _count: 'desc' } };
      case 'rating':
        return { rating: 'desc' };
      case 'recent':
      default:
        return { createdAt: 'desc' };
    }
  }
}
```

## 인증 및 권한 패턴

### JWT 토큰 기반 인증
```typescript
// 토큰 생성
export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET!;
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'readzone-api',
    audience: 'readzone-client',
  };
  
  return jwt.sign(payload, secret, options);
}

// 토큰 검증 미들웨어
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      throw createError(401, 'AUTH_001', '인증 토큰이 필요합니다.');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const user = await getUserById(decoded.userId);
    
    if (!user || !user.isActive) {
      throw createError(401, 'AUTH_001', '유효하지 않은 토큰입니다.');
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(createError(401, 'AUTH_002', '토큰이 만료되었습니다.'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(createError(401, 'AUTH_001', '유효하지 않은 토큰입니다.'));
    } else {
      next(error);
    }
  }
};
```

### 권한 확인 패턴
```typescript
// 리소스 소유권 확인
export const requireOwnership = (resourceType: 'post' | 'comment') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user!.id;
      
      const resource = await getResourceWithOwner(resourceType, resourceId);
      
      if (!resource) {
        throw createError(404, 'RESOURCE_001', `${resourceType}을 찾을 수 없습니다.`);
      }
      
      if (resource.userId !== userId) {
        throw createError(403, 'AUTH_003', `${resourceType}에 대한 권한이 없습니다.`);
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// 사용 예시
router.put('/posts/:id', authenticateToken, requireOwnership('post'), updatePost);
```

## 검증 패턴

### Joi 스키마 정의
```typescript
// 기본 스키마
export const createPostSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.empty': '내용을 입력해주세요.',
      'string.max': '내용은 2000자를 초과할 수 없습니다.',
    }),
  
  isbn: Joi.string()
    .pattern(/^[0-9]{10,13}$/)
    .required()
    .messages({
      'string.pattern.base': '올바른 ISBN 형식이 아닙니다.',
    }),
  
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional(),
  
  readingProgress: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .default(0),
  
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(5)
    .default([]),
  
  isPublic: Joi.boolean().default(true),
});

// 조건부 검증
export const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(2000).optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  readingProgress: Joi.number().integer().min(0).max(100).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(5).optional(),
  isPublic: Joi.boolean().optional(),
}).min(1); // 최소 하나의 필드는 있어야 함
```

### 커스텀 검증 함수
```typescript
export function validateData<T>(schema: Joi.ObjectSchema<T>, data: any): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
  
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    }));
    
    throw createError(400, 'VALIDATION_001', '입력 데이터가 올바르지 않습니다.', details);
  }
  
  return value;
}
```

## 페이지네이션 패턴

### 커서 기반 페이지네이션 (무한 스크롤용)
```typescript
interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export async function getCursorPaginatedPosts(
  options: CursorPaginationOptions
): Promise<CursorPaginatedResult<Post>> {
  const { cursor, limit = 20, direction = 'forward' } = options;
  
  const where: Prisma.PostWhereInput = {
    isDeleted: false,
    isPublic: true,
  };
  
  // 커서 조건 추가
  if (cursor) {
    const cursorPost = await prisma.post.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    
    if (cursorPost) {
      where.createdAt = direction === 'forward' 
        ? { lt: cursorPost.createdAt }
        : { gt: cursorPost.createdAt };
    }
  }
  
  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: direction === 'forward' ? 'desc' : 'asc' },
    take: limit + 1, // 다음 페이지 존재 여부 확인용
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      book: { select: { id: true, title: true, authors: true, thumbnail: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
  
  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;
  
  return {
    items,
    nextCursor,
    hasMore,
  };
}
```

## 캐싱 패턴

### 메모리 캐시 (간단한 캐싱)
```typescript
class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry });
  }
  
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// 사용 예시
export const getPopularPosts = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = 'popular-posts';
  
  // 캐시에서 확인
  let posts = cacheService.get<Post[]>(cacheKey);
  
  if (!posts) {
    // 캐시 미스 시 데이터베이스에서 조회
    posts = await postService.getPopularPosts();
    cacheService.set(cacheKey, posts, 300); // 5분 캐시
  }
  
  res.json({
    success: true,
    data: posts,
  });
});
```

이러한 패턴들을 일관성 있게 적용하여 ReadZone API의 품질과 유지보수성을 높여주세요.