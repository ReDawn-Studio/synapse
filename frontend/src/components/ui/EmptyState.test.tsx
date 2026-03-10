import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState, EmptyStateItem } from './EmptyState';
import Button from './Button';

// Mock Button component
jest.mock('./Button', () => {
  return jest.fn(({ children, onClick }) => (
    <button onClick={onClick} data-testid="mock-button">
      {children}
    </button>
  ));
});

describe('EmptyState', () => {
  it('renders default empty state', () => {
    render(<EmptyState />);
    
    expect(screen.getByText('📦')).toBeInTheDocument();
    expect(screen.getByText('暂无内容')).toBeInTheDocument();
  });

  it('renders channels empty state', () => {
    render(<EmptyState type="channels" />);
    
    expect(screen.getByText('📭')).toBeInTheDocument();
    expect(screen.getByText('暂无频道')).toBeInTheDocument();
    expect(screen.getByText('创建第一个频道，开始协作吧')).toBeInTheDocument();
  });

  it('renders tasks empty state', () => {
    render(<EmptyState type="tasks" />);
    
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('暂无任务')).toBeInTheDocument();
    expect(screen.getByText('创建一个任务来追踪工作进度')).toBeInTheDocument();
  });

  it('renders messages empty state', () => {
    render(<EmptyState type="messages" />);
    
    expect(screen.getByText('💬')).toBeInTheDocument();
    expect(screen.getByText('暂无消息')).toBeInTheDocument();
    expect(screen.getByText('消息将显示在这里')).toBeInTheDocument();
  });

  it('renders search empty state', () => {
    render(<EmptyState type="search" />);
    
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('未找到结果')).toBeInTheDocument();
    expect(screen.getByText('尝试调整搜索关键词')).toBeInTheDocument();
  });

  it('renders notifications empty state', () => {
    render(<EmptyState type="notifications" />);
    
    expect(screen.getByText('🔔')).toBeInTheDocument();
    expect(screen.getByText('暂无通知')).toBeInTheDocument();
    expect(screen.getByText('有新通知时会显示在这里')).toBeInTheDocument();
  });

  it('renders custom empty state with custom props', () => {
    render(
      <EmptyState
        type="custom"
        icon="🎉"
        title="自定义标题"
        description="自定义描述"
      />
    );
    
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('自定义标题')).toBeInTheDocument();
    expect(screen.getByText('自定义描述')).toBeInTheDocument();
  });

  it('renders action button when onAction is provided', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        type="channels"
        actionLabel="创建频道"
        onAction={onAction}
      />
    );
    
    const button = screen.getByTestId('mock-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('创建频道');
    
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState type="channels" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('custom props override defaults', () => {
    render(
      <EmptyState
        type="channels"
        icon="🚀"
        title="自定义标题"
        description="自定义描述"
      />
    );
    
    expect(screen.getByText('🚀')).toBeInTheDocument();
    expect(screen.getByText('自定义标题')).toBeInTheDocument();
    expect(screen.getByText('自定义描述')).toBeInTheDocument();
  });
});

describe('EmptyStateItem', () => {
  it('renders with default icon', () => {
    render(<EmptyStateItem text="默认图标" />);
    
    expect(screen.getByText('📦')).toBeInTheDocument();
    expect(screen.getByText('默认图标')).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    render(<EmptyStateItem icon="⭐" text="自定义图标" />);
    
    expect(screen.getByText('⭐')).toBeInTheDocument();
    expect(screen.getByText('自定义图标')).toBeInTheDocument();
  });
});
