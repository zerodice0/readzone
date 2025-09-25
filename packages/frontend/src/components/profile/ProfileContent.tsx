import React from 'react';
import { ReviewsList } from './content/ReviewsList';
import { LikedReviewsList } from './content/LikedReviewsList';
import { BooksList } from './content/BooksList';
import { FollowsList } from './content/FollowsList';
import { ProfileBadges } from './badges/ProfileBadges';

interface ProfileContentProps {
  activeTab: string;
  userid: string;
  isOwner: boolean;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  activeTab,
  userid,
  isOwner
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'reviews':
        return <ReviewsList userid={userid} isOwner={isOwner} />;
      case 'likes':
        return isOwner ? <LikedReviewsList userid={userid} /> : null;
      case 'books':
        return <BooksList userid={userid} isOwner={isOwner} />;
      case 'badges':
        return <ProfileBadges userid={userid} isOwner={isOwner} />;
      case 'followers':
        return <FollowsList userid={userid} type="followers" />;
      case 'following':
        return <FollowsList userid={userid} type="following" />;
      default:
        return null;
    }
  };

  return (
    <div
      role="tabpanel"
      id={`${activeTab}-panel`}
      aria-labelledby={`${activeTab}-tab`}
    >
      {renderContent()}
    </div>
  );
};