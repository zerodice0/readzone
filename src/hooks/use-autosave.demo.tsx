'use client'

import { useState } from 'react'
import { useAutosave, formatAutosaveStatus } from './use-autosave'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save, RefreshCw, Trash2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * useAutosave 훅 사용 예제
 * 
 * 이 데모는 자동저장 훅의 다양한 기능을 보여줍니다:
 * - 자동저장 (30초마다)
 * - 수동 저장
 * - localStorage 저장/복구
 * - 서버 저장 시뮬레이션
 * - 에러 처리
 * - 상태 표시
 */
export function UseAutosaveDemo() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [simulateError, setSimulateError] = useState(false)

  // 서버 저장 시뮬레이션
  const handleServerSave = async (data: { title: string; content: string }) => {
    // 저장 시뮬레이션 (1초 딜레이)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 에러 시뮬레이션
    if (simulateError) {
      throw new Error('서버 저장 실패 (시뮬레이션)')
    }

    console.log('서버에 저장됨:', data)
  }

  // 자동저장 훅 사용
  const autosave = useAutosave({
    key: 'demo-autosave',
    data: { title, content },
    interval: 30000, // 30초
    debounceMs: 1000, // 1초
    storage: 'both', // localStorage와 서버 모두
    onSave: handleServerSave,
    onError: (error) => {
      toast.error(`저장 실패: ${error.message}`)
    },
    onSuccess: () => {
      toast.success('자동저장 완료')
    },
    enabled: true
  })

  // 데이터 복구
  const handleRestore = () => {
    const restored = autosave.restore()
    if (restored) {
      setTitle(restored.title)
      setContent(restored.content)
      toast.success('저장된 데이터를 복구했습니다.')
    } else {
      toast.error('복구할 데이터가 없습니다.')
    }
  }

  // 상태에 따른 배지 색상
  const getStatusColor = () => {
    switch (autosave.status) {
      case 'saving':
        return 'bg-blue-500'
      case 'saved':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">useAutosave 훅 데모</h2>
        <p className="text-gray-600 dark:text-gray-400">
          자동저장 기능을 테스트해보세요. 입력 후 1초가 지나면 자동으로 저장됩니다.
        </p>
      </div>

      {/* 상태 표시 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor()} text-white`}>
              {autosave.status}
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatAutosaveStatus(autosave.status, autosave.lastSaved)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestore}
              disabled={autosave.isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              복구
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={autosave.clear}
              disabled={autosave.isSaving}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              초기화
            </Button>
            <Button
              size="sm"
              onClick={autosave.save}
              disabled={autosave.isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              수동 저장
            </Button>
          </div>
        </div>

        {autosave.error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {autosave.error.message}
            </p>
          </div>
        )}
      </Card>

      {/* 입력 폼 */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              제목
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="w-full h-32 px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="simulate-error"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="simulate-error" className="text-sm">
              서버 저장 에러 시뮬레이션
            </label>
          </div>
        </div>
      </Card>

      {/* 사용법 안내 */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-semibold mb-3">사용 방법</h3>
        <ul className="space-y-2 text-sm">
          <li>• 입력 후 1초가 지나면 자동으로 저장됩니다</li>
          <li>• 30초마다 정기적으로 자동저장됩니다</li>
          <li>• '수동 저장' 버튼으로 즉시 저장할 수 있습니다</li>
          <li>• '복구' 버튼으로 이전에 저장된 데이터를 불러올 수 있습니다</li>
          <li>• 브라우저를 닫으려 할 때 저장되지 않은 내용이 있으면 경고가 표시됩니다</li>
          <li>• 에러 시뮬레이션을 켜면 재시도 로직을 확인할 수 있습니다</li>
        </ul>
      </Card>

      {/* 실제 사용 예제 코드 */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">실제 사용 예제</h3>
        <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto">
{`// 독후감 작성 페이지에서 사용
const { save, status, lastSaved } = useAutosave({
  key: 'review-draft',
  data: { 
    bookId, 
    title, 
    content, 
    tags 
  },
  storage: 'both',
  onSave: async (data) => {
    await api.saveDraft(data)
  },
  onError: (error) => {
    toast.error('임시저장 실패')
  }
})

// 상태 표시
<div>{formatAutosaveStatus(status, lastSaved)}</div>

// 수동 저장 버튼
<Button onClick={save}>저장</Button>`}
        </pre>
      </Card>
    </div>
  )
}