import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useLoginPromptStore } from '../../stores/loginPromptStore';

/**
 * T104: Login Prompt Modal
 * Shows login prompt for unauthenticated users trying to interact with content
 */

export function LoginPrompt() {
  const navigate = useNavigate();
  const { isOpen, message, hide } = useLoginPromptStore();
  // T112: Focus management for modal
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // T112: Auto-focus on login button when modal opens
  useEffect(() => {
    if (isOpen && firstFocusRef.current) {
      firstFocusRef.current.focus();
    }
  }, [isOpen]);

  const handleLogin = (): void => {
    // T106: Store current URL for return after login
    sessionStorage.setItem('returnUrl', window.location.pathname);
    navigate('/login');
    hide();
  };

  const handleClose = (): void => {
    hide();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>로그인이 필요합니다</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          {/* T112: Focus on login button first */}
          <Button ref={firstFocusRef} onClick={handleLogin}>
            로그인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
