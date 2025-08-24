import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const prisma = new PrismaClient()

const app = new Hono()

// Validation schemas
const FeedQuerySchema = z.object({
  tab: z.enum(['recommended', 'latest', 'following']).default('recommended'),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20)
})

const LikeRequestSchema = z.object({
  action: z.enum(['like', 'unlike'])
})

// GET /api/reviews/feed
app.get('/feed', zValidator('query', FeedQuerySchema as never), async (c) => {
  try {
    const { tab, cursor, limit } = c.req.valid('query') as {
      tab: 'recommended' | 'latest' | 'following';
      cursor?: string;
      limit: number;
    }
    
    // Cursor-based pagination will be handled in the query options

    // Build base query conditions
    const baseConditions = {
      status: 'PUBLISHED',
      isPublic: true
    }

    // 타입 안전성을 위한 구체적인 타입 정의
    type OrderByType = 
      | { createdAt: 'desc' | 'asc' }
      | { createdAt: 'desc' | 'asc' }[]
      | undefined

    interface WhereType {
      status: string
      isPublic: boolean
    }

    let orderBy: OrderByType = { createdAt: 'desc' }
    const where: WhereType = baseConditions

    switch (tab) {
      case 'recommended':
        // For recommended, we'll calculate a simple recommendation score
        // This is a basic implementation - in production, you might want to use a more sophisticated algorithm
        orderBy = [
          { createdAt: 'desc' } // For now, just show recent posts
        ]
        break
        
      case 'latest':
        orderBy = { createdAt: 'desc' }
        break
        
      case 'following':
        // For following tab, we need to get user from auth token
        // For now, just return empty (will implement auth middleware later)
        return c.json({
          success: true,
          reviews: [],
          nextCursor: null,
          hasMore: false
        })
    }

    const REVIEW_INCLUDE_CONFIG = {
      user: {
        select: {
          id: true,
          nickname: true,
          profileImage: true
        }
      },
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          thumbnail: true
        }
      },
      likes: {
        select: {
          id: true,
          userId: true
        }
      },
      comments: {
        select: {
          id: true
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      }
    } as const

    // Get reviews with all related data
    const findManyOptions = {
      where,
      include: REVIEW_INCLUDE_CONFIG,
      orderBy,
      take: limit + 1, // Take one extra to determine if there are more
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    }
    
    const reviews = await prisma.review.findMany(findManyOptions)

    // Determine if there are more records
    const hasMore = reviews.length > limit
    const reviewsToReturn = hasMore ? reviews.slice(0, -1) : reviews
    
    // Get the next cursor
    const nextCursor = hasMore ? reviewsToReturn[reviewsToReturn.length - 1]?.id : null

    // Transform data to match the API interface
    interface ReviewWithRelations {
      id: string
      content: string
      createdAt: Date
      user: {
        id: string
        nickname: string
        profileImage?: string | null
      }
      book: {
        id: string
        title: string
        author: string
        thumbnail?: string | null
      }
      _count: {
        likes: number
        comments: number
      }
    }

    const transformedReviews = reviewsToReturn.map((review: ReviewWithRelations) => ({
      id: review.id,
      content: review.content.length > 150 ? `${review.content.substring(0, 150)}...` : review.content,
      createdAt: review.createdAt.toISOString(),
      author: {
        id: review.user.id,
        username: review.user.nickname,
        profileImage: review.user.profileImage
      },
      book: {
        id: review.book.id,
        title: review.book.title,
        author: review.book.author,
        cover: review.book.thumbnail
      },
      stats: {
        likes: review._count.likes,
        comments: review._count.comments,
        shares: 0 // We don't track shares yet
      },
      userInteraction: null // Will implement when auth is added
    }))

    return c.json({
      success: true,
      reviews: transformedReviews,
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.error('Feed API Error:', error)

    return c.json({
      success: false,
      message: 'Failed to fetch feed'
    }, 500)
  }
})

// POST /api/reviews/:id/like
app.post('/:id/like', zValidator('json', LikeRequestSchema as never), (c) => {
  try {
    // TODO: Get user ID from auth token
    // For now, return an error since auth is not implemented
    
    // Suppress unused variables warning for future implementation
    c.req.param('id') // reviewId for future use
    c.req.valid('json') // action for future use

    return c.json({
      success: false,
      message: 'Authentication required'
    }, 401)

    // Future implementation:
    /*
    const userId = getUserFromToken(c) // Get from auth middleware
    
    if (action === 'like') {
      await prisma.like.create({
        data: {
          userId,
          reviewId
        }
      })
    } else {
      await prisma.like.delete({
        where: {
          userId_reviewId: {
            userId,
            reviewId
          }
        }
      })
    }
    
    const likesCount = await prisma.like.count({
      where: { reviewId }
    })
    
    return c.json({
      success: true,
      likesCount,
      isLiked: action === 'like'
    })
    */

  } catch (error) {
    console.error('Like API Error:', error)

    return c.json({
      success: false,
      message: 'Failed to update like'
    }, 500)
  }
})

export default app