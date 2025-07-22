import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const checkDuplicateSchema = z.object({
  field: z.enum(['email', 'nickname']),
  value: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = checkDuplicateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { available: false },
        { status: 400 }
      );
    }

    const { field, value } = validation.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        [field]: value,
      },
    });

    return NextResponse.json({
      available: !existingUser,
    });
  } catch (error) {
    console.error('중복 확인 오류:', error);
    return NextResponse.json(
      { available: false },
      { status: 500 }
    );
  }
}