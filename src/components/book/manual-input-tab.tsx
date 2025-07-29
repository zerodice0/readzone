'use client'

import { useState, useCallback, useEffect, memo } from 'react'
import { Edit, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import type { SelectedBook } from '@/types/book-selector'

interface ManualBook {
  title: string
  authors: string
  publisher: string
  genre: string
}

interface ValidationErrors {
  title?: string
  authors?: string
  publisher?: string
  genre?: string
}

interface ManualInputTabProps {
  onSelect: (book: SelectedBook) => void
  isActive: boolean
}

export const ManualInputTab = memo(function ManualInputTab({ 
  onSelect, 
  isActive 
}: ManualInputTabProps) {
  const [form, setForm] = useState<ManualBook>({
    title: '',
    authors: '',
    publisher: '',
    genre: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null)

  // 실시간 유효성 검증
  const validateField = useCallback((field: keyof ManualBook, value: string) => {
    const errors: ValidationErrors = {}
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          errors.title = '도서 제목을 입력해주세요.'
        } else if (value.trim().length > 200) {
          errors.title = '도서 제목은 200자 이하로 입력해주세요.'
        }
        break
        
      case 'authors':
        if (!value.trim()) {
          errors.authors = '저자를 입력해주세요.'
        } else if (value.trim().length > 100) {
          errors.authors = '저자는 100자 이하로 입력해주세요.'
        }
        break
        
      case 'publisher':
        if (value.trim().length > 100) {
          errors.publisher = '출판사는 100자 이하로 입력해주세요.'
        }
        break
        
      case 'genre':
        if (value.trim().length > 50) {
          errors.genre = '장르는 50자 이하로 입력해주세요.'
        }
        break
    }
    
    return errors
  }, [])

  // 폼 입력 처리
  const handleInputChange = useCallback((field: keyof ManualBook, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    
    // 실시간 유효성 검증
    const fieldErrors = validateField(field, value)
    setValidationErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field]
    }))
    
    // 중복 경고 초기화
    if (field === 'title' || field === 'authors') {
      setDuplicateWarning(null)
    }
  }, [validateField])

  // 전체 폼 유효성 검증
  const validateAllFields = useCallback(() => {
    const errors: ValidationErrors = {}
    
    Object.keys(form).forEach(key => {
      const field = key as keyof ManualBook
      const fieldErrors = validateField(field, form[field])
      if (fieldErrors[field]) {
        errors[field] = fieldErrors[field]
      }
    })
    
    return errors
  }, [form, validateField])

  // 중복 도서 확인
  const checkDuplicate = useCallback(async () => {
    if (!form.title.trim() || !form.authors.trim()) return false
    
    try {
      const authors = form.authors.split(',').map(author => author.trim()).filter(Boolean)
      const response = await fetch('/api/books/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          authors
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.data?.exists) {
        setDuplicateWarning(result.data.book)
        return true
      }
      
      return false
    } catch (error) {
      console.error('중복 확인 실패:', error)
      return false
    }
  }, [form.title, form.authors])

  // 폼 제출
  const handleSubmit = useCallback(async () => {
    // 유효성 검증
    const errors = validateAllFields()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error('입력 정보를 확인해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 중복 확인
      const isDuplicate = await checkDuplicate()
      if (isDuplicate && !duplicateWarning) {
        setIsSubmitting(false)
        return // 중복 경고 표시
      }

      // 도서 등록
      const authors = form.authors.split(',').map(author => author.trim()).filter(Boolean)
      const response = await fetch('/api/books/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          authors,
          publisher: form.publisher.trim() || undefined,
          genre: form.genre.trim() || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        onSelect(result.data)
        
        if (result.data.alreadyExists) {
          toast.success('이미 등록된 도서를 선택했습니다.')
        } else {
          toast.success('새 도서가 등록되었습니다.')
        }
        
        // 폼 초기화
        setForm({ title: '', authors: '', publisher: '', genre: '' })
        setValidationErrors({})
        setDuplicateWarning(null)
      } else {
        throw new Error(result.error?.message || '도서 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('수동 도서 등록 실패:', error)
      toast.error(error instanceof Error ? error.message : '도서 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }, [form, validateAllFields, checkDuplicate, duplicateWarning, onSelect])

  // 탭이 비활성화되면 폼 초기화
  useEffect(() => {
    if (!isActive) {
      setForm({ title: '', authors: '', publisher: '', genre: '' })
      setValidationErrors({})
      setDuplicateWarning(null)
    }
  }, [isActive])

  if (!isActive) {
    return null
  }

  const isFormValid = form.title.trim() && form.authors.trim() && Object.keys(validationErrors).length === 0

  return (
    <div 
      role="tabpanel" 
      id="manual-panel" 
      aria-labelledby="manual-tab"
      className="space-y-4"
    >
      {/* 직접 입력 폼 */}
      <Card className="p-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-2 mb-4">
          <Edit className="h-5 w-5 text-orange-500" />
          <h3 className="font-medium text-orange-900 dark:text-orange-100">
            도서 직접 입력
          </h3>
        </div>
        
        <div className="space-y-4">
          {/* 제목 입력 */}
          <div>
            <Input
              placeholder="도서 제목 *"
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              aria-label="도서 제목 (필수)"
              aria-required="true"
              aria-invalid={!!validationErrors.title}
              aria-describedby={validationErrors.title ? "title-error" : undefined}
              autoComplete="off"
              maxLength={200}
            />
            {validationErrors.title && (
              <p id="title-error" className="text-xs text-red-500 mt-1" role="alert">
                {validationErrors.title}
              </p>
            )}
          </div>

          {/* 저자 입력 */}
          <div>
            <Input
              placeholder="저자 * (여러 명인 경우 쉼표로 구분)"
              value={form.authors}
              onChange={(e) => handleInputChange('authors', e.target.value)}
              aria-label="저자 (필수, 여러 명인 경우 쉼표로 구분)"
              aria-required="true"
              aria-invalid={!!validationErrors.authors}
              aria-describedby={validationErrors.authors ? "authors-error" : undefined}
              autoComplete="off"
              maxLength={100}
            />
            {validationErrors.authors && (
              <p id="authors-error" className="text-xs text-red-500 mt-1" role="alert">
                {validationErrors.authors}
              </p>
            )}
          </div>

          {/* 출판사, 장르 입력 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                placeholder="출판사"
                value={form.publisher}
                onChange={(e) => handleInputChange('publisher', e.target.value)}
                aria-label="출판사 (선택사항)"
                aria-invalid={!!validationErrors.publisher}
                aria-describedby={validationErrors.publisher ? "publisher-error" : undefined}
                autoComplete="off"
                maxLength={100}
              />
              {validationErrors.publisher && (
                <p id="publisher-error" className="text-xs text-red-500 mt-1" role="alert">
                  {validationErrors.publisher}
                </p>
              )}
            </div>
            <div>
              <Input
                placeholder="장르"
                value={form.genre}
                onChange={(e) => handleInputChange('genre', e.target.value)}
                aria-label="장르 (선택사항)"
                aria-invalid={!!validationErrors.genre}
                aria-describedby={validationErrors.genre ? "genre-error" : undefined}
                autoComplete="off"
                maxLength={50}
              />
              {validationErrors.genre && (
                <p id="genre-error" className="text-xs text-red-500 mt-1" role="alert">
                  {validationErrors.genre}
                </p>
              )}
            </div>
          </div>

          {/* 중복 경고 */}
          {duplicateWarning && (
            <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    유사한 도서가 이미 존재합니다
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    &ldquo;{duplicateWarning.title}&rdquo; - {JSON.parse(duplicateWarning.authors).join(', ')}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDuplicateWarning(null)}
                      className="text-xs"
                    >
                      수정하기
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="text-xs"
                    >
                      계속 진행
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 제출 버튼 */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  등록 중...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  도서 등록
                </>
              )}
            </Button>
          </div>

          {/* 안내 텍스트 */}
          <div className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
            <p>• 제목과 저자는 필수 입력 항목입니다.</p>
            <p>• 여러 저자는 쉼표로 구분해주세요. (예: 홍길동, 김철수)</p>
            <p>• 등록된 도서는 커뮤니티에서 검색할 수 있습니다.</p>
          </div>
        </div>
      </Card>

      {/* 안내 메시지 */}
      {!form.title && !form.authors && (
        <Card className="p-6 text-center">
          <Edit className="h-8 w-8 text-gray-400 mx-auto mb-3" aria-hidden="true" />
          <h3 className="font-medium mb-2">직접 입력으로 도서 등록</h3>
          <p className="text-sm text-gray-500 mb-4">
            검색되지 않는 도서를 직접 입력하여 등록할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="text-xs">
              제목과 저자는 필수입니다
            </Badge>
            <Badge variant="outline" className="text-xs">
              커뮤니티에 자동 추가됩니다
            </Badge>
          </div>
        </Card>
      )}
    </div>
  )
})