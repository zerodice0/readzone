import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface ContentMetadata {
  title: string
  type: 'terms-of-service' | 'privacy-policy'
  version: string
  effectiveDate: string
  lastModified: string
  language: string
  previousVersions: string[]
  changeLog: {
    version: string
    date: string
    changes: string[]
    author: string
  }[]
  nextReviewDate: string
  isActive: boolean
  legalBasis: string
  contentPath: string
}

interface ContentResponse {
  metadata: ContentMetadata
  content: string
}

class ContentService {
  private readonly contentDir = path.join(__dirname, '../content')

  /**
   * 약관 또는 개인정보 처리방침 조회
   * @param type 'terms' 또는 'privacy'
   * @param version 특정 버전 (선택사항, 미지정시 최신 버전)
   */
  async getContent(type: 'terms' | 'privacy', version?: string): Promise<ContentResponse> {
    try {
      const metaFileName = type === 'terms' ? 'terms-meta.json' : 'privacy-meta.json'
      const metaPath = path.join(this.contentDir, metaFileName)
      
      // 메타데이터 읽기
      const metaContent = await fs.readFile(metaPath, 'utf-8')
      const metadata: ContentMetadata = JSON.parse(metaContent)
      
      // 버전 확인 (버전 지정 시 해당 버전이 유효한지 검증)
      if (version && version !== metadata.version && !metadata.previousVersions.includes(version)) {
        throw new Error(`Version ${version} not found`)
      }
      
      // 비활성 상태 확인
      if (!metadata.isActive) {
        throw new Error('Content is currently inactive')
      }
      
      // 마크다운 콘텐츠 읽기
      const contentFileName = type === 'terms' ? 'terms.md' : 'privacy.md'
      const contentPath = path.join(this.contentDir, contentFileName)
      const content = await fs.readFile(contentPath, 'utf-8')
      
      return {
        metadata,
        content
      }
    } catch (error) {
      throw new Error(`Failed to load ${type} content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 모든 약관/방침의 메타데이터 목록 조회
   */
  async getAllContentMetadata(): Promise<ContentMetadata[]> {
    try {
      const termsData = await this.getContentMetadata('terms')
      const privacyData = await this.getContentMetadata('privacy')
      
      return [termsData, privacyData]
    } catch (error) {
      throw new Error(`Failed to load content metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 특정 타입의 메타데이터만 조회
   */
  private async getContentMetadata(type: 'terms' | 'privacy'): Promise<ContentMetadata> {
    const metaFileName = type === 'terms' ? 'terms-meta.json' : 'privacy-meta.json'
    const metaPath = path.join(this.contentDir, metaFileName)
    
    const metaContent = await fs.readFile(metaPath, 'utf-8')

    return JSON.parse(metaContent) as ContentMetadata
  }

  /**
   * 최신 버전 확인
   */
  async getLatestVersion(type: 'terms' | 'privacy'): Promise<string> {
    const metadata = await this.getContentMetadata(type)

    return metadata.version
  }

  /**
   * 버전 히스토리 조회
   */
  async getVersionHistory(type: 'terms' | 'privacy'): Promise<ContentMetadata['changeLog']> {
    const metadata = await this.getContentMetadata(type)

    return metadata.changeLog
  }

  /**
   * 콘텐츠 유효성 검증 (정기 검토일 확인 등)
   */
  async validateContent(type: 'terms' | 'privacy'): Promise<{
    isValid: boolean
    needsReview: boolean
    nextReviewDate: string
    daysUntilReview: number
  }> {
    const metadata = await this.getContentMetadata(type)
    const now = new Date()
    const reviewDate = new Date(metadata.nextReviewDate)
    const daysUntilReview = Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      isValid: metadata.isActive,
      needsReview: daysUntilReview <= 30, // 30일 이내면 검토 필요
      nextReviewDate: metadata.nextReviewDate,
      daysUntilReview
    }
  }
}

export const contentService = new ContentService()
export type { ContentResponse, ContentMetadata }