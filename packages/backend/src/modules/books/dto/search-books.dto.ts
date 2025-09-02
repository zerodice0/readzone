import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchBooksDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value) : (value as number),
  )
  @Min(1)
  @Max(100)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value) : (value as number),
  )
  @Min(1)
  @Max(50)
  size: number = 10;

  @IsOptional()
  @IsIn(['db', 'kakao'])
  source?: 'db' | 'kakao';
}
