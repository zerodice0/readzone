import { api } from './client'
import type {
  ApiResponse,
  GetReportsDto,
  GetReportsResponse,
  GetViolationsResponse,
  Report,
  ReviewReportDto,
  SuspendedUser,
  SuspendUserDto,
} from '@/types/moderation'

/**
 * Get all reports (MODERATOR+ only)
 */
export async function getAllReports(
  params?: GetReportsDto
): Promise<GetReportsResponse> {
  const searchParams = new URLSearchParams()

  if (params?.status) {
    searchParams.set('status', params.status)
  }
  if (params?.reportedUserId) {
    searchParams.set('reportedUserId', params.reportedUserId)
  }
  if (params?.cursor) {
    searchParams.set('cursor', params.cursor)
  }
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString())
  }

  const response = await api.get<ApiResponse<GetReportsResponse>>(
    `/api/moderation/admin/reports?${searchParams}`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message ?? '신고 목록 조회에 실패했습니다')
  }

  return response.data.data
}

/**
 * Review a report (MODERATOR+ only)
 */
export async function reviewReport(
  reportId: string,
  dto: ReviewReportDto
): Promise<Report> {
  const response = await api.patch<ApiResponse<{ report: Report }>>(
    `/api/moderation/admin/reports/${reportId}`,
    dto
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message ?? '신고 검토에 실패했습니다')
  }

  return response.data.data.report
}

/**
 * Suspend or unsuspend a user (ADMIN only)
 */
export async function suspendUser(
  userId: string,
  dto: SuspendUserDto
): Promise<SuspendedUser> {
  const response = await api.post<ApiResponse<{ user: SuspendedUser }>>(
    `/api/moderation/admin/users/${userId}/suspend`,
    dto
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.error?.message ?? '사용자 정지 처리에 실패했습니다'
    )
  }

  return response.data.data.user
}

/**
 * Get user violations (ADMIN only)
 */
export async function getUserViolations(
  userId: string
): Promise<GetViolationsResponse> {
  const response = await api.get<GetViolationsResponse>(
    `/api/moderation/admin/users/${userId}/violations`
  )

  if (!response.data.success) {
    throw new Error('위반 사항 조회에 실패했습니다')
  }

  return response.data
}
