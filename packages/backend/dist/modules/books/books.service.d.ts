import { PrismaService } from '../../prisma/prisma.service';
import { SearchBooksDto } from './dto/search-books.dto';
import { GetBookDto } from './dto/get-book.dto';
export declare class BooksService {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    searchBooks(searchBooksDto: SearchBooksDto): Promise<{
        success: boolean;
        data: {
            books: {
                createdAt: string;
                updatedAt: string;
                _count: {
                    reviews: number;
                };
                id: string;
                isbn: string | null;
                title: string;
                author: string;
                publisher: string | null;
                publishedAt: string | null;
                description: string | null;
                thumbnail: string | null;
                category: string | null;
                pages: number | null;
                source: string;
                externalId: string | null;
            }[];
            pagination: {
                page: number;
                size: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getBook(getBookDto: GetBookDto): Promise<{
        success: boolean;
        data: {
            book: {
                createdAt: string;
                updatedAt: string;
                reviews: {
                    createdAt: string;
                    updatedAt: string;
                    user: {
                        userid: string;
                        nickname: string;
                        id: string;
                        profileImage: string | null;
                        isVerified: boolean;
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
                }[];
                _count: {
                    reviews: number;
                };
                id: string;
                isbn: string | null;
                title: string;
                author: string;
                publisher: string | null;
                publishedAt: string | null;
                description: string | null;
                thumbnail: string | null;
                category: string | null;
                pages: number | null;
                source: string;
                externalId: string | null;
            };
        };
    }>;
    getPopularBooks(): Promise<{
        success: boolean;
        data: {
            books: {
                createdAt: string;
                updatedAt: string;
                _count: {
                    reviews: number;
                };
                id: string;
                isbn: string | null;
                title: string;
                author: string;
                publisher: string | null;
                publishedAt: string | null;
                description: string | null;
                thumbnail: string | null;
                category: string | null;
                pages: number | null;
                source: string;
                externalId: string | null;
            }[];
        };
    }>;
}
