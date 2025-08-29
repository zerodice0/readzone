import { ContentMetadata, ContentResponse } from './dto/get-content.dto';
export declare class ContentService {
    private readonly contentDir;
    getContent(type: 'terms' | 'privacy', version?: string): Promise<ContentResponse>;
    getAllContentMetadata(): Promise<ContentMetadata[]>;
    private getContentMetadata;
    getLatestVersion(type: 'terms' | 'privacy'): Promise<string>;
    getVersionHistory(type: 'terms' | 'privacy'): Promise<ContentMetadata['changeLog']>;
    validateContent(type: 'terms' | 'privacy'): Promise<{
        isValid: boolean;
        needsReview: boolean;
        reviewReason?: string;
        nextReviewDate: string;
        lastModified: string;
    }>;
}
