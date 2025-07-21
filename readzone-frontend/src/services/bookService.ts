import api from './api';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  thumbnail?: string;
  categories?: string[];
  pageCount?: number;
  price?: number;
  salePrice?: number;
  url?: string;
  status: string;
  stats?: {
    postsCount: number;
    libraryCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookSearchResult {
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  thumbnail?: string;
  url?: string;
  price?: number;
  salePrice?: number;
  status?: string;
  translators?: string[];
}

export interface BookPost {
  id: string;
  content: string;
  rating?: number;
  readingProgress: number;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    nickname: string;
    avatar: string | null;
  };
  book: {
    id: string;
    title: string;
    authors: string[];
    thumbnail: string | null;
    isbn: string;
  };
  stats: {
    likesCount: number;
    commentsCount: number;
  };
  isLiked?: boolean;
}

export interface BookSearchParams {
  query: string;
  page?: number;
  limit?: number;
}

export interface BookSearchResponse {
  books: BookSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

export interface BookResponse {
  success: boolean;
  data: Book;
}

export interface BookPostsResponse {
  success: boolean;
  data: {
    book: {
      id: string;
      title: string;
    };
    posts: BookPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PopularBooksResponse {
  success: boolean;
  data: {
    books: Book[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const bookService = {
  // 도서 검색 (카카오 API)
  searchBooks: async (params: BookSearchParams): Promise<BookSearchResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.query);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await api.get<{ success: boolean; data: BookSearchResponse }>(`/books/search?${searchParams}`);
    return response.data.data;
  },

  // ISBN으로 도서 조회
  getBookByIsbn: async (isbn: string): Promise<Book> => {
    const response = await api.get<BookResponse>(`/books/isbn/${isbn}`);
    return response.data.data;
  },

  // 도서 상세 정보 조회 (ID)
  getBookById: async (id: string): Promise<Book> => {
    const response = await api.get<BookResponse>(`/books/${id}`);
    return response.data.data;
  },

  // 도서 관련 게시글 조회
  getBookPosts: async (
    isbn: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ book: { id: string; title: string }; posts: BookPost[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<BookPostsResponse>(`/books/isbn/${isbn}/posts?${params}`);
    return response.data.data;
  },

  // 인기 도서 목록 조회
  getPopularBooks: async (params?: { page?: number; limit?: number }): Promise<{ books: Book[]; pagination: any }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await api.get<PopularBooksResponse>(`/books/popular?${searchParams}`);
    return response.data.data;
  },

  // 도서 정보 저장
  saveBook: async (bookData: Partial<BookSearchResult>): Promise<Book> => {
    const response = await api.post<{ success: boolean; data: Book; message: string }>('/books', bookData);
    return response.data.data;
  }
};