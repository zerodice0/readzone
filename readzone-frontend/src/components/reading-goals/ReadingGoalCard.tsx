import React from 'react';
import { BookOpen, Target, TrendingUp, Calendar } from 'lucide-react';
import type { ReadingGoal } from '../../services/readingGoalService';
import { cn } from '../../utils/cn';

interface ReadingGoalCardProps {
  goal: ReadingGoal;
  className?: string;
}

const ReadingGoalCard: React.FC<ReadingGoalCardProps> = ({ goal, className }) => {
  const currentYear = new Date().getFullYear();
  const isCurrentYear = goal.year === currentYear;

  // 진행률에 따른 색상 결정
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg',
      isCurrentYear && 'ring-2 ring-blue-500',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {goal.year}년 독서 목표
          </h3>
          {isCurrentYear && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              현재
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <span className={cn(
            'text-sm font-medium',
            getProgressTextColor(goal.progress.overallProgress)
          )}>
            {goal.progress.overallProgress}%
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* 책 목표 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">독서량</span>
            </div>
            <span className="text-sm text-gray-600">
              {goal.booksRead} / {goal.booksTarget}권
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                getProgressColor(goal.progress.booksProgress)
              )}
              style={{ width: `${Math.min(goal.progress.booksProgress, 100)}%` }}
            />
          </div>
          <div className="text-right">
            <span className={cn(
              'text-xs',
              getProgressTextColor(goal.progress.booksProgress)
            )}>
              {goal.progress.booksProgress}%
            </span>
          </div>
        </div>

        {/* 페이지 목표 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">페이지</span>
            </div>
            <span className="text-sm text-gray-600">
              {goal.pagesRead.toLocaleString()} / {goal.pagesTarget.toLocaleString()}쪽
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                getProgressColor(goal.progress.pagesProgress)
              )}
              style={{ width: `${Math.min(goal.progress.pagesProgress, 100)}%` }}
            />
          </div>
          <div className="text-right">
            <span className={cn(
              'text-xs',
              getProgressTextColor(goal.progress.pagesProgress)
            )}>
              {goal.progress.pagesProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* 성취도 메시지 */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600 text-center">
          {goal.progress.overallProgress >= 100 ? (
            <span className="text-green-600 font-medium">🎉 목표 달성!</span>
          ) : goal.progress.overallProgress >= 80 ? (
            <span className="text-green-600">거의 다 왔어요!</span>
          ) : goal.progress.overallProgress >= 60 ? (
            <span className="text-yellow-600">좋은 페이스로 진행 중!</span>
          ) : goal.progress.overallProgress >= 40 ? (
            <span className="text-orange-600">조금 더 노력해봐요!</span>
          ) : (
            <span className="text-red-600">화이팅!</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ReadingGoalCard;