import axios from 'axios';
import type { FeedResponse, Review } from '../../types/review';
import { storage } from '../../utils/storage';
import { retryWithBackoff } from '../../utils/retry';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const reviewsApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
reviewsApi.interceptors.request.use((config) => {
  const token = storage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface GetFeedParams {
  page?: number;
  limit?: number;
}

export const reviewsService = {
  /**
   * Get paginated review feed
   * T115: Retry with exponential backoff
   */
  async getFeed(params: GetFeedParams = {}): Promise<FeedResponse> {
    const { page = 0, limit = 20 } = params;
    return retryWithBackoff(async () => {
      const response = await reviewsApi.get<FeedResponse>('/reviews/feed', {
        params: { page, limit },
      });
      return response.data;
    });
  },

  /**
   * Get single review by ID
   * T115: Retry with exponential backoff
   */
  async getReview(
    id: string
  ): Promise<{ data: Review; meta: { timestamp: string } }> {
    return retryWithBackoff(async () => {
      const response = await reviewsApi.get<{
        data: Review;
        meta: { timestamp: string };
      }>(`/reviews/${id}`);
      return response.data;
    });
  },
};
