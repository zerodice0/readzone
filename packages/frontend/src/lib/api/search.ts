import { api } from './client';

export interface UnifiedSearchParams {
  query: string;
  type?: 'all' | 'books' | 'reviews' | 'users';
  filters?: Record<string, unknown>;
  sort?: string;
  cursor?: string;
  limit?: number;
}

export interface BookSearchParams {
  query: string;
  source?: 'db' | 'api' | 'all';
  sort?: string;
  page?: number;
  limit?: number;
}

export interface SearchSuggestionsParams {
  query: string;
  limit?: number;
}

interface ManualBookData {
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  isbn?: string;
  coverImage?: string;
  description?: string;
}

export interface TrendingBook {
  id: string;
  title: string;
  author: string;
  thumbnail: string | null;
  reviewCount: number;
  likeCount: number;
}

export interface PopularTag {
  name: string;
  count: number;
}

interface TrendingResponse<T> {
  success: boolean;
  data: T;
}

export const searchApi = {
  // Unified search
  unifiedSearch: async (params: UnifiedSearchParams) => {
    const response = await api.get('/api/search', { params });

    return response.data;
  },

  // Book-specific search
  searchBooks: async (params: BookSearchParams) => {
    const response = await api.get('/api/search/books', { params });

    return response.data;
  },

  // Search suggestions
  getSuggestions: async (params: SearchSuggestionsParams) => {
    const response = await api.get('/api/search/suggestions', { params });

    return response.data;
  },

  // Add manual book
  addManualBook: async (bookData: ManualBookData) => {
    const response = await api.post('/api/books/manual', bookData);

    return response.data;
  },

  // Trending API endpoints
  getRecentlyReviewedBooks: async (limit = 5): Promise<TrendingBook[]> => {
    try {
      const response = await api.get<TrendingResponse<TrendingBook[]>>(
        `/api/trending/recent`,
        { params: { limit } }
      );

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch recently reviewed books:', error);

      return [];
    }
  },

  getPopularBooksThisMonth: async (limit = 5): Promise<TrendingBook[]> => {
    try {
      const response = await api.get<TrendingResponse<TrendingBook[]>>(
        `/api/trending/popular`,
        { params: { limit } }
      );

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch popular books:', error);

      return [];
    }
  },

  getPopularTags: async (limit = 10): Promise<PopularTag[]> => {
    try {
      const response = await api.get<TrendingResponse<PopularTag[]>>(
        `/api/trending/tags`,
        { params: { limit } }
      );

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch popular tags:', error);

      return [];
    }
  },

  getSearchSuggestions: async (query?: string, limit = 5): Promise<string[]> => {
    try {
      const response = await api.get<TrendingResponse<string[]>>(
        `/api/trending/suggestions`,
        { params: { query, limit } }
      );

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch search suggestions:', error);

      return [];
    }
  }
};