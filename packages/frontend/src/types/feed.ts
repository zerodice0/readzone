export interface ReviewCard {
  id: string;
  content: string; // 미리보기 (150자)
  createdAt: string;
  author: {
    id: string;
    userid: string;
    nickname: string;
    profileImage?: string | null;
    isVerified?: boolean;
  };
  book: {
    id: string;
    title: string;
    author: string;
    cover?: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  userInteraction: {
    isLiked: boolean;
    isBookmarked: boolean;
  } | null; // 비로그인시 null
}

export interface FeedRequest {
  tab: 'recommended' | 'latest' | 'following';
  cursor?: string;
  limit: number; // 기본값: 20
}

export interface FeedResponse {
  reviews: ReviewCard[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface LikeRequest {
  action: 'like' | 'unlike';
}

export interface LikeResponse {
  success: boolean;
  likesCount: number;
  isLiked: boolean;
}

export type FeedTab = 'recommended' | 'latest' | 'following';