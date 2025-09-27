import { useContext } from 'react';
import { BreakpointContext } from '@/contexts/BreakpointContext.context';
import type { BreakpointContextValue } from '@/contexts/BreakpointContext.types';

/**
 * 브레이크포인트 컨텍스트 사용 훅
 */
export function useBreakpointContext(): BreakpointContextValue {
  const context = useContext(BreakpointContext);

  if (!context) {
    throw new Error(
      'useBreakpointContext must be used within a BreakpointProvider'
    );
  }

  return context;
}
