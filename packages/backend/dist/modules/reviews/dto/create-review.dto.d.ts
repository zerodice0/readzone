export declare class CreateReviewDto {
    bookId: string;
    title: string;
    content: string;
    isRecommended: boolean;
    rating?: number;
    tags?: string[];
    isPublic: boolean;
}
