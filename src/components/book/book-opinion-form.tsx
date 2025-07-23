'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'react-hot-toast'

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
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
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold">
          {initialData ? '의견 수정' : '의견 작성'}
        </h3>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* 추천/비추천 선택 */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            이 도서를 추천하시나요? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setValue('isRecommended', true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                watchedRecommendation
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <ThumbsUp className="h-5 w-5" />
              <span className="font-medium">추천</span>
            </button>
            
            <button
              type="button"
              onClick={() => setValue('isRecommended', false)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                !watchedRecommendation
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <ThumbsDown className="h-5 w-5" />
              <span className="font-medium">비추천</span>
            </button>
          </div>
        </div>

        {/* 의견 내용 */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            의견 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              {...register('content')}
              placeholder="이 도서에 대한 솔직한 의견을 280자 이내로 작성해주세요."
              className={`w-full h-32 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.content ? 'border-red-500' : 'border-gray-200'
              }`}
              disabled={isSubmitting}
            />
            <div className={`absolute bottom-2 right-2 text-xs ${
              remainingChars < 0 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {remainingChars}자 남음
            </div>
          </div>
          {errors.content && (
            <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <p>• 한 도서당 하나의 의견만 작성할 수 있습니다</p>
          <p>• 기존 의견이 있다면 새로운 의견으로 업데이트됩니다</p>
          <p>• 다른 사용자에게 도움이 되는 건설적인 의견을 작성해주세요</p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-3 pt-2">
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
            className="min-w-[100px]"
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
    </Card>
  )
}