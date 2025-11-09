import { create } from 'zustand';

/**
 * T104: Login Prompt Store
 * Global state for managing login prompt modal
 */

interface LoginPromptState {
  isOpen: boolean;
  message: string;
  show: (message?: string) => void;
  hide: () => void;
}

export const useLoginPromptStore = create<LoginPromptState>((set) => ({
  isOpen: false,
  message: '이 기능을 사용하려면 로그인이 필요합니다.',

  show: (message?: string) => {
    set({
      isOpen: true,
      message: message || '이 기능을 사용하려면 로그인이 필요합니다.',
    });
  },

  hide: () => {
    set({ isOpen: false });
  },
}));
