import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { extendDraftExpiration } from '@/lib/notifications/draft-expiration'
import { z } from 'zod'

const extendExpirationSchema = z.object({
  additionalDays: z.number().int().min(1).max(30).default(7),
})

/**
 * PATCH /api/reviews/draft/[id]/extend - Draft 만료일 연장
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
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

    const draftId = params.id
    const body = await request.json().catch(() => ({}))
    
    const validationResult = extendExpirationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'VALIDATION_ERROR',
            message: '연장 일수가 올바르지 않습니다.',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const { additionalDays } = validationResult.data

    // Draft 만료일 연장
    const result = await extendDraftExpiration(draftId, session.user.id, additionalDays)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            errorType: 'OPERATION_FAILED',
            message: result.error || '만료일 연장에 실패했습니다.',
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        draftId,
        newExpiryDate: result.newExpiryDate,
        extendedDays: additionalDays,
        message: `만료일이 ${additionalDays}일 연장되었습니다.`,
      },
    })
  } catch (error) {
    console.error('Draft 만료일 연장 실패:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          errorType: 'INTERNAL_ERROR',
          message: '만료일 연장 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}