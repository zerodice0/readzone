import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchBookDto {
  @IsString()
  @MinLength(2, { message: '검색어는 최소 2자 이상이어야 합니다' })
  q!: string;

  @IsOptional()
  @IsEnum(['google', 'aladin', 'all'])
  source?: 'google' | 'aladin' | 'all' = 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}
