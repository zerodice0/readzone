import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  libraryService, 
  type LibraryBook, 
  type LibraryStats, 
  type LibraryStatus,
  type AddOrUpdateLibraryBookParams 
} from '../services/libraryService';

interface LibraryState {
  libraryBooks: LibraryBook[];
  libraryStats: LibraryStats | null;
  currentBook: LibraryBook | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: LibraryStatus;
    search?: string;
  };
}

interface LibraryActions {
  fetchLibraryBooks: (params?: {
    page?: number;
    limit?: number;
    status?: LibraryStatus;
    search?: string;
  }) => Promise<void>;
  fetchLibraryBook: (bookId: string) => Promise<void>;
  addOrUpdateLibraryBook: (bookId: string, params: AddOrUpdateLibraryBookParams) => Promise<void>;
  removeLibraryBook: (bookId: string) => Promise<void>;
  fetchLibraryStats: () => Promise<void>;
  updateReadingProgress: (bookId: string, currentPage: number, notes?: string) => Promise<void>;
  setFilters: (filters: { status?: LibraryStatus; search?: string }) => void;
  clearError: () => void;
  resetLibrary: () => void;
}

type LibraryStore = LibraryState & LibraryActions;

const initialState: LibraryState = {
  libraryBooks: [],
  libraryStats: null,
  currentBook: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

export const useLibraryStore = create<LibraryStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    fetchLibraryBooks: async (params = {}) => {
      set({ isLoading: true, error: null });
      try {
        const { filters } = get();
        const searchParams = {
          ...filters,
          ...params,
        };

        const data = await libraryService.getLibraryBooks(searchParams);
        set({
          libraryBooks: data.libraryBooks,
          pagination: data.pagination,
          isLoading: false,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.error?.message || '서재 목록을 불러오는 중 오류가 발생했습니다.',
          isLoading: false,
        });
      }
    },

    fetchLibraryBook: async (bookId: string) => {
      set({ isLoading: true, error: null });
      try {
        const libraryBook = await libraryService.getLibraryBook(bookId);
        set({
          currentBook: libraryBook,
          isLoading: false,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.error?.message || '서재 정보를 불러오는 중 오류가 발생했습니다.',
          isLoading: false,
        });
      }
    },

    addOrUpdateLibraryBook: async (bookId: string, params: AddOrUpdateLibraryBookParams) => {
      try {
        const updatedBook = await libraryService.addOrUpdateLibraryBook(bookId, params);
        
        // 현재 도서 정보 업데이트
        set({ currentBook: updatedBook });

        // 목록에서 해당 도서 업데이트 또는 추가
        set((state) => {
          const existingIndex = state.libraryBooks.findIndex(book => book.bookId === bookId);
          if (existingIndex >= 0) {
            const newBooks = [...state.libraryBooks];
            newBooks[existingIndex] = updatedBook;
            return { libraryBooks: newBooks };
          } else {
            return { libraryBooks: [updatedBook, ...state.libraryBooks] };
          }
        });

        // 통계 다시 가져오기
        get().fetchLibraryStats();
      } catch (error: any) {
        set({
          error: error.response?.data?.error?.message || '서재 정보 업데이트 중 오류가 발생했습니다.',
        });
      }
    },

    removeLibraryBook: async (bookId: string) => {
      try {
        await libraryService.removeLibraryBook(bookId);
        
        // 목록에서 제거
        set((state) => ({
          libraryBooks: state.libraryBooks.filter(book => book.bookId !== bookId),
          currentBook: state.currentBook?.bookId === bookId ? null : state.currentBook,
        }));

        // 통계 다시 가져오기
        get().fetchLibraryStats();
      } catch (error: any) {
        set({
          error: error.response?.data?.error?.message || '서재에서 도서 제거 중 오류가 발생했습니다.',
        });
      }
    },

    fetchLibraryStats: async () => {
      try {
        const stats = await libraryService.getLibraryStats();
        set({ libraryStats: stats });
      } catch (error: any) {
        console.error('서재 통계 조회 오류:', error);
        // 통계는 중요하지 않으므로 에러를 무시하고 콘솔에만 출력
      }
    },

    updateReadingProgress: async (bookId: string, currentPage: number, notes?: string) => {
      try {
        const updatedBook = await libraryService.updateReadingProgress(bookId, {
          currentPage,
          notes,
        });

        // 현재 도서 정보 업데이트
        set({ currentBook: updatedBook });

        // 목록에서 해당 도서 업데이트
        set((state) => {
          const existingIndex = state.libraryBooks.findIndex(book => book.bookId === bookId);
          if (existingIndex >= 0) {
            const newBooks = [...state.libraryBooks];
            newBooks[existingIndex] = updatedBook;
            return { libraryBooks: newBooks };
          }
          return state;
        });

        // 완료된 경우 통계 다시 가져오기
        if (updatedBook.status === 'completed') {
          get().fetchLibraryStats();
        }
      } catch (error: any) {
        set({
          error: error.response?.data?.error?.message || '읽기 진행률 업데이트 중 오류가 발생했습니다.',
        });
      }
    },

    setFilters: (filters: { status?: LibraryStatus; search?: string }) => {
      set({ filters });
    },

    clearError: () => {
      set({ error: null });
    },

    resetLibrary: () => {
      set(initialState);
    },
  }))
);

// 서재 상태별 라벨 헬퍼
export const getStatusLabel = (status: LibraryStatus): string => {
  switch (status) {
    case 'want_to_read':
      return '읽고 싶은 책';
    case 'reading':
      return '읽는 중';
    case 'completed':
      return '완료';
    default:
      return status;
  }
};

// 서재 상태별 색상 헬퍼
export const getStatusColor = (status: LibraryStatus): string => {
  switch (status) {
    case 'want_to_read':
      return 'text-blue-600 bg-blue-100';
    case 'reading':
      return 'text-yellow-600 bg-yellow-100';
    case 'completed':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};