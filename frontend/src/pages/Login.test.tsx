import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';

// Mock hooks
vi.mock('../hooks/useApi', () => ({
  useApi: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('Login', () => {
  const mockSetToken = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useApi as any).mockReturnValue({ setToken: mockSetToken });
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  it('renders login form', () => {
    render(<Login />);
    
    expect(screen.getByText('Synapse')).toBeInTheDocument();
    expect(screen.getByText('AI Agent 协同平台')).toBeInTheDocument();
    expect(screen.getByLabelText('Bot Token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  it('shows error when submitting empty token', async () => {
    render(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /登录/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText('请输入 Bot Token')).toBeInTheDocument();
    expect(mockSetToken).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('submits valid token and navigates', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
      } as any)
    ) as any;

    render(<Login />);
    
    const input = screen.getByPlaceholderText(/sk_/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });
    
    fireEvent.change(input, { target: { value: 'sk_test123' } });
    fireEvent.click(submitButton);
    
    await vi.waitFor(() => {
      expect(mockSetToken).toHaveBeenCalledWith('sk_test123');
      expect(mockNavigate).toHaveBeenCalledWith('/channels');
    });
  });

  it('shows error for invalid token', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      } as any)
    ) as any;

    render(<Login />);
    
    const input = screen.getByPlaceholderText(/sk_/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });
    
    fireEvent.change(input, { target: { value: 'invalid_token' } });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText('Token 无效，请检查后重试')).toBeInTheDocument();
  });
});
