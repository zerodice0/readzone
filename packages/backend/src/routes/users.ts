import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { prisma } from '@/lib/prisma'

const users = new OpenAPIHono()

// 사용자 프로필 조회 라우트
const getUserProfileRoute = createRoute({
  method: 'get',
  path: '/{userid}',
  summary: '사용자 프로필 조회',
  description: 'userid로 사용자 프로필 정보를 조회합니다',
  tags: ['Users'],
  request: {
    params: z.object({
      userid: z.string().min(3).max(30)
    })
  },
  responses: {
    200: {
      description: '사용자 프로필 조회 성공',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              user: z.object({
                id: z.string(),
                userid: z.string(),
                nickname: z.string(),
                bio: z.string().nullable(),
                profileImage: z.string().nullable(),
                isVerified: z.boolean(),
                createdAt: z.string(),
                _count: z.object({
                  reviews: z.number(),
                  followers: z.number(),
                  following: z.number(),
                  likes: z.number()
                })
              })
            })
          })
        }
      }
    },
    404: {
      description: '사용자를 찾을 수 없음',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(false),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    },
    500: {
      description: '서버 내부 오류',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(false),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    }
  }
})

users.openapi(getUserProfileRoute, async (c) => {
  try {
    const { userid } = c.req.valid('param')

    const user = await prisma.user.findUnique({
      where: { userid },
      select: {
        id: true,
        userid: true,
        nickname: true,
        bio: true,
        profileImage: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
            likes: true
          }
        }
      }
    })

    if (!user) {
      return c.json({
        success: false as const,
        error: {
          code: 'USER_NOT_FOUND',
          message: '사용자를 찾을 수 없습니다'
        }
      }, 404)
    }

    return c.json({
      success: true as const,
      data: {
        user: {
          ...user,
          createdAt: user.createdAt.toISOString()
        }
      }
    }, 200)

  } catch (error) {
    console.error('Get user profile error:', error)
    
    return c.json({
      success: false as const,
      error: {
        code: 'INTERNAL_ERROR',
        message: '사용자 프로필 조회 중 오류가 발생했습니다'
      }
    }, 500)
  }
})

export { users }