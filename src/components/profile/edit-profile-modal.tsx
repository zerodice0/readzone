'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  User,
  X,
  Eye,
  AlertCircle,
  CheckCircle,
  Camera,
  Loader2
} from 'lucide-react'
import type { UserProfile } from '@/lib/user-stats'

// 프로필 편집 스키마
const editProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .max(20, '닉네임은 최대 20자까지 가능합니다.')
    .regex(/^[가-힣a-zA-Z0-9_]+$/, '닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다.'),
  bio: z
    .string()
    .max(200, '자기소개는 최대 200자까지 가능합니다.')
    .optional(),
  image: z
    .string()
    .url('올바른 이미지 URL을 입력해주세요.')
    .optional()
    .or(z.literal(''))
})

type EditProfileFormData = z.infer<typeof editProfileSchema>

interface EditProfileModalProps {
  profile: UserProfile
  onSave: (data: { nickname?: string; bio?: string; image?: string }) => void
  onClose: () => void
  isLoading?: boolean
}

export function EditProfileModal({
  profile,
  onSave,
  onClose,
  isLoading = false
}: EditProfileModalProps) {
  const [showImageUrlInput, setShowImageUrlInput] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(profile.image)
  const [nicknameCheckResult, setNicknameCheckResult] = useState<{
    isChecking: boolean
    isAvailable: boolean | null
    message: string
  }>({
    isChecking: false,
    isAvailable: null,
    message: ''
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      nickname: profile.nickname,
      bio: profile.bio || '',
      image: profile.image || ''
    },
    mode: 'onChange'
  })

  const watchedNickname = watch('nickname')
  const watchedImage = watch('image')

  // 닉네임 중복 확인
  useEffect(() => {
    const checkNickname = async (nickname: string) => {
      if (nickname === profile.nickname) {
        setNicknameCheckResult({
          isChecking: false,
          isAvailable: true,
          message: '현재 닉네임입니다.'
        })
        return
      }

      if (nickname.length < 2) {
        setNicknameCheckResult({
          isChecking: false,
          isAvailable: null,
          message: ''
        })
        return
      }

      setNicknameCheckResult({
        isChecking: true,
        isAvailable: null,
        message: '확인 중...'
      })

      try {
        const response = await fetch('/api/auth/check-duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field: 'nickname',
            value: nickname
          })
        })

        const result = await response.json()

        if (response.ok) {
          setNicknameCheckResult({
            isChecking: false,
            isAvailable: !result.exists,
            message: result.exists ? '이미 사용 중인 닉네임입니다.' : '사용 가능한 닉네임입니다.'
          })
        } else {
          setNicknameCheckResult({
            isChecking: false,
            isAvailable: null,
            message: '닉네임 확인 중 오류가 발생했습니다.'
          })
        }
      } catch (error) {
        setNicknameCheckResult({
          isChecking: false,
          isAvailable: null,
          message: '닉네임 확인 중 오류가 발생했습니다.'
        })
      }
    }

    const debounceTimer = setTimeout(() => {
      if (watchedNickname && watchedNickname.length >= 2) {
        checkNickname(watchedNickname)
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [watchedNickname, profile.nickname])

  // 이미지 URL 변경 감지
  useEffect(() => {
    if (watchedImage && watchedImage !== imagePreview) {
      setImagePreview(watchedImage)
    }
  }, [watchedImage, imagePreview])

  const onSubmit = (data: EditProfileFormData) => {
    if (!isDirty) {
      onClose()
      return
    }

    // 변경된 필드만 전송
    const changes: { nickname?: string; bio?: string; image?: string } = {}
    
    if (data.nickname !== profile.nickname) {
      changes.nickname = data.nickname
    }
    
    if (data.bio !== (profile.bio || '')) {
      changes.bio = data.bio || undefined
    }
    
    if (data.image !== (profile.image || '')) {
      changes.image = data.image || undefined
    }

    onSave(changes)
  }

  const handleImageUrlToggle = () => {
    setShowImageUrlInput(!showImageUrlInput)
    if (showImageUrlInput) {
      setValue('image', profile.image || '')
      setImagePreview(profile.image)
    }
  }

  const handleImageRemove = () => {
    setValue('image', '')
    setImagePreview(null)
  }

  const isNicknameValid = !errors.nickname && 
    (watchedNickname === profile.nickname || nicknameCheckResult.isAvailable)

  const canSave = isDirty && isValid && isNicknameValid && !nicknameCheckResult.isChecking

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            프로필 편집
          </DialogTitle>
          <DialogDescription>
            프로필 정보를 수정할 수 있습니다. 변경사항은 즉시 반영됩니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 프로필 이미지 */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">프로필 이미지</Label>
            
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={imagePreview || undefined} />
                <AvatarFallback>
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageUrlToggle}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {showImageUrlInput ? '취소' : 'URL로 변경'}
                  </Button>
                  
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleImageRemove}
                    >
                      <X className="w-4 h-4 mr-2" />
                      제거
                    </Button>
                  )}
                </div>
                
                {showImageUrlInput && (
                  <div className="space-y-2">
                    <Input
                      {...register('image')}
                      placeholder="이미지 URL을 입력하세요"
                      className="text-sm"
                    />
                    {errors.image && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.image.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 닉네임 */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-sm font-medium">
              닉네임 *
            </Label>
            <div className="space-y-1">
              <Input
                id="nickname"
                {...register('nickname')}
                placeholder="닉네임을 입력하세요"
                className={cn(
                  errors.nickname && 'border-red-500 focus:border-red-500',
                  isNicknameValid && watchedNickname !== profile.nickname && 'border-green-500 focus:border-green-500'
                )}
              />
              
              {/* 닉네임 검증 상태 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  {nicknameCheckResult.isChecking && (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-gray-500">{nicknameCheckResult.message}</span>
                    </>
                  )}
                  
                  {!nicknameCheckResult.isChecking && nicknameCheckResult.isAvailable === true && (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">{nicknameCheckResult.message}</span>
                    </>
                  )}
                  
                  {!nicknameCheckResult.isChecking && nicknameCheckResult.isAvailable === false && (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">{nicknameCheckResult.message}</span>
                    </>
                  )}
                  
                  {errors.nickname && (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">{errors.nickname.message}</span>
                    </>
                  )}
                </div>
                
                <span className={cn(
                  'text-gray-500',
                  watchedNickname?.length > 15 && 'text-yellow-600',
                  watchedNickname?.length > 18 && 'text-red-600'
                )}>
                  {watchedNickname?.length || 0}/20
                </span>
              </div>
            </div>
          </div>

          {/* 자기소개 */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">
              자기소개
            </Label>
            <div className="space-y-1">
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="자기소개를 입력하세요 (선택사항)"
                rows={3}
                className={cn(
                  'resize-none',
                  errors.bio && 'border-red-500 focus:border-red-500'
                )}
              />
              
              <div className="flex items-center justify-between text-xs">
                {errors.bio && (
                  <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.bio.message}</span>
                  </div>
                )}
                
                <span className={cn(
                  'text-gray-500 ml-auto',
                  (watch('bio')?.length || 0) > 150 && 'text-yellow-600',
                  (watch('bio')?.length || 0) > 180 && 'text-red-600'
                )}>
                  {watch('bio')?.length || 0}/200
                </span>
              </div>
            </div>
          </div>

          {/* 변경사항 미리보기 */}
          {isDirty && (
            <Card className="bg-gray-50 dark:bg-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    변경사항 미리보기
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  {watchedNickname !== profile.nickname && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">닉네임:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 line-through">{profile.nickname}</span>
                        <span>→</span>
                        <span className="font-medium">{watchedNickname}</span>
                      </div>
                    </div>
                  )}
                  
                  {watch('bio') !== (profile.bio || '') && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">자기소개:</span>
                      <Badge variant="outline" className="text-xs">
                        {watch('bio') ? '수정됨' : '제거됨'}
                      </Badge>
                    </div>
                  )}
                  
                  {watch('image') !== (profile.image || '') && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">프로필 이미지:</span>
                      <Badge variant="outline" className="text-xs">
                        {watch('image') ? '변경됨' : '제거됨'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              취소
            </Button>
            
            <Button
              type="submit"
              disabled={!canSave || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isDirty ? '변경사항 저장' : '변경사항 없음'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}