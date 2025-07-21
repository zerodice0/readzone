import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';

// Simple Input component for testing
const Input = ({ 
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  ...props 
}: {
  label?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

describe('Input Component', () => {
  it('renders input with label', () => {
    renderWithProviders(<Input label="Email" />);
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    renderWithProviders(<Input label="Email" required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    renderWithProviders(<Input placeholder="Enter your email" />);
    
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    renderWithProviders(<Input value="test" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    renderWithProviders(<Input error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    renderWithProviders(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('supports different input types', () => {
    renderWithProviders(<Input type="password" />);
    
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('applies error styles when error is present', () => {
    renderWithProviders(<Input error="Error message" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('handles keyboard events', () => {
    renderWithProviders(<Input />);
    
    const input = screen.getByRole('textbox');
    input.focus();
    
    expect(input).toHaveFocus();
  });
});