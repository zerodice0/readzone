# Phase 4: 프로필 편집 시스템

## 📋 Phase 개요

- **기간**: 2-3주
- **우선순위**: 높음 (Phase 1,2,3 완료 후)
- **목표**: 사용자가 자신의 프로필 정보를 수정하고 개인정보 설정을 관리할 수 있는 시스템 구현

## 🎯 구현 목표

1. **프로필 정보 수정** (닉네임, 자기소개, 소셜 링크)
2. **프로필 사진 업로드/크롭** (Cloudinary 연동)
3. **닉네임 중복 확인** 및 **유효성 검사**
4. **개인정보 공개 범위** 설정
5. **실시간 미리보기** 및 **변경사항 저장**

## 🗄️ Backend 구현사항

### 1. Prisma 스키마 확장

**User 모델에 개인정보 설정 필드 추가:**

```prisma
// packages/backend/prisma/schema.prisma
model User {
  // 기존 필드들...

  // 개인정보 설정 (JSON 필드)
  privacy        Json?     // 개인정보 공개 범위 설정

  @@map("users")
}

// privacy 필드 구조:
// {
//   emailVisible: boolean,           // 이메일 주소 공개
//   activityVisible: 'all' | 'followers' | 'none',  // 활동 내역 공개 범위
//   followersVisible: boolean,       // 팔로워 목록 공개
//   likesVisible: 'all' | 'followers' | 'none'      // 좋아요한 독후감 공개 범위
// }
```

### 2. API 엔드포인트 구현

#### PUT `/api/users/:userId/profile` - 프로필 정보 수정

**Controller:**

```typescript
// packages/backend/src/modules/user/user.controller.ts
@Put(':userId/profile')
@UseGuards(JwtAuthGuard)
async updateProfile(
  @Param('userId') userId: string,
  @Body() updateData: UpdateProfileDto,
  @Req() req: AuthRequest,
): Promise<UpdateProfileResponse> {
  // 본인만 수정 가능
  if (req.user.id !== userId) {
    throw new ForbiddenException('본인의 프로필만 수정할 수 있습니다.');
  }

  return this.userService.updateProfile(userId, updateData);
}

@Get('check-username/:username')
@UseGuards(OptionalAuthGuard)
async checkUsernameAvailability(
  @Param('username') username: string,
  @Req() req: OptionalAuthRequest,
): Promise<UsernameCheckResponse> {
  return this.userService.checkUsernameAvailability(username, req.user?.id);
}
```

**DTO 정의:**

```typescript
// packages/backend/src/modules/user/dto/update-profile.dto.ts
import { IsOptional, IsString, MinLength, MaxLength, IsUrl, IsEnum, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SocialLinksDto {
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다.' })
  blog?: string;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다.' })
  twitter?: string;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다.' })
  instagram?: string;
}

export class PrivacySettingsDto {
  @IsOptional()
  @IsBoolean()
  emailVisible?: boolean;

  @IsOptional()
  @IsEnum(['all', 'followers', 'none'])
  activityVisible?: 'all' | 'followers' | 'none';

  @IsOptional()
  @IsBoolean()
  followersVisible?: boolean;

  @IsOptional()
  @IsEnum(['all', 'followers', 'none'])
  likesVisible?: 'all' | 'followers' | 'none';
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 최대 20자까지 가능합니다.' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '자기소개는 최대 500자까지 가능합니다.' })
  bio?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacy?: PrivacySettingsDto;
}

export interface UpdateProfileResponse {
  success: boolean;
  user: {
    id: string;
    username: string;
    bio?: string;
    socialLinks?: SocialLinksDto;
    privacy?: PrivacySettingsDto;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface UsernameCheckResponse {
  available: boolean;
  message: string;
  suggestions?: string[]; // 사용 불가능한 경우 대체 제안
}
```

**Service 구현:**

