import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * 직접 입력 도서 저장 API 엔드포인트
 * POST /api/books/manual
 * 
 * 검색되지 않는 도서를 사용자가 직접 입력하여 등록합니다.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 사용자 인증 확인
    const session = await auth()
    if (!session?.user) {
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

    const body = await request.json()
    const { title, authors, publisher, genre } = body

    // 필수 필드 검증
    if (!title || !authors || !Array.isArray(authors) || authors.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '도서 제목과 저자 정보가 필요합니다.'
          }
        },
        { status: 400 }
      )
    }

    // 제목 길이 검증
    if (title.trim().length < 1 || title.trim().length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '도서 제목은 1-200자 사이여야 합니다.'
          }
        },
        { status: 400 }
      )
    }

    // 저자 정보 검증
    const filteredAuthors = authors.filter((author: string) => author.trim().length > 0)
    if (filteredAuthors.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '최소 한 명의 저자 정보가 필요합니다.'
          }
        },
        { status: 400 }
      )
    }

    // 중복 도서 확인 (제목 + 첫 번째 저자 조합)
    const existingBook = await prisma.book.findFirst({
      where: {
        title: title.trim(),
        authors: {
          contains: filteredAuthors[0].trim()
        }
      }
    })

    if (existingBook) {
      // 이미 존재하는 도서인 경우 기존 도서 정보 반환
      return NextResponse.json({
        success: true,
        data: {
          id: existingBook.id,
          title: existingBook.title,
          authors: JSON.parse(existingBook.authors),
          publisher: existingBook.publisher,
          genre: existingBook.genre,
          isManualEntry: existingBook.isManualEntry,
          createdAt: existingBook.createdAt.toISOString(),
          alreadyExists: true
        }
      })
    }

    // 새 도서 저장
    const newBook = await prisma.book.create({
      data: {
        title: title.trim(),
        authors: JSON.stringify(filteredAuthors.map((author: string) => author.trim())),
        publisher: publisher?.trim() || null,
        genre: genre?.trim() || null,
        isManualEntry: true // 직접 입력 도서
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newBook.id,
        title: newBook.title,
        authors: JSON.parse(newBook.authors),
        publisher: newBook.publisher,
        genre: newBook.genre,
        isManualEntry: newBook.isManualEntry,
        createdAt: newBook.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Manual book creation error:', error)
    
    // Prisma 중복 키 오류 처리
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'DUPLICATE_BOOK',
            message: '이미 등록된 도서입니다.'
          }
        },
        { status: 409 }
      )
    }
    
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
      prisma.manualBookEntry.findMany({
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
      prisma.manualBookEntry.count({ where })
    ])

    // 도서 데이터 파싱
    const parsedEntries = entries.map((entry: any) => ({
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