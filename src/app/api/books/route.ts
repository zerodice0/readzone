import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createBookSchema = z.object({
  title: z.string().min(1, '제목이 필요합니다.'),
  authors: z.array(z.string().min(1)).min(1, '저자가 필요합니다.'),
  publisher: z.string().optional(),
  genre: z.string().optional(),
  thumbnail: z.string().url().optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
  pageCount: z.number().optional()
})

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const body = await request.json()
    const validatedData = createBookSchema.parse(body)

    // 중복 도서 확인 (제목 + 첫 번째 저자)
    const existingBook = await prisma.book.findFirst({
      where: {
        title: {
          equals: validatedData.title,
          mode: 'insensitive'
        },
        authors: {
          contains: validatedData.authors[0]
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
          isManualEntry: existingBook.isManualEntry
        }
      })
    }

    // 새 도서 생성
    const newBook = await prisma.book.create({
      data: {
        title: validatedData.title,
        authors: JSON.stringify(validatedData.authors),
        publisher: validatedData.publisher,
        genre: validatedData.genre,
        thumbnail: validatedData.thumbnail,
        isbn: validatedData.isbn,
        description: validatedData.description,
        pageCount: validatedData.pageCount,
        isManualEntry: !validatedData.isbn // ISBN이 없으면 수동 입력
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
        isManualEntry: newBook.isManualEntry
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            errorType: 'VALIDATION_ERROR',
            message: error.errors[0].message,
            details: error.errors
          } 
        },
        { status: 400 }
      )
    }

    console.error('Book creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          errorType: 'INTERNAL_ERROR',
          message: '도서 생성 중 오류가 발생했습니다.' 
        } 
      },
      { status: 500 }
    )
  }
}