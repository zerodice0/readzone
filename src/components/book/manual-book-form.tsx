'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, AlertCircle, CheckCircle2, Book, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { validateManualBookInput } from '@/lib/book-utils'
import { getBookApiClient } from '@/lib/api-client'
import type { ManualBookInput } from '@/types/book'
import type { KakaoBook } from '@/types/kakao'

// 폼 검증 스키마
const manualBookSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(500, '제목은 500자 이내여야 합니다'),
  authors: z.array(z.string().min(1, '저자명을 입력해주세요')).min(1, '최소 1명의 저자가 필요합니다'),
  publisher: z.string().optional(),
  translators: z.array(z.string()).optional(),
  genre: z.string().optional(),
  pageCount: z.number().min(1, '페이지 수는 1 이상이어야 합니다').max(10000, '페이지 수는 10000 이하여야 합니다').optional(),
  thumbnail: z.string().url('유효한 URL을 입력해주세요').optional().or(z.literal('')),
  description: z.string().max(2000, '설명은 2000자 이내여야 합니다').optional(),
  isbn: z.string().regex(/^[\d\-\s]{10,17}$/, '유효한 ISBN을 입력해주세요').optional().or(z.literal('')),
  isbn13: z.string().regex(/^[\d\-\s]{13,17}$/, '유효한 ISBN-13을 입력해주세요').optional().or(z.literal('')),
  datetime: z.string().optional(),
  price: z.number().min(0, '가격은 0 이상이어야 합니다').optional(),
  salePrice: z.number().min(0, '판매가는 0 이상이어야 합니다').optional()
})

type FormData = z.infer<typeof manualBookSchema>

interface ManualBookFormProps {
  onSubmit: (data: ManualBookInput) => void
  onCancel?: () => void
  initialData?: Partial<ManualBookInput>
  isLoading?: boolean
}

interface DuplicateBook {
  id: string
  title: string
  authors: string[]
  publisher?: string
  isbn?: string
  matchType: 'exact_isbn' | 'exact_match' | 'similar'
  similarity: number
}

