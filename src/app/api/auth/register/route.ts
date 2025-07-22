import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(2).max(20),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 유효성 검증
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const { email, password, nickname } = validation.data;

    // 중복 확인
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { nickname },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? '이메일' : '닉네임';
      return NextResponse.json(
        { message: `이미 사용 중인 ${field}입니다.` },
        { status: 400 }
      );
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
      },
    });

    // 인증 토큰 생성 (실제로는 이메일 발송 로직 필요)
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: crypto.randomUUID(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간
      },
    });

    // TODO: 실제 이메일 발송 구현
    console.log(`Verification email would be sent to ${email} with token: ${verificationToken.token}`);

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
      userId: user.id,
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { message: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}