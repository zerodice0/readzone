// 임시 에러 저장소 (프로덕션에서는 Redis 등 사용 권장)
const errorCache = new Map<string, {
  error: any
  timestamp: number
  ttl: number
}>()

const CACHE_TTL = 5 * 60 * 1000 // 5분

// 만료된 캐시 정리
function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, value] of Array.from(errorCache.entries())) {
    if (now - value.timestamp > value.ttl) {
      errorCache.delete(key)
    }
  }
}

// 에러 정보 저장
export function storeAuthError(email: string, error: any) {
  cleanExpiredCache()
  errorCache.set(email, {
    error,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  })
}

// 에러 정보 조회
export function getAuthError(email: string) {
  cleanExpiredCache()
  return errorCache.get(email)
}

// 에러 정보 삭제
export function deleteAuthError(email: string) {
  return errorCache.delete(email)
}