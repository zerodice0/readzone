import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, requireEmailVerification } from '../middleware/auth'

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

const CreateReviewSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  isRecommended: z.boolean().default(true),
  rating: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true)
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

// POST /api/reviews
app.post('/', 
  authMiddleware, 
  requireEmailVerification,
  zValidator('json', CreateReviewSchema as never), 
  async (c) => {
    try {
      const reviewData = c.req.valid('json') as z.infer<typeof CreateReviewSchema>
      const user = c.get('user')
      
      if (!user) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401)
      }

      // Check if book exists
      const book = await prisma.book.findUnique({
        where: { id: reviewData.bookId }
      })

      if (!book) {
        return c.json({
          success: false,
          message: 'Book not found'
        }, 404)
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          title: reviewData.title,
          content: reviewData.content,
          isRecommended: reviewData.isRecommended,
          rating: reviewData.rating ?? null,
          tags: reviewData.tags ? JSON.stringify(reviewData.tags) : null,
          isPublic: reviewData.isPublic,
          status: 'PUBLISHED',
          userId: user.id,
          bookId: reviewData.bookId
        },
        include: {
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
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      })
      
      return c.json({
        success: true,
        data: {
          id: review.id,
          title: review.title,
          content: review.content,
          isRecommended: review.isRecommended,
          rating: review.rating,
          tags: review.tags ? JSON.parse(review.tags) : [],
          isPublic: review.isPublic,
          status: review.status,
          createdAt: review.createdAt.toISOString(),
          updatedAt: review.updatedAt.toISOString(),
          user: review.user,
          book: review.book,
          stats: {
            likes: review._count.likes,
            comments: review._count.comments
          }
        }
      }, 201)

    } catch (error) {
      console.error('Create review error:', error)

      return c.json({
        success: false,
        message: 'Failed to create review'
      }, 500)
    }
  }
)

// POST /api/reviews/:id/like
app.post('/:id/like', 
  authMiddleware, 
  requireEmailVerification,
  zValidator('json', LikeRequestSchema as never), 
  async (c) => {
    try {
      const reviewId = c.req.param('id')
      const { action } = c.req.valid('json') as { action: 'like' | 'unlike' }
      const user = c.get('user')
      
      if (!user) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401)
      }

      if (action === 'like') {
        // Create like (ignore if already exists)
        await prisma.like.upsert({
          where: {
            userId_reviewId: {
              userId: user.id,
              reviewId
            }
          },
          create: {
            userId: user.id,
            reviewId
          },
          update: {}
        })
      } else {
        // Remove like (ignore if doesn't exist)
        await prisma.like.deleteMany({
          where: {
            userId: user.id,
            reviewId
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

    } catch (error) {
      console.error('Like API Error:', error)

      return c.json({
        success: false,
        message: 'Failed to update like'
      }, 500)
    }
  }
)

export default app