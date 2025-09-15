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

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(200, { message: 'Title too long' })
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Content is required' })
  content?: string;

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

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

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
