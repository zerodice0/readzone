import {
  IsOptional,
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CheckDuplicateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  userid?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}
