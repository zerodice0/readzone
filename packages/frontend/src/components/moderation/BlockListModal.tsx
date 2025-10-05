import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ban, Loader2 } from 'lucide-react';
import { getMyBlocks, unblockUser } from '@/lib/api/moderation';
import { useToast } from '@/hooks/use-toast';
import type { Block } from '@/types/moderation';

interface BlockListModalProps {
  isOpen: boolean
  onClose: () => void
}

const BlockListModal = ({ isOpen, onClose }: BlockListModalProps) => {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadBlocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyBlocks();

      setBlocks(data);
    } catch (error) {
      toast({
        title: '차단 목록 로드 실패',
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      void loadBlocks();
    }
  }, [isOpen, loadBlocks]);

  const handleUnblock = async (blockedId: string) => {
    setUnblockingId(blockedId)
    try {
      await unblockUser(blockedId)
      setBlocks((prev) => prev.filter((block) => block.blockedId !== blockedId))
      toast({
        title: '차단 해제 완료',
        description: '사용자의 차단이 해제되었습니다.',
      })
    } catch (error) {
      toast({
        title: '차단 해제 실패',
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setUnblockingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>차단한 사용자</DialogTitle>
          <DialogDescription>
            차단한 사용자 목록을 관리할 수 있습니다
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Ban className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                차단한 사용자가 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={block.blocked.profileImage} />
                      <AvatarFallback>
                        {block.blocked.nickname[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {block.blocked.nickname}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{block.blocked.userid}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        차단일: {formatDate(block.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(block.blockedId)}
                    disabled={unblockingId === block.blockedId}
                    className="ml-3"
                  >
                    {unblockingId === block.blockedId ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        해제 중...
                      </>
                    ) : (
                      '차단 해제'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BlockListModal
