import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class BlockUserDto {
  @IsString()
  @IsNotEmpty()
  blockedId: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
