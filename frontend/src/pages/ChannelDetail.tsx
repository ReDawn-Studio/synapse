import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Skeleton, SkeletonList } from '../components/ui/Skeleton';
import { safeFetch, handleFetchError, createApiError } from '../utils/apiError';

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
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; retryable?: boolean } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<number>(Date.now());

  // 获取消息
  const fetchMessages = async (isPolling = false) => {
    if (!token || !id) return;

    try {
      const result = await safeFetch(
        `${apiUrl}/channels/${id}/messages?since=${lastTimestamp.current}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (result.error) {
        if (!isPolling) {
          setError({ message: result.error.message, retryable: result.error.retryable });
        }
        if (result.error.code === 'UNAUTHORIZED') {
          setToken(null);
        }
        return;
      }
      
      const data = result.data;
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
        lastTimestamp.current = Math.max(
          lastTimestamp.current,
          ...data.messages.map((m: Message) => new Date(m.created_at).getTime())
        );
      }
    } catch (e) {
      const apiError = handleFetchError(e);
      if (!isPolling) {
        setError({ message: apiError.message, retryable: apiError.retryable });
      }
      console.error('Failed to fetch messages:', e);
    }
  };

  // 初始加载
  useEffect(() => {
    if (!token || !id) return;

    const loadInitialMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await safeFetch(`${apiUrl}/channels/${id}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (result.error) {
          setError({ message: result.error.message, retryable: result.error.retryable });
          if (result.error.code === 'UNAUTHORIZED') {
            setToken(null);
          }
          return;
        }
        
        const data = result.data;
        setMessages(data.messages || []);
        if (data.messages?.length > 0) {
          lastTimestamp.current = Math.max(
            ...data.messages.map((m: Message) => new Date(m.created_at).getTime())
          );
        }
      } catch (err) {
        const apiError = handleFetchError(err);
        setError({ message: apiError.message, retryable: apiError.retryable });
      } finally {
        setLoading(false);
      }
    };

    loadInitialMessages();
  }, [token, id, apiUrl, setToken]);

  // 轮询每 15 秒
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(true), 15000);
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

    setSending(true);
    try {
      const result = await safeFetch(`${apiUrl}/channels/${id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (result.error) {
        setError({ message: result.error.message, retryable: result.error.retryable });
        if (result.error.code === 'UNAUTHORIZED') {
          setToken(null);
        }
        return;
      }

      const msg = result.data;
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      lastTimestamp.current = Math.max(
        lastTimestamp.current,
        new Date(msg.created_at).getTime()
      );
      setError(null);
    } catch (e) {
      const apiError = handleFetchError(e);
      setError({ message: apiError.message, retryable: apiError.retryable });
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger re-fetch by toggling the effect dependency
    setTimeout(() => {
      if (token && id) {
        fetchMessages(false);
      }
    }, 100);
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Skeleton width="200px" height="32px" />
          </div>
        </header>
        <main className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <SkeletonList count={5} />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">加载失败</h2>
          <p className="text-slate-600 mb-4">{error.message}</p>
          {error.retryable && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              重试
            </button>
          )}
          {!error.retryable && (
            <Link
              to="/channels"
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition"
            >
              返回频道列表
            </Link>
          )}
        </div>
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

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">暂无消息</h3>
              <p className="text-slate-500 mb-4">发送第一条消息开始对话吧！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.bot_id === 'bot-1' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.bot_id === 'bot-1'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.bot_id === 'bot-1' ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="输入消息..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  发送中...
                </>
              ) : (
                '发送'
              )}
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}
