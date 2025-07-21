import React from 'react';
import { render, renderHook, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock data
export const mockUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  avatar: null,
  bio: 'Test bio',
  isPublic: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  _count: {
    posts: 5,
    followers: 10,
    following: 8,
  },
};

export const mockBook = {
  id: 'book-1',
  isbn: '9788934942467',
  title: '테스트 도서',
  author: '테스트 작가',
  publisher: '테스트 출판사',
  publishedDate: '2024-01-01',
  description: '테스트용 도서 설명',
  thumbnail: 'https://example.com/book.jpg',
  pageCount: 300,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockPost = {
  id: 'post-1',
  content: '테스트 독서 기록',
  rating: 5,
  tags: ['테스트', '소설'],
  isPublic: true,
  readingProgress: 100,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  userId: mockUser.id,
  bookId: mockBook.id,
  user: mockUser,
  book: mockBook,
  _count: {
    comments: 3,
    likes: 15,
  },
};

export const mockComment = {
  id: 'comment-1',
  content: '좋은 책이네요!',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  userId: 'user-2',
  postId: mockPost.id,
  parentId: null,
  user: {
    id: 'user-2',
    username: 'commenter',
    displayName: 'Commenter User',
    avatar: null,
  },
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  initialEntries?: string[];
  route?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    route = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export function renderHookWithProviders<TResult, TProps>(
  hook: (initialProps: TProps) => TResult,
  options?: any
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }

  return renderHook(hook, { wrapper: Wrapper, ...options });
}

// Mock API responses
export const mockApiResponse = {
  success: (data: any) => ({
    success: true,
    data,
  }),
  error: (message: string, code = 'ERROR') => ({
    success: false,
    error: {
      code,
      message,
    },
  }),
  paginated: (items: any[], page = 1, limit = 20, total?: number) => ({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total: total ?? items.length,
        totalPages: Math.ceil((total ?? items.length) / limit),
        hasNext: page * limit < (total ?? items.length),
        hasPrev: page > 1,
      },
    },
  }),
};

// Mock axios
export const createMockAxios = () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    request: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
    defaults: {
      headers: {
        common: {},
      },
    },
  };

  return mockAxios;
};

// Wait for next tick (useful for async operations)
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock router functions
export const mockNavigate = vi.fn();
export const mockUseLocation = vi.fn(() => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
}));
export const mockUseParams = vi.fn(() => ({}));

// Mock Zustand store
export const createMockStore = (initialState: any) => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (newState: any) => {
      state = typeof newState === 'function' 
        ? newState(state)
        : { ...state, ...newState };
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy: () => {
      listeners.clear();
    },
  };
};