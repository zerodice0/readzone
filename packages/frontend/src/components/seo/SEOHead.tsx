import React, { useEffect, useMemo } from 'react'
import { generateSEOMetadata, generateStructuredData, type SEOMetadata } from '@/utils/seo'

interface StructuredDataProps {
  type: string
  data: Record<string, unknown>
}

interface SEOHeadProps {
  metadata: SEOMetadata
  structuredData?: StructuredDataProps | string
  noIndex?: boolean
  noFollow?: boolean
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  metadata,
  structuredData,
  noIndex = false,
  noFollow = false
}) => {
  const metaTags = generateSEOMetadata(metadata)

  const robotsContent = useMemo(() => {
    const content: string[] = []

    if (noIndex) {
      content.push('noindex')
    }
    if (noFollow) {
      content.push('nofollow')
    }

    return content
  }, [noIndex, noFollow])

  useEffect(() => {
    // Update document title
    document.title = metadata.title

    // Clear existing meta tags that we manage
    const existingTags = document.querySelectorAll('meta[data-seo="true"], link[data-seo="true"], script[data-seo="true"]')

    existingTags.forEach(tag => tag.remove())

    // Add meta tags
    metaTags.forEach(tag => {
      const metaElement = document.createElement('meta')

      if (tag.name) {metaElement.setAttribute('name', tag.name)}
      if (tag.property) {metaElement.setAttribute('property', tag.property)}
      metaElement.setAttribute('content', tag.content)
      metaElement.setAttribute('data-seo', 'true')
      document.head.appendChild(metaElement)
    })

    // Add robots meta tag
    if (robotsContent.length > 0) {
      const robotsElement = document.createElement('meta')

      robotsElement.setAttribute('name', 'robots')
      robotsElement.setAttribute('content', robotsContent.join(', '))
      robotsElement.setAttribute('data-seo', 'true')
      document.head.appendChild(robotsElement)
    }

    // Add canonical URL
    if (metadata.canonicalUrl) {
      const linkElement = document.createElement('link')

      linkElement.setAttribute('rel', 'canonical')
      linkElement.setAttribute('href', metadata.canonicalUrl)
      linkElement.setAttribute('data-seo', 'true')
      document.head.appendChild(linkElement)
    }

    // Add structured data
    if (structuredData) {
      const scriptElement = document.createElement('script')

      scriptElement.setAttribute('type', 'application/ld+json')
      scriptElement.setAttribute('data-seo', 'true')
      scriptElement.textContent = typeof structuredData === 'string'
        ? structuredData
        : generateStructuredData(structuredData.type, structuredData.data)
      document.head.appendChild(scriptElement)
    }

    // Cleanup function
    return () => {
      const managedTags = document.querySelectorAll('meta[data-seo="true"], link[data-seo="true"], script[data-seo="true"]')

      managedTags.forEach(tag => tag.remove())
    }
  }, [metadata, structuredData, noIndex, noFollow, metaTags, robotsContent])

  return null
}

