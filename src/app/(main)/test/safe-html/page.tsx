'use client'

import { useState } from 'react'
import { SafeHtmlRenderer } from '@/components/review/safe-html-renderer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
// import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { XSS_TEST_CASES, NORMAL_USE_CASES } from '@/components/review/safe-html-renderer.test'

// 개발 환경에서만 접근 가능한 테스트 페이지
export default function SafeHtmlTestPage() {
  const [testContent, setTestContent] = useState('<p>여기에 테스트할 HTML 콘텐츠를 입력하세요.</p>')
  const [strictMode, setStrictMode] = useState(true)
  const [allowImages, setAllowImages] = useState(true)
  const [allowLinks, setAllowLinks] = useState(true)
  const [allowStyles, setAllowStyles] = useState(false)
  const [showSecurityInfo, setShowSecurityInfo] = useState(true)
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([])
  const [selectedTestCase, setSelectedTestCase] = useState<number | null>(null)

  // 프로덕션 환경에서는 접근 차단
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">접근 거부</h1>
          <p className="text-gray-600 mt-2">이 페이지는 개발 환경에서만 접근할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  const handleTestCaseSelect = (index: number, testCase: any) => {
    setTestContent(testCase.input)
    setStrictMode(testCase.strictMode ?? true)
    setSelectedTestCase(index)
  }

  const handleSecurityWarning = (warnings: string[]) => {
    setSecurityWarnings(warnings)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SafeHtmlRenderer 보안 테스트</h1>
        <p className="text-gray-600 dark:text-gray-400">
          HTML 콘텐츠의 보안 렌더링을 테스트하고 검증할 수 있습니다.
        </p>
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            ⚠️ 이 페이지는 개발 환경에서만 접근 가능합니다. 프로덕션에서는 자동으로 차단됩니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽 패널: 설정 및 입력 */}
        <div className="space-y-6">
          {/* 보안 설정 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">보안 설정</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="strict-mode">엄격 모드</Label>
                <Switch
                  id="strict-mode"
                  checked={strictMode}
                  onCheckedChange={setStrictMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-images">이미지 허용</Label>
                <Switch
                  id="allow-images"
                  checked={allowImages}
                  onCheckedChange={setAllowImages}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-links">링크 허용</Label>
                <Switch
                  id="allow-links"
                  checked={allowLinks}
                  onCheckedChange={setAllowLinks}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-styles">스타일 허용</Label>
                <Switch
                  id="allow-styles"
                  checked={allowStyles}
                  onCheckedChange={setAllowStyles}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-security-info">보안 정보 표시</Label>
                <Switch
                  id="show-security-info"
                  checked={showSecurityInfo}
                  onCheckedChange={setShowSecurityInfo}
                />
              </div>
            </div>
          </Card>

          {/* 테스트 케이스 선택 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">XSS 공격 테스트 케이스</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {XSS_TEST_CASES.map((testCase, index) => (
                <Button
                  key={index}
                  variant={selectedTestCase === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTestCaseSelect(index, testCase)}
                  className="w-full justify-start text-left h-auto py-2"
                >
                  <div>
                    <div className="font-medium">{testCase.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {testCase.expectedBehavior}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>

          {/* 정상 사용 케이스 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">정상 사용 케이스</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {NORMAL_USE_CASES.map((testCase, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestCaseSelect(index + 1000, testCase)}
                  className="w-full justify-start text-left h-auto py-2"
                >
                  <div>
                    <div className="font-medium">{testCase.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {testCase.expectedBehavior}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>

          {/* HTML 입력 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">HTML 콘텐츠 입력</h2>
            <div className="space-y-4">
              <Label htmlFor="test-content">테스트할 HTML 콘텐츠</Label>
              <textarea
                id="test-content"
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm bg-white dark:bg-gray-800"
              />
              <Button
                onClick={() => setTestContent('')}
                variant="outline"
                size="sm"
              >
                초기화
              </Button>
            </div>
          </Card>

          {/* 보안 경고 */}
          {securityWarnings.length > 0 && (
            <Card className="p-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <h2 className="text-xl font-semibold mb-4 text-orange-800 dark:text-orange-200">
                보안 경고 ({securityWarnings.length}개)
              </h2>
              <div className="space-y-2">
                {securityWarnings.map((warning, index) => (
                  <Badge key={index} variant="destructive" className="block text-left">
                    {warning}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* 오른쪽 패널: 렌더링 결과 */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">렌더링 결과</h2>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[300px]">
              <SafeHtmlRenderer
                content={testContent}
                strictMode={strictMode}
                allowImages={allowImages}
                allowLinks={allowLinks}
                allowStyles={allowStyles}
                showCopyButton={true}
                showSecurityInfo={showSecurityInfo}
                fallbackContent="테스트 콘텐츠를 안전하게 표시할 수 없습니다."
                onSecurityWarning={handleSecurityWarning}
                lazyRender={false}
              />
            </div>
          </Card>

          {/* 원본 HTML 표시 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">입력된 원본 HTML</h2>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-auto max-h-60">
              <pre>{testContent}</pre>
            </div>
          </Card>

          {/* 설정 요약 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">현재 설정</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span>엄격 모드:</span>
                <Badge variant={strictMode ? "default" : "secondary"}>
                  {strictMode ? "ON" : "OFF"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>이미지:</span>
                <Badge variant={allowImages ? "default" : "secondary"}>
                  {allowImages ? "허용" : "차단"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>링크:</span>
                <Badge variant={allowLinks ? "default" : "secondary"}>
                  {allowLinks ? "허용" : "차단"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>스타일:</span>
                <Badge variant={allowStyles ? "default" : "secondary"}>
                  {allowStyles ? "허용" : "차단"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}