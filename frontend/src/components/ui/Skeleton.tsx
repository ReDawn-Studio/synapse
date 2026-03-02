import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

/**
 * 骨架屏基础组件
 * 用于内容加载时的占位动画
 */
export function Skeleton({ 
  className = '', 
  width, 
  height, 
  borderRadius = '8px' 
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width,
    height,
    borderRadius,
    backgroundColor: '#e2e8f0',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  };

  return <div className={`skeleton ${className}`} style={style} />;
}

/**
 * 列表骨架屏 - 用于列表项加载
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton width="40px" height="40px" borderRadius="50%" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="16px" />
            <Skeleton width="40%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 卡片骨架屏 - 用于卡片式布局加载
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <Skeleton width="100%" height="120px" className="mb-4" />
      <Skeleton width="70%" height="20px" className="mb-2" />
      <Skeleton width="90%" height="16px" className="mb-2" />
      <Skeleton width="50%" height="16px" />
    </div>
  );
}

/**
 * 文本骨架屏 - 用于文本内容加载
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '60%' : '100%'} 
          height="16px" 
        />
      ))}
    </div>
  );
}
