'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Trash2,
  AlertTriangle,
  Shield,
  Download,
  Clock,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'

const accountDeletionSchema = z.object({
  confirmationText: z.string().refine(
    (val) => val === 'DELETE',
    { message: 'DELETE를 정확히 입력해주세요.' }
  ),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  reason: z.string().optional(),
  agreedToTerms: z.boolean().refine(
    (val) => val === true,
    { message: '계정 삭제 약관에 동의해야 합니다.' }
  ),
  agreedToDataLoss: z.boolean().refine(
    (val) => val === true,
    { message: '데이터 손실에 대한 이해를 확인해야 합니다.' }
  )
})

type AccountDeletionForm = z.infer<typeof accountDeletionSchema>

interface AccountDeletionProps {
  userId: string
  className?: string
}

const deletionReasons = [
  '더 이상 서비스를 사용하지 않음',
  '개인정보 보호 우려',
  '다른 서비스로 이전',
  '기능이 부족함',
  '사용법이 복잡함',
  '기타'
]

export function AccountDeletion({ userId, className }: AccountDeletionProps) {
  const [showDeleteForm, setShowDeleteForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm<AccountDeletionForm>({
    resolver: zodResolver(accountDeletionSchema),
    mode: 'onChange',
    defaultValues: {
      confirmationText: 'DELETE',
      password: '',
      reason: '',
      agreedToTerms: false,
      agreedToDataLoss: false
    }
  })

  const confirmationText = watch('confirmationText')
  const agreedToTerms = watch('agreedToTerms')
  const agreedToDataLoss = watch('agreedToDataLoss')

  const onSubmit = async (data: AccountDeletionForm) => {
    // 최종 확인
    const finalConfirmation = confirm(
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
    )
    
    if (!finalConfirmation) {
      return
    }

    setIsDeletingAccount(true)
    try {
      const response = await fetch(`/api/users/${userId}/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText: data.confirmationText,
          password: data.password,
          reason: selectedReason,
          customReason: data.reason
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('계정이 성공적으로 삭제되었습니다.')
        
        // 30일 후 완전 삭제 안내
        toast.info('30일 후에 모든 데이터가 완전히 삭제됩니다. 복구를 원한다면 support@readzone.com에 문의하세요.')
        
        // 로그아웃 처리
        await signOut({ callbackUrl: '/' })
      } else {
        throw new Error(result.message || '계정 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('계정 삭제 실패:', error)
      toast.error(error instanceof Error ? error.message : '계정 삭제에 실패했습니다.')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handleDataExport = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          types: ['full'],
          format: 'json'
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `readzone-backup-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast.success('데이터 백업이 완료되었습니다.')
      } else {
        throw new Error('데이터 백업에 실패했습니다.')
      }
    } catch (error) {
      console.error('데이터 백업 실패:', error)
      toast.error('데이터 백업에 실패했습니다.')
    }
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* 경고 메시지 */}
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                계정 삭제 주의사항
              </h3>
              <div className="text-sm text-red-700 dark:text-red-300 space-y-2">
                <p><strong>계정을 삭제하면 다음과 같은 일이 발생합니다:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>모든 독후감과 댓글이 삭제됩니다</li>
                  <li>프로필 정보와 설정이 모두 제거됩니다</li>
                  <li>좋아요, 팔로우 등 모든 활동 기록이 사라집니다</li>
                  <li>동일한 이메일로 재가입이 제한될 수 있습니다</li>
                  <li>삭제된 데이터는 복구할 수 없습니다</li>
                </ul>
                <p className="mt-3 font-medium">
                  ⚠️ 이 작업은 되돌릴 수 없습니다. 신중하게 결정해 주세요.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 백업 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            계정 삭제 전 데이터 백업
          </CardTitle>
          <CardDescription>
            계정을 삭제하기 전에 중요한 데이터를 백업하는 것을 강력히 권장합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  데이터 백업 권장사항
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  계정 삭제 후에는 데이터를 복구할 수 없습니다. 지금 전체 데이터를 백업하여 
                  나중에 다른 곳에서 활용하거나 복구할 수 있도록 준비하세요.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleDataExport}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            전체 데이터 백업 다운로드
          </Button>
        </CardContent>
      </Card>

      {/* 계정 삭제 절차 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600 dark:text-red-400">
            <Trash2 className="w-5 h-5 mr-2" />
            계정 삭제
          </CardTitle>
          <CardDescription>
            아래 절차를 따라 계정을 영구적으로 삭제할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showDeleteForm ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">삭제 절차</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>1. 데이터 백업 (권장)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span>2. 삭제 사유 선택</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span>3. 본인 확인</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span>4. 최종 확인</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowDeleteForm(true)}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                계정 삭제 진행
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 삭제 사유 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  삭제 사유 (선택사항)
                </Label>
                <div className="space-y-2">
                  {deletionReasons.map((reason) => (
                    <div key={reason} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`reason-${reason}`}
                        name="reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <Label htmlFor={`reason-${reason}`} className="text-sm cursor-pointer">
                        {reason}
                      </Label>
                    </div>
                  ))}
                </div>

                {selectedReason === '기타' && (
                  <Textarea
                    {...register('reason')}
                    placeholder="구체적인 사유를 입력해주세요..."
                    rows={3}
                    className="mt-2"
                  />
                )}
              </div>

              {/* 확인 텍스트 입력 */}
              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  계정 삭제 확인 *
                </Label>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    계정 삭제를 확인하려면 아래 입력란에 <strong className="text-red-600">DELETE</strong>를 입력하세요.
                  </p>
                  <Input
                    id="confirmation"
                    {...register('confirmationText')}
                    placeholder="DELETE"
                    className={cn(
                      confirmationText === 'DELETE' && 'border-green-500 focus:border-green-500',
                      errors.confirmationText && 'border-red-500 focus:border-red-500'
                    )}
                  />
                  {errors.confirmationText && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {errors.confirmationText.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  비밀번호 확인 *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="현재 비밀번호를 입력하세요"
                    className={cn(
                      'pr-10',
                      errors.password && 'border-red-500 focus:border-red-500'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* 약관 동의 */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setValue('agreedToTerms', e.target.checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    계정 삭제 시 30일의 유예기간이 있으며, 이 기간 동안 복구 요청을 할 수 있음을 이해합니다. 
                    유예기간 이후에는 모든 데이터가 완전히 삭제되어 복구할 수 없습니다.
                  </Label>
                </div>
                {errors.agreedToTerms && (
                  <p className="text-xs text-red-600 dark:text-red-400 ml-6">
                    {errors.agreedToTerms.message}
                  </p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="data-loss"
                    checked={agreedToDataLoss}
                    onChange={(e) => setValue('agreedToDataLoss', e.target.checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="data-loss" className="text-sm cursor-pointer">
                    계정 삭제로 인한 모든 데이터 손실(독후감, 댓글, 프로필 등)에 대해 충분히 이해했으며, 
                    이에 대한 책임은 본인에게 있음을 확인합니다.
                  </Label>
                </div>
                {errors.agreedToDataLoss && (
                  <p className="text-xs text-red-600 dark:text-red-400 ml-6">
                    {errors.agreedToDataLoss.message}
                  </p>
                )}
              </div>

              {/* 삭제 일정 안내 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      계정 삭제 일정
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>즉시:</strong> 계정 비활성화, 공개 콘텐츠 숨김</li>
                      <li>• <strong>30일 후:</strong> 모든 데이터 완전 삭제</li>
                      <li>• <strong>복구 기한:</strong> 30일 이내 support@readzone.com 문의</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex items-center space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteForm(false)}
                  disabled={isDeletingAccount}
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
                
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!isValid || isDeletingAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeletingAccount && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {isDeletingAccount ? '삭제 중...' : '계정 영구 삭제'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}