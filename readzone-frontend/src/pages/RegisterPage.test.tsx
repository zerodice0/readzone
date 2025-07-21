import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import RegisterPage from './RegisterPage';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    register: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

describe('RegisterPage', () => {
  const mockRegister = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock auth store
    const { useAuthStore } = await import('../stores/authStore');
    vi.mocked(useAuthStore).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    // Mock navigate
    const { useNavigate } = await import('react-router-dom');
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('renders register form correctly', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByRole('heading', { name: /회원가입/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/사용자명/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/닉네임/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호 확인/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /회원가입/i })).toBeInTheDocument();
    expect(screen.getByText(/로그인/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /회원가입/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/이메일을 입력해주세요/i)).toBeInTheDocument();
      expect(screen.getByText(/사용자명을 입력해주세요/i)).toBeInTheDocument();
      expect(screen.getByText(/닉네임을 입력해주세요/i)).toBeInTheDocument();
      expect(screen.getByText(/비밀번호를 입력해주세요/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    renderWithProviders(<RegisterPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const submitButton = screen.getByRole('button', { name: /회원가입/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/올바른 이메일 형식을 입력해주세요/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short username', async () => {
    renderWithProviders(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/i);
    const submitButton = screen.getByRole('button', { name: /회원가입/i });

    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/사용자명은 3자 이상이어야 합니다/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderWithProviders(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const submitButton = screen.getByRole('button', { name: /회원가입/i });

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/비밀번호는 8자 이상이어야 합니다/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for password mismatch', async () => {
    renderWithProviders(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i);
    const submitButton = screen.getByRole('button', { name: /회원가입/i });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockRegister.mockResolvedValueOnce(undefined);

    renderWithProviders(<RegisterPage />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const usernameInput = screen.getByLabelText(/사용자명/i);
    const displayNameInput = screen.getByLabelText(/닉네임/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i);
    const submitButton = screen.getByRole('button', { name: /회원가입/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        password: 'password123',
      });
    });
  });

  it('shows loading state during registration', () => {
    const { useAuthStore } = require('../stores/authStore');
    vi.mocked(useAuthStore).mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProviders(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /회원가입/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/회원가입 중.../i)).toBeInTheDocument();
  });

  it('shows error message when registration fails', () => {
    const { useAuthStore } = require('../stores/authStore');
    vi.mocked(useAuthStore).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: '이미 사용 중인 이메일입니다.',
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderWithProviders(<RegisterPage />);

    expect(screen.getByText(/이미 사용 중인 이메일입니다/i)).toBeInTheDocument();
  });

  it('navigates to login page when login link is clicked', () => {
    renderWithProviders(<RegisterPage />);

    const loginLink = screen.getByText(/로그인/i);
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('shows username format validation', async () => {
    renderWithProviders(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/i);
    const submitButton = screen.getByRole('button', { name: /회원가입/i });

    // Test invalid characters
    fireEvent.change(usernameInput, { target: { value: 'user@name' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/사용자명은 영문자와 숫자만 사용할 수 있습니다/i)).toBeInTheDocument();
    });
  });

  it('validates username length constraints', async () => {
    renderWithProviders(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/사용자명/i);
    const submitButton = screen.getByRole('button', { name: /회원가입/i });

    // Test too long username
    fireEvent.change(usernameInput, { target: { value: 'a'.repeat(31) } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/사용자명은 30자 이하여야 합니다/i)).toBeInTheDocument();
    });
  });

  it('handles form submission with Enter key', async () => {
    mockRegister.mockResolvedValueOnce(undefined);

    renderWithProviders(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/비밀번호 확인/i);

    // Fill form
    fireEvent.change(screen.getByLabelText(/이메일/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/사용자명/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/닉네임/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/비밀번호/i), { target: { value: 'password123' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit with Enter key
    fireEvent.keyDown(passwordInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
  });
});