import {
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
  IsDateString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreateManualBookDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(300)
  author: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  publisher?: string;

  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  isbn?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  coverImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  genre?: string[];
}
