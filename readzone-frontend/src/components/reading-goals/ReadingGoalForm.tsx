import React, { useState } from 'react';
import { Target, BookOpen, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

interface ReadingGoalFormProps {
  year: number;
  initialBooksTarget?: number;
  initialPagesTarget?: number;
  onSubmit: (booksTarget: number, pagesTarget: number) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

const ReadingGoalForm: React.FC<ReadingGoalFormProps> = ({
  year,
  initialBooksTarget = 12,
  initialPagesTarget = 3000,
  onSubmit,
  onCancel,
  loading = false,
  className
}) => {
  const [booksTarget, setBooksTarget] = useState(initialBooksTarget);
  const [pagesTarget, setPagesTarget] = useState(initialPagesTarget);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (booksTarget < 0 || booksTarget > 1000) {
      newErrors.booksTarget = '책 목표는 0~1000권 사이여야 합니다.';
    }

    if (pagesTarget < 0 || pagesTarget > 100000) {
      newErrors.pagesTarget = '페이지 목표는 0~100000페이지 사이여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(booksTarget, pagesTarget);
    } catch (error) {
      console.error('독서 목표 저장 실패:', error);
    }
  };

  // 추천 목표 값들
  const booksSuggestions = [6, 12, 24, 36, 52];
  const pagesSuggestions = [1500, 3000, 6000, 10000, 15000];

  return (
    <div className={cn('bg-white rounded-lg shadow-md p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {year}년 독서 목표 설정
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 책 목표 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <label className="text-sm font-medium text-gray-700">
              연간 독서 목표 (권)
            </label>
          </div>
          
          <div className="space-y-2">
            <input
              type="number"
              min="0"
              max="1000"
              value={booksTarget}
              onChange={(e) => setBooksTarget(Number(e.target.value))}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.booksTarget ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="목표 권수를 입력하세요"
            />
            {errors.booksTarget && (
              <p className="text-sm text-red-600">{errors.booksTarget}</p>
            )}
          </div>

          {/* 책 목표 추천 버튼들 */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">추천:</span>
            {booksSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setBooksTarget(suggestion)}
                className={cn(
                  'px-2 py-1 text-xs rounded-full transition-colors',
                  booksTarget === suggestion
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {suggestion}권
              </button>
            ))}
          </div>
        </div>

        {/* 페이지 목표 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-600" />
            <label className="text-sm font-medium text-gray-700">
              연간 페이지 목표 (쪽)
            </label>
          </div>
          
          <div className="space-y-2">
            <input
              type="number"
              min="0"
              max="100000"
              value={pagesTarget}
              onChange={(e) => setPagesTarget(Number(e.target.value))}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.pagesTarget ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="목표 페이지 수를 입력하세요"
            />
            {errors.pagesTarget && (
              <p className="text-sm text-red-600">{errors.pagesTarget}</p>
            )}
          </div>

          {/* 페이지 목표 추천 버튼들 */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">추천:</span>
            {pagesSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setPagesTarget(suggestion)}
                className={cn(
                  'px-2 py-1 text-xs rounded-full transition-colors',
                  pagesTarget === suggestion
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {suggestion.toLocaleString()}쪽
              </button>
            ))}
          </div>
        </div>

        {/* 목표 미리보기 */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">목표 요약</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📚 연간 {booksTarget}권 ({booksTarget > 0 ? Math.round(booksTarget / 12) : 0}권/월)</p>
            <p>📖 연간 {pagesTarget.toLocaleString()}쪽 ({pagesTarget > 0 ? Math.round(pagesTarget / 12).toLocaleString() : 0}쪽/월)</p>
            {booksTarget > 0 && pagesTarget > 0 && (
              <p className="text-blue-600 font-medium">
                책 한 권당 평균 {Math.round(pagesTarget / booksTarget)}쪽
              </p>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            목표 설정
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReadingGoalForm;