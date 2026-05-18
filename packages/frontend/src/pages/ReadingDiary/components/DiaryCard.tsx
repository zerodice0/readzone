import { useState, useRef, useEffect, useId } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Button } from '../../../components/ui/button';
import { toast } from '../../../utils/toast';
import { logError } from '../../../utils/error';
import type { Id } from 'convex/_generated/dataModel';

interface DiaryCardProps {
  diary: {
    _id: Id<'readingDiaries'>;
    _creationTime: number;
    content: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    book: {
      _id: Id<'books'>;
      title: string;
      author: string;
      coverImageUrl?: string;
    } | null;
  };
  /** 책 정보를 표시할지 여부 (그룹화된 뷰에서는 false) */
  showBookInfo?: boolean;
}

export function DiaryCard({ diary, showBookInfo = true }: DiaryCardProps) {
  const editTextareaId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(diary.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const updateDiary = useMutation(api.readingDiaries.update);
  const removeDiary = useMutation(api.readingDiaries.remove);

  // 콘텐츠 높이 측정하여 3줄 초과 시 truncation 필요 여부 결정
  useEffect(() => {
    if (contentRef.current) {
      // line-height 약 1.5rem (24px), 3줄 = 72px
      const lineHeight = 24;
      const maxLines = 3;
      setNeedsTruncation(
        contentRef.current.scrollHeight > lineHeight * maxLines
      );
    }
  }, [diary.content]);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('내용을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDiary({
        id: diary._id,
        content: editContent.trim(),
        visibility: 'PRIVATE',
      });
      toast.success('수정되었습니다');
      setIsEditing(false);
    } catch (error) {
      logError(error, 'Failed to update diary');
      toast.error('수정에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await removeDiary({ id: diary._id });
      toast.success('삭제되었습니다');
      setShowDeleteConfirm(false);
    } catch (error) {
      logError(error, 'Failed to delete diary');
      toast.error('삭제에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(diary.content);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="paper-panel space-y-4 rounded-xl p-4">
        {/* Book info (showBookInfo가 true일 때만 표시) */}
        {showBookInfo && diary.book && (
          <div className="flex items-center gap-3 border-b border-paper-200/70 pb-3">
            {diary.book.coverImageUrl && (
              <img
                src={diary.book.coverImageUrl}
                alt={`${diary.book.title} 표지`}
                width={40}
                height={56}
                className="book-paper-frame h-14 w-10 rounded object-cover shadow-sm"
              />
            )}
            <div>
              <p className="font-medium text-stone-900 text-sm">
                {diary.book.title}
              </p>
              <p className="text-xs text-stone-500">{diary.book.author}</p>
            </div>
          </div>
        )}

        {/* Edit form */}
        <label htmlFor={editTextareaId} className="sr-only">
          독서 일기 내용 수정
        </label>
        <textarea
          id={editTextareaId}
          name="diary-edit-content"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          autoComplete="off"
          className="paper-input w-full resize-none rounded-lg px-3 py-2 text-sm leading-relaxed outline-none"
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelEdit}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleSaveEdit}
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isSubmitting ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <article className="paper-panel rounded-xl p-4">
        {/* Content */}
        <div className="relative border-l-2 border-primary-300/70 pl-3">
          <p
            ref={contentRef}
            className={`whitespace-pre-wrap text-sm leading-6 text-stone-700 transition-[max-height] duration-200 ${
              !isExpanded && needsTruncation
                ? 'line-clamp-3 max-h-[4.5rem]'
                : 'max-h-none'
            }`}
          >
            {diary.content}
          </p>
          {needsTruncation && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-xs font-semibold text-primary-700 hover:text-primary-600"
            >
              {isExpanded ? '접기' : '더보기'}
            </button>
          )}
        </div>

        {showDeleteConfirm ? (
          <div className="mt-3 rounded-lg border border-red-100 bg-red-50/70 p-3">
            <p className="text-sm font-bold text-red-700">독서 일기 삭제</p>
            <p className="mt-1 text-xs leading-5 text-red-600">
              삭제된 일기는 복구할 수 없습니다.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? '삭제 중…' : '삭제'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex justify-end gap-1 border-t border-paper-200/70 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-stone-500 hover:text-stone-700"
            >
              <Pencil className="w-4 h-4 mr-1" />
              수정
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </Button>
          </div>
        )}
      </article>
    </>
  );
}
