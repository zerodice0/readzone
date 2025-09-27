import { createContext } from 'react';
import type { BreakpointContextValue } from './BreakpointContext.types';

/**
 * 브레이크포인트 컨텍스트 객체
 * 반응형 디자인을 위한 브레이크포인트 정보를 제공합니다.
 */
export const BreakpointContext = createContext<BreakpointContextValue | null>(
  null
);
