import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import useWriteStore from '@/store/writeStore';
import { WritingStep } from '@/components/write/WritingStep';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { NotificationDialog, type NotificationType } from '@/components/ui/notification-dialog';

function ReviewEditPage() {
  const { reviewId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage] = useState('');
  const [notificationType] = useState<NotificationType>('info');

  const {
    loadReviewForEdit,
    exitEditMode,
    hasUnsavedChanges,
    isEditMode,
    editingReviewId,
  } = useWriteStore();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadReviewForEdit(reviewId);
      } catch (e) {
        setError(e instanceof Error ? e.message : '리뷰 로드 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    void load();

    return () => {
      // Cleanup when component unmounts
      if (isEditMode) {
        exitEditMode();
      }
    };
  }, [reviewId, loadReviewForEdit, exitEditMode, isEditMode]);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      exitEditMode();
      navigate({ to: `/review/${reviewId}` });
    }
  };

  const handleCancelConfirm = () => {
    exitEditMode();
    navigate({ to: `/review/${reviewId}` });
  };

  if (loading || !isEditMode || editingReviewId !== reviewId) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">로딩 중...</div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-red-600">
            {error}
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">독후감 수정</h1>
          <button
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            onClick={handleCancel}
          >
            취소
          </button>
        </div>

        <WritingStep />

        <AlertDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          title="수정 취소"
          description="저장하지 않은 변경사항이 있습니다. 정말 취소하시겠습니까?"
          onConfirm={handleCancelConfirm}
          confirmText="취소"
          cancelText="계속 수정"
          destructive={true}
        />

        <NotificationDialog
          open={showNotification}
          onOpenChange={setShowNotification}
          message={notificationMessage}
          type={notificationType}
        />
      </div>
    </AuthGuard>
  );
}

export const Route = createFileRoute('/review-edit/$reviewId')({
  component: ReviewEditPage,
});