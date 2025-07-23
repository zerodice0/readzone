'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, BookPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ManualBookForm } from '@/components/book/manual-book-form'
import type { ManualBookInput } from '@/types/book'

export default function ManualBookPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
    bookId?: string
    similarBooks?: any[]
  } | null>(null)

  const handleSubmit = async (data: ManualBookInput) => {
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const response = await fetch('/api/books/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitResult({
          success: true,
          message: result.data.message,
          bookId: result.data.book.id,
          similarBooks: result.data.similarBooks
        })
        
        toast.success('도서가 성공적으로 등록되었습니다!')
        
        // 3초 후 자동으로 검색 페이지로 이동
        setTimeout(() => {
          router.push('/search')
        }, 3000)
      } else {
        setSubmitResult({
          success: false,
          message: result.error?.message || '도서 등록에 실패했습니다.'
        })
        
        toast.error(result.error?.message || '도서 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setSubmitResult({
        success: false,
        message: '네트워크 오류가 발생했습니다.'
      })
      
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const handleGoBack = () => {
    router.push('/search')
  }

  // 성공 화면
  if (submitResult?.success) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">
            도서 등록 완료!
          </h1>
          <p className="text-gray-600 mb-6">
            {submitResult.message}
          </p>
          
          {submitResult.similarBooks && submitResult.similarBooks.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-yellow-800 mb-2">
                유사한 도서가 발견되었습니다
              </h3>
              <div className="space-y-2">
                {submitResult.similarBooks.slice(0, 3).map((book: any, index: number) => (
                  <div key={index} className="text-sm text-yellow-700">
                    <span className="font-medium">{book.title}</span>
                    <span className="text-yellow-600"> • {book.authors?.join?.(', ')}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-yellow-600 mt-2">
                관리자가 검토 후 중복 여부를 확인합니다.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={handleGoBack} className="min-w-[120px]">
              검색으로 돌아가기
            </Button>
            <Button
              variant="outline"
              onClick={() => setSubmitResult(null)}
            >
              다른 도서 등록
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            3초 후 자동으로 검색 페이지로 이동합니다...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 -ml-2"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <BookPlus className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold">도서 수동 등록</h1>
        </div>
        <p className="text-gray-600">
          검색되지 않는 도서를 직접 등록할 수 있습니다. 등록된 도서는 관리자 검토 후 승인됩니다.
        </p>
      </div>

      {/* 안내사항 */}
      <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <h3 className="font-medium mb-1">도서 등록 안내</h3>
            <ul className="space-y-1 text-xs">
              <li>• 제목과 저자는 필수 입력 항목입니다</li>
              <li>• 입력된 정보는 중복 도서 확인을 거쳐 등록됩니다</li>
              <li>• 관리자 검토 후 최종 승인되면 서비스에 반영됩니다</li>
              <li>• 허위 정보나 저작권 침해 콘텐츠는 삭제될 수 있습니다</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 에러 메시지 */}
      {submitResult && !submitResult.success && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <h3 className="font-medium">등록 실패</h3>
              <p>{submitResult.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 폼 */}
      <ManualBookForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />
    </div>
  )
}