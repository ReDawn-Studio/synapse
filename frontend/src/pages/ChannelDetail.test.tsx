import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChannelDetail from './pages/ChannelDetail';
import { useApi } from './hooks/useApi';
import { useParams } from 'react-router-dom';

// Mock hooks
vi.mock('./hooks/useApi', () => ({
  useApi: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('ChannelDetail', () => {
  const mockToken = 'sk_test123';
  const mockApiUrl = 'http://localhost:3000/api/v1';
  const mockChannelId = 'channel-1';
  const mockMessages = [
    {
      id: 'msg-1',
      content: 'Hello, this is a test message',
      bot_id: 'bot-1',
      created_at: '2026-03-03T06:00:00Z',
    },
    {
      id: 'msg-2',
      content: 'Another message',
      bot_id: 'bot-2',
      created_at: '2026-03-03T06:05:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ id: mockChannelId });
    (useApi as any).mockReturnValue({
      token: mockToken,
      apiUrl: mockApiUrl,
      setToken: vi.fn(),
    });

    // Mock Date.now for consistent timestamps
    vi.spyOn(Date, 'now').mockReturnValue(1741032000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock fetch to simulate loading
    global.fetch = vi.fn(() => new Promise(() => {})) as any;

    render(<ChannelDetail />);

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders messages after successful fetch', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: mockMessages }),
      } as any);

    render(<ChannelDetail />);

    await waitFor(() => {
      expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
      expect(screen.getByText('Another message')).toBeInTheDocument();
    });

    expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
  });

  it('renders empty state when no messages', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ messages: [] }),
    } as any);

    render(<ChannelDetail />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // Should show the message input form even when empty
    expect(screen.getByPlaceholderText(/输入消息/i)).toBeInTheDocument();
  });

  it('displays message timestamps correctly', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ messages: mockMessages }),
    } as any);

    render(<ChannelDetail />);

    await waitFor(() => {
      // Check that time is formatted (should show HH:MM format)
      const times = screen.getAllByText(/\d{2}:\d{2}/);
      expect(times.length).toBeGreaterThan(0);
    });
  });

  it('allows sending a new message', async () => {
    const newMessage = {
      id: 'msg-3',
      content: 'New test message',
      bot_id: 'bot-1',
      created_at: '2026-03-03T06:10:00Z',
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: mockMessages }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newMessage),
      } as any);

    render(<ChannelDetail />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/输入消息/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/输入消息/i);
    const sendButton = screen.getByRole('button', { name: /发送/i });

    fireEvent.change(input, { target: { value: 'New test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('New test message')).toBeInTheDocument();
    });

    // Verify fetch was called for POST
    expect(global.fetch).toHaveBeenCalledWith(
      `${mockApiUrl}/channels/${mockChannelId}/messages`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('prevents sending empty messages', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ messages: mockMessages }),
    } as any);

    render(<ChannelDetail />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/输入消息/i)).toBeInTheDocument();
    });

    const sendButton = screen.getByRole('button', { name: /发送/i });
    fireEvent.click(sendButton);

    // Should not call fetch for empty message
    await waitFor(() => {
      const postCalls = (global.fetch as any).mock.calls.filter(
        (call: any[]) => call[1]?.method === 'POST'
      );
      expect(postCalls.length).toBe(0);
    });
  });

  it('shows navigation links', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ messages: mockMessages }),
    } as any);

    render(<ChannelDetail />);

    await waitFor(() => {
      expect(screen.getByText('← 返回')).toBeInTheDocument();
      expect(screen.getByText('频道')).toBeInTheDocument();
      expect(screen.getByText('任务')).toBeInTheDocument();
    });
  });

  it('calls setToken on logout', async () => {
    const mockSetToken = vi.fn();
    (useApi as any).mockReturnValue({
      token: mockToken,
      apiUrl: mockApiUrl,
      setToken: mockSetToken,
    });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ messages: mockMessages }),
    } as any);

    render(<ChannelDetail />);

    await waitFor(() => {
      expect(screen.getByText('退出')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('退出');
    fireEvent.click(logoutButton);

    expect(mockSetToken).toHaveBeenCalledWith(null);
  });

  it('handles fetch error gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(<ChannelDetail />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // Should not crash, should show empty state
    expect(screen.getByPlaceholderText(/输入消息/i)).toBeInTheDocument();
  });

  it('auto-scrolls to bottom when new messages arrive', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ messages: mockMessages }),
    } as any);

    render(<ChannelDetail />);

    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});
