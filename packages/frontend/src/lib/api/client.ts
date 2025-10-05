import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// ✅ Refresh Token Request Queue - 동시 401 요청 처리
interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

const failedQueue: QueueItem[] = [];
let isRefreshing = false;

/**
 * 대기 중인 모든 요청을 처리 (성공/실패)
 */
const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });

  failedQueue.length = 0;
};

const getCurrentPath = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.pathname;
};

// Request interceptor for auth token sourced from zustand auth store
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      // ✅ Refresh 진행 중이면 큐에 추가하고 대기
      if (isRefreshing) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[API] Refresh in progress, queuing request:', originalRequest.url);
        }

        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Refresh 완료 후 새 토큰으로 재시도
            const token = useAuthStore.getState().accessToken;

            if (token) {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }

            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[API] Starting token refresh for request:', originalRequest.url);
      }

      try {
        const refreshed = await useAuthStore.getState().refreshTokens();

        if (refreshed) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[API] Token refresh successful, processing queue');
          }

          // ✅ 큐의 모든 요청 처리
          processQueue(null);

          const token = useAuthStore.getState().accessToken;

          if (token) {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }

          return api(originalRequest);
        } else {
          // Refresh 실패 시 큐의 모든 요청 실패 처리
          processQueue(new Error('Token refresh failed'));

          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        if (import.meta.env.DEV) {
          console.warn('[API] Failed to refresh token after 401:', refreshError);
        }

        // 큐의 모든 요청 실패 처리
        processQueue(refreshError instanceof Error ? refreshError : new Error('Token refresh failed'));

        throw refreshError;
      } finally {
        // ✅ Refresh 완료 후 플래그 초기화
        isRefreshing = false;
      }
    }

    if (status === 401) {
      const currentPath = getCurrentPath();

      // settings 페이지에서는 폴백 UI가 처리하도록 에러 전달
      if (currentPath.startsWith('/settings')) {
        return Promise.reject(error);
      }

      try {
        await useAuthStore.getState().logout();
      } catch (logoutError) {
        console.warn('[API] Failed to logout after unauthorized response:', logoutError);
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
