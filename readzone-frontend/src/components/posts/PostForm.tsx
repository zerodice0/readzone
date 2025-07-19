import React, { useState } from 'react';
import { Star, Lock, Globe } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { cn } from '../../utils/cn';

interface Book {
  id: string;
  title: string;
  authors: string[];
  thumbnail?: string;
  isbn: string;
}

interface PostFormProps {
  book?: Book;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<PostFormData>;
  isEditing?: boolean;
}

export interface PostFormData {
  bookId: string;
  content: string;
  rating?: number;
  readingProgress: number;
  tags: string[];
  isPublic: boolean;
}

const PostForm: React.FC<PostFormProps> = ({
  book,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<PostFormData>({
    bookId: initialData?.bookId || book?.id || '',
    content: initialData?.content || '',
    rating: initialData?.rating || undefined,
    readingProgress: initialData?.readingProgress || 0,
    tags: initialData?.tags || [],
    isPublic: initialData?.isPublic !== undefined ? initialData.isPublic : true,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Post submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating: prev.rating === rating ? undefined : rating,
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 책 정보 */}
        {book && (
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              <img
                src={book.thumbnail || '/placeholder-book.jpg'}
                alt={book.title}
                className="w-16 h-20 object-cover rounded"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{book.title}</h3>
              <p className="text-sm text-gray-600">{book.authors.join(', ')}</p>
            </div>
          </div>
        )}

        {/* 내용 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            독서 기록 *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="이 책에 대한 생각을 자유롭게 적어보세요..."
            required
          />
        </div>

        {/* 평점 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            평점
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                className={cn(
                  'p-1 rounded transition-colors',
                  formData.rating && star <= formData.rating
                    ? 'text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-400'
                )}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {formData.rating ? `${formData.rating}/5` : '평점 없음'}
            </span>
          </div>
        </div>

        {/* 독서 진행률 */}
        <div>
          <label htmlFor="readingProgress" className="block text-sm font-medium text-gray-700 mb-2">
            독서 진행률: {formData.readingProgress}%
          </label>
          <input
            type="range"
            id="readingProgress"
            min="0"
            max="100"
            value={formData.readingProgress}
            onChange={(e) => setFormData(prev => ({ ...prev, readingProgress: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 태그 */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            태그
          </label>
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="태그를 입력하고 Enter를 누르세요"
          />
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 공개 설정 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            공개 설정
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors',
                formData.isPublic
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              )}
            >
              <Globe className="w-4 h-4" />
              <span>공개</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isPublic: false }))}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors',
                !formData.isPublic
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              )}
            >
              <Lock className="w-4 h-4" />
              <span>비공개</span>
            </button>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditing ? '수정하기' : '작성하기'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;