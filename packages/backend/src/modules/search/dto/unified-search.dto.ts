import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
  IsDateString,
  Min,
  Max,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PublishYearRangeDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value) : (value as number),
  )
  @Min(1900)
  @Max(new Date().getFullYear())
  from?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value) : (value as number),
  )
  @Min(1900)
  @Max(new Date().getFullYear())
  to?: number;
}

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class SearchFiltersDto {
  // Book filters
  @IsOptional()
  @ValidateNested()
  @Type(() => PublishYearRangeDto)
  publishYear?: PublishYearRangeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genre?: string[];

  // Review filters
  @IsOptional()
  @IsIn(['recommend', 'not_recommend'])
  rating?: 'recommend' | 'not_recommend';

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value) : (value as number),
  )
  @Min(0)
  minLikes?: number;

  // User filters
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value === 'true' : (value as boolean),
  )
  hasAvatar?: boolean;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value) : (value as number),
  )
  @Min(0)
  minFollowers?: number;
}

export class UnifiedSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsIn(['all', 'books', 'reviews', 'users'])
  type: 'all' | 'books' | 'reviews' | 'users' = 'all';

  @IsOptional()
  @IsIn(['relevance', 'newest', 'oldest', 'popularity'])
  sort: string = 'relevance';

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value) : (value as number),
  )
  @Min(1)
  @Max(50)
  limit: number = 20;
}
