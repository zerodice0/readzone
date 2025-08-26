/**
 * 사용자 관련 데이터베이스 엔티티 타입
 * - 사용자 기본 정보, 인증, 프로필 관리에 사용
 * - Prisma User 모델과 매핑되는 타입 정의
 */

/** 사용자 기본 엔티티 (Prisma User 모델) */
export interface User {
  id: string
  email: string
  nickname: string
  password: string
  bio?: string | null
  profileImage?: string | null
  isVerified: boolean
  verificationToken?: string | null
  resetToken?: string | null
  resetTokenExpires?: Date | null
  createdAt: Date
  updatedAt: Date
}

/** 사용자 프로필 페이지용 - 활동 통계 포함 */
export interface UserWithCounts extends User {
  _count: {
    reviews: number      // 작성한 독후감 수
    likes: number        // 받은 좋아요 수  
    following: number    // 팔로잉 수
    followers: number    // 팔로워 수
  }
}

/** 공개 사용자 정보 - 민감한 정보 제외 */
export interface PublicUser {
  id: string
  nickname: string
  bio?: string | null
  profileImage?: string | null
  createdAt: Date
}

/** 사용자 프로필 정보 (레거시 호환성) */
export type UserProfile = PublicUser

/** 사용자 활동 통계 (레거시 호환성) */
export type UserStats = UserWithCounts['_count']