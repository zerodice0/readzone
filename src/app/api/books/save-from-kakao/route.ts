import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

/**
 * 카카오 검색 결과 저장 API 엔드포인트
 * POST /api/books/save-from-kakao
 * 
 * 카카오 API에서 검색한 도서를 커뮤니티 DB에 저장합니다.
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
    const { title, authors, publisher, genre, thumbnail, isbn } = body

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

    // 중복 도서 확인 (제목 + 첫 번째 저자 조합)
    const existingBook = await prisma.book.findFirst({
      where: {
        title: title.trim(),
        authors: {
          contains: authors[0].trim()
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
          thumbnail: existingBook.thumbnail,
          isbn: existingBook.isbn,
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
        authors: JSON.stringify(authors.map((author: string) => author.trim())),
        publisher: publisher?.trim() || null,
        genre: genre?.trim() || null,
        thumbnail: thumbnail || null,
        isbn: isbn || null,
        isManualEntry: false // 카카오 API에서 가져온 도서
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
        thumbnail: newBook.thumbnail,
        isbn: newBook.isbn,
        isManualEntry: newBook.isManualEntry,
        createdAt: newBook.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Save kakao book error:', error)
    
    // Prisma 중복 키 오류 처리
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      // 중복 생성 시도 시 기존 도서 찾아서 반환
      try {
        const body = await request.json()
        const existingBook = await prisma.book.findFirst({
          where: {
            title: body.title?.trim(),
            authors: {
              contains: body.authors?.[0]?.trim()
            }
          }
        })

        if (existingBook) {
          return NextResponse.json({
            success: true,
            data: {
              id: existingBook.id,
              title: existingBook.title,
              authors: JSON.parse(existingBook.authors),
              publisher: existingBook.publisher,
              genre: existingBook.genre,
              thumbnail: existingBook.thumbnail,
              isbn: existingBook.isbn,
              isManualEntry: existingBook.isManualEntry,
              createdAt: existingBook.createdAt.toISOString(),
              alreadyExists: true
            }
          })
        }
      } catch (duplicateError) {
        console.error('Duplicate handling error:', duplicateError)
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '카카오 도서 저장 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}