```typescript
// packages/backend/src/modules/user/user.service.ts
async updateProfile(
  userId: string,
  updateData: UpdateProfileDto
): Promise<UpdateProfileResponse> {
  try {
    // 1. 닉네임 중복 확인 (변경된 경우만)
    if (updateData.username) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      if (currentUser.username !== updateData.username) {
        const isAvailable = await this.checkUsernameAvailability(updateData.username, userId);
        if (!isAvailable.available) {
          return {
            success: false,
            user: null,
            errors: [{ field: 'username', message: isAvailable.message }]
          };
        }
      }
    }

    // 2. 소셜 링크 유효성 검사
    if (updateData.socialLinks) {
      const validationErrors = await this.validateSocialLinks(updateData.socialLinks);
      if (validationErrors.length > 0) {
        return {
          success: false,
          user: null,
          errors: validationErrors
        };
      }
    }

    // 3. 프로필 정보 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateData.username && { username: updateData.username }),
        ...(updateData.bio !== undefined && { bio: updateData.bio }),
        ...(updateData.socialLinks && { socialLinks: updateData.socialLinks }),
        ...(updateData.privacy && { privacy: updateData.privacy }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        bio: true,
        socialLinks: true,
        privacy: true,
      }
    });

    // 4. 관련 캐시 무효화
    await this.invalidateUserCache(userId);

    return {
      success: true,
      user: {
        ...updatedUser,
        socialLinks: updatedUser.socialLinks as SocialLinksDto,
        privacy: updatedUser.privacy as PrivacySettingsDto,
      }
    };
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return {
        success: false,
        user: null,
        errors: [{ field: 'username', message: '이미 사용 중인 닉네임입니다.' }]
      };
    }

    throw new InternalServerErrorException('프로필 업데이트 중 오류가 발생했습니다.');
  }
}

async checkUsernameAvailability(
  username: string,
  currentUserId?: string
): Promise<UsernameCheckResponse> {
  // 1. 기본 유효성 검사
  if (username.length < 2) {
    return {
      available: false,
      message: '닉네임은 최소 2자 이상이어야 합니다.'
    };
  }

  if (username.length > 20) {
    return {
      available: false,
      message: '닉네임은 최대 20자까지 가능합니다.'
    };
  }

  // 2. 허용되지 않는 문자 확인
  const usernameRegex = /^[a-zA-Z0-9가-힣_-]+$/;
  if (!usernameRegex.test(username)) {
    return {
      available: false,
      message: '닉네임은 한글, 영문, 숫자, _, -만 사용 가능합니다.'
    };
  }

  // 3. 예약어 확인
  const reservedWords = ['admin', 'root', 'system', 'null', 'undefined', 'api', 'www'];
  if (reservedWords.includes(username.toLowerCase())) {
    return {
      available: false,
      message: '사용할 수 없는 닉네임입니다.'
    };
  }

  // 4. 중복 확인
  const existingUser = await this.prisma.user.findUnique({
    where: { username },
    select: { id: true }
  });

  if (existingUser && existingUser.id !== currentUserId) {
    // 대체 제안 생성
    const suggestions = await this.generateUsernameSuggestions(username);

    return {
      available: false,
      message: '이미 사용 중인 닉네임입니다.',
      suggestions
    };
  }

  return {
    available: true,
    message: '사용 가능한 닉네임입니다.'
  };
}

private async generateUsernameSuggestions(baseUsername: string): Promise<string[]> {
  const suggestions: string[] = [];
  const variants = [
    `${baseUsername}${Math.floor(Math.random() * 1000)}`,
    `${baseUsername}_${Math.floor(Math.random() * 100)}`,
    `${baseUsername}${new Date().getFullYear()}`,
    `_${baseUsername}`,
    `${baseUsername}_`
  ];

  for (const variant of variants) {
    const exists = await this.prisma.user.findUnique({
      where: { username: variant },
      select: { id: true }
    });

    if (!exists && suggestions.length < 3) {
      suggestions.push(variant);
    }
  }

  return suggestions;
}

private async validateSocialLinks(socialLinks: SocialLinksDto): Promise<Array<{field: string, message: string}>> {
  const errors: Array<{field: string, message: string}> = [];

  // URL 형식 및 도메인 검증
  if (socialLinks.blog && !this.isValidUrl(socialLinks.blog)) {
    errors.push({ field: 'socialLinks.blog', message: '올바른 블로그 URL을 입력해주세요.' });
  }

  if (socialLinks.twitter && !this.isValidTwitterUrl(socialLinks.twitter)) {
    errors.push({ field: 'socialLinks.twitter', message: '올바른 Twitter URL을 입력해주세요.' });
  }

  if (socialLinks.instagram && !this.isValidInstagramUrl(socialLinks.instagram)) {
    errors.push({ field: 'socialLinks.instagram', message: '올바른 Instagram URL을 입력해주세요.' });
  }

  return errors;
}

private isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

private isValidTwitterUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/.test(url);
}

private isValidInstagramUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_\.]+\/?$/.test(url);
}
```

