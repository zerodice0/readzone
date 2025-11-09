export interface Review {
  id: string;
  title: string | null;
  content: string;
  isRecommended: boolean;
  rating: number | null;
  readStatus: 'READING' | 'COMPLETED' | 'DROPPED';
  status: 'DRAFT' | 'PUBLISHED' | 'DELETED';
  likeCount: number;
  bookmarkCount: number;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
  book: BookSummary;
  isLikedByMe?: boolean;
  isBookmarkedByMe?: boolean;
}

export interface UserSummary {
  id: string;
  name: string;
  profileImage: string | null;
}

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
}

export interface FeedResponse {
  data: Review[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    timestamp: string;
  };
}

export interface ToggleLikeResponse {
  data: {
    isLiked: boolean;
    likeCount: number;
  };
  meta: {
    timestamp: string;
  };
}

export interface ToggleBookmarkResponse {
  data: {
    isBookmarked: boolean;
    bookmarkCount: number;
  };
  meta: {
    timestamp: string;
  };
}
