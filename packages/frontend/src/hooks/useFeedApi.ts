import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeedRequest, FeedResponse, LikeRequest, LikeResponse } from '@/types/feed';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = 'http://localhost:3001/api';

// API 호출 함수들
const fetchFeed = async (params: FeedRequest): Promise<FeedResponse> => {
  const searchParams = new URLSearchParams({
    tab: params.tab,
    limit: params.limit.toString(),
  });
  
  if (params.cursor) {
    searchParams.append('cursor', params.cursor);
  }

  const response = await fetch(`${API_BASE_URL}/reviews/feed?${searchParams}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include' // Cookie 기반 인증
  });

  if (!response.ok) {
    throw new Error('피드를 불러오는데 실패했습니다.');
  }

  return response.json();
};

const likeReview = async ({ reviewId, action, accessToken }: { reviewId: string; accessToken: string | null } & LikeRequest): Promise<LikeResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/like`, {
    method: 'POST',
    headers,
    credentials: 'include', // Cookie 기반 인증
    body: JSON.stringify({ action })
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
        refetchType: 'none' // 백그라운드에서만 새로고침
      });
    },
    onError: (error) => {
      console.error('좋아요 처리 실패:', error);
    }
  });
};