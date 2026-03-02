import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi, type ApiError } from '../hooks/useApi';
import { SkeletonList } from '../components/ui/Skeleton';

interface Message {
  id: string;
  content: string;
  bot_id: string;
  created_at: string;
}

export default function ChannelDetail() {
  const { id } = useParams<{ id: string }>();
  const { token, setToken, request, handleError } = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<number>(Date.now());

  const fetchMessages = async (isPoll = false) => {
    if (!token || !id) return;

    try {
      const data = await request<{ messages: Message[] }>(
        `/channels/${id}/messages?since=${lastTimestamp.current}`
      );
      
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
        lastTimestamp.current = Math.max(
          lastTimestamp.current,
          ...data.messages.map((m: Message) => new Date(m.created_at).getTime())
        );
      }
      
      if (!isPoll) {
        setError(null);
      }
    } catch (err) {
      if (!isPoll) {
        const apiError = handleError(err);
        setError(apiError);
      }
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    if (!token || !id) return;

    const loadInitialMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await request<{ messages: Message[] }>(`/channels/${id}/messages`);
        setMessages(data.messages || []);
        
        if (data.messages?.length > 0) {
          lastTimestamp.current = Math.max(
            ...data.messages.map((m: Message) => new Date(m.created_at).getTime())
          );
        }
      } catch (err) {
        const apiError = handleError(err);
        setError(apiError);
      } finally {
        setLoading(false);
      }
    };

    loadInitialMessages();
  }, [token, id]);

  useEffect(() => {
    const interval = setInterval(() => fetchMessages(true), 15000);
    return () => clearInterval(interval);
  }, [token, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || !id) return;

    setSending(true);
    try {
      const msg = await request<Message>(`/channels/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage })
      });
      
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      lastTimestamp.current = Math.max(
        lastTimestamp.current,
        new Date(msg.created_at).getTime()
      );
    } catch (err) {
      const apiError = handleError(err);
      alert(getErrorMessage(apiError));
    } finally {
      setSending(false);
    }
  };

  const getErrorMessage = (apiError: ApiError): string => {
    switch (apiError.type) {
      case 'AUTH_REQUIRED':
        return '登录已过期';
      case 'NOT_FOUND':
        return '频道不存在';
      case 'SERVER_ERROR':
        return '发送失败，请稍后重试';
      case 'NETWORK_ERROR':
        return '网络连接失败';
      default:
        return apiError.message || '发送失败';
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
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Skeleton height="32px" width="150px" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-4">
          <SkeletonList count={5} height="60px" gap="12px" />
        </main>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link to="/channels" className="text-slate-500 hover:text-slate-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-slate-800">频道详情</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-slate-600 mb-4">{getErrorMessage(error)}</p>
            <Link
              to="/channels"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              返回频道列表 →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/channels" className="text-slate-500 hover:text-slate-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-slate-800">频道详情</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            退出
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">💬</div>
              <p>暂无消息，发送第一条消息吧！</p>
            </div>
          ) : (
            messages.map(msg => (
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
            ))
          )}
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
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {sending && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              发送
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}
