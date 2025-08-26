import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { contentService } from '../services/contentService'
import { createRouteResponse } from '../schemas/common'
import { 
  ContentData, 
  ContentMetadataList, 
  ContentRequest, 
  ContentValidation, 
  VersionHistory,
  VersionInfo 
} from '../schemas/content'

const content = new OpenAPIHono()

// CORS 설정
content.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // 프론트엔드 개발 서버
  allowMethods: ['GET'],
  allowHeaders: ['Content-Type']
}))

// 스키마들은 schemas/content.ts로 이동됨

/**
 * GET /api/content/terms
 * 서비스 이용약관 조회
 * Query Params:
 *   - version: 특정 버전 조회 (선택사항)
 */
const termRoute = createRoute({
  method: 'get',
  path: '/terms',
  tags: ['content'],
  summary: '서비스 이용약관 조회',
  description: '서비스 이용약관을 조회합니다.',
  request: {
    query: ContentRequest.versionQuery
  },
  responses: createRouteResponse(ContentData, {
    successDescription: '약관 조회 성공',
    errorDescription: '서버 오류'
  })
})

content.openapi(termRoute, async (c) => {
  try {
    const version = c.req.query('version')
    const result = await contentService.getContent('terms', version)
    
    // 스키마에 맞게 데이터 변환
    return c.json({
      success: true as const,
      data: {
        id: `terms-${result.metadata.version}`,
        type: 'terms' as const,
        version: result.metadata.version,
        content: result.content,
        effectiveDate: result.metadata.effectiveDate,
        createdAt: result.metadata.lastModified,
        updatedAt: result.metadata.lastModified
      }
    }, 200)
  } catch (error) {
    return c.json({
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/content/privacy
 * 개인정보 처리방침 조회
 * Query Params:
 *   - version: 특정 버전 조회 (선택사항)
 */
const privacyRoute = createRoute({
  method: 'get',
  path: '/privacy',
  tags: ['content'],
  summary: '개인정보 처리방침 조회',
  description: '개인정보 처리방침을 조회합니다.',
  request: {
    query: ContentRequest.versionQuery
  },
  responses: createRouteResponse(ContentData, {
    successDescription: '개인정보 처리방침 조회 성공',
    errorDescription: '서버 오류'
  })
})

content.openapi(privacyRoute, async (c) => {
  try {
    const version = c.req.query('version')
    const result = await contentService.getContent('privacy', version)
    
    // 스키마에 맞게 데이터 변환
    return c.json({
      success: true as const,
      data: {
        id: `privacy-${result.metadata.version}`,
        type: 'privacy' as const,
        version: result.metadata.version,
        content: result.content,
        effectiveDate: result.metadata.effectiveDate,
        createdAt: result.metadata.lastModified,
        updatedAt: result.metadata.lastModified
      }
    }, 200)
  } catch (error) {
    return c.json({
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/content/metadata
 * 모든 약관/방침의 메타데이터 조회
 */
const metadataRoute = createRoute({
  method: 'get',
  path: '/metadata',
  tags: ['Content'],
  summary: '모든 약관/방침의 메타데이터 조회',
  description: '등록된 모든 약관과 개인정보 처리방침의 메타데이터를 조회합니다.',
  responses: createRouteResponse(ContentMetadataList, {
    successDescription: '메타데이터 조회 성공',
    errorDescription: '서버 오류'
  })
})

content.openapi(metadataRoute, async (c) => {
  try {
    const result = await contentService.getAllContentMetadata()
    
    return c.json({
      success: true as const,
      data: result
    }, 200)
  } catch (error) {
    return c.json({
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/content/:type/version
 * 특정 타입의 최신 버전 정보 조회
 */
const versionRoute = createRoute({
  method: 'get',
  path: '/{type}/version',
  tags: ['Content'],
  summary: '특정 타입의 최신 버전 정보 조회',
  description: '약관 또는 개인정보 처리방침의 최신 버전을 조회합니다.',
  request: {
    params: ContentRequest.typeParam
  },
  responses: createRouteResponse(VersionInfo, {
    successDescription: '버전 정보 조회 성공',
    errorDescription: '서버 오류'
  })
})

content.openapi(versionRoute, async (c) => {
  try {
    const { type } = c.req.valid('param')
    const version = await contentService.getLatestVersion(type)
    
    return c.json({
      success: true as const,
      data: { version }
    }, 200)
  } catch (error) {
    return c.json({
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/content/:type/history
 * 특정 타입의 버전 히스토리 조회
 */
const historyRoute = createRoute({
  method: 'get',
  path: '/{type}/history',
  tags: ['Content'],
  summary: '특정 타입의 버전 히스토리 조회',
  description: '약관 또는 개인정보 처리방침의 버전 히스토리를 조회합니다.',
  request: {
    params: ContentRequest.typeParam
  },
  responses: createRouteResponse(VersionHistory, {
    successDescription: '히스토리 조회 성공',
    errorDescription: '서버 오류'
  })
})

content.openapi(historyRoute, async (c) => {
  try {
    const { type } = c.req.valid('param')
    const history = await contentService.getVersionHistory(type)
    
    return c.json({
      success: true as const,
      data: { history }
    }, 200)
  } catch (error) {
    return c.json({
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/content/:type/validate
 * 콘텐츠 유효성 및 검토 필요성 확인
 */
const validateRoute = createRoute({
  method: 'get',
  path: '/{type}/validate',
  tags: ['Content'],
  summary: '콘텐츠 유효성 검증',
  description: '약관 또는 개인정보 처리방침의 유효성을 검증합니다.',
  request: {
    params: ContentRequest.typeParam
  },
  responses: createRouteResponse(ContentValidation, {
    successDescription: '유효성 검증 완료',
    errorDescription: '서버 오류'
  })
})

content.openapi(validateRoute, async (c) => {
  try {
    const { type } = c.req.valid('param')
    const validation = await contentService.validateContent(type)
    
    return c.json({
      success: true as const,
      data: validation
    }, 200)
  } catch (error) {
    return c.json({
      success: false as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export { content }