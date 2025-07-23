import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { validateManualBookInput, kakaoBookToDbModel } from '@/lib/book-utils'
import type { ManualBookInput } from '@/types/book'
import type { Book } from '@prisma/client'

/**
 * 수동 도서 입력 API
 * POST /api/books/manual
 * 
 * 인증 필요: 로그인한 사용자만 도서 추가 가능
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

    // 요청 본문 파싱
    const body = await request.json()
    const input: ManualBookInput = body

    // 입력 데이터 검증
    const validation = validateManualBookInput(input)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: '입력 데이터가 유효하지 않습니다.',
            details: validation.errors
          }
        },
        { status: 400 }
      )
    }

    // ISBN 중복 확인 (있는 경우)
    if (input.isbn) {
      const existingBook = await db.book.findUnique({
        where: { isbn: input.isbn }
      })

      if (existingBook) {
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'DUPLICATE_ISBN',
              message: '이미 등록된 ISBN입니다.',
              bookId: existingBook.id
            }
          },
          { status: 409 }
        )
      }
    }

    // 제목과 저자로 중복 확인 (유사 도서 방지)
    const similarBooks = await db.book.findMany({
      where: {
        title: {
          contains: input.title.trim(),
          mode: 'insensitive'
        },
        authors: {
          contains: input.authors[0], // 첫 번째 저자로 검색
          mode: 'insensitive'
        }
      },
      take: 5
    })

    // 도서 데이터 생성
    const bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'> = {
      isbn: input.isbn || null,
      isbn13: input.isbn13 || null,
      title: input.title.trim(),
      authors: JSON.stringify(input.authors.map(a => a.trim())),
      publisher: input.publisher?.trim() || null,
      translators: input.translators && input.translators.length > 0 
        ? JSON.stringify(input.translators.map(t => t.trim())) 
        : null,
      genre: input.genre?.trim() || null,
      pageCount: input.pageCount || null,
      thumbnail: input.thumbnail?.trim() || null,
      description: input.description?.trim() || null,
      contents: null,
      url: null,
      datetime: input.datetime || null,
      price: input.price || null,
      salePrice: input.salePrice || null,
      status: 'manual',
      isManualEntry: true,
      kakaoId: null,
      lastSyncedAt: null
    }

    // 트랜잭션으로 도서 생성 및 수동 입력 로그 기록
    const result = await db.$transaction(async (tx) => {
      // 도서 생성
      const newBook = await tx.book.create({
        data: bookData
      })

      // 수동 입력 로그 생성
      await tx.manualBookEntry.create({
        data: {
          bookId: newBook.id,
          submittedBy: session.user.id,
          status: 'pending',
          originalData: JSON.stringify(input)
        }
      })

      return newBook
    })

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        book: result,
        similarBooks: similarBooks.length > 0 ? similarBooks : undefined,
        message: '도서가 성공적으로 등록되었습니다. 관리자 검토 후 최종 승인됩니다.'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Manual book creation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '도서 등록 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * 수동 입력 도서 목록 조회
 * GET /api/books/manual?status=pending&submittedBy=userId
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const submittedBy = searchParams.get('submittedBy')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 필터 조건 구성
    const where: any = {}
    
    if (status !== 'all') {
      where.status = status
    }
    
    if (submittedBy) {
      where.submittedBy = submittedBy
    }

    // 수동 입력 도서 조회
    const [entries, total] = await Promise.all([
      db.manualBookEntry.findMany({
        where,
        include: {
          book: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.manualBookEntry.count({ where })
    ])

    // 도서 데이터 파싱
    const parsedEntries = entries.map(entry => ({
      ...entry,
      book: {
        ...entry.book,
        authors: JSON.parse(entry.book.authors),
        translators: entry.book.translators 
          ? JSON.parse(entry.book.translators) 
          : []
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        entries: parsedEntries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Manual book list error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '수동 입력 도서 목록 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}