import api from './api';

// 타입 정의
export type LibraryStatus = 'want_to_read' | 'reading' | 'completed';

export interface LibraryBook {
  id: string;
  userId: string;
  bookId: string;
  status: LibraryStatus;
  currentPage: number;
  totalPages: number | null;
  notes: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  book: {
    id: string;
    isbn: string;
    title: string;
    authors: string[];
    publisher: string | null;
    publishedDate: string | null;
    description: string | null;
    thumbnail: string | null;
    categories: string[];
    pageCount: number | null;
  };
}

export interface LibraryStats {
  stats: {
    want_to_read: number;
    reading: number;
    completed: number;
  };
  recentlyCompleted: LibraryBook[];
  currentlyReading: Array<LibraryBook & { progressPercentage: number }>;
  totalBooks: number;
}

export interface LibraryBooksResponse {
  success: boolean;
  data: {
    libraryBooks: LibraryBook[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface LibraryBookResponse {
  success: boolean;
  data: LibraryBook | null;
}

export interface LibraryStatsResponse {
  success: boolean;
  data: LibraryStats;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface AddOrUpdateLibraryBookParams {
  status: LibraryStatus;
  currentPage?: number;
  totalPages?: number;
  notes?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

// 도서 서재 서비스
export const libraryService = {
  // 서재 도서 목록 조회
  getLibraryBooks: async (params: {
    page?: number;
    limit?: number;
    status?: LibraryStatus;
    search?: string;
  } = {}): Promise<LibraryBooksResponse['data']> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);

    const response = await api.get<LibraryBooksResponse>(`/library?${searchParams}`);
    return response.data.data;
  },

  // 특정 도서의 서재 정보 조회
  getLibraryBook: async (bookId: string): Promise<LibraryBook | null> => {
    const response = await api.get<LibraryBookResponse>(`/library/books/${bookId}`);
    return response.data.data;
  },

  // 도서를 서재에 추가 또는 상태 업데이트
  addOrUpdateLibraryBook: async (
    bookId: string,
    params: AddOrUpdateLibraryBookParams
  ): Promise<LibraryBook> => {
    const response = await api.put<LibraryBookResponse>(`/library/books/${bookId}`, params);
    return response.data.data!;
  },

  // 서재에서 도서 제거
  removeLibraryBook: async (bookId: string): Promise<void> => {
    await api.delete<MessageResponse>(`/library/books/${bookId}`);
  },

  // 서재 통계 조회
  getLibraryStats: async (): Promise<LibraryStats> => {
    const response = await api.get<LibraryStatsResponse>('/library/stats');
    return response.data.data;
  },

  // 읽기 진행률 업데이트
  updateReadingProgress: async (
    bookId: string,
    params: { currentPage: number; notes?: string }
  ): Promise<LibraryBook> => {
    const response = await api.patch<LibraryBookResponse>(`/library/books/${bookId}/progress`, params);
    return response.data.data!;
  },
};

export default libraryService;