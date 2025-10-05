import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  BookSearchResult,
  ManualBookRequest,
  ReviewSearchResult,
  SearchFilters,
  SearchSuggestionsResponse,
  SearchType,
  UnifiedSearchResponse,
  UserSearchResult
} from '@/types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4001';

interface SearchState {
  // Search parameters
  query: string;
  type: SearchType;
  filters: SearchFilters;
  sort: string;

  // Results
  results: {
    books: BookSearchResult[];
    reviews: ReviewSearchResult[];
    users: UserSearchResult[];
  };

  // Pagination state
  pagination: {
    hasMore: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    nextCursor: string | null;
    total: number | null;
  };

  // Metadata
  suggestions: string[];
  recentSearches: string[];
  facets?: {
    ratings: { recommend: number; not_recommend: number };
    authors: { username: string; count: number }[];
    books: { title: string; count: number }[];
  } | undefined;

  // Cache for performance (query -> results)
  cache: Map<string, UnifiedSearchResponse>;
  suggestionsCache: Map<string, string[]>;

  // Error handling
  error: string | null;

  // Actions
  setQuery: (query: string) => void;
  setType: (type: SearchType) => void;
  setFilters: (filters: SearchFilters) => void;
  setSort: (sort: string) => void;

  search: () => Promise<void>;
  loadMore: () => Promise<void>;
  getSuggestions: (query: string) => Promise<void>;
  addRecentSearch: (query: string) => void;

  // Book-specific search (for 3-stage search)
  searchBooks: (query: string, source?: 'db' | 'api') => Promise<BookSearchResult[]>;
  addManualBook: (bookData: ManualBookRequest) => Promise<BookSearchResult>;

  // Utility actions
  reset: () => void;
  clearResults: () => void;
  clearCache: () => void;
  setError: (error: string | null) => void;
}

const initialState = {
  query: '',
  type: 'all' as SearchType,
  filters: {},
  sort: 'relevance',
  results: {
    books: [],
    reviews: [],
    users: [],
  },
  pagination: {
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    nextCursor: null,
    total: null,
  },
  suggestions: [],
  recentSearches: [],
  facets: undefined,
  cache: new Map(),
  suggestionsCache: new Map(),
  error: null,
};

