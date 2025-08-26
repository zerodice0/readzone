import { IsString, MinLength, MaxLength } from 'class-validator';

export class GetUserProfileDto {
  @IsString()
  @MinLength(3, { message: '사용자 ID는 최소 3자 이상이어야 합니다.' })
  @MaxLength(30, { message: '사용자 ID는 최대 30자까지 입력할 수 있습니다.' })
  userid: string;
}
