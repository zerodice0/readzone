import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  token: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = verifyEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // 토큰 확인
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 인증 토큰입니다.' },
        { status: 400 }
      );
    }

    // 토큰 만료 확인
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { success: false, message: '인증 토큰이 만료되었습니다.' },
        { status: 400 }
      );
    }

    // 사용자 이메일 인증 완료
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // 사용된 토큰 삭제
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
    });
  } catch (error) {
    console.error('이메일 인증 오류:', error);
    return NextResponse.json(
      { success: false, message: '이메일 인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}