#### POST `/api/users/:userId/avatar` - 프로필 사진 업로드

```typescript
@Post(':userId/avatar')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('image', {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      callback(new BadRequestException('지원하지 않는 이미지 형식입니다.'), false);
    } else {
      callback(null, true);
    }
  },
}))
async updateAvatar(
  @Param('userId') userId: string,
  @UploadedFile() file: Express.Multer.File,
  @Body() cropData: AvatarCropDto,
  @Req() req: AuthRequest,
): Promise<UpdateAvatarResponse> {
  if (req.user.id !== userId) {
    throw new ForbiddenException('본인의 프로필 사진만 변경할 수 있습니다.');
  }

  if (!file) {
    throw new BadRequestException('이미지 파일이 필요합니다.');
  }

  return this.userService.updateAvatar(userId, file, cropData);
}
```

**Avatar Service 구현:**

```typescript
// packages/backend/src/modules/user/avatar.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as sharp from 'sharp';

@Injectable()
export class AvatarService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
    cropData?: AvatarCropDto
  ): Promise<UpdateAvatarResponse> {
    try {
      // 1. 이미지 처리 (크롭, 리사이즈)
      let processedBuffer = file.buffer;

      if (cropData) {
        processedBuffer = await this.cropImage(file.buffer, cropData);
      }

      // 2. 여러 크기 생성
      const sizes = await this.generateMultipleSizes(processedBuffer);

      // 3. Cloudinary 업로드
      const uploadPromises = Object.entries(sizes).map(([size, buffer]) =>
        this.uploadToCloudinary(buffer, `avatar_${userId}_${size}`)
      );

      const uploadResults = await Promise.all(uploadPromises);

      // 4. URL 생성
      const avatarUrls = {
        thumbnail: uploadResults[0].secure_url, // 50x50
        small: uploadResults[1].secure_url,     // 100x100
        medium: uploadResults[2].secure_url,    // 200x200
        large: uploadResults[3].secure_url,     // 400x400
      };

      return {
        success: true,
        profileImage: avatarUrls.medium, // 기본 프로필 이미지
        sizes: avatarUrls,
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new InternalServerErrorException('프로필 사진 업로드 중 오류가 발생했습니다.');
    }
  }

  private async cropImage(buffer: Buffer, cropData: AvatarCropDto): Promise<Buffer> {
    return await sharp(buffer)
      .extract({
        left: Math.round(cropData.x),
        top: Math.round(cropData.y),
        width: Math.round(cropData.width),
        height: Math.round(cropData.height),
      })
      .toBuffer();
  }

  private async generateMultipleSizes(buffer: Buffer): Promise<{[key: string]: Buffer}> {
    const sizes = [
      { name: 'thumbnail', size: 50 },
      { name: 'small', size: 100 },
      { name: 'medium', size: 200 },
      { name: 'large', size: 400 },
    ];

    const results: {[key: string]: Buffer} = {};

    for (const { name, size } of sizes) {
      results[name] = await sharp(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    return results;
  }

  private async uploadToCloudinary(buffer: Buffer, publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: 'readzone/avatars',
          resource_type: 'image',
          format: 'jpg',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });
  }
}
```

## 🎨 Frontend 구현사항

### 1. 프로필 편집 모달

