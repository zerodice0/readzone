'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  User,
  Camera,
  Upload,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Mail,
  Calendar,
  Loader2,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

const profileEditSchema = z.object({
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

type ProfileEditFormData = z.infer<typeof profileEditSchema>

interface ProfileEditSectionProps {
  userId: string
  className?: string
}

export function ProfileEditSection({ userId, className }: ProfileEditSectionProps) {
  const [showImageUrlInput, setShowImageUrlInput] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
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
    profile,
    isLoading,
    isError,
    updateProfile,
    isUpdating,
    refreshAll
  } = useUserProfile({ userId })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    reset
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      nickname: profile?.nickname || '',
      bio: profile?.bio || '',
      image: profile?.image || ''
    },
    mode: 'onChange'
  })

  const watchedNickname = watch('nickname')
  const watchedImage = watch('image')
  const watchedBio = watch('bio')

  // 프로필 데이터가 로드되면 폼 리셋
  useState(() => {
    if (profile) {
      reset({
        nickname: profile.nickname,
        bio: profile.bio || '',
        image: profile.image || ''
      })
      setImagePreview(profile.image)
    }
  }, [profile, reset])

  // 닉네임 중복 확인
  const checkNickname = useCallback(async (nickname: string) => {
    if (!profile || nickname === profile.nickname) {
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
  }, [profile])

  // 디바운싱된 닉네임 확인
  useState(() => {
    const debounceTimer = setTimeout(() => {
      if (watchedNickname && watchedNickname.length >= 2) {
        checkNickname(watchedNickname)
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [watchedNickname, checkNickname])

  // 이미지 URL 변경 감지
  useState(() => {
    if (watchedImage && watchedImage !== imagePreview) {
      setImagePreview(watchedImage)
    }
  }, [watchedImage, imagePreview])

  const onSubmit = (data: ProfileEditFormData) => {
    if (!isDirty || !profile) return

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

    updateProfile(changes)
  }

  const handleImageUrlToggle = () => {
    setShowImageUrlInput(!showImageUrlInput)
    if (showImageUrlInput) {
      setValue('image', profile?.image || '')
      setImagePreview(profile?.image || null)
    }
  }

  const handleImageRemove = () => {
    setValue('image', '')
    setImagePreview(null)
  }

  const isNicknameValid = !errors.nickname && 
    (watchedNickname === profile?.nickname || nicknameCheckResult.isAvailable)

  const canSave = isDirty && isValid && isNicknameValid && !nicknameCheckResult.isChecking

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          프로필 정보를 불러올 수 없습니다
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          다시 시도해 주세요.
        </p>
        <Button onClick={refreshAll} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* 기본 정보 표시 */}
      <Card className="bg-gray-50 dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <User className="w-5 h-5 mr-2" />
            계정 정보
          </CardTitle>
          <CardDescription>
            ReadZone에서 사용하는 기본 계정 정보입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                이메일 주소
              </Label>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{profile.email}</span>
                {profile.emailVerified && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    인증됨
                  </Badge>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                가입일
              </Label>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                  <span className="text-gray-500 ml-2">
                    ({formatDistanceToNow(new Date(profile.createdAt), { 
                      addSuffix: true, 
                      locale: ko 
                    })})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 편집 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 프로필 이미지 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              프로필 이미지
            </CardTitle>
            <CardDescription>
              다른 사용자들에게 표시될 프로필 이미지를 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={imagePreview || undefined} alt="프로필 이미지" />
                <AvatarFallback>
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageUrlToggle}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {showImageUrlInput ? 'URL 입력 취소' : 'URL로 업로드'}
                  </Button>
                  
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleImageRemove}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      이미지 제거
                    </Button>
                  )}
                </div>
                
                {showImageUrlInput && (
                  <div className="space-y-2">
                    <Label htmlFor="image" className="text-sm font-medium">
                      이미지 URL
                    </Label>
                    <Input
                      id="image"
                      {...register('image')}
                      placeholder="https://example.com/image.jpg"
                      className={cn(
                        'max-w-md',
                        errors.image && 'border-red-500 focus:border-red-500'
                      )}
                      aria-describedby={errors.image ? 'image-error' : undefined}
                    />
                    {errors.image && (
                      <p id="image-error" className="text-xs text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.image.message}
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  권장 크기: 200x200px, JPG, PNG, GIF 형식 지원
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 닉네임 */}
        <Card>
          <CardHeader>
            <CardTitle>닉네임</CardTitle>
            <CardDescription>
              다른 사용자들에게 표시될 닉네임입니다. 2-20자 사이여야 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-md space-y-2">
              <Label htmlFor="nickname" className="text-sm font-medium">
                닉네임 *
              </Label>
              <Input
                id="nickname"
                {...register('nickname')}
                placeholder="닉네임을 입력하세요"
                className={cn(
                  errors.nickname && 'border-red-500 focus:border-red-500',
                  isNicknameValid && watchedNickname !== profile.nickname && 
                  'border-green-500 focus:border-green-500'
                )}
                aria-describedby="nickname-feedback"
              />
              
              {/* 닉네임 피드백 */}
              <div id="nickname-feedback" className="space-y-1">
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
                        <span className="text-green-600 dark:text-green-400">
                          {nicknameCheckResult.message}
                        </span>
                      </>
                    )}
                    
                    {!nicknameCheckResult.isChecking && nicknameCheckResult.isAvailable === false && (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">
                          {nicknameCheckResult.message}
                        </span>
                      </>
                    )}
                    
                    {errors.nickname && (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">
                          {errors.nickname.message}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <span className={cn(
                    'text-gray-500',
                    (watchedNickname?.length || 0) > 15 && 'text-yellow-600',
                    (watchedNickname?.length || 0) > 18 && 'text-red-600'
                  )}>
                    {watchedNickname?.length || 0}/20
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 자기소개 */}
        <Card>
          <CardHeader>
            <CardTitle>자기소개</CardTitle>
            <CardDescription>
              프로필에 표시될 간단한 자기소개를 작성하세요. (선택사항)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                자기소개
              </Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="자기소개를 입력하세요..."
                rows={4}
                className={cn(
                  'resize-none',
                  errors.bio && 'border-red-500 focus:border-red-500'
                )}
                aria-describedby="bio-feedback"
              />
              
              <div id="bio-feedback" className="flex items-center justify-between text-xs">
                {errors.bio && (
                  <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.bio.message}</span>
                  </div>
                )}
                
                <span className={cn(
                  'text-gray-500 ml-auto',
                  (watchedBio?.length || 0) > 150 && 'text-yellow-600',
                  (watchedBio?.length || 0) > 180 && 'text-red-600'
                )}>
                  {watchedBio?.length || 0}/200
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isDirty ? '변경사항이 있습니다' : '저장된 상태입니다'}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={!isDirty || isUpdating}
            >
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
            
            <Button
              type="submit"
              disabled={!canSave || isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isUpdating ? '저장 중...' : '변경사항 저장'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}