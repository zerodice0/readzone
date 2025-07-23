import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { ManualBookInput } from '@/types/book'

/**
 * 수동 입력 도서 수정
 * PUT /api/books/manual/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 인증 확인
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

    const { id: bookId } = await params

    // 도서 존재 여부 확인
    const book = await db.book.findUnique({
      where: { id: bookId },
      include: {
        _count: {
          select: {
            reviews: true,
            opinions: true
          }
        }
      }
    })

    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '도서를 찾을 수 없습니다.'
          }
        },
        { status: 404 }
      )
    }

    // 수동 입력 도서만 수정 가능
    if (!book.isManualEntry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: 'API로 가져온 도서는 수정할 수 없습니다.'
          }
        },
        { status: 403 }
      )
    }

    // 수동 입력 로그 확인 (작성자 확인)
    const manualEntry = await db.manualBookEntry.findFirst({
      where: {
        bookId,
        submittedBy: session.user.id
      }
    })

    // 작성자가 아니면 수정 불가
    if (!manualEntry && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '본인이 등록한 도서만 수정할 수 있습니다.'
          }
        },
        { status: 403 }
      )
    }

    // 리뷰나 의견이 있는 경우 제한적 수정만 허용
    const hasContent = book._count.reviews > 0 || book._count.opinions > 0
    
    // 요청 본문 파싱
    const body = await request.json()
    const input: Partial<ManualBookInput> = body

    // 업데이트 데이터 구성
    const updateData: any = {}

    // 기본 정보는 항상 수정 가능
    if (input.description !== undefined) {
      updateData.description = input.description.trim() || null
    }
    if (input.thumbnail !== undefined) {
      updateData.thumbnail = input.thumbnail.trim() || null
    }
    if (input.genre !== undefined) {
      updateData.genre = input.genre.trim() || null
    }
    if (input.pageCount !== undefined) {
      updateData.pageCount = input.pageCount || null
    }
    if (input.price !== undefined) {
      updateData.price = input.price || null
    }
    if (input.salePrice !== undefined) {
      updateData.salePrice = input.salePrice || null
    }

    // 콘텐츠가 없는 경우에만 핵심 정보 수정 가능
    if (!hasContent) {
      if (input.title !== undefined) {
        updateData.title = input.title.trim()
      }
      if (input.authors !== undefined) {
        updateData.authors = JSON.stringify(input.authors.map(a => a.trim()))
      }
      if (input.publisher !== undefined) {
        updateData.publisher = input.publisher.trim() || null
      }
      if (input.translators !== undefined) {
        updateData.translators = input.translators.length > 0 
          ? JSON.stringify(input.translators.map(t => t.trim()))
          : null
      }
      if (input.isbn !== undefined) {
        updateData.isbn = input.isbn || null
      }
      if (input.isbn13 !== undefined) {
        updateData.isbn13 = input.isbn13 || null
      }
    }

    // 도서 업데이트
    const updatedBook = await db.book.update({
      where: { id: bookId },
      data: updateData
    })

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        book: updatedBook,
        restricted: hasContent,
        message: hasContent 
          ? '리뷰나 의견이 있는 도서는 제한적으로만 수정 가능합니다.'
          : '도서 정보가 수정되었습니다.'
      }
    })

  } catch (error) {
    console.error('Manual book update error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '도서 수정 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * 수동 입력 도서 삭제
 * DELETE /api/books/manual/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 인증 확인
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

    const { id: bookId } = await params

    // 도서 존재 여부 및 관련 콘텐츠 확인
    const book = await db.book.findUnique({
      where: { id: bookId },
      include: {
        _count: {
          select: {
            reviews: true,
            opinions: true
          }
        }
      }
    })

    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '도서를 찾을 수 없습니다.'
          }
        },
        { status: 404 }
      )
    }

    // 수동 입력 도서만 삭제 가능
    if (!book.isManualEntry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: 'API로 가져온 도서는 삭제할 수 없습니다.'
          }
        },
        { status: 403 }
      )
    }

    // 리뷰나 의견이 있는 경우 삭제 불가
    if (book._count.reviews > 0 || book._count.opinions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '리뷰나 의견이 있는 도서는 삭제할 수 없습니다.',
            details: {
              reviews: book._count.reviews,
              opinions: book._count.opinions
            }
          }
        },
        { status: 403 }
      )
    }

    // 수동 입력 로그 확인 (작성자 확인)
    const manualEntry = await db.manualBookEntry.findFirst({
      where: {
        bookId,
        submittedBy: session.user.id
      }
    })

    // 작성자가 아니면 삭제 불가 (관리자 제외)
    if (!manualEntry && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '본인이 등록한 도서만 삭제할 수 있습니다.'
          }
        },
        { status: 403 }
      )
    }

    // 트랜잭션으로 도서 및 관련 데이터 삭제
    await db.$transaction(async (tx) => {
      // 수동 입력 로그 삭제
      await tx.manualBookEntry.deleteMany({
        where: { bookId }
      })

      // 도서 삭제
      await tx.book.delete({
        where: { id: bookId }
      })
    })

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '도서가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('Manual book delete error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '도서 삭제 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}