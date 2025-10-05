import { useEffect, useState } from 'react'
import { getAllReports, reviewReport } from '@/lib/api/admin'
import type {
  GetReportsDto,
  Report,
  ReportStatus,
  ReviewReportDto,
} from '@/types/moderation'

export function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadReports = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: GetReportsDto =
        filter !== 'all'
          ? { status: filter, limit: 50 }
          : { limit: 50 }

      const data = await getAllReports(params)

      setReports(data.reports)
    } catch (err) {
      setError(err instanceof Error ? err.message : '신고 목록 로드 실패')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (reportId: string, dto: ReviewReportDto) => {
    setIsReviewing(true)
    setError(null)

    try {
      const updatedReport = await reviewReport(reportId, dto)

      // Update the report in the list
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? updatedReport : r))
      )
      setSelectedReport(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '신고 검토 실패')
    } finally {
      setIsReviewing(false)
    }
  }

  const getStatusBadge = (status: ReportStatus) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      UNDER_REVIEW: 'bg-blue-100 text-blue-800',
      ACTION_TAKEN: 'bg-green-100 text-green-800',
      DISMISSED: 'bg-gray-100 text-gray-800',
    }

    const labels = {
      PENDING: '대기 중',
      UNDER_REVIEW: '검토 중',
      ACTION_TAKEN: '조치 완료',
      DISMISSED: '기각됨',
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    )
  }

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SPAM: '스팸',
      HARASSMENT: '괴롭힘',
      HATE_SPEECH: '혐오 표현',
      SEXUAL_CONTENT: '성적 콘텐츠',
      VIOLENCE: '폭력',
      OTHER: '기타',
    }

    return labels[type] ?? type
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => loadReports()}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">신고 목록</h3>
          <div className="flex space-x-2">
            {['all', 'PENDING', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as ReportStatus | 'all')}
                  className={`
                    px-3 py-1 rounded-md text-sm font-medium transition-colors
                    ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {status === 'all' ? '전체' : getStatusBadge(status as ReportStatus)}
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          총 {reports.length}건의 신고
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">신고가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {reports.map((report) => (
            <div key={report.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(report.status)}
                    <span className="text-sm font-medium text-gray-900">
                      {getReportTypeLabel(report.type)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {report.targetType}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-700">{report.reason}</p>

                  <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                    <span>
                      신고자: {report.reporter?.nickname ?? '알 수 없음'}
                    </span>
                    <span>
                      피신고자: {report.reportedUser?.nickname ?? '알 수 없음'}
                    </span>
                    <span>
                      {new Date(report.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {report.adminNotes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      <strong>관리자 메모:</strong> {report.adminNotes}
                    </div>
                  )}
                </div>

                {report.status === 'PENDING' && (
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    검토하기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              신고 검토
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  신고 유형
                </label>
                <p className="mt-1 text-gray-900">
                  {getReportTypeLabel(selectedReport.type)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  신고 사유
                </label>
                <p className="mt-1 text-gray-900">{selectedReport.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    신고자
                  </label>
                  <p className="mt-1 text-gray-900">
                    {selectedReport.reporter?.nickname ?? '알 수 없음'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    피신고자
                  </label>
                  <p className="mt-1 text-gray-900">
                    {selectedReport.reportedUser?.nickname ?? '알 수 없음'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() =>
                  handleReview(selectedReport.id, {
                    status: 'ACTION_TAKEN',
                    adminNotes: '위반 사항 확인됨',
                  })
                }
                disabled={isReviewing}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                조치 필요
              </button>
              <button
                onClick={() =>
                  handleReview(selectedReport.id, {
                    status: 'DISMISSED',
                    adminNotes: '위반 사항 없음',
                  })
                }
                disabled={isReviewing}
                className="flex-1 px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 disabled:bg-gray-400"
              >
                기각
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                disabled={isReviewing}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:bg-gray-100"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
