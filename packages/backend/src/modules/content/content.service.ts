import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { ContentMetadata, ContentResponse } from './dto/get-content.dto';

@Injectable()
export class ContentService {
  private readonly contentDir = join(process.cwd(), 'src', 'content');

  /**
   * 약관 또는 개인정보 처리방침 조회
   * @param type 'terms' 또는 'privacy'
   * @param version 특정 버전 (선택사항, 미지정시 최신 버전)
   */
  async getContent(
    type: 'terms' | 'privacy',
    version?: string,
  ): Promise<ContentResponse> {
    try {
      const metaFileName =
        type === 'terms' ? 'terms-meta.json' : 'privacy-meta.json';
      const metaPath = join(this.contentDir, metaFileName);

      // 메타데이터 읽기
      const metaContent = await readFile(metaPath, 'utf-8');
      const metadata: ContentMetadata = JSON.parse(
        metaContent,
      ) as ContentMetadata;

      // 버전 확인 (버전 지정 시 해당 버전이 유효한지 검증)
      if (
        version &&
        version !== metadata.version &&
        !metadata.previousVersions.includes(version)
      ) {
        throw new Error(`Version ${version} not found`);
      }

      // 비활성 상태 확인
      if (!metadata.isActive) {
        throw new Error('Content is currently inactive');
      }

      // 마크다운 콘텐츠 읽기
      const contentFileName = type === 'terms' ? 'terms.md' : 'privacy.md';
      const contentPath = join(this.contentDir, contentFileName);
      const content = await readFile(contentPath, 'utf-8');

      return {
        metadata,
        content,
      };
    } catch (error) {
      throw new Error(
        `Failed to load ${type} content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 모든 약관/방침의 메타데이터 목록 조회
   */
  async getAllContentMetadata(): Promise<ContentMetadata[]> {
    try {
      const termsData = await this.getContentMetadata('terms');
      const privacyData = await this.getContentMetadata('privacy');

      return [termsData, privacyData];
    } catch (error) {
      throw new Error(
        `Failed to load content metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 특정 타입의 메타데이터만 조회
   */
  private async getContentMetadata(
    type: 'terms' | 'privacy',
  ): Promise<ContentMetadata> {
    const metaFileName =
      type === 'terms' ? 'terms-meta.json' : 'privacy-meta.json';
    const metaPath = join(this.contentDir, metaFileName);

    const metaContent = await readFile(metaPath, 'utf-8');
    return JSON.parse(metaContent) as ContentMetadata;
  }

  /**
   * 특정 타입의 최신 버전 조회
   */
  async getLatestVersion(type: 'terms' | 'privacy'): Promise<string> {
    try {
      const metadata = await this.getContentMetadata(type);
      return metadata.version;
    } catch (error) {
      throw new Error(
        `Failed to get latest version for ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 특정 타입의 버전 히스토리 조회
   */
  async getVersionHistory(
    type: 'terms' | 'privacy',
  ): Promise<ContentMetadata['changeLog']> {
    try {
      const metadata = await this.getContentMetadata(type);
      return metadata.changeLog;
    } catch (error) {
      throw new Error(
        `Failed to get version history for ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * 콘텐츠 유효성 검증
   */
  async validateContent(type: 'terms' | 'privacy'): Promise<{
    isValid: boolean;
    needsReview: boolean;
    reviewReason?: string;
    nextReviewDate: string;
    lastModified: string;
  }> {
    try {
      const metadata = await this.getContentMetadata(type);
      const now = new Date();
      const nextReviewDate = new Date(metadata.nextReviewDate);

      const needsReview = nextReviewDate < now;
      const isValid = metadata.isActive;

      return {
        isValid,
        needsReview,
        reviewReason: needsReview ? '정기 검토 기간 도래' : undefined,
        nextReviewDate: metadata.nextReviewDate,
        lastModified: metadata.lastModified,
      };
    } catch (error) {
      throw new Error(
        `Failed to validate ${type} content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
