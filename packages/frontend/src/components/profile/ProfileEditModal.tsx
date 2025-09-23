import React, { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Check, Image, Loader2, Shield, User, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useDebounce } from '@/hooks/useDebounce';

// Validation schemas
const socialLinksSchema = z.object({
  blog: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('')),
  twitter: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('')),
  instagram: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('')),
});

const privacySettingsSchema = z.object({
  emailVisible: z.boolean().optional(),
  activityVisible: z.enum(['all', 'followers', 'none']).optional(),
  followersVisible: z.boolean().optional(),
  likesVisible: z.enum(['all', 'followers', 'none']).optional(),
});

const profileUpdateSchema = z.object({
  userid: z.string()
    .min(2, '사용자 ID는 최소 2자 이상이어야 합니다.')
    .max(30, '사용자 ID는 최대 30자까지 가능합니다.')
    .regex(/^[a-zA-Z0-9_-]+$/, '사용자 ID는 영문, 숫자, 밑줄(_), 하이픈(-)만 사용 가능합니다.')
    .optional(),
  nickname: z.string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .max(50, '닉네임은 최대 50자까지 가능합니다.')
    .optional(),
  bio: z.string()
    .max(500, '자기소개는 최대 500자까지 가능합니다.')
    .optional(),
  socialLinks: socialLinksSchema.optional(),
  privacy: privacySettingsSchema.optional(),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

interface UseridCheckState {
  status: 'idle' | 'checking' | 'available' | 'unavailable' | 'error';
  message: string;
  suggestions: string[];
}

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { user } = useAuthStore();
  const { currentProfile, setCurrentProfile } = useProfileStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [useridCheck, setUseridCheck] = useState<UseridCheckState>({
    status: 'idle',
    message: '',
    suggestions: [],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      userid: user?.userid ?? '',
      nickname: user?.nickname ?? '',
      bio: currentProfile?.user.bio ?? '',
      socialLinks: {
        blog: currentProfile?.user.socialLinks?.blog ?? '',
        twitter: currentProfile?.user.socialLinks?.twitter ?? '',
        instagram: currentProfile?.user.socialLinks?.instagram ?? '',
      },
      privacy: {
        emailVisible: true, // Default values - should come from backend
        activityVisible: 'all' as const,
        followersVisible: true,
        likesVisible: 'all' as const,
      },
    },
  });

  const watchedUserid = watch('userid');
  const debouncedUserid = useDebounce(watchedUserid, 500);

  // Check username availability
  const checkUseridAvailability = useCallback(async (userid: string) => {
    if (!userid || userid === user?.userid) {
      setUseridCheck({ status: 'idle', message: '', suggestions: [] });

      return;
    }

    setUseridCheck({ status: 'checking', message: '확인 중...', suggestions: [] });

    try {
      const response = await fetch(`/api/users/check-userid/${userid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('확인 중 오류가 발생했습니다.');
      }

      const data = await response.json();

      if (data.available) {
        setUseridCheck({
          status: 'available',
          message: '사용 가능한 아이디입니다.',
          suggestions: [],
        });
      } else {
        setUseridCheck({
          status: 'unavailable',
          message: data.message ?? '이미 사용 중인 아이디입니다.',
          suggestions: data.suggestions ?? [],
        });
      }
    } catch (_error) {
      setUseridCheck({
        status: 'error',
        message: '확인 중 오류가 발생했습니다.',
        suggestions: [],
      });
    }
  }, [user?.userid]);

  // Effect for debounced userid checking
  React.useEffect(() => {
    if (debouncedUserid && debouncedUserid !== user?.userid) {
      checkUseridAvailability(debouncedUserid);
    }
  }, [debouncedUserid, checkUseridAvailability, user?.userid]);

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Validate file
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        setUpdateError('JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');

        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUpdateError('파일 크기는 5MB 이하여야 합니다.');

        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();

      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user?.userid) {return;}

    const formData = new FormData();

    formData.append('image', avatarFile);
    // Add crop data if needed in the future
    formData.append('x', '0');
    formData.append('y', '0');
    formData.append('width', '400');
    formData.append('height', '400');

    try {
      const response = await fetch(`/api/users/${user.userid}/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('프로필 사진 업로드에 실패했습니다.');
      }

      const data = await response.json();

      if (data.success) {
        // Update profile with new avatar
        if (currentProfile) {
          setCurrentProfile({
            ...currentProfile,
            user: {
              ...currentProfile.user,
              profileImage: data.profileImage,
            },
          });
        }
        setAvatarFile(null);
        setAvatarPreview(null);

        return true;
      } else {
        throw new Error(data.message ?? '프로필 사진 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  const onSubmit = async (data: ProfileUpdateData) => {
    if (!user?.userid) {return;}

    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Upload avatar first if selected
      if (avatarFile) {
        await handleAvatarUpload();
      }

      // Update profile data
      const response = await fetch(`/api/users/${user.userid}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('프로필 업데이트에 실패했습니다.');
      }

      const result = await response.json();

      if (result.success) {
        // Update profile store
        if (currentProfile) {
          setCurrentProfile({
            ...currentProfile,
            user: {
              ...currentProfile.user,
              ...result.user,
            },
          });
        }

        onOpenChange(false);
        reset(); // Reset form
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        setUpdateError(result.errors?.[0]?.message ?? '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setUpdateError(error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getUseridCheckIcon = () => {
    switch (useridCheck.status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'available':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'unavailable':
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getUseridCheckColor = () => {
    switch (useridCheck.status) {
      case 'available':
        return 'text-green-600';
      case 'unavailable':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>프로필 편집</DialogTitle>
        </DialogHeader>

        {updateError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                기본 정보
              </TabsTrigger>
              <TabsTrigger value="avatar" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                프로필 사진
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                프라이버시
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="userid">사용자 ID</Label>
                <div className="relative">
                  <Input
                    id="userid"
                    {...register('userid')}
                    placeholder="아이디를 입력하세요"
                    error={!!errors.userid}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getUseridCheckIcon()}
                  </div>
                </div>
                {errors.userid && (
                  <p className="text-sm text-destructive">{errors.userid.message}</p>
                )}
                {useridCheck.message && (
                  <div className="space-y-2">
                    <p className={`text-sm ${getUseridCheckColor()}`}>
                      {useridCheck.message}
                    </p>
                    {useridCheck.suggestions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">추천 아이디:</p>
                        <div className="flex flex-wrap gap-2">
                          {useridCheck.suggestions.map((suggestion) => (
                            <Button
                              key={suggestion}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setValue('userid', suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Nickname */}
              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  {...register('nickname')}
                  placeholder="닉네임을 입력하세요"
                  error={!!errors.nickname}
                />
                {errors.nickname && (
                  <p className="text-sm text-destructive">{errors.nickname.message}</p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">자기소개</Label>
                <textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="자기소개를 입력하세요"
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  maxLength={500}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <Label>소셜 링크</Label>

                <div className="space-y-2">
                  <Label htmlFor="blog" className="text-sm font-normal">블로그</Label>
                  <Input
                    id="blog"
                    {...register('socialLinks.blog')}
                    placeholder="https://blog.example.com"
                    error={!!errors.socialLinks?.blog}
                  />
                  {errors.socialLinks?.blog && (
                    <p className="text-sm text-destructive">{errors.socialLinks.blog.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-sm font-normal">트위터</Label>
                  <Input
                    id="twitter"
                    {...register('socialLinks.twitter')}
                    placeholder="https://twitter.com/username"
                    error={!!errors.socialLinks?.twitter}
                  />
                  {errors.socialLinks?.twitter && (
                    <p className="text-sm text-destructive">{errors.socialLinks.twitter.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-sm font-normal">인스타그램</Label>
                  <Input
                    id="instagram"
                    {...register('socialLinks.instagram')}
                    placeholder="https://instagram.com/username"
                    error={!!errors.socialLinks?.instagram}
                  />
                  {errors.socialLinks?.instagram && (
                    <p className="text-sm text-destructive">{errors.socialLinks.instagram.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="avatar" className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="프로필 미리보기"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={currentProfile?.user.profileImage ?? '/default-avatar.png'}
                        alt="현재 프로필"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </Avatar>
                  {avatarFile && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    프로필 사진 선택
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WebP 형식, 최대 5MB
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">이메일 공개 설정</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emailVisible"
                      checked={watch('privacy.emailVisible') ?? true}
                      onCheckedChange={(checked) => setValue('privacy.emailVisible', !!checked)}
                    />
                    <Label htmlFor="emailVisible" className="text-sm font-normal">
                      다른 사용자에게 이메일 주소 공개
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">활동 공개 범위</h4>
                  <div className="space-y-2">
                    {(['all', 'followers', 'none'] as const).map((value) => (
                      <div key={value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`activity-${value}`}
                          {...register('privacy.activityVisible')}
                          value={value}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`activity-${value}`} className="text-sm font-normal">
                          {value === 'all' && '모든 사용자'}
                          {value === 'followers' && '팔로워만'}
                          {value === 'none' && '비공개'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">팔로워 목록 공개 설정</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="followersVisible"
                      checked={watch('privacy.followersVisible') ?? true}
                      onCheckedChange={(checked) => setValue('privacy.followersVisible', !!checked)}
                    />
                    <Label htmlFor="followersVisible" className="text-sm font-normal">
                      팔로워/팔로잉 목록 공개
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">좋아요 공개 범위</h4>
                  <div className="space-y-2">
                    {(['all', 'followers', 'none'] as const).map((value) => (
                      <div key={value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`likes-${value}`}
                          {...register('privacy.likesVisible')}
                          value={value}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`likes-${value}`} className="text-sm font-normal">
                          {value === 'all' && '모든 사용자'}
                          {value === 'followers' && '팔로워만'}
                          {value === 'none' && '비공개'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={
                isUpdating ||
                !isDirty ||
                (watchedUserid !== user?.userid && useridCheck.status !== 'available')
              }
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}