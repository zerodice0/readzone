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
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    booksReadCount: number;
  };
  isFollowing?: boolean;
}

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
  displayName?: string;
  bio?: string;
  avatar?: string;
  isPublic?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Book Types
export interface Book {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  thumbnail?: string;
  categories: string[];
  pageCount?: number;
  price?: number;
  salePrice?: number;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookWithStats extends Book {
  stats: {
    postsCount: number;
    averageRating: number;
    readingCount: number;
    wantToReadCount: number;
    completedCount: number;
  };
}

export interface BookSearchParams {
  query: string;
  sort?: 'accuracy' | 'recency';
  page?: number;
  size?: number;
}

// Post Types
export interface Post {
  id: string;
  content: string;
  rating?: number;
  readingProgress: number;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
  book: Pick<Book, 'id' | 'isbn' | 'title' | 'authors' | 'thumbnail'>;
  stats: {
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
  };
}

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

export interface PostQueryParams {
  type?: 'public' | 'following' | 'my';
  userId?: string;
  isbn?: string;
  sort?: 'recent' | 'popular' | 'rating';
  page?: number;
  limit?: number;
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
  replies?: Comment[];
}

export interface CreateCommentData {
  content: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

// Library Types
export interface LibraryBook {
  id: string;
  status: 'want_to_read' | 'reading' | 'completed';
  currentPage: number;
  totalPages?: number;
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
  book: Book;
}

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

export interface ReadingGoal {
  id: string;
  year: number;
  booksTarget: number;
  pagesTarget: number;
  booksRead: number;
  pagesRead: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingGoalData {
  yearlyBooksTarget: number;
  yearlyPagesTarget: number;
}

// Search Types
export interface SearchResult {
  posts: Post[];
  users: UserProfile[];
  books: Book[];
}