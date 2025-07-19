import { postsAPI } from './api';
import { withCache, generateCacheKey, apiCache } from '../utils/cache';

export interface Post {
  id: string;
  content: string;
  rating?: number;
  readingProgress: number;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  book: {
    id: string;
    title: string;
    authors: string[];
    thumbnail: string | null;
    isbn: string;
  };
  stats: {
    likesCount: number;
    commentsCount: number;
  };
  isLiked?: boolean;
}

export interface CreatePostData {
  bookId: string;
  content: string;
  rating?: number;
  readingProgress: number;
  tags: string[];
  isPublic: boolean;
}

export interface UpdatePostData {
  content?: string;
  rating?: number;
  readingProgress?: number;
  tags?: string[];
  isPublic?: boolean;
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const postService = {
  // 게시글 목록 조회 (캐시 적용)
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    bookId?: string;
    tags?: string[];
  }): Promise<PostsResponse> => {
    const cacheKey = generateCacheKey.posts(params || {});
    
    return withCache(
      cacheKey,
      async () => {
        const response = await postsAPI.getAll(params);
        return response.data;
      },
      apiCache,
      5 * 60 * 1000 // 5분 캐시
    );
  },

  // 게시글 상세 조회 (캐시 적용)
  getPostById: async (id: string): Promise<Post> => {
    const cacheKey = generateCacheKey.post(id);
    
    return withCache(
      cacheKey,
      async () => {
        const response = await postsAPI.getById(id);
        return response.data;
      },
      apiCache,
      10 * 60 * 1000 // 10분 캐시
    );
  },

  // 게시글 작성 (캐시 무효화)
  createPost: async (data: CreatePostData): Promise<Post> => {
    const response = await postsAPI.create(data);
    
    // 관련 캐시 무효화
    apiCache.clear(); // 전체 캐시 클리어 (실제로는 더 세밀한 제어 가능)
    
    return response.data;
  },

  // 게시글 수정 (캐시 무효화)
  updatePost: async (id: string, data: UpdatePostData): Promise<Post> => {
    const response = await postsAPI.update(id, data);
    
    // 해당 게시글 캐시 무효화
    const postCacheKey = generateCacheKey.post(id);
    apiCache.delete(postCacheKey);
    
    // 게시글 목록 캐시도 무효화
    apiCache.clear();
    
    return response.data;
  },

  // 게시글 삭제 (캐시 무효화)
  deletePost: async (id: string): Promise<void> => {
    await postsAPI.delete(id);
    
    // 해당 게시글 캐시 무효화
    const postCacheKey = generateCacheKey.post(id);
    apiCache.delete(postCacheKey);
    
    // 게시글 목록 캐시도 무효화
    apiCache.clear();
  },

  // 게시글 좋아요 (즉시 실행, 캐시 무효화)
  likePost: async (id: string): Promise<{ likesCount: number }> => {
    const response = await postsAPI.like(id);
    
    // 해당 게시글 캐시 무효화
    const postCacheKey = generateCacheKey.post(id);
    apiCache.delete(postCacheKey);
    
    return response.data;
  },

  // 게시글 좋아요 취소 (즉시 실행, 캐시 무효화)
  unlikePost: async (id: string): Promise<{ likesCount: number }> => {
    const response = await postsAPI.unlike(id);
    
    // 해당 게시글 캐시 무효화
    const postCacheKey = generateCacheKey.post(id);
    apiCache.delete(postCacheKey);
    
    return response.data;
  },
};