export interface User {
    id: string;
    email: string;
    nickname: string;
    bio?: string;
    profileImage?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface Book {
    id: string;
    isbn?: string;
    title: string;
    author: string;
    publisher?: string;
    publishedAt?: string;
    description?: string;
    thumbnail?: string;
    category?: string;
    pages?: number;
    source: BookSource;
    externalId?: string;
    createdAt: string;
    updatedAt: string;
}
export interface Review {
    id: string;
    title: string;
    content: string;
    isRecommended: boolean;
    rating?: number;
    tags?: string[];
    isPublic: boolean;
    status: ReviewStatus;
    createdAt: string;
    updatedAt: string;
    userId: string;
    bookId: string;
    user: User;
    book: Book;
    likes: Like[];
    comments: Comment[];
    _count?: {
        likes: number;
        comments: number;
    };
}
export interface Like {
    id: string;
    userId: string;
    reviewId: string;
    createdAt: string;
    user: User;
}
export interface Comment {
    id: string;
    content: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    reviewId: string;
    user: User;
    replies?: Comment[];
}
export interface Follow {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: string;
    follower: User;
    following: User;
}
export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    isRead: boolean;
    data?: string;
    createdAt: string;
    userId: string;
    senderId?: string;
    reviewId?: string;
    commentId?: string;
    user: User;
    sender?: User;
}
export declare enum BookSource {
    KAKAO_API = "KAKAO_API",
    DATABASE = "DATABASE",
    MANUAL = "MANUAL"
}
export declare enum ReviewStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare enum NotificationType {
    LIKE = "LIKE",
    COMMENT = "COMMENT",
    REPLY = "REPLY",
    FOLLOW = "FOLLOW",
    SYSTEM = "SYSTEM"
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface LoginFormData {
    email: string;
    password: string;
}
export interface RegisterFormData {
    email: string;
    nickname: string;
    password: string;
    confirmPassword: string;
}
export interface ReviewFormData {
    title: string;
    content: string;
    bookId: string;
    isRecommended: boolean;
    rating?: number;
    tags: string[];
    isPublic: boolean;
}
export interface SearchBookParams {
    query: string;
    page?: number;
    limit?: number;
}
export interface KakaoBookResponse {
    documents: KakaoBook[];
    meta: {
        total_count: number;
        pageable_count: number;
        is_end: boolean;
    };
}
export interface KakaoBook {
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
