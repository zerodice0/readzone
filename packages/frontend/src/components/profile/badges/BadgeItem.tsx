import type { FC } from 'react';

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  isEarned: boolean;
  earnedAt?: string;
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
  holdersCount?: number;
}

interface BadgeItemProps {
  badge: BadgeData;
  onClick?: () => void;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const tierColors = {
  BRONZE: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-800 dark:text-orange-200',
    glow: 'shadow-orange-200 dark:shadow-orange-900/50',
  },
  SILVER: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-800 dark:text-gray-200',
    glow: 'shadow-gray-200 dark:shadow-gray-800/50',
  },
  GOLD: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-200',
    glow: 'shadow-yellow-200 dark:shadow-yellow-900/50',
  },
  PLATINUM: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'border-slate-300 dark:border-slate-600',
    text: 'text-slate-800 dark:text-slate-200',
    glow: 'shadow-slate-200 dark:shadow-slate-800/50',
  },
  DIAMOND: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/20',
    border: 'border-cyan-300 dark:border-cyan-700',
    text: 'text-cyan-800 dark:text-cyan-200',
    glow: 'shadow-cyan-200 dark:shadow-cyan-900/50',
  },
};

const sizeStyles = {
  small: {
    container: 'p-3',
    icon: 'text-2xl',
    title: 'text-sm font-medium',
    description: 'text-xs',
    progress: 'h-1.5',
  },
  medium: {
    container: 'p-4',
    icon: 'text-3xl',
    title: 'text-base font-semibold',
    description: 'text-sm',
    progress: 'h-2',
  },
  large: {
    container: 'p-6',
    icon: 'text-4xl',
    title: 'text-lg font-bold',
    description: 'text-base',
    progress: 'h-3',
  },
};

export const BadgeItem: FC<BadgeItemProps> = ({
  badge,
  onClick,
  showProgress = false,
  size = 'medium',
  className = '',
}) => {
  const tierStyle = tierColors[badge.tier];
  const sizeStyle = sizeStyles[size];
  const isClickable = Boolean(onClick);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const badgeContent = (
    <div
      className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-300
        ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text}
        ${badge.isEarned ? `${tierStyle.glow} shadow-lg` : 'opacity-60 grayscale'}
        ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''}
        ${sizeStyle.container}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={`${badge.name} 배지${badge.isEarned ? ' (획득함)' : ''}`}
    >
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-gradient-to-br from-white to-transparent" />
      </div>

      {/* 획득 표시 */}
      {badge.isEarned && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 text-center">
        {/* 아이콘 */}
        <div className={`${sizeStyle.icon} mb-2`}>{badge.icon}</div>

        {/* 배지 이름 */}
        <h3 className={`${sizeStyle.title} mb-1 line-clamp-1`}>{badge.name}</h3>

        {/* 배지 설명 */}
        <p
          className={`${sizeStyle.description} text-current opacity-75 line-clamp-2 mb-2`}
        >
          {badge.description}
        </p>

        {/* 티어 표시 */}
        <div className="flex justify-center mb-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-current/10 text-current">
            {badge.tier}
          </span>
        </div>

        {/* 획득일 또는 진행률 */}
        {badge.isEarned && badge.earnedAt ? (
          <div className="text-xs opacity-60">
            {formatDate(badge.earnedAt)} 획득
          </div>
        ) : showProgress && badge.progress ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs opacity-75">
              <span>{badge.progress.current}</span>
              <span>{badge.progress.required}</span>
            </div>
            <div
              className={`w-full bg-current/20 rounded-full ${sizeStyle.progress}`}
            >
              <div
                className="h-full bg-current rounded-full transition-all duration-500"
                style={{ width: `${badge.progress.percentage}%` }}
              />
            </div>
            <div className="text-xs opacity-60">
              {badge.progress.percentage}% 완료
            </div>
          </div>
        ) : null}

        {/* 보유자 수 */}
        {badge.holdersCount !== undefined && (
          <div className="text-xs opacity-60 mt-1">
            {badge.holdersCount.toLocaleString()}명 보유
          </div>
        )}
      </div>
    </div>
  );

  if (badge.isEarned) {
    return (
      <div
        className={`transition-all duration-300 ${isClickable ? 'hover:scale-105 active:scale-95' : ''}`}
      >
        {badgeContent}
      </div>
    );
  }

  return badgeContent;
};
