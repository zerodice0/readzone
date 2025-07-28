import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: userId } = await params
    const session = await auth()
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') as 'reviews' | 'opinions' | 'comments' | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // 최대 50개로 제한
    
    if (!userId || !type) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_REQUEST',
            message: '사용자 ID와 콘텐츠 타입이 필요합니다.' 
          } 
        },
        { status: 400 }
      )
    }

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true }
    })

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다.' 
          } 
        },
        { status: 404 }
      )
    }

    const offset = (page - 1) * limit

    let data: any[] = []
    let total = 0

    switch (type) {
      case 'reviews':
        // 독후감 목록 조회
        const [reviews, reviewsCount] = await Promise.all([
          prisma.bookReview.findMany({
            where: { userId },
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  authors: true,
                  thumbnail: true,
                  genre: true
                }
              },
              _count: {
                select: {
                  likes: true,
                  comments: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit
          }),
          prisma.bookReview.count({
            where: { userId }
          })
        ])
        
        data = reviews.map(review => ({
          ...review,
          book: {
            ...review.book,
            authors: typeof review.book.authors === 'string' 
              ? JSON.parse(review.book.authors) 
              : review.book.authors
          },
          tags: typeof review.tags === 'string' 
            ? JSON.parse(review.tags) 
            : review.tags
        }))
        total = reviewsCount
        break

      case 'opinions':
        // 도서 의견 목록 조회
        const [opinions, opinionsCount] = await Promise.all([
          prisma.bookOpinion.findMany({
            where: { userId },
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  authors: true,
                  thumbnail: true,
                  genre: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit
          }),
          prisma.bookOpinion.count({
            where: { userId }
          })
        ])
        
        data = opinions.map(opinion => ({
          ...opinion,
          book: {
            ...opinion.book,
            authors: typeof opinion.book.authors === 'string' 
              ? JSON.parse(opinion.book.authors) 
              : opinion.book.authors
          }
        }))
        total = opinionsCount
        break

      case 'comments':
        // 댓글 목록 조회
        const [comments, commentsCount] = await Promise.all([
          prisma.comment.findMany({
            where: { userId },
            include: {
              review: {
                select: {
                  id: true,
                  title: true,
                  book: {
                    select: {
                      id: true,
                      title: true,
                      authors: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit
          }),
          prisma.comment.count({
            where: { userId }
          })
        ])
        
        data = comments.map(comment => ({
          ...comment,
          review: {
            ...comment.review,
            book: {
              ...comment.review.book,
              authors: typeof comment.review.book.authors === 'string' 
                ? JSON.parse(comment.review.book.authors) 
                : comment.review.book.authors
            }
          }
        }))
        total = commentsCount
        break

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'INVALID_CONTENT_TYPE',
              message: '지원하지 않는 콘텐츠 타입입니다.' 
            } 
          },
          { status: 400 }
        )
    }

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      success: true,
      data: {
        [type]: data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      },
      meta: {
        userId,
        nickname: user.nickname,
        contentType: type,
        timestamp: new Date().toISOString(),
        isOwnContent: session?.user?.id === userId
      }
    })

  } catch (error) {
    console.error('Error fetching user content:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR',
          message: '사용자 콘텐츠를 불러오는 중 오류가 발생했습니다.',
          details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        } 
      },
      { status: 500 }
    )
  }
}