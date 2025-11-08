import {
  IsString,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ReadStatus, ReviewStatus } from '@prisma/client';

export class CreateReviewDto {
  @IsUUID('4', { message: 'Invalid book ID format' })
  bookId!: string;

  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @IsString({ message: 'Content must be a string' })
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  @MaxLength(10000, { message: 'Content must not exceed 10,000 characters' })
  content!: string;

  @IsOptional()
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating?: number;

  @IsBoolean({ message: 'isRecommended must be a boolean' })
  isRecommended!: boolean;

  @IsEnum(ReadStatus, { message: 'Invalid read status' })
  readStatus!: ReadStatus;

  @IsOptional()
  @IsEnum(ReviewStatus, { message: 'Invalid review status' })
  status?: ReviewStatus;
}
