import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/reviews/[id]/track-click - 구매 링크 클릭 추적
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: reviewId } = await params

    if (!reviewId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_PARAMS',
            message: '독후감 ID가 필요합니다.',
          },
        },
        { status: 400 }
      )
    }

    // 독후감 존재 여부 확인
    const review = await prisma.bookReview.findUnique({
      where: { id: reviewId },
      select: { 
        id: true, 
        purchaseLink: true,
        linkClicks: true 
      }
    })

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '독후감을 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 구매 링크가 없는 경우
    if (!review.purchaseLink) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NO_PURCHASE_LINK',
            message: '구매 링크가 설정되지 않았습니다.',
          },
        },
        { status: 400 }
      )
    }

    // 클릭 수 증가
    const updatedReview = await prisma.bookReview.update({
      where: { id: reviewId },
      data: {
        linkClicks: {
          increment: 1
        }
      },
      select: {
        linkClicks: true,
        purchaseLink: true
      }
    })

    // 사용자 정보 (선택적 - 로그인 사용자만)
    let userId: string | null = null
    try {
      const session = await auth()
      userId = session?.user?.id || null
    } catch (error) {
      // 인증 실패는 무시 (비로그인 사용자도 클릭 추적 가능)
      console.log('클릭 추적 - 비로그인 사용자')
    }

    // 클릭 로그 기록 (향후 분석을 위해)
    console.log('Purchase link clicked:', {
      reviewId,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      clickCount: updatedReview.linkClicks
    })

    return NextResponse.json({
      success: true,
      data: {
        clickCount: updatedReview.linkClicks,
        purchaseLink: updatedReview.purchaseLink,
        message: '클릭이 기록되었습니다.'
      }
    })

  } catch (error) {
    console.error('Click tracking error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '클릭 추적 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}