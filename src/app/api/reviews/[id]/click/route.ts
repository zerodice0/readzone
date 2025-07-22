import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 클릭 수 증가
    await prisma.bookReview.update({
      where: { id: params.id },
      data: {
        linkClicks: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating click count:', error);
    return NextResponse.json(
      { error: 'Failed to update click count' },
      { status: 500 }
    );
  }
}