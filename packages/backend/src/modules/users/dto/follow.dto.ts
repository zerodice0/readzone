import { IsEnum } from 'class-validator';

export class FollowUserDto {
  @IsEnum(['follow', 'unfollow'])
  action: 'follow' | 'unfollow';
}

export interface FollowUserResponse {
  success: boolean;
  relationship: {
    isFollowing: boolean;
    isFollowedBy: boolean;
    isMutualFollow: boolean;
  };
  followerCount: number;
}
