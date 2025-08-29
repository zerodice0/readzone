import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { GetContentDto } from './dto/get-content.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * GET /api/content/terms
   * 서비스 이용약관 조회
   */
  @Get('terms')
  @HttpCode(HttpStatus.OK)
  async getTerms(@Query() query: GetContentDto) {
    try {
      const result = await this.contentService.getContent(
        'terms',
        query.version,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * GET /api/content/privacy
   * 개인정보 처리방침 조회
   */
  @Get('privacy')
  @HttpCode(HttpStatus.OK)
  async getPrivacy(@Query() query: GetContentDto) {
    try {
      const result = await this.contentService.getContent(
        'privacy',
        query.version,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * GET /api/content/metadata
   * 모든 약관/방침의 메타데이터 조회
   */
  @Get('metadata')
  @HttpCode(HttpStatus.OK)
  async getAllMetadata() {
    try {
      const result = await this.contentService.getAllContentMetadata();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * GET /api/content/:type/version
   * 특정 타입의 최신 버전 정보 조회
   */
  @Get(':type/version')
  @HttpCode(HttpStatus.OK)
  async getLatestVersion(@Param('type') type: 'terms' | 'privacy') {
    try {
      if (!['terms', 'privacy'].includes(type)) {
        return {
          success: false,
          error: 'Invalid content type. Must be "terms" or "privacy".',
        };
      }

      const version = await this.contentService.getLatestVersion(type);
      return {
        success: true,
        data: { version },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * GET /api/content/:type/history
   * 특정 타입의 버전 히스토리 조회
   */
  @Get(':type/history')
  @HttpCode(HttpStatus.OK)
  async getVersionHistory(@Param('type') type: 'terms' | 'privacy') {
    try {
      if (!['terms', 'privacy'].includes(type)) {
        return {
          success: false,
          error: 'Invalid content type. Must be "terms" or "privacy".',
        };
      }

      const history = await this.contentService.getVersionHistory(type);
      return {
        success: true,
        data: { history },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * GET /api/content/:type/validate
   * 콘텐츠 유효성 및 검토 필요성 확인
   */
  @Get(':type/validate')
  @HttpCode(HttpStatus.OK)
  async validateContent(@Param('type') type: 'terms' | 'privacy') {
    try {
      if (!['terms', 'privacy'].includes(type)) {
        return {
          success: false,
          error: 'Invalid content type. Must be "terms" or "privacy".',
        };
      }

      const validation = await this.contentService.validateContent(type);
      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
