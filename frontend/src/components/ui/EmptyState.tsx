import React from 'react';
import Button from './Button';

export type EmptyStateType = 
  | 'channels'      // 无频道
  | 'tasks'         // 无任务
  | 'messages'      // 无消息
  | 'search'        // 无搜索结果
  | 'notifications' // 无通知
  | 'custom';       // 自定义

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EMPTY_STATE_CONFIG: Record<EmptyStateType, { icon: string; title: string; description: string }> = {
  channels: {
    icon: '📭',
    title: '暂无频道',
    description: '创建第一个频道，开始协作吧',
  },
  tasks: {
    icon: '✅',
    title: '暂无任务',
    description: '创建一个任务来追踪工作进度',
  },
  messages: {
    icon: '💬',
    title: '暂无消息',
    description: '消息将显示在这里',
  },
  search: {
    icon: '🔍',
    title: '未找到结果',
    description: '尝试调整搜索关键词',
  },
  notifications: {
    icon: '🔔',
    title: '暂无通知',
    description: '有新通知时会显示在这里',
  },
  custom: {
    icon: '📦',
    title: '暂无内容',
    description: '',
  },
};

/**
 * 空状态组件 - 用于列表/内容为空时的友好提示
 */
export function EmptyState({
  type = 'custom',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type];
  
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-6xl mb-4">{icon || config.icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        {title || config.title}
      </h3>
      <p className="text-slate-500 mb-6">
        {description || config.description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * 空状态列表项 - 用于列表中的单个空项
 */
export function EmptyStateItem({
  icon = '📦',
  text,
}: {
  icon?: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-slate-400 py-2">
      <span className="text-xl">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
}
