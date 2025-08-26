"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const feed_query_dto_1 = require("./dto/feed-query.dto");
const like_action_dto_1 = require("./dto/like-action.dto");
let ReviewsService = class ReviewsService {
    prismaService;
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async getFeed(feedQueryDto) {
        const { tab, cursor, limit } = feedQueryDto;
        const baseConditions = {
            status: 'PUBLISHED',
            isPublic: true,
        };
        let orderBy = {};
        switch (tab) {
            case feed_query_dto_1.FeedTab.RECOMMENDED:
                orderBy = { createdAt: 'desc' };
                break;
            case feed_query_dto_1.FeedTab.LATEST:
                orderBy = { createdAt: 'desc' };
                break;
            case feed_query_dto_1.FeedTab.FOLLOWING:
                orderBy = { createdAt: 'desc' };
                break;
        }
        const queryOptions = {
            where: baseConditions,
            include: {
                user: {
                    select: {
                        id: true,
                        userid: true,
                        nickname: true,
                        profileImage: true,
                        isVerified: true,
                    },
                },
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        isbn: true,
                        thumbnail: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
            orderBy,
            take: limit,
        };
        if (cursor) {
            queryOptions.cursor = { id: cursor };
            queryOptions.skip = 1;
        }
        const reviews = await this.prismaService.review.findMany(queryOptions);
        return {
            success: true,
            data: {
                reviews: reviews.map((review) => ({
                    ...review,
                    createdAt: review.createdAt.toISOString(),
                    updatedAt: review.updatedAt.toISOString(),
                })),
                hasMore: reviews.length === limit,
                nextCursor: reviews.length === limit ? reviews[reviews.length - 1].id : null,
            },
        };
    }
    async createReview(createReviewDto, userId) {
        const review = await this.prismaService.review.create({
            data: {
                bookId: createReviewDto.bookId,
                title: createReviewDto.title,
                content: createReviewDto.content,
                isRecommended: createReviewDto.isRecommended,
                rating: createReviewDto.rating,
                tags: createReviewDto.tags
                    ? JSON.stringify(createReviewDto.tags)
                    : null,
                isPublic: createReviewDto.isPublic,
                userId,
                status: 'PUBLISHED',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        userid: true,
                        nickname: true,
                        profileImage: true,
                        isVerified: true,
                    },
                },
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        isbn: true,
                        thumbnail: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
        return {
            success: true,
            data: {
                review: {
                    ...review,
                    createdAt: review.createdAt.toISOString(),
                    updatedAt: review.updatedAt.toISOString(),
                },
            },
        };
    }
    async likeReview(reviewId, likeActionDto, userId) {
        const { action } = likeActionDto;
        if (action === like_action_dto_1.LikeAction.LIKE) {
            await this.prismaService.like.upsert({
                where: {
                    userId_reviewId: {
                        userId,
                        reviewId,
                    },
                },
                create: {
                    userId,
                    reviewId,
                },
                update: {},
            });
        }
        else {
            await this.prismaService.like.deleteMany({
                where: {
                    userId,
                    reviewId,
                },
            });
        }
        const likeCount = await this.prismaService.like.count({
            where: { reviewId },
        });
        return {
            success: true,
            data: {
                action,
                likeCount,
            },
        };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map