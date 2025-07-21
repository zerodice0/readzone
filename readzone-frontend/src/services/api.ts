import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (Zustand persist)
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
          console.log('Adding auth token to request:', config.url);
        } else {
          console.log('No token found in auth storage for request:', config.url);
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    } else {
      console.log('No auth storage found for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.log('401 Unauthorized - clearing auth and redirecting to login');
        
        // Clear auth storage and redirect to login
        localStorage.removeItem('auth-storage');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Handle 429 Too Many Requests
      if (error.response.status === 429) {
        console.warn('Rate limit exceeded');
      }
      
      // Handle 500 Internal Server Error
      if (error.response.status >= 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      // Other error
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  
  register: (data: { email: string; username: string; nickname: string; password: string }) =>
    api.post('/auth/register', data),
  
  getMe: () => api.get('/auth/me'),
  
  updateProfile: (data: any) => api.put('/auth/profile', data),
  
  logout: () => api.post('/auth/logout'),
};

// Books API
export const booksAPI = {
  search: (query: string, params?: any) => api.get(`/books/search?q=${encodeURIComponent(query)}`, { params }),
  
  getById: (id: string) => api.get(`/books/${id}`),
  
  create: (data: any) => api.post('/books', data),
  
  getPopular: (params?: any) => api.get('/books/popular', { params }),
};

// Posts API
export const postsAPI = {
  getAll: (params?: any) => api.get('/posts', { params }),
  
  getById: (id: string) => api.get(`/posts/${id}`),
  
  create: (data: any) => api.post('/posts', data),
  
  update: (id: string, data: any) => api.put(`/posts/${id}`, data),
  
  delete: (id: string) => api.delete(`/posts/${id}`),
  
  like: (id: string) => api.post(`/posts/${id}/like`),
  
  unlike: (id: string) => api.delete(`/posts/${id}/like`),
};

// Users API
export const usersAPI = {
  getProfile: (id: string) => api.get(`/users/${id}`),
  
  search: (query: string) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  
  follow: (id: string) => api.post(`/users/${id}/follow`),
  
  unfollow: (id: string) => api.delete(`/users/${id}/follow`),
  
  getFollowers: (id: string) => api.get(`/users/${id}/followers`),
  
  getFollowing: (id: string) => api.get(`/users/${id}/following`),
};

// Comments API
export const commentsAPI = {
  getByPostId: (postId: string) => api.get(`/posts/${postId}/comments`),
  
  create: (postId: string, data: any) => api.post(`/posts/${postId}/comments`, data),
  
  update: (id: string, data: any) => api.put(`/comments/${id}`, data),
  
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// Library API
export const libraryAPI = {
  getBooks: (params?: any) => api.get('/library', { params }),
  
  addBook: (data: any) => api.post('/library', data),
  
  updateBook: (id: string, data: any) => api.put(`/library/${id}`, data),
  
  removeBook: (id: string) => api.delete(`/library/${id}`),
};

export default api;