const useSearchStore = create<SearchState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setQuery: (query: string) => {
        set({ query, error: null }, false, 'setQuery');
      },

      setType: (type: SearchType) => {
        set({ type, error: null }, false, 'setType');
        // Clear results when changing type
        const state = get();

        if (state.query.trim()) {
          state.search();
        }
      },

      setFilters: (filters: SearchFilters) => {
        set({ filters, error: null }, false, 'setFilters');
        // Re-search with new filters
        const state = get();

        if (state.query.trim()) {
          state.search();
        }
      },

      setSort: (sort: string) => {
        set({ sort, error: null }, false, 'setSort');
        // Re-search with new sort
        const state = get();

        if (state.query.trim()) {
          state.search();
        }
      },

      search: async () => {
        const state = get();
        const { query, type, filters, sort } = state;

        if (!query.trim()) {
          set({
            results: { books: [], reviews: [], users: [] },
            pagination: { ...state.pagination, hasMore: false, total: 0, nextCursor: null }
          }, false, 'search:empty');

          return;
        }

        // Check cache first
        const cacheKey = `${query}_${type}_${JSON.stringify(filters)}_${sort}`;
        const cached = state.cache.get(cacheKey);

        if (cached) {
          set({
            results: cached.results,
            pagination: {
              ...state.pagination,
              hasMore: cached.pagination.hasMore,
              total: cached.pagination.total ?? null,
              nextCursor: cached.pagination.nextCursor ?? null,
              isLoading: false,
            },
            suggestions: cached.suggestions ?? [],
          }, false, 'search:cached');

          return;
        }

        set({
          pagination: { ...state.pagination, isLoading: true },
          error: null
        }, false, 'search:start');

        try {
          const url = new URL(`${API_BASE_URL}/api/search`);

          url.searchParams.set('query', query);
          if (type && type !== 'all') {
            url.searchParams.set('type', type);
          }
          url.searchParams.set('sort', sort);

          if (Object.keys(filters).length > 0) {
            url.searchParams.set('filters', JSON.stringify(filters));
          }

          const response = await fetch(url.toString(), {
            credentials: 'include',
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
          }

          const data: { data: UnifiedSearchResponse } = await response.json();
          const searchResult = data.data;

          // Cache the result
          state.cache.set(cacheKey, searchResult);

          set({
            results: searchResult.results,
            pagination: {
              hasMore: searchResult.pagination.hasMore,
              isLoading: false,
              isLoadingMore: false,
              nextCursor: searchResult.pagination.nextCursor ?? null,
              total: searchResult.pagination.total ?? null,
            },
            suggestions: searchResult.suggestions ?? [],
            facets: searchResult.results.reviews.length > 0 ? {
              ratings: { recommend: 0, not_recommend: 0 },
              authors: [],
              books: [],
            } : undefined,
          }, false, 'search:success');

        } catch (error) {
          set({
            pagination: { ...state.pagination, isLoading: false },
            error: error instanceof Error ? error.message : 'Search failed',
          }, false, 'search:error');
        }
      },

      loadMore: async () => {
        const state = get();
        const { query, type, filters, sort, pagination } = state;

        if (!pagination.hasMore || pagination.isLoadingMore || !pagination.nextCursor) {
          return;
        }

        set({
          pagination: { ...pagination, isLoadingMore: true }
        }, false, 'loadMore:start');

        try {
          const url = new URL(`${API_BASE_URL}/api/search`);

          url.searchParams.set('query', query);
          if (type && type !== 'all') {
            url.searchParams.set('type', type);
          }
          url.searchParams.set('sort', sort);
          url.searchParams.set('cursor', pagination.nextCursor);

          if (Object.keys(filters).length > 0) {
            url.searchParams.set('filters', JSON.stringify(filters));
          }

          const response = await fetch(url.toString(), {
            credentials: 'include',
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error(`Load more failed: ${response.statusText}`);
          }

          const data: { data: UnifiedSearchResponse } = await response.json();
          const searchResult = data.data;

          // Merge with existing results
          set((prevState) => ({
            results: {
              books: [...prevState.results.books, ...searchResult.results.books],
              reviews: [...prevState.results.reviews, ...searchResult.results.reviews],
              users: [...prevState.results.users, ...searchResult.results.users],
            },
            pagination: {
              hasMore: searchResult.pagination.hasMore,
              isLoading: false,
              isLoadingMore: false,
              nextCursor: searchResult.pagination.nextCursor ?? null,
              total: searchResult.pagination.total ?? null,
            },
          }), false, 'loadMore:success');

        } catch (error) {
          set({
            pagination: { ...pagination, isLoadingMore: false },
            error: error instanceof Error ? error.message : 'Load more failed',
          }, false, 'loadMore:error');
        }
      },

      getSuggestions: async (query: string) => {
        // For empty or short queries, we'll use the trending API instead
        if (!query || query.trim().length < 2) {
          try {
            const url = new URL(`${API_BASE_URL}/api/trending/suggestions`);

            url.searchParams.set('limit', '5');

            const response = await fetch(url.toString(), {
              credentials: 'include',
              cache: 'no-store',
            });

            if (!response.ok) {
              set({ suggestions: [] }, false, 'getSuggestions:empty');

              return;
            }

            const data: { success: boolean; data: string[] } = await response.json();

            set({ suggestions: data.data || [] }, false, 'getSuggestions:trending');
          } catch (error) {
            console.warn('Failed to get trending suggestions:', error);
            set({ suggestions: [] }, false, 'getSuggestions:error');
          }

          return;
        }

        // Check cache for query-based suggestions
        const cached = get().suggestionsCache.get(query);

        if (cached) {
          set({ suggestions: cached }, false, 'getSuggestions:cached');

          return;
        }

        try {
          const url = new URL(`${API_BASE_URL}/api/trending/suggestions`);

          url.searchParams.set('query', query);
          url.searchParams.set('limit', '10');

          const response = await fetch(url.toString(), {
            credentials: 'include',
            cache: 'no-store',
          });

          if (!response.ok) {
            // Fallback to the original search suggestions endpoint if trending fails
            const searchUrl = new URL(`${API_BASE_URL}/api/search/suggestions`);

            searchUrl.searchParams.set('query', query);
            searchUrl.searchParams.set('limit', '10');

            const searchResponse = await fetch(searchUrl.toString(), {
              credentials: 'include',
              cache: 'no-store',
            });

            if (searchResponse.ok) {
              const searchData: { data: SearchSuggestionsResponse } = await searchResponse.json();
              const suggestions = searchData.data.suggestions.map(s => s.text);

              get().suggestionsCache.set(query, suggestions);
              set({ suggestions }, false, 'getSuggestions:search');
            }

            return;
          }

          const data: { success: boolean; data: string[] } = await response.json();
          const suggestions = data.data || [];

          // Cache suggestions
          get().suggestionsCache.set(query, suggestions);
          set({ suggestions }, false, 'getSuggestions:success');

        } catch (error) {
          // Fail silently for suggestions
          console.warn('Failed to get suggestions:', error);
        }
      },

      addRecentSearch: (query: string) => {
        if (!query.trim()) {return;}

        set((state) => {
          const trimmedQuery = query.trim();
          const recent = state.recentSearches.filter(s => s !== trimmedQuery);

          return {
            recentSearches: [trimmedQuery, ...recent].slice(0, 10) // Keep only last 10
          };
        }, false, 'addRecentSearch');
      },

      searchBooks: async (query: string, source = 'db'): Promise<BookSearchResult[]> => {
        const url = new URL(`${API_BASE_URL}/api/search/books`);

        url.searchParams.set('query', query);
        url.searchParams.set('source', source);
        url.searchParams.set('limit', '20');

        const response = await fetch(url.toString(), {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Book search failed: ${response.statusText}`);
        }

        const data: { data: { books: BookSearchResult[] } } = await response.json();

        return data.data.books;
      },

      addManualBook: async (bookData: ManualBookRequest): Promise<BookSearchResult> => {
        const response = await fetch(`${API_BASE_URL}/api/books/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(bookData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create book: ${response.statusText}`);
        }

        const data: { data: { book: BookSearchResult } } = await response.json();

        return data.data.book;
      },

      reset: () => {
        set(initialState, false, 'reset');
      },

      clearResults: () => {
        set({
          results: { books: [], reviews: [], users: [] },
          pagination: { ...get().pagination, hasMore: false, total: 0, nextCursor: null }
        }, false, 'clearResults');
      },

      clearCache: () => {
        set({
          cache: new Map(),
          suggestionsCache: new Map()
        }, false, 'clearCache');
      },

      setError: (error: string | null) => {
        set({ error }, false, 'setError');
      },
    }),
    {
      name: 'search-store',
      store: 'search-store',
    }
  )
);

// Helper hooks
export const useSearchResults = () => {
  const { results, type } = useSearchStore();

  if (type === 'all') {
    return {
      books: results.books,
      reviews: results.reviews,
      users: results.users,
    };
  }

  return {
    books: type === 'books' ? results.books : [],
    reviews: type === 'reviews' ? results.reviews : [],
    users: type === 'users' ? results.users : [],
  };
};

export const useSearchPagination = () => {
  const { pagination } = useSearchStore();

  return pagination;
};

export const useSearchSuggestions = () => {
  const { suggestions, recentSearches } = useSearchStore();

  return { suggestions, recentSearches };
};

export default useSearchStore;
