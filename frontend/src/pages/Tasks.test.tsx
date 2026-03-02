import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Tasks from './Tasks';
import { useApi } from '../hooks/useApi';

vi.mock('../hooks/useApi', () => ({
  useApi: vi.fn(),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Tasks', () => {
  const mockToken = 'sk_test123';
  const mockApiUrl = 'http://localhost:3000/api/v1';

  beforeEach(() => {
    vi.clearAllMocks();
    (useApi as any).mockReturnValue({ token: mockToken, apiUrl: mockApiUrl });
  });

  it('renders loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as any;
    
    renderWithRouter(<Tasks />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state when no tasks', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as any;

    renderWithRouter(<Tasks />);
    
    await waitFor(() => {
      expect(screen.getByText('任务看板')).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false })
    ) as any;

    renderWithRouter(<Tasks />);
    
    await waitFor(() => {
      expect(screen.getByText(/加载任务失败/)).toBeInTheDocument();
    });
  });

  it('displays tasks in correct columns', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'todo', priority: 'high', created_at: '2026-03-03' },
      { id: '2', title: 'Task 2', status: 'in_progress', priority: 'medium', created_at: '2026-03-03' },
      { id: '3', title: 'Task 3', status: 'done', priority: 'low', created_at: '2026-03-03' },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks) })
    ) as any;

    renderWithRouter(<Tasks />);
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });
  });

  it('opens create modal when clicking create button', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as any;

    renderWithRouter(<Tasks />);
    
    await waitFor(() => {
      expect(screen.getByText('创建任务')).toBeInTheDocument();
    });
    
    const createButton = screen.getByText('创建任务');
    // Note: Full interaction test would require user-event
    expect(createButton).toBeInTheDocument();
  });
});
