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
  @MinLength(2)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  profileImage?: string;
}

export class UpdateProfileResponseDto {
  success: boolean;
  user: {
    username: string;
    bio?: string;
    profileImage?: string;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
