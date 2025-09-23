interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
  isEarned: boolean
  earnedAt?: string
  progress?: {
    current: number
    required: number
    percentage: number
  }
  holdersCount?: number
}

interface BadgeStats {
  totalBadges: number
  earnedBadges: number
  completionRate: number
  tierCounts: Record<string, number>
  nextMilestone?: BadgeData
}

interface UserBadgesResponse {
  badges: BadgeData[]
  stats: BadgeStats
}

const API_BASE_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:3001/api'
  : '/api'

/**
 * 배지 API 요청을 위한 fetch 래퍼
 */
async function badgeFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}/badges${endpoint}`

  // 로컬 스토리지에서 토큰 가져오기
  const token = localStorage.getItem('accessToken')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }

  // 토큰이 있으면 Authorization 헤더 추가
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    headers,
    ...options,
  })

  if (!response.ok) {
    // 에러 응답 처리
    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }))

    // validation 에러 배열 처리
    if (errorData.message && Array.isArray(errorData.message)) {
      throw new Error(errorData.message.join(', '))
    }

    throw new Error(errorData.message ?? `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

/**
 * 모든 배지 목록 조회 (공개)
 */
export async function getAllBadges(): Promise<BadgeData[]> {
  const response = await badgeFetch<BadgeData[]>('/')

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? '배지 목록 조회 중 오류가 발생했습니다')
  }

  return response.data
}

/**
 * 특정 사용자의 배지 조회
 */
export async function getUserBadges(userid: string): Promise<UserBadgesResponse> {
  const response = await badgeFetch<UserBadgesResponse>(`/users/${userid}`)

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? '사용자 배지 조회 중 오류가 발생했습니다')
  }

  return response.data
}

/**
 * 현재 사용자의 배지 확인 및 자동 수여 (인증 필요)
 */
export async function checkUserBadges(): Promise<{ message: string; awardedBadges: BadgeData[] }> {
  const response = await badgeFetch<{ message: string; awardedBadges: BadgeData[] }>('/check', {
    method: 'POST',
  })

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? '배지 확인 중 오류가 발생했습니다')
  }

  return response.data
}

// 타입 내보내기
export type {
  BadgeData,
  BadgeStats,
  UserBadgesResponse,
}