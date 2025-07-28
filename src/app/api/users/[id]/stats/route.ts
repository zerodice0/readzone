import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { calculateUserStats, getUserRanking } from '@/lib/user-stats'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/users/[id]/stats - 사용자 활동 통계 조회
 */
export async function GET(
  __request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: userId } = await params
    const { searchParams } = new URL(__request.url)
    const includeRanking = searchParams.get('includeRanking') === 'true'
    const session = await auth()

    // 사용자 존재 여부 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '사용자를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 기본 통계 조회
    const stats = await calculateUserStats(userId)

    // 랭킹 정보 조회 (요청된 경우만)
    let ranking = null
    if (includeRanking) {
      ranking = await getUserRanking(userId)
    }

    // 본인 여부 확인
    const isOwnStats = session?.user?.id === userId

    // 응답 데이터 구성
    const responseData = {
      userId,
      nickname: targetUser.nickname,
      stats,
      ...(ranking && { ranking }),
      isOwnStats,
      meta: {
        generatedAt: new Date().toISOString(),
        dataFreshness: 'real-time', // 실시간 계산
        version: '1.0'
      }
    }

    // 통계 조회 로깅 (본인이 아닌 경우만)
    if (!isOwnStats) {
      logger.info('User stats viewed', {
        viewerId: session?.user?.id || 'anonymous',
        targetUserId: userId,
        includeRanking
      })
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    logger.error('User stats retrieval failed', {
      userId: (await params).id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '사용자 통계 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/[id]/stats/refresh - 사용자 통계 새로고침 (캐시 무효화)
 * 향후 통계 캐싱 구현 시 사용할 엔드포인트
 */
export async function POST(
  __request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: userId } = await params
    const session = await auth()

    // 인증 확인
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

    // 본인 통계만 새로고침 가능
    if (session.user.id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '자신의 통계만 새로고침할 수 있습니다.',
          },
        },
        { status: 403 }
      )
    }

    // 사용자 존재 여부 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '사용자를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 통계 재계산
    const refreshedStats = await calculateUserStats(userId)

    // 새로고침 로깅
    logger.info('User stats refreshed', {
      userId,
      _requestedBy: session.user.id,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data: {
        userId,
        nickname: user.nickname,
        stats: refreshedStats,
        message: '통계가 새로고침되었습니다.',
        refreshedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('User stats refresh failed', {
      userId: (await params).id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '통계 새로고침 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}