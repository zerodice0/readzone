import { infiniteQueryOptions } from '@tanstack/react-query';
import { api } from './client';

// Response types matching backend DTOs
interface UserReviewSummary {
  id: string;
  title: string;
  content: string;
  rating: number | null;
  tags: string | null;
  createdAt: string;
  isPublic: boolean;
  book: {
    id: string;
    title: string;
    author: string;
    thumbnail: string | null;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface UserLikeSummary {
  id: string;
  likedAt: string;
  review: UserReviewSummary;
}

interface UserBookSummary {
  id: string;
  status: string;
  rating: number | null;
  readAt: string | null;
  addedAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    thumbnail: string | null;
    publishedAt: string | null;
  };
  reviewId: string | null;
}

interface UserFollowSummary {
  id: string;
  followedAt: string;
  user: {
    id: string;
    userid: string;
    nickname: string;
    profileImage: string | null;
    isVerified: boolean;
  };
  stats?: {
    reviewCount: number;
    followerCount: number;
  };
  relationship?: {
    isFollowing: boolean;
    isFollowedBy: boolean;
    isMutualFollow: boolean;
  };
}

interface PaginationInfo {
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

interface UserReviewsResponse {
  reviews: UserReviewSummary[];
  pagination: PaginationInfo;
}

interface UserLikesResponse {
  reviews: UserLikeSummary[];
  pagination: PaginationInfo;
}

interface UserBooksResponse {
  books: UserBookSummary[];
  pagination: PaginationInfo;
  summary: {
    totalBooks: number;
    readBooks: number;
    readingBooks: number;
    wantToReadBooks: number;
  };
}

interface UserFollowsResponse {
  users: UserFollowSummary[];
  pagination: PaginationInfo;
}

// Follow action types
interface FollowUserResponse {
  success: boolean;
  relationship: {
    isFollowing: boolean;
    isFollowedBy: boolean;
    isMutualFollow: boolean;
  };
  followerCount: number;
}

// Query options for user reviews
export const getUserReviewsQueryOptions = (
  userid: string,
  params?: {
    sort?: 'newest' | 'oldest' | 'popular';
    visibility?: 'public' | 'private';
    cursor?: string;
    limit?: number;
  }
) =>
  infiniteQueryOptions({
    queryKey: ['user', 'reviews', userid, params],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const searchParams = new URLSearchParams();

      if (params?.sort) {
        searchParams.set('sort', params.sort);
      }
      if (params?.visibility) {
        searchParams.set('visibility', params.visibility);
      }
      if (params?.limit) {
        searchParams.set('limit', params.limit.toString());
      }
      if (pageParam) {
        searchParams.set('cursor', pageParam);
      }

      const response = await api.get(`/users/${userid}/reviews?${searchParams}`);

      return response.data.data as UserReviewsResponse;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor ?? null,
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 10, // 10분
  });

// Query options for user likes
export const getUserLikesQueryOptions = (
  userid: string,
  params?: {
    cursor?: string;
    limit?: number;
  }
) =>
  infiniteQueryOptions({
    queryKey: ['user', 'likes', userid, params],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const searchParams = new URLSearchParams();

      if (params?.limit) {
        searchParams.set('limit', params.limit.toString());
      }
      if (pageParam) {
        searchParams.set('cursor', pageParam);
      }

      const response = await api.get(`/users/${userid}/likes?${searchParams}`);

      return response.data.data as UserLikesResponse;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor ?? null,
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 10, // 10분
  });

// Query options for user books
export const getUserBooksQueryOptions = (
  userid: string,
  params?: {
    status?: 'read' | 'reading' | 'want_to_read';
    sort?: 'recent' | 'title' | 'rating';
    cursor?: string;
    limit?: number;
  }
) =>
  infiniteQueryOptions({
    queryKey: ['user', 'books', userid, params],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const searchParams = new URLSearchParams();

      if (params?.status) {
        searchParams.set('status', params.status);
      }
      if (params?.sort) {
        searchParams.set('sort', params.sort);
      }
      if (params?.limit) {
        searchParams.set('limit', params.limit.toString());
      }
      if (pageParam) {
        searchParams.set('cursor', pageParam);
      }

      const response = await api.get(`/users/${userid}/books?${searchParams}`);

      return response.data.data as UserBooksResponse;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor ?? null,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
  });

// Query options for user follows
export const getUserFollowsQueryOptions = (
  userid: string,
  params: {
    type: 'followers' | 'following';
    cursor?: string;
    limit?: number;
  }
) =>
  infiniteQueryOptions({
    queryKey: ['user', 'follows', userid, params],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const searchParams = new URLSearchParams();

      searchParams.set('type', params.type);
      if (params.limit) {
        searchParams.set('limit', params.limit.toString());
      }
      if (pageParam) {
        searchParams.set('cursor', pageParam);
      }

      const response = await api.get(`/users/${userid}/follows?${searchParams}`);

      return response.data.data as UserFollowsResponse;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor ?? null,
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 10, // 10분
  });

// Follow/unfollow mutation

export const followUser = async (
  userid: string,
  action: 'follow' | 'unfollow'
): Promise<FollowUserResponse> => {
  const response = await api.post(`/users/${userid}/follow`, { action });

  return response.data;
};