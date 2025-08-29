import { ContentService } from './content.service';
import { GetContentDto } from './dto/get-content.dto';
export declare class ContentController {
    private readonly contentService;
    constructor(contentService: ContentService);
    getTerms(query: GetContentDto): Promise<{
        success: boolean;
        data: import("./dto/get-content.dto").ContentResponse;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        data?: undefined;
    }>;
    getPrivacy(query: GetContentDto): Promise<{
        success: boolean;
        data: import("./dto/get-content.dto").ContentResponse;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        data?: undefined;
    }>;
    getAllMetadata(): Promise<{
        success: boolean;
        data: import("./dto/get-content.dto").ContentMetadata[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        data?: undefined;
    }>;
    getLatestVersion(type: 'terms' | 'privacy'): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            version: string;
        };
        error?: undefined;
    }>;
    getVersionHistory(type: 'terms' | 'privacy'): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            history: {
                version: string;
                date: string;
                changes: string[];
                author: string;
            }[];
        };
        error?: undefined;
    }>;
    validateContent(type: 'terms' | 'privacy'): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            isValid: boolean;
            needsReview: boolean;
            reviewReason?: string;
            nextReviewDate: string;
            lastModified: string;
        };
        error?: undefined;
    }>;
}
