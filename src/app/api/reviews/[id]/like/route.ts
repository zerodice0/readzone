import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const existingLike = await prisma.reviewLike.findUnique({
      where: {
        userId_reviewId: {
          userId: session.user.id,
          reviewId: params.id,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 400 }
      );
    }

    const like = await prisma.reviewLike.create({
      data: {
        userId: session.user.id,
        reviewId: params.id,
      },
    });

    return NextResponse.json(like);
  } catch (error) {
    console.error('Error creating like:', error);
    return NextResponse.json(
      { error: 'Failed to create like' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.reviewLike.delete({
      where: {
        userId_reviewId: {
          userId: session.user.id,
          reviewId: params.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting like:', error);
    return NextResponse.json(
      { error: 'Failed to delete like' },
      { status: 500 }
    );
  }
}