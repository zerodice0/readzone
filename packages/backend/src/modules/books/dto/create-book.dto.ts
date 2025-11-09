import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsISO8601,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  externalId!: string;

  @IsEnum(['GOOGLE_BOOKS', 'ALADIN', 'MANUAL'])
  externalSource!: 'GOOGLE_BOOKS' | 'ALADIN' | 'MANUAL';

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsString()
  title!: string;

  @IsString()
  author!: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsISO8601()
  publishedDate?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageCount?: number;

  @IsOptional()
  @IsString()
  language?: string;
}
