import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Link } from 'react-router-dom';

interface Channel {
  id: string;
  name: string;
  description?: string;
}

export default function Channels() {
  const { token, apiUrl, setToken } = useApi();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch(`${apiUrl}/channels`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setChannels(data.channels || []))
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, [token, apiUrl]);

  const handleLogout = () => {
    setToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">频道列表</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {channels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">暂无频道</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {channels.map(channel => (
              <Link
                key={channel.id}
                to={`/channels/${channel.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-200"
              >
                <h2 className="font-semibold text-slate-800">{channel.name}</h2>
                {channel.description && (
                  <p className="text-sm text-slate-500 mt-1">{channel.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}