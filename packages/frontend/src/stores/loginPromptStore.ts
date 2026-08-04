import { create } from 'zustand';

/**
 * T104: Login Prompt Store
 * Global state for managing login prompt modal
 */

interface LoginPromptState {
  isOpen: boolean;
  message: string;
  returnUrl: string | null;
  show: (message?: string, returnUrl?: string) => void;
  hide: () => void;
}

export const useLoginPromptStore = create<LoginPromptState>((set) => ({
  isOpen: false,
  message: '이 기능을 사용하려면 로그인이 필요합니다.',
  returnUrl: null,

  show: (message?: string, returnUrl?: string) => {
    set({
      isOpen: true,
      message: message || '이 기능을 사용하려면 로그인이 필요합니다.',
      returnUrl: returnUrl ?? null,
    });
  },

  hide: () => {
    set({ isOpen: false, returnUrl: null });
  },
}));
