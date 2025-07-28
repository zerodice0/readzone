import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserProfile } from '@/lib/user-stats'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/users/[id]/profile - 사용자 프로필 및 활동 통계 조회
 */
export async function GET(
  __request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: userId } = await params
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

    // 프로필 정보 조회
    const profile = await getUserProfile(userId)

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'NOT_FOUND',
            message: '프로필 정보를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 현재 사용자 여부 확인 (이메일 정보 노출 제어)
    const isOwnProfile = session?.user?.id === userId
    
    // 응답 데이터 구성 (이메일은 본인에게만 노출)
    const responseProfile = {
      id: profile.id,
      nickname: profile.nickname,
      bio: profile.bio,
      image: profile.image,
      createdAt: profile.createdAt,
      emailVerified: profile.emailVerified,
      stats: profile.stats,
      // 이메일은 본인에게만 노출
      ...(isOwnProfile && { email: profile.email })
    }

    // 조회 로깅 (본인이 아닌 경우만)
    if (!isOwnProfile) {
      logger.info('Profile viewed', {
        viewerId: session?.user?.id || 'anonymous',
        profileId: userId,
        profileNickname: profile.nickname
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: responseProfile,
        isOwnProfile,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      }
    })

  } catch (error) {
    logger.error('Profile retrieval failed', {
      userId: (await params).id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '프로필 조회 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[id]/profile - 사용자 프로필 정보 수정
 */
export async function PUT(
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

    // 본인 프로필만 수정 가능
    if (session.user.id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'FORBIDDEN',
            message: '자신의 프로필만 수정할 수 있습니다.',
          },
        },
        { status: 403 }
      )
    }

    // 요청 본문 파싱
    const body = await __request.json()
    const { nickname, bio, image } = body

    // 입력 검증
    if (nickname !== undefined) {
      if (typeof nickname !== 'string' || nickname.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'INVALID_INPUT',
              message: '닉네임은 2자 이상이어야 합니다.',
            },
          },
          { status: 400 }
        )
      }

      if (nickname.trim().length > 20) {
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'INVALID_INPUT',
              message: '닉네임은 20자 이하여야 합니다.',
            },
          },
          { status: 400 }
        )
      }

      // 닉네임 중복 확인 (자신 제외)
      const existingUser = await prisma.user.findFirst({
        where: {
          nickname: nickname.trim(),
          id: { not: userId }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              errorType: 'DUPLICATE_NICKNAME',
              message: '이미 사용 중인 닉네임입니다.',
            },
          },
          { status: 409 }
        )
      }
    }

    if (bio !== undefined && typeof bio === 'string' && bio.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'INVALID_INPUT',
            message: '자기소개는 500자 이하여야 합니다.',
          },
        },
        { status: 400 }
      )
    }

    // 프로필 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname !== undefined && { nickname: nickname.trim() }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
        ...(image !== undefined && { image }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        nickname: true,
        bio: true,
        image: true,
        updatedAt: true
      }
    })

    // 업데이트 로깅
    logger.info('Profile updated', {
      userId,
      updatedFields: Object.keys(body),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data: {
        profile: updatedUser,
        message: '프로필이 성공적으로 업데이트되었습니다.'
      }
    })

  } catch (error) {
    logger.error('Profile update failed', {
      userId: (await params).id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '프로필 업데이트 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}