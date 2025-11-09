import axios from 'axios';
import type { ToggleBookmarkResponse } from '../../types/review';
import { storage } from '../../utils/storage';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const bookmarksApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
bookmarksApi.interceptors.request.use((config) => {
  const token = storage.getItem('authToken');
  if (token && config.headers) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const bookmarksService = {
  /**
   * Toggle bookmark on a review
   */
  async toggleBookmark(reviewId: string): Promise<ToggleBookmarkResponse> {
    const response = await bookmarksApi.post<ToggleBookmarkResponse>(
      `/reviews/${reviewId}/bookmark`
    );
    return response.data;
  },

  /**
   * Get user's bookmarked reviews
   */
  async getUserBookmarks(
    params: { page?: number; limit?: number } = {}
  ): Promise<{
    data: unknown[];
    meta: unknown;
  }> {
    const { page = 0, limit = 20 } = params;
    const response = await bookmarksApi.get<{ data: unknown[]; meta: unknown }>(
      '/users/me/bookmarks',
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  /**
   * Delete a specific bookmark
   */
  async deleteBookmark(
    bookmarkId: string
  ): Promise<{ meta: { timestamp: string } }> {
    const response = await bookmarksApi.delete<{ meta: { timestamp: string } }>(
      `/bookmarks/${bookmarkId}`
    );
    return response.data;
  },
};
