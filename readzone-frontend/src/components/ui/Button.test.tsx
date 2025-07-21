import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';

// Mock Button component
const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      {...props}
    >
      {children}
    </button>
  );
};

describe('Button', () => {
  it('renders children correctly', () => {
    renderWithProviders(<Button>Click me</Button>);
    
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    renderWithProviders(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies primary variant styles by default', () => {
    renderWithProviders(<Button>Primary Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });

  it('applies secondary variant styles', () => {
    renderWithProviders(<Button variant="secondary">Secondary Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-600', 'text-white');
  });

  it('applies outline variant styles', () => {
    renderWithProviders(<Button variant="outline">Outline Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-gray-300', 'text-gray-700');
  });

  it('applies ghost variant styles', () => {
    renderWithProviders(<Button variant="ghost">Ghost Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-gray-700');
  });

  it('applies small size styles', () => {
    renderWithProviders(<Button size="sm">Small Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-2', 'py-1', 'text-sm');
  });

  it('applies medium size styles by default', () => {
    renderWithProviders(<Button>Medium Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2');
  });

  it('applies large size styles', () => {
    renderWithProviders(<Button size="lg">Large Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('can be a submit button', () => {
    renderWithProviders(<Button type="submit">Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('accepts custom className', () => {
    renderWithProviders(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('applies disabled styles when disabled', () => {
    renderWithProviders(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('supports keyboard navigation', () => {
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Keyboard Button</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(button).toHaveFocus();
    
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('has proper focus styles', () => {
    renderWithProviders(<Button>Focus Test</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  it('forwards additional props', () => {
    renderWithProviders(
      <Button data-testid="custom-button" aria-label="Custom aria label">
        Props Button
      </Button>
    );
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom aria label');
  });

  it('handles rapid clicks properly', () => {
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Rapid Click Test</Button>);
    
    const button = screen.getByRole('button');
    
    // Simulate rapid clicks
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('maintains accessibility with screen readers', () => {
    renderWithProviders(
      <Button aria-describedby="help-text">
        Accessible Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-describedby', 'help-text');
  });
});