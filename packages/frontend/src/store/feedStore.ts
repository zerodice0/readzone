import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FeedTab, ReviewCard } from '@/types/feed';

interface FeedState {
  // 상태
  activeTab: FeedTab;
  reviews: Map<string, ReviewCard[]>; // 탭별 캐시
  cursors: Map<string, string | null>; // 탭별 커서
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  
  // 액션
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

const useFeedStore = create<FeedState>()(
  devtools(
    (set) => ({
      // 초기 상태
      activeTab: 'recommended',
      reviews: new Map(),
      cursors: new Map(),
      isLoading: false,
      hasMore: true,
      error: null,

      // 액션 구현
      setActiveTab: (tab: FeedTab) => {
        set({ activeTab: tab }, false, 'setActiveTab');
      },

      setReviews: (tab: FeedTab, reviews: ReviewCard[], cursor?: string) => {
        set((state) => {
          const newReviews = new Map(state.reviews);

          newReviews.set(tab, reviews);

          const newCursors = new Map(state.cursors);

          if (cursor !== undefined) {
            newCursors.set(tab, cursor);
          }

          return { 
            reviews: newReviews, 
            cursors: newCursors 
          };
        }, false, 'setReviews');
      },

      appendReviews: (tab: FeedTab, reviews: ReviewCard[], cursor?: string) => {
        set((state) => {
          const newReviews = new Map(state.reviews);
          const existingReviews = newReviews.get(tab) ?? [];
          
          // 중복 제거 (ID 기반)
          const existingIds = new Set(existingReviews.map(r => r.id));
          const uniqueNewReviews = reviews.filter(r => !existingIds.has(r.id));

          newReviews.set(tab, [...existingReviews, ...uniqueNewReviews]);
          
          const newCursors = new Map(state.cursors);

          if (cursor !== undefined) {
            newCursors.set(tab, cursor);
          }

          return { 
            reviews: newReviews, 
            cursors: newCursors 
          };
        }, false, 'appendReviews');
      },

      updateReview: (reviewId: string, updates: Partial<ReviewCard>) => {
        set((state) => {
          const newReviews = new Map(state.reviews);
          
          // 모든 탭에서 해당 리뷰 업데이트
          
          for (const [tab, reviews] of newReviews.entries()) {
            const updatedReviews = reviews.map(review =>
              review.id === reviewId 
                ? { ...review, ...updates }
                : review
            );

            newReviews.set(tab, updatedReviews);
          }

          return { reviews: newReviews };
        }, false, 'updateReview');
      },

      updateReviewStats: (reviewId: string, stats: Partial<ReviewCard['stats']>) => {
        set((state) => {
          const newReviews = new Map(state.reviews);
          
          for (const [tab, reviews] of newReviews.entries()) {
            const updatedReviews = reviews.map(review =>
              review.id === reviewId 
                ? { ...review, stats: { ...review.stats, ...stats } }
                : review
            );

            newReviews.set(tab, updatedReviews);
          }

          return { reviews: newReviews };
        }, false, 'updateReviewStats');
      },

      updateUserInteraction: (reviewId: string, interaction: ReviewCard['userInteraction']) => {
        set((state) => {
          const newReviews = new Map(state.reviews);
          
          for (const [tab, reviews] of newReviews.entries()) {
            const updatedReviews = reviews.map(review =>
              review.id === reviewId 
                ? { ...review, userInteraction: interaction }
                : review
            );

            newReviews.set(tab, updatedReviews);
          }

          return { reviews: newReviews };
        }, false, 'updateUserInteraction');
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, 'setLoading');
      },

      setError: (error: string | null) => {
        set({ error }, false, 'setError');
      },

      setHasMore: (hasMore: boolean) => {
        set({ hasMore }, false, 'setHasMore');
      },

      clearFeed: () => {
        set({ 
          reviews: new Map(), 
          cursors: new Map(), 
          isLoading: false, 
          hasMore: true, 
          error: null 
        }, false, 'clearFeed');
      },

      clearTab: (tab: FeedTab) => {
        set((state) => {
          const newReviews = new Map(state.reviews);
          const newCursors = new Map(state.cursors);

          newReviews.delete(tab);
          newCursors.delete(tab);

          return { 
            reviews: newReviews, 
            cursors: newCursors 
          };
        }, false, 'clearTab');
      },
    }),
    {
      name: 'feed-store',
      store: 'feed-store',
    }
  )
);

// 헬퍼 훅들
export const useFeedReviews = () => {
  const { reviews, activeTab } = useFeedStore();

  return reviews.get(activeTab) ?? [];
};

export const useFeedCursor = () => {
  const { cursors, activeTab } = useFeedStore();

  return cursors.get(activeTab) ?? null;
};

export default useFeedStore;