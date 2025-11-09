import axios from 'axios';
import type { ToggleLikeResponse } from '../../types/review';
import { storage } from '../../utils/storage';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const likesApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
likesApi.interceptors.request.use((config) => {
  const token = storage.getItem('authToken');
  if (token && config.headers) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const likesService = {
  /**
   * Toggle like on a review
   */
  async toggleLike(reviewId: string): Promise<ToggleLikeResponse> {
    const response = await likesApi.post<ToggleLikeResponse>(
      `/reviews/${reviewId}/like`
    );
    return response.data;
  },

  /**
   * Get list of users who liked a review
   */
  async getReviewLikes(
    reviewId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<{ data: unknown[]; meta: unknown }> {
    const { page = 0, limit = 20 } = params;
    const response = await likesApi.get<{ data: unknown[]; meta: unknown }>(
      `/reviews/${reviewId}/likes`,
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  /**
   * Get user's liked reviews
   */
  async getUserLikes(params: { page?: number; limit?: number } = {}): Promise<{
    data: unknown[];
    meta: unknown;
  }> {
    const { page = 0, limit = 20 } = params;
    const response = await likesApi.get<{ data: unknown[]; meta: unknown }>(
      '/users/me/likes',
      {
        params: { page, limit },
      }
    );
    return response.data;
  },
};
