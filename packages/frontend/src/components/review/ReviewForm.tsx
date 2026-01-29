import { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Save,
  Send,
  BookOpen,
  PenLine,
} from 'lucide-react';
import { m } from 'framer-motion';
import { Button } from '../ui/button';
import { toast } from '../../utils/toast';

interface ReviewFormData {
  title: string;
  content: string;
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
    <div className="space-y-8 bg-white p-6 md:p-8 rounded-2xl border border-stone-100 shadow-sm">
      {/* Title (optional) */}
      <div className="space-y-3">
        <label
          htmlFor="review-title"
          className="text-sm font-semibold text-stone-700 flex items-center gap-2"
        >
          <PenLine className="w-4 h-4 text-primary-500" />
          제목{' '}
          <span className="text-stone-400 font-normal text-xs">(선택)</span>
        </label>
        <div className="relative group">
          <input
            id="review-title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="독후감의 멋진 제목을 지어주세요"
            className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl text-lg font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all group-hover:bg-white"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Content (required) */}
      <div className="space-y-3">
        <label
          htmlFor="review-content"
          className="text-sm font-semibold text-stone-700 flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-primary-500" />
          내용 <span className="text-red-500 font-bold">*</span>
        </label>
        <div className="space-y-2">
          <textarea
            id="review-content"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="이 책을 읽고 어떤 생각이 드셨나요? 인상 깊었던 구절이나 느낌을 자유롭게 기록해보세요."
            rows={15}
            className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl text-base leading-relaxed placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none hover:bg-white"
            disabled={isSubmitting}
          />
          <div className="flex justify-end items-center gap-3">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                isContentValid
                  ? 'bg-green-50 text-green-600'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              {isContentValid ? '작성 완료' : `${minLength}자 이상 필요`}
            </span>
            <span className="text-xs text-stone-400 font-mono">
              {contentLength.toLocaleString()}자
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* Recommendation */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-stone-700">
            추천 여부 <span className="text-red-500">*</span>
          </label>
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isRecommended: true })}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all relative ${
                formData.isRecommended
                  ? 'text-green-700 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {formData.isRecommended && (
                <m.div
                  layoutId="recommend-bg"
                  className="absolute inset-0 bg-white rounded-lg border border-green-200"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <ThumbsUp
                  className={`w-4 h-4 ${formData.isRecommended ? 'fill-current' : ''}`}
                />
                추천해요
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isRecommended: false })}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all relative ${
                !formData.isRecommended
                  ? 'text-red-700 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {!formData.isRecommended && (
                <m.div
                  layoutId="recommend-bg"
                  className="absolute inset-0 bg-white rounded-lg border border-red-200"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <ThumbsDown
                  className={`w-4 h-4 ${!formData.isRecommended ? 'fill-current' : ''}`}
                />
                아쉬워요
              </span>
            </button>
          </div>
        </div>

        {/* Read status */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-stone-700">
            읽기 상태 <span className="text-red-500">*</span>
          </label>
          <div className="flex bg-stone-100 p-1 rounded-xl">
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
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all relative ${
                  formData.readStatus === status.value
                    ? 'text-primary-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {formData.readStatus === status.value && (
                  <m.div
                    layoutId="status-bg"
                    className="absolute inset-0 bg-white rounded-lg border border-primary-200"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{status.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 pt-6 border-t border-stone-100">
        <Button
          variant="outline"
          onClick={() => handleSubmit('DRAFT')}
          disabled={isSubmitting || !isContentValid}
          className="flex-1 h-12 text-base rounded-xl border-stone-200 hover:bg-stone-50 hover:border-stone-300"
        >
          <Save className="w-4 h-4 mr-2" />
          초안 저장
        </Button>
        <Button
          variant="warm"
          onClick={() => handleSubmit('PUBLISHED')}
          disabled={isSubmitting || !isContentValid}
          className="flex-2 h-12 text-base rounded-xl shadow-lg shadow-primary-500/20"
        >
          <Send className="w-4 h-4 mr-2" />
          발행하기
        </Button>
      </div>
    </div>
  );
}
