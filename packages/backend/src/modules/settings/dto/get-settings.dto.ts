export class UserSettingsResponseDto {
  user: {
    id: string;
    userid: string;
    nickname: string;
    email: string;
    bio?: string;
    profileImage?: string;
    createdAt: string;
  };

  privacy: {
    profileVisibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
    activityVisibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
    searchable: boolean;
    showEmail: boolean;
    showFollowers: boolean;
    showFollowing: boolean;
  };

  notifications: {
    likes: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
    comments: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
    follows: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };

  preferences: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    language: 'KO' | 'EN';
  };
}
