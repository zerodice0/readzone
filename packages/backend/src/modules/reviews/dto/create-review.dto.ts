import {
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsInt,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class BookDataDto {
  @IsOptional()
  @IsString()
  isbn?: string;

  @IsString()
  @MinLength(1, { message: 'Book title is required' })
  title: string;

  @IsString()
  @MinLength(1, { message: 'Book author is required' })
  author: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateReviewDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Book ID must not be empty' })
  bookId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BookDataDto)
  bookData?: BookDataDto;

  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(200, { message: 'Title too long' })
  title: string;

  @IsString()
  @MinLength(1, { message: 'Content is required' })
  content: string;

  @IsBoolean()
  @IsOptional()
  isRecommended: boolean = true;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPublic: boolean = true;
}
