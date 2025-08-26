import { ReviewsService } from './reviews.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { LikeActionDto } from './dto/like-action.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    getFeed(feedQueryDto: FeedQueryDto): Promise<{
        success: boolean;
        data: {
            reviews: {
                createdAt: string;
                updatedAt: string;
                userId: string;
                id: string;
                title: string;
                content: string;
                isRecommended: boolean;
                rating: number | null;
                tags: string | null;
                isPublic: boolean;
                status: string;
                bookId: string;
            }[];
            hasMore: boolean;
            nextCursor: string | null;
        };
    }>;
    createReview(createReviewDto: CreateReviewDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        success: boolean;
        data: {
            review: {
                createdAt: string;
                updatedAt: string;
                user: {
                    userid: string;
                    nickname: string;
                    id: string;
                    profileImage: string | null;
                    isVerified: boolean;
                };
                book: {
                    id: string;
                    isbn: string | null;
                    title: string;
                    author: string;
                    thumbnail: string | null;
                };
                _count: {
                    likes: number;
                    comments: number;
                };
                userId: string;
                id: string;
                title: string;
                content: string;
                isRecommended: boolean;
                rating: number | null;
                tags: string | null;
                isPublic: boolean;
                status: string;
                bookId: string;
            };
        };
    }>;
    likeReview(reviewId: string, likeActionDto: LikeActionDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        success: boolean;
        data: {
            action: import("./dto/like-action.dto").LikeAction;
            likeCount: number;
        };
    }>;
}
