import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsUrl,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
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
  @MinLength(2, { message: '사용자 ID는 최소 2자 이상이어야 합니다.' })
  @MaxLength(30, { message: '사용자 ID는 최대 30자까지 가능합니다.' })
  userid?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '닉네임은 최대 50자까지 가능합니다.' })
  nickname?: string;

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
  user?: {
    id: string;
    userid: string;
    nickname: string;
    bio?: string;
    socialLinks?: SocialLinksDto;
    privacy?: PrivacySettingsDto;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface UseridCheckResponse {
  available: boolean;
  message: string;
  suggestions?: string[]; // 사용 불가능한 경우 대체 제안
}

export class AvatarCropDto {
  @IsOptional()
  x?: number;

  @IsOptional()
  y?: number;

  @IsOptional()
  width?: number;

  @IsOptional()
  height?: number;
}

export interface UpdateAvatarResponse {
  success: boolean;
  profileImage: string; // 기본 프로필 이미지 URL
  sizes: {
    thumbnail: string; // 50x50
    small: string; // 100x100
    medium: string; // 200x200
    large: string; // 400x400
  };
}
