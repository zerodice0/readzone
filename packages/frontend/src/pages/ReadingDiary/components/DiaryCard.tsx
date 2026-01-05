import { useState } from 'react';
import { Pencil, Trash2, Lock, Globe } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(diary.content);
  const [editVisibility, setEditVisibility] = useState(diary.visibility);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateDiary = useMutation(api.readingDiaries.update);
  const removeDiary = useMutation(api.readingDiaries.remove);

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
        visibility: editVisibility,
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
      setShowDeleteDialog(false);
    } catch (error) {
      logError(error, 'Failed to delete diary');
      toast.error('삭제에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(diary.content);
    setEditVisibility(diary.visibility);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-stone-50 rounded-lg p-4 space-y-4">
        {/* Book info (showBookInfo가 true일 때만 표시) */}
        {showBookInfo && diary.book && (
          <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
            {diary.book.coverImageUrl && (
              <img
                src={diary.book.coverImageUrl}
                alt={diary.book.title}
                className="w-10 h-14 object-cover rounded shadow-sm"
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
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
        />

        {/* Visibility toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditVisibility('PRIVATE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border transition-colors ${
              editVisibility === 'PRIVATE'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-stone-300 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            비공개
          </button>
          <button
            type="button"
            onClick={() => setEditVisibility('PUBLIC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border transition-colors ${
              editVisibility === 'PUBLIC'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-stone-300 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            공개
          </button>
        </div>

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
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-stone-50 rounded-lg p-4">
        {/* Book info (showBookInfo가 true일 때만 표시) */}
        {showBookInfo && diary.book && (
          <div className="flex items-center gap-3 pb-3 border-b border-stone-200 mb-3">
            {diary.book.coverImageUrl && (
              <img
                src={diary.book.coverImageUrl}
                alt={diary.book.title}
                className="w-10 h-14 object-cover rounded shadow-sm"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-900 text-sm truncate">
                {diary.book.title}
              </p>
              <p className="text-xs text-stone-500">{diary.book.author}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-stone-400">
              {diary.visibility === 'PRIVATE' ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  비공개
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  공개
                </>
              )}
            </div>
          </div>
        )}

        {/* 공개/비공개 표시 (책 정보 숨길 때) */}
        {!showBookInfo && (
          <div className="flex items-center gap-1 text-xs text-stone-400 mb-2">
            {diary.visibility === 'PRIVATE' ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                비공개
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                공개
              </>
            )}
          </div>
        )}

        {/* Content */}
        <p className="text-sm text-stone-700 whitespace-pre-wrap">
          {diary.content}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-stone-200">
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
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            삭제
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>독서 일기 삭제</DialogTitle>
            <DialogDescription>
              이 독서 일기를 삭제하시겠습니까? 삭제된 일기는 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
