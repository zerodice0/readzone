import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  FeedRequest,
  FeedResponse,
  LikeRequest,
  LikeResponse,
  ReviewCard,
} from '@/types/feed';
import { useAuthStore } from '@/store/authStore';

// 백엔드 API 응답 타입 정의
interface BackendReviewResponse {
  id: string;
  title: string;
  content: string;
  rating: number;
  isRecommended: boolean;
  tags: string | null;
  isPublic: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    userid: string;
    nickname: string;
    profileImage: string | null;
    isVerified: boolean;
  };
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string | null;
    thumbnail: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

interface BackendFeedResponse {
  success: boolean;
  data: {
    reviews: BackendReviewResponse[];
    hasMore: boolean;
    nextCursor: string | null;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4001';

// 백엔드 응답을 프론트엔드 타입으로 변환하는 함수
const transformReviewData = (
  backendReview: BackendReviewResponse
): ReviewCard => {
  const author: ReviewCard['author'] = {
    id: backendReview.user.id,
    userid: backendReview.user.userid,
    nickname: backendReview.user.nickname,
  };

  // profileImage가 있을 때만 추가 (exactOptionalPropertyTypes 준수)
  if (backendReview.user.profileImage) {
    author.profileImage = backendReview.user.profileImage;
  }

  const book: ReviewCard['book'] = {
    id: backendReview.book.id,
    title: backendReview.book.title,
    author: backendReview.book.author,
  };

  // cover가 있을 때만 추가 (exactOptionalPropertyTypes 준수)
  if (backendReview.book.thumbnail) {
    book.cover = backendReview.book.thumbnail;
  }

  return {
    id: backendReview.id,
    content: backendReview.content,
    createdAt: backendReview.createdAt,
    author,
    book,
    stats: {
      likes: backendReview._count.likes,
      comments: backendReview._count.comments,
      shares: 0, // shares는 아직 구현되지 않았으므로 기본값 0
    },
    userInteraction: null, // 비로그인 상태에서는 null, 추후 로그인 상태 처리 필요
  };
};

// API 호출 함수들
const fetchFeed = async (params: FeedRequest): Promise<FeedResponse> => {
  const searchParams = new URLSearchParams({
    tab: params.tab,
    limit: params.limit.toString(),
  });

  if (params.cursor) {
    searchParams.append('cursor', params.cursor);
  }

  const response = await fetch(`${API_BASE_URL}/api/reviews/feed?${searchParams}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Cookie 기반 인증
  });

  if (!response.ok) {
    throw new Error('피드를 불러오는데 실패했습니다.');
  }

  const backendResponse: BackendFeedResponse = await response.json();

  // 백엔드 응답을 프론트엔드 형식으로 변환
  return {
    reviews: backendResponse.data.reviews.map(transformReviewData),
    hasMore: backendResponse.data.hasMore,
    nextCursor: backendResponse.data.nextCursor,
  };
};

const likeReview = async ({
  reviewId,
  action,
  accessToken,
}: {
  reviewId: string;
  accessToken: string | null;
} & LikeRequest): Promise<LikeResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/like`, {
    method: 'POST',
    headers,
    credentials: 'include', // Cookie 기반 인증
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error('좋아요 처리에 실패했습니다.');
  }

  return response.json();
};

// React Query 훅들
export const useFeed = (params: FeedRequest) => {
  return useQuery({
    queryKey: ['feed', params.tab, params.cursor],
    queryFn: () => fetchFeed(params),
    staleTime: 1000 * 60 * 5, // 5분
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
  });
};

export const useLikeMutation = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  return useMutation({
    mutationFn: (params: { reviewId: string } & LikeRequest) =>
      likeReview({ ...params, accessToken }),
    onSuccess: () => {
      // 관련 피드 쿼리들 무효화
      queryClient.invalidateQueries({
        queryKey: ['feed'],
        refetchType: 'none', // 백그라운드에서만 새로고침
      });
    },
    onError: (error) => {
      console.error('좋아요 처리 실패:', error);
    },
  });
};
