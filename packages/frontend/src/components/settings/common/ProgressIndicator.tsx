import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { animations } from '@/lib/animations';

interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  optional?: boolean;
  completed?: boolean;
  error?: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStepId: string;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  showDescriptions?: boolean;
  animated?: boolean;
  onStepClick?: (stepId: string) => void;
}

/**
 * 진행률 표시기 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - 다단계 프로세스 시각화
 * - 접근성 지원 (ARIA labels, 키보드 네비게이션)
 * - 애니메이션 진행률 표시
 * - 에러 상태 표시
 */
export function ProgressIndicator({
  steps,
  currentStepId,
  className,
  variant = 'horizontal',
  showLabels = true,
  showDescriptions = false,
  animated = true,
  onStepClick,
}: ProgressIndicatorProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);
  const completedSteps = steps
    .slice(0, currentIndex)
    .filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const isClickable = !!onStepClick;

  const handleStepClick = (step: ProgressStep, index: number) => {
    if (!isClickable) {
      return;
    }
    if (index > currentIndex && !step.completed) {
      return;
    } // 미래 단계는 클릭 불가

    onStepClick?.(step.id);
  };

  const getStepStatus = (step: ProgressStep, index: number) => {
    if (step.error) {
      return 'error';
    }
    if (step.completed) {
      return 'completed';
    }
    if (index === currentIndex) {
      return 'current';
    }
    if (index < currentIndex) {
      return 'skipped';
    }

    return 'upcoming';
  };

  const getStepStyles = (status: string) => {
    const styles = {
      completed: 'bg-green-500 border-green-500 text-white',
      current:
        'bg-blue-500 border-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800',
      error:
        'bg-red-500 border-red-500 text-white ring-4 ring-red-200 dark:ring-red-800',
      skipped:
        'bg-gray-300 border-gray-300 text-gray-600 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300',
      upcoming:
        'bg-white border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500',
    };

    return styles[status as keyof typeof styles] || styles.upcoming;
  };

  const getConnectorStyles = (index: number) => {
    const step = steps[index];
    const nextStep = steps[index + 1];

    if (!nextStep) {
      return '';
    }

    const isCompleted =
      step?.completed &&
      (nextStep.completed ??
        steps.findIndex((s) => s.id === currentStepId) > index);

    return isCompleted
      ? 'bg-green-500 dark:bg-green-400'
      : 'bg-gray-300 dark:bg-gray-600';
  };

  if (variant === 'vertical') {
    return (
      <div
        className={clsx('flex flex-col', className)}
        role="progressbar"
        aria-valuenow={completedSteps}
        aria-valuemax={totalSteps}
      >
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-start">
              {/* 단계 표시기 */}
              <div className="flex flex-col items-center">
                <motion.button
                  className={clsx(
                    'relative flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium transition-all duration-200',
                    getStepStyles(status),
                    isClickable &&
                      index <= currentIndex &&
                      'cursor-pointer hover:scale-110',
                    !isClickable && 'cursor-default'
                  )}
                  onClick={() => handleStepClick(step, index)}
                  disabled={
                    !isClickable || (index > currentIndex && !step.completed)
                  }
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                  aria-label={`${step.title} - ${status}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  {step.icon ? (
                    <div className="w-5 h-5">{step.icon}</div>
                  ) : status === 'completed' ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : status === 'error' ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}

                  {step.optional && (
                    <span className="absolute -top-1 -right-1 text-xs bg-gray-500 text-white rounded-full px-1">
                      ?
                    </span>
                  )}
                </motion.button>

                {/* 연결선 */}
                {!isLast && (
                  <motion.div
                    className={clsx(
                      'w-0.5 h-12 mt-2 transition-colors duration-300',
                      getConnectorStyles(index)
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: 48 }}
                    transition={{ delay: animated ? index * 0.1 : 0 }}
                  />
                )}
              </div>

              {/* 단계 정보 */}
              <div className="ml-4 pb-8">
                {showLabels && (
                  <motion.h4
                    className={clsx(
                      'font-medium',
                      status === 'current'
                        ? 'text-blue-600 dark:text-blue-400'
                        : status === 'completed'
                          ? 'text-green-600 dark:text-green-400'
                          : status === 'error'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                    )}
                    {...(animated ? animations.slideInRight : {})}
                    transition={{ delay: animated ? index * 0.1 : 0 }}
                  >
                    {step.title}
                    {step.optional && (
                      <span className="ml-2 text-xs text-gray-500">(선택)</span>
                    )}
                  </motion.h4>
                )}

                {showDescriptions && step.description && (
                  <motion.p
                    className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                    {...(animated ? animations.slideInRight : {})}
                    transition={{ delay: animated ? index * 0.1 + 0.05 : 0 }}
                  >
                    {step.description}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={clsx('w-full', className)}
      role="progressbar"
      aria-valuenow={completedSteps}
      aria-valuemax={totalSteps}
    >
      {/* 진행률 바 */}
      {animated && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              진행률
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completedSteps} / {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* 단계 목록 */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* 단계 표시기 */}
              <div className="flex flex-col items-center">
                <motion.button
                  className={clsx(
                    'relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-all duration-200',
                    getStepStyles(status),
                    isClickable &&
                      index <= currentIndex &&
                      'cursor-pointer hover:scale-110',
                    !isClickable && 'cursor-default'
                  )}
                  onClick={() => handleStepClick(step, index)}
                  disabled={
                    !isClickable || (index > currentIndex && !step.completed)
                  }
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                  aria-label={`${step.title} - ${status}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  {step.icon ? (
                    <div className="w-4 h-4">{step.icon}</div>
                  ) : status === 'completed' ? (
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
                  ) : status === 'error' ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}

                  {step.optional && (
                    <span className="absolute -top-1 -right-1 text-xs bg-gray-500 text-white rounded-full px-1">
                      ?
                    </span>
                  )}
                </motion.button>

                {showLabels && (
                  <motion.span
                    className={clsx(
                      'text-xs font-medium mt-2 text-center max-w-20',
                      status === 'current'
                        ? 'text-blue-600 dark:text-blue-400'
                        : status === 'completed'
                          ? 'text-green-600 dark:text-green-400'
                          : status === 'error'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                    )}
                    {...(animated ? animations.fadeIn : {})}
                    transition={{ delay: animated ? index * 0.1 : 0 }}
                  >
                    {step.title}
                  </motion.span>
                )}
              </div>

              {/* 연결선 */}
              {!isLast && (
                <motion.div
                  className={clsx(
                    'flex-1 h-0.5 mx-2 transition-colors duration-300',
                    getConnectorStyles(index)
                  )}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: animated ? index * 0.1 : 0 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 간단한 진행률 바 컴포넌트
 */
interface SimpleProgressBarProps {
  value: number;
  max: number;
  label?: string;
  className?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function SimpleProgressBar({
  value,
  max,
  label,
  className,
  color = 'blue',
  size = 'md',
  animated = true,
}: SimpleProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorStyles = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {value} / {max}
          </span>
        </div>
      )}

      <div
        className={clsx(
          'w-full bg-gray-200 rounded-full dark:bg-gray-700',
          sizeStyles[size]
        )}
      >
        <motion.div
          className={clsx(
            'rounded-full transition-colors',
            colorStyles[color],
            sizeStyles[size]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.5 : 0,
            ease: 'easeOut',
          }}
        />
      </div>
    </div>
  );
}

export default ProgressIndicator;
