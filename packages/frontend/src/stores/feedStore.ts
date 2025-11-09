import { create } from 'zustand';
import type { Review } from '../types/review';
import { reviewsService } from '../services/api/reviews';
import { likesService } from '../services/api/likes';
import { bookmarksService } from '../services/api/bookmarks';

interface FeedState {
  // State
  reviews: Review[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleLike: (reviewId: string) => Promise<void>;
  toggleBookmark: (reviewId: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  reviews: [],
  page: 0,
  hasMore: true,
  isLoading: false,
  error: null,
};

export const useFeedStore = create<FeedState>((set, get) => ({
  ...initialState,

  /**
   * Load initial feed (page 0)
   */
  loadFeed: async () => {
    const { isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const response = await reviewsService.getFeed({ page: 0, limit: 20 });
      set({
        reviews: response.data,
        page: 0,
        hasMore: response.meta.hasMore,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load feed',
        isLoading: false,
      });
    }
  },

  /**
   * Load more reviews (pagination)
   */
  loadMore: async () => {
    const { isLoading, hasMore, page, reviews } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true, error: null });

    try {
      const nextPage = page + 1;
      const response = await reviewsService.getFeed({
        page: nextPage,
        limit: 20,
      });
      set({
        reviews: [...reviews, ...response.data],
        page: nextPage,
        hasMore: response.meta.hasMore,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load more reviews',
        isLoading: false,
      });
    }
  },

  /**
   * Toggle like with optimistic update
   */
  toggleLike: async (reviewId: string) => {
    const { reviews } = get();

    // Find the review
    const reviewIndex = reviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex === -1) return;

    const review = reviews[reviewIndex];
    const previousIsLiked = review.isLikedByMe ?? false;
    const previousLikeCount = review.likeCount;

    // Optimistic update
    const updatedReviews = [...reviews];
    updatedReviews[reviewIndex] = {
      ...review,
      isLikedByMe: !previousIsLiked,
      likeCount: previousIsLiked ? review.likeCount - 1 : review.likeCount + 1,
    };
    set({ reviews: updatedReviews });

    try {
      // Make API call
      const response = await likesService.toggleLike(reviewId);

      // Update with server response
      const serverUpdatedReviews = [...get().reviews];
      const currentIndex = serverUpdatedReviews.findIndex(
        (r) => r.id === reviewId
      );
      if (currentIndex !== -1) {
        serverUpdatedReviews[currentIndex] = {
          ...serverUpdatedReviews[currentIndex],
          isLikedByMe: response.data.isLiked,
          likeCount: response.data.likeCount,
        };
        set({ reviews: serverUpdatedReviews });
      }
    } catch (error) {
      // Rollback on error
      const rollbackReviews = [...get().reviews];
      const rollbackIndex = rollbackReviews.findIndex((r) => r.id === reviewId);
      if (rollbackIndex !== -1) {
        rollbackReviews[rollbackIndex] = {
          ...rollbackReviews[rollbackIndex],
          isLikedByMe: previousIsLiked,
          likeCount: previousLikeCount,
        };
        set({
          reviews: rollbackReviews,
          error:
            error instanceof Error ? error.message : 'Failed to toggle like',
        });
      }
    }
  },

  /**
   * Toggle bookmark with optimistic update
   */
  toggleBookmark: async (reviewId: string) => {
    const { reviews } = get();

    // Find the review
    const reviewIndex = reviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex === -1) return;

    const review = reviews[reviewIndex];
    const previousIsBookmarked = review.isBookmarkedByMe ?? false;
    const previousBookmarkCount = review.bookmarkCount;

    // Optimistic update
    const updatedReviews = [...reviews];
    updatedReviews[reviewIndex] = {
      ...review,
      isBookmarkedByMe: !previousIsBookmarked,
      bookmarkCount: previousIsBookmarked
        ? review.bookmarkCount - 1
        : review.bookmarkCount + 1,
    };
    set({ reviews: updatedReviews });

    try {
      // Make API call
      const response = await bookmarksService.toggleBookmark(reviewId);

      // Update with server response
      const serverUpdatedReviews = [...get().reviews];
      const currentIndex = serverUpdatedReviews.findIndex(
        (r) => r.id === reviewId
      );
      if (currentIndex !== -1) {
        serverUpdatedReviews[currentIndex] = {
          ...serverUpdatedReviews[currentIndex],
          isBookmarkedByMe: response.data.isBookmarked,
          bookmarkCount: response.data.bookmarkCount,
        };
        set({ reviews: serverUpdatedReviews });
      }
    } catch (error) {
      // Rollback on error
      const rollbackReviews = [...get().reviews];
      const rollbackIndex = rollbackReviews.findIndex((r) => r.id === reviewId);
      if (rollbackIndex !== -1) {
        rollbackReviews[rollbackIndex] = {
          ...rollbackReviews[rollbackIndex],
          isBookmarkedByMe: previousIsBookmarked,
          bookmarkCount: previousBookmarkCount,
        };
        set({
          reviews: rollbackReviews,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to toggle bookmark',
        });
      }
    }
  },

  /**
   * Reset store to initial state
   */
  reset: () => set(initialState),
}));
