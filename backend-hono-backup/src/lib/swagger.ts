import { swaggerUI } from '@hono/swagger-ui'

/**
 * Swagger/OpenAPI 설정
 */
export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'ReadZone API',
    version: '1.0.0',
    description: '독서 커뮤니티 SNS 플랫폼 ReadZone의 API 문서',
    contact: {
      name: 'ReadZone Team',
      email: 'support@readzone.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: '개발 서버'
    },
    {
      url: 'https://api.readzone.com',
      description: '프로덕션 서버'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT 토큰을 사용한 인증 (Bearer 형식)'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR'
              },
              message: {
                type: 'string',
                example: '입력값이 올바르지 않습니다'
              }
            },
            required: ['code', 'message']
          }
        },
        required: ['success', 'error']
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            description: '응답 데이터'
          }
        },
        required: ['success', 'data']
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'cm4y5j9k20000l8h8xvz9y1a2'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          nickname: {
            type: 'string',
            example: '독서애호가'
          },
          bio: {
            type: 'string',
            nullable: true,
            example: '책을 사랑하는 사람입니다.'
          },
          profileImage: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/profile.jpg'
          },
          isVerified: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z'
          }
        },
        required: ['id', 'email', 'nickname', 'isVerified', 'createdAt']
      },
      TokenPair: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          expiresIn: {
            type: 'string',
            example: '15m'
          },
          tokenType: {
            type: 'string',
            example: 'Bearer'
          }
        },
        required: ['accessToken', 'refreshToken', 'expiresIn', 'tokenType']
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: '인증 관련 API'
    },
    {
      name: 'Users',
      description: '사용자 관리 API'
    },
    {
      name: 'Books',
      description: '도서 관련 API'
    },
    {
      name: 'Reviews',
      description: '독후감 관련 API'
    },
    {
      name: 'Social',
      description: '소셜 기능 API (좋아요, 댓글, 팔로우)'
    }
  ]
}

/**
 * Swagger UI 미들웨어 생성
 */
export function createSwaggerUI() {
  return swaggerUI({
    url: '/api/docs/openapi.json',
    title: 'ReadZone API Documentation'
  })
}

/**
 * OpenAPI JSON 스펙 반환
 */
export function getOpenAPISpec() {
  return {
    ...swaggerConfig,
    paths: {} // OpenAPIHono가 자동으로 채워줄 예정
  }
}

/**
 * 인증이 필요한 엔드포인트를 위한 보안 스키마
 */
export const requireAuth = {
  security: [{ bearerAuth: [] }]
}