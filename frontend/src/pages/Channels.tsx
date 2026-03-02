import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Link } from 'react-router-dom';

interface Channel {
  id: string;
  name: string;
  description?: string;
  is_private?: boolean;
  created_at?: string;
}

export default function Channels() {
  const { token, apiUrl, setToken } = useApi();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;

    loadChannels();
  }, [token, apiUrl]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/channels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('加载频道失败');
      }
      
      const data = await res.json();
      setChannels(Array.isArray(data) ? data : (data.channels || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      setCreating(true);
      const res = await fetch(`${apiUrl}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newChannelName.trim(),
          description: newChannelDesc.trim() || null,
          is_private: false
        })
      });

      if (!res.ok) {
        throw new Error('创建频道失败');
      }

      await loadChannels();
      setShowCreateModal(false);
      setNewChannelName('');
      setNewChannelDesc('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">加载频道列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">频道列表</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + 新建频道
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {error}
          </div>
        )}

        {channels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-500 mb-4">暂无频道</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              创建第一个频道 →
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {channels.map(channel => (
              <Link
                key={channel.id}
                to={`/channels/${channel.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-slate-800">{channel.name}</h2>
                    {channel.description && (
                      <p className="text-sm text-slate-500 mt-1">{channel.description}</p>
                    )}
                  </div>
                  {channel.is_private && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      私有
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* 创建频道弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">创建新频道</h2>
            <form onSubmit={handleCreateChannel}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    频道名称 *
                  </label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="例如：general"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    描述（可选）
                  </label>
                  <textarea
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    placeholder="这个频道的用途..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    rows={3}
                    disabled={creating}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={creating}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}