export function ManualBookForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}: ManualBookFormProps) {
  const [duplicates, setDuplicates] = useState<DuplicateBook[]>([])
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(manualBookSchema),
    defaultValues: {
      title: initialData?.title || '',
      authors: initialData?.authors || [''],
      publisher: initialData?.publisher || '',
      translators: initialData?.translators || [],
      genre: initialData?.genre || '',
      pageCount: initialData?.pageCount || undefined,
      thumbnail: initialData?.thumbnail || '',
      description: initialData?.description || '',
      isbn: initialData?.isbn || '',
      isbn13: initialData?.isbn13 || '',
      datetime: initialData?.datetime || '',
      price: initialData?.price || undefined,
      salePrice: initialData?.salePrice || undefined
    },
    mode: 'onChange'
  })

  const { fields: authorFields, append: appendAuthor, remove: removeAuthor } = useFieldArray({
    control,
    name: 'authors'
  })

  const { fields: translatorFields, append: appendTranslator, remove: removeTranslator } = useFieldArray({
    control,
    name: 'translators'
  })

  const watchedTitle = watch('title')
  const watchedAuthors = watch('authors')
  const watchedIsbn = watch('isbn')

  // 중복 확인
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!watchedTitle.trim() || watchedAuthors.length === 0 || !watchedAuthors[0]?.trim()) {
        setDuplicates([])
        setShowDuplicateWarning(false)
        return
      }

      setCheckingDuplicates(true)
      
      try {
        const apiClient = getBookApiClient()
        const response = await fetch('/api/books/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: watchedTitle.trim(),
            authors: watchedAuthors.filter(a => a.trim()),
            isbn: watchedIsbn?.trim() || undefined
          })
        })

        const result = await response.json()
        
        if (result.success && result.data.hasDuplicates) {
          setDuplicates(result.data.duplicates)
          setShowDuplicateWarning(true)
        } else {
          setDuplicates([])
          setShowDuplicateWarning(false)
        }
      } catch (error) {
        console.error('Duplicate check error:', error)
        setDuplicates([])
        setShowDuplicateWarning(false)
      } finally {
        setCheckingDuplicates(false)
      }
    }

    const timeoutId = setTimeout(checkDuplicates, 500)
    return () => clearTimeout(timeoutId)
  }, [watchedTitle, watchedAuthors, watchedIsbn])

  const handleFormSubmit = (data: FormData) => {
    const cleanedData: ManualBookInput = {
      title: data.title.trim(),
      authors: data.authors.filter(a => a.trim()).map(a => a.trim()),
      publisher: data.publisher?.trim() || undefined,
      translators: data.translators?.filter(t => t.trim()).map(t => t.trim()) || [],
      genre: data.genre?.trim() || undefined,
      pageCount: data.pageCount || undefined,
      thumbnail: data.thumbnail?.trim() || undefined,
      description: data.description?.trim() || undefined,
      isbn: data.isbn?.trim() || undefined,
      isbn13: data.isbn13?.trim() || undefined,
      datetime: data.datetime?.trim() || undefined,
      price: data.price || undefined,
      salePrice: data.salePrice || undefined
    }

    // 클라이언트 측 검증
    const validation = validateManualBookInput(cleanedData)
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors)
      return
    }

    onSubmit(cleanedData)
  }

  const addAuthor = () => {
    appendAuthor('')
  }

  const addTranslator = () => {
    appendTranslator('')
  }

  const fillFromDuplicate = (book: DuplicateBook) => {
    setValue('title', book.title)
    setValue('authors', book.authors)
    setValue('publisher', book.publisher || '')
    setValue('isbn', book.isbn || '')
    trigger() // 검증 재실행
  }

  return (
    <div className="space-y-6">
      {/* 중복 경고 */}
      {showDuplicateWarning && duplicates.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 mb-2">
                유사한 도서가 발견되었습니다
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                이미 등록된 도서와 중복될 수 있습니다. 같은 도서인지 확인해주세요.
              </p>
              <div className="space-y-2">
                {duplicates.slice(0, 3).map((book, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{book.title}</p>
                      <p className="text-xs text-gray-600">
                        {book.authors.join(', ')} • {book.publisher}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          book.matchType === 'exact_isbn' ? 'bg-red-100 text-red-700' :
                          book.matchType === 'exact_match' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {book.matchType === 'exact_isbn' ? 'ISBN 일치' :
                           book.matchType === 'exact_match' ? '정확히 일치' :
                           '유사함'}
                        </span>
                        <span className="text-xs text-gray-500">
                          유사도: {book.similarity}%
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fillFromDuplicate(book)}
                      className="text-xs"
                    >
                      정보 가져오기
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5" />
            기본 정보
          </h3>
          
          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <Input
                {...register('title')}
                label="도서 제목"
                placeholder="도서 제목을 입력하세요"
                error={errors.title?.message}
                required
                disabled={isLoading}
              />
              {checkingDuplicates && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Search className="h-3 w-3 animate-spin" />
                  중복 도서 확인 중...
                </p>
              )}
            </div>

            {/* 저자 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                저자 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {authorFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...register(`authors.${index}` as const)}
                      placeholder={`저자 ${index + 1}`}
                      error={errors.authors?.[index]?.message}
                      disabled={isLoading}
                    />
                    {authorFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAuthor(index)}
                        disabled={isLoading}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAuthor}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  저자 추가
                </Button>
              </div>
              {errors.authors?.root && (
                <p className="text-sm text-red-600 mt-1">{errors.authors.root.message}</p>
              )}
            </div>

            {/* 출판사 */}
            <Input
              {...register('publisher')}
              label="출판사"
              placeholder="출판사를 입력하세요"
              error={errors.publisher?.message}
              disabled={isLoading}
            />

            {/* 번역자 */}
            <div>
              <label className="text-sm font-medium mb-2 block">번역자</label>
              <div className="space-y-2">
                {translatorFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...register(`translators.${index}` as const)}
                      placeholder={`번역자 ${index + 1}`}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTranslator(index)}
                      disabled={isLoading}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTranslator}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  번역자 추가
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 상세 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">상세 정보</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 장르 */}
            <Input
              {...register('genre')}
              label="장르"
              placeholder="예: 소설, 에세이, 자기계발"
              error={errors.genre?.message}
              disabled={isLoading}
            />

            {/* 페이지 수 */}
            <Input
              {...register('pageCount', { valueAsNumber: true })}
              type="number"
              label="페이지 수"
              placeholder="페이지 수"
              error={errors.pageCount?.message}
              disabled={isLoading}
            />

            {/* ISBN */}
            <Input
              {...register('isbn')}
              label="ISBN"
              placeholder="978-89-1234-567-0"
              error={errors.isbn?.message}
              disabled={isLoading}
            />

            {/* ISBN-13 */}
            <Input
              {...register('isbn13')}
              label="ISBN-13"
              placeholder="9788912345670"
              error={errors.isbn13?.message}
              disabled={isLoading}
            />

            {/* 출간일 */}
            <Input
              {...register('datetime')}
              type="date"
              label="출간일"
              error={errors.datetime?.message}
              disabled={isLoading}
            />

            {/* 정가 */}
            <Input
              {...register('price', { valueAsNumber: true })}
              type="number"
              label="정가 (원)"
              placeholder="15000"
              error={errors.price?.message}
              disabled={isLoading}
            />

            {/* 할인가 */}
            <Input
              {...register('salePrice', { valueAsNumber: true })}
              type="number"
              label="할인가 (원)"
              placeholder="13500"
              error={errors.salePrice?.message}
              disabled={isLoading}
            />

            {/* 썸네일 URL */}
            <Input
              {...register('thumbnail')}
              label="표지 이미지 URL"
              placeholder="https://example.com/cover.jpg"
              error={errors.thumbnail?.message}
              disabled={isLoading}
              className="md:col-span-2"
            />
          </div>

          {/* 설명 */}
          <div className="mt-4">
            <label className="text-sm font-medium mb-2 block">도서 소개</label>
            <textarea
              {...register('description')}
              placeholder="도서에 대한 간단한 소개를 입력하세요"
              className="w-full h-32 px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                등록 중...
              </div>
            ) : (
              '도서 등록'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}