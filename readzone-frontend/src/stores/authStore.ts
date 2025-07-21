import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string; // 아이디
  nickname: string; // 닉네임
  bio: string | null;
  avatar: string | null;
  isPublic: boolean;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, nickname: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (username: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authAPI.login({ username, password });
          const { user, token } = response.data;
          
          console.log('Login successful:', { user, token: token ? '***' : null });
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // 토큰 저장 확인을 위한 디버그 로그
          setTimeout(() => {
            const storage = localStorage.getItem('auth-storage');
            console.log('Auth storage after login:', storage ? JSON.parse(storage) : null);
          }, 100);
          
        } catch (error: any) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.error?.message || '로그인에 실패했습니다.',
          });
          throw error;
        }
      },

      register: async (email: string, username: string, nickname: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authAPI.register({ email, username, nickname, password });
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error?.message || '회원가입에 실패했습니다.',
          });
          throw error;
        }
      },

      logout: () => {
        try {
          authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      refreshUser: async () => {
        try {
          const { token } = get();
          if (!token) return;

          set({ isLoading: true });
          
          const response = await authAPI.getMe();
          const user = response.data;
          
          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Refresh user error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.error?.message || '사용자 정보를 불러오는데 실패했습니다.',
          });
          
          // If token is invalid, logout
          if (error.response?.status === 401) {
            get().logout();
          }
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);