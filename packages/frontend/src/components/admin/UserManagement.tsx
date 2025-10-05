import { useState } from 'react'
import { getUserViolations, suspendUser } from '@/lib/api/admin'
import type { SuspendUserDto, Violation } from '@/types/moderation'

export function UserManagement() {
  const [userId, setUserId] = useState('')
  const [suspendedUntil, setSuspendedUntil] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [violations, setViolations] = useState<Violation[]>([])
  const [isLoadingViolations, setIsLoadingViolations] = useState(false)

  const handleSuspend = async (isSuspended: boolean) => {
    if (!userId.trim()) {
      setError('사용자 ID를 입력해주세요')

      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const dto: SuspendUserDto = {
        isSuspended,
        ...(isSuspended && suspendedUntil && { suspendedUntil }),
        ...(reason && { reason }),
      }

      const result = await suspendUser(userId, dto)

      setSuccess(
        isSuspended
          ? `사용자 ${result.nickname}을(를) 정지했습니다.`
          : `사용자 ${result.nickname}의 정지를 해제했습니다.`
      )

      // Reset form
      setUserId('')
      setSuspendedUntil('')
      setReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLoadViolations = async () => {
    if (!userId.trim()) {
      setError('사용자 ID를 입력해주세요')

      return
    }

    setIsLoadingViolations(true)
    setError(null)

    try {
      const result = await getUserViolations(userId)

      setViolations(result.violations)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '위반 사항 조회 중 오류가 발생했습니다'
      )
    } finally {
      setIsLoadingViolations(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      LOW: 'bg-yellow-100 text-yellow-800',
      MEDIUM: 'bg-orange-100 text-orange-800',
      HIGH: 'bg-red-100 text-red-800',
      CRITICAL: 'bg-purple-100 text-purple-800',
    }

    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* User Suspension Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          사용자 정지 관리
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              사용자 ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="정지할 사용자의 ID를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="suspendedUntil"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              정지 종료 일시 (선택사항)
            </label>
            <input
              type="datetime-local"
              id="suspendedUntil"
              value={suspendedUntil}
              onChange={(e) => setSuspendedUntil(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              입력하지 않으면 영구 정지됩니다
            </p>
          </div>

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              사유
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="정지 사유를 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleSuspend(true)}
              disabled={isSubmitting || !userId.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : '사용자 정지'}
            </button>
            <button
              onClick={() => handleSuspend(false)}
              disabled={isSubmitting || !userId.trim()}
              className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : '정지 해제'}
            </button>
          </div>
        </div>
      </div>

      {/* User Violations */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">위반 사항 조회</h3>
          <button
            onClick={handleLoadViolations}
            disabled={isLoadingViolations || !userId.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoadingViolations ? '조회 중...' : '조회'}
          </button>
        </div>

        {violations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            위반 사항이 없거나 조회되지 않았습니다
          </p>
        ) : (
          <div className="space-y-3">
            {violations.map((violation) => (
              <div
                key={violation.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}
                      >
                        {violation.severity}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {violation.type}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">
                      {violation.description}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        생성일:{' '}
                        {new Date(violation.createdAt).toLocaleDateString(
                          'ko-KR'
                        )}
                      </span>
                      {violation.expiresAt && (
                        <span>
                          만료일:{' '}
                          {new Date(violation.expiresAt).toLocaleDateString(
                            'ko-KR'
                          )}
                        </span>
                      )}
                      {violation.reportId && (
                        <span>신고 ID: {violation.reportId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">사용 안내</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 사용자 ID는 정확히 입력해야 합니다</li>
          <li>• 정지 종료 일시를 설정하지 않으면 영구 정지됩니다</li>
          <li>• 모든 관리자 액션은 감사 로그에 기록됩니다</li>
          <li>• 정지된 사용자는 로그인할 수 없습니다</li>
        </ul>
      </div>
    </div>
  )
}