```typescript
// packages/frontend/src/components/profile/ProfileEditModal.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { updateProfile } from '../../lib/api/user';
import { toast } from '../../lib/toast';
import { AvatarEditSection } from './AvatarEditSection';
import { PrivacySettingsSection } from './PrivacySettingsSection';

const profileSchema = z.object({
  username: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .max(20, '닉네임은 최대 20자까지 가능합니다.')
    .regex(/^[a-zA-Z0-9가-힣_-]+$/, '한글, 영문, 숫자, _, -만 사용 가능합니다.'),
  bio: z
    .string()
    .max(500, '자기소개는 최대 500자까지 가능합니다.')
    .optional(),
  socialLinks: z.object({
    blog: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('')),
    twitter: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('')),
    instagram: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('')),
  }).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditModalProps {
  user: {
    id: string;
    username: string;
    bio?: string;
    profileImage?: string;
    socialLinks?: {
      blog?: string;
      twitter?: string;
      instagram?: string;
    };
    privacy?: {
      emailVisible: boolean;
      activityVisible: 'all' | 'followers' | 'none';
      followersVisible: boolean;
      likesVisible: 'all' | 'followers' | 'none';
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  user,
  isOpen,
  onClose
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'privacy'>('profile');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username,
      bio: user.bio || '',
      socialLinks: {
        blog: user.socialLinks?.blog || '',
        twitter: user.socialLinks?.twitter || '',
        instagram: user.socialLinks?.instagram || '',
      },
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => updateProfile(user.id, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('프로필이 성공적으로 업데이트되었습니다.');
        queryClient.invalidateQueries({ queryKey: ['user', 'profile', user.id] });
        reset(data.user);
        onClose();
      } else {
        // 서버 에러 처리
        data.errors?.forEach(error => {
          toast.error(error.message);
        });
      }
    },
    onError: () => {
      toast.error('프로필 업데이트 중 오류가 발생했습니다.');
    },
  });

  const handleSave = (data: ProfileFormData) => {
    // 빈 문자열을 undefined로 변환
    const cleanData = {
      ...data,
      bio: data.bio?.trim() || undefined,
      socialLinks: {
        blog: data.socialLinks?.blog?.trim() || undefined,
        twitter: data.socialLinks?.twitter?.trim() || undefined,
        instagram: data.socialLinks?.instagram?.trim() || undefined,
      },
    };

    updateMutation.mutate(cleanData);
  };

  const handleClose = () => {
    if (isDirty) {
      if (confirm('변경사항이 저장되지 않았습니다. 정말 닫으시겠습니까?')) {
        reset();
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          프로필 편집
        </h2>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {[
            { id: 'profile', label: '기본 정보' },
            { id: 'avatar', label: '프로필 사진' },
            { id: 'privacy', label: '개인정보 설정' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            {/* 닉네임 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                닉네임
              </label>
              <Input
                id="username"
                {...register('username')}
                error={errors.username?.message}
                placeholder="닉네임을 입력하세요"
              />
              <UsernameAvailabilityChecker
                username={watch('username')}
                currentUserId={user.id}
              />
            </div>

            {/* 자기소개 */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                자기소개
              </label>
              <Textarea
                id="bio"
                {...register('bio')}
                error={errors.bio?.message}
                placeholder="자기소개를 입력하세요"
                rows={4}
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {watch('bio')?.length || 0}/500
              </div>
            </div>

            {/* 소셜 링크 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                소셜 링크
              </h3>

              <div>
                <label htmlFor="blog" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  블로그
                </label>
                <Input
                  id="blog"
                  {...register('socialLinks.blog')}
                  error={errors.socialLinks?.blog?.message}
                  placeholder="https://your-blog.com"
                />
              </div>

              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Twitter
                </label>
                <Input
                  id="twitter"
                  {...register('socialLinks.twitter')}
                  error={errors.socialLinks?.twitter?.message}
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instagram
                </label>
                <Input
                  id="instagram"
                  {...register('socialLinks.instagram')}
                  error={errors.socialLinks?.instagram?.message}
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending ? '저장 중...' : '저장하기'}
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'avatar' && (
          <AvatarEditSection
            userId={user.id}
            currentImage={user.profileImage}
            onImageUpdate={(newImageUrl) => {
              queryClient.invalidateQueries({ queryKey: ['user', 'profile', user.id] });
              toast.success('프로필 사진이 업데이트되었습니다.');
            }}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacySettingsSection
            userId={user.id}
            currentSettings={user.privacy}
            onSettingsUpdate={(newSettings) => {
              queryClient.invalidateQueries({ queryKey: ['user', 'profile', user.id] });
              toast.success('개인정보 설정이 업데이트되었습니다.');
            }}
          />
        )}
      </div>
    </Modal>
  );
};
```

### 2. 닉네임 중복 확인 컴포넌트

