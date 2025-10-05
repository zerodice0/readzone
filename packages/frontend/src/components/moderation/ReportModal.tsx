import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Ban, Heart, MessageSquare, Shield } from 'lucide-react'
import { createReport, type CreateReportDto } from '@/lib/api/moderation'
import { useToast } from '@/hooks/use-toast'
import type { ReportTargetType, ReportType } from '@/types/moderation'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: string
  reportedUserId: string
  targetContent?: string
  onSuccess?: () => void
}

const REPORT_CATEGORIES = [
  {
    id: 'SPAM' as ReportType,
    name: '스팸',
    description: '반복적이고 원치 않는 콘텐츠',
    icon: Ban,
    color: 'text-orange-600',
  },
  {
    id: 'HARASSMENT' as ReportType,
    name: '괴롭힘',
    description: '특정인을 대상으로 한 괴롭힘이나 협박',
    icon: AlertTriangle,
    color: 'text-red-600',
  },
  {
    id: 'HATE_SPEECH' as ReportType,
    name: '혐오 표현',
    description: '특정 집단에 대한 차별이나 혐오를 조장하는 내용',
    icon: Shield,
    color: 'text-red-700',
  },
  {
    id: 'SEXUAL_CONTENT' as ReportType,
    name: '성적 콘텐츠',
    description: '부적절한 성적 내용이나 노골적인 성적 표현',
    icon: Heart,
    color: 'text-pink-600',
  },
  {
    id: 'VIOLENCE' as ReportType,
    name: '폭력적 콘텐츠',
    description: '폭력을 조장하거나 위험한 행동을 부추기는 내용',
    icon: AlertTriangle,
    color: 'text-red-800',
  },
  {
    id: 'OTHER' as ReportType,
    name: '기타',
    description: '위 항목에 해당하지 않는 기타 위반 사항',
    icon: MessageSquare,
    color: 'text-gray-600',
  },
]

const ReportModal = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  reportedUserId,
  targetContent,
  onSuccess,
}: ReportModalProps) => {
  const [step, setStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<ReportType | null>(null)
  const [reason, setReason] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleClose = () => {
    if (!isSubmitting) {
      setStep(1)
      setSelectedCategory(null)
      setReason('')
      setAdditionalInfo('')
      setIsAnonymous(true)
      onClose()
    }
  }

  const handleCategorySelect = (category: ReportType) => {
    setSelectedCategory(category)
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!selectedCategory || !reason.trim()) {
      toast({
        title: '필수 항목 누락',
        description: '모든 필수 항목을 입력해주세요.',
        variant: 'destructive',
      })

      return
    }

    if (reason.length < 10) {
      toast({
        title: '사유가 너무 짧습니다',
        description: '최소 10자 이상 입력해주세요.',
        variant: 'destructive',
      })

      return
    }

    setIsSubmitting(true)

    try {
      const dto: CreateReportDto = {
        reportedUserId,
        targetType,
        targetId,
        type: selectedCategory,
        reason: reason.trim(),
      }

      await createReport(dto)

      toast({
        title: '신고가 접수되었습니다',
        description: '신고 내용은 24시간 내에 검토됩니다.',
      })

      handleClose()
      onSuccess?.()
    } catch (error) {
      toast({
        title: '신고 접수 실패',
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {[1, 2, 3, 4].map((stepNum) => (
        <div
          key={stepNum}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            stepNum <= step
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          {stepNum}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>신고 카테고리를 선택해주세요</DialogTitle>
        <DialogDescription>
          신고 사유에 가장 적합한 카테고리를 선택하세요
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-3">
        {REPORT_CATEGORIES.map((category) => {
          const Icon = category.icon

          return (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="p-4 text-left border-2 rounded-lg transition-colors hover:border-gray-300 dark:hover:border-gray-600 border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-6 h-6 ${category.color}`} />
                <div>
                  <div className="font-medium text-foreground">{category.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {category.description}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderStep2 = () => {
    const selectedCat = REPORT_CATEGORIES.find((c) => c.id === selectedCategory)

    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle>구체적인 사유를 입력해주세요</DialogTitle>
          <DialogDescription>
            선택한 카테고리: {selectedCat?.name}
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label htmlFor="reason">신고 사유 *</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setReason(e.target.value)
            }
            placeholder="어떤 점이 문제인지 구체적으로 설명해주세요..."
            className="mt-2 resize-none"
            rows={4}
            maxLength={1000}
            required
          />
          <div className="text-xs text-muted-foreground mt-1">
            {reason.length}/1000자 (최소 10자)
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
          />
          <div className="space-y-1">
            <Label htmlFor="anonymous" className="cursor-pointer">
              익명으로 신고하기
            </Label>
            <p className="text-xs text-muted-foreground">
              익명 신고 시 신고자 정보가 공개되지 않습니다
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(1)}
            className="flex-1"
          >
            이전
          </Button>
          <Button
            type="button"
            onClick={() => setStep(3)}
            disabled={!reason.trim() || reason.length < 10}
            className="flex-1"
          >
            다음
          </Button>
        </div>
      </div>
    )
  }

  const renderStep3 = () => (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>추가 정보 (선택사항)</DialogTitle>
        <DialogDescription>
          추가적인 맥락이나 설명이 있다면 입력해주세요
        </DialogDescription>
      </DialogHeader>

      <div>
        <Label htmlFor="additional">추가 설명</Label>
        <Textarea
          id="additional"
          value={additionalInfo}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setAdditionalInfo(e.target.value)
          }
          placeholder="추가적인 맥락이나 설명..."
          className="mt-2 resize-none"
          rows={3}
          maxLength={300}
        />
        <div className="text-xs text-muted-foreground mt-1">
          {additionalInfo.length}/300자
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(2)}
          className="flex-1"
        >
          이전
        </Button>
        <Button type="button" onClick={() => setStep(4)} className="flex-1">
          다음
        </Button>
      </div>
    </div>
  )

  const renderStep4 = () => {
    const selectedCat = REPORT_CATEGORIES.find((c) => c.id === selectedCategory)

    return (
      <div className="space-y-6">
        <DialogHeader>
          <DialogTitle>신고 내용 확인</DialogTitle>
          <DialogDescription>
            아래 내용으로 신고를 접수합니다
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div>
            <span className="font-medium">카테고리: </span>
            {selectedCat?.name}
          </div>
          <div>
            <span className="font-medium">사유: </span>
            <div className="mt-1 text-sm">{reason}</div>
          </div>
          {additionalInfo && (
            <div>
              <span className="font-medium">추가 정보: </span>
              <div className="mt-1 text-sm">{additionalInfo}</div>
            </div>
          )}
          <div>
            <span className="font-medium">신고 방식: </span>
            {isAnonymous ? '익명' : '실명'}
          </div>
        </div>

        {targetContent && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              신고 대상:
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 line-clamp-2">
              {targetContent}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p>• 허위 신고는 제재 대상이 될 수 있습니다</p>
          <p>• 신고는 24시간 내에 검토됩니다</p>
          <p>• 처리 결과는 알림으로 안내드립니다</p>
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(3)}
            disabled={isSubmitting}
            className="flex-1"
          >
            이전
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? '신고 중...' : '신고 완료'}
          </Button>
        </div>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {renderStepIndicator()}
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  )
}

export default ReportModal
