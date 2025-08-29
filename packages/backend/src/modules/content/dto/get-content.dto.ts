import { IsOptional, IsString, IsIn } from 'class-validator';

export class GetContentDto {
  @IsOptional()
  @IsString()
  version?: string;
}

export class GetContentByTypeDto {
  @IsIn(['terms', 'privacy'])
  type: 'terms' | 'privacy';
}

export class ContentMetadata {
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

export class ContentResponse {
  metadata: ContentMetadata;
  content: string;
}
