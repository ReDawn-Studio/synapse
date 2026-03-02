import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<Input error="This is required" />);
    expect(screen.getByText('This is required')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('shows helper text', () => {
    render(<Input helperText="Optional hint" />);
    expect(screen.getByText('Optional hint')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('forwards HTML attributes', () => {
    render(<Input type="email" required minLength={5} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('minlength', '5');
  });
});
