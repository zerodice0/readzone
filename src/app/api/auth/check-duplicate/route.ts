import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkDuplicateSchema } from '@/lib/validations'
import { CheckDuplicateResponse } from '@/types/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // 입력 데이터 검증
    const validationResult = checkDuplicateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          available: false,
          message: '잘못된 요청입니다.',
        } as CheckDuplicateResponse,
        { status: 400 }
      )
    }

    const { field, value } = validationResult.data

    // 빈 값 체크
    if (!value.trim()) {
      return NextResponse.json(
        {
          available: false,
          message: `${field === 'email' ? '이메일' : '닉네임'}을 입력해주세요.`,
        } as CheckDuplicateResponse,
        { status: 400 }
      )
    }

    // 해당 필드로 기존 사용자 검색
    const whereCondition = field === 'email' ? { email: value } : { nickname: value }
    const existingUser = await prisma.user.findUnique({
      where: whereCondition,
      select: { id: true }, // 성능을 위해 id만 선택
    })

    const isAvailable = !existingUser

    // 응답 메시지 설정
    let message: string
    if (field === 'email') {
      message = isAvailable 
        ? '사용 가능한 이메일입니다.' 
        : '이미 사용 중인 이메일입니다.'
    } else {
      message = isAvailable 
        ? '사용 가능한 닉네임입니다.' 
        : '이미 사용 중인 닉네임입니다.'
    }

    return NextResponse.json(
      {
        available: isAvailable,
        message,
      } as CheckDuplicateResponse,
      { status: 200 }
    )

  } catch (error) {
    console.error('중복 확인 에러:', error)

    return NextResponse.json(
      {
        available: false,
        message: '중복 확인 중 오류가 발생했습니다.',
      } as CheckDuplicateResponse,
      { status: 500 }
    )
  }
}

// OPTIONS 메서드 처리 (CORS)
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}