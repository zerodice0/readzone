import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeBookTitle } from '@/lib/book-utils'

/**
 * 도서 중복 확인 API
 * POST /api/books/check-duplicate
 * 
 * Request Body:
 * {
 *   "title": "도서 제목",
 *   "authors": ["저자1", "저자2"],
 *   "isbn": "ISBN (선택)"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { title, authors, isbn } = body

    // 필수 파라미터 검증
    if (!title || !authors || !Array.isArray(authors) || authors.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '제목과 저자 정보가 필요합니다.'
          }
        },
        { status: 400 }
      )
    }

    const duplicates: any[] = []

    // 1. ISBN으로 중복 확인 (있는 경우)
    if (isbn) {
      const isbnBook = await db.book.findUnique({
        where: { isbn },
        select: {
          id: true,
          title: true,
          authors: true,
          publisher: true,
          isbn: true,
          isManualEntry: true,
          _count: {
            select: {
              reviews: true,
              opinions: true
            }
          }
        }
      })

      if (isbnBook) {
        duplicates.push({
          ...isbnBook,
          authors: JSON.parse(isbnBook.authors),
          matchType: 'exact_isbn',
          similarity: 100
        })
      }
    }

    // 2. 제목과 저자로 유사 도서 검색
    const normalizedTitle = normalizeBookTitle(title)
    const firstAuthor = authors[0].trim()

    // 정확히 일치하는 제목과 저자 검색
    const exactMatches = await db.book.findMany({
      where: {
        title: {
          equals: title.trim()
        },
        authors: {
          contains: firstAuthor
        }
      },
      select: {
        id: true,
        title: true,
        authors: true,
        publisher: true,
        isbn: true,
        isManualEntry: true,
        _count: {
          select: {
            reviews: true,
            opinions: true
          }
        }
      },
      take: 5
    })

    // 유사한 제목 검색 (부분 일치)
    const similarMatches = await db.book.findMany({
      where: {
        OR: [
          {
            title: {
              contains: normalizedTitle.split(' ')[0] // 첫 단어로 검색
            }
          },
          {
            authors: {
              contains: firstAuthor
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        authors: true,
        publisher: true,
        isbn: true,
        isManualEntry: true,
        _count: {
          select: {
            reviews: true,
            opinions: true
          }
        }
      },
      take: 10
    })

    // 중복 도서 병합 및 유사도 계산
    const processedIds = new Set(duplicates.map(d => d.id))

    exactMatches.forEach(book => {
      if (!processedIds.has(book.id)) {
        duplicates.push({
          ...book,
          authors: JSON.parse(book.authors),
          matchType: 'exact_match',
          similarity: 95
        })
        processedIds.add(book.id)
      }
    })

    similarMatches.forEach(book => {
      if (!processedIds.has(book.id)) {
        const bookAuthors = JSON.parse(book.authors)
        const titleMatch = normalizeBookTitle(book.title).includes(normalizedTitle) || 
                           normalizedTitle.includes(normalizeBookTitle(book.title))
        const authorMatch = authors.some(a => 
          bookAuthors.some((ba: string) => 
            ba.toLowerCase().includes(a.toLowerCase()) || 
            a.toLowerCase().includes(ba.toLowerCase())
          )
        )

        if (titleMatch || authorMatch) {
          duplicates.push({
            ...book,
            authors: bookAuthors,
            matchType: 'similar',
            similarity: titleMatch && authorMatch ? 80 : 60
          })
          processedIds.add(book.id)
        }
      }
    })

    // 유사도 순으로 정렬
    duplicates.sort((a, b) => b.similarity - a.similarity)

    return NextResponse.json({
      success: true,
      data: {
        hasDuplicates: duplicates.length > 0,
        duplicates: duplicates.slice(0, 5), // 최대 5개만 반환
        suggestions: {
          canAdd: duplicates.every(d => d.similarity < 90),
          message: duplicates.length > 0 
            ? '유사한 도서가 발견되었습니다. 같은 도서인지 확인해주세요.'
            : '중복된 도서가 없습니다.'
        }
      }
    })

  } catch (error) {
    console.error('Duplicate check error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '중복 확인 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}