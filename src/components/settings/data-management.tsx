'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Download,
  Upload,
  Database,
  FileText,
  Image,
  HardDrive,
  RefreshCw,
  AlertCircle,
  Info,
  Archive,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface DataManagementProps {
  userId: string
  className?: string
}

interface DataExportOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  size: string
  format: string
  includeImages: boolean
}

const exportOptions: DataExportOption[] = [
  {
    id: 'reviews',
    name: '독후감 데이터',
    description: '작성한 모든 독후감과 메타데이터',
    icon: <FileText className="w-5 h-5" />,
    size: '~2.5MB',
    format: 'JSON, CSV',
    includeImages: false
  },
  {
    id: 'opinions',
    name: '도서 의견',
    description: '작성한 모든 도서 의견과 평점',
    icon: <FileText className="w-5 h-5" />,
    size: '~500KB',
    format: 'JSON, CSV',
    includeImages: false
  },
  {
    id: 'comments',
    name: '댓글 데이터',
    description: '작성한 모든 댓글과 대댓글',
    icon: <FileText className="w-5 h-5" />,
    size: '~1MB',
    format: 'JSON, CSV',
    includeImages: false
  },
  {
    id: 'profile',
    name: '프로필 정보',
    description: '프로필 설정과 개인정보',
    icon: <Database className="w-5 h-5" />,
    size: '~100KB',
    format: 'JSON',
    includeImages: true
  },
  {
    id: 'full',
    name: '전체 데이터',
    description: '모든 데이터를 포함한 완전한 백업',
    icon: <Archive className="w-5 h-5" />,
    size: '~5MB',
    format: 'ZIP (JSON + 이미지)',
    includeImages: true
  }
]

export function DataManagement({ userId, className }: DataManagementProps) {
  const [selectedExports, setSelectedExports] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportHistory, _] = useState([
    {
      id: '1',
      type: '전체 데이터',
      date: '2024-01-15T10:30:00Z',
      size: '4.2MB',
      status: 'completed'
    },
    {
      id: '2',
      type: '독후감 데이터',
      date: '2024-01-10T14:20:00Z',
      size: '2.1MB',
      status: 'completed'
    }
  ])

  const handleExportToggle = (optionId: string) => {
    setSelectedExports(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId)
      } else {
        return [...prev, optionId]
      }
    })
  }

  const handleExport = async () => {
    if (selectedExports.length === 0) {
      toast.error('내보낼 데이터를 선택해주세요.')
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch(`/api/users/${userId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          types: selectedExports,
          format: 'json'
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `readzone-data-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast.success('데이터 내보내기가 완료되었습니다.')
        setSelectedExports([])
      } else {
        throw new Error('데이터 내보내기에 실패했습니다.')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('데이터 내보내기에 실패했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip') && !file.name.endsWith('.json')) {
      toast.error('ZIP 또는 JSON 파일만 가져올 수 있습니다.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/users/${userId}/import`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`${result.imported} 개의 항목이 성공적으로 가져와졌습니다.`)
        if (result.skipped > 0) {
          toast.info(`${result.skipped} 개의 중복 항목이 건너뛰어졌습니다.`)
        }
      } else {
        throw new Error(result.message || '데이터 가져오기에 실패했습니다.')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('데이터 가져오기에 실패했습니다.')
    }

    // 파일 입력 초기화
    event.target.value = ''
  }

  const calculateTotalSize = () => {
    return selectedExports.reduce((total, id) => {
      const option = exportOptions.find(opt => opt.id === id)
      if (!option) return total
      
      const sizeStr = option.size.replace('~', '').replace('MB', '').replace('KB', '')
      const size = parseFloat(sizeStr)
      const multiplier = option.size.includes('MB') ? 1 : 0.001
      
      return total + (size * multiplier)
    }, 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* 데이터 내보내기 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            데이터 내보내기
          </CardTitle>
          <CardDescription>
            ReadZone에서 작성한 데이터를 다운로드하여 백업하거나 다른 서비스로 이전할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 내보내기 옵션 선택 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">내보낼 데이터 선택</h4>
            <div className="space-y-3">
              {exportOptions.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all',
                    selectedExports.includes(option.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                  onClick={() => handleExportToggle(option.id)}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedExports.includes(option.id)}
                      onChange={() => handleExportToggle(option.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="text-gray-600 dark:text-gray-400">
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{option.size}</div>
                    <div className="text-xs text-gray-400">{option.format}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 선택된 내보내기 요약 */}
          {selectedExports.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">선택된 항목</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  총 크기: ~{calculateTotalSize().toFixed(1)}MB
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedExports.map((id) => {
                  const option = exportOptions.find(opt => opt.id === id)
                  return option ? (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {option.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* 내보내기 버튼 */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleExport}
              disabled={selectedExports.length === 0 || isExporting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isExporting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              {isExporting ? '내보내는 중...' : '선택한 데이터 내보내기'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setSelectedExports([])}
              disabled={selectedExports.length === 0}
            >
              선택 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 가져오기 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            데이터 가져오기
          </CardTitle>
          <CardDescription>
            이전에 내보낸 데이터나 다른 서비스의 데이터를 ReadZone으로 가져올 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              데이터 파일 선택
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              ZIP 또는 JSON 형식의 파일을 업로드하세요
            </div>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".zip,.json"
                onChange={handleImport}
                className="hidden"
              />
              <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                파일 선택
              </span>
            </label>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  데이터 가져오기 주의사항
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                  <li>• 중복된 데이터는 자동으로 건너뛰어집니다</li>
                  <li>• 가져오기 전에 현재 데이터를 백업하는 것을 권장합니다</li>
                  <li>• 대용량 파일은 처리 시간이 오래 걸릴 수 있습니다</li>
                  <li>• 지원되지 않는 형식의 데이터는 무시됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내보내기 기록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Archive className="w-5 h-5 mr-2" />
            내보내기 기록
          </CardTitle>
          <CardDescription>
            최근 데이터 내보내기 기록을 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exportHistory.length > 0 ? (
            <div className="space-y-3">
              {exportHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Archive className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-sm">{record.type}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(record.date)}</span>
                        <span>•</span>
                        <span>{record.size}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={record.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {record.status === 'completed' ? '완료' : '처리 중'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                아직 내보낸 데이터가 없습니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 저장 공간 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            저장 공간 사용량
          </CardTitle>
          <CardDescription>
            계정에서 사용 중인 저장 공간을 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium">텍스트 데이터</div>
              <div className="text-lg font-bold text-blue-600">2.3MB</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">독후감, 댓글 등</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Image className="w-6 h-6 text-green-600 mx-auto mb-2" aria-label="이미지 데이터" />
              <div className="text-sm font-medium">이미지</div>
              <div className="text-lg font-bold text-green-600">1.8MB</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">프로필 이미지 등</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Database className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium">전체 사용량</div>
              <div className="text-lg font-bold text-purple-600">4.1MB</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">한도: 100MB</div>
            </div>
          </div>

          {/* 사용량 진행률 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>저장 공간 사용률</span>
              <span>4.1MB / 100MB (4.1%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: '4.1%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 관리 안내 */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                데이터 관리 팁
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 정기적으로 데이터를 백업하여 안전하게 보관하세요</li>
                <li>• 다른 플랫폼으로 이전할 때는 전체 데이터를 내보내세요</li>
                <li>• 내보낸 파일은 JSON 형식으로 다른 서비스에서도 활용 가능합니다</li>
                <li>• 저장 공간이 부족할 때는 불필요한 이미지를 정리하세요</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}