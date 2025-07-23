import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            errorType: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.' 
          } 
        },
        { status: 401 }
      )
    }

    // 사용자가 최근에 독후감을 작성한 도서들을 가져옴
    const recentBooks = await prisma.book.findMany({
      where: {
        reviews: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        _count: {
          select: {
            reviews: true,
            opinions: true
          }
        }
      },
      orderBy: {
        reviews: {
          _count: 'desc'
        }
      },
      take: 5
    })

    // 응답 형태 변환
    const formattedBooks = recentBooks.map(book => ({
      id: book.id,
      title: book.title,
      authors: JSON.parse(book.authors),
      publisher: book.publisher,
      genre: book.genre,
      thumbnail: book.thumbnail,
      isbn: book.isbn,
      isManualEntry: book.isManualEntry,
      reviewCount: book._count.reviews,
      opinionCount: book._count.opinions
    }))

    return NextResponse.json({
      success: true,
      data: formattedBooks
    })

  } catch (error) {
    console.error('Recent books fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          errorType: 'INTERNAL_ERROR',
          message: '최근 도서 조회 중 오류가 발생했습니다.' 
        } 
      },
      { status: 500 }
    )
  }
}