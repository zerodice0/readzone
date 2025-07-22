import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ReviewDetail } from '@/components/review/review-detail';

interface PageProps {
  params: {
    id: string;
  };
}

async function getReview(id: string) {
  try {
    const review = await prisma.bookReview.findUnique({
      where: { id },
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
            publisher: true,
            pageCount: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return review;
  } catch (error) {
    console.error('Failed to fetch review:', error);
    return null;
  }
}

export default async function ReviewPage({ params }: PageProps) {
  const review = await getReview(params.id);

  if (!review) {
    notFound();
  }

  return <ReviewDetail review={review} />;
}

export async function generateMetadata({ params }: PageProps) {
  const review = await getReview(params.id);

  if (!review) {
    return {
      title: '독후감을 찾을 수 없습니다 - ReadZone',
    };
  }

  const title = review.title || `${review.book.title} 독후감`;
  const description = review.content.slice(0, 160);

  return {
    title: `${title} - ReadZone`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      authors: [review.user.nickname],
      images: review.book.thumbnail ? [review.book.thumbnail] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: review.book.thumbnail ? [review.book.thumbnail] : [],
    },
  };
}