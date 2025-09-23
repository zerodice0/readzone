import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { followUser } from '@/lib/api/user';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  userid: string;
  isFollowing: boolean;
  followerCount: number;
  isMutualFollow?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  showFollowerCount?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userid,
  isFollowing,
  followerCount,
  isMutualFollow = false,
  disabled = false,
  size = 'default',
  showFollowerCount = false
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [optimisticState, setOptimisticState] = useState({
    isFollowing,
    followerCount,
  });

  const followMutation = useMutation({
    mutationFn: (action: 'follow' | 'unfollow') => followUser(userid, action),
    onMutate: async (action) => {
      // 낙관적 업데이트
      const newFollowState = action === 'follow';
      const newCount = newFollowState
        ? optimisticState.followerCount + 1
        : optimisticState.followerCount - 1;

      setOptimisticState({
        isFollowing: newFollowState,
        followerCount: newCount,
      });

      // 기존 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['user', 'profile', userid] });

      // 기존 데이터 백업
      const previousData = queryClient.getQueryData(['user', 'profile', userid]);

      // 낙관적 업데이트 적용
      queryClient.setQueryData(['user', 'profile', userid], (old: unknown) => {
        if (!old) {
          return old;
        }

        const oldData = old as {
          relationship?: { isFollowedBy?: boolean };
          user: { stats: { followerCount: number } };
        };

        return {
          ...oldData,
          relationship: {
            ...oldData.relationship,
            isFollowing: newFollowState,
            isMutualFollow: newFollowState && oldData.relationship?.isFollowedBy,
          },
          user: {
            ...oldData.user,
            stats: {
              ...oldData.user.stats,
              followerCount: newCount,
            }
          }
        };
      });

      return { previousData };
    },
    onError: (_error, variables, context) => {
      // 실패 시 롤백
      if (context?.previousData) {
        queryClient.setQueryData(['user', 'profile', userid], context.previousData);
      }
      setOptimisticState({ isFollowing, followerCount });

      toast({
        title: "오류가 발생했습니다",
        description: variables === 'follow'
          ? '팔로우 처리 중 오류가 발생했습니다.'
          : '언팔로우 처리 중 오류가 발생했습니다.',
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      // 서버 응답으로 최종 상태 업데이트
      setOptimisticState({
        isFollowing: data.relationship.isFollowing,
        followerCount: data.followerCount,
      });

      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['user', 'profile', userid] });
      queryClient.invalidateQueries({ queryKey: ['user', 'follows', userid] });

      toast({
        title: data.relationship.isFollowing ? "팔로우 완료" : "언팔로우 완료",

        description: data.relationship.isFollowing
          ? `@${userid}님을 팔로우하기 시작했습니다.`
          : `@${userid}님 팔로우를 취소했습니다.`,
      });
    },
  });

  const handleFollowClick = () => {
    const action = optimisticState.isFollowing ? 'unfollow' : 'follow';

    followMutation.mutate(action);
  };

  const buttonText = optimisticState.isFollowing ? '언팔로우' : '팔로우';
  const buttonVariant = optimisticState.isFollowing ? 'outline' : 'default';

  return (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant={buttonVariant}
        size={size}
        onClick={handleFollowClick}
        disabled={disabled || followMutation.isPending}
        className="min-w-[100px]"
      >
        {followMutation.isPending ? '처리중...' : buttonText}
      </Button>

      {/* 상호 팔로우 표시 */}
      {isMutualFollow && optimisticState.isFollowing && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          서로 팔로우
        </span>
      )}

      {/* 팔로워 수 표시 */}
      {showFollowerCount && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          팔로워 {optimisticState.followerCount.toLocaleString()}명
        </span>
      )}
    </div>
  );
};