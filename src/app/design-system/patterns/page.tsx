'use client'

import { useState } from 'react'
import { DemoContainer } from '@/components/design-system/demo-container'
import { CodePreview } from '@/components/design-system/code-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PatternsPage(): JSX.Element {
  const [showToast, setShowToast] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleShowToast = (): void => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    // 간단한 검증 예시
    const errors: Record<string, string> = {}
    const form = e.target as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value

    if (!email) {
      errors.email = '이메일을 입력해주세요'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다'
    }

    setFormErrors(errors)
  }

  const loadingStateCode = `// 로딩 상태 패턴
// 1. 스켈레톤 로더
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// 2. 스피너
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
</div>

// 3. 진행 표시
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>업로드 중...</span>
    <span>45%</span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
  </div>
</div>`

  const errorHandlingCode = `// 에러 처리 패턴
// 1. 인라인 에러
<div className="space-y-2">
  <Input 
    error 
    placeholder="이메일" 
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" className="text-sm text-red-500">
    올바른 이메일 형식이 아닙니다
  </p>
</div>

// 2. 에러 페이지
<div className="text-center py-12">
  <h2 className="text-2xl font-bold mb-2">문제가 발생했습니다</h2>
  <p className="text-gray-600 mb-4">요청을 처리하는 중 오류가 발생했습니다.</p>
  <Button onClick={retry}>다시 시도</Button>
</div>

// 3. 토스트 에러
<Toast variant="error">
  저장하지 못했습니다. 다시 시도해주세요.
</Toast>`

  const formValidationCode = `// 폼 검증 패턴
const [errors, setErrors] = useState({})

const validateForm = (data) => {
  const errors = {}
  
  // 이메일 검증
  if (!data.email) {
    errors.email = '필수 입력 항목입니다'
  } else if (!/\\S+@\\S+\\.\\S+/.test(data.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다'
  }
  
  // 비밀번호 검증
  if (!data.password) {
    errors.password = '필수 입력 항목입니다'
  } else if (data.password.length < 8) {
    errors.password = '8자 이상 입력해주세요'
  }
  
  return errors
}

// 실시간 검증
<Input
  onChange={(e) => {
    if (e.target.value && !/\\S+@\\S+\\.\\S+/.test(e.target.value)) {
      setErrors({ ...errors, email: '올바른 이메일 형식이 아닙니다' })
    } else {
      setErrors({ ...errors, email: undefined })
    }
  }}
/>`

  const modalPatternCode = `// 모달 패턴
const [isOpen, setIsOpen] = useState(false)

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>모달 열기</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>모달 제목</DialogTitle>
      <DialogDescription>
        모달 설명 텍스트
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* 모달 콘텐츠 */}
    </div>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        취소
      </Button>
      <Button onClick={handleConfirm}>
        확인
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`

  const toastPatternCode = `// 토스트 메시지 패턴
// 1. 성공 토스트
toast.success('저장되었습니다!')

// 2. 에러 토스트
toast.error('오류가 발생했습니다.')

// 3. 정보 토스트
toast.info('새로운 업데이트가 있습니다.')

// 4. 커스텀 토스트
toast.custom((t) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
    <div className="flex items-center space-x-3">
      <CheckIcon className="h-5 w-5 text-green-500" />
      <div>
        <p className="font-medium">업로드 완료</p>
        <p className="text-sm text-gray-500">파일이 성공적으로 업로드되었습니다.</p>
      </div>
    </div>
  </div>
))`

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          인터랙션 패턴
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          ReadZone에서 사용하는 일관된 인터랙션 패턴과 사용자 피드백 방식입니다.
          모든 패턴은 접근성과 사용성을 고려하여 설계되었습니다.
        </p>
      </div>

      {/* Loading States */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          로딩 상태
        </h3>
        
        <DemoContainer title="스켈레톤 로더">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </DemoContainer>

        <DemoContainer title="스피너">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DemoContainer>

        <DemoContainer title="진행 표시">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>파일 업로드 중...</span>
              <span>45%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '45%' }}></div>
            </div>
          </div>
        </DemoContainer>

        <CodePreview code={loadingStateCode} language="tsx" />
      </div>

      {/* Error Handling */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          에러 처리
        </h3>

        <DemoContainer title="인라인 에러">
          <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Input 
                name="email"
                placeholder="이메일을 입력하세요" 
                error={!!formErrors.email}
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? "email-error" : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="text-sm text-red-500">
                  {formErrors.email}
                </p>
              )}
            </div>
            <Button type="submit">제출</Button>
          </form>
        </DemoContainer>

        <DemoContainer title="에러 페이지">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-bold mb-2">페이지를 찾을 수 없습니다</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              요청하신 페이지가 존재하지 않거나 이동되었습니다.
            </p>
            <Button>홈으로 돌아가기</Button>
          </div>
        </DemoContainer>

        <CodePreview code={errorHandlingCode} language="tsx" />
      </div>

      {/* Form Validation */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          폼 검증
        </h3>

        <DemoContainer title="실시간 검증">
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">이메일</label>
              <Input placeholder="example@email.com" />
              <p className="text-xs text-gray-500">이메일 형식으로 입력해주세요</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">비밀번호</label>
              <Input type="password" placeholder="8자 이상 입력" />
              <div className="text-xs space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-500">8자 이상</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span className="text-gray-500">특수문자 포함</span>
                </div>
              </div>
            </div>
          </div>
        </DemoContainer>

        <CodePreview code={formValidationCode} language="tsx" />
      </div>

      {/* Modal Pattern */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          모달
        </h3>

        <DemoContainer title="기본 모달">
          <Button onClick={() => setShowModal(true)}>모달 열기</Button>
          
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-2">모달 제목</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  모달 콘텐츠가 여기에 표시됩니다. 사용자의 주의가 필요한 중요한 정보나 
                  확인이 필요한 액션을 표시할 때 사용합니다.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setShowModal(false)}>
                    취소
                  </Button>
                  <Button onClick={() => setShowModal(false)}>
                    확인
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DemoContainer>

        <CodePreview code={modalPatternCode} language="tsx" />
      </div>

      {/* Toast Messages */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          토스트 메시지
        </h3>

        <DemoContainer title="토스트 유형">
          <div className="space-x-2">
            <Button onClick={handleShowToast}>토스트 표시</Button>
          </div>
          
          {showToast && (
            <div className="fixed bottom-4 right-4 z-50">
              <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span>성공적으로 저장되었습니다!</span>
              </div>
            </div>
          )}
        </DemoContainer>

        <CodePreview code={toastPatternCode} language="tsx" />
      </div>

      {/* Best Practices */}
      <DemoContainer
        title="인터랙션 디자인 원칙"
        description="사용자 경험 향상을 위한 가이드라인"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              즉각적인 피드백
            </h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• 모든 사용자 액션에 시각적 반응 제공</li>
              <li>• 로딩 상태 명확히 표시</li>
              <li>• 성공/실패 즉시 알림</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              명확한 안내
            </h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• 에러 메시지는 구체적으로</li>
              <li>• 해결 방법 함께 제시</li>
              <li>• 다음 단계 명확히 안내</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              예측 가능성
            </h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• 일관된 인터랙션 패턴 사용</li>
              <li>• 파괴적 액션 전 확인 요청</li>
              <li>• 취소/되돌리기 옵션 제공</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              접근성
            </h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• 키보드 탐색 지원</li>
              <li>• 스크린 리더 호환</li>
              <li>• 충분한 색상 대비</li>
            </ul>
          </div>
        </div>
      </DemoContainer>
    </div>
  )
}