import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { unblockUser } from '@/lib/api/moderation'
import { useToast } from '@/hooks/use-toast'

interface BlockedContentPlaceholderProps {
  contentType: string
  blockedUserId: string
  blockedUsername: string
  children: React.ReactNode
  onUnblock?: () => void
}

const BlockedContentPlaceholder = ({
  contentType,
  blockedUserId,
  blockedUsername,
  children,
  onUnblock,
}: BlockedContentPlaceholderProps) => {
  const [isShowing, setIsShowing] = useState(false)
  const [isUnblocking, setIsUnblocking] = useState(false)
  const { toast } = useToast()

  const handleUnblock = async () => {
    setIsUnblocking(true)
    try {
      await unblockUser(blockedUserId)
      toast({
        title: '차단 해제 완료',
        description: `@${blockedUsername}님의 차단이 해제되었습니다.`,
      })
      onUnblock?.()
    } catch (error) {
      toast({
        title: '차단 해제 실패',
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsUnblocking(false)
    }
  }

  if (isShowing) {
    return <div className="relative">{children}</div>
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-muted/30">
      <div className="text-center space-y-4">
        <div className="text-muted-foreground">
          <EyeOff className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm">
            차단한 사용자 <span className="font-medium">@{blockedUsername}</span>
            의 {contentType}입니다.
          </p>
        </div>

        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShowing(true)}
            className="text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            임시로 보기
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleUnblock}
            disabled={isUnblocking}
            className="text-xs"
          >
            {isUnblocking ? '해제 중...' : '차단 해제'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BlockedContentPlaceholder
