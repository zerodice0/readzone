# ReadZone 데이터베이스 패턴 및 최적화 가이드

## Prisma 사용 패턴

### 기본 쿼리 패턴

#### 1. 선택적 필드 조회 (Select)
불필요한 데이터 전송을 방지하기 위해 필요한 필드만 선택합니다.

```typescript
// ✅ 좋은 예: 필요한 필드만 선택
const posts = await prisma.post.findMany({
  select: {
    id: true,
    content: true,
    rating: true,
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
});

// ❌ 나쁜 예: 모든 데이터 조회
const posts = await prisma.post.findMany({
  include: {
    user: true,
    book: true,
    likes: true,
    comments: true,
  },
});
```

#### 2. 조건부 쿼리 구성
동적으로 WHERE 조건을 구성합니다.

```typescript
interface GetPostsOptions {
  userId?: string;
  bookId?: string;
  tags?: string[];
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sort?: 'recent' | 'popular' | 'rating';
}

async function getPosts(options: GetPostsOptions) {
  const {
    userId,
    bookId,
    tags,
    isPublic,
    page = 1,
    limit = 20,
    sort = 'recent',
  } = options;

  // WHERE 조건 동적 구성
  const where: Prisma.PostWhereInput = {
    isDeleted: false,
    ...(isPublic !== undefined && { isPublic }),
    ...(userId && { userId }),
    ...(bookId && { bookId }),
    ...(tags?.length && {
      tags: {
        hasSome: tags,
      },
    }),
  };

  // ORDER BY 조건 구성
  const orderBy: Prisma.PostOrderByWithRelationInput = (() => {
    switch (sort) {
      case 'popular':
        return { likes: { _count: 'desc' } };
      case 'rating':
        return { rating: 'desc' };
      case 'recent':
      default:
        return { createdAt: 'desc' };
    }
  })();

  // 병렬 쿼리 실행
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        content: true,
        rating: true,
        readingProgress: true,
        tags: true,
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
    prisma.post.count({ where }),
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
```

#### 3. 트랜잭션 패턴
데이터 일관성을 보장하기 위한 트랜잭션 사용 패턴입니다.

```typescript
// 게시글 생성 시 서재 정보도 함께 업데이트
async function createPostWithLibraryUpdate(
  userId: string,
  postData: CreatePostData
): Promise<Post> {
  return await prisma.$transaction(async (tx) => {
    // 1. 게시글 생성
    const post = await tx.post.create({
      data: {
        userId,
        bookId: postData.bookId,
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
        book: true,
      },
    });

    // 2. 서재 정보 업데이트 (upsert 사용)
    await tx.libraryBook.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId: postData.bookId,
        },
      },
      update: {
        currentPage: postData.readingProgress === 100 
          ? postData.totalPages || 0 
          : Math.floor((postData.totalPages || 0) * postData.readingProgress / 100),
        status: postData.readingProgress === 100 ? 'completed' : 'reading',
        finishedAt: postData.readingProgress === 100 ? new Date() : null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        bookId: postData.bookId,
        status: postData.readingProgress === 100 ? 'completed' : 'reading',
        currentPage: Math.floor((postData.totalPages || 0) * postData.readingProgress / 100),
        totalPages: postData.totalPages,
        startedAt: new Date(),
        finishedAt: postData.readingProgress === 100 ? new Date() : null,
      },
    });

    // 3. 독서 목표 진행률 업데이트
    if (postData.readingProgress === 100) {
      const currentYear = new Date().getFullYear();
      await tx.readingGoal.upsert({
        where: {
          userId_year: {
            userId,
            year: currentYear,
          },
        },
        update: {
          booksRead: {
            increment: 1,
          },
          pagesRead: {
            increment: postData.totalPages || 0,
          },
        },
        create: {
          userId,
          year: currentYear,
          booksTarget: 12, // 기본 목표
          pagesTarget: 3600, // 기본 목표
          booksRead: 1,
          pagesRead: postData.totalPages || 0,
        },
      });
    }

    return post;
  });
}
```

#### 4. 복잡한 관계 쿼리
중첩된 관계를 효율적으로 조회하는 패턴입니다.

