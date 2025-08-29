import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString({ message: '아이디를 입력해주세요.' })
  @Length(3, 30, { message: '아이디는 3자 이상 30자 이하로 입력해주세요.' })
  @Matches(/^[a-z0-9_-]+$/, {
    message: '아이디는 영문 소문자, 숫자, _, - 만 사용 가능합니다.',
  })
  userid: string;

  @IsString({ message: '비밀번호를 입력해주세요.' })
  password: string;
}
