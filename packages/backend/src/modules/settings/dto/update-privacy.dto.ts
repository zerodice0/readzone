import { IsOptional, IsEnum, IsBoolean } from 'class-validator';

enum VisibilityLevel {
  PUBLIC = 'PUBLIC',
  FOLLOWERS = 'FOLLOWERS',
  PRIVATE = 'PRIVATE',
}

export class UpdatePrivacyDto {
  @IsOptional()
  @IsEnum(VisibilityLevel)
  profileVisibility?: VisibilityLevel;

  @IsOptional()
  @IsEnum(VisibilityLevel)
  activityVisibility?: VisibilityLevel;

  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  showFollowers?: boolean;

  @IsOptional()
  @IsBoolean()
  showFollowing?: boolean;
}
