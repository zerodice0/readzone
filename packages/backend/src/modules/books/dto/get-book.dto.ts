import { IsString } from 'class-validator';

export class GetBookDto {
  @IsString()
  id: string;
}
