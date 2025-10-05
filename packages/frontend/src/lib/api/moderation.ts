import { api } from './client'
import type {
  ApiResponse,
  Block,
  BlockUserDto,
  GetMyBlocksResponse,
  GetReportsDto,
  GetReportsResponse,
  Report,
} from '@/types/moderation'

/**
 * 신고 생성 (일반 사용자)
 */
export interface CreateReportDto {
  reportedUserId: string
  targetType: 'REVIEW' | 'COMMENT' | 'USER'
  targetId: string
  type: 'SPAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'SEXUAL_CONTENT' | 'VIOLENCE' | 'OTHER'
  reason: string
}

export async function createReport(dto: CreateReportDto): Promise<Report> {
  const response = await api.post<ApiResponse<{ report: Report }>>(
    '/api/moderation/reports',
    dto
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message ?? '신고 접수에 실패했습니다')
  }

  return response.data.data.report
}

/**
 * 내가 작성한 신고 목록 조회
 */
export async function getMyReports(
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
    `/api/moderation/reports/my?${searchParams}`
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.error?.message ?? '신고 목록 조회에 실패했습니다'
    )
  }

  return response.data.data
}

/**
 * 사용자 차단
 */
export async function blockUser(dto: BlockUserDto): Promise<Block> {
  const response = await api.post<ApiResponse<{ block: Block }>>(
    '/api/moderation/blocks',
    dto
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message ?? '사용자 차단에 실패했습니다')
  }

  return response.data.data.block
}

/**
 * 사용자 차단 해제
 */
export async function unblockUser(blockedId: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(
    `/api/moderation/blocks/${blockedId}`
  )

  if (!response.data.success) {
    throw new Error(
      response.data.error?.message ?? '차단 해제에 실패했습니다'
    )
  }
}

/**
 * 내가 차단한 사용자 목록 조회
 */
export async function getMyBlocks(): Promise<Block[]> {
  const response = await api.get<GetMyBlocksResponse>(
    '/api/moderation/blocks/my'
  )

  if (!response.data.success) {
    throw new Error('차단 목록 조회에 실패했습니다')
  }

  return response.data.blocks
}
