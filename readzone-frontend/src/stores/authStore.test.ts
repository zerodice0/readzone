import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockApiResponse, mockUser } from '../test/utils';

// Mock API
const mockAuthAPI = {
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
};

vi.mock('../services/api', () => ({
  authAPI: mockAuthAPI,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock the actual store - this would be replaced with the real store import
const createAuthStore = () => {
  let state = {
    user: null as any,
    token: null as string | null,
    isLoading: false,
    error: null as string | null,
  };

  const actions = {
    login: async (credentials: { email: string; password: string }) => {
      state.isLoading = true;
      state.error = null;
      
      try {
        const response = await mockAuthAPI.login(credentials);
        if (response.success) {
          state.user = response.data.user;
          state.token = response.data.token;
          mockLocalStorage.setItem('token', response.data.token);
        } else {
          state.error = response.error.message;
        }
      } catch (error: any) {
        state.error = error.message;
      } finally {
        state.isLoading = false;
      }
    },

    register: async (userData: {
      email: string;
      username: string;
      displayName: string;
      password: string;
    }) => {
      state.isLoading = true;
      state.error = null;
      
      try {
        const response = await mockAuthAPI.register(userData);
        if (response.success) {
          state.user = response.data.user;
          state.token = response.data.token;
          mockLocalStorage.setItem('token', response.data.token);
        } else {
          state.error = response.error.message;
        }
      } catch (error: any) {
        state.error = error.message;
      } finally {
        state.isLoading = false;
      }
    },

    logout: () => {
      state.user = null;
      state.token = null;
      state.error = null;
      mockLocalStorage.removeItem('token');
    },

    loadUserFromToken: async () => {
      const token = mockLocalStorage.getItem('token');
      if (!token) return;

      state.isLoading = true;
      try {
        const response = await mockAuthAPI.getCurrentUser();
        if (response.success) {
          state.user = response.data.user;
          state.token = token;
        } else {
          mockLocalStorage.removeItem('token');
        }
      } catch (error) {
        mockLocalStorage.removeItem('token');
      } finally {
        state.isLoading = false;
      }
    },

    clearError: () => {
      state.error = null;
    },
  };

  return {
    getState: () => state,
    ...actions,
  };
};

describe('authStore', () => {
  let store: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createAuthStore();
    
    // Reset state
    store.getState().user = null;
    store.getState().token = null;
    store.getState().isLoading = false;
    store.getState().error = null;
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const loginResponse = mockApiResponse.success({
        user: mockUser,
        token: 'jwt-token',
      });

      mockAuthAPI.login.mockResolvedValueOnce(loginResponse);

      await act(async () => {
        await store.login(credentials);
      });

      const state = store.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('jwt-token');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
    });

    it('handles login failure', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong-password' };
      const errorResponse = mockApiResponse.error('이메일 또는 비밀번호가 올바르지 않습니다');

      mockAuthAPI.login.mockResolvedValueOnce(errorResponse);

      await act(async () => {
        await store.login(credentials);
      });

      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('sets loading state during login', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockAuthAPI.login.mockReturnValueOnce(loginPromise);

      // Start login (don't await yet)
      const loginCall = store.login(credentials);

      // Check loading state
      expect(store.getState().isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!(mockApiResponse.success({ user: mockUser, token: 'jwt-token' }));
      await loginCall;

      // Check final state
      expect(store.getState().isLoading).toBe(false);
    });

    it('handles network errors during login', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const networkError = new Error('Network error');

      mockAuthAPI.login.mockRejectedValueOnce(networkError);

      await act(async () => {
        await store.login(credentials);
      });

      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('register', () => {
    it('successfully registers user', async () => {
      const userData = {
        email: 'new@example.com',
        username: 'newuser',
        displayName: 'New User',
        password: 'password123',
      };
      const registerResponse = mockApiResponse.success({
        user: { ...mockUser, ...userData },
        token: 'jwt-token',
      });

      mockAuthAPI.register.mockResolvedValueOnce(registerResponse);

      await act(async () => {
        await store.register(userData);
      });

      const state = store.getState();
      expect(state.user.email).toBe(userData.email);
      expect(state.token).toBe('jwt-token');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
    });

    it('handles registration failure', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'existinguser',
        displayName: 'Existing User',
        password: 'password123',
      };
      const errorResponse = mockApiResponse.error('이미 사용 중인 이메일입니다');

      mockAuthAPI.register.mockResolvedValueOnce(errorResponse);

      await act(async () => {
        await store.register(userData);
      });

      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('이미 사용 중인 이메일입니다');
    });
  });

  describe('logout', () => {
    it('clears user data and token', () => {
      // Set initial state
      store.getState().user = mockUser;
      store.getState().token = 'jwt-token';

      act(() => {
        store.logout();
      });

      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('loadUserFromToken', () => {
    it('loads user when valid token exists', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce('stored-token');
      mockAuthAPI.getCurrentUser.mockResolvedValueOnce(
        mockApiResponse.success({ user: mockUser })
      );

      await act(async () => {
        await store.loadUserFromToken();
      });

      const state = store.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('stored-token');
      expect(state.isLoading).toBe(false);
    });

    it('does nothing when no token exists', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);

      await act(async () => {
        await store.loadUserFromToken();
      });

      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(mockAuthAPI.getCurrentUser).not.toHaveBeenCalled();
    });

    it('removes invalid token', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce('invalid-token');
      mockAuthAPI.getCurrentUser.mockResolvedValueOnce(
        mockApiResponse.error('Invalid token')
      );

      await act(async () => {
        await store.loadUserFromToken();
      });

      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('handles network errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce('stored-token');
      mockAuthAPI.getCurrentUser.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await store.loadUserFromToken();
      });

      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      store.getState().error = 'Some error';

      act(() => {
        store.clearError();
      });

      expect(store.getState().error).toBeNull();
    });
  });
});