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
exports.BooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BooksService = class BooksService {
    prismaService;
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async searchBooks(searchBooksDto) {
        const { query, page, size } = searchBooksDto;
        const skip = (page - 1) * size;
        const books = await this.prismaService.book.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { author: { contains: query, mode: 'insensitive' } },
                    { isbn: { contains: query, mode: 'insensitive' } },
                ],
            },
            include: {
                _count: {
                    select: {
                        reviews: true,
                    },
                },
            },
            skip,
            take: size,
            orderBy: { createdAt: 'desc' },
        });
        const total = await this.prismaService.book.count({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { author: { contains: query, mode: 'insensitive' } },
                    { isbn: { contains: query, mode: 'insensitive' } },
                ],
            },
        });
        return {
            success: true,
            data: {
                books: books.map((book) => ({
                    ...book,
                    createdAt: book.createdAt.toISOString(),
                    updatedAt: book.updatedAt.toISOString(),
                })),
                pagination: {
                    page,
                    size,
                    total,
                    totalPages: Math.ceil(total / size),
                },
            },
        };
    }
    async getBook(getBookDto) {
        const book = await this.prismaService.book.findUnique({
            where: { id: getBookDto.id },
            include: {
                reviews: {
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
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        reviews: true,
                    },
                },
            },
        });
        if (!book) {
            throw new common_1.NotFoundException('도서를 찾을 수 없습니다.');
        }
        return {
            success: true,
            data: {
                book: {
                    ...book,
                    createdAt: book.createdAt.toISOString(),
                    updatedAt: book.updatedAt.toISOString(),
                    reviews: book.reviews.map((review) => ({
                        ...review,
                        createdAt: review.createdAt.toISOString(),
                        updatedAt: review.updatedAt.toISOString(),
                    })),
                },
            },
        };
    }
    async getPopularBooks() {
        const books = await this.prismaService.book.findMany({
            include: {
                _count: {
                    select: {
                        reviews: true,
                    },
                },
            },
            orderBy: {
                reviews: {
                    _count: 'desc',
                },
            },
            take: 20,
        });
        return {
            success: true,
            data: {
                books: books.map((book) => ({
                    ...book,
                    createdAt: book.createdAt.toISOString(),
                    updatedAt: book.updatedAt.toISOString(),
                })),
            },
        };
    }
};
exports.BooksService = BooksService;
exports.BooksService = BooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BooksService);
//# sourceMappingURL=books.service.js.map