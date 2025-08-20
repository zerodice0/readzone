import type { FeedTab, ReviewCard } from '@/types/feed';
interface FeedState {
    activeTab: FeedTab;
    reviews: Map<string, ReviewCard[]>;
    cursors: Map<string, string | null>;
    isLoading: boolean;
    hasMore: boolean;
    error: string | null;
    setActiveTab: (tab: FeedTab) => void;
    setReviews: (tab: FeedTab, reviews: ReviewCard[], cursor?: string) => void;
    appendReviews: (tab: FeedTab, reviews: ReviewCard[], cursor?: string) => void;
    updateReview: (reviewId: string, updates: Partial<ReviewCard>) => void;
    updateReviewStats: (reviewId: string, stats: Partial<ReviewCard['stats']>) => void;
    updateUserInteraction: (reviewId: string, interaction: ReviewCard['userInteraction']) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setHasMore: (hasMore: boolean) => void;
    clearFeed: () => void;
    clearTab: (tab: FeedTab) => void;
}
declare const useFeedStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<FeedState>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: FeedState | Partial<FeedState> | ((state: FeedState) => FeedState | Partial<FeedState>), replace?: boolean | undefined, action?: A | undefined): void;
}>;
export declare const useFeedReviews: () => ReviewCard[];
export declare const useFeedCursor: () => string | null;
export default useFeedStore;
