import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
const API_BASE_URL = 'http://localhost:3001/api';
// API 호출 함수들
const fetchFeed = async (params) => {
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
            // JWT 토큰이 있는 경우 추가
            ...(localStorage.getItem('token') && {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
        }
    });
    if (!response.ok) {
        throw new Error('피드를 불러오는데 실패했습니다.');
    }
    return response.json();
};
const likeReview = async ({ reviewId, action }) => {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
    });
    if (!response.ok) {
        throw new Error('좋아요 처리에 실패했습니다.');
    }
    return response.json();
};
// React Query 훅들
export const useFeed = (params) => {
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
    return useMutation({
        mutationFn: likeReview,
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
