import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import ReviewDetail from './review-detail'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const review = await prisma.bookReview.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            title: true,
            authors: true,
            thumbnail: true
          }
        },
        user: {
          select: {
            nickname: true
          }
        }
      }
    })

    if (!review) {
      return {
        title: '독후감을 찾을 수 없습니다 | ReadZone'
      }
    }

    const bookAuthors = JSON.parse(review.book.authors || '[]')
    const title = review.title || `${review.book.title} 독후감`
    const description = `${review.user.nickname}님이 "${review.book.title}"을 읽고 작성한 독후감입니다. ${bookAuthors.join(', ')} 저자의 책에 대한 솔직한 리뷰를 확인해보세요.`

    return {
      title: `${title} | ReadZone`,
      description,
      keywords: [
        review.book.title,
        ...bookAuthors,
        review.user.nickname,
        '독후감',
        '서평',
        '책리뷰'
      ].join(', '),
      openGraph: {
        title,
        description,
        type: 'article',
        images: review.book.thumbnail ? [
          {
            url: review.book.thumbnail,
            width: 400,
            height: 600,
            alt: review.book.title
          }
        ] : undefined,
        authors: [review.user.nickname],
        publishedTime: review.createdAt.toISOString(),
        modifiedTime: review.updatedAt.toISOString()
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: review.book.thumbnail ? [review.book.thumbnail] : undefined
      },
      authors: [{ name: review.user.nickname }],
      category: '독후감'
    }
  } catch (error) {
    console.error('메타데이터 생성 실패:', error)
    return {
      title: '독후감 | ReadZone'
    }
  }
}

export default async function ReviewDetailPage({ params }: PageProps) {
  // 현재 사용자 세션 확인
  const session = await auth()
  const { id } = await params

  // 독후감 데이터 서버에서 미리 가져오기 (SEO 및 성능 최적화)
  let initialReview = null
  try {
    const review = await prisma.bookReview.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            image: true,
            bio: true
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnail: true,
            publisher: true,
            genre: true,
            pageCount: true,
            isbn: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        // 현재 사용자의 좋아요 여부 확인
        ...(session?.user?.id ? {
          likes: {
            where: {
              userId: session.user.id
            },
            select: {
              id: true,
              userId: true
            }
          }
        } : {})
      }
    })

    if (!review) {
      notFound()
    }

    // 데이터 포맷팅
    initialReview = {
      ...review,
      title: review.title || undefined,
      tags: JSON.parse(review.tags || '[]'),
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      user: {
        ...review.user,
        image: review.user.image || undefined,
        bio: review.user.bio || undefined
      },
      book: {
        ...review.book,
        authors: JSON.parse(review.book.authors || '[]'),
        title: review.book.title || '제목 없음',
        publisher: review.book.publisher || undefined,
        genre: review.book.genre || undefined,
        thumbnail: review.book.thumbnail || undefined,
        isbn: review.book.isbn || undefined,
        pageCount: review.book.pageCount || undefined
      },
      isLiked: session?.user?.id ? (review.likes && review.likes.length > 0) : false,
      canEdit: session?.user?.id === review.userId,
      purchaseLink: review.purchaseLink || undefined,
    }

  } catch (error) {
    console.error('독후감 데이터 로드 실패:', error)
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <ReviewDetail 
        reviewId={id}
        initialData={initialReview}
        currentUserId={session?.user?.id}
      />
    </div>
  )
}