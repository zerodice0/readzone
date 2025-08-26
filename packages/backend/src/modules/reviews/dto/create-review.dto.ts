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
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @MinLength(1, { message: 'Book ID is required' })
  bookId: string;

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
