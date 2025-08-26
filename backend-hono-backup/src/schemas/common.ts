import { z } from 'zod'

/**
 * 공통 API 응답 스키마 팩토리
 */
export const ApiResponse = {
  /**
   * 성공 응답 스키마 생성
   */
  success: <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
    success: z.literal(true),
    data: dataSchema
  }),
  
  /**
   * 에러 응답 스키마 생성 (구조화된 에러)
   */
  error: () => z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string()
    })
  }),

  /**
   * 단순 에러 응답 스키마 (문자열 에러)
   */
  simpleError: () => z.object({
    success: z.literal(false),
    error: z.string()
  })
}

/**
 * 표준 OpenAPI 응답 구조 생성
 */
export const createRouteResponse = <T extends z.ZodTypeAny>(
  dataSchema: T,
  options: {
    successDescription?: string
    errorDescription?: string
    useSimpleError?: boolean
    additionalResponses?: Record<string, unknown>
  } = {}
) => {
  const {
    successDescription = '성공',
    errorDescription = '서버 오류',
    useSimpleError = true,
    additionalResponses = {}
  } = options

  return {
    200: {
      description: successDescription,
      content: {
        'application/json': {
          schema: ApiResponse.success(dataSchema)
        }
      }
    },
    500: {
      description: errorDescription,
      content: {
        'application/json': {
          schema: useSimpleError ? ApiResponse.simpleError() : ApiResponse.error()
        }
      }
    },
    ...additionalResponses
  }
}

/**
 * 인증이 필요한 API용 응답 구조 생성
 */
export const createAuthRouteResponse = <T extends z.ZodTypeAny>(
  dataSchema: T,
  options: {
    successDescription?: string
    successStatus?: number
  } = {}
) => {
  const {
    successDescription = '성공',
    successStatus = 200
  } = options

  return {
    [successStatus]: {
      description: successDescription,
      content: {
        'application/json': {
          schema: ApiResponse.success(dataSchema)
        }
      }
    },
    400: {
      description: '잘못된 요청',
      content: {
        'application/json': {
          schema: ApiResponse.error()
        }
      }
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ApiResponse.error()
        }
      }
    },
    500: {
      description: '서버 오류',
      content: {
        'application/json': {
          schema: ApiResponse.error()
        }
      }
    }
  }
}

/**
 * 공통 쿼리 스키마들
 */
export const CommonQuery = {
  version: z.object({
    version: z.string().optional()
  }),
  
  pagination: z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).default(20)
  })
}

/**
 * 공통 파라미터 스키마들
 */
export const CommonParams = {
  id: z.object({
    id: z.string()
  }),
  
  type: z.object({
    type: z.enum(['terms', 'privacy'])
  })
}