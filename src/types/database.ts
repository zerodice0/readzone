export interface Book {
  id: string;
  isbn?: string | null;
  title: string;
  authors: string;
  publisher?: string | null;
  genre?: string | null;
  pageCount?: number | null;
  thumbnail?: string | null;
  description?: string | null;
  isManualEntry: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookReview {
  id: string;
  title?: string | null;
  content: string;
  isRecommended: boolean;
  tags: string;
  purchaseLink?: string | null;
  linkClicks: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  bookId: string;
}

export interface BookOpinion {
  id: string;
  content: string;
  isRecommended: boolean;
  createdAt: Date;
  userId: string;
  bookId: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  reviewId: string;
}