import type { FC } from 'react'
import { AlertDialog } from '@/components/ui/alert-dialog'

interface SettingsNavigationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToSettings: () => void
}

/**
 * 프로필 페이지에서 설정 페이지로 이동할 때 표시되는 안내 모달
 * AlertDialog를 활용하여 사용자에게 명확한 안내 제공
 */
export const SettingsNavigationModal: FC<SettingsNavigationModalProps> = ({
  open,
  onOpenChange,
  onNavigateToSettings,
}) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="프로필 설정"
      description="프로필 이미지, 사용자명, 자기소개, 소셜 링크, 프라이버시 설정 등을 설정 페이지에서 편집할 수 있습니다. 설정 페이지로 이동하시겠습니까?"
      confirmText="설정 페이지로 이동"
      cancelText="취소"
      onConfirm={onNavigateToSettings}
    />
  )
}