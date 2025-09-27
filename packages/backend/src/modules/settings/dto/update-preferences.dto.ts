import { IsOptional, IsEnum, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
}

enum Language {
  KO = 'KO',
  EN = 'EN',
}

enum FeedTab {
  RECOMMENDED = 'RECOMMENDED',
  LATEST = 'LATEST',
  FOLLOWING = 'FOLLOWING',
}

enum ImageQuality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

class ContentFilterDto {
  @IsOptional()
  @IsBoolean()
  hideNSFW?: boolean;

  @IsOptional()
  @IsBoolean()
  hideSpoilers?: boolean;

  @IsOptional()
  @IsBoolean()
  hideNegativeReviews?: boolean;
}

class DataUsageDto {
  @IsOptional()
  @IsEnum(ImageQuality)
  imageQuality?: ImageQuality;

  @IsOptional()
  @IsBoolean()
  autoplayVideos?: boolean;

  @IsOptional()
  @IsBoolean()
  preloadImages?: boolean;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(FeedTab)
  defaultFeedTab?: FeedTab;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContentFilterDto)
  contentFilter?: ContentFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DataUsageDto)
  dataUsage?: DataUsageDto;
}
