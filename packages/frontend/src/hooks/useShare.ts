import { useCallback } from 'react';
import { toast } from '../utils/toast';

interface ShareData {
  title: string;
  text?: string;
  url: string;
}

interface UseShareReturn {
  share: (data: ShareData) => Promise<void>;
  canUseNativeShare: boolean;
}

/**
 * Web Share API를 활용한 공유 훅
 * - 모바일: 네이티브 공유 메뉴 (카카오톡, 메시지 등)
 * - 데스크톱 (미지원 시): 클립보드 복사로 폴백
 */
export function useShare(): UseShareReturn {
  const canUseNativeShare =
    typeof navigator !== 'undefined' && 'share' in navigator;

  const share = useCallback(
    async (data: ShareData): Promise<void> => {
      // Web Share API 지원 시 네이티브 공유 메뉴 사용
      if (canUseNativeShare) {
        try {
          await navigator.share({
            title: data.title,
            text: data.text,
            url: data.url,
          });
          // 공유 성공 시 토스트 표시하지 않음 (OS가 처리)
        } catch (error) {
          // 사용자가 공유를 취소한 경우 (AbortError)는 무시
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          // 그 외 에러는 클립보드 복사로 폴백
          await fallbackToClipboard(data.url);
        }
        return;
      }

      // Web Share API 미지원 시 클립보드 복사
      await fallbackToClipboard(data.url);
    },
    [canUseNativeShare]
  );

  return { share, canUseNativeShare };
}

async function fallbackToClipboard(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    toast.success('링크가 복사되었습니다');
  } catch {
    toast.error('링크 복사에 실패했습니다');
  }
}
