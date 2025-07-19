import api from './api';

// 타입 정의
export interface SearchPost {
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

export interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  bio?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing?: boolean;
}

export interface SearchTag {
  tag: string;
  count: number;
}

export interface SearchResults {
  posts: SearchPost[];
  users: SearchUser[];
  tags: SearchTag[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TagPostsResponse {
  tag: string;
  posts: SearchPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PopularTagsResponse {
  tags: SearchTag[];
}

export interface SearchAllResponse {
  success: boolean;
  data: SearchResults;
}

export interface TagPostsAPIResponse {
  success: boolean;
  data: TagPostsResponse;
}

export interface PopularTagsAPIResponse {
  success: boolean;
  data: PopularTagsResponse;
}

export type SearchType = 'all' | 'posts' | 'users' | 'tags';

// 검색 서비스
export const searchService = {
  // 통합 검색
  searchAll: async (
    query: string,
    options: {
      type?: SearchType;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<SearchResults> => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.type) params.append('type', options.type);
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<SearchAllResponse>(`/search?${params}`);
    return response.data.data;
  },

  // 태그별 게시글 조회
  getPostsByTag: async (
    tag: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<TagPostsResponse> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<TagPostsAPIResponse>(`/search/tags/${encodeURIComponent(tag)}?${params}`);
    return response.data.data;
  },

  // 인기 태그 조회
  getPopularTags: async (limit?: number): Promise<SearchTag[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await api.get<PopularTagsAPIResponse>(`/search/tags?${params}`);
    return response.data.data.tags;
  }
};

export default searchService;