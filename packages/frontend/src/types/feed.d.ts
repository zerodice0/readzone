export interface ReviewCard {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        username: string;
        profileImage?: string;
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
    } | null;
}
export interface FeedRequest {
    tab: 'recommended' | 'latest' | 'following';
    cursor?: string;
    limit: number;
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
