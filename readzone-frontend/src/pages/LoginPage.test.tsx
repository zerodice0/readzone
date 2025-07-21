import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApiResponse, createMockAxios } from '../test/utils';
import LoginPage from './LoginPage';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock auth store
    const { useAuthStore } = await import('../stores/authStore');
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      user: null,
      token: null,
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Mock navigate
    const { useNavigate } = await import('react-router-dom');
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('renders login form correctly', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: /로그인/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
    expect(screen.getByText(/회원가입/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /로그인/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/이메일을 입력해주세요/i)).toBeInTheDocument();
      expect(screen.getByText(/비밀번호를 입력해주세요/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const submitButton = screen.getByRole('button', { name: /로그인/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/올바른 이메일 형식을 입력해주세요/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const submitButton = screen.getByRole('button', { name: /로그인/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows loading state during login', () => {
    const { useAuthStore } = require('../stores/authStore');
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      user: null,
      token: null,
      logout: vi.fn(),
      register: vi.fn(),
    });

    renderWithProviders(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /로그인/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/로그인 중.../i)).toBeInTheDocument();
  });

  it('shows error message when login fails', () => {
    const { useAuthStore } = require('../stores/authStore');
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      user: null,
      token: null,
      logout: vi.fn(),
      register: vi.fn(),
    });

    renderWithProviders(<LoginPage />);

    expect(screen.getByText(/이메일 또는 비밀번호가 올바르지 않습니다/i)).toBeInTheDocument();
  });

  it('navigates to register page when register link is clicked', () => {
    renderWithProviders(<LoginPage />);

    const registerLink = screen.getByText(/회원가입/i);
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('allows login with username instead of email', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const submitButton = screen.getByRole('button', { name: /로그인/i });

    fireEvent.change(emailInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'testuser',
        password: 'password123',
      });
    });
  });

  it('handles keyboard navigation', () => {
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);

    fireEvent.keyDown(emailInput, { key: 'Tab' });
    expect(passwordInput).toHaveFocus();
  });
});