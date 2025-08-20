import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type ContentResponse, getContent } from '@/lib/api/content'

interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'terms' | 'privacy'
  onAgree: () => void
}

// 로딩 및 오류 상태 관리를 위한 인터페이스
interface LoadingState {
  isLoading: boolean
  error: string | null
}

export function TermsDialog({ open, onOpenChange, type, onAgree }: TermsDialogProps) {
  const [content, setContent] = useState<ContentResponse | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null
  })

  const loadContent = useCallback(async () => {
    setLoadingState({ isLoading: true, error: null })
    
    try {
      const data = await getContent(type)
      setContent(data)
    } catch (error) {
      console.error(`Failed to load ${type} content:`, error)
      setLoadingState({
        isLoading: false,
        error: error instanceof Error ? error.message : '콘텐츠를 불러오는데 실패했습니다.'
      })

      return
    }
    
    setLoadingState({ isLoading: false, error: null })
  }, [type])

  // 다이얼로그가 열릴 때마다 콘텐츠 로드
  useEffect(() => {
    if (open && !content) {
      loadContent()
    }
  }, [open, content, type, loadContent])

  const title = type === 'terms' ? '서비스 이용약관' : '개인정보 처리방침'
  const description = type === 'terms' 
    ? 'ReadZone 서비스 이용에 관한 약관을 확인해 주세요.'
    : 'ReadZone의 개인정보 처리방침을 확인해 주세요.'

  const handleAgree = () => {
    onAgree()
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  // 다이얼로그가 닫힐 때 콘텐츠 초기화 (메모리 절약)
  useEffect(() => {
    if (!open) {
      setContent(null)
      setLoadingState({ isLoading: false, error: null })
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {title}
            {content?.metadata && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                v{content.metadata.version}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            <span>{description}</span>
            {content?.metadata && (
              <span className="block mt-1 text-xs text-muted-foreground">
                적용일: {new Date(content.metadata.effectiveDate).toLocaleDateString('ko-KR')}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {loadingState.isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">
                콘텐츠를 불러오는 중...
              </div>
            </div>
          )}
          
          {loadingState.error && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="text-sm text-destructive">
                {loadingState.error}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadContent}
                disabled={loadingState.isLoading}
              >
                다시 시도
              </Button>
            </div>
          )}
          
          {content && !loadingState.isLoading && !loadingState.error && (
            <div className="whitespace-pre-line text-sm text-muted-foreground">
              {content.content}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loadingState.isLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleAgree}
            disabled={loadingState.isLoading || loadingState.error !== null}
          >
            동의합니다
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}