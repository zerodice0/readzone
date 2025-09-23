// SEO and social sharing utilities
export interface SEOMetadata {
  title: string
  description: string
  keywords?: string[]
  canonicalUrl?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'book' | 'profile'
  twitterCard?: 'summary' | 'summary_large_image'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  article?: {
    author?: string
    section?: string
    tags?: string[]
    publishedTime?: string
    modifiedTime?: string
  }
  book?: {
    author?: string
    isbn?: string
    releaseDate?: string
    tags?: string[]
  }
}

export function generateSEOMetadata(data: SEOMetadata): { name?: string; property?: string; content: string }[] {
  const meta = []

  // Basic meta tags
  meta.push({ name: 'description', content: data.description })

  if (data.keywords && data.keywords.length > 0) {
    meta.push({ name: 'keywords', content: data.keywords.join(', ') })
  }

  if (data.author) {
    meta.push({ name: 'author', content: data.author })
  }

  if (data.canonicalUrl) {
    meta.push({ property: 'canonical', content: data.canonicalUrl })
  }

  // Open Graph meta tags
  meta.push({ property: 'og:title', content: data.title })
  meta.push({ property: 'og:description', content: data.description })
  meta.push({ property: 'og:type', content: data.ogType ?? 'website' })

  if (data.canonicalUrl) {
    meta.push({ property: 'og:url', content: data.canonicalUrl })
  }

  if (data.ogImage) {
    meta.push({ property: 'og:image', content: data.ogImage })
    meta.push({ property: 'og:image:alt', content: data.title })
  }

  meta.push({ property: 'og:site_name', content: 'ReadZone' })
  meta.push({ property: 'og:locale', content: 'ko_KR' })

  // Twitter Card meta tags
  meta.push({ property: 'twitter:card', content: data.twitterCard ?? 'summary_large_image' })
  meta.push({ property: 'twitter:title', content: data.title })
  meta.push({ property: 'twitter:description', content: data.description })

  if (data.ogImage) {
    meta.push({ property: 'twitter:image', content: data.ogImage })
  }

  // Article-specific meta tags
  if (data.article) {
    if (data.article.author) {
      meta.push({ property: 'article:author', content: data.article.author })
    }
    if (data.article.section) {
      meta.push({ property: 'article:section', content: data.article.section })
    }
    if (data.article.publishedTime) {
      meta.push({ property: 'article:published_time', content: data.article.publishedTime })
    }
    if (data.article.modifiedTime) {
      meta.push({ property: 'article:modified_time', content: data.article.modifiedTime })
    }
    if (data.article.tags) {
      data.article.tags.forEach(tag => {
        meta.push({ property: 'article:tag', content: tag })
      })
    }
  }

  // Book-specific meta tags
  if (data.book) {
    if (data.book.author) {
      meta.push({ property: 'book:author', content: data.book.author })
    }
    if (data.book.isbn) {
      meta.push({ property: 'book:isbn', content: data.book.isbn })
    }
    if (data.book.releaseDate) {
      meta.push({ property: 'book:release_date', content: data.book.releaseDate })
    }
    if (data.book.tags) {
      data.book.tags.forEach(tag => {
        meta.push({ property: 'book:tag', content: tag })
      })
    }
  }

  return meta
}

// Generate structured data (JSON-LD)
export function generateStructuredData(type: string, data: Record<string, unknown>): string {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': type
  }

  const structuredData = { ...baseStructure, ...data }

  return JSON.stringify(structuredData, null, 2)
}

// SEO data generators for different page types
export const seoGenerators = {
  homepage: (): SEOMetadata => ({
    title: 'ReadZone - 독서 커뮤니티 SNS',
    description: '독서 후 의견을 공유하는 독서 전용 커뮤니티 SNS 플랫폼입니다. 독후감을 작성하고 다른 독서가들과 소통해보세요.',
    keywords: ['독서', '독후감', '책', '커뮤니티', 'SNS', '도서', '리뷰'],
    ogType: 'website',
    twitterCard: 'summary_large_image'
  }),

  profile: (user: { nickname: string; userid: string; bio?: string; stats: { reviewCount: number; followerCount: number } }): SEOMetadata => ({
    title: `${user.nickname} (@${user.userid}) - ReadZone`,
    description: user.bio ?? `${user.nickname}님의 ReadZone 프로필입니다. 독후감 ${user.stats.reviewCount}개, 팔로워 ${user.stats.followerCount}명`,
    keywords: ['프로필', '독서가', user.nickname, user.userid],
    ogType: 'profile',
    twitterCard: 'summary'
  }),

  review: (review: { title: string; content: string; author: { nickname: string }; book: { title: string }; createdAt: string; updatedAt?: string }): SEOMetadata => ({
    title: `${review.title} - ${review.author.nickname}의 독후감`,
    description: review.content.substring(0, 160) + (review.content.length > 160 ? '...' : ''),
    keywords: ['독후감', '리뷰', review.book.title, review.author.nickname],
    ogType: 'article',
    author: review.author.nickname,
    article: {
      author: review.author.nickname,
      section: '독후감',
      tags: [review.book.title, '독서', '리뷰'],
      publishedTime: review.createdAt,
      modifiedTime: review.updatedAt ?? review.createdAt
    }
  }),

  book: (book: { title: string; author: string; description?: string; isbn?: string; publishedDate?: string }): SEOMetadata => ({
    title: `${book.title} - ${book.author} | ReadZone`,
    description: book.description ?? `${book.author}의 ${book.title}에 대한 독후감과 리뷰를 ReadZone에서 확인해보세요.`,
    keywords: ['도서', '책', book.title, book.author, '독후감', '리뷰'],
    ogType: 'book',
    book: {
      author: book.author,
      ...(book.isbn && { isbn: book.isbn }),
      ...(book.publishedDate && { releaseDate: book.publishedDate }),
      tags: [book.title, book.author, '도서']
    }
  }),

  search: (query: string, type: string): SEOMetadata => ({
    title: `"${query}" 검색 결과 - ReadZone`,
    description: `"${query}" 검색 결과입니다. ReadZone에서 관련 도서, 독후감, 사용자를 찾아보세요.`,
    keywords: ['검색', query, type, '도서 검색', '독후감 검색'],
    ogType: 'website'
  })
}

// Social sharing utilities
export interface ShareData {
  title: string
  text: string
  url: string
}

export function generateShareUrl(platform: string, data: ShareData): string {
  const encodedTitle = encodeURIComponent(data.title)
  const encodedText = encodeURIComponent(data.text)
  const encodedUrl = encodeURIComponent(data.url)

  const platforms: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&t=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    kakao: '', // Will be handled by Kakao SDK
    naver: `https://share.naver.com/web/shareView.nhn?url=${encodedUrl}&title=${encodedTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
  }

  return platforms[platform] ?? ''
}

export async function nativeShare(data: ShareData): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(data)

      return true
    } catch (error) {
      console.warn('Native sharing cancelled or failed:', error)

      return false
    }
  }

  return false
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false)
  }

  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea')

    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const result = document.execCommand('copy')

    document.body.removeChild(textArea)

    return Promise.resolve(result)
  } catch (_error) {
    return Promise.resolve(false)
  }
}

// Generate sitemap data
export interface SitemapEntry {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export function generateSitemapEntries(baseUrl: string): SitemapEntry[] {
  return [
    {
      url: `${baseUrl}/`,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/login`,
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/register`,
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/search`,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/write`,
      changefreq: 'weekly',
      priority: 0.6
    }
  ]
}