```typescript
// packages/frontend/src/components/profile/UsernameAvailabilityChecker.tsx
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkUsernameAvailability } from '../../lib/api/user';
import { useDebounce } from '../../hooks/useDebounce';

interface UsernameAvailabilityCheckerProps {
  username: string;
  currentUserId: string;
}

export const UsernameAvailabilityChecker: React.FC<UsernameAvailabilityCheckerProps> = ({
  username,
  currentUserId
}) => {
  const debouncedUsername = useDebounce(username, 500);
  const [shouldCheck, setShouldCheck] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['username-check', debouncedUsername],
    queryFn: () => checkUsernameAvailability(debouncedUsername),
    enabled: shouldCheck && debouncedUsername.length >= 2,
    staleTime: 0, // 항상 최신 상태 확인
  });

  useEffect(() => {
    // 사용자가 입력을 시작했을 때만 체크
    setShouldCheck(username.length >= 2);
  }, [username]);

  if (!shouldCheck || debouncedUsername.length < 2) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center mt-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
        확인 중...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`mt-2 text-sm ${data.available ? 'text-green-600' : 'text-red-600'}`}>
      <div className="flex items-center">
        {data.available ? (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
        {data.message}
      </div>

      {/* 대체 제안 표시 */}
      {!data.available && data.suggestions && data.suggestions.length > 0 && (
        <div className="mt-2">
          <span className="text-gray-600 dark:text-gray-400">추천: </span>
          {data.suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-2 underline"
              onClick={() => {
                // 부모 폼에 값 설정 (react-hook-form setValue 사용)
                // 이 부분은 부모 컴포넌트에서 콜백으로 처리
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3. 프로필 사진 편집 컴포넌트

```typescript
// packages/frontend/src/components/profile/AvatarEditSection.tsx
import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '../ui/Button';
import { updateAvatar } from '../../lib/api/user';
import { toast } from '../../lib/toast';

interface AvatarEditSectionProps {
  userId: string;
  currentImage?: string;
  onImageUpdate: (newImageUrl: string) => void;
}

export const AvatarEditSection: React.FC<AvatarEditSectionProps> = ({
  userId,
  currentImage,
  onImageUpdate
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCropper, setShowCropper] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const uploadMutation = useMutation({
    mutationFn: ({ file, cropData }: { file: File; cropData?: any }) =>
      updateAvatar(userId, file, cropData),
    onSuccess: (data) => {
      if (data.success) {
        onImageUpdate(data.profileImage);
        setShowCropper(false);
        setSelectedFile(null);
        setImageSrc('');
      }
    },
    onError: () => {
      toast.error('프로필 사진 업로드 중 오류가 발생했습니다.');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 형식 검증
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      toast.error('JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    setSelectedFile(file);

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async () => {
    if (!selectedFile || !completedCrop || !imageRef.current) {
      return;
    }

    const cropData = {
      x: completedCrop.x,
      y: completedCrop.y,
      width: completedCrop.width,
      height: completedCrop.height,
    };

    uploadMutation.mutate({ file: selectedFile, cropData });
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;

    // 기본 크롭 영역을 이미지 중앙에 정사각형으로 설정
    const cropSize = Math.min(width, height) * 0.8;
    const x = (width - cropSize) / 2;
    const y = (height - cropSize) / 2;

    setCrop({
      unit: 'px',
      x,
      y,
      width: cropSize,
      height: cropSize,
    });
  };

  return (
    <div className="space-y-6">
      {/* 현재 프로필 사진 */}
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {currentImage ? (
            <img
              src={currentImage}
              alt="현재 프로필"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          )}
        </div>

        <div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            사진 선택
          </Button>
          <p className="text-sm text-gray-500 mt-1">
            JPG, PNG, WebP (최대 5MB)
          </p>
        </div>
      </div>

      {/* 파일 선택 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 이미지 크롭 영역 */}
      {showCropper && imageSrc && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">이미지 크롭</h3>

          <div className="max-w-md mx-auto">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1} // 정사각형 비율
              minWidth={100}
              minHeight={100}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="크롭할 이미지"
                onLoad={handleImageLoad}
                className="max-w-full h-auto"
              />
            </ReactCrop>
          </div>

          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCropper(false);
                setSelectedFile(null);
                setImageSrc('');
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? '업로드 중...' : '적용하기'}
            </Button>
          </div>
        </div>
      )}

      {/* 드래그 앤 드롭 영역 */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files[0];
          if (file) {
            handleFileSelect({ target: { files: [file] } } as any);
          }
        }}
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">클릭하여 업로드</span> 또는 파일을 드래그하세요
        </p>
        <p className="text-xs text-gray-500">JPG, PNG, WebP 최대 5MB</p>
      </div>
    </div>
  );
};
```

## 🧪 테스트 계획

### Backend 테스트

```typescript
// packages/backend/test/profile-edit.e2e-spec.ts
describe('Profile Edit (e2e)', () => {
  describe('PUT /users/:userId/profile', () => {
    it('프로필 정보 수정 성공', async () => {
      const updateData = {
        username: 'newusername',
        bio: '새로운 자기소개',
        socialLinks: {
          blog: 'https://myblog.com',
        },
      };

      const response = await request(app.getHttpServer())
        .put(`/users/${testUser.id}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('newusername');
    });

    it('중복 닉네임 사용 시 오류', async () => {
      const response = await request(app.getHttpServer())
        .put(`/users/${testUser.id}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: existingUser.username })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual({
        field: 'username',
        message: expect.stringContaining('이미 사용 중인')
      });
    });

    it('타인 프로필 수정 시도 시 접근 거부', async () => {
      await request(app.getHttpServer())
        .put(`/users/${otherUser.id}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: 'hacked' })
        .expect(403);
    });
  });

  describe('GET /users/check-username/:username', () => {
    it('사용 가능한 닉네임', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/check-username/availableusername')
        .expect(200);

      expect(response.body.available).toBe(true);
      expect(response.body.message).toContain('사용 가능한');
    });

    it('중복 닉네임 확인', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/check-username/${existingUser.username}`)
        .expect(200);

      expect(response.body.available).toBe(false);
      expect(response.body.suggestions).toBeInstanceOf(Array);
    });
  });
});
```

### Frontend 테스트

```typescript
// packages/frontend/src/components/profile/__tests__/ProfileEditModal.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileEditModal } from '../ProfileEditModal';

