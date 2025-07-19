import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import Button from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  showCancel?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  placeholder = '댓글을 입력하세요...',
  initialValue = '',
  submitLabel = '댓글 작성',
  showCancel = false
}) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">댓글을 작성하려면 로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          {content.length}/500
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-600">
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-600">
            {user.displayName || user.username}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {showCancel && onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-1" />
              취소
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            loading={isSubmitting}
          >
            <Send className="w-4 h-4 mr-1" />
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;