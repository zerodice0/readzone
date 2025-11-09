import axios, { AxiosInstance, AxiosError } from 'axios';
import { logError } from '../utils/error';

/**
 * T101: API Client Utility
 * Axios instance with JWT token injection and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for CSRF protection
});

// Request interceptor: Inject JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');

      // Redirect to login if not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      logError(error, 'Access forbidden');
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      logError(error, 'Server error');
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Type definitions for API responses
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// API functions
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', data),

  logout: () => apiClient.post('/auth/logout'),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post('/auth/reset-password', data),

  verifyEmail: (token: string) => apiClient.get(`/auth/verify-email/${token}`),

  resendVerification: () => apiClient.post('/auth/resend-verification'),

  getCurrentUser: () =>
    apiClient.get<{ user: LoginResponse['user'] }>('/auth/me'),
};