// Pre-configured SEO components for common pages
export const HomepageSEO: React.FC = () => (
  <SEOHead
    metadata={{
      title: 'ReadZone - 독서 커뮤니티 SNS',
      description: '독서 후 의견을 공유하는 독서 전용 커뮤니티 SNS 플랫폼입니다. 독후감을 작성하고 다른 독서가들과 소통해보세요.',
      keywords: ['독서', '독후감', '책', '커뮤니티', 'SNS', '도서', '리뷰'],
      ogType: 'website',
      canonicalUrl: import.meta.env.VITE_BASE_URL,
      ogImage: `${import.meta.env.VITE_BASE_URL}/og-image.png`
    }}
    structuredData={{
      type: 'WebSite',
      data: {
        name: 'ReadZone',
        url: import.meta.env.VITE_BASE_URL,
        description: '독서 커뮤니티 SNS 플랫폼',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${import.meta.env.VITE_BASE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }
    }}
  />
)

export const ProfileSEO: React.FC<{
  user: {
    nickname: string
    userid: string
    bio?: string
    stats: { reviewCount: number; followerCount: number }
    profileImage?: string
  }
}> = ({ user }) => (
  <SEOHead
    metadata={{
      title: `${user.nickname} (@${user.userid}) - ReadZone`,
      description: user.bio ?? `${user.nickname}님의 ReadZone 프로필입니다. 독후감 ${user.stats.reviewCount}개, 팔로워 ${user.stats.followerCount}명`,
      keywords: ['프로필', '독서가', user.nickname, user.userid],
      ogType: 'profile',
      canonicalUrl: `${import.meta.env.VITE_BASE_URL}/profile/${user.userid}`,
      ogImage: user.profileImage ?? `${import.meta.env.VITE_BASE_URL}/default-profile-og.png`
    }}
    structuredData={{
      type: 'Person',
      data: {
        name: user.nickname,
        alternateName: `@${user.userid}`,
        description: user.bio,
        url: `${import.meta.env.VITE_BASE_URL}/profile/${user.userid}`,
        image: user.profileImage,
        sameAs: []
      }
    }}
  />
)

export const ReviewSEO: React.FC<{
  review: {
    title: string
    content: string
    author: { nickname: string; userid: string }
    book: { title: string; author: string }
    createdAt: string
    updatedAt?: string
  }
}> = ({ review }) => (
  <SEOHead
    metadata={{
      title: `${review.title} - ${review.author.nickname}의 독후감`,
      description: review.content.substring(0, 160) + (review.content.length > 160 ? '...' : ''),
      keywords: ['독후감', '리뷰', review.book.title, review.author.nickname],
      ogType: 'article',
      author: review.author.nickname,
      canonicalUrl: `${import.meta.env.VITE_BASE_URL}/review/${review.title.replace(/\s+/g, '-')}`,
      article: {
        author: review.author.nickname,
        section: '독후감',
        tags: [review.book.title, '독서', '리뷰'],
        publishedTime: review.createdAt,
        modifiedTime: review.updatedAt ?? review.createdAt
      }
    }}
    structuredData={{
      type: 'Article',
      data: {
        headline: review.title,
        description: review.content.substring(0, 160),
        author: {
          '@type': 'Person',
          name: review.author.nickname,
          url: `${import.meta.env.VITE_BASE_URL}/profile/${review.author.userid}`
        },
        datePublished: review.createdAt,
        dateModified: review.updatedAt ?? review.createdAt,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${import.meta.env.VITE_BASE_URL}/review/${review.title.replace(/\s+/g, '-')}`
        },
        publisher: {
          '@type': 'Organization',
          name: 'ReadZone',
          url: import.meta.env.VITE_BASE_URL
        }
      }
    }}
  />
)

export const BookSEO: React.FC<{
  book: {
    title: string
    author: string
    description?: string
    isbn?: string
    publishedDate?: string
    thumbnail?: string
  }
}> = ({ book }) => (
  <SEOHead
    metadata={{
      title: `${book.title} - ${book.author} | ReadZone`,
      description: book.description ?? `${book.author}의 ${book.title}에 대한 독후감과 리뷰를 ReadZone에서 확인해보세요.`,
      keywords: ['도서', '책', book.title, book.author, '독후감', '리뷰'],
      ogType: 'book',
      canonicalUrl: `${import.meta.env.VITE_BASE_URL}/books/${book.isbn ?? book.title.replace(/\s+/g, '-')}`,
      ogImage: book.thumbnail ?? `${import.meta.env.VITE_BASE_URL}/default-book-og.png`,
      book: {
        author: book.author,
        ...(book.isbn && { isbn: book.isbn }),
        ...(book.publishedDate && { releaseDate: book.publishedDate }),
        tags: [book.title, book.author, '도서']
      }
    }}
    structuredData={{
      type: 'Book',
      data: {
        name: book.title,
        author: {
          '@type': 'Person',
          name: book.author
        },
        description: book.description,
        isbn: book.isbn,
        datePublished: book.publishedDate,
        image: book.thumbnail,
        publisher: {
          '@type': 'Organization',
          name: 'Unknown'
        }
      }
    }}
  />
)