// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// User Types
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  nickname?: string;
  bio?: string;
  avatar?: string;
  isPublic?: boolean;
}

// Post Types
export interface CreatePostData {
  content: string;
  isbn: string;
  rating?: number;
  readingProgress?: number;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdatePostData {
  content?: string;
  rating?: number;
  readingProgress?: number;
  tags?: string[];
  isPublic?: boolean;
}

export interface PostQueryParams extends PaginationParams {
  type?: 'public' | 'following' | 'my';
  userId?: string;
  isbn?: string;
  sort?: 'recent' | 'popular' | 'rating';
}

// Book Types
export interface BookSearchParams {
  query: string;
  sort?: 'accuracy' | 'recency';
  page?: number;
  size?: number;
}

export interface KakaoBookResponse {
  title: string;
  contents: string;
  url: string;
  isbn: string;
  datetime: string;
  authors: string[];
  publisher: string;
  translators: string[];
  price: number;
  sale_price: number;
  thumbnail: string;
  status: string;
}

// Comment Types
export interface CreateCommentData {
  content: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

// Library Types
export interface LibraryBookData {
  isbn: string;
  status: 'want_to_read' | 'reading' | 'completed';
  currentPage?: number;
  notes?: string;
}

export interface UpdateLibraryBookData {
  status?: 'want_to_read' | 'reading' | 'completed';
  currentPage?: number;
  totalPages?: number;
  notes?: string;
}

// Analytics Types
export interface ReadingStats {
  summary: {
    booksRead: number;
    pagesRead: number;
    averageRating: number;
    favoriteGenres: string[];
    readingStreak: number;
  };
  monthly: {
    month: string;
    booksRead: number;
    pagesRead: number;
  }[];
  genres: {
    genre: string;
    count: number;
    percentage: number;
  }[];
}

export interface ReadingGoalData {
  yearlyBooksTarget: number;
  yearlyPagesTarget: number;
}