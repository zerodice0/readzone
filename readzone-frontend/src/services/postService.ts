import { postsAPI } from './api';

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
  // 게시글 목록 조회
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    bookId?: string;
    tags?: string[];
  }): Promise<PostsResponse> => {
    const response = await postsAPI.getAll(params);
    return response.data;
  },

  // 게시글 상세 조회
  getPostById: async (id: string): Promise<Post> => {
    const response = await postsAPI.getById(id);
    return response.data;
  },

  // 게시글 작성
  createPost: async (data: CreatePostData): Promise<Post> => {
    const response = await postsAPI.create(data);
    return response.data;
  },

  // 게시글 수정
  updatePost: async (id: string, data: UpdatePostData): Promise<Post> => {
    const response = await postsAPI.update(id, data);
    return response.data;
  },

  // 게시글 삭제
  deletePost: async (id: string): Promise<void> => {
    await postsAPI.delete(id);
  },

  // 게시글 좋아요
  likePost: async (id: string): Promise<{ likesCount: number }> => {
    const response = await postsAPI.like(id);
    return response.data;
  },

  // 게시글 좋아요 취소
  unlikePost: async (id: string): Promise<{ likesCount: number }> => {
    const response = await postsAPI.unlike(id);
    return response.data;
  },
};