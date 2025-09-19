import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasAvatar?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minFollowers?: number;

  @IsOptional()
  @IsEnum(['relevance', 'followers', 'reviews', 'activity'])
  sort?: 'relevance' | 'followers' | 'reviews' | 'activity' = 'relevance';

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export interface UserSearchResult {
  id: string;
  username: string;
  bio?: string;
  profileImage?: string;

  stats: {
    reviewCount: number;
    followerCount: number;
    followingCount: number;
    likesReceived: number;
  };

  recentActivity: {
    lastReviewAt?: string;
    lastActiveAt: string;
  };

  isFollowing?: boolean; // Only for logged-in users

  highlights?: {
    username?: string;
    bio?: string;
  };
}

export interface UserSearchResponse {
  users: UserSearchResult[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
}
