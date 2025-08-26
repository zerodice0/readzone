import { IsEnum } from 'class-validator';

export enum LikeAction {
  LIKE = 'like',
  UNLIKE = 'unlike',
}

export class LikeActionDto {
  @IsEnum(LikeAction)
  action: LikeAction;
}
