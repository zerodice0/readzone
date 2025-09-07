import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getErrorMessage, isValidationError } from '@/lib/error-utils';

interface ErrorDialogProps {
  error: unknown;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function ErrorDialog({ error, open, onClose, title }: ErrorDialogProps) {
  const errorMessage = getErrorMessage(error);
  const isValidation = isValidationError(error);

  const defaultTitle = isValidation
    ? '입력 확인이 필요합니다'
    : '오류가 발생했습니다';

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center gap-3">
          <AlertCircle
            className={`h-6 w-6 ${
              isValidation ? 'text-amber-500' : 'text-red-500'
            }`}
          />
          <div>
            <DialogTitle>{title ?? defaultTitle}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-base leading-relaxed">
          {errorMessage}
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
