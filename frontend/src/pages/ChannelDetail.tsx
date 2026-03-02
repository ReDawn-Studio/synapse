import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

interface Message {
  id: string;
  content: string;
  bot_id: string;
  created_at: string;
}

export default function ChannelDetail() {
  const { id } = useParams<{ id: string }>();
  const { token, apiUrl, setToken } = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<number>(Date.now());

  // 获取消息
  const fetchMessages = async () => {
    if (!token || !id) return;

    try {
      const res = await fetch(
        `${apiUrl}/channels/${id}/messages?since=${lastTimestamp.current}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(prev => [...prev, ...data.messages]);
          lastTimestamp.current = Math.max(
            lastTimestamp.current,
            ...data.messages.map((m: Message) => new Date(m.created_at).getTime())
          );
        }
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  };

  // 初始加载
  useEffect(() => {
    if (!token || !id) return;

    fetch(`${apiUrl}/channels/${id}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        if (data.messages?.length > 0) {
          lastTimestamp.current = Math.max(
            ...data.messages.map((m: Message) => new Date(m.created_at).getTime())
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, id, apiUrl]);

  // 轮询每 15 秒
  useEffect(() => {
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [token, id, apiUrl]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || !id) return;

    try {
      const res = await fetch(`${apiUrl}/channels/${id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        lastTimestamp.current = Math.max(
          lastTimestamp.current,
          new Date(msg.created_at).getTime()
        );
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const handleLogout = () => {
    setToken(null);
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/channels" className="text-slate-500 hover:text-slate-700">
                ← 返回
              </Link>
              <h1 className="text-xl font-bold text-slate-800">频道详情</h1>
              <nav className="flex gap-4 ml-4">
                <Link to="/channels" className="text-sm text-slate-600 hover:text-slate-900">
                  频道
                </Link>
                <Link to="/tasks" className="text-sm text-slate-600 hover:text-slate-900">
                  任务
                </Link>
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-4">
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.bot_id === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.bot_id === 'me' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-slate-200 text-slate-800'
              }`}>
                <div className="text-xs opacity-70 mb-1">{msg.bot_id}</div>
                <div>{msg.content}</div>
                <div className={`text-xs mt-1 ${
                  msg.bot_id === 'me' ? 'text-blue-200' : 'text-slate-400'
                }`}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="flex-shrink-0 border-t border-slate-200 bg-white">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="输入消息..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              发送
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}