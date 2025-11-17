import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Save, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { StarRating } from './StarRating';
import { toast } from '../../utils/toast';

interface ReviewFormData {
  title: string;
  content: string;
  rating: number;
  isRecommended: boolean;
  readStatus: 'READING' | 'COMPLETED' | 'DROPPED';
}

interface ReviewFormProps {
  initialData?: Partial<ReviewFormData>;
  onSubmit: (data: ReviewFormData, status: 'DRAFT' | 'PUBLISHED') => void;
  isSubmitting?: boolean;
}

export function ReviewForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    rating: initialData?.rating || 5,
    isRecommended: initialData?.isRecommended ?? true,
    readStatus: initialData?.readStatus || 'COMPLETED',
  });

  const handleSubmit = (status: 'DRAFT' | 'PUBLISHED') => {
    // Validate required fields
    if (!formData.content.trim()) {
      toast.warning('독후감 내용을 입력해주세요');
      return;
    }

    onSubmit(formData, status);
  };

  const contentLength = formData.content.length;
  const minLength = 10;
  const isContentValid = contentLength >= minLength;

  return (
    <div className="space-y-6">
      {/* Title (optional) */}
      <div>
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-stone-700 mb-2"
        >
          제목 <span className="text-stone-400">(선택)</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="독후감 제목을 입력하세요"
          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {/* Content (required) */}
      <div>
        <label
          htmlFor="review-content"
          className="block text-sm font-medium text-stone-700 mb-2"
        >
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-content"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="책에 대한 생각을 자유롭게 작성해주세요"
          rows={12}
          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          disabled={isSubmitting}
        />
        <div className="flex justify-between mt-2">
          <span
            className={`text-sm ${
              isContentValid ? 'text-stone-500' : 'text-red-500'
            }`}
          >
            {contentLength} / {minLength}자 이상
          </span>
          <span className="text-sm text-stone-500">
            {contentLength.toLocaleString()}자
          </span>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          평점
        </label>
        <div className="flex items-center gap-3">
          <StarRating
            rating={formData.rating}
            onRatingChange={(rating) => setFormData({ ...formData, rating })}
            readonly={isSubmitting}
            size="lg"
          />
          <span className="text-lg font-semibold text-stone-700">
            {formData.rating}.0
          </span>
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-3">
          추천 여부 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isRecommended: true })}
            disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              formData.isRecommended
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-stone-200 hover:border-green-300 text-stone-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp className="w-5 h-5" />
            <span className="font-medium">추천</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isRecommended: false })}
            disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              !formData.isRecommended
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-stone-200 hover:border-red-300 text-stone-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsDown className="w-5 h-5" />
            <span className="font-medium">비추천</span>
          </button>
        </div>
      </div>

      {/* Read status */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-3">
          읽기 상태 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {[
            { value: 'READING' as const, label: '읽는 중' },
            { value: 'COMPLETED' as const, label: '완독' },
            { value: 'DROPPED' as const, label: '중단' },
          ].map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() =>
                setFormData({ ...formData, readStatus: status.value })
              }
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                formData.readStatus === status.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                  : 'border-stone-200 hover:border-primary-300 text-stone-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-stone-200">
        <Button
          variant="outline"
          onClick={() => handleSubmit('DRAFT')}
          disabled={isSubmitting || !isContentValid}
          className="flex-1 gap-2"
        >
          <Save className="w-4 h-4" />
          초안 저장
        </Button>
        <Button
          onClick={() => handleSubmit('PUBLISHED')}
          disabled={isSubmitting || !isContentValid}
          className="flex-1 gap-2 bg-primary-600 hover:bg-primary-700"
        >
          <Send className="w-4 h-4" />
          발행하기
        </Button>
      </div>
    </div>
  );
}