```typescript
// 사용자의 팔로잉 피드 조회
async function getFollowingFeed(userId: string, page: number = 1, limit: number = 20) {
  return await prisma.post.findMany({
    where: {
      isDeleted: false,
      isPublic: true,
      user: {
        followers: {
          some: {
            followerId: userId,
          },
        },
      },
    },
    select: {
      id: true,
      content: true,
      rating: true,
      readingProgress: true,
      tags: true,
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
          isbn: true,
          title: true,
          authors: true,
          thumbnail: true,
        },
      },
      likes: {
        where: {
          userId,
        },
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: (page - 1) * limit,
  });
}

// 도서별 통계 조회
async function getBookStats(bookId: string) {
  const stats = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      authors: true,
      thumbnail: true,
      posts: {
        where: {
          isDeleted: false,
          isPublic: true,
        },
        select: {
          rating: true,
        },
      },
      libraryBooks: {
        select: {
          status: true,
        },
      },
      _count: {
        select: {
          posts: {
            where: {
              isDeleted: false,
              isPublic: true,
            },
          },
        },
      },
    },
  });

  if (!stats) return null;

  // 통계 계산
  const ratings = stats.posts.map(p => p.rating).filter(Boolean) as number[];
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
    : 0;

  const statusCounts = stats.libraryBooks.reduce((acc, book) => {
    acc[book.status] = (acc[book.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    ...stats,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: stats._count.posts,
    readingCount: statusCounts.reading || 0,
    completedCount: statusCounts.completed || 0,
    wantToReadCount: statusCounts.want_to_read || 0,
  };
}
```

## 성능 최적화 패턴

### 1. 인덱스 최적화
```sql
-- 자주 사용되는 쿼리에 대한 복합 인덱스
CREATE INDEX idx_posts_public_created ON posts(is_public, created_at DESC) 
WHERE is_deleted = false;

-- 팔로우 피드 조회 최적화
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC) 
WHERE is_deleted = false;

-- 댓글 조회 최적화
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at) 
WHERE is_deleted = false;

-- 좋아요 집계 최적화
CREATE INDEX idx_likes_post_created ON likes(post_id, created_at);

-- 검색 최적화 (GIN 인덱스)
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_books_authors ON books USING GIN(authors);
CREATE INDEX idx_books_categories ON books USING GIN(categories);

-- 전문 검색 인덱스
CREATE INDEX idx_posts_content_search ON posts USING GIN(to_tsvector('korean', content));
CREATE INDEX idx_books_title_search ON books USING GIN(to_tsvector('korean', title));
```

### 2. 쿼리 최적화 패턴
```typescript
// N+1 문제 해결: 배치 로딩
async function getPostsWithUserStats(postIds: string[]) {
  // 게시글과 사용자 정보를 한 번에 조회
  const posts = await prisma.post.findMany({
    where: {
      id: {
        in: postIds,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          _count: {
            select: {
              posts: {
                where: {
                  isDeleted: false,
                  isPublic: true,
                },
              },
              followers: true,
            },
          },
        },
      },
      book: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  return posts;
}

// 집계 쿼리 최적화
async function getUserStatistics(userId: string) {
  const [
    postsCount,
    booksReadCount,
    followersCount,
    followingCount,
    totalLikesReceived,
  ] = await Promise.all([
    prisma.post.count({
      where: {
        userId,
        isDeleted: false,
      },
    }),
    prisma.libraryBook.count({
      where: {
        userId,
        status: 'completed',
      },
    }),
    prisma.follow.count({
      where: {
        followingId: userId,
      },
    }),
    prisma.follow.count({
      where: {
        followerId: userId,
      },
    }),
    prisma.like.count({
      where: {
        post: {
          userId,
          isDeleted: false,
        },
      },
    }),
  ]);

  return {
    postsCount,
    booksReadCount,
    followersCount,
    followingCount,
    totalLikesReceived,
  };
}
```

### 3. 캐싱 패턴
```typescript
// 메모리 캐시를 활용한 자주 조회되는 데이터 캐싱
class BookService {
  private cache = new Map<string, { data: any; expiry: number }>();

  async getBookByIsbn(isbn: string): Promise<Book | null> {
    const cacheKey = `book:${isbn}`;
    
    // 캐시 확인
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    // 데이터베이스에서 조회
    const book = await prisma.book.findUnique({
      where: { isbn },
    });

    // 캐시에 저장 (5분)
    if (book) {
      this.cache.set(cacheKey, {
        data: book,
        expiry: Date.now() + 5 * 60 * 1000,
      });
    }

    return book;
  }

  // 인기 도서 캐싱 (더 긴 TTL)
  async getPopularBooks(limit: number = 20): Promise<Book[]> {
    const cacheKey = `popular-books:${limit}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    const books = await prisma.book.findMany({
      select: {
        id: true,
        isbn: true,
        title: true,
        authors: true,
        thumbnail: true,
        _count: {
          select: {
            posts: {
              where: {
                isDeleted: false,
                isPublic: true,
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 최근 30일
                },
              },
            },
          },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    // 30분 캐시
    this.cache.set(cacheKey, {
      data: books,
      expiry: Date.now() + 30 * 60 * 1000,
    });

    return books;
  }
}
```

## 데이터 일관성 패턴

### 1. 소프트 삭제 패턴
```typescript
// 소프트 삭제 구현
async function deletePost(postId: string, userId: string): Promise<void> {
  // 권한 확인
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      userId,
      isDeleted: false,
    },
  });

  if (!post) {
    throw new Error('게시글을 찾을 수 없거나 삭제 권한이 없습니다.');
  }

  // 소프트 삭제 실행
  await prisma.post.update({
    where: { id: postId },
    data: {
      isDeleted: true,
      updatedAt: new Date(),
    },
  });
}

// 소프트 삭제된 데이터 제외 조회
async function getActivePosts() {
  return await prisma.post.findMany({
    where: {
      isDeleted: false, // 항상 포함
    },
    // ... 기타 조건
  });
}
```

### 2. 낙관적 잠금 패턴
```typescript
// 버전 기반 낙관적 잠금
async function updatePostWithOptimisticLock(
  postId: string,
  updateData: Partial<Post>,
  expectedVersion: number
): Promise<Post> {
  try {
    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
        version: expectedVersion, // 버전 확인
      },
      data: {
        ...updateData,
        version: {
          increment: 1, // 버전 증가
        },
        updatedAt: new Date(),
      },
    });

    return updatedPost;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('다른 사용자가 이미 수정했습니다. 페이지를 새로고침해주세요.');
      }
    }
    throw error;
  }
}
```

### 3. 이벤트 기반 업데이트 패턴
```typescript
// 도메인 이벤트를 활용한 비동기 업데이트
class PostService {
  async createPost(userId: string, postData: CreatePostData): Promise<Post> {
    const post = await prisma.post.create({
      data: {
        userId,
        bookId: postData.bookId,
        content: postData.content,
        rating: postData.rating,
        // ... 기타 필드
      },
      include: {
        user: true,
        book: true,
      },
    });

    // 비동기 이벤트 발행
    this.publishEvent('post.created', {
      postId: post.id,
      userId: post.userId,
      bookId: post.bookId,
    });

    return post;
  }

  private async publishEvent(eventType: string, payload: any): Promise<void> {
    // 이벤트 핸들러들을 비동기로 실행
    setImmediate(async () => {
      try {
        switch (eventType) {
          case 'post.created':
            await this.handlePostCreated(payload);
            break;
          // 기타 이벤트 처리
        }
      } catch (error) {
        console.error(`Event handling failed for ${eventType}:`, error);
        // 에러 로깅 및 재시도 로직
      }
    });
  }

  private async handlePostCreated(payload: { postId: string; userId: string; bookId: string }): Promise<void> {
    await Promise.all([
      // 팔로워들에게 알림 전송
      this.notifyFollowers(payload.userId, payload.postId),
      
      // 사용자 통계 업데이트
      this.updateUserStats(payload.userId),
      
      // 도서 통계 업데이트
      this.updateBookStats(payload.bookId),
      
      // 추천 시스템 업데이트
      this.updateRecommendations(payload.userId, payload.bookId),
    ]);
  }
}
```

## 마이그레이션 패턴

### 1. 안전한 스키마 변경
```sql
-- 1단계: 새 컬럼 추가 (NULL 허용)
ALTER TABLE posts ADD COLUMN reading_time INTEGER;

-- 2단계: 기존 데이터 업데이트 (배치 처리)
UPDATE posts 
SET reading_time = CASE 
  WHEN LENGTH(content) < 500 THEN 2
  WHEN LENGTH(content) < 1000 THEN 5
  ELSE 10
END
WHERE reading_time IS NULL;

-- 3단계: NOT NULL 제약 조건 추가
ALTER TABLE posts ALTER COLUMN reading_time SET NOT NULL;

-- 4단계: 기본값 설정
ALTER TABLE posts ALTER COLUMN reading_time SET DEFAULT 5;
```

### 2. 데이터 마이그레이션 스크립트
```typescript
// 대량 데이터 마이그레이션을 위한 배치 처리
async function migrateUserDisplayNames(): Promise<void> {
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const users = await prisma.user.findMany({
      where: {
        displayName: null,
      },
      select: {
        id: true,
        username: true,
      },
      take: batchSize,
      skip: offset,
    });

    if (users.length === 0) {
      hasMore = false;
      break;
    }

    // 배치 업데이트
    await prisma.$transaction(
      users.map(user =>
        prisma.user.update({
          where: { id: user.id },
          data: {
            displayName: user.username, // username을 displayName으로 복사
          },
        })
      )
    );

    offset += batchSize;
    console.log(`Migrated ${offset} users...`);
    
    // 메모리 정리를 위한 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('Migration completed!');
}
```

이러한 데이터베이스 패턴을 활용하여 효율적이고 안정적인 데이터 액세스 레이어를 구축해주세요.