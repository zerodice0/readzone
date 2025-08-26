import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum FeedTab {
  RECOMMENDED = 'recommended',
  LATEST = 'latest',
  FOLLOWING = 'following',
}

export class FeedQueryDto {
  @IsEnum(FeedTab)
  @IsOptional()
  tab: FeedTab = FeedTab.RECOMMENDED;

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
