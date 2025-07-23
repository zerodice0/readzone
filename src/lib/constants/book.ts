/**
 * 도서 시스템 관련 상수
 */

export const BOOK_CONSTANTS = {
  // 페이지네이션
  DEFAULT_PAGE_SIZE: {
    OPINIONS: 20,
    REVIEWS: 10,
    SEARCH_RESULTS: 20
  },
  
  // 제한사항
  LIMITS: {
    OPINION_MAX_LENGTH: 280,
    TITLE_MAX_LENGTH: 500,
    DESCRIPTION_MAX_LENGTH: 2000,
    MAX_AUTHORS: 10,
    MAX_TRANSLATORS: 10,
    MIN_PAGE_COUNT: 1,
    MAX_PAGE_COUNT: 10000
  },
  
  // 캐싱
  CACHE_TTL: {
    BOOK_SEARCH: 24 * 60 * 60 * 1000, // 24시간
    BOOK_DETAIL: 60 * 60 * 1000,      // 1시간
    POPULAR_BOOKS: 30 * 60 * 1000,    // 30분
    USAGE_STATS: 10 * 60 * 1000       // 10분
  },
  
  // API 설정
  API: {
    KAKAO_SEARCH_LIMIT: 50,
    BATCH_SIZE: 10,
    MAX_RETRIES: 3,
    TIMEOUT: 10000 // 10초
  }
} as const

export const ERROR_MESSAGES = {
  // 네트워크 오류
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다.',
  
  // 도서 관련
  BOOK_NOT_FOUND: '도서를 찾을 수 없습니다.',
  BOOK_LOAD_ERROR: '도서 정보를 불러올 수 없습니다.',
  BOOK_SEARCH_ERROR: '도서 검색 중 오류가 발생했습니다.',
  
  // 의견 관련
  OPINION_LOAD_ERROR: '의견을 불러올 수 없습니다.',
  OPINION_SUBMIT_ERROR: '의견 작성에 실패했습니다.',
  OPINION_EMPTY: '의견을 입력해주세요.',
  OPINION_TOO_LONG: '의견은 280자 이내로 작성해주세요.',
  
  // 독후감 관련
  REVIEW_LOAD_ERROR: '독후감을 불러올 수 없습니다.',
  REVIEW_SUBMIT_ERROR: '독후감 작성에 실패했습니다.',
  
  // 인증 관련
  AUTH_REQUIRED: '로그인이 필요합니다.',
  PERMISSION_DENIED: '접근 권한이 없습니다.',
  
  // 일반 오류
  GENERIC_ERROR: '오류가 발생했습니다.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  
  // 중복 관련
  DUPLICATE_OPINION: '이미 이 도서에 대한 의견을 작성하셨습니다.',
  DUPLICATE_BOOK: '이미 등록된 도서입니다.'
} as const

export const SUCCESS_MESSAGES = {
  OPINION_CREATED: '의견이 작성되었습니다.',
  OPINION_UPDATED: '의견이 수정되었습니다.',
  OPINION_DELETED: '의견이 삭제되었습니다.',
  
  REVIEW_CREATED: '독후감이 작성되었습니다.',
  REVIEW_UPDATED: '독후감이 수정되었습니다.',
  REVIEW_DELETED: '독후감이 삭제되었습니다.',
  
  BOOK_CREATED: '도서가 등록되었습니다.',
  BOOK_UPDATED: '도서 정보가 수정되었습니다.'
} as const

export const EMPTY_STATE_MESSAGES = {
  NO_OPINIONS: '아직 의견이 없습니다',
  NO_REVIEWS: '아직 독후감이 없습니다',
  NO_SEARCH_RESULTS: '검색 결과가 없습니다',
  NO_BOOKS: '등록된 도서가 없습니다',
  
  FIRST_OPINION: '이 도서에 대한 첫 번째 의견을 남겨보세요!',
  FIRST_REVIEW: '이 도서에 대한 첫 번째 독후감을 작성해보세요!',
  
  SEARCH_TIP: '다른 검색어로 시도해보세요.',
  MANUAL_ADD_TIP: '찾는 도서가 없다면 직접 추가할 수 있습니다.'
} as const

export const UI_LABELS = {
  // 버튼
  RETRY: '다시 시도',
  REFRESH: '새로고침',
  CANCEL: '취소',
  SAVE: '저장',
  SUBMIT: '작성',
  UPDATE: '수정',
  DELETE: '삭제',
  
  // 네비게이션
  PREV_PAGE: '이전 페이지',
  NEXT_PAGE: '다음 페이지',
  FIRST_PAGE: '첫 번째 페이지',
  LAST_PAGE: '마지막 페이지',
  
  // 탭
  REVIEWS_TAB: '독후감',
  OPINIONS_TAB: '의견',
  
  // 상태
  LOADING: '로딩 중...',
  SUBMITTING: '작성 중...',
  UPDATING: '수정 중...',
  DELETING: '삭제 중...',
  
  // 통계
  TOTAL_REVIEWS: '총 독후감',
  TOTAL_OPINIONS: '총 의견',
  RECOMMEND: '추천',
  NOT_RECOMMEND: '비추천',
  RECOMMENDATION_RATE: '추천률'
} as const

export const ARIA_LABELS = {
  BOOK_IMAGE: '도서 표지 이미지',
  USER_AVATAR: '사용자 프로필 이미지',
  RECOMMENDATION_BADGE: '추천 여부',
  STATS_SUMMARY: '통계 요약',
  PAGINATION: '페이지네이션',
  LOADING_STATUS: '로딩 상태',
  ERROR_ALERT: '오류 알림',
  
  // 접근성
  CURRENT_PAGE: '현재 페이지',
  PAGE_NUMBER: (n: number) => `페이지 ${n}`,
  RECOMMENDATION_RATE: (rate: number) => `추천률 ${rate}퍼센트`,
  ITEM_COUNT: (count: number, type: string) => `${type} ${count}개`
} as const