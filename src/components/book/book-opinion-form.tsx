'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ThumbsUp, ThumbsDown, MessageSquare, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const opinionSchema = z.object({
  content: z.string()
    .min(1, '의견을 입력해주세요')
    .max(280, '의견은 280자 이내로 작성해주세요'),
  isRecommended: z.boolean()
})

type FormData = z.infer<typeof opinionSchema>

interface BookOpinionFormProps {
  bookId: string
  onSubmit: () => void
  onCancel: () => void
  initialData?: {
    content: string
    isRecommended: boolean
  }
}

export function BookOpinionForm({ 
  bookId, 
  onSubmit, 
  onCancel, 
  initialData 
}: BookOpinionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    clearErrors
  } = useForm<FormData>({
    resolver: zodResolver(opinionSchema),
    defaultValues: {
      content: initialData?.content || '',
      isRecommended: initialData?.isRecommended ?? true
    }
  })

  const watchedContent = watch('content')
  const watchedRecommendation = watch('isRecommended')
  const remainingChars = 280 - (watchedContent?.length || 0)

  // 실시간 검증 피드백
  const getCharCountColor = () => {
    if (remainingChars < 0) return 'text-red-600'
    if (remainingChars < 50) return 'text-orange-600'
    return 'text-gray-500'
  }

  const getContentStatus = () => {
    if (!watchedContent?.trim()) return null
    if (watchedContent.length < 10) return { type: 'warning', message: '너무 짧은 의견입니다' }
    if (remainingChars < 0) return { type: 'error', message: '글자 수 제한을 초과했습니다' }
    if (watchedContent.length >= 50) return { type: 'success', message: '충분한 길이의 의견입니다' }
    return null
  }

  const contentStatus = getContentStatus()

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/books/${bookId}/opinions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        onSubmit()
      } else {
        toast.error(result.error?.message || '의견 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Opinion submit error:', error)
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {initialData ? '의견 수정' : '의견 작성'}
            </h3>
            <p className="text-sm text-gray-600">
              이 도서에 대한 솔직한 생각을 공유해주세요
            </p>
          </div>
        </div>
        
        {!showPreview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(true)}
            disabled={!watchedContent?.trim()}
            className="text-primary-600 hover:text-primary-700"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            미리보기
          </Button>
        )}
      </div>

      {showPreview ? (
        // 미리보기 모드
        <div className="space-y-4">
          <div className="bg-white border-2 border-primary-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-gray-900">미리보기</span>
              <Badge
                variant={watchedRecommendation ? "default" : "destructive"}
                className={cn(
                  'text-xs',
                  watchedRecommendation 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                )}
              >
                {watchedRecommendation ? (
                  <>
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    추천
                  </>
                ) : (
                  <>
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    비추천
                  </>
                )}
              </Badge>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {watchedContent || '의견을 입력해주세요...'}
            </p>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
            >
              편집으로 돌아가기
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                onClick={handleSubmit(handleFormSubmit)}
                disabled={!isValid || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {initialData ? '수정 중...' : '작성 중...'}
                  </div>
                ) : (
                  initialData ? '의견 수정' : '의견 작성'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // 편집 모드
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* 추천/비추천 선택 */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              이 도서를 추천하시나요? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setValue('isRecommended', true)}
                className={cn(
                  'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 flex-1 justify-center',
                  'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20',
                  watchedRecommendation
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
                disabled={isSubmitting}
              >
                <ThumbsUp className="h-5 w-5" />
                <span className="font-medium">추천</span>
                {watchedRecommendation && <CheckCircle className="h-4 w-4" />}
              </button>
              
              <button
                type="button"
                onClick={() => setValue('isRecommended', false)}
                className={cn(
                  'flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 flex-1 justify-center',
                  'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20',
                  !watchedRecommendation
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
                disabled={isSubmitting}
              >
                <ThumbsDown className="h-5 w-5" />
                <span className="font-medium">비추천</span>
                {!watchedRecommendation && <CheckCircle className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* 의견 내용 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">
                의견 <span className="text-red-500">*</span>
              </label>
              {contentStatus && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  contentStatus.type === 'success' && 'text-green-600',
                  contentStatus.type === 'warning' && 'text-orange-600',
                  contentStatus.type === 'error' && 'text-red-600'
                )}>
                  {contentStatus.type === 'success' && <CheckCircle className="w-3 h-3" />}
                  {contentStatus.type === 'warning' && <AlertCircle className="w-3 h-3" />}
                  {contentStatus.type === 'error' && <AlertCircle className="w-3 h-3" />}
                  {contentStatus.message}
                </div>
              )}
            </div>
            
            <div className="relative">
              <textarea
                {...register('content')}
                placeholder="이 도서에 대한 솔직한 의견을 280자 이내로 작성해주세요.&#10;&#10;예: 캐릭터의 성장이 인상적이었고, 특히 중반부의 갈등 해결 과정이 현실적으로 그려져 있어 몰입할 수 있었습니다."
                className={cn(
                  'w-full h-40 px-4 py-3 border-2 rounded-xl resize-none transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20',
                  'placeholder:text-gray-400',
                  errors.content 
                    ? 'border-red-500 focus:border-red-500' 
                    : remainingChars < 0
                    ? 'border-orange-500 focus:border-orange-500'
                    : 'border-gray-200 focus:border-primary-500'
                )}
                disabled={isSubmitting}
              />
              
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <div className={cn('text-xs font-medium', getCharCountColor())}>
                  {remainingChars}자 남음
                </div>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full transition-all duration-300 rounded-full',
                      remainingChars < 0 ? 'bg-red-500' : 
                      remainingChars < 50 ? 'bg-orange-500' : 'bg-green-500'
                    )}
                    style={{ 
                      width: `${Math.min(100, Math.max(0, ((280 - remainingChars) / 280) * 100))}%` 
                    }}
                  />
                </div>
              </div>
            </div>
            
            {errors.content && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.content.message}
              </p>
            )}
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-blue-800">
                <p className="font-medium mb-1">의견 작성 가이드</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• 한 도서당 하나의 의견만 작성할 수 있습니다</li>
                  <li>• 기존 의견이 있다면 새로운 의견으로 업데이트됩니다</li>
                  <li>• 다른 사용자에게 도움이 되는 건설적인 의견을 작성해주세요</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                'min-w-[120px] shadow-md transition-all duration-200',
                isValid && !isSubmitting && 'hover:shadow-lg'
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {initialData ? '수정 중...' : '작성 중...'}
                </div>
              ) : (
                initialData ? '의견 수정' : '의견 작성'
              )}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}