export interface SocialLinks {
  blog?: string;
  twitter?: string;
  instagram?: string;
}

export interface UserStats {
  reviewCount: number;
  likesReceived: number;
  followerCount: number;
  followingCount: number;
  booksRead: number;
}

export interface UserRelationship {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutualFollow: boolean;
}

export interface RecentActivity {
  lastReviewAt?: string;
  lastActiveAt: string;
  streakDays: number;
}

export interface UserProfileResponse {
  user: {
    id: string;
    userid: string;
    nickname: string;
    bio?: string;
    profileImage?: string;
    socialLinks?: SocialLinks;
    joinedAt: string;
    stats: UserStats;
    recentActivity: RecentActivity;
    isVerified: boolean;
  };
  relationship?: UserRelationship;
  isOwner: boolean;
}

export class UserProfileDto {
  user: {
    id: string;
    userid: string;
    nickname: string;
    bio?: string;
    profileImage?: string;
    socialLinks?: SocialLinks;
    joinedAt: string;
    stats: UserStats;
    recentActivity: RecentActivity;
    isVerified: boolean;
  };
  relationship?: UserRelationship;
  isOwner: boolean;
}
