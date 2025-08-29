export declare class GetContentDto {
    version?: string;
}
export declare class GetContentByTypeDto {
    type: 'terms' | 'privacy';
}
export declare class ContentMetadata {
    title: string;
    type: 'terms-of-service' | 'privacy-policy';
    version: string;
    effectiveDate: string;
    lastModified: string;
    language: string;
    previousVersions: string[];
    changeLog: {
        version: string;
        date: string;
        changes: string[];
        author: string;
    }[];
    nextReviewDate: string;
    isActive: boolean;
    legalBasis: string;
    contentPath: string;
}
export declare class ContentResponse {
    metadata: ContentMetadata;
    content: string;
}
