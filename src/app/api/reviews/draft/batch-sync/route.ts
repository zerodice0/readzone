import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { bookSyncService } from '@/lib/book-sync-service'
import { findSyncCandidates, getDraftStatistics, type BookSyncCandidate } from '@/lib/draft-batch-utils'

/**
 * POST /api/reviews/draft/batch-sync - Draft 도서 일괄 동기화
 * 
 * bookData가 있지만 bookId가 없는 Draft들을 찾아서
 * 커뮤니티 도서 DB와 자동으로 매칭하여 동기화합니다.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 관리자 권한 확인 (일괄 작업은 관리자만 가능)
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      )
    }

    // TODO: 관리자 권한 체크 로직 추가
    // if (!isAdmin(session.user.id)) { ... }

    const body = await request.json().catch(() => ({}))
    const limit = Math.min(body.limit || 50, 200) // 최대 200개까지
    const batchSize = Math.min(body.batchSize || 10, 20) // 최대 20개씩

    // 동기화 후보 Draft 조회
    const candidates = await findSyncCandidates(limit)
    
    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: '동기화할 Draft가 없습니다.',
          processed: 0,
          synced: 0,
          failed: 0,
        },
      })
    }

    // Enhanced 일괄 동기화 실행
    const result = await bookSyncService.batchSync(
      candidates.map(c => c.draftId),
      batchSize
    )

    return NextResponse.json({
      success: true,
      data: {
        sync: result,
        message: `${result.synced}개 Draft가 성공적으로 동기화되었습니다.`,
        enhanced: true, // 향상된 동기화 시스템 사용
      },
    })
  } catch (error) {
    console.error('Batch sync error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '일괄 동기화 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reviews/draft/batch-sync - 동기화 상태 및 후보 조회
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
            message: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const preview = searchParams.get('preview') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    // Draft 통계 조회
    const statistics = await getDraftStatistics()

    let candidates: BookSyncCandidate[] = []
    if (preview) {
      // 동기화 후보 미리보기
      candidates = await findSyncCandidates(limit)
    }

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        candidates: preview ? candidates : [],
        recommendations: {
          shouldSync: statistics.syncCandidates > 0,
          urgencyLevel: statistics.syncCandidates > 20 ? 'high' : 
                       statistics.syncCandidates > 10 ? 'medium' : 'low',
          batchSize: Math.min(Math.max(statistics.syncCandidates, 5), 20),
        },
      },
    })
  } catch (error) {
    console.error('Batch sync status error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '동기화 상태 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}