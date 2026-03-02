import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';
import { safeFetch, handleFetchError } from '../utils/apiError';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  channel_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

type TaskStatus = Task['status'];

const statusColors: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
};

const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
};

const priorityColors: Record<Task['priority'], string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const priorityLabels: Record<Task['priority'], string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export default function Tasks() {
  const { token, apiUrl } = useApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadTasks();
  }, [token, apiUrl]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('加载任务失败');

      const data = await res.json();
      setTasks(Array.isArray(data) ? data : (data.tasks || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setCreating(true);
      const res = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc || undefined,
          priority: newTaskPriority,
        }),
      });

      if (!res.ok) throw new Error('创建任务失败');

      await loadTasks();
      setShowCreateModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPriority('medium');
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const res = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('更新失败');

      await loadTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;

    try {
      const res = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('删除失败');

      await loadTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900">{task.title}</h4>
        <button
          onClick={() => deleteTask(task.id)}
          className="text-gray-400 hover:text-red-600 transition-colors"
          aria-label="Delete task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}
      
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}优先级
        </span>
        <span className="text-xs text-gray-500">
          {new Date(task.created_at).toLocaleDateString('zh-CN')}
        </span>
      </div>
      
      <div className="flex gap-2">
        {task.status !== 'todo' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => updateTaskStatus(task.id, task.status === 'done' ? 'in_progress' : 'todo')}
          >
            ←
          </Button>
        )}
        {task.status !== 'done' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => updateTaskStatus(task.id, task.status === 'todo' ? 'in_progress' : 'done')}
          >
            →
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">任务看板</h1>
            <p className="mt-1 text-gray-600">管理你的协同任务</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            创建任务
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(status => (
            <div key={status} className="bg-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">{statusLabels[status]}</h2>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
                  {tasksByStatus[status].length}
                </span>
              </div>
              <div className="space-y-3">
                {tasksByStatus[status].map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasksByStatus[status].length === 0 && (
                  <p className="text-center text-gray-500 py-8 text-sm">暂无任务</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新任务"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTask} loading={creating}>
              创建
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="任务标题"
            placeholder="输入任务标题"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任务描述
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="可选的任务描述"
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              优先级
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newTaskPriority}
              onChange={e => setNewTaskPriority(e.target.value as Task['priority'])}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
