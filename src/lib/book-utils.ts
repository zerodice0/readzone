/**
 * 도서 관련 유틸리티 함수
 * - 데이터 변환
 * - 검증
 * - 포맷팅
 */

import type { Book } from '@prisma/client'
import type { KakaoBook } from '@/types/kakao'
import type { BookData, ManualBookInput, BookValidation } from '@/types/book'

/**
 * Kakao API 도서 데이터를 DB 모델로 변환
 */
export function kakaoBookToDbModel(kakaoBook: KakaoBook): Partial<Book> {
  return {
    isbn: kakaoBook.isbn || undefined,
    isbn13: kakaoBook.isbn?.length === 13 ? kakaoBook.isbn : undefined,
    title: kakaoBook.title,
    authors: JSON.stringify(kakaoBook.authors),
    publisher: kakaoBook.publisher || undefined,
    translators: kakaoBook.translators?.length > 0 
      ? JSON.stringify(kakaoBook.translators) 
      : undefined,
    thumbnail: kakaoBook.thumbnail || undefined,
    contents: kakaoBook.contents || undefined,
    url: kakaoBook.url || undefined,
    datetime: kakaoBook.datetime || undefined,
    price: kakaoBook.price || undefined,
    salePrice: kakaoBook.sale_price || undefined,
    status: kakaoBook.status || undefined,
    description: kakaoBook.contents || undefined,
    isManualEntry: false,
    kakaoId: kakaoBook.isbn || undefined, // ISBN을 고유 ID로 사용
    lastSyncedAt: new Date()
  }
}

/**
 * DB 모델을 BookData 타입으로 변환
 */
export function dbModelToBookData(book: Book): BookData {
  return {
    ...book,
    authors: parseJsonArray(book.authors),
    translators: parseJsonArray(book.translators)
  }
}

/**
 * JSON 문자열을 배열로 파싱
 */
function parseJsonArray(jsonString: string | null | undefined): string[] {
  if (!jsonString) return []
  
  try {
    const parsed = JSON.parse(jsonString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * ISBN 유효성 검증
 */
export function validateISBN(isbn: string): boolean {
  const cleanISBN = isbn.replace(/[-\s]/g, '')
  
  // ISBN-10 검증
  if (cleanISBN.length === 10) {
    return validateISBN10(cleanISBN)
  }
  
  // ISBN-13 검증
  if (cleanISBN.length === 13) {
    return validateISBN13(cleanISBN)
  }
  
  return false
}

/**
 * ISBN-10 체크섬 검증
 */
function validateISBN10(isbn: string): boolean {
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i]) * (10 - i)
  }
  
  const checkDigit = isbn[9]
  const checkSum = (11 - (sum % 11)) % 11
  
  if (checkSum === 10) {
    return checkDigit === 'X'
  }
  
  return parseInt(checkDigit) === checkSum
}

/**
 * ISBN-13 체크섬 검증
 */
function validateISBN13(isbn: string): boolean {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3)
  }
  
  const checkDigit = parseInt(isbn[12])
  const checkSum = (10 - (sum % 10)) % 10
  
  return checkDigit === checkSum
}

/**
 * 수동 입력 도서 데이터 검증
 */
export function validateManualBookInput(input: ManualBookInput): BookValidation {
  const errors: { field: string; message: string }[] = []
  
  // 필수 필드 검증
  if (!input.title?.trim()) {
    errors.push({ field: 'title', message: '제목은 필수입니다.' })
  } else if (input.title.length > 500) {
    errors.push({ field: 'title', message: '제목은 500자 이내여야 합니다.' })
  }
  
  if (!input.authors || input.authors.length === 0) {
    errors.push({ field: 'authors', message: '저자는 최소 1명 이상 입력해야 합니다.' })
  } else if (input.authors.some(author => !author.trim())) {
    errors.push({ field: 'authors', message: '빈 저자명은 허용되지 않습니다.' })
  }
  
  // 선택 필드 검증
  if (input.isbn && !validateISBN(input.isbn)) {
    errors.push({ field: 'isbn', message: '유효하지 않은 ISBN입니다.' })
  }
  
  if (input.isbn13 && !validateISBN(input.isbn13)) {
    errors.push({ field: 'isbn13', message: '유효하지 않은 ISBN-13입니다.' })
  }
  
  if (input.pageCount && (input.pageCount < 1 || input.pageCount > 10000)) {
    errors.push({ field: 'pageCount', message: '페이지 수는 1-10000 사이여야 합니다.' })
  }
  
  if (input.price && input.price < 0) {
    errors.push({ field: 'price', message: '가격은 0 이상이어야 합니다.' })
  }
  
  if (input.salePrice && input.salePrice < 0) {
    errors.push({ field: 'salePrice', message: '판매가는 0 이상이어야 합니다.' })
  }
  
  if (input.thumbnail && !isValidUrl(input.thumbnail)) {
    errors.push({ field: 'thumbnail', message: '유효한 이미지 URL이 아닙니다.' })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * URL 유효성 검증
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 저자명 포맷팅
 */
export function formatAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return '저자 미상'
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) return authors.join(', ')
  return `${authors[0]} 외 ${authors.length - 1}명`
}

/**
 * 가격 포맷팅
 */
export function formatPrice(price: number | null | undefined): string {
  if (!price) return '가격 정보 없음'
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0
  }).format(price)
}

/**
 * 날짜 포맷팅
 */
export function formatBookDate(datetime: string | null | undefined): string {
  if (!datetime) return '출간일 미상'
  
  try {
    const date = new Date(datetime)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  } catch {
    return datetime
  }
}

/**
 * 도서 제목 정규화 (검색용)
 */
export function normalizeBookTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
    .replace(/\s+/g, ' ') // 연속 공백 제거
    .trim()
}

/**
 * 도서 데이터 병합 (기존 데이터 + 새 데이터)
 */
export function mergeBookData(
  existing: Partial<Book>, 
  updated: Partial<Book>
): Partial<Book> {
  return {
    ...existing,
    ...updated,
    // null이 아닌 값만 업데이트
    isbn: updated.isbn || existing.isbn,
    isbn13: updated.isbn13 || existing.isbn13,
    thumbnail: updated.thumbnail || existing.thumbnail,
    description: updated.description || existing.description,
    publisher: updated.publisher || existing.publisher,
    // 배열 필드는 새 값으로 완전 교체
    authors: updated.authors || existing.authors,
    translators: updated.translators || existing.translators,
    // 타임스탬프 업데이트
    updatedAt: new Date(),
    lastSyncedAt: updated.lastSyncedAt || existing.lastSyncedAt
  }
}