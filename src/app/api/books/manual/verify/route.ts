import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * 수동 입력 도서 검증 (관리자 전용)
 * POST /api/books/manual/verify
 * 
 * Request Body:
 * {
 *   "entryId": "manual-entry-id",
 *   "action": "approve" | "reject",
 *   "rejectReason": "거부 사유 (reject인 경우)"
 * }
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

    // 관리자 권한 확인 (추후 role 체크 추가)
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: {
    //         errorType: 'FORBIDDEN',
    //         message: '관리자 권한이 필요합니다.'
    //       }
    //     },
    //     { status: 403 }
    //   )
    // }

    // 요청 본문 파싱
    const body = await request.json()
    const { entryId, action, rejectReason } = body

    // 입력 검증
    if (!entryId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: 'entryId와 action은 필수입니다.'
          }
        },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: 'action은 approve 또는 reject만 가능합니다.'
          }
        },
        { status: 400 }
      )
    }

    if (action === 'reject' && !rejectReason?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '거부 시 사유를 입력해야 합니다.'
          }
        },
        { status: 400 }
      )
    }

    // 수동 입력 엔트리 조회
    const entry = await db.manualBookEntry.findUnique({
      where: { id: entryId },
      include: { book: true }
    })

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '수동 입력 요청을 찾을 수 없습니다.'
          }
        },
        { status: 404 }
      )
    }

    // 이미 처리된 요청인지 확인
    if (entry.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'ALREADY_PROCESSED',
            message: '이미 처리된 요청입니다.',
            currentStatus: entry.status
          }
        },
        { status: 400 }
      )
    }

    // 트랜잭션으로 검증 처리
    const result = await db.$transaction(async (tx) => {
      // 수동 입력 엔트리 업데이트
      const updatedEntry = await tx.manualBookEntry.update({
        where: { id: entryId },
        data: {
          status: action === 'approve' ? 'approved' : 'rejected',
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          rejectReason: action === 'reject' ? rejectReason.trim() : null
        }
      })

      // 승인인 경우 도서 상태 업데이트
      if (action === 'approve') {
        await tx.book.update({
          where: { id: entry.bookId },
          data: {
            status: 'verified'
          }
        })
      }

      return updatedEntry
    })

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        entry: result,
        message: action === 'approve' 
          ? '도서가 승인되었습니다.'
          : '도서가 거부되었습니다.'
      }
    })

  } catch (error) {
    console.error('Manual book verification error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '도서 검증 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * 검증 대기 중인 수동 입력 도서 목록 조회 (관리자 전용)
 * GET /api/books/manual/verify?status=pending
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 검증 대기 도서 조회
    const [entries, total] = await Promise.all([
      db.manualBookEntry.findMany({
        where: { status },
        include: {
          book: true
        },
        orderBy: {
          createdAt: status === 'pending' ? 'asc' : 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.manualBookEntry.count({ where: { status } })
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
      },
      originalData: JSON.parse(entry.originalData)
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
        },
        stats: {
          pending: await db.manualBookEntry.count({ where: { status: 'pending' } }),
          approved: await db.manualBookEntry.count({ where: { status: 'approved' } }),
          rejected: await db.manualBookEntry.count({ where: { status: 'rejected' } })
        }
      }
    })

  } catch (error) {
    console.error('Verify list error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '검증 목록 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}