import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchSuggestionsDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value) : (value as number),
  )
  @Min(1)
  @Max(20)
  limit: number = 10;
}
