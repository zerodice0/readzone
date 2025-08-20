import type { FeedRequest, FeedResponse, LikeRequest, LikeResponse } from '@/types/feed';
export declare const useFeed: (params: FeedRequest) => import("@tanstack/react-query").UseQueryResult<FeedResponse, Error>;
export declare const useLikeMutation: () => import("@tanstack/react-query").UseMutationResult<LikeResponse, Error, {
    reviewId: string;
} & LikeRequest, unknown>;
