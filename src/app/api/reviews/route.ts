import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '10');

    const reviews = await prisma.bookReview.findMany({
      take: limit + 1,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            image: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true,
            genre: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (reviews.length > limit) {
      const nextItem = reviews.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({
      reviews,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}