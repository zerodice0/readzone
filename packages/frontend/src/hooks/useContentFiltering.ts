import { useQuery } from '@tanstack/react-query';
import { getMyBlocks } from '@/lib/api/moderation';

/**
 * 차단한 사용자 콘텐츠를 필터링하는 커스텀 훅
 *
 * @returns {Object} 차단 관련 데이터 및 유틸리티 함수
 * @property {Set<string>} blockedUserIds - 차단한 사용자 ID Set
 * @property {boolean} isLoading - 차단 목록 로딩 중 여부
 * @property {Function} isUserBlocked - 특정 사용자가 차단되었는지 확인하는 함수
 * @property {Function} shouldFilterContent - 콘텐츠를 필터링해야 하는지 확인하는 함수
 */
export function useContentFiltering() {
  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['my-blocks'],
    queryFn: getMyBlocks,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    retry: false,
  });

  // 차단한 사용자 ID들을 Set으로 변환 (O(1) 조회 성능)
  const blockedUserIds = new Set(blocks.map((block) => block.blockedId));

  /**
   * 특정 사용자가 차단되었는지 확인
   * @param userId - 확인할 사용자 ID
   * @returns 차단 여부
   */
  const isUserBlocked = (userId: string): boolean => {
    return blockedUserIds.has(userId);
  };

  /**
   * 콘텐츠를 필터링해야 하는지 확인
   * @param userId - 콘텐츠 작성자 ID
   * @returns 필터링 여부 (true면 콘텐츠를 숨김)
   */
  const shouldFilterContent = (userId: string): boolean => {
    return isUserBlocked(userId);
  };

  return {
    blockedUserIds,
    isLoading,
    isUserBlocked,
    shouldFilterContent,
    refetch: () => {
      // 차단/해제 후 목록 갱신을 위한 함수
    },
  };
}
