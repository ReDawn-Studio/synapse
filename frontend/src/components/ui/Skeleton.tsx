import './Skeleton.css';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({ className = '', width, height, borderRadius = '4px' }: SkeletonProps) {
  const style: React.CSSProperties = {
    width,
    height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  };

  return <div className={`skeleton ${className}`} style={style} />;
}

interface SkeletonListProps {
  count: number;
  height?: string;
  gap?: string;
}

export function SkeletonList({ count, height = '20px', gap = '12px' }: SkeletonListProps) {
  return (
    <div className="skeleton-list" style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height="24px" width="60%" />
      <Skeleton height="16px" width="80%" style={{ marginTop: '8px' }} />
      <Skeleton height="16px" width="40%" style={{ marginTop: '8px' }} />
    </div>
  );
}
