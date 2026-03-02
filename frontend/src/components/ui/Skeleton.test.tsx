import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonList, SkeletonCard } from './Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('presentation') || document.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('skeleton');
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" />);
    const skeleton = document.querySelector('.skeleton.custom-class');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies custom width and height', () => {
    render(<Skeleton width="100px" height="50px" />);
    const skeleton = document.querySelector('.skeleton') as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
  });

  it('applies custom borderRadius', () => {
    render(<Skeleton borderRadius="8px" />);
    const skeleton = document.querySelector('.skeleton') as HTMLElement;
    expect(skeleton).toHaveStyle({ borderRadius: '8px' });
  });
});

describe('SkeletonList', () => {
  it('renders correct number of skeletons', () => {
    render(<SkeletonList count={3} />);
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons).toHaveLength(3);
  });

  it('applies custom height and gap', () => {
    render(<SkeletonList count={2} height="30px" gap="20px" />);
    const list = document.querySelector('.skeleton-list') as HTMLElement;
    expect(list).toHaveStyle({ gap: '20px' });
  });
});

describe('SkeletonCard', () => {
  it('renders card structure', () => {
    render(<SkeletonCard />);
    const card = document.querySelector('.skeleton-card');
    expect(card).toBeInTheDocument();
    
    const skeletons = document.querySelectorAll('.skeleton-card .skeleton');
    expect(skeletons).toHaveLength(3);
  });
});
