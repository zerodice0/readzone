import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCacheManager } from '@/lib/cache-manager'

/**
 * 캐시 관리 API
 * GET /api/books/cache - 캐시 통계 조회
 * DELETE /api/books/cache - 캐시 초기화
 */

/**
 * 캐시 통계 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cacheManager = getCacheManager()
    const stats = await cacheManager.getStats()

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Cache stats error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '캐시 통계 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * 캐시 초기화 (관리자만)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
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

    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern')

    const cacheManager = getCacheManager()

    if (pattern) {
      // 패턴으로 삭제
      const regex = new RegExp(pattern, 'i')
      const deletedCount = await cacheManager.deletePattern(regex)
      
      return NextResponse.json({
        success: true,
        message: `${deletedCount}개의 캐시 항목이 삭제되었습니다.`,
        deletedCount
      })
    } else {
      // 전체 캐시 삭제
      await cacheManager.clear()
      
      return NextResponse.json({
        success: true,
        message: '모든 캐시가 삭제되었습니다.'
      })
    }

  } catch (error) {
    console.error('Cache clear error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '캐시 삭제 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    )
  }
}