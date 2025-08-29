import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: '사용자 ID는 최소 2자 이상이어야 합니다.' })
  @MaxLength(30, { message: '사용자 ID는 최대 30자까지 입력할 수 있습니다.' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '사용자 ID는 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.',
  })
  userid: string;

  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @MaxLength(320, { message: '이메일은 최대 320자까지 입력할 수 있습니다.' })
  email: string;

  @IsString()
  @MaxLength(50, { message: '닉네임은 최대 50자까지 입력할 수 있습니다.' })
  nickname: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(64, { message: '비밀번호는 최대 64자까지 입력할 수 있습니다.' })
  @Matches(
    /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=[\]{}|;:,.<>?]+$/,
    {
      message:
        '비밀번호는 소문자, 숫자, 특수문자(!@#$%^&*()_+-=[]{}|;:,.<>?)를 각각 최소 1개씩 포함해야 합니다.',
    },
  )
  password: string;
}
