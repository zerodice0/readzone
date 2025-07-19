import api from './api';

// 타입 정의
export interface User {
  id: string;
  username: string;
  displayName: string;
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

export interface UserPost {
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

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  stats: {
    followersCount: number;
    postsCount: number;
  };
}

export interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isPublic: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserProfileResponse {
  success: boolean;
  data: User;
}

export interface UserPostsResponse {
  success: boolean;
  data: PaginatedResponse<UserPost>;
}

export interface UserSearchResponse {
  success: boolean;
  data: PaginatedResponse<UserSearchResult>;
}

export interface FollowersResponse {
  success: boolean;
  data: PaginatedResponse<FollowUser>;
}

export interface FollowingResponse {
  success: boolean;
  data: PaginatedResponse<FollowUser>;
}

export interface FollowResponse {
  success: boolean;
  message: string;
}

// 사용자 서비스
export const userService = {
  // 사용자 프로필 조회
  getUserProfile: async (userId: string): Promise<User> => {
    const response = await api.get<UserProfileResponse>(`/users/${userId}`);
    return response.data.data;
  },

  // 사용자 게시글 목록 조회
  getUserPosts: async (
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<UserPost>> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<UserPostsResponse>(`/users/${userId}/posts?${params}`);
    return response.data.data;
  },

  // 사용자 검색
  searchUsers: async (
    query: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<UserSearchResult>> => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<UserSearchResponse>(`/users/search?${params}`);
    return response.data.data;
  },

  // 팔로워 목록 조회
  getFollowers: async (
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<FollowUser>> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<FollowersResponse>(`/users/${userId}/followers?${params}`);
    return response.data.data;
  },

  // 팔로잉 목록 조회
  getFollowing: async (
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<FollowUser>> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<FollowingResponse>(`/users/${userId}/following?${params}`);
    return response.data.data;
  },

  // 사용자 팔로우
  followUser: async (userId: string): Promise<void> => {
    await api.post<FollowResponse>(`/users/${userId}/follow`);
  },

  // 사용자 언팔로우
  unfollowUser: async (userId: string): Promise<void> => {
    await api.delete<FollowResponse>(`/users/${userId}/follow`);
  }
};

export default userService;