import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  type?: NotificationType;
  buttonText?: string;
}

const notificationConfig = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    defaultTitle: '성공',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    defaultTitle: '오류',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    defaultTitle: '경고',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    defaultTitle: '알림',
  },
};

export function NotificationDialog({
  open,
  onOpenChange,
  title,
  message,
  type = 'info',
  buttonText = '확인',
}: NotificationDialogProps) {
  const config = notificationConfig[type];
  const IconComponent = config.icon;
  const displayTitle = title ?? config.defaultTitle;

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
            {displayTitle}
          </DialogTitle>
          <DialogDescription className="text-left">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}