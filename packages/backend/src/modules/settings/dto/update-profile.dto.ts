import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '닉네임은 최대 50자까지 입력할 수 있습니다.' })
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  profileImage?: string;
}

export class UpdateProfileResponseDto {
  success: boolean;
  user: {
    nickname: string;
    bio?: string;
    profileImage?: string;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
