import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { contentService } from '../services/contentService'

const content = new Hono()

// CORS 설정
content.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // 프론트엔드 개발 서버
  allowMethods: ['GET'],
  allowHeaders: ['Content-Type']
}))

/**
 * GET /api/content/terms
 * 서비스 이용약관 조회
 * Query Params:
 *   - version: 특정 버전 조회 (선택사항)
 */
content.get('/terms', async (c) => {
  try {
    const version = c.req.query('version')
    const result = await contentService.getContent('terms', version)
    
    return c.json({
      success: true,
      data: result
    })
  } catch (error) {
    return c.json({
      success: false,
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
content.get('/privacy', async (c) => {
  try {
    const version = c.req.query('version')
    const result = await contentService.getContent('privacy', version)
    
    return c.json({
      success: true,
      data: result
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/content/metadata
 * 모든 약관/방침의 메타데이터 조회
 */
content.get('/metadata', async (c) => {
  try {
    const result = await contentService.getAllContentMetadata()
    
    return c.json({
      success: true,
      data: result
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/content/:type/version
 * 특정 타입의 최신 버전 정보 조회
 */
content.get('/:type/version', async (c) => {
  try {
    const type = c.req.param('type')
    
    if (type !== 'terms' && type !== 'privacy') {
      return c.json({
        success: false,
        error: 'Invalid content type. Use "terms" or "privacy"'
      }, 400)
    }
    
    const version = await contentService.getLatestVersion(type)
    
    return c.json({
      success: true,
      data: { version }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/content/:type/history
 * 특정 타입의 버전 히스토리 조회
 */
content.get('/:type/history', async (c) => {
  try {
    const type = c.req.param('type')
    
    if (type !== 'terms' && type !== 'privacy') {
      return c.json({
        success: false,
        error: 'Invalid content type. Use "terms" or "privacy"'
      }, 400)
    }
    
    const history = await contentService.getVersionHistory(type)
    
    return c.json({
      success: true,
      data: { history }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/content/:type/validate
 * 콘텐츠 유효성 및 검토 필요성 확인
 */
content.get('/:type/validate', async (c) => {
  try {
    const type = c.req.param('type')
    
    if (type !== 'terms' && type !== 'privacy') {
      return c.json({
        success: false,
        error: 'Invalid content type. Use "terms" or "privacy"'
      }, 400)
    }
    
    const validation = await contentService.validateContent(type)
    
    return c.json({
      success: true,
      data: validation
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export { content }