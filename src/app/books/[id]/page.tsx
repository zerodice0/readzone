import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BookDetail } from '@/components/book/book-detail'
import { db } from '@/lib/db'

interface BookPageProps {
  params: Promise<{
    id: string
  }>
}

// 메타데이터 생성
export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const book = await db.book.findUnique({
      where: { id },
      select: {
        title: true,
        authors: true,
        publisher: true,
        thumbnail: true,
        description: true,
        contents: true,
        _count: {
          select: {
            reviews: true,
            opinions: true
          }
        }
      }
    })

    if (!book) {
      return {
        title: '도서를 찾을 수 없습니다 - ReadZone',
        description: '요청하신 도서 정보를 찾을 수 없습니다.'
      }
    }

    const authorsText = Array.isArray(book.authors) 
      ? book.authors.join(', ')
      : book.authors || ''

    const description = book.description || book.contents || 
      `${book.title} - ${authorsText}${book.publisher ? ` (${book.publisher})` : ''}에 대한 독후감과 의견을 ReadZone에서 확인해보세요.`

    return {
      title: `${book.title} - ReadZone`,
      description: description.slice(0, 160),
      openGraph: {
        title: `${book.title} - ReadZone`,
        description: description.slice(0, 160),
        images: book.thumbnail ? [book.thumbnail] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${book.title} - ReadZone`,
        description: description.slice(0, 160),
        images: book.thumbnail ? [book.thumbnail] : [],
      },
      keywords: [
        book.title,
        ...book.authors,
        '독후감',
        '도서 리뷰',
        '책 추천',
        'ReadZone',
        ...(book.publisher ? [book.publisher] : [])
      ].filter(Boolean)
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return {
      title: '도서 정보 - ReadZone',
      description: 'ReadZone에서 다양한 도서의 독후감과 의견을 확인해보세요.'
    }
  }
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params
  
  // 도서 존재 여부 먼저 확인
  const book = await db.book.findUnique({
    where: { id },
    select: { id: true }
  })

  // 도서가 존재하지 않으면 404 페이지 표시
  if (!book) {
    notFound()
  }

  return <BookDetail bookId={id} />
}

// 정적 생성을 위한 params 생성 (선택사항)
export async function generateStaticParams() {
  // 개발 중에는 빈 배열 반환하여 동적 생성 사용
  // 추후 인기 도서들에 대해서만 정적 생성하도록 수정 가능
  return []
}