import type { FC } from 'react';
import type { BadgeData } from './BadgeItem';

interface BadgeProgressModalProps {
  badge: BadgeData | null;
  isOpen: boolean;
  onClose: () => void;
}

const tierInfo = {
  BRONZE: {
    name: '브론즈',
    color: 'text-orange-600 dark:text-orange-400',
    emoji: '🥉',
  },
  SILVER: {
    name: '실버',
    color: 'text-gray-600 dark:text-gray-400',
    emoji: '🥈',
  },
  GOLD: {
    name: '골드',
    color: 'text-yellow-600 dark:text-yellow-400',
    emoji: '🥇',
  },
  PLATINUM: {
    name: '플래티넘',
    color: 'text-slate-600 dark:text-slate-400',
    emoji: '💎',
  },
  DIAMOND: {
    name: '다이아몬드',
    color: 'text-cyan-600 dark:text-cyan-400',
    emoji: '💍',
  },
};

export const BadgeProgressModal: FC<BadgeProgressModalProps> = ({
  badge,
  isOpen,
  onClose,
}) => {
  if (!badge) {
    return null;
  }

  const tierData = tierInfo[badge.tier];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/* 모달 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    배지 상세정보
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="닫기"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 콘텐츠 */}
              <div className="p-6 space-y-6">
                {/* 배지 아이콘 및 기본 정보 */}
                <div className="text-center">
                  <div
                    className={`
                      text-6xl mb-4 inline-block p-4 rounded-2xl
                      ${
                        badge.isEarned
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                          : 'bg-gray-100 dark:bg-gray-700 opacity-60 grayscale'
                      }
                    `}
                  >
                    {badge.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {badge.name}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {badge.description}
                  </p>

                  {/* 티어 정보 */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-lg">{tierData.emoji}</span>
                    <span className={`font-semibold ${tierData.color}`}>
                      {tierData.name} 티어
                    </span>
                  </div>

                  {/* 획득 상태 */}
                  {badge.isEarned ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">획득 완료</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">획득 전</span>
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <hr className="border-gray-200 dark:border-gray-700" />

                {/* 상세 정보 */}
                <div className="space-y-4">
                  {/* 획득일 */}
                  {badge.isEarned && badge.earnedAt && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <span>🎉</span>
                        획득일
                      </h4>
                      <p className="text-blue-800 dark:text-blue-200">
                        {formatDate(badge.earnedAt)}
                      </p>
                    </div>
                  )}

                  {/* 진행률 */}
                  {!badge.isEarned && badge.progress && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                        <span>📊</span>
                        달성 진행률
                      </h4>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-purple-800 dark:text-purple-200">
                          <span>현재 진행</span>
                          <span>
                            {badge.progress.current} / {badge.progress.required}
                          </span>
                        </div>

                        <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${badge.progress.percentage}%` }}
                          />
                        </div>

                        <div className="text-center">
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {badge.progress.percentage}%
                          </span>
                          <span className="text-sm text-purple-700 dark:text-purple-300 ml-1">
                            완료
                          </span>
                        </div>

                        {/* 남은 요구사항 */}
                        <div className="text-center text-sm text-purple-700 dark:text-purple-300">
                          {badge.progress.required - badge.progress.current}개
                          더 필요
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 보유자 수 */}
                  {badge.holdersCount !== undefined && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                        <span>👥</span>
                        보유자 정보
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-bold text-lg">
                          {badge.holdersCount.toLocaleString()}명
                        </span>
                        이 이 배지를 보유하고 있습니다
                      </p>

                      {/* 희귀도 표시 */}
                      {badge.holdersCount < 100 && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
                          <span>⭐</span>
                          희귀 배지
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 하단 버튼 */}
                <div className="pt-4">
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
