import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DraftConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle: string;
  draftBookTitle?: string | undefined;
  draftBookAuthor?: string | undefined;
  onUseDraft: () => void;
  onStartNew: () => void;
}

export function DraftConfirmDialog({
  open,
  onOpenChange,
  bookTitle,
  draftBookTitle,
  draftBookAuthor,
  onUseDraft,
  onStartNew,
}: DraftConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>임시저장된 독후감이 있습니다</DialogTitle>
          <DialogDescription>
            이전에 작성하던 독후감을 불러올까요, 아니면 새로 작성하시겠어요?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 px-6">
          <div>
            <strong>선택한 도서:</strong> {bookTitle}
          </div>
          {draftBookTitle && draftBookAuthor && (
            <div>
              <strong>임시저장된 독후감의 도서:</strong> {draftBookTitle} -{' '}
              {draftBookAuthor}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onStartNew}>
            새로 작성
          </Button>
          <Button onClick={onUseDraft}>임시저장 불러오기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