describe('ProfileEditModal', () => {
  it('프로필 정보를 올바르게 표시한다', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      bio: '테스트 자기소개',
      socialLinks: {
        blog: 'https://test.com',
      },
    };

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ProfileEditModal
          user={mockUser}
          isOpen={true}
          onClose={jest.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('테스트 자기소개')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://test.com')).toBeInTheDocument();
  });

  it('닉네임 유효성 검사가 동작한다', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ProfileEditModal
          user={{ id: '1', username: 'test' }}
          isOpen={true}
          onClose={jest.fn()}
        />
      </QueryClientProvider>
    );

    const usernameInput = screen.getByLabelText('닉네임');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'a'); // 너무 짧음

    await waitFor(() => {
      expect(screen.getByText(/최소 2자 이상/)).toBeInTheDocument();
    });
  });
});
```

## 📊 성능 최적화

### 1. 파일 업로드 최적화

- **클라이언트 사이드 리사이징**: 업로드 전 이미지 크기 조정
- **Progressive 업로드**: 작은 이미지부터 순차 업로드
- **CDN 캐싱**: Cloudinary 자동 최적화 활용

### 2. 폼 최적화

- **Debounced Validation**: 닉네임 중복 확인 지연 처리
- **Optimistic Updates**: 로컬 상태 즉시 반영
- **Smart Re-rendering**: 필요한 부분만 리렌더링

### 3. 이미지 처리 최적화

- **Web Workers**: 이미지 크롭 처리 분리
- **Canvas 최적화**: 메모리 효율적인 이미지 조작
- **Multiple Sizes**: 용도별 최적화된 이미지 크기 제공

## ✅ 완료 기준

### Backend
- [ ] 프로필 정보 수정 API 구현 완료
- [ ] 프로필 사진 업로드/크롭 API 구현 완료
- [ ] 닉네임 중복 확인 API 구현 완료
- [ ] Cloudinary 연동 및 다중 크기 이미지 생성
- [ ] 개인정보 설정 저장/조회 기능
- [ ] E2E 테스트 모든 시나리오 통과

### Frontend
- [ ] ProfileEditModal 컴포넌트 구현 완료
- [ ] AvatarEditSection 컴포넌트 구현 완료
- [ ] 실시간 닉네임 중복 확인 기능
- [ ] 이미지 크롭 및 미리보기 기능
- [ ] 폼 유효성 검사 및 에러 처리
- [ ] 개인정보 설정 UI

### 통합
- [ ] 프로필 수정 후 즉시 반영
- [ ] 이미지 업로드 성능 최적화 (< 3초)
- [ ] 폼 입력 응답성 (< 100ms)
- [ ] 에러 처리 및 사용자 피드백 완료
- [ ] 접근성 표준 준수

## 🔄 다음 Phase 연결

Phase 4 완료 후 Phase 5(고급 기능 및 최적화)로 진행:
- 배지 시스템 구현
- 성능 최적화 (캐싱, 가상화)
- SEO 및 소셜 공유 최적화
- 추가 보안 강화

---

**예상 소요 시간**: 2-3주
**의존성**: Phase 1,2,3 완료, Cloudinary 설정
**다음 Phase**: Phase 5 - 고급 기능 및 최적화