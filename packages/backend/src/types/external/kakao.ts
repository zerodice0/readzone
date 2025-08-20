/**
 * 카카오 도서 검색 API 타입 정의
 * - 카카오 REST API 응답 형식에 맞춘 타입
 * - 3단계 도서 검색 중 2단계에서 사용
 */

/** 카카오 도서 검색 API 응답 */
export interface KakaoBookSearchResponse {
  documents: KakaoBookDocument[]
  meta: KakaoSearchMeta
}

/** 카카오 검색 메타 정보 */
export interface KakaoSearchMeta {
  total_count: number          // 검색된 총 문서 수
  pageable_count: number       // 현재 검색 결과 수
  is_end: boolean             // 마지막 페이지 여부
}

/** 카카오 도서 정보 문서 */
export interface KakaoBookDocument {
  title: string               // 도서 제목
  contents: string            // 도서 소개
  url: string                 // 도서 상세 URL
  isbn: string                // ISBN (10자리 또는 13자리)
  datetime: string            // 출간일 (ISO 8601 형식)
  authors: string[]           // 저자 목록
  publisher: string           // 출판사
  translators: string[]       // 번역자 목록
  price: number              // 정가
  sale_price: number         // 판매가
  thumbnail: string          // 표지 이미지 URL
  status: string             // 판매 상태
}

/** 카카오 API에서 내부 Book 엔티티로 변환하기 위한 매핑 타입 */
export interface KakaoBookMapping {
  title: string
  author: string              // authors 배열을 ', '로 조인
  publisher: string
  publishedAt: string         // datetime을 YYYY-MM-DD 형식으로 변환
  description: string         // contents
  thumbnail: string
  isbn: string
  source: 'KAKAO_API'
  externalId: string          // 카카오 API의 고유 식별자 (ISBN 사용)
}

/** 카카오 API 에러 응답 */
export interface KakaoApiError {
  errorType: string
  message: string
}

/** 카카오 API 요청 파라미터 */
export interface KakaoSearchParams {
  query: string
  sort?: 'accuracy' | 'latest'  // 정확도순 또는 최신순
  page?: number                 // 페이지 번호 (1-50)
  size?: number                 // 한 페이지에 보여질 문서 수 (1-50)
  target?: 'title' | 'isbn' | 'publisher' | 'person'  // 검색 필드
}