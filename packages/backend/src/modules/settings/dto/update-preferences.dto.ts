import { IsOptional, IsEnum } from 'class-validator';

enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
}

enum Language {
  KO = 'KO',
  EN = 'EN',
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}
