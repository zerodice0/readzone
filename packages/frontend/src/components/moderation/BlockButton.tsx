import { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { blockUser } from '@/lib/api/moderation';
import { useToast } from '@/hooks/use-toast';

interface BlockButtonProps {
  userId: string;
  username: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onBlock?: () => void;
}

const BlockButton = ({
  userId,
  username,
  variant = 'outline',
  size = 'default',
  onBlock,
}: BlockButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const { toast } = useToast();

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      await blockUser({ blockedId: userId });
      toast({
        title: '사용자 차단 완료',
        description: `@${username}님을 차단했습니다. 해당 사용자의 콘텐츠가 더 이상 표시되지 않습니다.`,
      });
      setIsOpen(false);
      onBlock?.();
    } catch (error) {
      toast({
        title: '차단 실패',
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        <Ban className="w-4 h-4 mr-2" />
        차단
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>사용자 차단</DialogTitle>
            <DialogDescription>
              <span className="font-medium">@{username}</span>님을 차단하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>차단하면 다음 효과가 적용됩니다:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>해당 사용자의 독후감과 댓글이 표시되지 않습니다</li>
              <li>해당 사용자가 회원님을 팔로우하거나 댓글을 달 수 없습니다</li>
              <li>해당 사용자의 알림을 받지 않습니다</li>
            </ul>
            <p className="mt-3">차단은 언제든지 해제할 수 있습니다.</p>
          </div>

          <div className="flex space-x-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isBlocking}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={isBlocking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBlocking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  차단 중...
                </>
              ) : (
                '차단'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BlockButton;
