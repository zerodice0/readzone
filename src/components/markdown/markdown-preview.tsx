'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MarkdownRenderer, getMarkdownStats, validateMarkdownContent } from './markdown-renderer'
import { TableOfContents } from './markdown-toc'
import { 
  Eye, 
  Code2, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Type,
  Hash,
  Image,
  Link,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MarkdownPreviewProps {
  content: string
  className?: string
  showTabs?: boolean
  showStats?: boolean
  showValidation?: boolean
  allowImages?: boolean
  allowLinks?: boolean
  allowTables?: boolean
  strictMode?: boolean
}

export function MarkdownPreview({
  content,
  className = '',
  showTabs = true,
  showStats = true,
  showValidation = true,
  allowImages = true,
  allowLinks = true,
  allowTables = true,
  strictMode = false
}: MarkdownPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'stats'>('preview')

  // Compute stats and validation
  const stats = useMemo(() => getMarkdownStats(content), [content])
  const validation = useMemo(() => validateMarkdownContent(content), [content])

  const renderPreview = () => (
    <div className="space-y-6">
      {/* Validation alerts */}
      {showValidation && !validation.isValid && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-red-800 dark:text-red-300">
              유효성 검사 오류
            </h4>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success message */}
      {showValidation && validation.isValid && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              콘텐츠가 유효합니다
            </span>
          </div>
        </div>
      )}

      {/* Table of Contents */}
      <TableOfContents content={content} />

      {/* Rendered Content */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <MarkdownRenderer
          content={content}
          allowImages={allowImages}
          allowLinks={allowLinks}
          allowTables={allowTables}
          strictMode={strictMode}
          enableHeadingNavigation={false} // TOC handles this
          showCopyButton={true}
          className="p-6"
        />
      </div>
    </div>
  )

  const renderSource = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            마크다운 소스
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(content)}
            className="h-8"
          >
            복사
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 overflow-auto max-h-96">
          {content || '내용이 없습니다.'}
        </pre>
      </div>
    </div>
  )

  const renderStats = () => {
    if (!stats) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          통계를 생성할 수 없습니다.
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Type className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  단어
                </p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {stats.words.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  문자
                </p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {stats.characters.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  제목
                </p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {stats.headings}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  읽기 시간
                </p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {stats.readingTimeMinutes}분
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
            상세 통계
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">기본 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">총 라인 수:</span>
                  <span className="font-medium">{stats.lines.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">공백 제외 문자:</span>
                  <span className="font-medium">{stats.charactersNoSpaces.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">평균 단어/라인:</span>
                  <span className="font-medium">
                    {stats.lines > 0 ? Math.round(stats.words / stats.lines) : 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">마크다운 요소</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Link className="h-3 w-3" />
                    링크:
                  </span>
                  <span className="font-medium">{stats.links}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Image className="h-3 w-3" />
                    이미지:
                  </span>
                  <span className="font-medium">{stats.images}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Code2 className="h-3 w-3" />
                    코드 블록:
                  </span>
                  <span className="font-medium">{stats.codeBlocks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">리스트 항목:</span>
                  <span className="font-medium">{stats.lists}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Reading Level */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">
            가독성 정보
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              예상 읽기 시간: <strong>{stats.readingTimeMinutes}분</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={stats.words < 500 ? "default" : "secondary"}>
              {stats.words < 500 ? "짧은 글" : stats.words < 1500 ? "중간 길이" : "긴 글"}
            </Badge>
            <Badge variant={stats.headings > 0 ? "default" : "secondary"}>
              {stats.headings > 0 ? "구조화됨" : "단순 구조"}
            </Badge>
            <Badge variant={stats.links > 0 || stats.images > 0 ? "default" : "secondary"}>
              {stats.links > 0 || stats.images > 0 ? "풍부한 콘텐츠" : "텍스트 중심"}
            </Badge>
          </div>
        </Card>
      </div>
    )
  }

  if (!showTabs) {
    return (
      <div className={cn('space-y-4', className)}>
        {renderPreview()}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Simple tab implementation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            <Eye className="h-4 w-4" />
            미리보기
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={cn(
              'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'source'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            <Code2 className="h-4 w-4" />
            소스
          </button>
          {showStats && (
            <button
              onClick={() => setActiveTab('stats')}
              className={cn(
                'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              통계
            </button>
          )}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'preview' && renderPreview()}
        {activeTab === 'source' && renderSource()}
        {showStats && activeTab === 'stats' && renderStats()}
      </div>
    </div>
  )
}