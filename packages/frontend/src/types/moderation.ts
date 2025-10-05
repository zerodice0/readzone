// Enums matching backend
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED'
export type ReportType = 'SPAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'SEXUAL_CONTENT' | 'VIOLENCE' | 'OTHER'
export type ReportTargetType = 'REVIEW' | 'COMMENT' | 'USER'
export type ViolationType = 'SPAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'INAPPROPRIATE_CONTENT' | 'IMPERSONATION' | 'OTHER'
export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Report interfaces
export interface Report {
  id: string
  reporterId: string
  reportedUserId: string
  targetType: ReportTargetType
  targetId: string
  type: ReportType
  reason: string
  status: ReportStatus
  createdAt: string
  reviewedAt?: string
  reviewedById?: string
  adminNotes?: string
  reporter?: {
    id: string
    userid: string
    nickname: string
  }
  reportedUser?: {
    id: string
    userid: string
    nickname: string
  }
}

export interface GetReportsDto {
  status?: ReportStatus
  reportedUserId?: string
  cursor?: string
  limit?: number
}

export interface GetReportsResponse {
  reports: Report[]
  pagination: {
    nextCursor?: string
    hasMore: boolean
  }
}

export interface ReviewReportDto {
  status: ReportStatus
  adminNotes?: string
}

// Block interfaces
export interface Block {
  id: string
  blockerId: string
  blockedId: string
  reason?: string
  createdAt: string
  blocked: {
    id: string
    userid: string
    nickname: string
    profileImage?: string
  }
}

export interface BlockUserDto {
  blockedId: string
  reason?: string
}

export interface GetMyBlocksResponse {
  success: boolean
  blocks: Block[]
}

// User management interfaces
export interface SuspendUserDto {
  isSuspended: boolean
  suspendedUntil?: string
  reason?: string
}

export interface SuspendedUser {
  id: string
  userid: string
  nickname: string
  isSuspended: boolean
  suspendedUntil?: string
}

// Violation interfaces
export interface Violation {
  id: string
  userId: string
  type: ViolationType
  severity: ViolationSeverity
  description: string
  reportId?: string
  createdAt: string
  expiresAt?: string
}

export interface GetViolationsResponse {
  success: boolean
  violations: Violation[]
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
  }
}
