import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Heart, UserCheck, UserPlus, Users } from 'lucide-react';
import type { UserSearchResult } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';

interface UserSearchResultCardProps {
  user: UserSearchResult;
  currentUserId?: string;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
}

export function UserSearchResultCard({
  user,
  currentUserId,
  onFollow,
  onUnfollow,
}: UserSearchResultCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      // Redirect to login or show login modal
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow?.(user.id);
        setIsFollowing(false);
      } else {
        await onFollow?.(user.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* User Avatar */}
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profileImage} alt={user.nickname} />
            <AvatarFallback>
              {user.nickname.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 space-y-2">
            <div>
              <Link
                to="/profile/$userid"
                params={{ userid: user.id }}
                className="text-lg font-semibold hover:underline"
              >
                {user.highlights?.nickname ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: user.highlights.nickname,
                    }}
                  />
                ) : (
                  user.nickname
                )}
              </Link>
              {user.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {user.highlights?.bio ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: user.highlights.bio,
                      }}
                    />
                  ) : (
                    user.bio
                  )}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {user.stats.reviewCount} 독후감
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {user.stats.followerCount} 팔로워
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {user.stats.likesReceived} 좋아요
              </span>
            </div>

            {/* Activity */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {user.recentActivity.lastReviewAt && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  최근 독후감:{' '}
                  {formatDistanceToNow(new Date(user.recentActivity.lastReviewAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                최근 활동:{' '}
                {formatDistanceToNow(new Date(user.recentActivity.lastActiveAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {user.stats.followerCount > 100 && (
                  <Badge variant="secondary" className="text-xs">
                    인기 유저
                  </Badge>
                )}
                {user.stats.reviewCount > 50 && (
                  <Badge variant="secondary" className="text-xs">
                    열정 독서가
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Link to="/profile/$userid" params={{ userid: user.id }}>
                  <Button variant="outline" size="sm">
                    프로필 보기
                  </Button>
                </Link>
                {currentUserId && currentUserId !== user.id && (
                  <Button
                    variant={isFollowing ? 'secondary' : 'default'}
                    size="sm"
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                    className="min-w-[80px]"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-1" />
                        팔로잉
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        팔로우
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}